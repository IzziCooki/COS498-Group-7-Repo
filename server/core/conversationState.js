const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const exporter = require('./conversationExporter');

const STALE_THRESHOLD_MINUTES = 30;

// Sprint C: regex patterns that signal "your previous instruction didn't pan
// out". Tuned to elderly-user phrasing — short, literal. `['’]?` matches both
// straight and curly apostrophes (and dropped ones from autocorrect).
const FAILURE_PATTERNS = [
  /that\s+didn['’]?t\s+work/i,
  /that\s+didn['’]?t\s+help/i,
  /still\s+not\s+working/i,
  /nothing\s+happened/i,
  /same\s+thing/i,
  /\bi\s+don['’]?t\s+see\b/i,
  /\bit['’]?s\s+not\s+there\b/i,
  /there['’]?s\s+no\s+\w+\s+option/i,
  /there\s+is\s+no\s+\w+\s+option/i,
];

// Per-session transient state. lastIssuedStep is what the agent told the
// user last; lastStepFailed is the one-shot flag the orchestrator consumes
// before building the next system prompt.
const lastIssuedStepBySession = new Map();
const lastStepFailedBySession = new Map();

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
  // All users get persistent conversations now — even anonymous ones.
  // As long as they have a session cookie, their chats persist in SQLite.
  // Only truly missing users (no DB row at all) go ephemeral.
  const user = User.findById(userId);
  return !user;
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

// ── Failure-signal handling ──────────────────────────────────────────────
// Sprint C: track what the agent told the user last and detect when the
// next user turn says it didn't land. Both orchestrators read the resulting
// flag to pivot strategy instead of regenerating a similar guess.

function detectFailureSignal(userMessage) {
  if (typeof userMessage !== 'string' || userMessage.length === 0) {
    return { failed: false, signal: null };
  }
  for (const pattern of FAILURE_PATTERNS) {
    const match = pattern.exec(userMessage);
    if (match) {
      return { failed: true, signal: match[0].trim() };
    }
  }
  return { failed: false, signal: null };
}

function recordIssuedStep(sessionId, step) {
  if (!sessionId || !step || typeof step !== 'object') return;
  const normalized = {
    skillId: step.skillId || null,
    stepIndex: typeof step.stepIndex === 'number' ? step.stepIndex : 0,
    instruction: typeof step.instruction === 'string' ? step.instruction : '',
    issuedAt: step.issuedAt || new Date().toISOString(),
  };
  lastIssuedStepBySession.set(sessionId, normalized);
  if (isEphemeral(sessionId)) {
    const conv = ephemeralConversations.get(sessionId);
    if (conv) conv.lastIssuedStep = normalized;
  }
}

function getLastIssuedStep(sessionId) {
  if (!sessionId) return null;
  if (isEphemeral(sessionId)) {
    const conv = ephemeralConversations.get(sessionId);
    if (conv && conv.lastIssuedStep) return conv.lastIssuedStep;
  }
  return lastIssuedStepBySession.get(sessionId) || null;
}

function getFailedSteps(sessionId) {
  if (!sessionId) return [];
  if (isEphemeral(sessionId)) {
    const conv = ephemeralConversations.get(sessionId);
    return conv && Array.isArray(conv.failedSteps) ? conv.failedSteps.slice() : [];
  }
  try {
    const list = Conversation.getFailedSteps(sessionId);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('[conversationState] getFailedSteps failed:', err.message);
    return [];
  }
}

function pushFailedStep(sessionId, step) {
  if (!sessionId || !step) return;
  if (isEphemeral(sessionId)) {
    const conv = ephemeralConversations.get(sessionId);
    if (!conv) return;
    if (!Array.isArray(conv.failedSteps)) conv.failedSteps = [];
    conv.failedSteps.push(step);
    return;
  }
  try {
    Conversation.appendFailedStep(sessionId, step);
  } catch (err) {
    console.error('[conversationState] appendFailedStep failed:', err.message);
  }
}

function noteUserTurn(sessionId, userMessage) {
  const detection = detectFailureSignal(userMessage);
  if (!detection.failed) {
    lastStepFailedBySession.set(sessionId, false);
    if (isEphemeral(sessionId)) {
      const conv = ephemeralConversations.get(sessionId);
      if (conv) conv.lastStepFailed = false;
    }
    return { ...detection, lastStepFailed: false, lastIssuedStep: getLastIssuedStep(sessionId) };
  }

  const lastStep = getLastIssuedStep(sessionId);
  if (lastStep) {
    pushFailedStep(sessionId, { ...lastStep, signal: detection.signal });
    // Clear lastIssuedStep so a follow-up failure ("still not working") doesn't
    // re-push the same instruction. Once recorded, the agent must issue a new
    // step before another failure can attach.
    lastIssuedStepBySession.delete(sessionId);
    if (isEphemeral(sessionId)) {
      const conv = ephemeralConversations.get(sessionId);
      if (conv) conv.lastIssuedStep = null;
    }
  }
  lastStepFailedBySession.set(sessionId, true);
  if (isEphemeral(sessionId)) {
    const conv = ephemeralConversations.get(sessionId);
    if (conv) conv.lastStepFailed = true;
  }
  return { ...detection, lastStepFailed: true, lastIssuedStep: lastStep };
}

function consumeFailureContext(sessionId) {
  let lastStepFailed = false;
  if (isEphemeral(sessionId)) {
    const conv = ephemeralConversations.get(sessionId);
    lastStepFailed = !!(conv && conv.lastStepFailed);
    if (conv) conv.lastStepFailed = false;
  } else {
    lastStepFailed = !!lastStepFailedBySession.get(sessionId);
  }
  lastStepFailedBySession.set(sessionId, false);

  return {
    lastStepFailed,
    failedSteps: getFailedSteps(sessionId),
    lastIssuedStep: getLastIssuedStep(sessionId),
  };
}

function resetFailureStateForTests() {
  lastIssuedStepBySession.clear();
  lastStepFailedBySession.clear();
  ephemeralConversations.clear();
  ephemeralMessages.clear();
  ephemeralByUser.clear();
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
  detectFailureSignal,
  recordIssuedStep,
  getLastIssuedStep,
  getFailedSteps,
  noteUserTurn,
  consumeFailureContext,
  resetFailureStateForTests,
};
