/**
 * PC Pal MCP Tool Server
 *
 * Exposes all PC Pal custom tools as an in-process MCP server
 * for use with the Claude Agent SDK. This makes the tools
 * provider-agnostic — any MCP-compatible agent can use them.
 */

const { tool, createSdkMcpServer } = require('@anthropic-ai/claude-agent-sdk');
const z = require('zod');

const { VALID_GUIDE_IDS } = require('../core/sharedConstants');
const systemDiagnostics = require('../core/systemDiagnostics');
const youtubeSearch = require('../core/youtubeSearch');
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

function textResult(text) {
  return { content: [{ type: 'text', text: String(text) }] };
}

// Side-channel for structured data that Claude would otherwise consume
// The orchestrator reads and clears these after each query()
let _lastGuide = null;
let _lastFindings = null;

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

// System Diagnostic Tools

const getSystemInfo = tool(
  'get_system_info',
  "Get detailed info about the user's computer: OS version, CPU, RAM usage, disk space, uptime. Use to diagnose performance issues.",
  {},
  async () => textResult(systemDiagnostics.getSystemInfo())
);

const checkNetwork = tool(
  'check_network',
  "Check internet connection, Wi-Fi status, DNS resolution, and network latency. Use when user reports internet or Wi-Fi problems.",
  {},
  async () => textResult(systemDiagnostics.checkNetwork())
);

const listRunningApps = tool(
  'list_running_apps',
  "List running applications and their resource usage (CPU/memory). Use to find apps slowing down the computer.",
  {},
  async () => textResult(systemDiagnostics.listRunningApps())
);

const readErrorLog = tool(
  'read_error_log',
  "Read recent system error logs to diagnose crashes, freezes, or other problems.",
  { source: z.enum(['system', 'application', 'crash']).optional().describe('Which log: system, application, or crash') },
  async (args) => textResult(systemDiagnostics.readErrorLog(args.source))
);

const runSafeCommand = tool(
  'run_safe_command',
  "Run a safe, read-only diagnostic command. Only allowlisted commands work. NEVER use for destructive operations.",
  {
    command: z.string().describe('The diagnostic command to run'),
    reason: z.string().describe('Why you are running this command'),
  },
  async (args) => {
    console.log(`[MCP] Safe command: "${args.command}" — ${args.reason}`);
    return textResult(systemDiagnostics.runSafeCommand(args.command));
  }
);

const checkDiskHealth = tool(
  'check_disk_health',
  "Check disk space usage, large folders, and temp files. Use when user says computer is full or running out of space.",
  {},
  async () => textResult(systemDiagnostics.checkDiskHealth())
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
  async () => textResult(systemDiagnostics.getBatteryStatus())
);

// Teaching & Skill Tools

const logSkillStarted = tool(
  'log_skill_started',
  'Log that the user started learning a new skill. Call when you begin teaching a topic.',
  { skill_name: z.string().describe('Name of the skill'), user_id: z.string().describe('User ID') },
  async (args) => {
    try {
      SkillEvent.create({ user_id: args.user_id, skill_name: args.skill_name, status: 'started' });
      return textResult(`Logged skill started: ${args.skill_name}`);
    } catch (err) {
      return textResult(`Failed: ${err.message}`);
    }
  }
);

const suggestNextSkill = tool(
  'suggest_next_skill',
  "Recommend what to learn next based on the user's completion history.",
  { user_id: z.string().describe('User ID') },
  async (args) => {
    const suggestion = skillProgression.getNextSkill(args.user_id);
    return textResult(suggestion.skillId
      ? `Suggested: ${suggestion.skillName} (${suggestion.skillId}). ${suggestion.reason}`
      : suggestion.reason);
  }
);

const scheduleSkillReview = tool(
  'schedule_skill_review',
  'Schedule a spaced repetition review for a completed skill. Call after completing a skill.',
  {
    user_id: z.string().describe('User ID'),
    skill_name: z.string().describe('Skill to review later'),
    days_until_review: z.number().optional().describe('Days until review (default 7)'),
  },
  async (args) => {
    const days = args.days_until_review || 7;
    const dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    SkillReview.create({ user_id: args.user_id, skill_name: args.skill_name, review_due_at: dueDate });
    return textResult(`Review scheduled for "${args.skill_name}" in ${days} days`);
  }
);

// Step Sequence Tools

const startStepSequence = tool(
  'start_step_sequence',
  'Start a numbered step-by-step walkthrough for a multi-step task.',
  {
    session_id: z.string().describe('Conversation/session ID'),
    task_name: z.string().describe('Short name for the task'),
    steps: z.array(z.string()).describe('Array of step descriptions'),
  },
  async (args) => {
    const seq = StepSequence.create({ conversation_id: args.session_id, steps: args.steps, current_index: 0 });
    return textResult(JSON.stringify({ id: seq.id, taskName: args.task_name, steps: seq.steps, currentIndex: 0, completed: false }));
  }
);

