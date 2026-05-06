const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Tail a string to keep DB rows small and avoid persisting MBs of stdout.
function tail(text, n = 1000) {
  if (!text) return '';
  const s = String(text);
  return s.length <= n ? s : s.slice(-n);
}

const FixLog = {
  create(data) {
    if (!data.tool_name) throw new Error('FixLog.create: tool_name is required');
    if (!data.command) throw new Error('FixLog.create: command is required');
    const id = data.id || uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO fix_log (
        id, session_id, user_id, tool_name, command,
        exit_code, stdout_tail, stderr_tail, ran_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.session_id || null,
      data.user_id || null,
      data.tool_name,
      data.command,
      typeof data.exit_code === 'number' ? data.exit_code : null,
      tail(data.stdout_tail || data.stdout || ''),
      tail(data.stderr_tail || data.stderr || ''),
      data.ran_at || now,
    );
    return this.findById(id);
  },

  findById(id) {
    return db.prepare('SELECT * FROM fix_log WHERE id = ?').get(id) || null;
  },

  findBySession(sessionId) {
    return db.prepare('SELECT * FROM fix_log WHERE session_id = ? ORDER BY ran_at ASC').all(sessionId);
  },

  findByUser(userId, limit = 50) {
    return db.prepare(
      'SELECT * FROM fix_log WHERE user_id = ? ORDER BY ran_at DESC LIMIT ?'
    ).all(userId, limit);
  },
};

module.exports = FixLog;
