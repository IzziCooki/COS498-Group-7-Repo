const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

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
  return Conversation.update(sessionId, {
    status: 'completed',
    ended_at: now,
  });
}

/**
 * Find all active conversations with no new messages in the last 30 minutes
 * and mark them as abandoned.
 * @returns {number} count of sessions abandoned
 */
function abandonStale() {
  const db = require('../db/database');
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

  // Find active conversations where the most recent message (or conversation start) is older than cutoff
  const staleConversations = db.prepare(`
    SELECT c.id
    FROM conversations c
    LEFT JOIN (
      SELECT conversation_id, MAX(created_at) AS last_message_at
      FROM messages
      GROUP BY conversation_id
    ) m ON c.id = m.conversation_id
    WHERE c.status = 'active'
      AND (
        COALESCE(m.last_message_at, c.started_at) < ?
      )
  `).all(cutoff);

  const now = new Date().toISOString();
  for (const row of staleConversations) {
    Conversation.update(row.id, { status: 'abandoned', ended_at: now });
  }

  return staleConversations.length;
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
  return Message.create({
    conversation_id: sessionId,
    role,
    body,
  });
}

module.exports = { getOrCreateSession, closeSession, abandonStale, getSessionMessages, addMessage };
