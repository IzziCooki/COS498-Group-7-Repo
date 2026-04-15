'use strict';

const Database = require('better-sqlite3');
const mockDb = new Database(':memory:');
mockDb.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE skill_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    status TEXT DEFAULT 'started',
    practiced_at TEXT DEFAULT (datetime('now'))
  );
`);

jest.mock('../db/database', () => mockDb);

const SkillEvent = require('../models/SkillEvent');

const USER_ID = 'user-skill-test';

beforeEach(() => {
  mockDb.exec('DELETE FROM skill_events');
  mockDb.exec('DELETE FROM users');
  mockDb.prepare('INSERT INTO users (id) VALUES (?)').run(USER_ID);
});

// ─── SkillEvent.create ────────────────────────────────────────────────────────

describe('SkillEvent.create', () => {
  test('creates a skill event with required fields and defaults', () => {
    const event = SkillEvent.create({ user_id: USER_ID, skill_name: 'email_basics' });
    expect(event.id).toBeTruthy();
    expect(event.user_id).toBe(USER_ID);
    expect(event.skill_name).toBe('email_basics');
    expect(event.status).toBe('started');
    expect(event.practiced_at).toBeTruthy();
  });

  test('creates a skill event with completed status', () => {
    const event = SkillEvent.create({ user_id: USER_ID, skill_name: 'wifi_fix', status: 'completed' });
    expect(event.status).toBe('completed');
  });

  test('accepts a custom id', () => {
    const event = SkillEvent.create({ id: 'se-custom', user_id: USER_ID, skill_name: 'email_basics' });
    expect(event.id).toBe('se-custom');
  });

  test('accepts a custom practiced_at', () => {
    const ts = '2024-01-01T00:00:00.000Z';
    const event = SkillEvent.create({ user_id: USER_ID, skill_name: 'email_basics', practiced_at: ts });
    expect(event.practiced_at).toBe(ts);
  });

  test('throws when user_id is missing', () => {
    expect(() => SkillEvent.create({ skill_name: 'email_basics' })).toThrow(/user_id/);
  });

  test('throws when skill_name is missing', () => {
    expect(() => SkillEvent.create({ user_id: USER_ID })).toThrow(/skill_name/);
  });
});

// ─── SkillEvent.findById ──────────────────────────────────────────────────────

describe('SkillEvent.findById', () => {
  test('returns the event when found', () => {
    const created = SkillEvent.create({ user_id: USER_ID, skill_name: 'email_basics' });
    const found = SkillEvent.findById(created.id);
    expect(found).not.toBeNull();
    expect(found.skill_name).toBe('email_basics');
  });

  test('returns null when not found', () => {
    expect(SkillEvent.findById('nonexistent')).toBeNull();
  });
});

// ─── SkillEvent.findByUserId ──────────────────────────────────────────────────

describe('SkillEvent.findByUserId', () => {
  test('returns all events for a user', () => {
    SkillEvent.create({ user_id: USER_ID, skill_name: 'email_basics' });
    SkillEvent.create({ user_id: USER_ID, skill_name: 'wifi_fix' });
    const events = SkillEvent.findByUserId(USER_ID);
    expect(events.length).toBe(2);
  });

  test('returns events in descending order by practiced_at', () => {
    SkillEvent.create({ user_id: USER_ID, skill_name: 'email_basics', practiced_at: '2024-01-01T00:00:00.000Z' });
    SkillEvent.create({ user_id: USER_ID, skill_name: 'wifi_fix', practiced_at: '2024-06-01T00:00:00.000Z' });
    const events = SkillEvent.findByUserId(USER_ID);
    expect(events[0].skill_name).toBe('wifi_fix');
    expect(events[1].skill_name).toBe('email_basics');
  });

  test('returns empty array when user has no events', () => {
    expect(SkillEvent.findByUserId('no-events-user')).toEqual([]);
  });
});

// ─── SkillEvent.findBySkillName ───────────────────────────────────────────────

describe('SkillEvent.findBySkillName', () => {
  beforeEach(() => {
    SkillEvent.create({ user_id: USER_ID, skill_name: 'email_basics', practiced_at: '2024-01-01T00:00:00.000Z' });
    SkillEvent.create({ user_id: USER_ID, skill_name: 'email_basics', practiced_at: '2024-06-01T00:00:00.000Z' });
    SkillEvent.create({ user_id: USER_ID, skill_name: 'wifi_fix', practiced_at: '2024-03-01T00:00:00.000Z' });
  });

  test('returns only events for the specified skill', () => {
    const events = SkillEvent.findBySkillName(USER_ID, 'email_basics');
    expect(events.length).toBe(2);
    events.forEach(e => expect(e.skill_name).toBe('email_basics'));
  });

  test('returns empty array when no events for that skill', () => {
    expect(SkillEvent.findBySkillName(USER_ID, 'unknown_skill')).toEqual([]);
  });

  test('returns events in descending practiced_at order', () => {
    const events = SkillEvent.findBySkillName(USER_ID, 'email_basics');
    expect(events[0].practiced_at > events[1].practiced_at).toBe(true);
  });
});
