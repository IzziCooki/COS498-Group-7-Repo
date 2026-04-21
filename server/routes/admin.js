const express = require('express');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require an admin session.
router.use(requireAdmin);

/**
 * GET /api/admin/feedback
 *
 * List all feedback, joined with the submitting user's email and the
 * conversation's started_at. Paginated — default 100 per page, max 500.
 *
 * Query params:
 *   limit   number  (default 100, max 500)
 *   offset  number  (default 0)
 *   rating  number  (optional — filter to exact rating)
 */
router.get('/feedback', (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const ratingFilter = req.query.rating !== undefined ? Number(req.query.rating) : null;

    const where = ratingFilter !== null && Number.isInteger(ratingFilter) && ratingFilter >= 1 && ratingFilter <= 5
      ? 'WHERE f.rating = ?'
      : '';
    const whereArgs = where ? [ratingFilter] : [];

    const rows = db.prepare(`
      SELECT
        f.id,
        f.rating,
        f.comment,
        f.ai_suggestion,
        f.ai_suggestion_generated_at,
        f.created_at,
        f.conversation_id,
        f.user_id,
        u.email,
        u.name AS user_name,
        u.is_anonymous,
        c.started_at AS conversation_started_at,
        c.ended_at AS conversation_ended_at
      FROM conversation_feedback f
      LEFT JOIN users u ON u.id = f.user_id
      LEFT JOIN conversations c ON c.id = f.conversation_id
      ${where}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...whereArgs, limit, offset);

    const totalRow = db.prepare(`SELECT COUNT(*) AS n FROM conversation_feedback ${where}`).get(...whereArgs);

    const summary = db.prepare(`
      SELECT
        COUNT(*) AS total,
        AVG(rating) AS average_rating,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS r1,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS r2,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS r3,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS r4,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS r5
      FROM conversation_feedback
    `).get();

    res.json({
      total: totalRow.n,
      limit,
      offset,
      summary: {
        total: summary.total,
        average_rating: summary.average_rating,
        by_rating: { 1: summary.r1, 2: summary.r2, 3: summary.r3, 4: summary.r4, 5: summary.r5 },
      },
      feedback: rows,
    });
  } catch (err) {
    console.error('[admin] GET /feedback error:', err.message);
    res.status(500).json({ error: 'Failed to load feedback.' });
  }
});

/**
 * POST /api/admin/feedback/:id/regenerate-suggestion
 *
 * Re-run the feedback analyzer on a specific feedback row. Useful for
 * feedback submitted before the analyzer existed, or to get a second
 * pass. Blocks until Claude responds (unlike the fire-and-forget path
 * on the user-facing submit) so the admin sees the result immediately.
 */
router.post('/feedback/:id/regenerate-suggestion', async (req, res) => {
  try {
    const feedbackAnalyzer = require('../core/feedbackAnalyzer');
    const ConversationFeedback = require('../models/ConversationFeedback');
    const existing = ConversationFeedback.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Feedback not found.' });
    const suggestion = await feedbackAnalyzer.analyze(req.params.id);
    if (suggestion === null) {
      return res.status(200).json({
        ok: true,
        suggestion: null,
        message: 'Analyzer skipped (no API key, MOCK_MODE, or model chose to skip).',
      });
    }
    res.json({ ok: true, suggestion });
  } catch (err) {
    console.error('[admin] regenerate-suggestion error:', err.message);
    res.status(500).json({ error: 'Failed to regenerate suggestion.' });
  }
});

/**
 * GET /api/admin/conversations/:id/messages
 *
 * Admin read of any conversation's transcript. Used by the admin UI to
 * expand a feedback row and see the conversation the user rated.
 */
router.get('/conversations/:id/messages', (req, res) => {
  try {
    const Message = require('../models/Message');
    const messages = Message.findByConversationId(req.params.id);
    res.json(messages);
  } catch (err) {
    console.error('[admin] GET /conversations/:id/messages error:', err.message);
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

module.exports = router;
