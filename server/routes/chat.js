const express = require('express');
const agentOrchestrator = require('../core/agentOrchestrator');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/chat — REST fallback for WebSocket chat.
// Requires a session cookie; the user id is taken from the session rather
// than trusted from the request body so callers can't impersonate others.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { text } = req.body || {};
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ error: 'text is required.' });
    }

    const result = await agentOrchestrator.processMessage(text, userId);
    res.json({
      response: result.response,
      safetyAlert: result.safetyAlert,
      stepSequence: result.stepSequence || null,
    });
  } catch (err) {
    console.error('[chat] POST / error:', err.message);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
});

module.exports = router;
