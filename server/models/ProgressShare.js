const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const ProgressShare = {
  create(data) {
    if (!data.user_id) throw new Error('ProgressShare.create: user_id is required');
    if (!data.buddy_pair_id) throw new Error('ProgressShare.create: buddy_pair_id is required');
    if (!data.skill_name) throw new Error('ProgressShare.create: skill_name is required');
    if (!data.message) throw new Error('ProgressShare.create: message is required');
    const id = data.id || uuidv4();
    const stmt = db.prepare(`
      INSERT INTO progress_shares (id, user_id, buddy_pair_id, skill_name, message, seen, created_at)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
    `);
    stmt.run(id, data.user_id, data.buddy_pair_id, data.skill_name, data.message);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM progress_shares WHERE id = ?').get(id) || null;
  },

  findByBuddyPairId(pairId) {
    return db.prepare('SELECT * FROM progress_shares WHERE buddy_pair_id = ? ORDER BY created_at DESC').all(pairId);
  },

  findUnseenByBuddyPairId(pairId) {
    return db.prepare('SELECT * FROM progress_shares WHERE buddy_pair_id = ? AND seen = 0 ORDER BY created_at DESC').all(pairId);
  },

  markSeen(id) {
    db.prepare('UPDATE progress_shares SET seen = 1 WHERE id = ?').run(id);
    return this.findById(id);
  },
};

module.exports = ProgressShare;
