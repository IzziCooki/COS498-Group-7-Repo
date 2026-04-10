'use strict';

// Mock the Anthropic SDK before any module that requires it is loaded.
// We capture a reference to the mock `create` function so individual tests
// can configure its resolved value.
let mockCreate;

jest.mock('@anthropic-ai/sdk', () => {
  mockCreate = jest.fn();
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));
});

// Also mock the config so the module doesn't warn about a missing API key.
jest.mock('../config', () => ({
  anthropicApiKey: 'test-key',
}));

const { classifyMessage } = require('../core/taskClassifier');

// Helper: build a fake Claude API response with the given text payload.
function makeClaudeResponse(jsonPayload) {
  return {
    content: [{ text: JSON.stringify(jsonPayload) }],
  };
}

const SAMPLE_PROFILE = {
  name: 'Alice',
  os_type: 'Windows',
  vocabulary_level: 'basic',
  comfort_level: 2,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Happy path — correct task type returned ──────────────────────────────────

describe('classifyMessage — correct task type classification', () => {
  test('returns learn_skill for learning requests', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'learn_skill', topic: 'sending email', urgency: 'low' })
    );
    const result = await classifyMessage('How do I send an email?', SAMPLE_PROFILE);
    expect(result.taskType).toBe('learn_skill');
  });

  test('returns troubleshoot for error/problem messages', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'troubleshoot', topic: 'computer not turning on', urgency: 'high' })
    );
    const result = await classifyMessage("My computer won't turn on.", SAMPLE_PROFILE);
    expect(result.taskType).toBe('troubleshoot');
  });

  test('returns follow_up for "I did that" type messages', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'follow_up', topic: 'follow-up step', urgency: 'low' })
    );
    const result = await classifyMessage('I did that, now what?', SAMPLE_PROFILE);
    expect(result.taskType).toBe('follow_up');
  });

  test('returns accessibility for accessibility requests', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'accessibility', topic: 'text too small', urgency: 'medium' })
    );
    const result = await classifyMessage('The text is too small for me to read.', SAMPLE_PROFILE);
    expect(result.taskType).toBe('accessibility');
  });

  test('returns unknown for unrelated messages', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'unknown', topic: 'unrelated topic', urgency: 'low' })
    );
    const result = await classifyMessage('What is the weather like today?', SAMPLE_PROFILE);
    expect(result.taskType).toBe('unknown');
  });
});

// ─── topic and urgency are returned correctly ─────────────────────────────────

describe('classifyMessage — topic and urgency passthrough', () => {
  test('returns the topic from Claude response', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'learn_skill', topic: 'printing a document', urgency: 'low' })
    );
    const result = await classifyMessage('How do I print?', SAMPLE_PROFILE);
    expect(result.topic).toBe('printing a document');
  });

  test('returns the urgency from Claude response', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'troubleshoot', topic: 'screen blank', urgency: 'high' })
    );
    const result = await classifyMessage('My screen is blank!', SAMPLE_PROFILE);
    expect(result.urgency).toBe('high');
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('classifyMessage — error handling', () => {
  test('returns fallback when Claude API throws an error', async () => {
    mockCreate.mockRejectedValue(new Error('Network error'));
    const result = await classifyMessage('Something is wrong.', SAMPLE_PROFILE);
    expect(result).toEqual({ taskType: 'unknown', topic: 'unclassified', urgency: 'low' });
  });

  test('returns fallback when Claude returns malformed JSON', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: 'this is not json at all' }],
    });
    const result = await classifyMessage('Help me.', SAMPLE_PROFILE);
    expect(result).toEqual({ taskType: 'unknown', topic: 'unclassified', urgency: 'low' });
  });

  test('returns fallback when Claude returns valid JSON but missing fields', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: '{"foo": "bar"}' }],
    });
    const result = await classifyMessage('Help me.', SAMPLE_PROFILE);
    // taskType 'foo' is not in the allowed list, so it should default to 'unknown'
    expect(result.taskType).toBe('unknown');
  });

  test('returns fallback when Claude returns empty content array', async () => {
    mockCreate.mockResolvedValue({ content: [] });
    const result = await classifyMessage('Help me.', SAMPLE_PROFILE);
    expect(result).toEqual({ taskType: 'unknown', topic: 'unclassified', urgency: 'low' });
  });

  test('returns fallback when API response content text is empty', async () => {
    mockCreate.mockResolvedValue({ content: [{ text: '' }] });
    const result = await classifyMessage('Help me.', SAMPLE_PROFILE);
    expect(result).toEqual({ taskType: 'unknown', topic: 'unclassified', urgency: 'low' });
  });
});

// ─── taskType validation ──────────────────────────────────────────────────────

describe('classifyMessage — taskType validation against allowed values', () => {
  const VALID_TASK_TYPES = ['learn_skill', 'troubleshoot', 'follow_up', 'accessibility', 'unknown'];

  test.each(VALID_TASK_TYPES)('accepts valid taskType "%s"', async (validType) => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: validType, topic: 'test topic', urgency: 'low' })
    );
    const result = await classifyMessage('Test message.', SAMPLE_PROFILE);
    expect(result.taskType).toBe(validType);
  });

  test('maps an unrecognized taskType to "unknown"', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'invented_type', topic: 'test', urgency: 'low' })
    );
    const result = await classifyMessage('Test message.', SAMPLE_PROFILE);
    expect(result.taskType).toBe('unknown');
  });

  test('maps an unrecognized urgency to "low"', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'troubleshoot', topic: 'test', urgency: 'critical' })
    );
    const result = await classifyMessage('Test message.', SAMPLE_PROFILE);
    expect(result.urgency).toBe('low');
  });
});

// ─── Handles null/undefined profile gracefully ────────────────────────────────

describe('classifyMessage — null/undefined profile', () => {
  test('works when userProfile is null', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'learn_skill', topic: 'email', urgency: 'low' })
    );
    const result = await classifyMessage('How do I send an email?', null);
    expect(result.taskType).toBe('learn_skill');
  });

  test('works when userProfile is undefined', async () => {
    mockCreate.mockResolvedValue(
      makeClaudeResponse({ taskType: 'troubleshoot', topic: 'printer', urgency: 'medium' })
    );
    const result = await classifyMessage('My printer is broken.', undefined);
    expect(result.taskType).toBe('troubleshoot');
  });
});

// ─── Markdown code-fence stripping ───────────────────────────────────────────

describe('classifyMessage — markdown stripping', () => {
  test('handles response wrapped in ```json ... ``` code fences', async () => {
    const payload = { taskType: 'troubleshoot', topic: 'wifi issue', urgency: 'high' };
    mockCreate.mockResolvedValue({
      content: [{ text: '```json\n' + JSON.stringify(payload) + '\n```' }],
    });
    const result = await classifyMessage('My WiFi keeps dropping.', SAMPLE_PROFILE);
    expect(result.taskType).toBe('troubleshoot');
    expect(result.urgency).toBe('high');
  });

  test('handles response wrapped in plain ``` ... ``` code fences', async () => {
    const payload = { taskType: 'learn_skill', topic: 'zoom', urgency: 'low' };
    mockCreate.mockResolvedValue({
      content: [{ text: '```\n' + JSON.stringify(payload) + '\n```' }],
    });
    const result = await classifyMessage('How do I use Zoom?', SAMPLE_PROFILE);
    expect(result.taskType).toBe('learn_skill');
  });
});
