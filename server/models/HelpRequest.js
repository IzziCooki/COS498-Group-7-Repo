const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const HelpRequest = {
  create(data) {
    if (!data.learner_id) throw new Error('HelpRequest.create: learner_id is required');
    if (!data.buddy_pair_id) throw new Error('HelpRequest.create: buddy_pair_id is required');
    if (!data.question) throw new Error('HelpRequest.create: question is required');
    const id = data.id || uuidv4();
    const stmt = db.prepare(`
      INSERT INTO help_requests (id, learner_id, buddy_pair_id, question, context_summary, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'open', datetime('now'))
    `);
    stmt.run(id, data.learner_id, data.buddy_pair_id, data.question, data.context_summary || null);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM help_requests WHERE id = ?').get(id) || null;
  },

  findOpenByBuddyPairId(pairId) {
    return db.prepare('SELECT * FROM help_requests WHERE buddy_pair_id = ? AND status = \'open\' ORDER BY created_at DESC').all(pairId);
  },

  findAnsweredForLearner(learnerId) {
    return db.prepare(`
      SELECT hr.*, bp.helper_id, u.name AS helper_name
      FROM help_requests hr
      JOIN buddy_pairs bp ON hr.buddy_pair_id = bp.id
      LEFT JOIN users u ON bp.helper_id = u.id
      WHERE hr.learner_id = ? AND hr.status = 'answered'
      ORDER BY hr.answered_at DESC
    `).all(learnerId);
  },

  answer(id, response) {
    db.prepare(`
      UPDATE help_requests SET status = 'answered', response = ?, answered_at = datetime('now') WHERE id = ?
    `).run(response, id);
    return this.findById(id);
  },

  dismiss(id) {
    db.prepare("UPDATE help_requests SET status = 'dismissed' WHERE id = ?").run(id);
    return this.findById(id);
  },
};

module.exports = HelpRequest;
