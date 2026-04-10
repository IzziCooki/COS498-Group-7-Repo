const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiApiKey } = require('../config');
const safetyMonitor = require('./safetyMonitor');
const conversationState = require('./conversationState');
const vocabularyFilter = require('./vocabularyFilter');
const userProfileManager = require('./userProfileManager');
const SkillEvent = require('../models/SkillEvent');
const SafetyEvent = require('../models/SafetyEvent');

if (!geminiApiKey) {
  console.warn('[agentOrchestrator] GEMINI_API_KEY is not set — AI calls will fail. Running in degraded mode.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

const FALLBACK_RESPONSE =
  "I'm having a little trouble right now. Could you try asking me again in a moment?";

const GEMINI_MODEL = 'gemini-2.5-flash';

const MAX_TOOL_ROUNDS = 10;

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
];

/**
 * Build a personalized system prompt using a pre-fetched profile string.
 * @param {string} profileString
 * @returns {string}
 */
function buildSystemPrompt(profileString) {
  return `You are PC Pal, a warm and patient AI tutor who helps elderly people with their computers.
Think of yourself as a helpful grandchild teaching a grandparent — kind, encouraging, and never condescending.

Here is the profile of the person you are helping:
${profileString}

Guidelines for every response:
- Use simple, everyday language. Avoid technical jargon. If you must use a technical term, explain it immediately in plain words.
- Explain the "why" behind every step, not just the "what". Help the user understand, not just follow instructions.
- Keep responses concise but complete. Do not overwhelm with too much text at once.
- Present instructions one or two steps at a time, then wait for the user to confirm before continuing.
- Be warm, patient, and encouraging. Celebrate small wins.
- Never be condescending or make the user feel bad for not knowing something.
- If the user seems confused, try a different, simpler explanation.
- If the user expresses distress, mentions a fall, injury, or any medical concern, immediately use the flag_emergency tool.
- When you begin teaching a new topic or skill, use the log_skill_started tool.`;
}

/**
 * Handle a function call from Gemini.
 * @param {string} name - function name
 * @param {object} args - function arguments
 * @param {string} userId
 * @returns {{ result: string, safetyAlert: object|null }}
 */
function handleFunctionCall(name, args, userId) {
  let result = 'done';
  let safetyAlert = null;

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
  } else {
    console.warn(`[agentOrchestrator] Unknown function called: ${name}`);
    result = `Unknown function: ${name}`;
  }

  return { result, safetyAlert };
}

/**
 * The main entry point for the agent orchestrator.
 * Processes a user message and returns an AI response.
 *
 * @param {string} text    The user's message
 * @param {string} userId  The user's ID
 * @returns {Promise<{ response: string, safetyAlert: object|null }>}
 */
async function processMessage(text, userId) {
  try {
    // Step 1: Safety check — short-circuit if unsafe
    const safetyCheck = safetyMonitor.checkMessage(text, userId);
    if (!safetyCheck.safe) {
      return { response: safetyCheck.response, safetyAlert: { type: safetyCheck.type } };
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

    // Step 7: Build system prompt
    const profileString = userProfileManager.getProfileForPrompt(userId, user);
    const systemPrompt = buildSystemPrompt(profileString);

    // Step 8: Create Gemini chat and send message
    let safetyAlert = null;
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
          const { result: fcResult, safetyAlert: alert } = handleFunctionCall(fc.name, fc.args, userId);
          if (alert) safetyAlert = alert;
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
      return { response: FALLBACK_RESPONSE, safetyAlert: null };
    }

    // Step 10: Apply vocabulary and readability filters
    const vocabLevel = user.vocabulary_level || 'basic';
    let filteredResponse = vocabularyFilter.filterResponse(finalTextResponse, vocabLevel);
    filteredResponse = vocabularyFilter.enforceReadability(filteredResponse);

    // Guard against empty response
    if (!filteredResponse) {
      return { response: FALLBACK_RESPONSE, safetyAlert };
    }

    // Step 11: Persist the assistant's response
    conversationState.addMessage(sessionId, 'assistant', filteredResponse);

    return { response: filteredResponse, safetyAlert };
  } catch (err) {
    console.error('[agentOrchestrator] Unexpected error in processMessage:', err.message);
    return { response: FALLBACK_RESPONSE, safetyAlert: null };
  }
}

module.exports = { processMessage };
