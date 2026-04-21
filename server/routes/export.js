const express = require('express');
const exporter = require('../core/conversationExporter');
const Conversation = require('../models/Conversation');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Middleware: require that the authenticated user owns the conversation
 * identified by :id. 401 if no auth, 404 if missing or not owned (404 —
 * not 403 — to avoid leaking the existence of other users' conversations).
 */
function requireOwnedConversation(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const conv = Conversation.findById(req.params.id);
  if (!conv || conv.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }
  req.conversation = conv;
  next();
}

// GET /api/conversations/:id/messages — get messages for a conversation
router.get('/:id/messages', requireOwnedConversation, (req, res) => {
  try {
    const Message = require('../models/Message');
    const messages = Message.findByConversationId(req.params.id);
    res.json(messages);
  } catch (err) {
    console.error('[export] GET /:id/messages error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// POST /api/conversations/:id/export — export a single conversation
router.post('/:id/export', requireOwnedConversation, (req, res) => {
  try {
    const filepath = exporter.exportConversation(req.params.id);
    if (filepath) {
      res.json({ success: true, file: filepath });
    } else {
      res.status(404).json({ error: 'Conversation not found or too short to export.' });
    }
  } catch (err) {
    console.error('[export] Error:', err.message);
    res.status(500).json({ error: 'Failed to export conversation.' });
  }
});

// GET /api/conversations/export-all — export the caller's own conversations
router.get('/export-all', requireAuth, (req, res) => {
  try {
    const exported = exporter.exportAllForUser
      ? exporter.exportAllForUser(req.user.id)
      : exporter.exportAll().filter(f => f.includes(req.user.id));
    res.json({ success: true, count: exported.length, files: exported });
  } catch (err) {
    console.error('[export] Error:', err.message);
    res.status(500).json({ error: 'Failed to export conversations.' });
  }
});

module.exports = router;
