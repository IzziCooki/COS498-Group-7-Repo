const express = require('express');
const { v4: uuidv4 } = require('uuid');
const userProfileManager = require('../core/userProfileManager');
const User = require('../models/User');

const router = express.Router();

// POST /api/users — create a new user
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

    res.status(201).json(user);
  } catch (err) {
    console.error('[users] POST / error:', err.message);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// GET /api/users/:id — get user by ID
router.get('/:id', (req, res) => {
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
router.put('/:id', (req, res) => {
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
router.put('/:id/onboard', (req, res) => {
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
router.get('/:id/memories', (req, res) => {
  try {
    const UserMemory = require('../models/UserMemory');
    const memories = UserMemory.findByUserId(req.params.id);
    res.json(memories);
  } catch (err) {
    console.error('[users] GET /:id/memories error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve memories.' });
  }
});

module.exports = router;
