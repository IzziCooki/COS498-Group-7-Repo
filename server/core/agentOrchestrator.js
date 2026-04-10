const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiApiKey } = require('../config');
const safetyMonitor = require('./safetyMonitor');
const conversationState = require('./conversationState');
const vocabularyFilter = require('./vocabularyFilter');
const userProfileManager = require('./userProfileManager');
const taskClassifier = require('./taskClassifier');
const SkillEvent = require('../models/SkillEvent');
const SafetyEvent = require('../models/SafetyEvent');
const StepSequence = require('../models/StepSequence');
const Conversation = require('../models/Conversation');

if (!geminiApiKey) {
  console.warn('[agentOrchestrator] GEMINI_API_KEY is not set — AI calls will fail. Running in degraded mode.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

const FALLBACK_RESPONSE =
  "I'm having a little trouble right now. Could you try asking me again in a moment?";

const GEMINI_MODEL = 'gemini-2.5-flash';

const MAX_TOOL_ROUNDS = 10;

const VALID_GUIDE_IDS = [
  'copy_paste', 'take_screenshot', 'send_email', 'open_settings',
  'zoom_text', 'find_wifi', 'attach_file', 'open_browser',
  'restart_computer', 'use_taskbar'
];

// Gemini function declarations (equivalent to Claude tools)
const toolDeclarations = [
  {
    name: 'log_skill_started',
    description: 'Log that the user has started learning a new skill. Call this when you begin teaching a new topic.',
    parameters: {
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
    parameters: {
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
    parameters: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'ID of the task guide. Valid: copy_paste, take_screenshot, send_email, open_settings, zoom_text, find_wifi, attach_file, open_browser, restart_computer, use_taskbar'
        }
      },
      required: ['task_id']
    }
  },
  {
    name: 'start_step_sequence',
    description: 'Start a numbered step-by-step sequence for a multi-step task. The steps will appear in the chat with a progress indicator and quick-reply buttons.',
    parameters: {
      type: 'object',
      properties: {
        task_name: { type: 'string', description: 'Short name for the task (e.g. "Send an Email")' },
        steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of step descriptions in plain English, one sentence each'
        }
      },
      required: ['task_name', 'steps']
    }
  },
  {
    name: 'advance_step',
    description: 'Move to the next step when the user confirms they completed the current step (says "done", "ok", "got it", "next", etc.)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'complete_step_sequence',
    description: 'Mark the current step sequence as fully completed. Call this when the user has finished all steps successfully.',
    parameters: {
      type: 'object',
      properties: {
        skill_name: { type: 'string', description: 'Name of the skill that was completed' }
      },
      required: ['skill_name']
    }
  }
];

/**
 * Build comfort-level-specific guidelines for the system prompt.
 * @param {number|string} comfortLevel
 * @returns {string}
 */
function buildComfortGuidelines(comfortLevel) {
  const level = parseInt(comfortLevel) || 1;
  if (level <= 1) {
    return `This user is BRAND NEW to computers.
- Use analogies to everyday objects (a folder is like a filing cabinet drawer)
- Explain every step in extreme detail; assume they have never done this before
- Always call show_visual_guide when explaining any visual or procedural task
- Use the start_step_sequence tool for any task with 2 or more steps`;
  } else if (level <= 3) {
    return `This user knows the basics but needs guidance.
- Use plain language; skip analogies unless they seem confused
- Break tasks into 3–5 numbered steps using start_step_sequence
- Call show_visual_guide when starting a new topic they haven't done before`;
  } else {
    return `This user is fairly comfortable with computers.
- Be concise; fewer steps, less hand-holding
- Only call show_visual_guide when they explicitly ask to see how
- Skip step sequences for simple tasks; use them only for complex multi-step procedures`;
  }
}

/**
 * Build a personalized system prompt using a pre-fetched profile string.
 * @param {string} profileString
 * @param {object} user
 * @param {object|null} classification
 * @returns {string}
 */
function buildSystemPrompt(profileString, user, classification) {
  const comfortGuidelines = buildComfortGuidelines(user?.comfort_level);
  const classificationContext = classification
    ? `\nCurrent task: ${classification.taskType} — ${classification.topic} (urgency: ${classification.urgency})`
    : '';
  const urgencyNote = classification?.urgency === 'high'
    ? '\nIMPORTANT: This user has an urgent problem. Prioritize a quick, direct solution.'
    : '';

  return `You are PC Pal, a warm and patient AI tutor who helps elderly people with their computers.
Think of yourself as a helpful grandchild teaching a grandparent — kind, encouraging, and never condescending.

Here is the profile of the person you are helping:
${profileString}
${classificationContext}${urgencyNote}

## Comfort-Level Guidelines
${comfortGuidelines}

## Tools Available
- show_visual_guide: Display a visual step-by-step guide card. Call this BEFORE giving text instructions for visual/procedural tasks. Valid task IDs: ${VALID_GUIDE_IDS.join(', ')}
- start_step_sequence: Start a numbered walkthrough for multi-step tasks. Provide a task name and array of step descriptions.
- advance_step: Move to next step when user confirms (says "done", "ok", "got it", "next", etc.)
- complete_step_sequence: Mark all steps as done. Also logs the skill as completed.
- log_skill_started: Log when you begin teaching a new skill.
- flag_emergency: Flag emergencies (falls, injuries, medical concerns).

## Response Guidelines
- Use simple, everyday language. Avoid technical jargon.
- Explain the "why" behind every step, not just the "what".
- Keep responses concise but complete.
- Be warm, patient, and encouraging. Celebrate small wins.
- Never be condescending.
- If the user seems confused, try a different, simpler explanation.
- If the user expresses distress, use the flag_emergency tool immediately.
- When teaching a new topic, use log_skill_started.`;
}

