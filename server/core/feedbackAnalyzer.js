/**
 * feedbackAnalyzer — read end-of-chat feedback and write a short
 * "what to do differently next time" note back to the feedback row.
 *
 * Called fire-and-forget from POST /api/quality/feedback. Never throws
 * to the caller — errors are logged and the suggestion column stays
 * NULL so the admin page just shows "not yet generated".
 */

const Anthropic = require('@anthropic-ai/sdk');
const { anthropicApiKey } = require('../config');
const ConversationFeedback = require('../models/ConversationFeedback');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TRANSCRIPT_MESSAGES = 30;
const MAX_TRANSCRIPT_CHARS = 8000;

let client = null;
function getClient() {
  if (!anthropicApiKey) return null;
  if (!client) client = new Anthropic({ apiKey: anthropicApiKey });
  return client;
}

function truncateTranscript(messages) {
  const recent = messages.slice(-MAX_TRANSCRIPT_MESSAGES);
  let total = 0;
  const kept = [];
  for (let i = recent.length - 1; i >= 0; i--) {
    const body = String(recent[i].body || '');
    if (total + body.length > MAX_TRANSCRIPT_CHARS) break;
    total += body.length;
    kept.unshift(recent[i]);
  }
  return kept;
}

function formatTranscript(messages) {
  return messages
    .map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.body}`)
    .join('\n\n');
}

/**
 * Generate a suggestion for a single feedback row and persist it.
 * @param {string} feedbackId
 * @returns {Promise<string|null>} the suggestion text, or null on skip/error
 */
async function analyze(feedbackId) {
  try {
    if (process.env.MOCK_MODE === 'true') return null;
    const anthropic = getClient();
    if (!anthropic) return null;

    const feedback = ConversationFeedback.findById(feedbackId);
    if (!feedback) return null;
    // Low-signal feedback (rating only, no comment) still gets a suggestion,
    // but we bias the prompt to lean on the transcript in that case.

    const conversation = Conversation.findById(feedback.conversation_id);
    const rawMessages = Message.findByConversationId(feedback.conversation_id) || [];
    const transcriptText = formatTranscript(truncateTranscript(rawMessages));

    const systemPrompt = `You are a coaching reviewer for PC Pal, an AI tutor that helps elderly users with their computers. The user just rated a conversation and may have left a comment. Your job is to read the transcript + rating + comment and write ONE short, concrete suggestion the AI should apply next time to do better.

Rules:
- Respond in 1-3 sentences. No preamble, no sign-off.
- Be specific and actionable (e.g. "Keep responses under 3 sentences when explaining basic settings" — not "be clearer").
- If the rating is 4 or 5, note what worked so the AI keeps doing it.
- If there's no useful signal, reply with the single word: none`;

    const userMessage = [
      `RATING: ${feedback.rating} / 5`,
      `USER COMMENT: ${feedback.comment ? JSON.stringify(feedback.comment) : '(none)'}`,
      `CONVERSATION START: ${conversation ? conversation.started_at : 'unknown'}`,
      '',
      'TRANSCRIPT:',
      transcriptText || '(no messages recorded)',
    ].join('\n');

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 220,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const suggestion = (response.content[0]?.text || '').trim();
    if (!suggestion || /^none\.?$/i.test(suggestion)) {
      // Model chose to skip — leave the column NULL so UI can show "no suggestion".
      return null;
    }

    ConversationFeedback.setAiSuggestion(feedbackId, suggestion);
    return suggestion;
  } catch (err) {
    console.error(`[feedbackAnalyzer] analyze(${feedbackId}) failed:`, err.message);
    return null;
  }
}

/**
 * Fire-and-forget variant used by the POST /feedback route. Logs but
 * never rejects — the caller doesn't await it.
 */
function analyzeAsync(feedbackId) {
  Promise.resolve().then(() => analyze(feedbackId)).catch((err) => {
    console.error('[feedbackAnalyzer] analyzeAsync swallowed error:', err.message);
  });
}

module.exports = { analyze, analyzeAsync };
