const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use /data for persistent storage on HF Spaces, fall back to local for dev
const PERSISTENT_DIR = '/data';
const usesPersistentStorage = fs.existsSync(PERSISTENT_DIR);
const DB_PATH = usesPersistentStorage
  ? path.join(PERSISTENT_DIR, 'pcpal.db')
  : path.join(__dirname, 'pcpal.db');

if (usesPersistentStorage) {
  console.log('[database] Using persistent storage at /data/pcpal.db');
}
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

// Run additive migrations for new columns on existing tables.
// Each ALTER TABLE is wrapped in try/catch so it's idempotent —
// if the column already exists, SQLite throws and we just move on.
function runMigrations() {
  const migrations = [
    'ALTER TABLE users ADD COLUMN collaboration_opt_in INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN goal_summary TEXT',
    'ALTER TABLE users ADD COLUMN invite_code TEXT',
    'ALTER TABLE users ADD COLUMN model_preference TEXT',
    'ALTER TABLE users ADD COLUMN email TEXT',
    'ALTER TABLE users ADD COLUMN password_hash TEXT',
    'ALTER TABLE users ADD COLUMN is_anonymous INTEGER DEFAULT 1',
    'ALTER TABLE users ADD COLUMN training_opt_in INTEGER DEFAULT 0',
    'ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0',
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch (e) {
      // Column already exists — safe to ignore
    }
  }
}

runMigrations();

// Indexes that depend on migration-added columns must run after the ALTERs.
try {
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
      ON users(lower(email)) WHERE email IS NOT NULL
  `);
} catch (e) {
  console.warn('[database] Could not create users_email_unique index:', e.message);
}

// Standalone tables — CREATE TABLE IF NOT EXISTS is inherently idempotent.
db.exec(`
  CREATE TABLE IF NOT EXISTS user_vocabulary (
    user_id TEXT NOT NULL,
    term TEXT NOT NULL,
    encounter_count INTEGER DEFAULT 0,
    last_seen_at TEXT,
    PRIMARY KEY (user_id, term)
  )
`);

module.exports = db;
