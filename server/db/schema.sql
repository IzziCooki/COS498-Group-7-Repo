CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  os_type TEXT,
  vocabulary_level TEXT DEFAULT 'basic',
  accessibility_needs TEXT DEFAULT '[]',
  comfort_level INTEGER DEFAULT 1,
  onboarded INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_type TEXT,
  status TEXT DEFAULT 'active',
  context_summary TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  ended_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS step_sequences (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  steps TEXT NOT NULL,
  current_index INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS skill_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  status TEXT DEFAULT 'started',
  practiced_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS safety_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  trigger_text TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Buddy/collaboration relationships between users
CREATE TABLE IF NOT EXISTS buddy_pairs (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  helper_id TEXT,
  relationship_type TEXT DEFAULT 'peer',
  status TEXT DEFAULT 'pending',
  invite_code TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (learner_id) REFERENCES users(id),
  FOREIGN KEY (helper_id) REFERENCES users(id)
);

-- Progress shared with buddy
CREATE TABLE IF NOT EXISTS progress_shares (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  buddy_pair_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  message TEXT NOT NULL,
  seen INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (buddy_pair_id) REFERENCES buddy_pairs(id)
);

-- Help requests from learner to buddy
CREATE TABLE IF NOT EXISTS help_requests (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL,
  buddy_pair_id TEXT NOT NULL,
  question TEXT NOT NULL,
  context_summary TEXT,
  status TEXT DEFAULT 'open',
  response TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  answered_at TEXT,
  FOREIGN KEY (learner_id) REFERENCES users(id),
  FOREIGN KEY (buddy_pair_id) REFERENCES buddy_pairs(id)
);

-- Spaced repetition review schedule
CREATE TABLE IF NOT EXISTS skill_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  review_due_at TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User learning goals
CREATE TABLE IF NOT EXISTS user_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_text TEXT NOT NULL,
  related_skills TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