const advanceStep = tool(
  'advance_step',
  'Move to the next step when user confirms they completed the current one.',
  { session_id: z.string().describe('Conversation/session ID') },
  async (args) => {
    const sequences = StepSequence.findByConversationId(args.session_id);
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
    session_id: z.string().describe('Conversation/session ID'),
    user_id: z.string().describe('User ID'),
    skill_name: z.string().describe('Name of the completed skill'),
  },
  async (args) => {
    const sequences = StepSequence.findByConversationId(args.session_id);
    const activeSeq = sequences.filter(s => !s.completed).pop();
    if (!activeSeq) return textResult('No active step sequence to complete');
    StepSequence.update(activeSeq.id, { completed: 1 });
    SkillEvent.create({ user_id: args.user_id, skill_name: args.skill_name, status: 'completed' });
    return textResult(`Step sequence completed: "${args.skill_name}"`);
  }
);

// Safety Tools

const flagEmergency = tool(
  'flag_emergency',
  'Flag a potential emergency. Use when user mentions falling, injury, chest pain, or medical concerns.',
  {
    user_id: z.string().describe('User ID'),
    reason: z.string().describe('Why this is flagged as an emergency'),
  },
  async (args) => {
    SafetyEvent.create({ user_id: args.user_id, event_type: 'emergency', trigger_text: args.reason });
    return textResult(`EMERGENCY FLAGGED: ${args.reason}. Advise user to call 911 if needed.`);
  }
);

