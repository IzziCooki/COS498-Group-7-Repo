const Anthropic = require('@anthropic-ai/sdk');
const { anthropicApiKey } = require('../config');
const safetyMonitor = require('./safetyMonitor');
const conversationState = require('./conversationState');
const vocabularyFilter = require('./vocabularyFilter');
const userProfileManager = require('./userProfileManager');
const taskClassifier = require('./taskClassifier');
const SkillEvent = require('../models/SkillEvent');
const SafetyEvent = require('../models/SafetyEvent');
const StepSequence = require('../models/StepSequence');
const Conversation = require('../models/Conversation');
const UserNote = require('../models/UserNote');
const skillProgression = require('./skillProgression');
const BuddyPair = require('../models/BuddyPair');
const ProgressShare = require('../models/ProgressShare');
const HelpRequest = require('../models/HelpRequest');
const SkillReview = require('../models/SkillReview');
const UserGoal = require('../models/UserGoal');
const User = require('../models/User');
const qualityTracker = require('./conversationQualityTracker');
const ScamCheckEvent = require('../models/ScamCheckEvent');
const scamKnowledge = require('../assets/scam-knowledge.json');
const systemDiagnostics = require('./systemDiagnostics');
const skillMatcher = require('./skillMatcher');
const youtubeSearch = require('./youtubeSearch');
const { VALID_GUIDE_IDS, buildComfortGuidelines } = require('./sharedConstants');

if (!anthropicApiKey) {
  console.warn('[agentOrchestrator] ANTHROPIC_API_KEY is not set — AI calls will fail. Running in degraded mode.');
}

const client = new Anthropic({ apiKey: anthropicApiKey });

const FALLBACK_RESPONSE =
  "I'm having a little trouble right now. Could you try asking me again in a moment?";

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOOL_ROUNDS = 10;

// VALID_GUIDE_IDS imported from sharedConstants.js — single source of truth

