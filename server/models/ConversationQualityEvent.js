const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const ConversationQualityEvent = {
  create(data) {
    if (!data.conversation_id) throw new Error('ConversationQualityEvent.create: conversation_id is required');
    if (!data.user_id) throw new Error('ConversationQualityEvent.create: user_id is required');
    if (!data.event_type) throw new Error('ConversationQualityEvent.create: event_type is required');
    const id = data.id || uuidv4();
    const stmt = db.prepare(`
      INSERT INTO conversation_quality_events (id, conversation_id, user_id, event_type, detail, turn_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(id, data.conversation_id, data.user_id, data.event_type, data.detail || null, data.turn_number || null);
    return { id, ...data };
  },

  findByConversationId(conversationId) {
    return db.prepare('SELECT * FROM conversation_quality_events WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId);
  },

  findByEventType(eventType, limit = 100) {
    return db.prepare('SELECT * FROM conversation_quality_events WHERE event_type = ? ORDER BY created_at DESC LIMIT ?').all(eventType, limit);
  },

  getAggregateByType() {
    return db.prepare(`
      SELECT event_type, COUNT(*) as count
      FROM conversation_quality_events
      GROUP BY event_type
      ORDER BY count DESC
    `).all();
  },

  getRecentEvents(limit = 50) {
    return db.prepare('SELECT * FROM conversation_quality_events ORDER BY created_at DESC LIMIT ?').all(limit);
  },
};

module.exports = ConversationQualityEvent;
