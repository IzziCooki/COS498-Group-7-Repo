const { execSync } = require('child_process');
const conversationState = require('./conversationState');
const userProfileManager = require('./userProfileManager');
const vocabularyFilter = require('./vocabularyFilter');

/**
 * CLI-powered responder.
 * All thinking is done by the AI via `claude -p`.
 * No hardcoded responses, no pattern matching — the AI handles everything.
 */

/**
 * Main responder. Sends every message to Claude CLI.
 *
 * @param {string} text - user message
 * @param {string} userId
 * @param {string} sessionId
 * @returns {{ response: string, safetyAlert: object|null, guideId: null, stepSequence: null }}
 */
function respond(text, userId, sessionId) {
  const user = userProfileManager.getOrCreateUser(userId);
  const vocabLevel = user.vocabulary_level || 'basic';

  // Save user message
  conversationState.addMessage(sessionId, 'user', text);

  // Load recent conversation history for context
  const recentMessages = conversationState.getSessionMessages(sessionId, 10);
  const historyText = recentMessages
    .slice(0, -1)
    .map(m => `${m.role === 'user' ? 'User' : 'PC Pal'}: ${m.body}`)
    .join('\n');

  // Ask Claude CLI
  const rawResponse = askClaudeCli(text, user, historyText);

  // Filter vocabulary
  const filtered = vocabularyFilter.filterResponse(rawResponse, vocabLevel);

  if (!filtered) {
    const fallback = "I'm having a little trouble right now. Could you try asking me again?";
    conversationState.addMessage(sessionId, 'assistant', fallback);
    return { response: fallback, safetyAlert: null, guideId: null, stepSequence: null };
  }

  // Save and return
  conversationState.addMessage(sessionId, 'assistant', filtered);
  return { response: filtered, safetyAlert: null, guideId: null, stepSequence: null };
}

/**
 * Call the claude CLI to answer a question.
 * Includes conversation history and user device context.
 *
 * @param {string} text - the user's question
 * @param {object} user - user profile object
 * @param {string} history - recent conversation history
 * @returns {string} the AI response text
 */
function askClaudeCli(text, user, history) {
  const name = user?.name || 'friend';
  const os = user?.os_type || 'a computer';
  const comfort = user?.comfort_level || 1;

  const historyBlock = history
    ? `\nRecent conversation:\n${history}\n`
    : '';

  const prompt = `You are PC Pal, a warm and patient tech tutor for elderly users. You are helping ${name}, who uses a ${os} device and has a comfort level of ${comfort}/5 (1=brand new, 5=comfortable).

CRITICAL: The user's device is ${os}. ALL instructions MUST be specific to ${os}. Do NOT give instructions for other devices. For example:
- If they use iPhone, give iOS/iPhone instructions (tap, swipe, Settings app, etc.)
- If they use Android, give Android instructions (tap, swipe, Google apps, etc.)
- If they use Windows, give Windows instructions (click, Start menu, taskbar, etc.)
- If they use Mac, give Mac instructions (click, Apple menu, Dock, etc.)

Rules:
- Use simple, everyday language. No jargon.
- Be warm, patient, and encouraging — like a helpful grandchild.
- Keep your answer concise (under 200 words).
- Give numbered steps specific to ${os}.
- Never be condescending.
- If the user says "done", "ok", "next", "got it" — acknowledge their progress and tell them what to do next.
- If the user says "start over" or "new question" — cheerfully reset and ask what they'd like help with.
- If the user asks "what should I learn" — suggest a useful skill for their ${os} device.
${historyBlock}
User's message: ${text}

Respond directly to the user:`;

  try {
    const result = execSync(
      `claude -p ${escapeShellArg(prompt)} --max-turns 1`,
      { encoding: 'utf-8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result.trim() || "I'm sorry, I couldn't come up with an answer right now. Could you try asking in a different way?";
  } catch (err) {
    console.error('[mockResponder] Claude CLI error:', err.message);
    return "I'm having a little trouble thinking right now. Could you try asking me again?";
  }
}

/**
 * Escape a string for safe use as a shell argument.
 */
function escapeShellArg(arg) {
  return '"' + arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

module.exports = { respond };
