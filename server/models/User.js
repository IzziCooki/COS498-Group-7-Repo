const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 10;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : null;
}

const User = {
  create(data) {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (id, name, os_type, vocabulary_level, accessibility_needs, comfort_level, onboarded, is_anonymous, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.name || null,
      data.os_type || null,
      data.vocabulary_level || 'basic',
      data.accessibility_needs || '[]',
      data.comfort_level !== undefined ? data.comfort_level : 1,
      data.onboarded !== undefined ? data.onboarded : 0,
      data.is_anonymous !== undefined ? data.is_anonymous : 1,
      now,
      now
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  },

  findByEmail(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    return db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(normalized) || null;
  },

  findAll() {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  },

  /**
   * Set (or clear) admin status on a user. Intentionally not exposed via
   * the HTTP surface — admin promotion only happens via the CLI script
   * scripts/make-admin.js or a direct server-side call.
   */
  setAdmin(id, isAdmin) {
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET is_admin = ?, updated_at = ? WHERE id = ?')
      .run(isAdmin ? 1 : 0, now, id);
    return this.findById(id);
  },

  update(id, fields) {
    // is_admin is intentionally NOT in this list — it must never be
    // settable via the /api/users/:id PUT surface.
    const allowed = ['name', 'os_type', 'vocabulary_level', 'accessibility_needs', 'comfort_level', 'onboarded', 'collaboration_opt_in', 'goal_summary', 'invite_code', 'model_preference', 'training_opt_in'];
    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  /**
   * Attach credentials to an existing user row. Used both for first-time
   * registration and for "claiming" an anonymous account. Throws on
   * duplicate email.
   */
  setCredentials(id, { email, password }) {
    const normalized = normalizeEmail(email);
    if (!normalized || !password) {
      throw new Error('Email and password are required.');
    }

    const existing = db.prepare('SELECT id FROM users WHERE lower(email) = ? AND id != ?').get(normalized, id);
    if (existing) {
      const err = new Error('An account with that email already exists.');
      err.code = 'EMAIL_TAKEN';
      throw err;
    }

    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET email = ?, password_hash = ?, is_anonymous = 0, updated_at = ? WHERE id = ?')
      .run(normalized, passwordHash, now, id);
    return this.findById(id);
  },

  /**
   * Verify an email+password pair. Returns the user row on success, null
   * on failure. The timing of the compare is bcrypt-constant.
   */
  verifyCredentials(email, password) {
    const user = this.findByEmail(email);
    if (!user || !user.password_hash) return null;
    const ok = bcrypt.compareSync(password || '', user.password_hash);
    return ok ? user : null;
  },

  delete(id) {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

module.exports = User;
