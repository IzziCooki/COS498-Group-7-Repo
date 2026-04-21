const express = require('express');
const router = express.Router();
const qualityTracker = require('../core/conversationQualityTracker');
const ConversationFeedback = require('../models/ConversationFeedback');
const Conversation = require('../models/Conversation');
const conversationState = require('../core/conversationState');
const { requireAuth } = require('../middleware/auth');

// GET /api/quality/stats — aggregate quality stats for team monitoring.
// Requires auth to avoid exposing internal quality signals publicly.
router.get('/stats', requireAuth, (req, res) => {
  try {
    const stats = qualityTracker.getAggregateStats();
    const feedback = ConversationFeedback.getAggregateStats();
    res.json({ ...stats, feedback });
  } catch (err) {
    console.error('[quality] GET /stats error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve quality stats.' });
  }
});

// GET /api/quality/conversation/:id — quality report for a single conversation.
// Only the owner may read a conversation's quality report.
router.get('/conversation/:id', requireAuth, (req, res) => {
  try {
    const conv = Conversation.findById(req.params.id);
    if (!conv || conv.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    const report = qualityTracker.getQualityReport(req.params.id);
    res.json(report);
  } catch (err) {
    console.error('[quality] GET /conversation/:id error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve quality report.' });
  }
});

// POST /api/quality/feedback — record end-of-chat user feedback.
// Derives userId from the session, not the request body.
router.post('/feedback', requireAuth, (req, res) => {
  const { conversationId, rating, comment } = req.body || {};
  const userId = req.user.id;

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'conversationId is required.' });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5.' });
  }
  if (comment !== undefined && comment !== null && typeof comment !== 'string') {
    return res.status(400).json({ error: 'comment must be a string.' });
  }

  const conversation = Conversation.findById(conversationId);
  if (!conversation || conversation.user_id !== userId) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  try {
    ConversationFeedback.create({
      conversation_id: conversationId,
      user_id: userId,
      rating: ratingNum,
      comment,
    });
  } catch (err) {
    if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Feedback already submitted for this conversation.' });
    }
    console.error('[quality] POST /feedback error:', err.message);
    return res.status(500).json({ error: 'Failed to save feedback.' });
  }

  // Close the session if still active so the lifecycle is consistent.
  if (conversation.status === 'active') {
    try {
      conversationState.closeSession(conversationId);
    } catch (err) {
      console.error('[quality] closeSession after feedback failed:', err.message);
    }
  }

  res.json({ ok: true });
});

// POST /api/quality/feedback/skip — user dismissed the feedback prompt;
// still close the session so the conversation lifecycle completes.
router.post('/feedback/skip', requireAuth, (req, res) => {
  const { conversationId } = req.body || {};
  const userId = req.user.id;

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'conversationId is required.' });
  }

  const conversation = Conversation.findById(conversationId);
  if (!conversation || conversation.user_id !== userId) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }

  if (conversation.status === 'active') {
    try {
      conversationState.closeSession(conversationId);
    } catch (err) {
      console.error('[quality] closeSession on skip failed:', err.message);
      return res.status(500).json({ error: 'Failed to close conversation.' });
    }
  }

  res.json({ ok: true });
});

module.exports = router;
