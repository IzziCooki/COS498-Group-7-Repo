const express = require('express');
const router = express.Router();
const qualityTracker = require('../core/conversationQualityTracker');
const ConversationFeedback = require('../models/ConversationFeedback');
const Conversation = require('../models/Conversation');
const conversationState = require('../core/conversationState');

// GET /api/quality/stats — aggregate quality stats for team monitoring
router.get('/stats', (req, res) => {
  try {
    const stats = qualityTracker.getAggregateStats();
    const feedback = ConversationFeedback.getAggregateStats();
    res.json({ ...stats, feedback });
  } catch (err) {
    console.error('[quality] GET /stats error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve quality stats.' });
  }
});

// GET /api/quality/conversation/:id — quality report for a single conversation
router.get('/conversation/:id', (req, res) => {
  try {
    const report = qualityTracker.getQualityReport(req.params.id);
    res.json(report);
  } catch (err) {
    console.error('[quality] GET /conversation/:id error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve quality report.' });
  }
});

// POST /api/quality/feedback — record end-of-chat user feedback
router.post('/feedback', (req, res) => {
  const { conversationId, userId, rating, comment } = req.body || {};

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'conversationId is required.' });
  }
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required.' });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5.' });
  }
  if (comment !== undefined && comment !== null && typeof comment !== 'string') {
    return res.status(400).json({ error: 'comment must be a string.' });
  }

  const conversation = Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }
  if (conversation.user_id !== userId) {
    return res.status(403).json({ error: 'Conversation does not belong to this user.' });
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
router.post('/feedback/skip', (req, res) => {
  const { conversationId, userId } = req.body || {};

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'conversationId is required.' });
  }
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required.' });
  }

  const conversation = Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }
  if (conversation.user_id !== userId) {
    return res.status(403).json({ error: 'Conversation does not belong to this user.' });
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
