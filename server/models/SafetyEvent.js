const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const SafetyEvent = {
  create(data) {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO safety_events (id, user_id, event_type, trigger_text, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.user_id,
      data.event_type,
      data.trigger_text || null,
      data.created_at || now
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM safety_events WHERE id = ?').get(id) || null;
  },

  findByUserId(userId) {
    return db.prepare('SELECT * FROM safety_events WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },
};

module.exports = SafetyEvent;
