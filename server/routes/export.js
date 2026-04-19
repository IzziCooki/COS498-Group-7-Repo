const express = require('express');
const exporter = require('../core/conversationExporter');

const router = express.Router();

// GET /api/conversations/:id/messages — get messages for a conversation
router.get('/:id/messages', (req, res) => {
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
router.post('/:id/export', (req, res) => {
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

// GET /api/conversations/export-all — export all completed conversations
router.get('/export-all', (req, res) => {
  try {
    const exported = exporter.exportAll();
    res.json({ success: true, count: exported.length, files: exported });
  } catch (err) {
    console.error('[export] Error:', err.message);
    res.status(500).json({ error: 'Failed to export conversations.' });
  }
});

module.exports = router;