const analyzeScamSituation = tool(
  'analyze_scam_situation',
  "Analyze whether a situation is a scam. NEVER say 'it\\'s safe'. Always recommend verification through official channels.",
  {
    user_id: z.string().describe('User ID'),
    session_id: z.string().describe('Session ID'),
    situation_summary: z.string().describe('What the user described'),
    claimed_organization: z.string().optional().describe('Company/agency the caller claims to be from'),
    red_flags_found: z.array(z.string()).describe('Specific red flags detected'),
    risk_level: z.enum(['high', 'medium', 'low']).describe('How likely this is a scam'),
    recommended_action: z.string().describe('What the user should do right now'),
    verification_contact: z.string().optional().describe('Official number/website to verify'),
  },
  async (args) => {
    ScamCheckEvent.create({
      user_id: args.user_id,
      conversation_id: args.session_id,
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
    user_id: z.string().describe('User ID'),
    title: z.string().describe('Short title'),
    content: z.string().describe('The note content — 1-2 sentences'),
  },
  async (args) => {
    UserNote.create({ user_id: args.user_id, title: args.title, content: args.content });
    return textResult(`Note saved: "${args.title}"`);
  }
);

const getUserNotes = tool(
  'get_user_notes',
  "Retrieve the user's saved notes and tips.",
  { user_id: z.string().describe('User ID') },
  async (args) => {
    const notes = UserNote.findByUserId(args.user_id);
    if (notes.length === 0) return textResult('No saved notes yet.');
    const list = notes.map((n, i) => `${i + 1}. ${n.title}: ${n.content}`).join('\n');
    return textResult(`${notes.length} saved note(s):\n${list}`);
  }
);

const saveUserGoal = tool(
  'save_user_goal',
  "Save the user's learning goal when they mention WHY they want to learn something.",
  {
    user_id: z.string().describe('User ID'),
    goal_text: z.string().describe("The user's goal in their own words"),
    related_skills: z.array(z.string()).optional().describe('Skill IDs this goal connects to'),
  },
  async (args) => {
    UserGoal.create({
      user_id: args.user_id,
      goal_text: args.goal_text,
      related_skills: args.related_skills ? JSON.stringify(args.related_skills) : '[]',
    });
    User.update(args.user_id, { goal_summary: args.goal_text });
    return textResult(`Goal saved: "${args.goal_text}"`);
  }
);

const adjustVocabularyLevel = tool(
  'adjust_vocabulary_level',
  'Change the vocabulary simplification level if user seems confused or confident.',
  {
    user_id: z.string().describe('User ID'),
    new_level: z.enum(['basic', 'intermediate', 'standard']).describe('New level'),
    reason: z.string().describe('Why adjusting'),
  },
  async (args) => {
    userProfileManager.updateProfile(args.user_id, { vocabulary_level: args.new_level });
    return textResult(`Vocabulary changed to ${args.new_level}: ${args.reason}`);
  }
);

// Buddy System Tools

const shareProgressWithBuddy = tool(
  'share_progress_with_buddy',
  "Share a skill completion with the user's learning buddy.",
  {
    user_id: z.string().describe('User ID'),
    skill_name: z.string().describe('Completed skill'),
    celebration_message: z.string().describe('Warm celebration message'),
  },
  async (args) => {
    const pairs = BuddyPair.findByUserId(args.user_id);
    if (pairs.length === 0) return textResult('User has no active buddy.');
    for (const pair of pairs) {
      ProgressShare.create({
        user_id: args.user_id,
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
    user_id: z.string().describe('User ID'),
    question: z.string().describe('What the user needs help with'),
    context_summary: z.string().optional().describe('What they were trying to do'),
  },
  async (args) => {
    const pairs = BuddyPair.findByUserId(args.user_id);
    if (pairs.length === 0) return textResult('User has no active buddy.');
    const pair = pairs[0];
    HelpRequest.create({
      learner_id: args.user_id,
      buddy_pair_id: pair.id,
      question: args.question,
      context_summary: args.context_summary || null,
    });
    return textResult('Help request sent to buddy! They\'ll reply when they can.');
  }
);

// Visual Guide Tool

// VALID_GUIDE_IDS imported from sharedConstants.js — single source of truth

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

// Diagnostic Findings Artifact Tool

const createFindings = tool(
  'create_findings',
  "Create a diagnostic findings artifact — a collapsible dropdown showing what you discovered about the user's computer. Use this after running diagnostic tools to show the user HOW you reached your conclusions. Each finding has a label (what was checked), a value (what was found), and a status (good/warning/bad). The findings appear as a collapsible card separate from your text response.",
  {
    title: z.string().describe('Title, e.g. "System Check Results"'),
    findings: z.array(z.object({
      label: z.string().describe('What was checked, e.g. "Memory"'),
      value: z.string().describe('What was found, e.g. "17.6 GB of 18 GB used (98%)"'),
      status: z.enum(['good', 'warning', 'bad']).describe('Assessment: good, warning, or bad'),
    })).describe('List of diagnostic findings'),
  },
  async (args) => {
    const findings = { title: args.title, findings: args.findings };
    _lastFindings = findings;
    console.log(`[MCP] Findings created: "${args.title}" (${args.findings.length} items)`);
    return textResult(`Findings card "${args.title}" created. Reference the key findings in your response but don't repeat the full details — the user can expand the card to see everything.`);
  }
);

// Guide Artifact Tool

const createGuide = tool(
  'create_guide',
  "Create an interactive guide artifact that appears in the chat as a collapsible card with numbered steps, copy-paste terminal commands, and 'Run' buttons. Use this whenever you would give the user terminal commands — put them in a guide instead of inline text. Each step can have a description, an optional terminal command, and an optional note. The guide is rendered as a structured UI element, not text.",
  {
    title: z.string().describe('Short title for the guide, e.g. "Set Up Ollama on Mac"'),
    description: z.string().optional().describe('One-sentence summary of what this guide accomplishes'),
    steps: z.array(z.object({
      text: z.string().describe('What this step does in plain English'),
      command: z.string().optional().describe('Terminal command to run (shown in a code block with Copy and Run buttons)'),
      note: z.string().optional().describe('Optional tip or warning for this step'),
    })).describe('Ordered list of steps'),
  },
  async (args) => {
    const guide = {
      title: args.title,
      description: args.description || null,
      steps: args.steps,
    };
    _lastGuide = guide;
    console.log(`[MCP] Guide created: "${args.title}" (${args.steps.length} steps)`);
    return textResult(`Guide "${args.title}" has been created and will appear as an interactive card in the chat. Do NOT repeat the commands in your text — the user can see them in the guide card.`);
  }
);

// Build the MCP Server

function createPcPalMcpServer() {
  return createSdkMcpServer({
    name: 'pcpal-tools',
    tools: [
      // Diagnostics
      getSystemInfo,
      checkNetwork,
      listRunningApps,
      readErrorLog,
      runSafeCommand,
      checkDiskHealth,
      checkInstalledSoftware,
      getBatteryStatus,
      // Teaching
      logSkillStarted,
      suggestNextSkill,
      scheduleSkillReview,
      startStepSequence,
      advanceStep,
      completeStepSequence,
      showVisualGuide,
      // Safety
      flagEmergency,
      analyzeScamSituation,
      // User
      saveNoteForUser,
      getUserNotes,
      saveUserGoal,
      adjustVocabularyLevel,
      // Buddy
      shareProgressWithBuddy,
      askBuddyForHelp,
      // Media
      findYoutubeVideos,
      // Artifacts
      createGuide,
      createFindings,
    ],
  });
}

module.exports = { createPcPalMcpServer, getAndClearLastGuide, getAndClearLastFindings };
