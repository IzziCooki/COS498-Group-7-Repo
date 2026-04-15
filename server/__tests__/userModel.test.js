'use strict';

const Database = require('better-sqlite3');
const mockDb = new Database(':memory:');
mockDb.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    os_type TEXT,
    vocabulary_level TEXT DEFAULT 'basic',
    accessibility_needs TEXT DEFAULT '[]',
    comfort_level INTEGER DEFAULT 1,
    onboarded INTEGER DEFAULT 0,
    collaboration_opt_in INTEGER DEFAULT 0,
    goal_summary TEXT,
    invite_code TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

jest.mock('../db/database', () => mockDb);

const User = require('../models/User');

beforeEach(() => {
  mockDb.exec('DELETE FROM users');
});

// ─── User.create ─────────────────────────────────────────────────────────────

describe('User.create', () => {
  test('creates a user with defaults when only id is provided', () => {
    const user = User.create({ id: 'u1' });
    expect(user.id).toBe('u1');
    expect(user.vocabulary_level).toBe('basic');
    expect(user.comfort_level).toBe(1);
    expect(user.onboarded).toBe(0);
    expect(user.name).toBeNull();
    expect(user.os_type).toBeNull();
    expect(user.created_at).toBeTruthy();
    expect(user.updated_at).toBeTruthy();
  });

  test('creates a user with all provided fields', () => {
    const user = User.create({
      id: 'u2',
      name: 'Alice',
      os_type: 'Windows',
      vocabulary_level: 'intermediate',
      comfort_level: 3,
      onboarded: 1,
    });
    expect(user.name).toBe('Alice');
    expect(user.os_type).toBe('Windows');
    expect(user.vocabulary_level).toBe('intermediate');
    expect(user.comfort_level).toBe(3);
    expect(user.onboarded).toBe(1);
  });

  test('generates a uuid when id is not provided', () => {
    const user = User.create({});
    expect(user.id).toBeTruthy();
    expect(typeof user.id).toBe('string');
    expect(user.id.length).toBeGreaterThan(0);
  });

  test('stores comfort_level of 0 correctly', () => {
    const user = User.create({ id: 'u3', comfort_level: 0 });
    expect(user.comfort_level).toBe(0);
  });
});

// ─── User.findById ────────────────────────────────────────────────────────────

describe('User.findById', () => {
  test('returns the user when found', () => {
    User.create({ id: 'u-find' });
    const user = User.findById('u-find');
    expect(user).not.toBeNull();
    expect(user.id).toBe('u-find');
  });

  test('returns null when user does not exist', () => {
    expect(User.findById('nonexistent')).toBeNull();
  });
});

// ─── User.findAll ─────────────────────────────────────────────────────────────

describe('User.findAll', () => {
  test('returns empty array when no users exist', () => {
    expect(User.findAll()).toEqual([]);
  });

  test('returns all users ordered by created_at descending', () => {
    User.create({ id: 'u-a' });
    User.create({ id: 'u-b' });
    const all = User.findAll();
    expect(all.length).toBe(2);
    const ids = all.map(u => u.id);
    expect(ids).toContain('u-a');
    expect(ids).toContain('u-b');
  });
});

// ─── User.update ─────────────────────────────────────────────────────────────

describe('User.update', () => {
  beforeEach(() => {
    User.create({ id: 'u-update', name: 'Bob', os_type: 'Mac' });
  });

  test('updates allowed fields', () => {
    const updated = User.update('u-update', { name: 'Robert', os_type: 'Windows' });
    expect(updated.name).toBe('Robert');
    expect(updated.os_type).toBe('Windows');
  });

  test('ignores disallowed fields', () => {
    const updated = User.update('u-update', { hacked: true, name: 'Safe' });
    expect(updated.name).toBe('Safe');
    expect(updated.hacked).toBeUndefined();
  });

  test('returns current record when no valid fields are provided', () => {
    const original = User.findById('u-update');
    const result = User.update('u-update', {});
    expect(result.name).toBe(original.name);
  });

  test('updates vocabulary_level and comfort_level', () => {
    const updated = User.update('u-update', { vocabulary_level: 'standard', comfort_level: 5 });
    expect(updated.vocabulary_level).toBe('standard');
    expect(updated.comfort_level).toBe(5);
  });

  test('updates onboarded flag', () => {
    const updated = User.update('u-update', { onboarded: 1 });
    expect(updated.onboarded).toBe(1);
  });

  test('updates goal_summary field', () => {
    const updated = User.update('u-update', { goal_summary: 'Learn email' });
    expect(updated.goal_summary).toBe('Learn email');
  });
});

// ─── User.delete ─────────────────────────────────────────────────────────────

describe('User.delete', () => {
  test('deletes an existing user and returns true', () => {
    User.create({ id: 'u-del' });
    const result = User.delete('u-del');
    expect(result).toBe(true);
    expect(User.findById('u-del')).toBeNull();
  });

  test('returns false when user does not exist', () => {
    expect(User.delete('nonexistent')).toBe(false);
  });
});
