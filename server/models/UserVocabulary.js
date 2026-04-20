const db = require('../db/database');

const UserVocabulary = {
  /**
   * Get all vocabulary term records for a user.
   * @param {string} userId
   * @returns {object[]} array of { user_id, term, encounter_count, last_seen_at }
   */
  getTerms(userId) {
    return db.prepare('SELECT * FROM user_vocabulary WHERE user_id = ?').all(userId);
  },

  /**
   * Get a single term record for a user.
   * @param {string} userId
   * @param {string} term
   * @returns {object|null}
   */
  getTerm(userId, term) {
    return db.prepare('SELECT * FROM user_vocabulary WHERE user_id = ? AND term = ?').get(userId, term) || null;
  },

  /**
   * Increment the encounter count for a term (upsert).
   * @param {string} userId
   * @param {string} term
   * @returns {object} updated record
   */
  incrementTerm(userId, term) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO user_vocabulary (user_id, term, encounter_count, last_seen_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(user_id, term) DO UPDATE SET
        encounter_count = encounter_count + 1,
        last_seen_at = ?
    `).run(userId, term, now, now);
    return this.getTerm(userId, term);
  },

  /**
   * Reset a term's encounter count to 0 (user asked "what is a X?").
   * @param {string} userId
   * @param {string} term
   */
  resetTerm(userId, term) {
    db.prepare(`
      UPDATE user_vocabulary SET encounter_count = 0 WHERE user_id = ? AND term = ?
    `).run(userId, term);
  },
};

module.exports = UserVocabulary;
