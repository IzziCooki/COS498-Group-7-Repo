'use strict';

// Mock the SafetyEvent model before requiring the module under test so that
// no real database connection is opened during the test run.
jest.mock('../models/SafetyEvent', () => ({
  create: jest.fn(() => ({ id: 'test-id' })),
  findByUserId: jest.fn(() => []),
}));

const { checkMessage } = require('../core/safetyMonitor');
const SafetyEvent = require('../models/SafetyEvent');

const TEST_USER_ID = 'user-test-123';

beforeEach(() => {
  jest.clearAllMocks();
});

// Safe messages

describe('safe messages', () => {
  test('returns { safe: true } for a normal help request', () => {
    const result = checkMessage('How do I send an email?', TEST_USER_ID);
    expect(result).toEqual({ safe: true, type: null, response: null });
  });

  test('returns { safe: true } for general chit-chat', () => {
    const result = checkMessage('Good morning, how are you today?', TEST_USER_ID);
    expect(result).toEqual({ safe: true, type: null, response: null });
  });

  test('does not call SafetyEvent.create for safe messages', () => {
    checkMessage('Can you help me with my email?', TEST_USER_ID);
    expect(SafetyEvent.create).not.toHaveBeenCalled();
  });
});

// Emergency detection

describe('emergency keyword detection', () => {
  const EMERGENCY_RESPONSE_FRAGMENT = 'Please call 911';

  test('detects "fallen"', () => {
    const result = checkMessage('I have fallen and I need help.', TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('emergency');
  });

  test('detects "can\'t breathe"', () => {
    const result = checkMessage("I can't breathe, something is wrong.", TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('emergency');
  });

  test('detects "chest pain"', () => {
    const result = checkMessage('I have chest pain right now.', TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('emergency');
  });

  test('detects "911"', () => {
    const result = checkMessage('Should I call 911?', TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('emergency');
  });

  test('detects "emergency"', () => {
    const result = checkMessage('This is an emergency please help.', TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('emergency');
  });

  test('detection is case-insensitive for "FALLEN"', () => {
    const result = checkMessage('I HAVE FALLEN!', TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('emergency');
  });

  test('detection is case-insensitive for "EMERGENCY"', () => {
    const result = checkMessage('EMERGENCY please help me.', TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('emergency');
  });

  test('returns the correct emergency response text', () => {
    const result = checkMessage('I have fallen down.', TEST_USER_ID);
    expect(result.response).toContain(EMERGENCY_RESPONSE_FRAGMENT);
  });

  test('logs a SafetyEvent to the database on emergency detection', () => {
    checkMessage('I have chest pain.', TEST_USER_ID);
    expect(SafetyEvent.create).toHaveBeenCalledTimes(1);
    expect(SafetyEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: TEST_USER_ID,
        event_type: 'emergency',
      })
    );
  });
});

// Scam detection

describe('scam pattern detection', () => {
  const SCAM_RESPONSE_FRAGMENT = 'scam';

  test('detects "send gift card" pattern', () => {
    const result = checkMessage('They told me to send gift card to pay them.', TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('scam');
  });

  test('detects "wire transfer" pattern', () => {
    const result = checkMessage('They asked me to send wire transfer to unlock my account.', TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('scam');
  });

  test('detects "IRS called" pattern', () => {
    const result = checkMessage('The IRS called and said I owe money.', TEST_USER_ID);
    expect(result.safe).toBe(false);
    expect(result.type).toBe('scam');
  });

  test('returns the correct scam response text', () => {
    const result = checkMessage('Someone told me to send gift card to them.', TEST_USER_ID);
    expect(result.response).toMatch(/scam/i);
  });

  test('logs a SafetyEvent to the database on scam detection', () => {
    checkMessage('They want me to send gift card right now.', TEST_USER_ID);
    expect(SafetyEvent.create).toHaveBeenCalledTimes(1);
    expect(SafetyEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: TEST_USER_ID,
        event_type: 'scam',
      })
    );
  });
});

// Partial-word non-matching

describe('partial-word non-matching', () => {
  test('"browser" does not trigger any emergency or scam alert', () => {
    const result = checkMessage('Please open your browser.', TEST_USER_ID);
    expect(result.safe).toBe(true);
  });

  test('"hurt" as a whole word triggers emergency, but "hurtle" should not', () => {
    // "hurtle" contains "hurt" but is a different word
    const result = checkMessage('The cars hurtle down the road.', TEST_USER_ID);
    expect(result.safe).toBe(true);
  });
});

// Edge cases

describe('edge cases', () => {
  test('returns safe for empty string', () => {
    const result = checkMessage('', TEST_USER_ID);
    expect(result).toEqual({ safe: true, type: null, response: null });
  });

  test('returns safe for null input', () => {
    const result = checkMessage(null, TEST_USER_ID);
    expect(result).toEqual({ safe: true, type: null, response: null });
  });

  test('returns safe for undefined input', () => {
    const result = checkMessage(undefined, TEST_USER_ID);
    expect(result).toEqual({ safe: true, type: null, response: null });
  });
});
