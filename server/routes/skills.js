const express = require('express');
const { getAllSkills } = require('../core/skillMatcher');

const router = express.Router();

/**
 * GET /api/skills/quick-help
 *
 * Returns the curated set of skills tagged with `quickHelp: true` in their
 * JSON definition. The client renders these as tiles on the chat empty state
 * so users don't have to type to discover what PC Pal can help with.
 *
 * Sorted by `quickHelpOrder` (low first), then by `name`.
 */
router.get('/quick-help', (_req, res) => {
  const all = getAllSkills();
  const tiles = all
    .filter((s) => s && s.quickHelp === true)
    .map((s) => ({
      id: s.id,
      label: s.quickHelpLabel || s.name,
      emoji: s.quickHelpEmoji || '💡',
      starter: s.quickHelpStarter || `Help me with ${s.name}.`,
      category: s.category || 'basics',
      order: typeof s.quickHelpOrder === 'number' ? s.quickHelpOrder : 99,
    }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  res.json(tiles);
});

module.exports = router;
