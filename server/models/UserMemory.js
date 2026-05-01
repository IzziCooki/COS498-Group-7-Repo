const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const { MEMORY_TYPES } = require('../core/sharedConstants');

const VALID_TYPES = MEMORY_TYPES;

const UserMemory = {
  create(data) {
    if (!data.user_id) throw new Error('UserMemory.create: user_id is required');
    if (!data.type || !VALID_TYPES.includes(data.type)) throw new Error(`UserMemory.create: type must be one of ${VALID_TYPES.join(', ')}`);
    if (!data.content) throw new Error('UserMemory.create: content is required');
    const id = data.id || uuidv4();
    db.prepare(`
      INSERT INTO user_memories (id, user_id, type, content, source, relevance)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.user_id, data.type, data.content, data.source || null, data.relevance ?? 5);
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM user_memories WHERE id = ?').get(id) || null;
  },

  findByUserId(userId, limit = 50) {
    return db.prepare(
      'SELECT * FROM user_memories WHERE user_id = ? ORDER BY relevance DESC, created_at DESC LIMIT ?'
    ).all(userId, limit);
  },

  findByType(userId, type) {
    return db.prepare(
      'SELECT * FROM user_memories WHERE user_id = ? AND type = ? ORDER BY relevance DESC, created_at DESC'
    ).all(userId, type);
  },

  markReferenced(id) {
    db.prepare("UPDATE user_memories SET last_referenced_at = datetime('now') WHERE id = ?").run(id);
  },

  updateRelevance(id, relevance) {
    db.prepare('UPDATE user_memories SET relevance = ? WHERE id = ?').run(relevance, id);
  },

  delete(id) {
    db.prepare('DELETE FROM user_memories WHERE id = ?').run(id);
  },

  /**
   * Build a concise memory summary for injection into the system prompt.
   * Groups by type and limits total length.
   */
  buildMemorySummary(userId, maxChars = 600) {
    const memories = this.findByUserId(userId, 30);
    if (memories.length === 0) return null;

    const grouped = {};
    for (const m of memories) {
      if (!grouped[m.type]) grouped[m.type] = [];
      grouped[m.type].push(m.content);
    }

    const labels = {
      preference: 'Prefers',
      struggle: 'Struggles with',
      breakthrough: 'Learned',
      context: 'Personal context',
      pattern: 'Patterns noticed',
    };

    const lines = [];
    for (const type of VALID_TYPES) {
      if (!grouped[type]) continue;
      const items = grouped[type].slice(0, 3);
      lines.push(`${labels[type]}: ${items.join('; ')}`);
    }

    let summary = lines.join('\n');
    if (summary.length > maxChars) {
      summary = summary.substring(0, maxChars - 3) + '...';
    }
    return summary;
  },
};

module.exports = UserMemory;
