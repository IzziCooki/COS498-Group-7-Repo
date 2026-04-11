const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const BuddyPair = require('../models/BuddyPair');
const ProgressShare = require('../models/ProgressShare');
const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');

/**
 * Generate a short, readable invite code (6 alphanumeric chars, uppercase).
 * e.g. "MAPLE7", "X3KP9R"
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// POST /api/buddy/invite — learner generates an invite code
router.post('/invite', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const user = User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Check if there's already a pending invite for this user
  const existing = BuddyPair.findPendingByLearnerId(userId);
  if (existing) {
    return res.json({ inviteCode: existing.invite_code, pairId: existing.id, existing: true });
  }

  const inviteCode = generateInviteCode();

  // Create a pending buddy pair — helper_id is null until someone accepts
  const pair = BuddyPair.create({
    learner_id: userId,
    helper_id: null,
    status: 'pending',
    invite_code: inviteCode,
  });

  // Also save the invite code on the user for convenience
  User.update(userId, { invite_code: inviteCode, collaboration_opt_in: 1 });

  res.json({ inviteCode, pairId: pair.id });
});

// POST /api/buddy/accept — helper submits invite code + their userId to connect
router.post('/accept', (req, res) => {
  const { userId, inviteCode } = req.body;
  if (!userId || !inviteCode) return res.status(400).json({ error: 'userId and inviteCode are required' });

  const user = User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const pair = BuddyPair.findByInviteCode(inviteCode.toUpperCase());
  if (!pair) return res.status(404).json({ error: 'Invite code not found or already used' });

  if (pair.learner_id === userId) {
    return res.status(400).json({ error: 'You cannot be your own buddy' });
  }

  // Activate the pair
  const updated = BuddyPair.update(pair.id, { helper_id: userId, status: 'active' });

  res.json({ pair: updated });
});

// GET /api/buddy/:userId — get active buddy pair(s) for a user
router.get('/:userId', (req, res) => {
  const pairs = BuddyPair.findByUserId(req.params.userId);
  res.json({ pairs });
});

// GET /api/buddy/:pairId/progress — helper sees learner's recent completions
router.get('/:pairId/progress', (req, res) => {
  const shares = ProgressShare.findByBuddyPairId(req.params.pairId);
  res.json({ shares });
});

// POST /api/buddy/:pairId/help — learner submits a help request
router.post('/:pairId/help', (req, res) => {
  const { learnerId, question, contextSummary } = req.body;
  if (!learnerId || !question) return res.status(400).json({ error: 'learnerId and question are required' });

  const request = HelpRequest.create({
    learner_id: learnerId,
    buddy_pair_id: req.params.pairId,
    question,
    context_summary: contextSummary || null,
  });

  res.json({ request });
});

// GET /api/buddy/:pairId/help — helper sees open help requests
router.get('/:pairId/help', (req, res) => {
  const requests = HelpRequest.findOpenByBuddyPairId(req.params.pairId);
  res.json({ requests });
});

// PUT /api/buddy/:pairId/help/:requestId — helper answers a help request
router.put('/:pairId/help/:requestId', (req, res) => {
  const { response } = req.body;
  if (!response) return res.status(400).json({ error: 'response is required' });

  const request = HelpRequest.answer(req.params.requestId, response);
  if (!request) return res.status(404).json({ error: 'Help request not found' });

  res.json({ request });
});

// DELETE /api/buddy/:pairId — end the buddy relationship
router.delete('/:pairId', (req, res) => {
  const pair = BuddyPair.findById(req.params.pairId);
  if (!pair) return res.status(404).json({ error: 'Buddy pair not found' });

  BuddyPair.update(req.params.pairId, { status: 'ended' });
  res.json({ success: true });
});

module.exports = router;
