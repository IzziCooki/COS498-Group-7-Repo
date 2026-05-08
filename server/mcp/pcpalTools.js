/**
 * PC Pal MCP Tool Server
 *
 * Exposes all PC Pal custom tools as an in-process MCP server
 * for use with the Claude Agent SDK. This makes the tools
 * provider-agnostic — any MCP-compatible agent can use them.
 */

const { tool, createSdkMcpServer } = require('@anthropic-ai/claude-agent-sdk');
const z = require('zod');

const { VALID_GUIDE_IDS, VOCAB_LEVELS, MEMORY_TYPES, RISK_LEVELS, FINDING_STATUSES } = require('../core/sharedConstants');
const FixLog = require('../models/FixLog');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const uiReferenceLibrary = require('../core/uiReferenceLibrary');

// Active user context — set by the orchestrator before each query()
// so tools can read user_id/session_id without the model passing them
let _activeUserId = null;
let _activeSessionId = null;
// Active autofix session id — set only when the orchestrator is in
// mode 'autofix-sandbox'. Threaded into every fix_log row so each row
// can be traced back to a specific Sandbox tab run.
let _activeAutofixSessionId = null;

function setActiveUserContext(userId, sessionId) {
  _activeUserId = userId;
  _activeSessionId = sessionId;
}

function setActiveAutofixSession(sessionId) {
  _activeAutofixSessionId = sessionId || null;
}

function getUserId() { return _activeUserId; }
function getSessionId() { return _activeSessionId; }
const systemDiagnostics = require('../core/systemDiagnostics');
const clientInfoStore = require('../core/clientInfoStore');
const youtubeSearch = require('../core/youtubeSearch');
const screenshotAnnotator = require('../core/screenshotAnnotator');
const UserMemory = require('../models/UserMemory');
const Anthropic = require('@anthropic-ai/sdk');
const { anthropicApiKey } = require('../config');
const skillProgression = require('../core/skillProgression');
const SkillEvent = require('../models/SkillEvent');
const SafetyEvent = require('../models/SafetyEvent');
const StepSequence = require('../models/StepSequence');
const UserNote = require('../models/UserNote');
const UserGoal = require('../models/UserGoal');
const User = require('../models/User');
const BuddyPair = require('../models/BuddyPair');
const ProgressShare = require('../models/ProgressShare');
const HelpRequest = require('../models/HelpRequest');
const SkillReview = require('../models/SkillReview');
const ScamCheckEvent = require('../models/ScamCheckEvent');
const conversationState = require('../core/conversationState');
const userProfileManager = require('../core/userProfileManager');
const supportResourceLookup = require('../core/supportResourceLookup');

function textResult(text) {
  return { content: [{ type: 'text', text: String(text) }] };
}

// Side-channel for structured data that Claude would otherwise consume
// The orchestrator reads and clears these after each query()
let _lastGuide = null;
let _lastFindings = null;
let _lastScreenshot = null;

// Reference to the requestScreenshot function from index.js (set at runtime)
let _requestScreenshotFn = null;

function setRequestScreenshotFn(fn) { _requestScreenshotFn = fn; }

function getAndClearLastScreenshot() {
  const s = _lastScreenshot;
  _lastScreenshot = null;
  return s;
}

function getAndClearLastGuide() {
  const g = _lastGuide;
  _lastGuide = null;
  return g;
}

function getAndClearLastFindings() {
  const f = _lastFindings;
  _lastFindings = null;
  return f;
}

/**
 * Check if diagnostics can actually see the user's machine.
 * Returns true in Electron mode (local) or if running on localhost.
 * Returns false on deployed web servers where diagnostics would show container data.
 */
function canRunLocalDiagnostics() {
  if (process.env.ELECTRON_MODE) return true;
  // If running on localhost (dev mode), server IS the user's machine
  const port = process.env.PORT || '3001';
  if (port === '3001') return true; // dev default
  return false; // deployed (HF Spaces, etc.) — diagnostics show container, not user
}

function noAccessMessage(toolName) {
  return `Cannot run ${toolName} — this would show server data, not the user's computer. ` +
    'Ask the user to click "Connect Computer" to connect their machine, or ask them to describe their setup.';
}

// System Diagnostic Tools

const getSystemInfo = tool(
  'get_system_info',
  "Get detailed info about the user's computer: OS version, CPU, RAM usage, disk space, uptime. Use to diagnose performance issues.",
  {},
  async () => {
    // In Electron/desktop mode, server diagnostics ARE the user's machine
    if (process.env.ELECTRON_MODE) {
      return textResult(systemDiagnostics.getSystemInfo());
    }

    // In web mode, use browser-collected system info if available
    const userId = getUserId();
    const browserInfo = userId ? clientInfoStore.get(userId) : null;
    if (browserInfo) {
      return textResult(clientInfoStore.formatBrowserSystemInfo(browserInfo));
    }

    // No relay agent and no browser info — cannot see the user's computer
    return textResult(
      'IMPORTANT: I cannot see this user\'s actual computer. No relay agent is connected and browser detection was not available. ' +
      'DO NOT guess or make up system specs. Tell the user you need them to connect their computer using the Connect Computer button, ' +
      'or ask them to describe their device manually.'
    );
  }
);

const checkNetwork = tool(
  'check_network',
  "Check internet connection, Wi-Fi status, DNS resolution, and network latency. Use when user reports internet or Wi-Fi problems.",
  {},
  async () => {
    if (!canRunLocalDiagnostics()) return textResult(noAccessMessage('network check'));
    return textResult(systemDiagnostics.checkNetwork());
  }
);

const listRunningApps = tool(
  'list_running_apps',
  "List running applications and their resource usage (CPU/memory). Use to find apps slowing down the computer.",
  {},
  async () => {
    if (!canRunLocalDiagnostics()) return textResult(noAccessMessage('app listing'));
    return textResult(systemDiagnostics.listRunningApps());
  }
);

const readErrorLog = tool(
  'read_error_log',
  "Read recent system error logs to diagnose crashes, freezes, or other problems.",
  { source: z.enum(['system', 'application', 'crash']).optional().describe('Which log: system, application, or crash') },
  async (args) => {
    if (!canRunLocalDiagnostics()) return textResult(noAccessMessage('error log'));
    return textResult(systemDiagnostics.readErrorLog(args.source));
  }
);

const runSafeCommand = tool(
  'run_safe_command',
  "Run a safe, read-only diagnostic command. Only allowlisted commands work. NEVER use for destructive operations.",
  {
    command: z.string().describe('The diagnostic command to run'),
    reason: z.string().describe('Why you are running this command'),
  },
  async (args) => {
    if (!canRunLocalDiagnostics()) return textResult(noAccessMessage('terminal command'));
    console.log(`[MCP] Safe command: "${args.command}" — ${args.reason}`);
    return textResult(systemDiagnostics.runSafeCommand(args.command));
  }
);

const checkDiskHealth = tool(
  'check_disk_health',
  "Check disk space usage, large folders, and temp files. Use when user says computer is full or running out of space.",
  {},
  async () => {
    if (!canRunLocalDiagnostics()) return textResult(noAccessMessage('disk check'));
    return textResult(systemDiagnostics.checkDiskHealth());
  }
);

