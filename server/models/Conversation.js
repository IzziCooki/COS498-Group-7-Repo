const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const Conversation = {
  create(data) {
    if (!data.user_id) throw new Error('Conversation.create: user_id is required');
    const id = data.id || uuidv4();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO conversations (id, user_id, task_type, status, context_summary, started_at, ended_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.user_id,
      data.task_type || null,
      data.status || 'active',
      data.context_summary || null,
      data.started_at || now,
      data.ended_at || null
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) || null;
  },

  findByUserId(userId) {
    return db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY started_at DESC').all(userId);
  },

  findActive(userId) {
    return db.prepare("SELECT * FROM conversations WHERE user_id = ? AND status = 'active' ORDER BY started_at DESC").all(userId);
  },

  update(id, fields) {
    const allowed = ['task_type', 'status', 'context_summary', 'ended_at'];
    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  close(id) {
    const now = new Date().toISOString();
    db.prepare("UPDATE conversations SET status = 'closed', ended_at = ? WHERE id = ?").run(now, id);
    return this.findById(id);
  },
};

module.exports = Conversation;
