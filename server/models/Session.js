const crypto = require('crypto');
const db = require('../db/database');

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

const Session = {
  create(userId, ttlMs = DEFAULT_TTL_MS) {
    const token = generateToken();
    const now = new Date();
    const expires = new Date(now.getTime() + ttlMs);
    db.prepare(`
      INSERT INTO user_sessions (token, user_id, created_at, expires_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(token, userId, now.toISOString(), expires.toISOString(), now.toISOString());
    return { token, userId, expiresAt: expires.toISOString() };
  },

  /**
   * Fetch a session and its user, but only if not expired. Touches
   * last_seen_at so the session appears active to the app. Returns
   * { user, session } or null.
   */
  lookup(token) {
    if (!token) return null;
    const row = db.prepare(`
      SELECT s.token, s.user_id, s.created_at, s.expires_at,
             u.*
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ?
    `).get(token);
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) {
      this.delete(token);
      return null;
    }
    db.prepare('UPDATE user_sessions SET last_seen_at = ? WHERE token = ?')
      .run(new Date().toISOString(), token);
    const { token: _t, user_id: _uid, created_at: _c, expires_at: _e, ...user } = row;
    return {
      session: { token, userId: row.user_id, expiresAt: row.expires_at },
      user,
    };
  },

  delete(token) {
    if (!token) return false;
    const result = db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
    return result.changes > 0;
  },

  deleteAllForUser(userId) {
    db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(userId);
  },

  purgeExpired() {
    db.prepare('DELETE FROM user_sessions WHERE expires_at < ?')
      .run(new Date().toISOString());
  },
};

module.exports = Session;
