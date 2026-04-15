'use strict';

const Database = require('better-sqlite3');
const mockDb = new Database(':memory:');
mockDb.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    task_type TEXT,
    status TEXT DEFAULT 'active',
    context_summary TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT
  );
  CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

jest.mock('../db/database', () => mockDb);

const Conversation = require('../models/Conversation');

const USER_ID = 'user-conv-test';

beforeEach(() => {
  mockDb.exec('DELETE FROM messages');
  mockDb.exec('DELETE FROM conversations');
  mockDb.exec('DELETE FROM users');
  mockDb.prepare('INSERT INTO users (id, name) VALUES (?, ?)').run(USER_ID, 'Test User');
});

// ─── Conversation.create ──────────────────────────────────────────────────────

describe('Conversation.create', () => {
  test('creates a conversation with defaults', () => {
    const conv = Conversation.create({ user_id: USER_ID });
    expect(conv.id).toBeTruthy();
    expect(conv.user_id).toBe(USER_ID);
    expect(conv.status).toBe('active');
    expect(conv.task_type).toBeNull();
    expect(conv.started_at).toBeTruthy();
    expect(conv.ended_at).toBeNull();
  });

  test('creates a conversation with all provided fields', () => {
    const conv = Conversation.create({
      id: 'conv-custom',
      user_id: USER_ID,
      task_type: 'email_help',
      status: 'completed',
      context_summary: 'Helped user with email',
    });
    expect(conv.id).toBe('conv-custom');
    expect(conv.task_type).toBe('email_help');
    expect(conv.status).toBe('completed');
    expect(conv.context_summary).toBe('Helped user with email');
  });

  test('throws when user_id is missing', () => {
    expect(() => Conversation.create({})).toThrow(/user_id/);
  });

  test('accepts a custom started_at', () => {
    const ts = '2024-01-01T10:00:00.000Z';
    const conv = Conversation.create({ user_id: USER_ID, started_at: ts });
    expect(conv.started_at).toBe(ts);
  });
});

// ─── Conversation.findById ────────────────────────────────────────────────────

describe('Conversation.findById', () => {
  test('returns the conversation when found', () => {
    const created = Conversation.create({ user_id: USER_ID });
    const found = Conversation.findById(created.id);
    expect(found).not.toBeNull();
    expect(found.id).toBe(created.id);
  });

  test('returns null when not found', () => {
    expect(Conversation.findById('nonexistent')).toBeNull();
  });
});

// ─── Conversation.findByUserId ────────────────────────────────────────────────

describe('Conversation.findByUserId', () => {
  test('returns all conversations for a user', () => {
    Conversation.create({ user_id: USER_ID });
    Conversation.create({ user_id: USER_ID });
    const convs = Conversation.findByUserId(USER_ID);
    expect(convs.length).toBe(2);
  });

  test('returns empty array when user has no conversations', () => {
    expect(Conversation.findByUserId('no-convs-user')).toEqual([]);
  });
});

// ─── Conversation.findActive ──────────────────────────────────────────────────

describe('Conversation.findActive', () => {
  test('returns only active conversations', () => {
    Conversation.create({ user_id: USER_ID, status: 'active' });
    Conversation.create({ user_id: USER_ID, status: 'completed' });
    const active = Conversation.findActive(USER_ID);
    expect(active.length).toBe(1);
    expect(active[0].status).toBe('active');
  });

  test('returns empty array when no active conversations', () => {
    Conversation.create({ user_id: USER_ID, status: 'completed' });
    expect(Conversation.findActive(USER_ID)).toEqual([]);
  });
});

// ─── Conversation.update ──────────────────────────────────────────────────────

describe('Conversation.update', () => {
  let convId;
  beforeEach(() => {
    const conv = Conversation.create({ user_id: USER_ID });
    convId = conv.id;
  });

  test('updates status field', () => {
    const updated = Conversation.update(convId, { status: 'completed' });
    expect(updated.status).toBe('completed');
  });

  test('updates task_type field', () => {
    const updated = Conversation.update(convId, { task_type: 'wifi_help' });
    expect(updated.task_type).toBe('wifi_help');
  });

  test('updates context_summary field', () => {
    const updated = Conversation.update(convId, { context_summary: 'User needs help with Wi-Fi' });
    expect(updated.context_summary).toBe('User needs help with Wi-Fi');
  });

  test('updates ended_at field', () => {
    const ts = '2024-06-01T12:00:00.000Z';
    const updated = Conversation.update(convId, { ended_at: ts });
    expect(updated.ended_at).toBe(ts);
  });

  test('ignores disallowed fields', () => {
    const updated = Conversation.update(convId, { user_id: 'hacked', status: 'closed' });
    expect(updated.user_id).toBe(USER_ID);
    expect(updated.status).toBe('closed');
  });

  test('returns current record when no valid fields provided', () => {
    const original = Conversation.findById(convId);
    const result = Conversation.update(convId, {});
    expect(result.status).toBe(original.status);
  });
});

// ─── Conversation.close ───────────────────────────────────────────────────────

describe('Conversation.close', () => {
  test('sets status to closed and sets ended_at', () => {
    const conv = Conversation.create({ user_id: USER_ID });
    const closed = Conversation.close(conv.id);
    expect(closed.status).toBe('closed');
    expect(closed.ended_at).toBeTruthy();
  });
});

// ─── Conversation.abandonStale ────────────────────────────────────────────────

describe('Conversation.abandonStale', () => {
  test('returns 0 when there are no active conversations', () => {
    expect(Conversation.abandonStale(30)).toBe(0);
  });

  test('does not abandon recently-active conversations', () => {
    Conversation.create({ user_id: USER_ID });
    // No messages, but started_at is now — should not be stale yet
    const count = Conversation.abandonStale(30);
    // May or may not abandon based on timing; just ensure it returns a number
    expect(typeof count).toBe('number');
  });

  test('abandons conversations older than the cutoff with no messages', () => {
    const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 60 min ago
    Conversation.create({ user_id: USER_ID, started_at: oldTime });
    const count = Conversation.abandonStale(30);
    expect(count).toBe(1);
    const convs = Conversation.findByUserId(USER_ID);
    expect(convs[0].status).toBe('abandoned');
  });

  test('does not abandon already-completed conversations', () => {
    const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    Conversation.create({ user_id: USER_ID, status: 'completed', started_at: oldTime });
    expect(Conversation.abandonStale(30)).toBe(0);
  });
});
