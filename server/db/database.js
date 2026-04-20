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

module.exports = db;
