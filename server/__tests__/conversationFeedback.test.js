'use strict';

// Replace the shared better-sqlite3 instance with a throw-away in-memory DB
// so the model's real SQL (including UNIQUE + CHECK constraints) is exercised
// without touching the on-disk database.
const Database = require('better-sqlite3');
const mockDb = new Database(':memory:');
mockDb.exec(`
  CREATE TABLE conversation_feedback (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    ai_suggestion TEXT,
    ai_suggestion_generated_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

jest.mock('../db/database', () => mockDb);

const ConversationFeedback = require('../models/ConversationFeedback');

beforeEach(() => {
  mockDb.exec('DELETE FROM conversation_feedback');
});

describe('ConversationFeedback.create', () => {
  test('inserts a row with trimmed comment and returns it', () => {
    const row = ConversationFeedback.create({
      conversation_id: 'conv-1',
      user_id: 'user-1',
      rating: 5,
      comment: '   great help!   ',
    });
    expect(row).toMatchObject({
      conversation_id: 'conv-1',
      user_id: 'user-1',
      rating: 5,
      comment: 'great help!',
    });
    expect(row.id).toBeTruthy();
    expect(row.created_at).toBeTruthy();
  });

  test('stores null comment when omitted or blank', () => {
    const a = ConversationFeedback.create({
      conversation_id: 'conv-a',
      user_id: 'user-1',
      rating: 3,
    });
    const b = ConversationFeedback.create({
      conversation_id: 'conv-b',
      user_id: 'user-1',
      rating: 3,
      comment: '   ',
    });
    expect(a.comment).toBeNull();
    expect(b.comment).toBeNull();
  });

  test.each([0, 6, -1, 2.5, 'four', null])('rejects invalid rating: %p', (rating) => {
    expect(() =>
      ConversationFeedback.create({ conversation_id: 'conv-x', user_id: 'user-1', rating }),
    ).toThrow(/rating/);
  });

  test('rejects missing conversation_id or user_id', () => {
    expect(() => ConversationFeedback.create({ user_id: 'u', rating: 4 })).toThrow(/conversation_id/);
    expect(() => ConversationFeedback.create({ conversation_id: 'c', rating: 4 })).toThrow(/user_id/);
  });

  test('rejects a non-string comment', () => {
    expect(() =>
      ConversationFeedback.create({ conversation_id: 'c', user_id: 'u', rating: 4, comment: 123 }),
    ).toThrow(/comment/);
  });

  test('double-submit for the same conversation is rejected by UNIQUE constraint', () => {
    ConversationFeedback.create({ conversation_id: 'conv-dup', user_id: 'user-1', rating: 4 });
    expect(() =>
      ConversationFeedback.create({ conversation_id: 'conv-dup', user_id: 'user-1', rating: 2 }),
    ).toThrow();
  });

  test('truncates very long comments to the max length', () => {
    const long = 'x'.repeat(3000);
    const row = ConversationFeedback.create({
      conversation_id: 'conv-long',
      user_id: 'user-1',
      rating: 4,
      comment: long,
    });
    expect(row.comment.length).toBe(2000);
  });
});

describe('ConversationFeedback.findByConversationId', () => {
  test('returns the row when it exists, null otherwise', () => {
    expect(ConversationFeedback.findByConversationId('missing')).toBeNull();
    ConversationFeedback.create({ conversation_id: 'conv-1', user_id: 'user-1', rating: 5 });
    const row = ConversationFeedback.findByConversationId('conv-1');
    expect(row).not.toBeNull();
    expect(row.rating).toBe(5);
  });
});

describe('ConversationFeedback.getRecentWithSuggestions', () => {
  // Small helper: create a row and backfill its ai_suggestion so we can test
  // the query side. The real path goes through feedbackAnalyzer → setAiSuggestion,
  // but here we write directly so we control timing/order.
  function seed({ conv, user, rating, suggestion, createdAt }) {
    ConversationFeedback.create({ conversation_id: conv, user_id: user, rating });
    mockDb.prepare(
      'UPDATE conversation_feedback SET ai_suggestion = ?, created_at = ? WHERE conversation_id = ?',
    ).run(suggestion, createdAt, conv);
  }

  test('returns this user\'s rows in DESC created_at order, respecting limit', () => {
    seed({ conv: 'c-old', user: 'u-1', rating: 2, suggestion: 'old note', createdAt: '2026-04-18 10:00:00' });
    seed({ conv: 'c-mid', user: 'u-1', rating: 3, suggestion: 'mid note', createdAt: '2026-04-19 10:00:00' });
    seed({ conv: 'c-new', user: 'u-1', rating: 1, suggestion: 'new note', createdAt: '2026-04-20 10:00:00' });

    const rows = ConversationFeedback.getRecentWithSuggestions('u-1', 2);
    expect(rows).toHaveLength(2);
    expect(rows[0].ai_suggestion).toBe('new note');
    expect(rows[1].ai_suggestion).toBe('mid note');
  });

  test('skips rows with NULL or empty ai_suggestion', () => {
    ConversationFeedback.create({ conversation_id: 'c-null', user_id: 'u-1', rating: 4 }); // ai_suggestion stays NULL
    seed({ conv: 'c-empty', user: 'u-1', rating: 3, suggestion: '', createdAt: '2026-04-19 10:00:00' });
    seed({ conv: 'c-real', user: 'u-1', rating: 2, suggestion: 'keep this', createdAt: '2026-04-20 10:00:00' });

    const rows = ConversationFeedback.getRecentWithSuggestions('u-1', 10);
    expect(rows).toHaveLength(1);
    expect(rows[0].ai_suggestion).toBe('keep this');
  });

  test('returns empty array for missing userId and scopes to the given user', () => {
    seed({ conv: 'c-1', user: 'u-1', rating: 2, suggestion: 'u-1 note', createdAt: '2026-04-20' });
    seed({ conv: 'c-2', user: 'u-2', rating: 2, suggestion: 'u-2 note', createdAt: '2026-04-20' });

    expect(ConversationFeedback.getRecentWithSuggestions(null)).toEqual([]);
    expect(ConversationFeedback.getRecentWithSuggestions(undefined)).toEqual([]);
    expect(ConversationFeedback.getRecentWithSuggestions('')).toEqual([]);

    const u1Rows = ConversationFeedback.getRecentWithSuggestions('u-1', 5);
    expect(u1Rows).toHaveLength(1);
    expect(u1Rows[0].ai_suggestion).toBe('u-1 note');
  });
});

describe('ConversationFeedback.getAggregateStats', () => {
  test('returns zeroed distribution and null average when empty', () => {
    const stats = ConversationFeedback.getAggregateStats();
    expect(stats.count).toBe(0);
    expect(stats.average_rating).toBeNull();
    expect(stats.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  test('computes count, average, and per-rating distribution', () => {
    ConversationFeedback.create({ conversation_id: 'c1', user_id: 'u', rating: 5 });
    ConversationFeedback.create({ conversation_id: 'c2', user_id: 'u', rating: 5 });
    ConversationFeedback.create({ conversation_id: 'c3', user_id: 'u', rating: 3 });
    ConversationFeedback.create({ conversation_id: 'c4', user_id: 'u', rating: 1 });

    const stats = ConversationFeedback.getAggregateStats();
    expect(stats.count).toBe(4);
    expect(stats.average_rating).toBeCloseTo((5 + 5 + 3 + 1) / 4);
    expect(stats.distribution).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0, 5: 2 });
  });
});
