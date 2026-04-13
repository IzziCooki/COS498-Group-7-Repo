const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const MAX_COMMENT_LENGTH = 2000;

const ConversationFeedback = {
  create(data) {
    if (!data.conversation_id) throw new Error('ConversationFeedback.create: conversation_id is required');
    if (!data.user_id) throw new Error('ConversationFeedback.create: user_id is required');

    const rating = Number(data.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('ConversationFeedback.create: rating must be an integer between 1 and 5');
    }

    let comment = null;
    if (data.comment !== undefined && data.comment !== null) {
      if (typeof data.comment !== 'string') {
        throw new Error('ConversationFeedback.create: comment must be a string');
      }
      const trimmed = data.comment.trim();
      if (trimmed.length > 0) {
        comment = trimmed.slice(0, MAX_COMMENT_LENGTH);
      }
    }

    const id = data.id || uuidv4();
    db.prepare(`
      INSERT INTO conversation_feedback (id, conversation_id, user_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(id, data.conversation_id, data.user_id, rating, comment);

    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM conversation_feedback WHERE id = ?').get(id) || null;
  },

  findByConversationId(conversationId) {
    return db.prepare('SELECT * FROM conversation_feedback WHERE conversation_id = ?').get(conversationId) || null;
  },

  /**
   * Aggregate stats across all feedback rows.
   * @returns {{ count: number, average_rating: number|null, distribution: { [rating: string]: number } }}
   */
  getAggregateStats() {
    const row = db.prepare('SELECT COUNT(*) AS count, AVG(rating) AS avg FROM conversation_feedback').get();
    const distRows = db.prepare(`
      SELECT rating, COUNT(*) AS count
      FROM conversation_feedback
      GROUP BY rating
    `).all();

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of distRows) {
      distribution[r.rating] = r.count;
    }

    return {
      count: row.count,
      average_rating: row.count > 0 ? Number(row.avg) : null,
      distribution,
    };
  },
};

module.exports = ConversationFeedback;
