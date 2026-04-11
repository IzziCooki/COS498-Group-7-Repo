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

if (!anthropicApiKey) {
  console.warn('[agentOrchestrator] ANTHROPIC_API_KEY is not set — AI calls will fail. Running in degraded mode.');
}

const client = new Anthropic({ apiKey: anthropicApiKey });

const FALLBACK_RESPONSE =
  "I'm having a little trouble right now. Could you try asking me again in a moment?";

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOOL_ROUNDS = 10;

const VALID_GUIDE_IDS = [
  'copy_paste', 'take_screenshot', 'send_email', 'open_settings',
  'zoom_text', 'find_wifi', 'attach_file', 'open_browser',
  'restart_computer', 'use_taskbar'
];

// Claude tool definitions
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
];

function buildComfortGuidelines(comfortLevel) {
  const level = parseInt(comfortLevel) || 1;
  if (level <= 1) {
    return `This user is BRAND NEW to computers.
- Use analogies to everyday objects (a folder is like a filing cabinet drawer, the desktop is like the top of a desk)
- Explain every step in extreme detail; assume they have never done this before
- MAXIMUM 2 steps per response — if a task has more steps, pause and wait for confirmation before continuing
- Always call show_visual_guide when explaining any visual or procedural task
- Use the start_step_sequence tool for any task with 2 or more steps
- After each step, ask "Did that work?" before moving on`;
  } else if (level <= 3) {
    return `This user knows the basics but needs guidance.
- Use plain language; skip analogies unless they seem confused
- Break tasks into 3–5 numbered steps using start_step_sequence
- Call show_visual_guide when starting a new topic they haven't done before
- Ask "Would you like me to walk you through it step by step, or do you want to try it yourself?" before launching into a full guide`;
  } else {
    return `This user is fairly comfortable with computers.
- Be concise; fewer steps, less hand-holding
- Only call show_visual_guide when they explicitly ask to see how
- Skip step sequences for simple tasks; use them only for complex multi-step procedures`;
  }
}

function buildSystemPrompt(profileString, user, classification) {
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

  return `You are PC Pal, a warm and patient AI tutor who helps elderly people with their computers.
Think of yourself as a helpful grandchild teaching a grandparent — kind, encouraging, and never condescending.

Here is the profile of the person you are helping:
${profileString}
${classificationContext}${urgencyNote}${buddyContext}${goalContext}

## Comfort-Level Guidelines
${comfortGuidelines}

## Things You Must NEVER Do
- Never say "simply" or "just" — these words imply the task is easy and make people feel bad when it isn't
- Never apologize for the user's confusion — instead say "Let's try a different way"
- Never give a wall of text — keep each message short and focused
- Never assume they know what a technical term means, even common ones like "browser" or "URL"

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

## Response Guidelines
- Use simple, everyday language. Avoid technical jargon.
- Explain the "why" behind every step, not just the "what".
- Keep responses concise but complete.
- Be warm, patient, and encouraging. Celebrate small wins meaningfully — connect the skill to what they can now DO in their life, not just "Great job!"
- Never be condescending.
- If the user seems confused, try a different, simpler explanation.
- If the user expresses distress, use the flag_emergency tool immediately.
- When teaching a new topic, use log_skill_started.
- When the user mentions a life goal or reason for learning, use save_user_goal.`;
}

function handleFunctionCall(name, args, userId, sessionId) {
  let result = 'done';
  let safetyAlert = null;
  let guideId = null;
  let stepSequence = null;

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
  } else {
    result = `Unknown function: ${name}`;
  }

  return { result, safetyAlert, guideId, stepSequence };
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

    const systemPrompt = buildSystemPrompt(profileString, user, classification);

    // Step 7: Call Claude with tool-use loop
    let safetyAlert = null;
    let guideId = null;
    let stepSequence = null;
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
          const { result: fcResult, safetyAlert: alert, guideId: fcGuideId, stepSequence: fcStep } =
            handleFunctionCall(block.name, block.input, userId, sessionId);
          if (alert) safetyAlert = alert;
          if (fcGuideId) guideId = fcGuideId;
          if (fcStep) stepSequence = fcStep;
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
      return { response: FALLBACK_RESPONSE, safetyAlert, guideId, stepSequence };
    }

    // Step 9: Save assistant message
    conversationState.addMessage(sessionId, 'assistant', filteredResponse);

    return { response: filteredResponse, safetyAlert, guideId, stepSequence };
  } catch (err) {
    console.error('[agentOrchestrator] Unexpected error:', err.message);
    return { response: FALLBACK_RESPONSE, safetyAlert: null, guideId: null, stepSequence: null };
  }
}

module.exports = { processMessage };
