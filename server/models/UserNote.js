const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const UserNote = {
  create(data) {
    if (!data.user_id) throw new Error('UserNote.create: user_id is required');
    if (!data.title) throw new Error('UserNote.create: title is required');
    if (!data.content) throw new Error('UserNote.create: content is required');
    const id = data.id || uuidv4();
    db.prepare(`
      INSERT INTO user_notes (id, user_id, title, content)
      VALUES (?, ?, ?, ?)
    `).run(id, data.user_id, data.title, data.content);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM user_notes WHERE id = ?').get(id) || null;
  },

  findByUserId(userId) {
    return db.prepare('SELECT * FROM user_notes WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  delete(id) {
    db.prepare('DELETE FROM user_notes WHERE id = ?').run(id);
  },
};

module.exports = UserNote;