const checkInstalledSoftware = tool(
  'check_installed_software',
  "List or search installed applications. Use to verify software is installed or find the right app.",
  { search_term: z.string().optional().describe('Search for a specific app by name') },
  async (args) => textResult(systemDiagnostics.checkInstalledSoftware(args.search_term))
);

const getBatteryStatus = tool(
  'get_battery_status',
  "Check battery level and charging state. Use when user asks about battery or computer keeps shutting off.",
  {},
  async () => {
    if (!canRunLocalDiagnostics()) return textResult(noAccessMessage('battery check'));
    return textResult(systemDiagnostics.getBatteryStatus());
  }
);

// Screenshot & Visual Pointing

const takeScreenshot = tool(
  'take_screenshot',
  "Capture and analyze the user's screen to find a button, icon, or menu item they can't locate. Returns an annotated screenshot with the target highlighted. Only works when a relay agent is connected. Use this when the user says things like 'I can't find it', 'where is that button', 'I don't see it'.",
  {
    looking_for: z.string().describe("What the user is trying to find, e.g. 'Settings icon', 'Share button', 'Wi-Fi toggle'"),
  },
  async (args) => {
    if (!_requestScreenshotFn) {
      return textResult('Screenshot tool not available — server not configured.');
    }

    const userId = getUserId();

    // Request screenshot from relay agent
    const ssResult = await _requestScreenshotFn(userId);
    if (!ssResult || ssResult.error || !ssResult.imageBase64) {
      return textResult(
        'Could not take a screenshot. Make sure your computer is connected via the Connect Computer button. ' +
        (ssResult?.message || '')
      );
    }

    // Use Claude vision to find what the user is looking for
    let targets = [];
    let description = '';
    try {
      if (anthropicApiKey) {
        const client = new Anthropic({ apiKey: anthropicApiKey });
        const visionResponse = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data: ssResult.imageBase64 } },
              { type: 'text', text: `The user is looking for: "${args.looking_for}". Look at this screenshot of their actual screen.\n\nReturn ONLY valid JSON (no markdown):\n{"found": true/false, "targets": [{"x": pixel_x, "y": pixel_y, "label": "short label for what's here"}], "description": "one sentence describing where it is in plain language using spatial terms like top-right, bottom-left, etc."}` }
            ]
          }]
        });
        const jsonText = visionResponse.content[0]?.text || '';
        const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        targets = parsed.targets || [];
        description = parsed.description || '';
      }
    } catch (err) {
      console.error('[MCP] Vision analysis failed:', err.message);
      description = `I took a screenshot but couldn't analyze it automatically. Here's your screen — look for ${args.looking_for}.`;
    }

    // Annotate the screenshot if we have targets
    let annotatedBase64 = ssResult.imageBase64;
    if (targets.length > 0) {
      try {
        annotatedBase64 = await screenshotAnnotator.annotateScreenshot(ssResult.imageBase64, targets);
      } catch (err) {
        console.error('[MCP] Screenshot annotation failed:', err.message);
      }
    }

    // Store the screenshot for the response
    _lastScreenshot = {
      imageBase64: annotatedBase64,
      description: description || `Screenshot of user's screen while looking for: ${args.looking_for}`,
      found: targets.length > 0,
    };

    console.log(`[MCP] Screenshot taken: ${targets.length} target(s) found for "${args.looking_for}"`);
    return textResult(
      targets.length > 0
        ? `SCREENSHOT TAKEN: Found "${args.looking_for}". ${description}. The annotated screenshot is shown to the user.`
        : `SCREENSHOT TAKEN: Could not find "${args.looking_for}" on screen. ${description}. The screenshot is shown to the user — describe where to look using the image.`
    );
  }
);

// Teaching & Skill Tools

const logSkillStarted = tool(
  'log_skill_started',
  'Log that the user started learning a new skill.',
  { skill_name: z.string().describe('Name of the skill') },
  async (args) => {
    SkillEvent.create({ user_id: getUserId(), skill_name: args.skill_name, status: 'started' });
    return textResult(`Logged skill started: ${args.skill_name}`);
  }
);

const suggestNextSkill = tool(
  'suggest_next_skill',
  "Recommend what to learn next based on completion history.",
  {},
  async () => {
    const suggestion = skillProgression.getNextSkill(getUserId());
    return textResult(suggestion.skillId
      ? `Suggested: ${suggestion.skillName} (${suggestion.skillId}). ${suggestion.reason}`
      : suggestion.reason);
  }
);

const scheduleSkillReview = tool(
  'schedule_skill_review',
  'Schedule a spaced repetition review for a completed skill.',
  {
    skill_name: z.string().describe('Skill to review later'),
    days_until_review: z.number().optional().describe('Days until review (default 7)'),
  },
  async (args) => {
    const days = args.days_until_review ?? 7;
    const dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    SkillReview.create({ user_id: getUserId(), skill_name: args.skill_name, review_due_at: dueDate });
    return textResult(`Review scheduled for "${args.skill_name}" in ${days} days`);
  }
);

// Step Sequence Tools

const startStepSequence = tool(
  'start_step_sequence',
  'Start a numbered step-by-step walkthrough for a multi-step task.',
  {
    task_name: z.string().describe('Short name for the task'),
    steps: z.array(z.string()).describe('Array of step descriptions'),
  },
  async (args) => {
    const seq = StepSequence.create({ conversation_id: getSessionId(), steps: args.steps, current_index: 0 });
    return textResult(JSON.stringify({ id: seq.id, taskName: args.task_name, steps: seq.steps, currentIndex: 0, completed: false }));
  }
);

const advanceStep = tool(
  'advance_step',
  'Move to the next step when user confirms they completed the current one.',
  {},
  async () => {
    const sequences = StepSequence.findByConversationId(getSessionId());
    const activeSeq = sequences.filter(s => !s.completed).pop();
    if (!activeSeq) return textResult('No active step sequence found');
    const updated = StepSequence.update(activeSeq.id, { current_index: activeSeq.current_index + 1 });
    return textResult(`Advanced to step ${updated.current_index + 1}`);
  }
);

const completeStepSequence = tool(
  'complete_step_sequence',
  'Mark the current step sequence as fully completed and log the skill.',
  {
    skill_name: z.string().describe('Name of the completed skill'),
  },
  async (args) => {
    const sequences = StepSequence.findByConversationId(getSessionId());
    const activeSeq = sequences.filter(s => !s.completed).pop();
    if (!activeSeq) return textResult('No active step sequence to complete');
    StepSequence.update(activeSeq.id, { completed: 1 });
    SkillEvent.create({ user_id: getUserId(), skill_name: args.skill_name, status: 'completed' });
    return textResult(`Step sequence completed: "${args.skill_name}"`);
  }
);

// Safety Tools

const flagEmergency = tool(
  'flag_emergency',
  'Flag a potential emergency. Use when user mentions falling, injury, chest pain, or medical concerns.',
  {
    reason: z.string().describe('Why this is flagged as an emergency'),
  },
  async (args) => {
    SafetyEvent.create({ user_id: getUserId(), event_type: 'emergency', trigger_text: args.reason });
    return textResult(`EMERGENCY FLAGGED: ${args.reason}. Advise user to call 911 if needed.`);
  }
);

