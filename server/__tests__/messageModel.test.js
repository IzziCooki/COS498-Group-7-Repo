'use strict';

const Database = require('better-sqlite3');
const mockDb = new Database(':memory:');
mockDb.exec(`
  CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT,
    body TEXT,
    created_at TEXT DEFAULT (datetime('now'))
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

const Message = require('../models/Message');

const CONV_ID = 'conv-test-1';

beforeEach(() => {
  mockDb.exec('DELETE FROM messages');
});

// ─── Message.create ───────────────────────────────────────────────────────────

describe('Message.create', () => {
  test('creates a message and returns it', () => {
    const msg = Message.create({ conversation_id: CONV_ID, role: 'user', body: 'Hello!' });
    expect(msg.id).toBeTruthy();
    expect(msg.conversation_id).toBe(CONV_ID);
    expect(msg.role).toBe('user');
    expect(msg.body).toBe('Hello!');
    expect(msg.created_at).toBeTruthy();
  });

  test('creates an assistant message', () => {
    const msg = Message.create({ conversation_id: CONV_ID, role: 'assistant', body: 'How can I help?' });
    expect(msg.role).toBe('assistant');
  });

  test('accepts a custom id', () => {
    const msg = Message.create({ id: 'msg-custom', conversation_id: CONV_ID, role: 'user', body: 'Hi' });
    expect(msg.id).toBe('msg-custom');
  });

  test('accepts a custom created_at', () => {
    const ts = '2024-01-01T00:00:00.000Z';
    const msg = Message.create({ conversation_id: CONV_ID, role: 'user', body: 'Hi', created_at: ts });
    expect(msg.created_at).toBe(ts);
  });

  test('throws when conversation_id is missing', () => {
    expect(() => Message.create({ role: 'user', body: 'Hi' })).toThrow(/conversation_id/);
  });

  test('throws when role is missing', () => {
    expect(() => Message.create({ conversation_id: CONV_ID, body: 'Hi' })).toThrow(/role/);
  });

  test('throws when body is missing', () => {
    expect(() => Message.create({ conversation_id: CONV_ID, role: 'user' })).toThrow(/body/);
  });
});

// ─── Message.findById ─────────────────────────────────────────────────────────

describe('Message.findById', () => {
  test('returns message when found', () => {
    const created = Message.create({ conversation_id: CONV_ID, role: 'user', body: 'Test' });
    const found = Message.findById(created.id);
    expect(found).not.toBeNull();
    expect(found.id).toBe(created.id);
  });

  test('returns null when message does not exist', () => {
    expect(Message.findById('nonexistent')).toBeNull();
  });
});

// ─── Message.findByConversationId ─────────────────────────────────────────────

describe('Message.findByConversationId', () => {
  beforeEach(() => {
    const t1 = '2024-01-01T00:00:00.000Z';
    const t2 = '2024-01-01T00:01:00.000Z';
    const t3 = '2024-01-01T00:02:00.000Z';
    Message.create({ conversation_id: CONV_ID, role: 'user', body: 'First', created_at: t1 });
    Message.create({ conversation_id: CONV_ID, role: 'assistant', body: 'Second', created_at: t2 });
    Message.create({ conversation_id: CONV_ID, role: 'user', body: 'Third', created_at: t3 });
  });

  test('returns all messages for a conversation in order', () => {
    const msgs = Message.findByConversationId(CONV_ID);
    expect(msgs.length).toBe(3);
    expect(msgs[0].body).toBe('First');
    expect(msgs[2].body).toBe('Third');
  });

  test('returns empty array for unknown conversation', () => {
    expect(Message.findByConversationId('unknown-conv')).toEqual([]);
  });

  test('respects limit when provided', () => {
    const msgs = Message.findByConversationId(CONV_ID, 2);
    expect(msgs.length).toBe(2);
  });

  test('returns all when limit is undefined', () => {
    const msgs = Message.findByConversationId(CONV_ID, undefined);
    expect(msgs.length).toBe(3);
  });
});

// ─── Message.getRecent ────────────────────────────────────────────────────────

describe('Message.getRecent', () => {
  beforeEach(() => {
    for (let i = 1; i <= 25; i++) {
      const ts = `2024-01-01T${String(i).padStart(2, '0')}:00:00.000Z`;
      Message.create({ conversation_id: CONV_ID, role: 'user', body: `msg-${i}`, created_at: ts });
    }
  });

  test('returns at most 20 messages by default', () => {
    const msgs = Message.getRecent(CONV_ID);
    expect(msgs.length).toBe(20);
  });

  test('returns messages in ascending order (oldest first)', () => {
    const msgs = Message.getRecent(CONV_ID, 5);
    // getRecent picks the most recent 5 then re-orders them ascending
    expect(msgs.length).toBe(5);
    for (let i = 0; i < msgs.length - 1; i++) {
      expect(msgs[i].created_at <= msgs[i + 1].created_at).toBe(true);
    }
  });

  test('returns messages in ascending order for default limit', () => {
    const msgs = Message.getRecent(CONV_ID);
    for (let i = 0; i < msgs.length - 1; i++) {
      expect(msgs[i].created_at <= msgs[i + 1].created_at).toBe(true);
    }
  });

  test('returns empty array for unknown conversation', () => {
    expect(Message.getRecent('unknown-conv')).toEqual([]);
  });
});
