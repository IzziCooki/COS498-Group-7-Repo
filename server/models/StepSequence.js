const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const StepSequence = {
  create(data) {
    const id = data.id || uuidv4();
    const stmt = db.prepare(`
      INSERT INTO step_sequences (id, conversation_id, steps, current_index, completed)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.conversation_id,
      typeof data.steps === 'string' ? data.steps : JSON.stringify(data.steps),
      data.current_index !== undefined ? data.current_index : 0,
      data.completed !== undefined ? data.completed : 0
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM step_sequences WHERE id = ?').get(id) || null;
  },

  findByConversationId(conversationId) {
    return db.prepare('SELECT * FROM step_sequences WHERE conversation_id = ?').all(conversationId);
  },

  update(id, fields) {
    const allowed = ['steps', 'current_index', 'completed'];
    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        const val = key === 'steps' && typeof fields[key] !== 'string'
          ? JSON.stringify(fields[key])
          : fields[key];
        values.push(val);
      }
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    db.prepare(`UPDATE step_sequences SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },
};

module.exports = StepSequence;
