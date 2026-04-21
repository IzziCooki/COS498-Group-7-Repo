#!/usr/bin/env node
/**
 * export-training-data.js
 *
 * Exports opted-in users' completed conversations as JSONL suitable for
 * fine-tuning. Each line is a JSON object:
 *
 *   {
 *     "conversation_id": "...",
 *     "user_id": "...",
 *     "started_at": "...",
 *     "messages": [ { "role": "user" | "assistant", "content": "..." }, ... ]
 *   }
 *
 * Only conversations owned by users with `training_opt_in = 1` are
 * included. Anonymous users never have rows in the conversations table,
 * so they're naturally excluded.
 *
 * Usage:
 *   node scripts/export-training-data.js [--out path/to/file.jsonl]
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
let outPath = path.join(__dirname, '..', 'data', 'training', `training-${new Date().toISOString().slice(0, 10)}.jsonl`);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--out' && argv[i + 1]) {
    outPath = argv[i + 1];
    i++;
  }
}

const db = require('../server/db/database');

const users = db.prepare('SELECT id FROM users WHERE training_opt_in = 1').all();
if (users.length === 0) {
  console.log('[export-training] No users have opted in to training data sharing.');
  process.exit(0);
}
const userIds = new Set(users.map(u => u.id));
console.log(`[export-training] ${userIds.size} opted-in users.`);

const conversations = db.prepare(`
  SELECT id, user_id, started_at, ended_at, status
  FROM conversations
  WHERE status IN ('completed', 'closed', 'abandoned')
  ORDER BY started_at ASC
`).all().filter(c => userIds.has(c.user_id));

console.log(`[export-training] ${conversations.length} conversations to export.`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const out = fs.createWriteStream(outPath, { encoding: 'utf8' });

let emitted = 0;
let skipped = 0;
const msgStmt = db.prepare('SELECT role, body FROM messages WHERE conversation_id = ? ORDER BY created_at ASC');
for (const conv of conversations) {
  const messages = msgStmt.all(conv.id);
  if (messages.length < 2) { skipped++; continue; }
  const record = {
    conversation_id: conv.id,
    user_id: conv.user_id,
    started_at: conv.started_at,
    messages: messages.map(m => ({ role: m.role, content: m.body })),
  };
  out.write(JSON.stringify(record) + '\n');
  emitted++;
}

out.end(() => {
  console.log(`[export-training] Wrote ${emitted} records to ${outPath} (${skipped} skipped as too short).`);
});