const analyzeScamSituation = tool(
  'analyze_scam_situation',
  "Analyze whether a situation is a scam. NEVER say 'it\\'s safe'. Always recommend verification.",
  {
    situation_summary: z.string().describe('What the user described'),
    claimed_organization: z.string().optional().describe('Company/agency the caller claims to be from'),
    red_flags_found: z.array(z.string()).describe('Specific red flags detected'),
    risk_level: z.enum(RISK_LEVELS).describe('How likely this is a scam'),
    recommended_action: z.string().describe('What the user should do right now'),
    verification_contact: z.string().optional().describe('Official number/website to verify'),
  },
  async (args) => {
    ScamCheckEvent.create({
      user_id: getUserId(),
      conversation_id: getSessionId(),
      situation_summary: args.situation_summary,
      claimed_organization: args.claimed_organization || null,
      red_flags: args.red_flags_found,
      risk_level: args.risk_level,
      recommended_action: args.recommended_action,
      verification_contact: args.verification_contact || '',
    });
    const flagList = args.red_flags_found.map((f, i) => `${i + 1}. ${f}`).join('\n');
    return textResult(`SCAM ANALYSIS — Risk: ${args.risk_level.toUpperCase()}\nRed flags:\n${flagList}\nAction: ${args.recommended_action}`);
  }
);

// User & Notes Tools

const saveNoteForUser = tool(
  'save_note_for_user',
  'Save a helpful tip for the user to reference later.',
  {
    title: z.string().describe('Short title'),
    content: z.string().describe('The note content — 1-2 sentences'),
  },
  async (args) => {
    UserNote.create({ user_id: getUserId(), title: args.title, content: args.content });
    return textResult(`Note saved: "${args.title}"`);
  }
);

const getUserNotes = tool(
  'get_user_notes',
  "Retrieve the user's saved notes and tips.",
  {},
  async () => {
    const notes = UserNote.findByUserId(getUserId());
    if (notes.length === 0) return textResult('No saved notes yet.');
    const list = notes.map((n, i) => `${i + 1}. ${n.title}: ${n.content}`).join('\n');
    return textResult(`${notes.length} saved note(s):\n${list}`);
  }
);

const saveUserGoal = tool(
  'save_user_goal',
  "Save the user's learning goal when they share WHY they want to learn something.",
  {
    goal_text: z.string().describe("The user's goal in their own words"),
    related_skills: z.array(z.string()).optional().describe('Skill IDs this goal connects to'),
  },
  async (args) => {
    const uid = getUserId();
    UserGoal.create({
      user_id: uid,
      goal_text: args.goal_text,
      related_skills: args.related_skills ? JSON.stringify(args.related_skills) : '[]',
    });
    User.update(uid, { goal_summary: args.goal_text });
    return textResult(`Goal saved: "${args.goal_text}"`);
  }
);

const adjustVocabularyLevel = tool(
  'adjust_vocabulary_level',
  'Change the vocabulary simplification level if user seems confused or confident.',
  {
    new_level: z.enum(VOCAB_LEVELS).describe('New level'),
    reason: z.string().describe('Why adjusting'),
  },
  async (args) => {
    userProfileManager.updateProfile(getUserId(), { vocabulary_level: args.new_level });
    return textResult(`Vocabulary changed to ${args.new_level}: ${args.reason}`);
  }
);

// Buddy System Tools

const shareProgressWithBuddy = tool(
  'share_progress_with_buddy',
  "Share a skill completion with the user's learning buddy.",
  {
    skill_name: z.string().describe('Completed skill'),
    celebration_message: z.string().describe('Warm celebration message'),
  },
  async (args) => {
    const uid = getUserId();
    const pairs = BuddyPair.findByUserId(uid);
    if (pairs.length === 0) return textResult('User has no active buddy.');
    for (const pair of pairs) {
      ProgressShare.create({
        user_id: uid,
        buddy_pair_id: pair.id,
        skill_name: args.skill_name,
        message: args.celebration_message,
      });
    }
    return textResult(`Progress shared with buddy: "${args.celebration_message}"`);
  }
);

const askBuddyForHelp = tool(
  'ask_buddy_for_help',
  "Send a help request to the user's buddy when they're stuck.",
  {
    question: z.string().describe('What the user needs help with'),
    context_summary: z.string().optional().describe('What they were trying to do'),
  },
  async (args) => {
    const uid = getUserId();
    const pairs = BuddyPair.findByUserId(uid);
    if (pairs.length === 0) return textResult('User has no active buddy.');
    const pair = pairs[0];
    HelpRequest.create({
      learner_id: uid,
      buddy_pair_id: pair.id,
      question: args.question,
      context_summary: args.context_summary || null,
    });
    return textResult('Help request sent to buddy! They\'ll reply when they can.');
  }
);

// Visual Guide Tool

const showVisualGuide = tool(
  'show_visual_guide',
  `Display a visual step-by-step guide card. Valid IDs: ${VALID_GUIDE_IDS.join(', ')}`,
  { task_id: z.string().describe('ID of the task guide') },
  async (args) => {
    if (VALID_GUIDE_IDS.includes(args.task_id)) {
      return textResult(`VISUAL_GUIDE:${args.task_id}`);
    }
    return textResult(`Unknown guide. Valid: ${VALID_GUIDE_IDS.join(', ')}`);
  }
);

// YouTube Video Tool

const findYoutubeVideos = tool(
  'find_youtube_videos',
  "Search YouTube for helpful tutorial videos related to the user's question. Use when the user asks to see a video, wants a visual demonstration, or would benefit from watching someone do the task. Returns video titles, URLs, thumbnails, and embed info. The results will be displayed as playable videos in the chat.",
  {
    query: z.string().describe("Search query — describe the task simply, e.g. 'how to copy and paste on Mac'"),
    max_results: z.number().optional().describe('Number of videos to return (default 3, max 5)'),
  },
  async (args) => {
    const max = Math.min(args.max_results || 3, 5);
    console.log(`[MCP] YouTube search: "${args.query}" (max: ${max})`);
    const videos = await youtubeSearch.searchVideos(args.query, max);
    // Return as YOUTUBE_VIDEOS: JSON marker so the UI can parse and render them
    return textResult('YOUTUBE_VIDEOS:' + JSON.stringify(videos));
  }
);

// Memory Tools

const saveMemory = tool(
  'save_memory',
  "Save an observation about the user for future sessions. Use this to remember their preferences, things they struggle with, breakthroughs they've had, personal context they share, or patterns you notice. These memories persist across sessions and help you personalize future interactions. Be specific and concise.",
  {
    type: z.enum(MEMORY_TYPES).describe(
      'preference: how they like to learn. struggle: what confuses them. breakthrough: skills mastered. context: personal details they share. pattern: behavioral patterns you notice.'
    ),
    content: z.string().describe('The observation — one specific sentence, e.g. "Gets confused by right-click vs left-click" or "Grandson Tom lives in Portland"'),
    relevance: z.number().optional().describe('1-10 how important this is for future interactions (default 5)'),
  },
  async (args) => {
    const memory = UserMemory.create({
      user_id: getUserId(),
      type: args.type,
      content: args.content,
      source: 'agent_observation',
      relevance: args.relevance ?? 5,
    });
    return textResult(`Memory saved: [${args.type}] ${args.content}`);
  }
);

