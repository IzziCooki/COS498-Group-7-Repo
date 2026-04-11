const express = require('express');
const router = express.Router();
const qualityTracker = require('../core/conversationQualityTracker');

// GET /api/quality/stats — aggregate quality stats for team monitoring
router.get('/stats', (req, res) => {
  try {
    const stats = qualityTracker.getAggregateStats();
    res.json(stats);
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

module.exports = router;
