const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const UserGoal = {
  create(data) {
    if (!data.user_id) throw new Error('UserGoal.create: user_id is required');
    if (!data.goal_text) throw new Error('UserGoal.create: goal_text is required');
    const id = data.id || uuidv4();
    const relatedSkills = data.related_skills || '[]';
    const stmt = db.prepare(`
      INSERT INTO user_goals (id, user_id, goal_text, related_skills, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(id, data.user_id, data.goal_text, typeof relatedSkills === 'string' ? relatedSkills : JSON.stringify(relatedSkills));
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM user_goals WHERE id = ?').get(id) || null;
  },

  findByUserId(userId) {
    return db.prepare('SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },
};

module.exports = UserGoal;