const tools = [
  {
    name: 'log_skill_started',
    description: 'Log that the user has started learning a new skill. Call this when you begin teaching a new topic.',
    input_schema: {
      type: 'object',
      properties: {
        skill_name: { type: 'string', description: 'Name of the skill being taught' },
      },
      required: ['skill_name'],
    },
  },
  {
    name: 'flag_emergency',
    description: 'Flag a potential emergency. Use this if the user expresses distress, mentions falling, injury, or medical concerns.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why this was flagged as an emergency' },
      },
      required: ['reason'],
    },
  },
  {
    name: 'show_visual_guide',
    description: 'Display a visual step-by-step guide card for a common task. Call this BEFORE giving text instructions for visual or procedural tasks so the user sees a helpful diagram.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'ID of the task guide. Valid: copy_paste, take_screenshot, send_email, open_settings, zoom_text, find_wifi, attach_file, open_browser, restart_computer, use_taskbar'
        }
      },
      required: ['task_id'],
    },
  },
  {
    name: 'start_step_sequence',
    description: 'Start a numbered step-by-step sequence for a multi-step task. The steps will appear in the chat with a progress indicator and quick-reply buttons.',
    input_schema: {
      type: 'object',
      properties: {
        task_name: { type: 'string', description: 'Short name for the task (e.g. "Send an Email")' },
        steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of step descriptions in plain English, one sentence each'
        }
      },
      required: ['task_name', 'steps'],
    },
  },
  {
    name: 'advance_step',
    description: 'Move to the next step when the user confirms they completed the current step (says "done", "ok", "got it", "next", etc.)',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'complete_step_sequence',
    description: 'Mark the current step sequence as fully completed. Call this when the user has finished all steps successfully.',
    input_schema: {
      type: 'object',
      properties: {
        skill_name: { type: 'string', description: 'Name of the skill that was completed' }
      },
      required: ['skill_name'],
    },
  },
  {
    name: 'suggest_next_skill',
    description: 'Suggest the next skill the user should learn based on their completion history. Call when the user asks "what should I learn next?" or after completing a skill.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'repeat_last_step',
    description: 'Repeat the current step instruction without advancing. Call when the user says "say that again", "repeat", "what was that?", or seems confused about the current step.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'adjust_vocabulary_level',
    description: 'Change the vocabulary simplification level. Call if the user seems confused (lower to basic) or uses technical terms confidently (raise to standard).',
    input_schema: {
      type: 'object',
      properties: {
        new_level: { type: 'string', enum: ['basic', 'intermediate', 'standard'], description: 'New vocabulary level' },
        reason: { type: 'string', description: 'Why you are adjusting the level' },
      },
      required: ['new_level', 'reason'],
    },
  },
  {
    name: 'save_note_for_user',
    description: 'Save a helpful tip or note for the user to reference later. Call after teaching something important.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short title (e.g., "How to Copy Text")' },
        content: { type: 'string', description: 'The note content — 1-2 sentences, simple language' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'get_user_notes',
    description: 'Retrieve the user\'s saved notes and tips. Call when the user asks "what have I learned?", "show my notes", or "what tips did you save?"',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'restart_conversation',
    description: 'End the current conversation and start fresh. Call when the user says "start over", "new question", or seems lost.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why restarting the conversation' },
      },
      required: ['reason'],
    },
  },
  {
    name: 'save_user_goal',
    description: 'Save the user\'s learning goal when they mention WHY they want to learn something. Examples: "I want to email my grandkids", "I need to video call my doctor". Call this whenever the user shares their motivation.',
    input_schema: {
      type: 'object',
      properties: {
        goal_text: { type: 'string', description: 'The user\'s goal in their own words' },
        related_skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Skill IDs this goal connects to (e.g. ["send_email", "attach_file"])',
        },
      },
      required: ['goal_text'],
    },
  },
  {
    name: 'schedule_skill_review',
    description: 'Schedule a spaced repetition review for a skill the user just completed. Always call this after complete_step_sequence. Reviews help the user retain what they learned.',
    input_schema: {
      type: 'object',
      properties: {
        skill_name: { type: 'string', description: 'Name of the skill to review later' },
        days_until_review: { type: 'number', description: 'Days until review (default 7, use 3 for comfort level 1-2 users)' },
      },
      required: ['skill_name'],
    },
  },
  {
    name: 'share_progress_with_buddy',
    description: 'Share a skill completion with the user\'s learning buddy. Only call this if the user has an active buddy pair. Call after complete_step_sequence.',
    input_schema: {
      type: 'object',
      properties: {
        skill_name: { type: 'string', description: 'Name of the skill completed' },
        celebration_message: { type: 'string', description: 'A warm celebration message to share, e.g. "Margaret just learned to send an email!"' },
      },
      required: ['skill_name', 'celebration_message'],
    },
  },
  {
    name: 'ask_buddy_for_help',
    description: 'Send a help request to the user\'s buddy when the user is stuck and asks for human help, or says things like "can my daughter help?" or "I need a real person". Also consider calling after 3+ failed attempts at the same step.',
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'What the user needs help with' },
        context_summary: { type: 'string', description: 'Brief description of what the user was trying to do' },
      },
      required: ['question'],
    },
  },
  {
    name: 'analyze_scam_situation',
    description: 'Analyze whether a situation the user describes is a scam. Use this when the user asks "is this a scam?", describes a suspicious call/email/text, or asks if they should trust someone asking for money or personal information. Provide a structured analysis with specific red flags, risk level, and the official phone number or website to verify. NEVER say "it\'s safe" — always recommend verifying through official channels.',
    input_schema: {
      type: 'object',
      properties: {
        situation_summary: { type: 'string', description: 'Brief summary of what the user described happening' },
        claimed_organization: { type: 'string', description: 'The company or agency the caller/emailer claims to be from, if any' },
        red_flags_found: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of specific red flags detected in the situation. Be specific: "They created urgency by saying your account would be locked" not just "urgency"',
        },
        risk_level: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'How likely this is a scam. Use "high" if 2+ red flags or matches a known scam pattern. Use "low" only if the situation describes a normal legitimate interaction with no red flags.',
        },
        recommended_action: { type: 'string', description: 'Clear, specific action the user should take right now' },
        verification_contact: { type: 'string', description: 'The official phone number or website the user should use to verify. Always include this.' },
      },
      required: ['situation_summary', 'red_flags_found', 'risk_level', 'recommended_action'],
    },
  },

  // Desktop Diagnostic Tools (available when running as Electron app)
  {
    name: 'get_system_info',
    description: 'Get detailed information about the user\'s computer: operating system version, processor, memory (RAM) usage, disk space, and how long the computer has been running. Use this to understand the user\'s hardware and diagnose performance issues.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'check_network',
    description: 'Check the user\'s internet connection, Wi-Fi status, DNS resolution, and network latency. Use this when the user reports internet problems, slow browsing, or Wi-Fi issues.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_running_apps',
    description: 'List all currently running applications and their resource usage (CPU and memory). Use this to find apps that might be slowing down the computer or to verify an app is running.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'read_error_log',
    description: 'Read recent system error logs to diagnose crashes, freezes, or other problems. Use this when the user reports something "stopped working" or their computer crashed.',
    input_schema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['system', 'application', 'crash'],
          description: 'Which log to check: "system" for OS errors, "application" for app errors, "crash" for crash reports',
        },
      },
      required: [],
    },
  },
  {
    name: 'run_safe_command',
    description: 'Run a safe, read-only diagnostic command on the user\'s computer. Only allowlisted commands work (network diagnostics, file listing, system info). Use this for specific diagnostics not covered by other tools. NEVER use destructive commands — they will be blocked.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The diagnostic command to run (must be in the allowlist)' },
        reason: { type: 'string', description: 'Why you are running this command — explain what you are looking for' },
      },
      required: ['command', 'reason'],
    },
  },
  {
    name: 'check_disk_health',
    description: 'Check disk space usage, large folders, and temporary files that could be cleaned up. Use this when the user says their computer is "full", "slow", or "running out of space".',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'check_installed_software',
    description: 'List installed applications or search for a specific program. Use this to verify if software is installed, find the right app for a task, or check software versions.',
    input_schema: {
      type: 'object',
      properties: {
        search_term: { type: 'string', description: 'Optional: search for a specific application by name (e.g. "Chrome", "Zoom")' },
      },
      required: [],
    },
  },
  {
    name: 'get_battery_status',
    description: 'Check the laptop\'s battery level and whether it is charging. Use this when the user asks about battery life or their computer keeps shutting off.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'find_youtube_videos',
    description: "Search YouTube for helpful tutorial videos related to the user's question. Use when the user asks to see a video, wants a visual demonstration, or would benefit from watching someone do the task. Returns playable videos in the chat.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: "Search query — describe the task simply, e.g. 'how to copy and paste on Mac'" },
        max_results: { type: 'number', description: 'Number of videos to return (default 3, max 5)' },
      },
      required: ['query'],
    },
  },
];

// buildComfortGuidelines imported from sharedConstants.js — single source of truth

