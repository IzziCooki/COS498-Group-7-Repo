'use strict';

jest.mock('../models/User', () => ({
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../models/SkillEvent', () => ({
  findByUserId: jest.fn(),
}));

const User = require('../models/User');
const SkillEvent = require('../models/SkillEvent');
const userProfileManager = require('../core/userProfileManager');

const USER_ID = 'user-profile-test';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getOrCreateUser ──────────────────────────────────────────────────────────

describe('getOrCreateUser', () => {
  test('returns existing user when found', () => {
    const existing = { id: USER_ID, name: 'Alice' };
    User.findById.mockReturnValue(existing);
    const result = userProfileManager.getOrCreateUser(USER_ID);
    expect(result).toBe(existing);
    expect(User.create).not.toHaveBeenCalled();
  });

  test('creates and returns a new user when not found', () => {
    const newUser = { id: USER_ID, name: null };
    User.findById.mockReturnValue(null);
    User.create.mockReturnValue(newUser);
    const result = userProfileManager.getOrCreateUser(USER_ID);
    expect(User.create).toHaveBeenCalledWith({ id: USER_ID });
    expect(result).toBe(newUser);
  });

  test('throws when id is not provided', () => {
    expect(() => userProfileManager.getOrCreateUser(null)).toThrow(/id is required/);
    expect(() => userProfileManager.getOrCreateUser(undefined)).toThrow(/id is required/);
    expect(() => userProfileManager.getOrCreateUser('')).toThrow(/id is required/);
  });
});

// ─── updateProfile ────────────────────────────────────────────────────────────

describe('updateProfile', () => {
  test('passes only allowed fields to User.update', () => {
    const updated = { id: USER_ID, name: 'Bob' };
    User.update.mockReturnValue(updated);
    const result = userProfileManager.updateProfile(USER_ID, { name: 'Bob', hacked: true });
    expect(User.update).toHaveBeenCalledWith(USER_ID, { name: 'Bob' });
    expect(result).toBe(updated);
  });

  test('updates all allowed fields', () => {
    User.update.mockReturnValue({});
    userProfileManager.updateProfile(USER_ID, {
      name: 'Alice',
      os_type: 'Mac',
      vocabulary_level: 'standard',
      comfort_level: 4,
      accessibility_needs: '["large_text"]',
      onboarded: 1,
    });
    expect(User.update).toHaveBeenCalledWith(USER_ID, {
      name: 'Alice',
      os_type: 'Mac',
      vocabulary_level: 'standard',
      comfort_level: 4,
      accessibility_needs: '["large_text"]',
      onboarded: 1,
    });
  });

  test('omits fields that are undefined', () => {
    User.update.mockReturnValue({});
    userProfileManager.updateProfile(USER_ID, { name: 'Alice', os_type: undefined });
    expect(User.update).toHaveBeenCalledWith(USER_ID, { name: 'Alice' });
  });

  test('updates collaboration_opt_in field', () => {
    User.update.mockReturnValue({});
    userProfileManager.updateProfile(USER_ID, { collaboration_opt_in: 1 });
    expect(User.update).toHaveBeenCalledWith(USER_ID, { collaboration_opt_in: 1 });
  });
});

// ─── getProfileForPrompt ──────────────────────────────────────────────────────

describe('getProfileForPrompt', () => {
  test('returns fallback string when user does not exist', () => {
    User.findById.mockReturnValue(null);
    const result = userProfileManager.getProfileForPrompt(USER_ID);
    expect(result).toBe('User: unknown (no profile found)');
  });

  test('returns formatted profile for a user with full data', () => {
    User.findById.mockReturnValue({
      id: USER_ID,
      name: 'Alice',
      os_type: 'Windows',
      vocabulary_level: 'basic',
      comfort_level: 3,
      goal_summary: 'Learn to use email',
      accessibility_needs: '["large_text"]',
    });
    SkillEvent.findByUserId.mockReturnValue([]);
    const result = userProfileManager.getProfileForPrompt(USER_ID);
    expect(result).toContain('User: Alice');
    expect(result).toContain('Device: Windows');
    expect(result).toContain('Vocabulary level: basic');
    expect(result).toContain('Comfort level: 3/5');
    expect(result).toContain('Learning goal: "Learn to use email"');
    expect(result).toContain('Skills completed: none yet');
    expect(result).toContain('large_text');
  });

  test('shows skills completed when there are completed skill events', () => {
    User.findById.mockReturnValue({
      id: USER_ID,
      name: 'Bob',
      os_type: 'Mac',
      vocabulary_level: 'intermediate',
      comfort_level: 2,
      goal_summary: null,
      accessibility_needs: '[]',
    });
    SkillEvent.findByUserId.mockReturnValue([
      { skill_name: 'email_basics', status: 'completed', practiced_at: new Date().toISOString() },
    ]);
    const result = userProfileManager.getProfileForPrompt(USER_ID);
    expect(result).toContain('email_basics');
    expect(result).not.toContain('none yet');
  });

  test('deduplicates skills — keeps most recent per skill name', () => {
    User.findById.mockReturnValue({
      id: USER_ID,
      name: 'Carol',
      os_type: 'Windows',
      vocabulary_level: 'basic',
      comfort_level: 1,
      goal_summary: null,
      accessibility_needs: '[]',
    });
    const older = new Date(Date.now() - 10000).toISOString();
    const newer = new Date().toISOString();
    SkillEvent.findByUserId.mockReturnValue([
      { skill_name: 'email_basics', status: 'completed', practiced_at: older },
      { skill_name: 'email_basics', status: 'completed', practiced_at: newer },
    ]);
    const result = userProfileManager.getProfileForPrompt(USER_ID);
    // email_basics should appear only once
    const count = (result.match(/email_basics/g) || []).length;
    expect(count).toBe(1);
  });

  test('ignores non-completed skill events', () => {
    User.findById.mockReturnValue({
      id: USER_ID,
      name: 'Dan',
      os_type: 'Windows',
      vocabulary_level: 'basic',
      comfort_level: 1,
      goal_summary: null,
      accessibility_needs: '[]',
    });
    SkillEvent.findByUserId.mockReturnValue([
      { skill_name: 'wifi_fix', status: 'started', practiced_at: new Date().toISOString() },
    ]);
    const result = userProfileManager.getProfileForPrompt(USER_ID);
    expect(result).toContain('Skills completed: none yet');
  });

  test('falls back to defaults when optional fields are null/undefined', () => {
    User.findById.mockReturnValue({
      id: USER_ID,
      name: null,
      os_type: null,
      vocabulary_level: null,
      comfort_level: null,
      goal_summary: null,
      accessibility_needs: null,
    });
    SkillEvent.findByUserId.mockReturnValue([]);
    const result = userProfileManager.getProfileForPrompt(USER_ID);
    expect(result).toContain('User: Unknown');
    expect(result).toContain('Device: unknown');
    expect(result).toContain('Vocabulary level: basic');
    expect(result).toContain('Comfort level: 1/5');
    expect(result).toContain('Learning goal: not yet shared');
    expect(result).toContain('Accessibility: none specified');
  });

  test('handles invalid accessibility_needs JSON gracefully', () => {
    User.findById.mockReturnValue({
      id: USER_ID,
      name: 'Eve',
      os_type: 'Windows',
      vocabulary_level: 'basic',
      comfort_level: 2,
      goal_summary: null,
      accessibility_needs: 'not-valid-json',
    });
    SkillEvent.findByUserId.mockReturnValue([]);
    const result = userProfileManager.getProfileForPrompt(USER_ID);
    expect(result).toContain('Accessibility: none specified');
  });
});
