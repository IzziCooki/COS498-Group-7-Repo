const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const Message = {
  create(data) {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO messages (id, conversation_id, role, body, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.conversation_id,
      data.role,
      data.body,
      data.created_at || now
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) || null;
  },

  findByConversationId(conversationId, limit) {
    if (limit !== undefined) {
      return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?').all(conversationId, limit);
    }
    return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId);
  },

  getRecent(conversationId, limit = 20) {
    return db.prepare(`
      SELECT * FROM (
        SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?
      ) ORDER BY created_at ASC
    `).all(conversationId, limit);
  },
};

module.exports = Message;
