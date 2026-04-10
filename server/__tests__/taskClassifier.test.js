'use strict';

// Mock the Anthropic SDK before any module that requires it is loaded.
let mockCreate;

jest.mock('@anthropic-ai/sdk', () => {
  mockCreate = jest.fn();
  return jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
});

jest.mock('../config', () => ({
  anthropicApiKey: 'test-key',
}));

const { classifyMessage } = require('../core/taskClassifier');

function makeResponse(jsonPayload) {
  return { content: [{ text: JSON.stringify(jsonPayload) }] };
}

const SAMPLE_PROFILE = {
  name: 'Alice',
  os_type: 'Windows',
  vocabulary_level: 'basic',
  comfort_level: 2,
};

beforeEach(() => { jest.clearAllMocks(); });

describe('classifyMessage — correct task type classification', () => {
  test('returns learn_skill for learning requests', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'learn_skill', topic: 'sending email', urgency: 'low' }));
    const result = await classifyMessage('How do I send an email?', SAMPLE_PROFILE);
    expect(result.taskType).toBe('learn_skill');
  });

  test('returns troubleshoot for error/problem messages', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'troubleshoot', topic: 'computer not turning on', urgency: 'high' }));
    const result = await classifyMessage("My computer won't turn on.", SAMPLE_PROFILE);
    expect(result.taskType).toBe('troubleshoot');
  });

  test('returns follow_up for "I did that" type messages', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'follow_up', topic: 'follow-up step', urgency: 'low' }));
    const result = await classifyMessage('I did that, now what?', SAMPLE_PROFILE);
    expect(result.taskType).toBe('follow_up');
  });

  test('returns accessibility for accessibility requests', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'accessibility', topic: 'text too small', urgency: 'medium' }));
    const result = await classifyMessage('The text is too small for me to read.', SAMPLE_PROFILE);
    expect(result.taskType).toBe('accessibility');
  });

  test('returns unknown for unrelated messages', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'unknown', topic: 'unrelated topic', urgency: 'low' }));
    const result = await classifyMessage('What is the weather like today?', SAMPLE_PROFILE);
    expect(result.taskType).toBe('unknown');
  });
});

describe('classifyMessage — topic and urgency passthrough', () => {
  test('returns the topic', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'learn_skill', topic: 'printing a document', urgency: 'low' }));
    const result = await classifyMessage('How do I print?', SAMPLE_PROFILE);
    expect(result.topic).toBe('printing a document');
  });

  test('returns the urgency', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'troubleshoot', topic: 'screen blank', urgency: 'high' }));
    const result = await classifyMessage('My screen is blank!', SAMPLE_PROFILE);
    expect(result.urgency).toBe('high');
  });
});

describe('classifyMessage — error handling', () => {
  test('returns fallback when API throws', async () => {
    mockCreate.mockRejectedValue(new Error('Network error'));
    const result = await classifyMessage('Something is wrong.', SAMPLE_PROFILE);
    expect(result).toEqual({ taskType: 'unknown', topic: 'unclassified', urgency: 'low' });
  });

  test('returns fallback for malformed JSON', async () => {
    mockCreate.mockResolvedValue({ content: [{ text: 'not json' }] });
    const result = await classifyMessage('Help me.', SAMPLE_PROFILE);
    expect(result).toEqual({ taskType: 'unknown', topic: 'unclassified', urgency: 'low' });
  });

  test('returns fallback for missing fields', async () => {
    mockCreate.mockResolvedValue({ content: [{ text: '{"foo": "bar"}' }] });
    const result = await classifyMessage('Help me.', SAMPLE_PROFILE);
    expect(result.taskType).toBe('unknown');
  });

  test('returns fallback for empty content', async () => {
    mockCreate.mockResolvedValue({ content: [] });
    const result = await classifyMessage('Help me.', SAMPLE_PROFILE);
    expect(result).toEqual({ taskType: 'unknown', topic: 'unclassified', urgency: 'low' });
  });
});

describe('classifyMessage — validation', () => {
  const VALID_TYPES = ['learn_skill', 'troubleshoot', 'follow_up', 'accessibility', 'unknown'];

  test.each(VALID_TYPES)('accepts valid taskType "%s"', async (type) => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: type, topic: 'test', urgency: 'low' }));
    const result = await classifyMessage('Test.', SAMPLE_PROFILE);
    expect(result.taskType).toBe(type);
  });

  test('maps unrecognized taskType to unknown', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'invented', topic: 'test', urgency: 'low' }));
    const result = await classifyMessage('Test.', SAMPLE_PROFILE);
    expect(result.taskType).toBe('unknown');
  });

  test('maps unrecognized urgency to low', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'troubleshoot', topic: 'test', urgency: 'critical' }));
    const result = await classifyMessage('Test.', SAMPLE_PROFILE);
    expect(result.urgency).toBe('low');
  });
});

describe('classifyMessage — null/undefined profile', () => {
  test('works with null profile', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'learn_skill', topic: 'email', urgency: 'low' }));
    const result = await classifyMessage('How do I send an email?', null);
    expect(result.taskType).toBe('learn_skill');
  });

  test('works with undefined profile', async () => {
    mockCreate.mockResolvedValue(makeResponse({ taskType: 'troubleshoot', topic: 'printer', urgency: 'medium' }));
    const result = await classifyMessage('My printer is broken.', undefined);
    expect(result.taskType).toBe('troubleshoot');
  });
});

describe('classifyMessage — markdown stripping', () => {
  test('handles ```json fences', async () => {
    const payload = { taskType: 'troubleshoot', topic: 'wifi', urgency: 'high' };
    mockCreate.mockResolvedValue({ content: [{ text: '```json\n' + JSON.stringify(payload) + '\n```' }] });
    const result = await classifyMessage('WiFi dropping.', SAMPLE_PROFILE);
    expect(result.taskType).toBe('troubleshoot');
  });

  test('handles plain ``` fences', async () => {
    const payload = { taskType: 'learn_skill', topic: 'zoom', urgency: 'low' };
    mockCreate.mockResolvedValue({ content: [{ text: '```\n' + JSON.stringify(payload) + '\n```' }] });
    const result = await classifyMessage('How do I use Zoom?', SAMPLE_PROFILE);
    expect(result.taskType).toBe('learn_skill');
  });
});