function buildSystemPrompt(profileString, user, classification, confusionContext, matchedSkillPrompt) {
  const comfortGuidelines = buildComfortGuidelines(user?.comfort_level);
  const classificationContext = classification
    ? `\nCurrent task: ${classification.taskType} — ${classification.topic} (urgency: ${classification.urgency})`
    : '';
  const urgencyNote = '';

  // Check if user has a buddy for collaboration tools context
  const BuddyPair = require('../models/BuddyPair');
  let buddyContext = '';
  try {
    const activePairs = BuddyPair.findByUserId(user?.id);
    if (activePairs && activePairs.length > 0) {
      const buddyNames = activePairs.map(p => p.helper_name || p.learner_name || 'their buddy').join(', ');
      buddyContext = `\nThis user has a learning buddy: ${buddyNames}. When they complete a skill, use share_progress_with_buddy to celebrate with their buddy. If they get stuck after multiple attempts, offer to use ask_buddy_for_help.`;
    }
  } catch (e) {
    // buddy_pairs table may not exist yet during migration
  }

  // Check user's goal for context
  const goalContext = user?.goal_summary
    ? `\nThis user's learning goal: "${user.goal_summary}". Connect what you teach to this goal whenever relevant.`
    : '\nWhen starting a new skill, ask the user: "Before we start, what do you want to use this for?" Use their answer to make every step feel relevant to their life.';

  // Confusion state injection for escalation ladder
  const confusionNote = confusionContext && confusionContext.consecutiveConfusions > 0
    ? `\n## Current Confusion State\nThe user has expressed confusion ${confusionContext.consecutiveConfusions} time(s) in a row on the current step without successfully advancing. Follow the Confusion Escalation Ladder at level ${Math.min(confusionContext.consecutiveConfusions, 4)}.`
    : '';

  return `You are PC Pal, a warm and patient AI tutor who helps elderly people with their computers.
Think of yourself as a helpful grandchild teaching a grandparent — kind, encouraging, and never condescending.

Here is the profile of the person you are helping:
${profileString}
${classificationContext}${urgencyNote}${buddyContext}${goalContext}${confusionNote}

## Comfort-Level Guidelines
${comfortGuidelines}

## Evidence-Based Communication Rules

### Atomic Steps (one action per step — Salthouse 1996)
Each numbered step must contain exactly ONE physical action: one tap, one click, one key press, or one visual search. Never combine actions like "Click File, then choose Save" — that is TWO steps. If a step requires looking AND clicking, split it: first "Look for...", then "Click/Tap on...".

### Working Memory Cap (3-item limit — Hasher & Zacks 1988)
Never give more than 3 new pieces of information in a single response. If a task requires 4+ steps, give steps 1-3, then STOP and wait for the user to confirm before continuing. This is the most important formatting rule.

### Fear Reassurance (Marquie et al. 2002)
Before ANY step that involves changing settings, deleting, restarting, or updating, include reassurance: "You cannot break anything by trying this — it is safe." Vary the wording each time. The #1 barrier for elderly users is fear of breaking their device.

### Spatial Language First (Dickinson et al. 2007)
Always describe WHERE to look before WHAT to look for.
Good: "In the top-right corner of your screen, look for a small picture that looks like a gear"
Bad: "Click the Settings icon"
Use: top-left, top-right, bottom-left, bottom-right, center, along the top, along the bottom.

### Never Rush — Always Wait
After every single step, end with a check-in question: "Can you see that?", "Did that work?", "What do you see now?" Never give step 2 in the same message as step 1 unless the user has confirmed step 1.

### Repetition is Welcome
If the user asks the same question again, NEVER say "as I mentioned" or "like I said." Treat every repetition as the first time. Change your APPROACH — use a different analogy, different words, or break the step into smaller sub-steps.

### Meaningful Praise (Czaja et al. 2006)
After every confirmed step, give specific praise that connects to what the step accomplished.
Bad: "Great job!" (generic)
Good: "You found it! That gear picture is the gateway to all your settings — you'll use it a lot."
Good: "Perfect — that green switch means your wireless internet is now connected."

### Error Recovery Protocol
If the user says something went wrong or the screen looks different:
1. First reassure: "That's okay — we can fix this."
2. Ask: "Can you describe what you see on your screen right now?"
3. NEVER say "you did it wrong." Say "Let's get back to where we were."
4. For comfort-level 1-2 users, offer: "Would you like to start fresh from the beginning? That's often easier."

### Physical-World Analogies (Fisk et al. 2009)
Map abstract concepts to physical objects the user already knows:
- Folder = manila folder in a filing cabinet
- Desktop = top of a real desk where you put things you use often
- Saving a file = putting a paper in a drawer so you can find it later
- Deleting = putting paper in a trash can (you can get it back from the trash)
- The internet = a giant library you can visit without leaving home
- A password = a key to a lock on your front door
- An email = a letter you send through the post, but it arrives instantly
- Copy and paste = a photocopier for words

### Device-Correct Action Verbs
iPhone/iPad: "tap" (NEVER "click"), "swipe", "press and hold"
Windows PC: "click", "double-click", "right-click", "press" (for keyboard)
Mac: "click", "press" (for keyboard)
Android: "tap", "swipe", "press and hold"
If the user's device type is unknown, ASK before giving instructions.

## Things You Must NEVER Do
- Never say "simply" or "just"
- Never say "as I mentioned" or "like I said"
- Never apologize for the user's confusion — say "Let's try a different way"
- Never give a wall of text
- Never assume they know what a technical term means
- Never give more than 3 steps without waiting for confirmation
- Never combine multiple actions into one step

## Confusion Escalation Ladder
When the user expresses confusion ("I don't understand", "I don't see it", "huh?", etc.), follow this escalation sequence:

Level 1 (first confusion): Restate the step using a COMPLETELY different approach. If you described a button name, describe its location and appearance instead. Say: "Let me try explaining that a different way."

Level 2 (second confusion on same step): Break the single step into 2-3 sub-steps. Reduce to the smallest possible physical action. Example: Instead of "Tap the Settings app", say: "Look at all the little pictures on your screen. We need to find one that looks like a gray square with gears inside it. Do you see anything like that?"

Level 3 (third confusion): Use a physical-world analogy for the concept. Call adjust_vocabulary_level to 'basic' if not already there. Say: "No worries at all — this part can be tricky."

Level 4 (fourth+ confusion or "I give up"): Offer human help. If they have a buddy, say: "Would you like me to let [buddy name] know you could use a hand with this?" and call ask_buddy_for_help. If no buddy: "This might be easier with someone sitting next to you — that is completely normal. Some things are just easier to show than describe."

## Scaffolding Rules
- First time teaching a skill: Use full visual guide + step sequence + all context
- If the user has done this skill before: Ask "Would you like me to walk you through it again, or do you want to try it yourself?" before giving the full guide
- After 3+ completions of the same skill: Only give a brief hint and let the user drive. Celebrate their independence.

## Urgency Handling
- If urgency is high: prioritize a quick, direct solution
- If urgency is medium: acknowledge the frustration first ("That sounds frustrating. Let's fix it together.") then solve
- If urgency is low: take your time, be thorough, explore

## Tools Available
- show_visual_guide: Display a visual step-by-step guide card. Call this BEFORE giving text instructions for visual/procedural tasks. Valid task IDs: ${VALID_GUIDE_IDS.join(', ')}
- start_step_sequence: Start a numbered walkthrough for multi-step tasks. Provide a task name and array of step descriptions.
- advance_step: Move to next step when user confirms (says "done", "ok", "got it", "next", etc.)
- complete_step_sequence: Mark all steps as done. Also logs the skill as completed. After completing, always use schedule_skill_review to schedule a review.
- log_skill_started: Log when you begin teaching a new skill.
- flag_emergency: Flag emergencies (falls, injuries, medical concerns).
- suggest_next_skill: Recommend what to learn next based on skill history.
- repeat_last_step: Repeat the current instruction without advancing.
- adjust_vocabulary_level: Change language simplification if user seems confused or confident.
- save_note_for_user: Save a tip the user can reference later.
- get_user_notes: Show the user's saved notes and tips.
- restart_conversation: Start a fresh conversation when user is lost.
- save_user_goal: Save when the user mentions why they are learning (e.g. "I want to email my grandkids").
- schedule_skill_review: After completing a skill, schedule a review for later.
- share_progress_with_buddy: Share a skill completion with the user's buddy (only if they have one).
- ask_buddy_for_help: Send a help request to the user's buddy when they are stuck.
- analyze_scam_situation: CRITICAL SAFETY TOOL. When a user asks "is this a scam?" or describes a suspicious call, email, text, or situation, use this tool to provide a structured analysis. Walk through specific red flags, assign a risk level, and ALWAYS include the official phone number or website to verify. NEVER tell someone a situation is safe — always recommend verification.

## Desktop Diagnostic Tools
You have access to the user's computer and can run safe, read-only diagnostics. Use these tools when the user describes a specific problem (slow computer, internet not working, app crashing, etc.) to gather REAL information before giving advice. This is much better than guessing!

- get_system_info: Check OS version, CPU, RAM usage, disk space, uptime. Use first when diagnosing any hardware or performance issue.
- check_network: Test internet connectivity, Wi-Fi status, DNS. Use when user has internet or Wi-Fi problems.
- list_running_apps: See what programs are running and their resource usage. Use when computer is slow or to find a running app.
- read_error_log: Read recent error/crash logs. Use when user reports crashes, freezes, or "something stopped working."
- run_safe_command: Run a specific read-only diagnostic command (must be in the allowlist). Use for targeted diagnostics not covered by other tools.
- check_disk_health: Check disk space, folder sizes, temp files. Use when computer is "full" or "running out of space."
- check_installed_software: List or search installed applications. Use to verify software is installed or find the right app.
- get_battery_status: Check battery level and charging state. Use when user asks about battery or computer shuts off unexpectedly.

### How to Use Diagnostic Tools
1. When the user describes a problem, FIRST use the relevant diagnostic tool to gather real data
2. Then explain what you found in simple language — translate technical output into plain English
3. Provide specific, actionable advice based on the ACTUAL state of their computer
4. Example: If they say "my computer is slow", call get_system_info AND list_running_apps, then say "I can see your computer has 87% of its memory used, and Chrome has 12 tabs open using most of it. Let's close some tabs!"
5. NEVER show raw command output to the user — always translate it into friendly language

## Scam Analysis Rules
When a user asks about a potential scam, follow these rules:
1. NEVER say "it's safe" or "it sounds fine" — always recommend verification through official channels
2. Always use the analyze_scam_situation tool to give a structured response
3. Include the REAL phone number for the company being impersonated (e.g. IRS: 1-800-829-1040)
4. Remind them: no legitimate company EVER asks for gift cards, threatens arrest over the phone, or demands immediate payment
5. If risk is high, be direct: "This has serious warning signs of a scam. Do not give them anything."
6. If they already sent money or gave information, tell them to call their bank immediately and report to the FTC at reportfraud.ftc.gov or the National Elder Fraud Hotline at 1-833-372-8311

Known scam patterns to watch for: ${scamKnowledge.scam_patterns.map(p => p.name).join(', ')}

## Response Guidelines
- Use simple, everyday language. Avoid technical jargon.
- Describe WHERE on the screen before WHAT to look for.
- Explain the "why" behind every step, not just the "what".
- Keep responses concise — maximum 3 steps, then wait.
- Be warm, patient, and encouraging. Celebrate with specific, meaningful praise.
- Never be condescending.
- If the user seems confused, follow the Confusion Escalation Ladder.
- If the user expresses distress, use the flag_emergency tool immediately.
- When teaching a new topic, use log_skill_started.
- When the user mentions a life goal or reason for learning, use save_user_goal.${matchedSkillPrompt ? `\n\n## Active Skill Context\n${matchedSkillPrompt}` : ''}`;
}

