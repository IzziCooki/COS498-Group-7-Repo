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

let startActiveObservation;
try {
  startActiveObservation = require('@langfuse/tracing').startActiveObservation;
} catch {
  // Langfuse not available — use passthrough
  startActiveObservation = async (_name, fn) => fn({ update: () => {} });
}

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
];

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
- suggest_next_skill: Recommend what to learn next based on skill history.
- repeat_last_step: Repeat the current instruction without advancing.
- adjust_vocabulary_level: Change language simplification if user seems confused or confident.
- save_note_for_user: Save a tip the user can reference later.
- get_user_notes: Show the user's saved notes and tips.
- restart_conversation: Start a fresh conversation when user is lost.

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
      await startActiveObservation('pc-pal-agent-turn', async (trace) => {
        trace.update({
          input: text,
          metadata: { userId, sessionId, taskType: classification?.taskType, topic: classification?.topic },
        });

        let response = await startActiveObservation('claude-chat', async (span) => {
          span.update({
            input: JSON.stringify(messages.slice(-2)),
            metadata: { model: CLAUDE_MODEL, round: 0 },
          });

          const res = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            system: systemPrompt,
            messages,
            tools,
          });

          span.update({
            output: JSON.stringify(res.content),
            usage: {
              input_tokens: res.usage?.input_tokens,
              output_tokens: res.usage?.output_tokens,
            },
          });

          return res;
        });

        let toolRounds = 0;
        while (hasToolUse(response.content) && toolRounds < MAX_TOOL_ROUNDS) {
          toolRounds += 1;

          const toolResults = [];
          for (const block of response.content) {
            if (block.type !== 'tool_use') continue;

            await startActiveObservation(`tool-${block.name}`, async (toolSpan) => {
              toolSpan.update({ input: JSON.stringify(block.input) });

              const { result: fcResult, safetyAlert: alert, guideId: fcGuideId, stepSequence: fcStep } =
                handleFunctionCall(block.name, block.input, userId, sessionId);

              if (alert) safetyAlert = alert;
              if (fcGuideId) guideId = fcGuideId;
              if (fcStep) stepSequence = fcStep;

              toolSpan.update({ output: fcResult });
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: fcResult });
            });
          }

          messages.push({ role: 'assistant', content: response.content });
          messages.push({ role: 'user', content: toolResults });

          response = await startActiveObservation('claude-chat', async (span) => {
            span.update({
              metadata: { model: CLAUDE_MODEL, round: toolRounds },
            });

            const res = await client.messages.create({
              model: CLAUDE_MODEL,
              max_tokens: 1024,
              system: systemPrompt,
              messages,
              tools,
            });

            span.update({
              output: JSON.stringify(res.content),
              usage: {
                input_tokens: res.usage?.input_tokens,
                output_tokens: res.usage?.output_tokens,
              },
            });

            return res;
          });
        }

        if (toolRounds >= MAX_TOOL_ROUNDS) {
          console.error(`[agentOrchestrator] Tool loop hit max (${MAX_TOOL_ROUNDS}) for user ${userId}`);
        }

        finalTextResponse = extractTextFromContent(response.content);

        trace.update({
          output: finalTextResponse,
          metadata: { toolRounds },
        });
      });
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
