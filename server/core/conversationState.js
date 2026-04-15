const path = require('path');
const { spawn } = require('child_process');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const exporter = require('./conversationExporter');

const STALE_THRESHOLD_MINUTES = 30;

const REPO_ROOT = path.join(__dirname, '..', '..');
const EVAL_SCRIPT = path.join(REPO_ROOT, 'eval', 'run_eval.py');
const EVAL_RESULTS_DIR = path.join(REPO_ROOT, 'eval', 'results');
const PYTHON_BIN = process.env.PCPAL_PYTHON_BIN || 'python3';

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
 * Fire-and-forget: run the Python eval pipeline against the just-exported
 * conversation JSON so results land in eval/results/ automatically.
 *
 * Never throws. Failure to spawn Python (e.g. no interpreter installed) is
 * logged and ignored so it can't take the request path down.
 *
 * @param {string} conversationJsonPath  absolute path to the exported JSON
 */
function runEvalAsync(conversationJsonPath) {
  try {
    const child = spawn(
      PYTHON_BIN,
      [
        EVAL_SCRIPT,
        '--file', conversationJsonPath,
        '--precomputed',
        '--results-dir', EVAL_RESULTS_DIR,
      ],
      { detached: true, stdio: 'ignore' },
    );
    child.on('error', (err) => {
      console.error('[conversationState] Auto-eval spawn failed:', err.message);
    });
    child.unref();
  } catch (err) {
    console.error('[conversationState] Auto-eval setup failed:', err.message);
  }
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

  // Auto-export for evaluation, then kick off the Python eval pipeline in
  // the background so each finished conversation (with any user feedback
  // attached) gets scored without a manual run.
  try {
    const exportedPath = exporter.exportConversation(sessionId);
    if (exportedPath) {
      runEvalAsync(exportedPath);
    }
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
