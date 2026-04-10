const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const exporter = require('./conversationExporter');

const STALE_THRESHOLD_MINUTES = 30;

/**
 * Find the user's active conversation, or create a new one.
 * @param {string} userId
 * @returns {object} conversation record
 */
function getOrCreateSession(userId) {
  const active = Conversation.findActive(userId);
  if (active && active.length > 0) {
    return active[0];
  }
  return Conversation.create({ user_id: userId });
}

/**
 * Mark a conversation as completed and set ended_at.
 * @param {string} sessionId
 * @returns {object} updated conversation record
 */
function closeSession(sessionId) {
  const now = new Date().toISOString();
  const result = Conversation.update(sessionId, {
    status: 'completed',
    ended_at: now,
  });

  // Auto-export for evaluation
  try {
    exporter.exportConversation(sessionId);
  } catch (err) {
    console.error('[conversationState] Auto-export failed:', err.message);
  }

  return result;
}

/**
 * Find all active conversations with no new messages in the last 30 minutes
 * and mark them as abandoned.
 * @returns {number} count of sessions abandoned
 */
function abandonStale() {
  return Conversation.abandonStale(STALE_THRESHOLD_MINUTES);
}

/**
 * Get recent messages for a conversation.
 * @param {string} sessionId
 * @param {number} limit  defaults to 20
 * @returns {object[]} array of message records
 */
function getSessionMessages(sessionId, limit = 20) {
  return Message.getRecent(sessionId, limit);
}

/**
 * Add a message to a conversation.
 * @param {string} sessionId
 * @param {string} role   'user' | 'assistant'
 * @param {string} body
 * @returns {object} created message record
 */
function addMessage(sessionId, role, body) {
  if (role !== 'user' && role !== 'assistant') {
    throw new Error(`addMessage: invalid role "${role}". Must be "user" or "assistant".`);
  }
  return Message.create({
    conversation_id: sessionId,
    role,
    body,
  });
}

module.exports = { getOrCreateSession, closeSession, abandonStale, getSessionMessages, addMessage };
