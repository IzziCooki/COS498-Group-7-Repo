const { execSync } = require('child_process');
const conversationState = require('./conversationState');
const userProfileManager = require('./userProfileManager');
const vocabularyFilter = require('./vocabularyFilter');
const { matchSkill, buildSkillPrompt, getSkillsSummary } = require('./skillMatcher');

/**
 * CLI-powered responder with automatic skill matching.
 *
 * Every user message is checked against the skills library.
 * If a skill matches, its specialized prompt is injected into the AI context.
 * The AI always generates all output — skills just guide its expertise.
 */

/**
 * Main responder.
 */
function respond(text, userId, sessionId) {
  const user = userProfileManager.getOrCreateUser(userId);
  const vocabLevel = user.vocabulary_level || 'basic';

  // Save user message
  conversationState.addMessage(sessionId, 'user', text);

  // Auto-match a skill from the user's message
  const match = matchSkill(text);
  if (match) {
    console.log(`[skillMatcher] Matched skill: "${match.skill.name}" (score: ${match.score})`);
  }

  // Load recent conversation history for context
  const recentMessages = conversationState.getSessionMessages(sessionId, 10);
  const historyText = recentMessages
    .slice(0, -1)
    .map(m => `${m.role === 'user' ? 'User' : 'PC Pal'}: ${m.body}`)
    .join('\n');

  // Ask Claude CLI with skill context
  const rawResponse = askClaudeCli(text, user, historyText, match?.skill || null);

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
 * Call the claude CLI with automatic skill injection.
 */
function askClaudeCli(text, user, history, skill) {
  const name = user?.name || 'friend';
  const os = user?.os_type || 'a computer';
  const comfort = user?.comfort_level || 1;

  const historyBlock = history
    ? `\nRecent conversation:\n${history}\n`
    : '';

  const skillBlock = skill
    ? buildSkillPrompt(skill)
    : '';

  const skillsList = getSkillsSummary();

  const prompt = `You are PC Pal, a warm and patient tech tutor for elderly users. You are helping ${name}, who uses a ${os} device and has a comfort level of ${comfort}/5 (1=brand new, 5=comfortable).

CRITICAL: The user's device is ${os}. ALL instructions MUST be specific to ${os}. Do NOT give instructions for other devices.
${skillBlock}

You are an expert in these topics:
${skillsList}

Rules:
- Use simple, everyday language. No jargon.
- Be warm, patient, and encouraging — like a helpful grandchild.
- Keep your answer concise (under 200 words).
- Never be condescending.
- If the user says "done", "ok", "next", "got it" — acknowledge their progress warmly and tell them what to do next.
- If the user says "start over" or "new question" — cheerfully ask what they'd like help with.
- If the user asks "what should I learn" — suggest a useful skill for their ${os} device from your expertise list.

Formatting (VERY IMPORTANT — follow this exactly):
- Start with a short friendly sentence, then a blank line.
- For tasks, use numbered steps. Each step on its own line with a blank line between.
- Put the key action in each step in **bold** using **double asterisks**.
- Keep each step to ONE short sentence.
- End with a blank line and a short encouraging closing line.
- For keyboard shortcuts, write them like: **Ctrl + C**
- Never write long paragraphs. Short, separated lines only.
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

function escapeShellArg(arg) {
  return '"' + arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

module.exports = { respond };
