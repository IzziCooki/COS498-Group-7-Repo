const express = require('express');
const agentOrchestrator = require('../core/agentOrchestrator');

const router = express.Router();

// POST /api/chat — REST fallback for WebSocket chat
router.post('/', async (req, res) => {
  try {
    const { userId, text } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }
    if (!text) {
      return res.status(400).json({ error: 'text is required.' });
    }

    const result = await agentOrchestrator.processMessage(text, userId);
    res.json({ response: result.response, safetyAlert: result.safetyAlert });
  } catch (err) {
    console.error('[chat] POST / error:', err.message);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
});

module.exports = router;
