'use strict';

// Mock the model layer so tests exercise conversationState's logic without
// touching SQLite. Conversation.appendFailedStep / getFailedSteps are the
// new methods Sprint C adds — we assert the orchestrator-facing behaviour
// that calls into them.
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/Conversation', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findActive: jest.fn().mockReturnValue([]),
  update: jest.fn(),
  abandonStale: jest.fn(),
  getFailedSteps: jest.fn().mockReturnValue([]),
  appendFailedStep: jest.fn(),
}));

jest.mock('../models/Message', () => ({
  create: jest.fn((m) => ({ ...m, id: 'mock-msg-id', created_at: new Date().toISOString() })),
  getRecent: jest.fn().mockReturnValue([]),
}));

jest.mock('../core/conversationExporter', () => ({
  exportConversation: jest.fn(),
}));

const User = require('../models/User');
const Conversation = require('../models/Conversation');
const conversationState = require('../core/conversationState');

const {
  detectFailureSignal,
  recordIssuedStep,
  getLastIssuedStep,
  getFailedSteps,
  noteUserTurn,
  consumeFailureContext,
  resetFailureStateForTests,
  getOrCreateSession,
} = conversationState;

beforeEach(() => {
  jest.clearAllMocks();
  // Default: anonymous user (ephemeral session) so we don't need DB mocking
  User.findById.mockReturnValue(null);
  Conversation.getFailedSteps.mockReturnValue([]);
  if (typeof resetFailureStateForTests === 'function') {
    resetFailureStateForTests();
  }
});

describe('detectFailureSignal', () => {
  describe('positive signals (failed=true)', () => {
    test.each([
      ["that didn't work"],
      ['that didnt work'],
      ['I don’t see it'],
      ["i don't see"],
      ["there's no Send option"],
      ["there is no compose option"],
      ["it's not there"],
      ['nothing happened'],
      ["that didn't help"],
      ["still not working"],
      ["same thing"],
      ['THAT DIDN’T WORK'],
    ])('detects "%s"', (message) => {
      const result = detectFailureSignal(message);
      expect(result.failed).toBe(true);
      expect(typeof result.signal).toBe('string');
      expect(result.signal.length).toBeGreaterThan(0);
    });

    test('detects signal embedded in a longer message', () => {
      const result = detectFailureSignal(
        "I tried clicking the icon but nothing happened, what now?"
      );
      expect(result.failed).toBe(true);
      expect(result.signal.toLowerCase()).toContain('nothing happened');
    });
  });

  describe('negative signals (failed=false)', () => {
    test.each([
      ['ok thanks'],
      ['done'],
      ['I see it now'],
      ['great, found the button'],
      ['where do I click next'],
      [''],
      [null],
      [undefined],
    ])('does not flag "%s"', (message) => {
      expect(detectFailureSignal(message)).toEqual({ failed: false, signal: null });
    });
  });
});

describe('lastIssuedStep tracking (ephemeral session)', () => {
  function newSession() {
    return getOrCreateSession('test-user-' + Math.random().toString(36).slice(2));
  }

  test('recordIssuedStep stores normalized step on the session', () => {
    const session = newSession();
    recordIssuedStep(session.id, {
      skillId: 'send-email',
      stepIndex: 2,
      instruction: 'Click the Compose button.',
    });
    const step = getLastIssuedStep(session.id);
    expect(step).toMatchObject({
      skillId: 'send-email',
      stepIndex: 2,
      instruction: 'Click the Compose button.',
    });
    expect(typeof step.issuedAt).toBe('string');
    expect(Date.parse(step.issuedAt)).not.toBeNaN();
  });

  test('recordIssuedStep handles missing skillId / stepIndex defaults', () => {
    const session = newSession();
    recordIssuedStep(session.id, { instruction: 'Open Settings.' });
    const step = getLastIssuedStep(session.id);
    expect(step.skillId).toBeNull();
    expect(step.stepIndex).toBe(0);
    expect(step.instruction).toBe('Open Settings.');
  });

  test('getLastIssuedStep returns null when nothing recorded', () => {
    const session = newSession();
    expect(getLastIssuedStep(session.id)).toBeNull();
  });
});