const recallMemories = tool(
  'recall_memories',
  "Retrieve what you know about the user from past sessions. Use this at the start of a conversation or when context from previous interactions would help. Returns preferences, struggles, breakthroughs, personal context, and patterns.",
  {},
  async () => {
    const summary = UserMemory.buildMemorySummary(getUserId());
    if (!summary) return textResult('No memories saved for this user yet.');
    return textResult(summary);
  }
);

// Practice Mode Tool

let _lastPractice = null;

function getAndClearLastPractice() {
  const p = _lastPractice;
  _lastPractice = null;
  return p;
}

const BUILTIN_PRACTICE_TASKS = ['send_email', 'copy_paste', 'open_browser', 'wifi', 'video_call', 'take_screenshot', 'print_document', 'change_text_size'];

const startPractice = tool(
  'start_practice',
  "Start a practice session for a task. Built-in tasks: send_email, copy_paste, open_browser, wifi, video_call, take_screenshot, print_document, change_text_size. For ANY other task, set task_id to 'custom' and provide custom_steps. Use when the user says 'practice', 'let me try first', 'I'm scared', or seems nervous. PROACTIVELY offer practice to comfort level 1-2 users before new tasks.",
  {
    task_id: z.string().describe("Built-in task ID (send_email, copy_paste, open_browser, wifi, video_call, take_screenshot, print_document, change_text_size) or 'custom' for agent-generated practice"),
    custom_title: z.string().optional().describe("Title for custom practice (required when task_id is 'custom')"),
    custom_steps: z.array(z.object({
      instruction: z.string().describe('What this step does'),
      whereToLook: z.string().describe('Where on screen to look'),
      whatItLooksLike: z.string().describe('Visual description of the target'),
      deviceInstructions: z.string().describe('Device-specific instructions'),
      afterThis: z.string().describe('What the screen looks like after this step'),
      confusedAlt: z.string().optional().describe('Alternative explanation using an analogy'),
    })).optional().describe("Steps for custom practice (required when task_id is 'custom')"),
  },
  async (args) => {
    let practice;
    if (args.task_id === 'custom' && args.custom_steps) {
      practice = {
        taskId: 'custom',
        customTitle: args.custom_title || 'Practice Session',
        customSteps: args.custom_steps,
      };
      console.log(`[MCP] Custom practice started: "${args.custom_title}" (${args.custom_steps.length} steps)`);
    } else {
      practice = { taskId: args.task_id };
      console.log(`[MCP] Practice started: ${args.task_id}`);
    }
    _lastPractice = practice;
    return textResult(`Practice session started. The user will see a step-by-step practice guide in the side panel. Be extra reassuring — nothing will happen to their computer!`);
  }
);

// Diagnostic Findings Artifact Tool

const createFindings = tool(
  'create_findings',
  "Create a diagnostic findings artifact — a collapsible dropdown showing what you discovered about the user's computer. Use this after running diagnostic tools to show the user HOW you reached your conclusions. Each finding has a label (what was checked), a value (what was found), and a status (good/warning/bad). The findings appear as a collapsible card separate from your text response.",
  {
    title: z.string().describe('Title, e.g. "System Check Results"'),
    findings: z.array(z.object({
      label: z.string().describe('What was checked, e.g. "Memory"'),
      value: z.string().describe('What was found, e.g. "17.6 GB of 18 GB used (98%)"'),
      status: z.enum(FINDING_STATUSES).describe('Assessment: good, warning, or bad'),
    })).describe('List of diagnostic findings'),
  },
  async (args) => {
    const findings = { title: args.title, findings: args.findings };
    _lastFindings = findings;
    console.log(`[MCP] Findings created: "${args.title}" (${args.findings.length} items)`);
    return textResult(`Findings card "${args.title}" created. Reference the key findings in your response but don't repeat the full details — the user can expand the card to see everything.`);
  }
);

// Missing DLL Diagnosis Tool

const { lookupDll, formatDllDiagnosis } = require('../core/dllLookup');

const diagnoseMissingDll = tool(
  'diagnose_missing_dll',
  "Diagnose a missing DLL error on Windows. Takes the DLL filename from the error message and returns the exact official fix — which Microsoft installer to download, step-by-step instructions, and safety warnings. NEVER suggest downloading DLL files from third-party sites.",
  {
    dll_name: z.string().describe("The DLL filename from the error message, e.g. 'MSVCP140.dll', 'VCRUNTIME140.dll', 'api-ms-win-crt-runtime-l1-1-0.dll'"),
    error_text: z.string().optional().describe("The full error message text if available"),
    program_name: z.string().optional().describe("The program that showed the error"),
  },
  async (args) => {
    const result = lookupDll(args.dll_name);
    const diagnosis = formatDllDiagnosis(args.dll_name, result, args.program_name);
    if (result.found) {
      console.log(`[MCP] DLL diagnosis: ${args.dll_name} → ${result.family.name} (${result.familyId})`);
    }
    return textResult(diagnosis);
  }
);

// Guide Artifact Tool

const createGuide = tool(
  'create_guide',
  "Create an interactive guide artifact that appears in the chat as a collapsible card with numbered steps, copy-paste terminal commands, and 'Run' buttons. Use this whenever you would give the user terminal commands — put them in a guide instead of inline text. Each step can have a description, an optional terminal command, and an optional note. The guide is rendered as a structured UI element, not text.",
  {
    title: z.string().describe('Short title for the guide, e.g. "Set Up Ollama on Mac"'),
    description: z.string().optional().describe('One-sentence summary of what this guide accomplishes'),
    source: z.string().optional().describe('Attribution for the guide content when based on official documentation, e.g. "Based on Apple Support" or "From Microsoft Support"'),
    steps: z.array(z.object({
      text: z.string().describe('What this step does in plain English'),
      command: z.string().optional().describe('Terminal command to run (shown in a code block with Copy and Run buttons)'),
      note: z.string().optional().describe('Optional tip or warning for this step'),
      image_id: z.string().optional().describe(
        'UI reference image ID — REQUIRED whenever this step mentions a button, icon, or UI element that appears in the AVAILABLE UI REFERENCES section of the system prompt. Elderly users cannot visualize UI elements from text alone; pictures are the single most impactful way to help them. Use the EXACT id string from the system prompt (e.g. "chrome-icon", "yahoo-compose-button"). Unknown IDs are silently dropped.'
      ),
    })).describe('Ordered list of steps'),
  },
  async (args) => {
    // Diagnostic: log the image_id the agent sent for each step BEFORE expansion.
    // If this log shows no image_id values, the agent isn't calling the feature;
    // if it shows image_ids but the expansion below drops them, the registry
    // doesn't contain those IDs. Either way, this tells us where the problem is.
    const imageIdsSeen = args.steps.map((s, i) => `step${i + 1}=${s.image_id || 'NONE'}`).join(', ');
    console.log(`[MCP] create_guide called: "${args.title}" — image_ids: [${imageIdsSeen}]`);

    // Expand any image_id references into full {id, url, alt} objects.
    // Unknown IDs are dropped with a warning; the step still renders text.
    const expandedSteps = args.steps.map(step => {
      const out = {
        text: step.text,
        command: step.command,
        note: step.note,
      };
      if (step.image_id) {
        const img = uiReferenceLibrary.getById(step.image_id);
        if (img) {
          out.image = img;
          // Transform hotspots array → single hotspot object for client GuideStep
          if (img.hotspots && img.hotspots.length > 0) {
            out.hotspot = {
              xPercent: img.hotspots[0].x,
              yPercent: img.hotspots[0].y,
            };
          }
          console.log(`[MCP]   ✓ Resolved "${step.image_id}" → ${img.url}${out.hotspot ? ' (with hotspot)' : ''}`);
        } else {
          console.warn(`[MCP]   ✗ Unknown image_id "${step.image_id}" — dropped from guide step.`);
        }
      }
      return out;
    });
    const guide = {
      title: args.title,
      description: args.description || null,
      source: args.source || null,
      steps: expandedSteps,
    };
    _lastGuide = guide;
    const imageCount = expandedSteps.filter(s => s.image).length;
    console.log(`[MCP] Guide finalized: "${args.title}" (${args.steps.length} steps, ${imageCount} with images)`);
    return textResult(`Guide "${args.title}" has been created and will appear as an interactive card in the chat. Do NOT repeat the commands in your text — the user can see them in the guide card.`);
  }
);

