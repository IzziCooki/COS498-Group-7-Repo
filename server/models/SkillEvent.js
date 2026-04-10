const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const SkillEvent = {
  create(data) {
    if (!data.user_id) throw new Error('SkillEvent.create: user_id is required');
    if (!data.skill_name) throw new Error('SkillEvent.create: skill_name is required');
    const id = data.id || uuidv4();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO skill_events (id, user_id, skill_name, status, practiced_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.user_id,
      data.skill_name,
      data.status || 'started',
      data.practiced_at || now
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM skill_events WHERE id = ?').get(id) || null;
  },

  findByUserId(userId) {
    return db.prepare('SELECT * FROM skill_events WHERE user_id = ? ORDER BY practiced_at DESC').all(userId);
  },

  findBySkillName(userId, skillName) {
    return db.prepare('SELECT * FROM skill_events WHERE user_id = ? AND skill_name = ? ORDER BY practiced_at DESC').all(userId, skillName);
  },
};

module.exports = SkillEvent;
