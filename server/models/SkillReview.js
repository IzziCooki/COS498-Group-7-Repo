const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const SkillReview = {
  create(data) {
    if (!data.user_id) throw new Error('SkillReview.create: user_id is required');
    if (!data.skill_name) throw new Error('SkillReview.create: skill_name is required');
    if (!data.review_due_at) throw new Error('SkillReview.create: review_due_at is required');
    const id = data.id || uuidv4();
    const stmt = db.prepare(`
      INSERT INTO skill_reviews (id, user_id, skill_name, review_due_at, completed)
      VALUES (?, ?, ?, ?, 0)
    `);
    stmt.run(id, data.user_id, data.skill_name, data.review_due_at);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM skill_reviews WHERE id = ?').get(id) || null;
  },

  findDueForUser(userId) {
    return db.prepare(`
      SELECT * FROM skill_reviews
      WHERE user_id = ? AND completed = 0 AND review_due_at <= datetime('now')
      ORDER BY review_due_at ASC
    `).all(userId);
  },

  markCompleted(id) {
    db.prepare('UPDATE skill_reviews SET completed = 1 WHERE id = ?').run(id);
    return this.findById(id);
  },
};

module.exports = SkillReview;
