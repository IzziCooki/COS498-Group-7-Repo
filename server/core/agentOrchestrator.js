const Anthropic = require('@anthropic-ai/sdk');
const { anthropicApiKey } = require('../config');
const safetyMonitor = require('./safetyMonitor');
const conversationState = require('./conversationState');
const vocabularyFilter = require('./vocabularyFilter');
const userProfileManager = require('./userProfileManager');
const SkillEvent = require('../models/SkillEvent');
const SafetyEvent = require('../models/SafetyEvent');

if (!anthropicApiKey) {
  console.warn('[agentOrchestrator] anthropicApiKey is not set — Claude API calls will fail. Running in degraded mode.');
}

const client = new Anthropic({ apiKey: anthropicApiKey });

const FALLBACK_RESPONSE =
  "I'm having a little trouble right now. Could you try asking me again in a moment?";

// Minor 7: Extract model ID to constant
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// Critical 1: Maximum number of tool-use rounds before aborting the loop
const MAX_TOOL_ROUNDS = 10;

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
    description:
      'Flag a potential emergency. Use this if the user expresses distress, mentions falling, injury, or medical concerns.',
    input_schema: {
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
 * Minor 9: Accepts profileString directly so the caller avoids a duplicate DB query.
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
 * Extract the first plain-text block from a Claude response content array.
 * Returns an empty string if no text block is found.
 * @param {Array} content
 * @returns {string}
 */
function extractTextFromContent(content) {
  for (const block of content) {
    if (block.type === 'text') {
      return block.text;
    }
  }
  return '';
}

/**
 * Check whether a Claude response content array contains any tool_use blocks.
 * @param {Array} content
 * @returns {boolean}
 */
function hasToolUse(content) {
  return content.some(block => block.type === 'tool_use');
}

/**
 * Handle all tool_use blocks in a Claude response.
 * Returns an array of tool result objects and a safetyAlert if flag_emergency was called.
 * @param {Array} content
 * @param {string} userId
 * @returns {{ toolResults: Array, safetyAlert: object|null }}
 */
async function handleToolCalls(content, userId) {
  const toolResults = [];
  let safetyAlert = null;

  for (const block of content) {
    if (block.type !== 'tool_use') continue;

    const { id, name, input } = block;
    let result = 'done';

    if (name === 'log_skill_started') {
      try {
        // Important 3: No await — SkillEvent.create is a synchronous better-sqlite3 operation
        SkillEvent.create({
          user_id: userId,
          skill_name: input.skill_name,
          status: 'started',
        });
        result = `Logged skill started: ${input.skill_name}`;
        console.log(`[agentOrchestrator] Skill started logged: "${input.skill_name}" for user ${userId}`);
      } catch (err) {
        console.error('[agentOrchestrator] Failed to log skill_started event:', err.message);
        result = 'Failed to log skill event';
      }
    } else if (name === 'flag_emergency') {
      try {
        // Important 3: No await — SafetyEvent.create is a synchronous better-sqlite3 operation
        const event = SafetyEvent.create({
          user_id: userId,
          event_type: 'emergency',
          trigger_text: input.reason,
        });
        safetyAlert = { type: 'emergency', reason: input.reason, eventId: event ? event.id : null };
        result = `Emergency flagged: ${input.reason}`;
        console.warn(`[agentOrchestrator] Emergency flagged for user ${userId}: ${input.reason}`);
      } catch (err) {
        console.error('[agentOrchestrator] Failed to log flag_emergency event:', err.message);
        result = 'Failed to log emergency event';
      }
    } else {
      console.warn(`[agentOrchestrator] Unknown tool called: ${name}`);
      result = `Unknown tool: ${name}`;
    }

    toolResults.push({ id, result });
  }

  return { toolResults, safetyAlert };
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
  // Important 5: Entire function body wrapped in try/catch so any synchronous
  // error (DB setup, session creation, etc.) returns FALLBACK_RESPONSE instead of crashing.
  try {
    // Step 1: Safety check — short-circuit if unsafe
    const safetyCheck = safetyMonitor.checkMessage(text, userId);
    if (!safetyCheck.safe) {
      return { response: safetyCheck.response, safetyAlert: { type: safetyCheck.type } };
    }

    // Step 2: Ensure the user exists in the DB
    // Minor 9: Keep the user object so buildSystemPrompt can reuse the profile
    // without a second DB query.
    const user = userProfileManager.getOrCreateUser(userId);

    // Step 3: Get or create conversation session
    const session = conversationState.getOrCreateSession(userId);
    const sessionId = session.id;

    // Step 4: Persist the incoming user message
    conversationState.addMessage(sessionId, 'user', text);

    // Step 5: Load recent conversation history (last 20 messages)
    const dbMessages = conversationState.getSessionMessages(sessionId, 20);

    // Step 6: Convert DB messages to Claude's { role, content } format
    const messages = dbMessages.map(msg => ({
      role: msg.role,
      content: msg.body,
    }));

    // Step 7: Build system prompt
    // Minor 9: Pass the profile string derived from the already-fetched user object
    // to avoid a duplicate DB query inside buildSystemPrompt.
    const profileString = userProfileManager.getProfileForPrompt(userId, user);
    const systemPrompt = buildSystemPrompt(profileString);

    // Step 8: Call Claude in a tool-use loop
    let safetyAlert = null;
    let finalTextResponse = '';

    try {
      let response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools,
      });

      // Critical 1: Tool-use loop with iteration cap
      let toolRounds = 0;
      while (hasToolUse(response.content) && toolRounds < MAX_TOOL_ROUNDS) {
        toolRounds += 1;
        const { toolResults, safetyAlert: alert } = await handleToolCalls(response.content, userId);

        // Merge any safety alert from this round
        if (alert) safetyAlert = alert;

        // Append assistant message (with tool_use blocks) and user tool results
        messages.push({ role: 'assistant', content: response.content });
        messages.push({
          role: 'user',
          content: toolResults.map(r => ({
            type: 'tool_result',
            tool_use_id: r.id,
            content: r.result,
          })),
        });

        // Ask Claude to continue after the tool results
        response = await client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages,
          tools,
        });
      }

      // Critical 1: Warn if the loop was terminated by the cap
      if (toolRounds >= MAX_TOOL_ROUNDS && hasToolUse(response.content)) {
        console.error(
          `[agentOrchestrator] Tool-use loop hit MAX_TOOL_ROUNDS (${MAX_TOOL_ROUNDS}) for user ${userId}. Aborting further tool calls.`
        );
      }

      finalTextResponse = extractTextFromContent(response.content);
    } catch (err) {
      console.error('[agentOrchestrator] Claude API error:', err.message);
      return { response: FALLBACK_RESPONSE, safetyAlert: null };
    }

    // Step 9: Apply vocabulary and readability filters
    const vocabLevel = user.vocabulary_level || 'basic';
    let filteredResponse = vocabularyFilter.filterResponse(finalTextResponse, vocabLevel);
    filteredResponse = vocabularyFilter.enforceReadability(filteredResponse);

    // Critical 2: Guard against empty filtered response before persisting
    if (!filteredResponse) {
      return { response: FALLBACK_RESPONSE, safetyAlert };
    }

    // Step 10: Persist the assistant's response
    conversationState.addMessage(sessionId, 'assistant', filteredResponse);

    return { response: filteredResponse, safetyAlert };
  } catch (err) {
    // Important 5: Catch any synchronous error from DB setup, session creation, etc.
    console.error('[agentOrchestrator] Unexpected error in processMessage:', err.message);
    return { response: FALLBACK_RESPONSE, safetyAlert: null };
  }
}

module.exports = { processMessage };
