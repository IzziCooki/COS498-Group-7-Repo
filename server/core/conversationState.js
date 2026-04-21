const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const exporter = require('./conversationExporter');

const STALE_THRESHOLD_MINUTES = 30;

/**
 * Anonymous users' conversations live only in memory and are discarded
 * when the session ends. Keyed by the ephemeral conversation id, which is
 * also returned to the client so the rest of the app can refer to it by
 * the same handle as persistent conversations.
 *
 * ephemeralConversations  : Map<conversationId, {id, user_id, status, started_at, ended_at}>
 * ephemeralMessages       : Map<conversationId, Array<{id, role, body, created_at}>>
 * ephemeralByUser         : Map<userId, conversationId>  (active session lookup)
 */
const ephemeralConversations = new Map();
const ephemeralMessages = new Map();
const ephemeralByUser = new Map();

function isAnonymousUser(userId) {
  const user = User.findById(userId);
  // If the row is missing, treat as anonymous (safer default — don't persist).
  return !user || user.is_anonymous === 1;
}

function isEphemeral(sessionId) {
  return ephemeralConversations.has(sessionId);
}

function createEphemeralSession(userId) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const conv = {
    id,
    user_id: userId,
    status: 'active',
    task_type: null,
    context_summary: null,
    started_at: now,
    ended_at: null,
    ephemeral: true,
  };
  ephemeralConversations.set(id, conv);
  ephemeralMessages.set(id, []);
  ephemeralByUser.set(userId, id);
  return conv;
}

function findActiveEphemeral(userId) {
  const id = ephemeralByUser.get(userId);
  if (!id) return null;
  const conv = ephemeralConversations.get(id);
  return conv && conv.status === 'active' ? conv : null;
}

function closeEphemeral(sessionId) {
  const conv = ephemeralConversations.get(sessionId);
  if (!conv) return null;
  conv.status = 'completed';
  conv.ended_at = new Date().toISOString();
  // Wipe messages — anonymous users never persist to disk.
  ephemeralMessages.delete(sessionId);
  ephemeralConversations.delete(sessionId);
  if (ephemeralByUser.get(conv.user_id) === sessionId) {
    ephemeralByUser.delete(conv.user_id);
  }
  return conv;
}

/**
 * Find the user's active conversation, or create a new one.
 */
function getOrCreateSession(userId) {
  if (isAnonymousUser(userId)) {
    const existing = findActiveEphemeral(userId);
    if (existing) return existing;
    return createEphemeralSession(userId);
  }
  const active = Conversation.findActive(userId);
  if (active && active.length > 0) {
    return active[0];
  }
  return Conversation.create({ user_id: userId });
}

/**
 * Mark a conversation as completed and set ended_at. For ephemeral
 * sessions, this discards the in-memory state without touching the DB
 * or the exporter.
 */
function closeSession(sessionId) {
  if (isEphemeral(sessionId)) {
    return closeEphemeral(sessionId);
  }

  const now = new Date().toISOString();
  const result = Conversation.update(sessionId, {
    status: 'completed',
    ended_at: now,
  });

  try {
    exporter.exportConversation(sessionId);
  } catch (err) {
    console.error('[conversationState] Auto-export failed:', err.message);
  }

  return result;
}

function abandonStale() {
  return Conversation.abandonStale(STALE_THRESHOLD_MINUTES);
}

/**
 * Return all active sessions for a user (DB for authenticated users,
 * ephemeral for anonymous).
 */
function findActiveSessionsForUser(userId) {
  if (isAnonymousUser(userId)) {
    const conv = findActiveEphemeral(userId);
    return conv ? [conv] : [];
  }
  return Conversation.findActive(userId);
}

function getSessionMessages(sessionId, limit = 20) {
  if (isEphemeral(sessionId)) {
    const all = ephemeralMessages.get(sessionId) || [];
    return all.slice(-limit);
  }
  return Message.getRecent(sessionId, limit);
}

function addMessage(sessionId, role, body) {
  if (role !== 'user' && role !== 'assistant') {
    throw new Error(`addMessage: invalid role "${role}". Must be "user" or "assistant".`);
  }
  if (isEphemeral(sessionId)) {
    const msg = {
      id: uuidv4(),
      conversation_id: sessionId,
      role,
      body,
      created_at: new Date().toISOString(),
    };
    const bucket = ephemeralMessages.get(sessionId) || [];
    bucket.push(msg);
    ephemeralMessages.set(sessionId, bucket);
    return msg;
  }
  return Message.create({
    conversation_id: sessionId,
    role,
    body,
  });
}

/**
 * Drop all ephemeral state for a given user — used when the WebSocket
 * disconnects so memory doesn't leak over long uptimes.
 */
function discardEphemeralForUser(userId) {
  const sessionId = ephemeralByUser.get(userId);
  if (sessionId) closeEphemeral(sessionId);
}

module.exports = {
  getOrCreateSession,
  closeSession,
  abandonStale,
  getSessionMessages,
  addMessage,
  discardEphemeralForUser,
  findActiveSessionsForUser,
  isEphemeral,
};