async function handleFunctionCall(name, args, userId, sessionId) {
  let result = 'done';
  let safetyAlert = null;
  let guideId = null;
  let stepSequence = null;
  let endedConversationId = null;

  if (name === 'log_skill_started') {
    try {
      SkillEvent.create({ user_id: userId, skill_name: args.skill_name, status: 'started' });
      result = `Logged skill started: ${args.skill_name}`;
    } catch (err) {
      console.error('[agentOrchestrator] Failed to log skill_started:', err.message);
      result = 'Failed to log skill event';
    }
  } else if (name === 'flag_emergency') {
    try {
      const event = SafetyEvent.create({ user_id: userId, event_type: 'emergency', trigger_text: args.reason });
      safetyAlert = { type: 'emergency', reason: args.reason, eventId: event ? event.id : null };
      result = `Emergency flagged: ${args.reason}`;
    } catch (err) {
      console.error('[agentOrchestrator] Failed to log emergency:', err.message);
      result = 'Failed to log emergency event';
    }
  } else if (name === 'show_visual_guide') {
    if (VALID_GUIDE_IDS.includes(args.task_id)) {
      guideId = args.task_id;
      result = `Visual guide displayed for: ${args.task_id}`;
    } else {
      result = `Unknown guide ID: ${args.task_id}. Valid IDs: ${VALID_GUIDE_IDS.join(', ')}`;
    }
  } else if (name === 'start_step_sequence') {
    try {
      const seq = StepSequence.create({ conversation_id: sessionId, steps: args.steps, current_index: 0 });
      stepSequence = { id: seq.id, taskName: args.task_name, steps: seq.steps, currentIndex: 0, completed: false };
      result = `Step sequence started: "${args.task_name}" with ${args.steps.length} steps`;
    } catch (err) {
      console.error('[agentOrchestrator] Failed to create step sequence:', err.message);
      result = 'Failed to start step sequence';
    }
  } else if (name === 'advance_step') {
    try {
      const sequences = StepSequence.findByConversationId(sessionId);
      const activeSeq = sequences.filter(s => !s.completed).pop();
      if (activeSeq) {
        const updated = StepSequence.update(activeSeq.id, { current_index: activeSeq.current_index + 1 });
        stepSequence = { id: updated.id, taskName: null, steps: updated.steps, currentIndex: updated.current_index, completed: false };
        result = `Advanced to step ${updated.current_index + 1}`;
      } else {
        result = 'No active step sequence found';
      }
    } catch (err) {
      console.error('[agentOrchestrator] Failed to advance step:', err.message);
      result = 'Failed to advance step';
    }
  } else if (name === 'complete_step_sequence') {
    try {
      const sequences = StepSequence.findByConversationId(sessionId);
      const activeSeq = sequences.filter(s => !s.completed).pop();
      if (activeSeq) {
        const updated = StepSequence.update(activeSeq.id, { completed: 1 });
        stepSequence = { id: updated.id, taskName: null, steps: updated.steps, currentIndex: updated.current_index, completed: true };
        try {
          SkillEvent.create({ user_id: userId, skill_name: args.skill_name, status: 'completed' });
        } catch (skillErr) {
          console.error('[agentOrchestrator] Failed to log skill completion:', skillErr.message);
        }
        result = `Step sequence completed: "${args.skill_name}"`;
      } else {
        result = 'No active step sequence found to complete';
      }
    } catch (err) {
      console.error('[agentOrchestrator] Failed to complete step sequence:', err.message);
      result = 'Failed to complete step sequence';
    }
  } else if (name === 'suggest_next_skill') {
    try {
      const suggestion = skillProgression.getNextSkill(userId);
      if (suggestion.skillId) {
        result = `Suggested next skill: ${suggestion.skillName} (${suggestion.skillId}). ${suggestion.reason}`;
      } else {
        result = suggestion.reason; // "You've completed all available skills!"
      }
    } catch (err) {
      console.error('[agentOrchestrator] Failed to get skill suggestion:', err.message);
      result = 'Unable to get skill suggestion';
    }
  } else if (name === 'repeat_last_step') {
    try {
      const sequences = StepSequence.findByConversationId(sessionId);
      const activeSeq = sequences.filter(s => !s.completed).pop();
      if (activeSeq && activeSeq.steps[activeSeq.current_index]) {
        const stepText = activeSeq.steps[activeSeq.current_index];
        stepSequence = {
          id: activeSeq.id,
          taskName: null,
          steps: activeSeq.steps,
          currentIndex: activeSeq.current_index,
          completed: false,
        };
        result = `Current step (${activeSeq.current_index + 1} of ${activeSeq.steps.length}): ${stepText}`;
      } else {
        // No active sequence — get last assistant message
        const messages = conversationState.getSessionMessages(sessionId, 5);
        const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
        result = lastAssistant ? `Last instruction: ${lastAssistant.body}` : 'No previous instruction to repeat.';
      }
    } catch (err) {
      console.error('[agentOrchestrator] Failed to repeat step:', err.message);
      result = 'Unable to repeat the last step';
    }
  } else if (name === 'adjust_vocabulary_level') {
    try {
      userProfileManager.updateProfile(userId, { vocabulary_level: args.new_level });
      result = `Vocabulary level changed to: ${args.new_level}. Reason: ${args.reason}`;
      console.log(`[agentOrchestrator] Vocabulary adjusted to ${args.new_level} for user ${userId}: ${args.reason}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to adjust vocabulary:', err.message);
      result = 'Unable to adjust vocabulary level';
    }
  } else if (name === 'save_note_for_user') {
    try {
      UserNote.create({ user_id: userId, title: args.title, content: args.content });
      result = `Note saved: "${args.title}"`;
      console.log(`[agentOrchestrator] Note saved for user ${userId}: "${args.title}"`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to save note:', err.message);
      result = 'Unable to save note';
    }
  } else if (name === 'get_user_notes') {
    try {
      const notes = UserNote.findByUserId(userId);
      if (notes.length === 0) {
        result = 'No saved notes yet. Notes will be saved as you learn new skills!';
      } else {
        const list = notes.map((n, i) => `${i + 1}. ${n.title}: ${n.content}`).join('\n');
        result = `User has ${notes.length} saved note(s):\n${list}`;
      }
    } catch (err) {
      console.error('[agentOrchestrator] Failed to get notes:', err.message);
      result = 'Unable to retrieve notes';
    }
  } else if (name === 'restart_conversation') {
    try {
      conversationState.closeSession(sessionId);
      endedConversationId = sessionId;
      result = `Conversation restarted. Reason: ${args.reason}. A fresh conversation will begin with the next message.`;
      console.log(`[agentOrchestrator] Conversation restarted for user ${userId}: ${args.reason}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to restart conversation:', err.message);
      result = 'Unable to restart conversation';
    }
  } else if (name === 'save_user_goal') {
    try {
      UserGoal.create({
        user_id: userId,
        goal_text: args.goal_text,
        related_skills: args.related_skills ? JSON.stringify(args.related_skills) : '[]',
      });
      // Also update the user's goal_summary for prompt injection
      User.update(userId, { goal_summary: args.goal_text });
      result = `Goal saved: "${args.goal_text}"`;
      console.log(`[agentOrchestrator] Goal saved for user ${userId}: "${args.goal_text}"`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to save goal:', err.message);
      result = 'Unable to save goal';
    }
  } else if (name === 'schedule_skill_review') {
    try {
      const days = args.days_until_review || 7;
      const dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      SkillReview.create({
        user_id: userId,
        skill_name: args.skill_name,
        review_due_at: dueDate,
      });
      result = `Review scheduled for "${args.skill_name}" in ${days} days`;
      console.log(`[agentOrchestrator] Skill review scheduled for user ${userId}: "${args.skill_name}" in ${days} days`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to schedule review:', err.message);
      result = 'Unable to schedule skill review';
    }
  } else if (name === 'share_progress_with_buddy') {
    try {
      const pairs = BuddyPair.findByUserId(userId);
      if (pairs.length === 0) {
        result = 'User does not have an active buddy. No progress shared.';
      } else {
        for (const pair of pairs) {
          ProgressShare.create({
            user_id: userId,
            buddy_pair_id: pair.id,
            skill_name: args.skill_name,
            message: args.celebration_message,
          });
        }
        const buddyName = pairs[0].learner_id === userId ? pairs[0].helper_name : pairs[0].learner_name;
        result = `Progress shared with ${buddyName || 'your buddy'}! They'll see: "${args.celebration_message}"`;
        console.log(`[agentOrchestrator] Progress shared for user ${userId}: "${args.skill_name}"`);
      }
    } catch (err) {
      console.error('[agentOrchestrator] Failed to share progress:', err.message);
      result = 'Unable to share progress with buddy';
    }
  } else if (name === 'ask_buddy_for_help') {
    try {
      const pairs = BuddyPair.findByUserId(userId);
      if (pairs.length === 0) {
        result = 'User does not have an active buddy. Cannot send help request.';
      } else {
        const pair = pairs[0];
        HelpRequest.create({
          learner_id: userId,
          buddy_pair_id: pair.id,
          question: args.question,
          context_summary: args.context_summary || null,
        });
        const buddyName = pair.learner_id === userId ? pair.helper_name : pair.learner_name;
        result = `Help request sent to ${buddyName || 'your buddy'}! They'll reply when they can. In the meantime, we can try something else or keep working on this.`;
        console.log(`[agentOrchestrator] Help request sent for user ${userId}: "${args.question}"`);
      }
    } catch (err) {
      console.error('[agentOrchestrator] Failed to send help request:', err.message);
      result = 'Unable to send help request to buddy';
    }
  } else if (name === 'analyze_scam_situation') {
    try {
      const redFlags = args.red_flags_found || [];
      const riskLevel = args.risk_level || 'medium';

      // Look up verification contact from the scam knowledge base
      let verificationInfo = args.verification_contact || '';
      if (args.claimed_organization) {
        const orgKey = Object.keys(scamKnowledge.verification_contacts).find(
          k => k.toLowerCase().includes(args.claimed_organization.toLowerCase()) ||
               args.claimed_organization.toLowerCase().includes(k.toLowerCase())
        );
        if (orgKey) {
          const contact = scamKnowledge.verification_contacts[orgKey];
          const parts = [];
          if (contact.phone) parts.push(`Phone: ${contact.phone}`);
          if (contact.website) parts.push(`Website: ${contact.website}`);
          verificationInfo = `Official ${orgKey} contact — ${parts.join(', ')}`;
        }
      }

      // Always include general reporting contacts
      const reportingContacts = [
        `FTC Fraud Report: ${scamKnowledge.verification_contacts['FTC (report scams)'].website}`,
        `National Elder Fraud Hotline: ${scamKnowledge.verification_contacts['National Elder Fraud Hotline'].phone}`,
      ].join('; ');

      // Log the analysis for accuracy review
      ScamCheckEvent.create({
        user_id: userId,
        conversation_id: sessionId,
        situation_summary: args.situation_summary,
        claimed_organization: args.claimed_organization || null,
        red_flags: redFlags,
        risk_level: riskLevel,
        recommended_action: args.recommended_action,
        verification_contact: verificationInfo,
      });

      // Build the structured result for Claude to relay
      const flagList = redFlags.map((f, i) => `${i + 1}. ${f}`).join('\n');
      const riskEmoji = riskLevel === 'high' ? 'HIGH RISK' : riskLevel === 'medium' ? 'MEDIUM RISK' : 'LOW RISK — but still verify';

      result = `SCAM ANALYSIS COMPLETE

Risk Level: ${riskEmoji}

Red Flags Found (${redFlags.length}):
${flagList || 'None identified — but always verify through official channels.'}

Recommended Action: ${args.recommended_action}

${verificationInfo ? `How to Verify: ${verificationInfo}` : ''}

To report a scam: ${reportingContacts}

IMPORTANT RULES FOR YOUR RESPONSE:
- Present the red flags as a numbered list the user can understand
- Use simple, non-technical language
- If risk is high, be DIRECT: "This has serious warning signs of a scam."
- NEVER say "it's safe" or "don't worry about it" — always recommend verification
- Include the verification phone number prominently
- Remind them: "No real company ever asks for gift cards or threatens to arrest you over the phone"`;

      console.log(`[agentOrchestrator] Scam analysis for user ${userId}: ${riskLevel} risk — ${redFlags.length} red flags`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to analyze scam situation:', err.message);
      result = 'Unable to complete scam analysis. If you are unsure about a call or email, hang up and call the company directly using a number you trust (like the number on their website or on the back of your card).';
    }
  // Desktop Diagnostic Tool Handlers
  } else if (name === 'get_system_info') {
    try {
      result = systemDiagnostics.getSystemInfo();
      console.log(`[agentOrchestrator] System info retrieved for user ${userId}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to get system info:', err.message);
      result = 'Unable to retrieve system information. The diagnostic tools may not be available in this environment.';
    }
  } else if (name === 'check_network') {
    try {
      result = systemDiagnostics.checkNetwork();
      console.log(`[agentOrchestrator] Network check for user ${userId}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to check network:', err.message);
      result = 'Unable to check network status.';
    }
  } else if (name === 'list_running_apps') {
    try {
      result = systemDiagnostics.listRunningApps();
      console.log(`[agentOrchestrator] Listed running apps for user ${userId}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to list running apps:', err.message);
      result = 'Unable to list running applications.';
    }
  } else if (name === 'read_error_log') {
    try {
      result = systemDiagnostics.readErrorLog(args.source);
      console.log(`[agentOrchestrator] Read error log (${args.source || 'system'}) for user ${userId}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to read error log:', err.message);
      result = 'Unable to read error logs.';
    }
  } else if (name === 'run_safe_command') {
    try {
      console.log(`[agentOrchestrator] Safe command requested by AI for user ${userId}: "${args.command}" — Reason: ${args.reason}`);
      result = systemDiagnostics.runSafeCommand(args.command);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to run safe command:', err.message);
      result = 'Unable to run command.';
    }
  } else if (name === 'check_disk_health') {
    try {
      result = systemDiagnostics.checkDiskHealth();
      console.log(`[agentOrchestrator] Disk health check for user ${userId}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to check disk health:', err.message);
      result = 'Unable to check disk health.';
    }
  } else if (name === 'check_installed_software') {
    try {
      result = systemDiagnostics.checkInstalledSoftware(args.search_term);
      console.log(`[agentOrchestrator] Software check for user ${userId}: ${args.search_term || 'all'}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to check installed software:', err.message);
      result = 'Unable to check installed software.';
    }
  } else if (name === 'get_battery_status') {
    try {
      result = systemDiagnostics.getBatteryStatus();
      console.log(`[agentOrchestrator] Battery status for user ${userId}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to get battery status:', err.message);
      result = 'Unable to check battery status.';
    }
  } else if (name === 'find_youtube_videos') {
    try {
      const max = Math.min(args.max_results || 3, 5);
      console.log(`[agentOrchestrator] YouTube search: "${args.query}" (max: ${max}) for user ${userId}`);
      const videos = await youtubeSearch.searchVideos(args.query, max);
      result = 'YOUTUBE_VIDEOS:' + JSON.stringify(videos);
    } catch (err) {
      console.error('[agentOrchestrator] YouTube search failed:', err.message);
      result = 'Unable to search YouTube right now.';
    }
  } else {
    result = `Unknown function: ${name}`;
  }

  return { result, safetyAlert, guideId, stepSequence, endedConversationId };
}

function extractTextFromContent(content) {
  for (const block of content) {
    if (block.type === 'text') return block.text;
  }
  return '';
}

function hasToolUse(content) {
  return content.some(block => block.type === 'tool_use');
}

async function processMessage(text, userId) {
  try {
    // Step 1: Safety check
    const safetyCheck = safetyMonitor.checkMessage(text, userId);
    if (!safetyCheck.safe) {
      return { response: safetyCheck.response, safetyAlert: { type: safetyCheck.type }, guideId: null, stepSequence: null };
    }

    // Step 2: Get user
    const user = userProfileManager.getOrCreateUser(userId);

    // Mock mode: skip Claude API, use pre-written responses
    if (!anthropicApiKey || process.env.MOCK_MODE === 'true') {
      const mockResponder = require('./mockResponder');
      const session = conversationState.getOrCreateSession(userId);
      return mockResponder.respond(text, userId, session.id);
    }

    // Step 3: Get/create session
    const session = conversationState.getOrCreateSession(userId);
    const sessionId = session.id;

    // Step 4: Save user message
    conversationState.addMessage(sessionId, 'user', text);

    // Step 5: Load history
    const dbMessages = conversationState.getSessionMessages(sessionId, 20);
    const messages = dbMessages.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.body }));

    // Step 6: Classify + build prompt in parallel
    const [profileString, classification] = await Promise.all([
      Promise.resolve(userProfileManager.getProfileForPrompt(userId)),
      taskClassifier.classifyMessage(text, user),
    ]);

    try {
      Conversation.update(sessionId, { task_type: classification.taskType });
    } catch (err) {
      console.error('[agentOrchestrator] Failed to update task_type:', err.message);
    }

    // Get confusion state for this conversation to inject into the prompt
    const confusionCtx = qualityTracker.getConfusionState(sessionId);

    // Step 6b: Match against skill definitions for context injection
    const skillMatch = skillMatcher.matchSkill(text);
    const matchedSkillPrompt = skillMatch ? skillMatcher.buildSkillPrompt(skillMatch.skill) : null;
    const matchedSkillId = skillMatch ? skillMatch.skill.id : null;
    if (skillMatch) {
      console.log(`[agentOrchestrator] Skill matched: "${skillMatch.skill.name}" (score: ${skillMatch.score}) for user ${userId}`);
    }

    const systemPrompt = buildSystemPrompt(profileString, user, classification, confusionCtx, matchedSkillPrompt);

    // Step 7: Call Claude with tool-use loop
    let safetyAlert = null;
    let guideId = null;
    let stepSequence = null;
    let endedConversationId = null;
    let finalTextResponse = '';

    try {
      let response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools,
      });

      let toolRounds = 0;
      while (hasToolUse(response.content) && toolRounds < MAX_TOOL_ROUNDS) {
        toolRounds += 1;

        // Process tool calls
        const toolResults = [];
        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;
          const { result: fcResult, safetyAlert: alert, guideId: fcGuideId, stepSequence: fcStep, endedConversationId: fcEnded } =
            await handleFunctionCall(block.name, block.input, userId, sessionId);
          if (alert) safetyAlert = alert;
          if (fcGuideId) guideId = fcGuideId;
          if (fcStep) stepSequence = fcStep;
          if (fcEnded) endedConversationId = fcEnded;
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: fcResult });
        }

        // Send tool results back to Claude
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });

        response = await client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages,
          tools,
        });
      }

      if (toolRounds >= MAX_TOOL_ROUNDS) {
        console.error(`[agentOrchestrator] Tool loop hit max (${MAX_TOOL_ROUNDS}) for user ${userId}`);
      }

      finalTextResponse = extractTextFromContent(response.content);
    } catch (err) {
      console.error('[agentOrchestrator] Claude API error:', err.message);
      return { response: FALLBACK_RESPONSE, safetyAlert: null, guideId: null, stepSequence: null };
    }

    // Step 8: Filter response
    const vocabLevel = user.vocabulary_level || 'basic';
    let filteredResponse = vocabularyFilter.filterResponse(finalTextResponse, vocabLevel);
    filteredResponse = vocabularyFilter.enforceReadability(filteredResponse);

    if (!filteredResponse) {
      return { response: FALLBACK_RESPONSE, safetyAlert, guideId, stepSequence, endedConversationId, conversationId: sessionId };
    }

    // Step 9: Save assistant message
    conversationState.addMessage(sessionId, 'assistant', filteredResponse);

    // Step 10: Quality tracking (non-blocking — never delays response)
    try {
      const allMessages = conversationState.getSessionMessages(sessionId, 50);
      const turnNumber = allMessages.filter(m => m.role === 'assistant').length;
      qualityTracker.trackTurn({
        userId,
        conversationId: sessionId,
        userMessage: text,
        agentResponse: filteredResponse,
        vocabLevel: user.vocabulary_level || 'basic',
        osType: user.os_type || '',
        turnNumber,
      });
    } catch (trackErr) {
      console.error('[agentOrchestrator] Quality tracking error (non-fatal):', trackErr.message);
    }

    return { response: filteredResponse, safetyAlert, guideId, stepSequence, endedConversationId, conversationId: sessionId, matchedSkillId: matchedSkillId || guideId, userOsType: user?.os_type };
  } catch (err) {
    console.error('[agentOrchestrator] Unexpected error:', err.message);
    return { response: FALLBACK_RESPONSE, safetyAlert: null, guideId: null, stepSequence: null, endedConversationId: null, conversationId: null };
  }
}

module.exports = { processMessage };
