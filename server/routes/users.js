const express = require('express');
const { v4: uuidv4 } = require('uuid');
const userProfileManager = require('../core/userProfileManager');
const User = require('../models/User');
const Session = require('../models/Session');
const { requireSelf, setSessionCookie } = require('../middleware/auth');

const router = express.Router();

// POST /api/users — create an anonymous user. A session cookie is issued so
// the anonymous user can make authenticated requests; their data lives only
// for the duration of the session and is never persisted as training data.
router.post('/', (req, res) => {
  try {
    const { name, os_type, comfort_level, goal_summary, collaboration_opt_in } = req.body;
    const id = uuidv4();

    // Create the user record first
    userProfileManager.getOrCreateUser(id);

    // Apply provided profile fields
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (os_type !== undefined) updateFields.os_type = os_type;
    if (comfort_level !== undefined) updateFields.comfort_level = comfort_level;
    if (goal_summary !== undefined) updateFields.goal_summary = goal_summary;
    if (collaboration_opt_in !== undefined) updateFields.collaboration_opt_in = collaboration_opt_in;

    let user;
    if (Object.keys(updateFields).length > 0) {
      user = userProfileManager.updateProfile(id, updateFields);
    } else {
      user = User.findById(id);
    }

    const { token } = Session.create(id);
    setSessionCookie(res, req, token);

    res.status(201).json(user);
  } catch (err) {
    console.error('[users] POST / error:', err.message);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// GET /api/users/:id — get user by ID
router.get('/:id', requireSelf('id'), (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    console.error('[users] GET /:id error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve user.' });
  }
});

// PUT /api/users/:id — update user profile
router.put('/:id', requireSelf('id'), (req, res) => {
  try {
    const existing = User.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userProfileManager.updateProfile(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    console.error('[users] PUT /:id error:', err.message);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// PUT /api/users/:id/onboard — mark user as onboarded
router.put('/:id/onboard', requireSelf('id'), (req, res) => {
  try {
    const existing = User.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userProfileManager.updateProfile(req.params.id, { onboarded: 1 });
    res.json(user);
  } catch (err) {
    console.error('[users] PUT /:id/onboard error:', err.message);
    res.status(500).json({ error: 'Failed to mark user as onboarded.' });
  }
});

// GET /api/users/:id/memories — get user's stored memories
router.get('/:id/memories', requireSelf('id'), (req, res) => {
  try {
    const UserMemory = require('../models/UserMemory');
    const memories = UserMemory.findByUserId(req.params.id);
    res.json(memories);
  } catch (err) {
    console.error('[users] GET /:id/memories error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve memories.' });
  }
});

// DELETE /api/users/:id/memories/:memoryId — forget a single memory
router.delete('/:id/memories/:memoryId', requireSelf('id'), (req, res) => {
  try {
    const UserMemory = require('../models/UserMemory');
    const mem = UserMemory.findById(req.params.memoryId);
    if (!mem || mem.user_id !== req.params.id) {
      return res.status(404).json({ error: 'Memory not found.' });
    }
    UserMemory.delete(req.params.memoryId);
    res.json({ success: true });
  } catch (err) {
    console.error('[users] DELETE /:id/memories/:memoryId error:', err.message);
    res.status(500).json({ error: 'Failed to delete memory.' });
  }
});

// GET /api/users/:id/skills — get user's skill progress
router.get('/:id/skills', requireSelf('id'), (req, res) => {
  try {
    const db = require('../db/database');

    // Get skill events grouped by skill_name
    const skills = db.prepare(`
      SELECT skill_name,
             MAX(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
             MAX(CASE WHEN status = 'started' THEN 1 ELSE 0 END) AS started,
             MAX(practiced_at) AS last_practiced,
             MIN(practiced_at) AS first_practiced
      FROM skill_events
      WHERE user_id = ?
      GROUP BY skill_name
      ORDER BY MAX(practiced_at) DESC
    `).all(req.params.id);

    // Get pending reviews
    const reviews = db.prepare(`
      SELECT skill_name, review_due_at
      FROM skill_reviews
      WHERE user_id = ? AND completed = 0
      ORDER BY review_due_at ASC
    `).all(req.params.id);

    // Build a map of due reviews
    const reviewMap = {};
    for (const r of reviews) {
      reviewMap[r.skill_name] = r.review_due_at;
    }

    const now = new Date().toISOString();
    const result = skills.map((s) => {
      const dueAt = reviewMap[s.skill_name];
      let status = 'in-progress';
      if (s.completed) status = 'completed';
      if (dueAt && dueAt <= now) status = 'due';
      return {
        skill_name: s.skill_name,
        status,
        last_practiced: s.last_practiced,
        first_practiced: s.first_practiced,
        review_due_at: dueAt || null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('[users] GET /:id/skills error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve skills.' });
  }
});

// GET /api/users/:id/conversations — list conversations with preview
router.get('/:id/conversations', requireSelf('id'), (req, res) => {
  try {
    const Conversation = require('../models/Conversation');
    const db = require('../db/database');
    const rows = db.prepare(`
      SELECT c.*,
        (SELECT body FROM messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) AS preview
      FROM conversations c
      WHERE c.user_id = ?
      ORDER BY c.started_at DESC
    `).all(req.params.id);
    res.json(rows);
  } catch (err) {
    console.error('[users] GET /:id/conversations error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
});

module.exports = router;
