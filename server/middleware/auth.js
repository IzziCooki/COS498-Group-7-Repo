const Session = require('../models/Session');

const COOKIE_NAME = 'pcpal_session';
// 30 days — matches Session.DEFAULT_TTL_MS
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function cookieOptions(req) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

/**
 * Attach req.user / req.session if the request carries a valid session
 * cookie. Never blocks — guards below decide whether auth is required.
 */
function attachUser(req, res, next) {
  const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  if (!token) return next();
  try {
    const result = Session.lookup(token);
    if (result) {
      req.user = result.user;
      req.session = result.session;
    } else {
      res.clearCookie(COOKIE_NAME, { path: '/' });
    }
  } catch (err) {
    console.error('[auth] Session lookup failed:', err.message);
  }
  next();
}

/**
 * Require any authenticated (non-anonymous) user.
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

/**
 * Require an authenticated admin user. Non-admin or unauthenticated
 * callers get 403 (not 401) when they're logged in but lack permission.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

/**
 * Require that the authenticated user matches the :id (or :userId) route
 * param. Blocks cross-user reads/writes on user-scoped endpoints.
 */
function requireSelf(paramName = 'id') {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const target = req.params[paramName];
    if (!target || target !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    next();
  };
}

function setSessionCookie(res, req, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions(req));
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

function getTokenFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) return decodeURIComponent(rest.join('='));
  }
  return null;
}

module.exports = {
  COOKIE_NAME,
  attachUser,
  requireAuth,
  requireAdmin,
  requireSelf,
  setSessionCookie,
  clearSessionCookie,
  getTokenFromCookieHeader,
};
