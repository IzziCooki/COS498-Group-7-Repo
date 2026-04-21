const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Session = require('../models/Session');
const userProfileManager = require('../core/userProfileManager');
const { setSessionCookie, clearSessionCookie, attachUser } = require('../middleware/auth');

const router = express.Router();

// RFC5322-lite email sanity check; server is not the primary validator.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function publicUser(user) {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { password_hash, ...rest } = user;
  return rest;
}

function validateCredentials(email, password) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return 'Please enter a valid email address.';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/**
 * POST /api/auth/register
 * Body: { email, password, name?, os_type?, comfort_level?, anonymousUserId? }
 *
 * If `anonymousUserId` is provided and belongs to an anonymous user, we
 * upgrade that row in place — preserving any conversations started during
 * the anonymous session. Otherwise we create a fresh user.
 */
router.post('/register', (req, res) => {
  try {
    const { email, password, name, os_type, comfort_level, anonymousUserId } = req.body || {};

    const err = validateCredentials(email, password);
    if (err) return res.status(400).json({ error: err });

    if (User.findByEmail(email)) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    let user;
    if (anonymousUserId) {
      const existing = User.findById(anonymousUserId);
      if (existing && existing.is_anonymous) {
        user = User.setCredentials(anonymousUserId, { email, password });
      }
    }

    if (!user) {
      const freshId = uuidv4();
      userProfileManager.getOrCreateUser(freshId);
      user = User.setCredentials(freshId, { email, password });
    }

    if (name !== undefined || os_type !== undefined || comfort_level !== undefined) {
      const fields = {};
      if (name !== undefined) fields.name = name;
      if (os_type !== undefined) fields.os_type = os_type;
      if (comfort_level !== undefined) fields.comfort_level = comfort_level;
      user = userProfileManager.updateProfile(user.id, fields);
    }

    const { token } = Session.create(user.id);
    setSessionCookie(res, req, token);
    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    if (e.code === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: e.message });
    }
    console.error('[auth] register error:', e.message);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = User.verifyCredentials(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const { token } = Session.create(user.id);
    setSessionCookie(res, req, token);
    res.json({ user: publicUser(user) });
  } catch (e) {
    console.error('[auth] login error:', e.message);
    res.status(500).json({ error: 'Login failed.' });
  }
});

/**
 * POST /api/auth/logout — revokes the current session.
 */
router.post('/logout', attachUser, (req, res) => {
  try {
    if (req.session && req.session.token) {
      Session.delete(req.session.token);
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (e) {
    console.error('[auth] logout error:', e.message);
    res.status(500).json({ error: 'Logout failed.' });
  }
});

/**
 * GET /api/auth/me — returns the current user, or 401 if not logged in.
 */
router.get('/me', attachUser, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