// ── Support resource lookup ────────────────────────────────

const lookupSupportResources = tool(
  'lookup_support_resources',
  'Look up verified official support links for a topic. Returns curated resources from Apple Support, Microsoft Support, Google Support, Zoom Support, wikiHow, and other trusted sources. ALWAYS call this instead of generating URLs from memory — it prevents broken links.',
  {
    topic: z.string().describe('The topic to find resources for, e.g. "copy and paste", "connect to wifi", "send email"'),
    os_type: z.string().optional().describe("User's OS if known: Windows, macOS, iPhone, Android"),
    service: z.string().optional().describe('Specific service if known: gmail, outlook, yahoo, zoom, facetime'),
  },
  async (args) => {
    const results = supportResourceLookup.lookupResources(
      args.topic,
      args.os_type || null,
      args.service || null,
    );
    if (results.length === 0) {
      return textResult(
        'NO_CURATED_RESOURCES: No verified resources found for this topic. ' +
        'Do NOT generate URLs from memory — instead, suggest the user search ' +
        'on the official support site for their device (support.apple.com, ' +
        'support.microsoft.com, support.google.com) or on wikiHow.com.'
      );
    }
    const formatted = results.map((r, i) =>
      `${i + 1}. [${r.source}] ${r.title}\n   URL: ${r.url}\n   ${r.description} (${r.time})`
    ).join('\n');
    return textResult(`VERIFIED_RESOURCES:\n${formatted}`);
  }
);

// ─── Auto-Fix Sandbox Tools (mode 'autofix-sandbox' only) ────────────
//
// Every fix_* tool below wraps a HARDCODED command string (or a hardcoded
// JS-native action). The agent only chooses *which* tool to call —
// command content is never built from agent input. The single exception
// is fix_kill_process_by_name's `name` argument, which is validated
// against KILLABLE_PROCESS_ALLOWLIST before being interpolated.
//
// These tools are registered ONLY when createPcPalMcpServer is called
// with { mode: 'autofix-sandbox' }. Normal-mode chat literally cannot
// invoke them — they're not in the tool list.

function runFixStep(toolName, command) {
  const result = systemDiagnostics.runFixCommand(command);
  try {
    FixLog.create({
      session_id: _activeAutofixSessionId,
      user_id: _activeUserId,
      tool_name: toolName,
      command,
      exit_code: result.exitCode,
      stdout_tail: result.stdout,
      stderr_tail: result.stderr,
    });
  } catch (err) {
    console.error('[MCP] fix_log write failed:', err.message);
  }
  return result;
}

function fixSummary(toolName, results) {
  const allOk = results.every(r => r.ok);
  const lines = results.map((r, i) =>
    r.ok
      ? `[step ${i + 1}] OK — ${r.stdout || '(no output)'}`
      : `[step ${i + 1}] FAILED (exit ${r.exitCode}) — ${r.stderr || '(no error message)'}`
  );
  return (allOk ? 'OK\n' : 'PARTIAL FAILURE\n') + lines.join('\n');
}

function adminRequiredResult(toolName) {
  try {
    FixLog.create({
      session_id: _activeAutofixSessionId,
      user_id: _activeUserId,
      tool_name: toolName,
      command: '(skipped: admin required)',
      exit_code: -2,
      stdout_tail: '',
      stderr_tail: 'PC Pal is not running with admin/root privileges.',
    });
  } catch (_) { /* non-critical */ }
  return textResult(
    'NEEDS_ADMIN: This fix requires admin/root privileges and PC Pal is not running elevated. ' +
    'Skipping this step. Tell the user to relaunch PC Pal as administrator (Windows) or with sudo (macOS/Linux) to enable system-integrity fixes.'
  );
}

// ─── Tier 1: Network / WiFi / DNS ────────────────────────────────

const fixFlushDnsCache = tool(
  'fix_flush_dns_cache',
  'AUTO-FIX: Flush the operating system DNS cache. Use when DNS resolution is failing or websites are not loading despite a working internet connection. Safe and instant.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    const results = [];
    if (platform === 'windows') {
      results.push(runFixStep('fix_flush_dns_cache', 'ipconfig /flushdns'));
    } else if (platform === 'mac') {
      results.push(runFixStep('fix_flush_dns_cache', 'dscacheutil -flushcache'));
      results.push(runFixStep('fix_flush_dns_cache', 'killall -HUP mDNSResponder'));
    } else {
      results.push(runFixStep('fix_flush_dns_cache', 'resolvectl flush-caches'));
    }
    return textResult(fixSummary('fix_flush_dns_cache', results));
  }
);

const fixRenewDhcpLease = tool(
  'fix_renew_dhcp_lease',
  'AUTO-FIX: Release and renew the DHCP lease so the computer asks the router for a fresh IP address. Use when the network shows "limited connectivity" or the user just connected to a new Wi-Fi.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    const results = [];
    if (platform === 'windows') {
      results.push(runFixStep('fix_renew_dhcp_lease', 'ipconfig /release'));
      results.push(runFixStep('fix_renew_dhcp_lease', 'ipconfig /renew'));
    } else if (platform === 'mac') {
      results.push(runFixStep('fix_renew_dhcp_lease', 'ipconfig set en0 DHCP'));
    } else {
      results.push(runFixStep('fix_renew_dhcp_lease', 'dhclient -r'));
      results.push(runFixStep('fix_renew_dhcp_lease', 'dhclient'));
    }
    return textResult(fixSummary('fix_renew_dhcp_lease', results));
  }
);

const fixResetWinsock = tool(
  'fix_reset_winsock',
  'AUTO-FIX: Windows-only. Reset the Winsock catalog and TCP/IP stack — fixes corrupted network configuration after malware, VPN apps, or aborted Windows updates. A reboot is recommended after.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    if (platform !== 'windows') {
      return textResult('NOT_APPLICABLE: fix_reset_winsock is Windows-only.');
    }
    if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_reset_winsock');
    const results = [];
    results.push(runFixStep('fix_reset_winsock', 'netsh winsock reset'));
    results.push(runFixStep('fix_reset_winsock', 'netsh int ip reset'));
    return textResult(fixSummary('fix_reset_winsock', results) +
      '\nNOTE: A computer restart is recommended for the reset to take effect.');
  }
);