/**
 * Handle a function call from Gemini.
 * @param {string} name - function name
 * @param {object} args - function arguments
 * @param {string} userId
 * @param {string} sessionId
 * @returns {{ result: string, safetyAlert: object|null, guideId: string|null, stepSequence: object|null }}
 */
async function handleFunctionCall(name, args, userId, sessionId) {
  let result = 'done';
  let safetyAlert = null;
  let guideId = null;
  let stepSequence = null;

  if (name === 'log_skill_started') {
    try {
      SkillEvent.create({
        user_id: userId,
        skill_name: args.skill_name,
        status: 'started',
      });
      result = `Logged skill started: ${args.skill_name}`;
      console.log(`[agentOrchestrator] Skill started logged: "${args.skill_name}" for user ${userId}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to log skill_started event:', err.message);
      result = 'Failed to log skill event';
    }
  } else if (name === 'flag_emergency') {
    try {
      const event = SafetyEvent.create({
        user_id: userId,
        event_type: 'emergency',
        trigger_text: args.reason,
      });
      safetyAlert = { type: 'emergency', reason: args.reason, eventId: event ? event.id : null };
      result = `Emergency flagged: ${args.reason}`;
      console.warn(`[agentOrchestrator] Emergency flagged for user ${userId}: ${args.reason}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to log flag_emergency event:', err.message);
      result = 'Failed to log emergency event';
    }
  } else if (name === 'show_visual_guide') {
    const taskId = args.task_id;
    if (VALID_GUIDE_IDS.includes(taskId)) {
      guideId = taskId;
      result = `Visual guide displayed for: ${taskId}`;
      console.log(`[agentOrchestrator] Visual guide shown: "${taskId}" for user ${userId}`);
    } else {
      result = `Unknown guide ID: ${taskId}. Valid IDs are: ${VALID_GUIDE_IDS.join(', ')}`;
      console.warn(`[agentOrchestrator] Invalid guide ID requested: "${taskId}"`);
    }
  } else if (name === 'start_step_sequence') {
    try {
      const seq = StepSequence.create({
        conversation_id: sessionId,
        steps: args.steps,
        current_index: 0,
      });
      stepSequence = {
        id: seq.id,
        taskName: args.task_name,
        steps: seq.steps,
        currentIndex: 0,
        completed: false,
      };
      result = `Step sequence started: "${args.task_name}" with ${args.steps.length} steps`;
      console.log(`[agentOrchestrator] Step sequence started: "${args.task_name}" for session ${sessionId}`);
    } catch (err) {
      console.error('[agentOrchestrator] Failed to create step sequence:', err.message);
      result = 'Failed to start step sequence';
    }
  } else if (name === 'advance_step') {
    try {
      const sequences = StepSequence.findByConversationId(sessionId);
      const activeSeq = sequences.filter(s => !s.completed).pop();
      if (activeSeq) {
        const newIndex = activeSeq.current_index + 1;
        const updated = StepSequence.update(activeSeq.id, { current_index: newIndex });
        stepSequence = {
          id: updated.id,
          taskName: null,
          steps: updated.steps,
          currentIndex: updated.current_index,
          completed: updated.completed === 1 || updated.completed === true,
        };
        result = `Advanced to step ${newIndex + 1}`;
        console.log(`[agentOrchestrator] Step advanced to index ${newIndex} for session ${sessionId}`);
      } else {
        result = 'No active step sequence found';
        console.warn(`[agentOrchestrator] advance_step called but no active sequence for session ${sessionId}`);
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
        stepSequence = {
          id: updated.id,
          taskName: null,
          steps: updated.steps,
          currentIndex: updated.current_index,
          completed: true,
        };
        // Log the skill as completed
        try {
          SkillEvent.create({
            user_id: userId,
            skill_name: args.skill_name,
            status: 'completed',
          });
        } catch (skillErr) {
          console.error('[agentOrchestrator] Failed to log skill completion event:', skillErr.message);
        }
        result = `Step sequence completed: "${args.skill_name}"`;
        console.log(`[agentOrchestrator] Step sequence completed: "${args.skill_name}" for session ${sessionId}`);
      } else {
        result = 'No active step sequence found to complete';
        console.warn(`[agentOrchestrator] complete_step_sequence called but no active sequence for session ${sessionId}`);
      }
    } catch (err) {
      console.error('[agentOrchestrator] Failed to complete step sequence:', err.message);
      result = 'Failed to complete step sequence';
    }
  } else {
    console.warn(`[agentOrchestrator] Unknown function called: ${name}`);
    result = `Unknown function: ${name}`;
  }

  return { result, safetyAlert, guideId, stepSequence };
}

/**
 * The main entry point for the agent orchestrator.
 * Processes a user message and returns an AI response.
 *
 * @param {string} text    The user's message
 * @param {string} userId  The user's ID
 * @returns {Promise<{ response: string, safetyAlert: object|null, guideId: string|null, stepSequence: object|null }>}
 */
async function processMessage(text, userId) {
  try {
    // Step 1: Safety check — short-circuit if unsafe
    const safetyCheck = safetyMonitor.checkMessage(text, userId);
    if (!safetyCheck.safe) {
      return { response: safetyCheck.response, safetyAlert: { type: safetyCheck.type }, guideId: null, stepSequence: null };
    }

    // Step 2: Ensure the user exists in the DB
    const user = userProfileManager.getOrCreateUser(userId);

    // Step 3: Get or create conversation session
    const session = conversationState.getOrCreateSession(userId);
    const sessionId = session.id;

    // Step 4: Persist the incoming user message
    conversationState.addMessage(sessionId, 'user', text);

    // Step 5: Load recent conversation history (last 20 messages)
    const dbMessages = conversationState.getSessionMessages(sessionId, 20);

    // Step 6: Convert DB messages to Gemini's history format
    // Gemini uses 'user' and 'model' roles (not 'assistant')
    const history = dbMessages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.body }],
    }));

    // Step 7: Build profile string and classify message in parallel
    const [profileString, classification] = await Promise.all([
      Promise.resolve(userProfileManager.getProfileForPrompt(userId)),
      taskClassifier.classifyMessage(text, user),
    ]);

    // Step 7b: Update conversation's task_type with classification result
    try {
      Conversation.update(sessionId, { task_type: classification.taskType });
    } catch (err) {
      console.error('[agentOrchestrator] Failed to update conversation task_type:', err.message);
    }

    // Step 7c: Build system prompt with user and classification context
    const systemPrompt = buildSystemPrompt(profileString, user, classification);

    // Step 8: Create Gemini chat and send message
    let safetyAlert = null;
    let guideId = null;
    let stepSequence = null;
    let finalTextResponse = '';

    try {
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: toolDeclarations }],
      });

      const chat = model.startChat({ history });

      let response = await chat.sendMessage(text);
      let result = response.response;

      // Step 9: Handle function calls in a loop
      let toolRounds = 0;
      while (toolRounds < MAX_TOOL_ROUNDS) {
        const functionCalls = result.functionCalls();
        if (!functionCalls || functionCalls.length === 0) break;

        toolRounds += 1;

        // Process each function call
        const functionResponses = [];
        for (const fc of functionCalls) {
          const {
            result: fcResult,
            safetyAlert: alert,
            guideId: fcGuideId,
            stepSequence: fcStepSequence,
          } = await handleFunctionCall(fc.name, fc.args, userId, sessionId);

          if (alert) safetyAlert = alert;
          if (fcGuideId) guideId = fcGuideId;
          if (fcStepSequence) stepSequence = fcStepSequence;

          functionResponses.push({
            functionResponse: {
              name: fc.name,
              response: { result: fcResult },
            },
          });
        }

        // Send function results back to Gemini
        response = await chat.sendMessage(functionResponses);
        result = response.response;
      }

      if (toolRounds >= MAX_TOOL_ROUNDS) {
        console.error(`[agentOrchestrator] Tool-use loop hit MAX_TOOL_ROUNDS (${MAX_TOOL_ROUNDS}) for user ${userId}`);
      }

      finalTextResponse = result.text() || '';
    } catch (err) {
      console.error('[agentOrchestrator] Gemini API error:', err.message);
      return { response: FALLBACK_RESPONSE, safetyAlert: null, guideId: null, stepSequence: null };
    }

    // Step 10: Apply vocabulary and readability filters
    const vocabLevel = user.vocabulary_level || 'basic';
    let filteredResponse = vocabularyFilter.filterResponse(finalTextResponse, vocabLevel);
    filteredResponse = vocabularyFilter.enforceReadability(filteredResponse);

    // Guard against empty response
    if (!filteredResponse) {
      return { response: FALLBACK_RESPONSE, safetyAlert, guideId, stepSequence };
    }

    // Step 11: Persist the assistant's response
    conversationState.addMessage(sessionId, 'assistant', filteredResponse);

    return { response: filteredResponse, safetyAlert, guideId, stepSequence };
  } catch (err) {
    console.error('[agentOrchestrator] Unexpected error in processMessage:', err.message);
    return { response: FALLBACK_RESPONSE, safetyAlert: null, guideId: null, stepSequence: null };
  }
}

module.exports = { processMessage };
