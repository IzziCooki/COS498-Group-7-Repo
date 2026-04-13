const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const ScamCheckEvent = {
  create(data) {
    if (!data.user_id) throw new Error('ScamCheckEvent.create: user_id is required');
    if (!data.conversation_id) throw new Error('ScamCheckEvent.create: conversation_id is required');
    if (!data.situation_summary) throw new Error('ScamCheckEvent.create: situation_summary is required');
    const id = data.id || uuidv4();
    const stmt = db.prepare(`
      INSERT INTO scam_check_events (id, user_id, conversation_id, situation_summary, claimed_organization, red_flags, risk_level, recommended_action, verification_contact, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(
      id,
      data.user_id,
      data.conversation_id,
      data.situation_summary,
      data.claimed_organization || null,
      typeof data.red_flags === 'string' ? data.red_flags : JSON.stringify(data.red_flags || []),
      data.risk_level || 'unknown',
      data.recommended_action || '',
      data.verification_contact || null
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM scam_check_events WHERE id = ?').get(id) || null;
  },

  findByUserId(userId) {
    return db.prepare('SELECT * FROM scam_check_events WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  findAll(limit = 50) {
    return db.prepare('SELECT * FROM scam_check_events ORDER BY created_at DESC LIMIT ?').all(limit);
  },
};

module.exports = ScamCheckEvent;
