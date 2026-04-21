const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const BuddyPair = require('../models/BuddyPair');
const ProgressShare = require('../models/ProgressShare');
const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');
const SkillEvent = require('../models/SkillEvent');
const SafetyEvent = require('../models/SafetyEvent');
const ScamCheckEvent = require('../models/ScamCheckEvent');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ConversationFeedback = require('../models/ConversationFeedback');
const skillProgression = require('../core/skillProgression');

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

// GET /api/buddy/:pairId/dashboard — family dashboard data for a learner
router.get('/:pairId/dashboard', (req, res) => {
  const pair = BuddyPair.findById(req.params.pairId);
  if (!pair || pair.status !== 'active') {
    return res.status(404).json({ error: 'Buddy pair not found or inactive' });
  }

  // The learner is the person we're showing data about
  const learnerId = pair.learner_id;
  const learner = User.findById(learnerId);
  if (!learner) return res.status(404).json({ error: 'Learner not found' });

  // Skills
  const skillEvents = SkillEvent.findByUserId(learnerId);
  const skillStatus = skillProgression.getSkillStatus(learnerId);
  const nextSkill = skillProgression.getNextSkill(learnerId);
  const completedSkills = skillEvents.filter(e => e.status === 'completed');
  const skillTimeline = skillEvents
    .sort((a, b) => new Date(a.practiced_at) - new Date(b.practiced_at))
    .map(e => ({ skill: e.skill_name, status: e.status, date: e.practiced_at }));

  // Conversations
  const allConversations = Conversation.findByUserId(learnerId);
  const recentConversations = allConversations.slice(0, 10).map(conv => {
    const msgs = Message.findByConversationId(conv.id, 3);
    const preview = msgs.find(m => m.role === 'user')?.body?.substring(0, 120) || '';
    const messageCount = Message.findByConversationId(conv.id).length;
    let feedback = null;
    try { feedback = ConversationFeedback.findByConversationId(conv.id); } catch { /* ok */ }
    return {
      id: conv.id, taskType: conv.task_type, status: conv.status,
      startedAt: conv.started_at, endedAt: conv.ended_at,
      messageCount, preview,
      rating: feedback?.rating || null,
    };
  });

  // Safety
  const safetyEvents = SafetyEvent.findByUserId(learnerId);
  let scamChecks = [];
  try { scamChecks = ScamCheckEvent.findByUserId(learnerId); } catch { /* ok */ }

  // Feedback stats
  let feedbackStats = { count: 0, average_rating: null };
  try { feedbackStats = ConversationFeedback.getAggregateStats(); } catch { /* ok */ }

  // Progress shares
  const progressShares = ProgressShare.findByBuddyPairId(req.params.pairId);

  // Help requests
  const helpRequests = HelpRequest.findOpenByBuddyPairId(req.params.pairId);

  // Struggles — from user memories if available
  let struggles = [];
  try {
    const UserMemory = require('../models/UserMemory');
    const allMemories = UserMemory.findByUserId(learnerId);
    struggles = allMemories
      .filter(m => m.type === 'struggle' || m.type === 'pattern')
      .slice(0, 10)
      .map(m => ({ type: m.type, content: m.content, date: m.created_at }));
  } catch { /* UserMemory may not exist */ }

  res.json({
    learner: {
      name: learner.name, osType: learner.os_type,
      comfortLevel: learner.comfort_level, goalSummary: learner.goal_summary,
    },
    skills: {
      completed: completedSkills.map(e => ({ skill: e.skill_name, date: e.practiced_at })),
      status: skillStatus,
      next: nextSkill,
      timeline: skillTimeline,
      totalAvailable: Object.keys(skillProgression.SKILL_NAMES || {}).length || 12,
    },
    conversations: {
      total: allConversations.length,
      recent: recentConversations,
    },
    safety: {
      events: safetyEvents.map(e => ({ type: e.event_type, trigger: e.trigger_text, date: e.created_at })),
      scamChecks: scamChecks.map(s => ({
        summary: s.situation_summary, riskLevel: s.risk_level,
        redFlags: s.red_flags, action: s.recommended_action, date: s.created_at,
      })),
    },
    feedback: feedbackStats,
    progressShares: progressShares.slice(0, 20),
    helpRequests,
    struggles,
    pairInfo: { helperName: pair.helper_name, learnerName: pair.learner_name },
  });
});

module.exports = router;
