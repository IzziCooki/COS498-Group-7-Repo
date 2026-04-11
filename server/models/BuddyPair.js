const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const BuddyPair = {
  create(data) {
    if (!data.learner_id) throw new Error('BuddyPair.create: learner_id is required');
    const id = data.id || uuidv4();
    const stmt = db.prepare(`
      INSERT INTO buddy_pairs (id, learner_id, helper_id, relationship_type, status, invite_code, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(
      id,
      data.learner_id,
      data.helper_id || null,
      data.relationship_type || 'peer',
      data.status || 'pending',
      data.invite_code || null
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare(`
      SELECT bp.*,
        lu.name AS learner_name, hu.name AS helper_name
      FROM buddy_pairs bp
      LEFT JOIN users lu ON bp.learner_id = lu.id
      LEFT JOIN users hu ON bp.helper_id = hu.id
      WHERE bp.id = ?
    `).get(id) || null;
  },

  findByUserId(userId) {
    return db.prepare(`
      SELECT bp.*,
        lu.name AS learner_name, hu.name AS helper_name
      FROM buddy_pairs bp
      LEFT JOIN users lu ON bp.learner_id = lu.id
      LEFT JOIN users hu ON bp.helper_id = hu.id
      WHERE (bp.learner_id = ? OR bp.helper_id = ?) AND bp.status = 'active'
      ORDER BY bp.created_at DESC
    `).all(userId, userId);
  },

  findByInviteCode(code) {
    return db.prepare(`
      SELECT bp.*,
        lu.name AS learner_name, hu.name AS helper_name
      FROM buddy_pairs bp
      LEFT JOIN users lu ON bp.learner_id = lu.id
      LEFT JOIN users hu ON bp.helper_id = hu.id
      WHERE bp.invite_code = ? AND bp.status = 'pending'
    `).get(code) || null;
  },

  findPendingByLearnerId(learnerId) {
    return db.prepare(`
      SELECT * FROM buddy_pairs WHERE learner_id = ? AND status = 'pending'
    `).get(learnerId) || null;
  },

  update(id, fields) {
    const allowed = ['status', 'helper_id', 'relationship_type'];
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

    db.prepare(`UPDATE buddy_pairs SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  delete(id) {
    const result = db.prepare('DELETE FROM buddy_pairs WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

module.exports = BuddyPair;