const fixRestartNetworkAdapter = tool(
  'fix_restart_network_adapter',
  'AUTO-FIX: Disable then re-enable the primary Wi-Fi network adapter. Often resolves stuck connections without rebooting. The internet briefly drops during the toggle.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    const results = [];
    if (platform === 'windows') {
      if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_restart_network_adapter');
      results.push(runFixStep('fix_restart_network_adapter', 'netsh interface set interface "Wi-Fi" admin=disable'));
      results.push(runFixStep('fix_restart_network_adapter', 'netsh interface set interface "Wi-Fi" admin=enable'));
    } else if (platform === 'mac') {
      if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_restart_network_adapter');
      results.push(runFixStep('fix_restart_network_adapter', 'ifconfig en0 down'));
      results.push(runFixStep('fix_restart_network_adapter', 'ifconfig en0 up'));
    } else {
      if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_restart_network_adapter');
      results.push(runFixStep('fix_restart_network_adapter', 'ip link set wlan0 down'));
      results.push(runFixStep('fix_restart_network_adapter', 'ip link set wlan0 up'));
    }
    return textResult(fixSummary('fix_restart_network_adapter', results));
  }
);

// ─── Tier 2: Slow PC / frozen apps ───────────────────────────────

const fixKillProcessByName = tool(
  'fix_kill_process_by_name',
  'AUTO-FIX: Force-quit a frozen or runaway application by name. The name must be one of the known-safe app names (browsers, common productivity apps). System processes are NOT killable by this tool.',
  {
    name: z.string().describe(
      'Process / app name. Must match an entry in the per-OS allowlist (e.g. "chrome", "firefox", "Spotify"). System processes are rejected.'
    ),
  },
  async (args) => {
    const name = (args.name || '').trim();
    if (!systemDiagnostics.isKillableProcessName(name)) {
      return textResult(
        `REJECTED: "${name}" is not in the killable-process allowlist. ` +
        `Only common end-user apps may be killed by this tool to protect system processes.`
      );
    }
    const platform = systemDiagnostics.getPlatform();
    const results = [];
    if (platform === 'windows') {
      // taskkill /IM expects an image name with .exe extension
      const imageName = name.toLowerCase().endsWith('.exe') ? name : `${name}.exe`;
      results.push(runFixStep('fix_kill_process_by_name', `taskkill /F /IM ${imageName}`));
    } else if (platform === 'mac') {
      // pkill matches against full process name; use exact-match flag
      results.push(runFixStep('fix_kill_process_by_name', `pkill -9 -x "${name}"`));
    } else {
      results.push(runFixStep('fix_kill_process_by_name', `pkill -9 -x "${name}"`));
    }
    return textResult(fixSummary('fix_kill_process_by_name', results));
  }
);

const fixRestartExplorer = tool(
  'fix_restart_explorer',
  'AUTO-FIX: Windows/macOS only. Restart the desktop shell (Explorer on Windows, Finder on macOS) to recover from a frozen taskbar / dock / desktop icons. Open File Explorer windows close.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    const results = [];
    if (platform === 'windows') {
      results.push(runFixStep('fix_restart_explorer', 'taskkill /F /IM explorer.exe'));
      // Restart explorer — start without /B so it detaches.
      results.push(runFixStep('fix_restart_explorer', 'start explorer.exe'));
    } else if (platform === 'mac') {
      results.push(runFixStep('fix_restart_explorer', 'killall Finder'));
    } else {
      return textResult('NOT_APPLICABLE: fix_restart_explorer is Windows / macOS only.');
    }
    return textResult(fixSummary('fix_restart_explorer', results));
  }
);

// ─── Tier 3: Disk cleanup (use Node fs to avoid shell expansion) ───

async function clearDirContents(dir) {
  let removed = 0;
  let kept = 0;
  let bytes = 0;
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return { removed: 0, kept: 0, bytes: 0, missing: true };
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    try {
      const stat = await fsp.stat(full);
      bytes += stat.size || 0;
      await fsp.rm(full, { recursive: true, force: true });
      removed += 1;
    } catch (_) {
      kept += 1;
    }
  }
  return { removed, kept, bytes };
}

const fixClearTempFiles = tool(
  'fix_clear_temp_files',
  "AUTO-FIX: Clear the user's temp directory (Windows %TEMP%, /tmp, ~/.cache/thumbnails as appropriate). Reclaims disk space. Active files in use are skipped automatically.",
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    const home = os.homedir();
    const targets = [];
    if (platform === 'windows') {
      const tempEnv = process.env.TEMP || process.env.TMP;
      if (tempEnv) targets.push(tempEnv);
    } else if (platform === 'mac') {
      targets.push(path.join(home, 'Library/Caches'));
    } else {
      targets.push(path.join(home, '.cache/thumbnails'));
    }
    const summaries = [];
    let totalRemoved = 0, totalBytes = 0;
    for (const dir of targets) {
      try {
        const out = await clearDirContents(dir);
        totalRemoved += out.removed;
        totalBytes += out.bytes;
        summaries.push(out.missing
          ? `${dir}: not present`
          : `${dir}: removed ${out.removed} entries (${(out.bytes / (1024 * 1024)).toFixed(1)} MB), kept ${out.kept} in-use`);
      } catch (err) {
        summaries.push(`${dir}: error — ${err.message}`);
      }
    }
    try {
      FixLog.create({
        session_id: _activeAutofixSessionId,
        user_id: _activeUserId,
        tool_name: 'fix_clear_temp_files',
        command: `[fs.rm] ${targets.join(', ')}`,
        exit_code: 0,
        stdout_tail: summaries.join('\n'),
        stderr_tail: '',
      });
    } catch (_) { /* non-critical */ }
    return textResult(
      `OK\nReclaimed ${(totalBytes / (1024 * 1024)).toFixed(1)} MB across ${totalRemoved} items.\n` +
      summaries.join('\n')
    );
  }
);

const fixEmptyRecycleBin = tool(
  'fix_empty_recycle_bin',
  'AUTO-FIX: Empty the Recycle Bin / Trash to permanently delete already-deleted files and reclaim disk space.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    const results = [];
    if (platform === 'windows') {
      results.push(runFixStep('fix_empty_recycle_bin', 'powershell -NoProfile -Command Clear-RecycleBin -Force'));
    } else if (platform === 'mac') {
      results.push(runFixStep('fix_empty_recycle_bin',
        'osascript -e \'tell application "Finder" to empty trash\''));
    } else {
      const trash = path.join(os.homedir(), '.local/share/Trash/files');
      try {
        const out = await clearDirContents(trash);
        try {
          FixLog.create({
            session_id: _activeAutofixSessionId,
            user_id: _activeUserId,
            tool_name: 'fix_empty_recycle_bin',
            command: `[fs.rm] ${trash}`,
            exit_code: 0,
            stdout_tail: `removed ${out.removed} items (${(out.bytes / (1024 * 1024)).toFixed(1)} MB)`,
            stderr_tail: '',
          });
        } catch (_) { /* non-critical */ }
        return textResult(`OK\nEmptied ${trash}: ${out.removed} entries removed.`);
      } catch (err) {
        return textResult(`FAILED: ${err.message}`);
      }
    }
    return textResult(fixSummary('fix_empty_recycle_bin', results));
  }
);