describe('noteUserTurn — push-to-failedSteps + lastStepFailed flag (ephemeral)', () => {
  function newSession() {
    return getOrCreateSession('test-user-' + Math.random().toString(36).slice(2));
  }

  test('positive signal pushes lastIssuedStep into failedSteps and flips flag', () => {
    const session = newSession();
    recordIssuedStep(session.id, {
      skillId: 'wifi',
      stepIndex: 1,
      instruction: 'Click the wifi icon in the system tray.',
    });

    const result = noteUserTurn(session.id, "I don't see a wifi icon");

    expect(result.lastStepFailed).toBe(true);
    expect(result.signal).toBeTruthy();
    expect(result.lastIssuedStep).toMatchObject({ skillId: 'wifi', stepIndex: 1 });

    const failed = getFailedSteps(session.id);
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatchObject({
      skillId: 'wifi',
      stepIndex: 1,
      instruction: 'Click the wifi icon in the system tray.',
      signal: expect.any(String),
    });
  });

  test('negative signal does NOT push and clears the flag', () => {
    const session = newSession();
    recordIssuedStep(session.id, {
      skillId: 'wifi',
      stepIndex: 1,
      instruction: 'Click the wifi icon.',
    });

    const result = noteUserTurn(session.id, 'I see it now, what next?');

    expect(result.lastStepFailed).toBe(false);
    expect(getFailedSteps(session.id)).toEqual([]);
  });

  test('does not double-push when failure signal repeats with no new step recorded', () => {
    const session = newSession();
    recordIssuedStep(session.id, {
      skillId: 'wifi',
      stepIndex: 1,
      instruction: 'Click the wifi icon.',
    });
    noteUserTurn(session.id, "that didn't work");
    noteUserTurn(session.id, "still not working");
    expect(getFailedSteps(session.id)).toHaveLength(1);
  });

  test('positive signal with no recorded step still flips the flag without pushing', () => {
    const session = newSession();
    const result = noteUserTurn(session.id, "that didn't work");
    expect(result.lastStepFailed).toBe(true);
    expect(getFailedSteps(session.id)).toEqual([]);
  });
});

describe('consumeFailureContext — orchestrator-context wiring', () => {
  function newSession() {
    return getOrCreateSession('test-user-' + Math.random().toString(36).slice(2));
  }

  test('returns lastStepFailed=true and the failedSteps list when the last user turn signalled failure', () => {
    const session = newSession();
    recordIssuedStep(session.id, {
      skillId: 'send-email',
      stepIndex: 0,
      instruction: 'Click Compose.',
    });
    noteUserTurn(session.id, "I don't see a compose button");

    const ctx = consumeFailureContext(session.id);
    expect(ctx.lastStepFailed).toBe(true);
    expect(ctx.failedSteps).toHaveLength(1);
    expect(ctx.failedSteps[0]).toMatchObject({ skillId: 'send-email' });
  });

  test('returns lastStepFailed=false on the turn AFTER it was consumed', () => {
    const session = newSession();
    recordIssuedStep(session.id, { instruction: 'Click X.' });
    noteUserTurn(session.id, "that didn't work");

    consumeFailureContext(session.id); // first read — flag was true

    const ctx = consumeFailureContext(session.id);
    expect(ctx.lastStepFailed).toBe(false);
  });

  test('returns lastStepFailed=false for a fresh session with no signals', () => {
    const session = newSession();
    const ctx = consumeFailureContext(session.id);
    expect(ctx.lastStepFailed).toBe(false);
    expect(ctx.failedSteps).toEqual([]);
  });
});

describe('persistence on Conversation model (DB-backed user)', () => {
  beforeEach(() => {
    // Switch to a "real" user so isAnonymousUser returns false
    User.findById.mockReturnValue({ id: 'u1', is_anonymous: 0 });
    Conversation.findActive.mockReturnValue([
      { id: 'conv-persistent-1', user_id: 'u1', status: 'active' },
    ]);
  });

  test('positive signal calls Conversation.appendFailedStep with the prior step', () => {
    recordIssuedStep('conv-persistent-1', {
      skillId: 'wifi',
      stepIndex: 0,
      instruction: 'Click wifi.',
    });
    noteUserTurn('conv-persistent-1', "that didn't work");

    expect(Conversation.appendFailedStep).toHaveBeenCalledTimes(1);
    const [convId, step] = Conversation.appendFailedStep.mock.calls[0];
    expect(convId).toBe('conv-persistent-1');
    expect(step).toMatchObject({
      skillId: 'wifi',
      stepIndex: 0,
      instruction: 'Click wifi.',
      signal: expect.any(String),
    });
  });

  test('getFailedSteps reads from Conversation.getFailedSteps for persistent sessions', () => {
    Conversation.getFailedSteps.mockReturnValue([
      { skillId: 'wifi', stepIndex: 0, instruction: 'old', signal: 'nothing happened' },
    ]);
    const list = getFailedSteps('conv-persistent-1');
    expect(Conversation.getFailedSteps).toHaveBeenCalledWith('conv-persistent-1');
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ skillId: 'wifi' });
  });

  test('negative signal does not append', () => {
    recordIssuedStep('conv-persistent-1', { instruction: 'Click X.' });
    noteUserTurn('conv-persistent-1', 'great, all set');
    expect(Conversation.appendFailedStep).not.toHaveBeenCalled();
  });
});
