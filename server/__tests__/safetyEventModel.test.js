'use strict';

const Database = require('better-sqlite3');
const mockDb = new Database(':memory:');
mockDb.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE safety_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    trigger_text TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

jest.mock('../db/database', () => mockDb);

const SafetyEvent = require('../models/SafetyEvent');

const USER_ID = 'user-safety-test';

beforeEach(() => {
  mockDb.exec('DELETE FROM safety_events');
  mockDb.exec('DELETE FROM users');
  mockDb.prepare('INSERT INTO users (id) VALUES (?)').run(USER_ID);
});

// ─── SafetyEvent.create ───────────────────────────────────────────────────────

describe('SafetyEvent.create', () => {
  test('creates a safety event with required fields', () => {
    const event = SafetyEvent.create({ user_id: USER_ID, event_type: 'emergency' });
    expect(event.id).toBeTruthy();
    expect(event.user_id).toBe(USER_ID);
    expect(event.event_type).toBe('emergency');
    expect(event.trigger_text).toBeNull();
    expect(event.created_at).toBeTruthy();
  });

  test('creates a safety event with trigger_text', () => {
    const event = SafetyEvent.create({
      user_id: USER_ID,
      event_type: 'scam',
      trigger_text: 'someone asked for my bank account',
    });
    expect(event.trigger_text).toBe('someone asked for my bank account');
  });

  test('accepts a custom id', () => {
    const event = SafetyEvent.create({ id: 'se-custom', user_id: USER_ID, event_type: 'emergency' });
    expect(event.id).toBe('se-custom');
  });

  test('accepts a custom created_at', () => {
    const ts = '2024-01-01T00:00:00.000Z';
    const event = SafetyEvent.create({ user_id: USER_ID, event_type: 'emergency', created_at: ts });
    expect(event.created_at).toBe(ts);
  });

  test('throws when user_id is missing', () => {
    expect(() => SafetyEvent.create({ event_type: 'emergency' })).toThrow(/user_id/);
  });

  test('throws when event_type is missing', () => {
    expect(() => SafetyEvent.create({ user_id: USER_ID })).toThrow(/event_type/);
  });
});

// ─── SafetyEvent.findById ─────────────────────────────────────────────────────

describe('SafetyEvent.findById', () => {
  test('returns the event when found', () => {
    const created = SafetyEvent.create({ user_id: USER_ID, event_type: 'scam' });
    const found = SafetyEvent.findById(created.id);
    expect(found).not.toBeNull();
    expect(found.event_type).toBe('scam');
  });

  test('returns null when not found', () => {
    expect(SafetyEvent.findById('nonexistent')).toBeNull();
  });
});

// ─── SafetyEvent.findByUserId ─────────────────────────────────────────────────

describe('SafetyEvent.findByUserId', () => {
  test('returns all events for a user', () => {
    SafetyEvent.create({ user_id: USER_ID, event_type: 'emergency' });
    SafetyEvent.create({ user_id: USER_ID, event_type: 'scam' });
    const events = SafetyEvent.findByUserId(USER_ID);
    expect(events.length).toBe(2);
  });

  test('returns events in descending order by created_at', () => {
    SafetyEvent.create({ user_id: USER_ID, event_type: 'scam', created_at: '2024-01-01T00:00:00.000Z' });
    SafetyEvent.create({ user_id: USER_ID, event_type: 'emergency', created_at: '2024-06-01T00:00:00.000Z' });
    const events = SafetyEvent.findByUserId(USER_ID);
    expect(events[0].event_type).toBe('emergency');
    expect(events[1].event_type).toBe('scam');
  });

  test('returns empty array when user has no events', () => {
    expect(SafetyEvent.findByUserId('no-events-user')).toEqual([]);
  });
});
