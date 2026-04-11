const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const User = {
  create(data) {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (id, name, os_type, vocabulary_level, accessibility_needs, comfort_level, onboarded, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.name || null,
      data.os_type || null,
      data.vocabulary_level || 'basic',
      data.accessibility_needs || '[]',
      data.comfort_level !== undefined ? data.comfort_level : 1,
      data.onboarded !== undefined ? data.onboarded : 0,
      now,
      now
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  },

  findAll() {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  },

  update(id, fields) {
    const allowed = ['name', 'os_type', 'vocabulary_level', 'accessibility_needs', 'comfort_level', 'onboarded', 'collaboration_opt_in', 'goal_summary', 'invite_code'];
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

  delete(id) {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

module.exports = User;