// ─── Tier 4: System integrity ────────────────────────────────────

const fixRunSfcScannow = tool(
  'fix_run_sfc_scannow',
  'AUTO-FIX: Windows-only. Run System File Checker (sfc /scannow) to verify and repair Windows system files. SLOW — typically takes 5 to 15 minutes. Requires admin.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    if (platform !== 'windows') {
      return textResult('NOT_APPLICABLE: fix_run_sfc_scannow is Windows-only.');
    }
    if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_run_sfc_scannow');
    // Override the default timeout for this slow tool — give it 15 min.
    const r = systemDiagnostics.runFixCommand('sfc /scannow', { timeout: 15 * 60 * 1000 });
    try {
      FixLog.create({
        session_id: _activeAutofixSessionId,
        user_id: _activeUserId,
        tool_name: 'fix_run_sfc_scannow',
        command: 'sfc /scannow',
        exit_code: r.exitCode,
        stdout_tail: r.stdout,
        stderr_tail: r.stderr,
      });
    } catch (_) { /* non-critical */ }
    return textResult(r.ok
      ? `OK\n${r.stdout || '(scan completed)'}`
      : `FAILED (exit ${r.exitCode})\n${r.stderr}`);
  }
);

const fixRunDism = tool(
  'fix_run_dism_restore_health',
  'AUTO-FIX: Windows-only. Run DISM /Online /Cleanup-Image /RestoreHealth to repair the underlying Windows component store. SLOW — typically 5 to 20 minutes. Run before sfc when both are needed. Requires admin.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    if (platform !== 'windows') {
      return textResult('NOT_APPLICABLE: fix_run_dism_restore_health is Windows-only.');
    }
    if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_run_dism_restore_health');
    const r = systemDiagnostics.runFixCommand('DISM /Online /Cleanup-Image /RestoreHealth', { timeout: 20 * 60 * 1000 });
    try {
      FixLog.create({
        session_id: _activeAutofixSessionId,
        user_id: _activeUserId,
        tool_name: 'fix_run_dism_restore_health',
        command: 'DISM /Online /Cleanup-Image /RestoreHealth',
        exit_code: r.exitCode,
        stdout_tail: r.stdout,
        stderr_tail: r.stderr,
      });
    } catch (_) { /* non-critical */ }
    return textResult(r.ok ? `OK\n${r.stdout}` : `FAILED (exit ${r.exitCode})\n${r.stderr}`);
  }
);

const fixRestartPrintSpooler = tool(
  'fix_restart_print_spooler',
  'AUTO-FIX: Restart the print spooler / CUPS service. Use when print jobs are stuck or the printer is not responding.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    const results = [];
    if (platform === 'windows') {
      if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_restart_print_spooler');
      results.push(runFixStep('fix_restart_print_spooler', 'net stop spooler'));
      results.push(runFixStep('fix_restart_print_spooler', 'net start spooler'));
    } else if (platform === 'mac') {
      if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_restart_print_spooler');
      results.push(runFixStep('fix_restart_print_spooler', 'launchctl stop org.cups.cupsd'));
      results.push(runFixStep('fix_restart_print_spooler', 'launchctl start org.cups.cupsd'));
    } else {
      if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_restart_print_spooler');
      results.push(runFixStep('fix_restart_print_spooler', 'systemctl restart cups'));
    }
    return textResult(fixSummary('fix_restart_print_spooler', results));
  }
);

const fixRestartAudioService = tool(
  'fix_restart_audio_service',
  'AUTO-FIX: Restart the system audio service. Use when the user has no sound, audio devices are missing, or volume controls are unresponsive.',
  {},
  async () => {
    const platform = systemDiagnostics.getPlatform();
    const results = [];
    if (platform === 'windows') {
      if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_restart_audio_service');
      results.push(runFixStep('fix_restart_audio_service', 'net stop audiosrv'));
      results.push(runFixStep('fix_restart_audio_service', 'net start audiosrv'));
    } else if (platform === 'mac') {
      if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_restart_audio_service');
      results.push(runFixStep('fix_restart_audio_service', 'killall coreaudiod'));
    } else {
      results.push(runFixStep('fix_restart_audio_service', 'pulseaudio -k'));
      results.push(runFixStep('fix_restart_audio_service', 'pulseaudio --start'));
    }
    return textResult(fixSummary('fix_restart_audio_service', results));
  }
);

// ─── Tier 5: Debian package management (Linux only) ──────────────
//
// These wrap hardcoded `apt-get` invocations. The agent picks WHICH
// tool to call; command content is fully hardcoded except for the
// validated package name in fix_install_safe_package, which is
// rejected if it isn't on INSTALLABLE_PACKAGE_ALLOWLIST.

const { INSTALLABLE_PACKAGE_ALLOWLIST } = require('../core/sharedConstants');

function notLinuxResult(toolName) {
  return textResult(`NOT_APPLICABLE: ${toolName} only runs on Linux.`);
}

const fixAptUpdate = tool(
  'fix_apt_update',
  'AUTO-FIX (Debian/Ubuntu): Refresh the apt package lists. Always call this BEFORE fix_apt_safe_upgrade or fix_install_safe_package, otherwise the package metadata may be stale. Quick (~10s). Requires admin.',
  {},
  async () => {
    if (systemDiagnostics.getPlatform() !== 'linux') return notLinuxResult('fix_apt_update');
    if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_apt_update');
    const r = runFixStep('fix_apt_update', 'apt-get update -y');
    return textResult(r.ok ? `OK\n${r.stdout || '(lists refreshed)'}` : `FAILED (exit ${r.exitCode})\n${r.stderr}`);
  }
);

const fixAptSafeUpgrade = tool(
  'fix_apt_safe_upgrade',
  'AUTO-FIX (Debian/Ubuntu): Upgrade already-installed packages to their latest versions WITHOUT pulling in new recommended dependencies. Slow (1-10 min). Requires admin. Always call fix_apt_update first.',
  {},
  async () => {
    if (systemDiagnostics.getPlatform() !== 'linux') return notLinuxResult('fix_apt_safe_upgrade');
    if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_apt_safe_upgrade');
    const r = systemDiagnostics.runFixCommand(
      'apt-get upgrade -y --no-install-recommends',
      { timeout: 15 * 60 * 1000 }
    );
    try {
      FixLog.create({
        session_id: _activeAutofixSessionId,
        user_id: _activeUserId,
        tool_name: 'fix_apt_safe_upgrade',
        command: 'apt-get upgrade -y --no-install-recommends',
        exit_code: r.exitCode,
        stdout_tail: r.stdout,
        stderr_tail: r.stderr,
      });
    } catch (_) { /* non-critical */ }
    return textResult(r.ok ? `OK\n${r.stdout || '(no upgrades available)'}` : `FAILED (exit ${r.exitCode})\n${r.stderr}`);
  }
);

