const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const AutofixSession = {
  create(data = {}) {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO autofix_session (
        id, user_id, started_at, ended_at,
        fixes_attempted, fixes_succeeded, summary_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.user_id || null,
      data.started_at || now,
      data.ended_at || null,
      data.fixes_attempted || 0,
      data.fixes_succeeded || 0,
      data.summary_json ? JSON.stringify(data.summary_json) : null,
    );
    return this.findById(id);
  },

  finalize(id, { fixes_attempted, fixes_succeeded, summary_json }) {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE autofix_session
         SET ended_at = ?, fixes_attempted = ?, fixes_succeeded = ?, summary_json = ?
       WHERE id = ?
    `).run(
      now,
      fixes_attempted || 0,
      fixes_succeeded || 0,
      summary_json ? JSON.stringify(summary_json) : null,
      id,
    );
    return this.findById(id);
  },

  findById(id) {
    const row = db.prepare('SELECT * FROM autofix_session WHERE id = ?').get(id);
    if (!row) return null;
    if (row.summary_json) {
      try { row.summary = JSON.parse(row.summary_json); } catch { row.summary = null; }
    }
    return row;
  },

  findByUser(userId, limit = 10) {
    return db.prepare(
      'SELECT * FROM autofix_session WHERE user_id = ? ORDER BY started_at DESC LIMIT ?'
    ).all(userId, limit);
  },
};

module.exports = AutofixSession;