const fixClearAptCache = tool(
  'fix_clear_apt_cache',
  'AUTO-FIX (Debian/Ubuntu): Free disk space by removing the cached `.deb` files apt downloaded for past installs. Safe — installed packages are untouched. Requires admin.',
  {},
  async () => {
    if (systemDiagnostics.getPlatform() !== 'linux') return notLinuxResult('fix_clear_apt_cache');
    if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_clear_apt_cache');
    const r = runFixStep('fix_clear_apt_cache', 'apt-get clean');
    return textResult(r.ok ? `OK\nApt cache cleared.` : `FAILED (exit ${r.exitCode})\n${r.stderr}`);
  }
);

const fixAptAutoremove = tool(
  'fix_apt_autoremove',
  'AUTO-FIX (Debian/Ubuntu): Remove orphaned dependency packages no other installed package needs. Frees disk space. Safe in normal circumstances. Requires admin.',
  {},
  async () => {
    if (systemDiagnostics.getPlatform() !== 'linux') return notLinuxResult('fix_apt_autoremove');
    if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_apt_autoremove');
    const r = runFixStep('fix_apt_autoremove', 'apt-get autoremove -y');
    return textResult(r.ok ? `OK\n${r.stdout || '(nothing to remove)'}` : `FAILED (exit ${r.exitCode})\n${r.stderr}`);
  }
);

const fixInstallSafePackage = tool(
  'fix_install_safe_package',
  'AUTO-FIX (Debian/Ubuntu): Install ONE package from the curated Debian allowlist (firefox-esr, chromium, thunderbird, libreoffice, vlc, gimp, inkscape, audacity, evince, gnome-calculator, gedit, transmission-gtk, rhythmbox, gthumb). Anything else is rejected. Requires admin.',
  {
    package: z.string().describe(
      'Package name. Must be on INSTALLABLE_PACKAGE_ALLOWLIST exactly. ' +
      'Suggested choices: firefox-esr (browser), thunderbird (email), libreoffice (office), vlc (media), gimp (image edit), gnome-calculator, gedit, evince (PDF).'
    ),
  },
  async (args) => {
    if (systemDiagnostics.getPlatform() !== 'linux') return notLinuxResult('fix_install_safe_package');
    const requested = (args.package || '').trim().toLowerCase();
    if (!INSTALLABLE_PACKAGE_ALLOWLIST.includes(requested)) {
      try {
        FixLog.create({
          session_id: _activeAutofixSessionId,
          user_id: _activeUserId,
          tool_name: 'fix_install_safe_package',
          command: `(rejected: ${args.package})`,
          exit_code: -3,
          stdout_tail: '',
          stderr_tail: 'Package not on INSTALLABLE_PACKAGE_ALLOWLIST.',
        });
      } catch (_) { /* non-critical */ }
      return textResult(
        `REJECTED: "${args.package}" is not on the installable allowlist. ` +
        `Choose from: ${INSTALLABLE_PACKAGE_ALLOWLIST.join(', ')}.`
      );
    }
    if (!systemDiagnostics.isElevated()) return adminRequiredResult('fix_install_safe_package');
    // The package name is now safe to interpolate — it's been validated
    // against a hardcoded allowlist of [a-z0-9.+-] strings.
    const r = systemDiagnostics.runFixCommand(
      `apt-get install -y ${requested}`,
      { timeout: 10 * 60 * 1000 }
    );
    try {
      FixLog.create({
        session_id: _activeAutofixSessionId,
        user_id: _activeUserId,
        tool_name: 'fix_install_safe_package',
        command: `apt-get install -y ${requested}`,
        exit_code: r.exitCode,
        stdout_tail: r.stdout,
        stderr_tail: r.stderr,
      });
    } catch (_) { /* non-critical */ }
    return textResult(r.ok
      ? `OK\nInstalled ${requested}.\n${r.stdout || ''}`
      : `FAILED (exit ${r.exitCode})\n${r.stderr}`);
  }
);

// All sandbox-mode-only fix tools — register conditionally below.
const SANDBOX_FIX_TOOLS = [
  // Tier 1 — network / WiFi / DNS
  fixFlushDnsCache,
  fixRenewDhcpLease,
  fixResetWinsock,
  fixRestartNetworkAdapter,
  // Tier 2 — slow PC / frozen apps
  fixKillProcessByName,
  fixRestartExplorer,
  // Tier 3 — disk cleanup
  fixClearTempFiles,
  fixEmptyRecycleBin,
  // Tier 4 — system integrity
  fixRunSfcScannow,
  fixRunDism,
  fixRestartPrintSpooler,
  fixRestartAudioService,
  // Tier 5 — Debian / Ubuntu package management
  fixAptUpdate,
  fixAptSafeUpgrade,
  fixClearAptCache,
  fixAptAutoremove,
  fixInstallSafePackage,
];

// Build the MCP Server

function createPcPalMcpServer(opts = {}) {
  const mode = opts.mode || 'normal';
  const sandbox = mode === 'autofix-sandbox';

  // Common tools available in BOTH modes — diagnostics, safety, memory,
  // user/notes, vision, findings card.
  const commonTools = [
    // Diagnostics (sandbox uses these to identify problems before fixing)
    getSystemInfo,
    checkNetwork,
    listRunningApps,
    readErrorLog,
    runSafeCommand,
    checkDiskHealth,
    checkInstalledSoftware,
    getBatteryStatus,
    // Safety — must run in both modes
    flagEmergency,
    analyzeScamSituation,
    // User context
    saveNoteForUser,
    getUserNotes,
    adjustVocabularyLevel,
    // Vision (sandbox can take a screenshot to verify a fix worked)
    takeScreenshot,
    // Memory
    saveMemory,
    recallMemories,
    // Findings card — sandbox uses this to render the final summary
    createFindings,
  ];

  // Normal-mode-only tools: teaching scaffolding, learning progression,
  // step sequences, guides, practice, buddy. None of these belong in
  // an autonomous-fix workflow.
  const normalOnlyTools = sandbox ? [] : [
    logSkillStarted,
    suggestNextSkill,
    scheduleSkillReview,
    startStepSequence,
    advanceStep,
    completeStepSequence,
    showVisualGuide,
    saveUserGoal,
    shareProgressWithBuddy,
    askBuddyForHelp,
    diagnoseMissingDll,
    findYoutubeVideos,
    startPractice,
    createGuide,
    lookupSupportResources,
  ];

  // Sandbox-mode-only tools: the curated fix_* tool set.
  const sandboxOnlyTools = sandbox ? SANDBOX_FIX_TOOLS : [];

  return createSdkMcpServer({
    name: sandbox ? 'pcpal-tools-sandbox' : 'pcpal-tools',
    tools: [...commonTools, ...normalOnlyTools, ...sandboxOnlyTools],
  });
}

// Setters for fallback orchestrator (which can't use the MCP tool server directly)
function _setLastGuide(g) { _lastGuide = g; }
function _setLastFindings(f) { _lastFindings = f; }
function _setLastPractice(p) { _lastPractice = p; }

module.exports = { createPcPalMcpServer, getAndClearLastGuide, getAndClearLastFindings, getAndClearLastPractice, getAndClearLastScreenshot, setActiveUserContext, setActiveAutofixSession, setRequestScreenshotFn, _setLastGuide, _setLastFindings, _setLastPractice };
