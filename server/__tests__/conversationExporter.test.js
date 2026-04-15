'use strict';

// Mock filesystem so no real files are written
jest.mock('fs', () => ({
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => false),
}));

// Mock all model dependencies — we test the orchestration logic, not SQL
jest.mock('../models/Conversation', () => ({
  findById: jest.fn(),
}));
jest.mock('../models/Message', () => ({
  findByConversationId: jest.fn(),
}));
jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));
jest.mock('../models/SkillEvent', () => ({
  findByUserId: jest.fn(),
}));
jest.mock('../models/SafetyEvent', () => ({
  findByUserId: jest.fn(),
}));
jest.mock('../models/ConversationFeedback', () => ({
  findByConversationId: jest.fn(),
}));
jest.mock('../db/database', () => ({
  prepare: jest.fn(() => ({ all: jest.fn(() => []) })),
}));

const fs = require('fs');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const SkillEvent = require('../models/SkillEvent');
const SafetyEvent = require('../models/SafetyEvent');
const ConversationFeedback = require('../models/ConversationFeedback');
const db = require('../db/database');
const { exportConversation, exportAll } = require('../core/conversationExporter');

const CONV_ID = 'conv-export-1';

const SAMPLE_CONVERSATION = {
  id: CONV_ID,
  user_id: 'user-1',
  task_type: 'email_help',
  status: 'completed',
  started_at: '2024-01-01T10:00:00.000Z',
  ended_at: '2024-01-01T10:30:00.000Z',
};

const SAMPLE_USER = {
  id: 'user-1',
  name: 'Alice',
  os_type: 'Windows',
  comfort_level: 3,
  vocabulary_level: 'basic',
};

const SAMPLE_MESSAGES = [
  { id: 'm1', conversation_id: CONV_ID, role: 'user', body: 'How do I send an email?', created_at: '2024-01-01T10:00:00.000Z' },
  { id: 'm2', conversation_id: CONV_ID, role: 'assistant', body: 'Great question! First, open your email app.', created_at: '2024-01-01T10:01:00.000Z' },
];

beforeEach(() => {
  jest.clearAllMocks();
  Conversation.findById.mockReturnValue(SAMPLE_CONVERSATION);
  Message.findByConversationId.mockReturnValue(SAMPLE_MESSAGES);
  User.findById.mockReturnValue(SAMPLE_USER);
  SkillEvent.findByUserId.mockReturnValue([]);
  SafetyEvent.findByUserId.mockReturnValue([]);
  ConversationFeedback.findByConversationId.mockReturnValue(null);
});

// ─── exportConversation ───────────────────────────────────────────────────────

describe('exportConversation', () => {
  test('returns null when conversation is not found', () => {
    Conversation.findById.mockReturnValue(null);
    expect(exportConversation(CONV_ID)).toBeNull();
  });

  test('returns null when conversation has fewer than 2 messages', () => {
    Message.findByConversationId.mockReturnValue([SAMPLE_MESSAGES[0]]);
    expect(exportConversation(CONV_ID)).toBeNull();
  });

  test('returns a file path on success', () => {
    const result = exportConversation(CONV_ID);
    expect(typeof result).toBe('string');
    expect(result).toContain(`conv-${CONV_ID}`);
  });

  test('writes a JSON file with correct structure', () => {
    exportConversation(CONV_ID);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [, jsonStr] = fs.writeFileSync.mock.calls[0];
    const exported = JSON.parse(jsonStr);
    expect(exported.conversation_id).toBe(CONV_ID);
    expect(exported.user.name).toBe('Alice');
    expect(exported.user.os_type).toBe('Windows');
    expect(exported.turns.length).toBe(2);
    expect(exported.turns[0].role).toBe('user');
    expect(exported.turns[1].role).toBe('agent');
  });

  test('includes feedback when present', () => {
    ConversationFeedback.findByConversationId.mockReturnValue({
      rating: 5,
      comment: 'Excellent!',
      created_at: '2024-01-01T10:30:00.000Z',
    });
    exportConversation(CONV_ID);
    const [, jsonStr] = fs.writeFileSync.mock.calls[0];
    const exported = JSON.parse(jsonStr);
    expect(exported.feedback).not.toBeNull();
    expect(exported.feedback.rating).toBe(5);
    expect(exported.feedback.comment).toBe('Excellent!');
  });

  test('sets feedback to null when no feedback exists', () => {
    ConversationFeedback.findByConversationId.mockReturnValue(null);
    exportConversation(CONV_ID);
    const [, jsonStr] = fs.writeFileSync.mock.calls[0];
    const exported = JSON.parse(jsonStr);
    expect(exported.feedback).toBeNull();
  });

  test('filters skill events to those within conversation timeframe', () => {
    SkillEvent.findByUserId.mockReturnValue([
      { skill_name: 'email_basics', practiced_at: '2024-01-01T10:15:00.000Z', status: 'completed' },
      { skill_name: 'wifi_fix', practiced_at: '2024-01-01T09:00:00.000Z', status: 'completed' }, // before start
    ]);
    exportConversation(CONV_ID);
    const [, jsonStr] = fs.writeFileSync.mock.calls[0];
    const exported = JSON.parse(jsonStr);
    expect(exported.skills_activated).toContain('email_basics');
    expect(exported.skills_activated).not.toContain('wifi_fix');
  });

  test('filters safety events to those within conversation timeframe', () => {
    SafetyEvent.findByUserId.mockReturnValue([
      { event_type: 'scam', trigger_text: 'Bank call', created_at: '2024-01-01T10:20:00.000Z' },
      { event_type: 'emergency', trigger_text: 'Fall', created_at: '2023-12-01T00:00:00.000Z' }, // before start
    ]);
    exportConversation(CONV_ID);
    const [, jsonStr] = fs.writeFileSync.mock.calls[0];
    const exported = JSON.parse(jsonStr);
    expect(exported.safety_events.length).toBe(1);
    expect(exported.safety_events[0].type).toBe('scam');
  });

  test('uses defaults when user is not found', () => {
    User.findById.mockReturnValue(null);
    exportConversation(CONV_ID);
    const [, jsonStr] = fs.writeFileSync.mock.calls[0];
    const exported = JSON.parse(jsonStr);
    expect(exported.user.name).toBe('Unknown');
    expect(exported.user.os_type).toBe('Unknown');
    expect(exported.user.comfort_level).toBe(1);
  });

  test('deduplicates skills_activated', () => {
    SkillEvent.findByUserId.mockReturnValue([
      { skill_name: 'email_basics', practiced_at: '2024-01-01T10:05:00.000Z' },
      { skill_name: 'email_basics', practiced_at: '2024-01-01T10:10:00.000Z' },
    ]);
    exportConversation(CONV_ID);
    const [, jsonStr] = fs.writeFileSync.mock.calls[0];
    const exported = JSON.parse(jsonStr);
    const emailCount = exported.skills_activated.filter(s => s === 'email_basics').length;
    expect(emailCount).toBe(1);
  });
});

// ─── exportAll ────────────────────────────────────────────────────────────────

describe('exportAll', () => {
  test('returns empty array when no completed conversations exist', () => {
    db.prepare.mockReturnValue({ all: jest.fn(() => []) });
    const result = exportAll();
    expect(result).toEqual([]);
  });

  test('skips conversations that already have an export file', () => {
    db.prepare.mockReturnValue({ all: jest.fn(() => [{ id: CONV_ID }]) });
    fs.existsSync.mockReturnValue(true); // file already exists
    const result = exportAll();
    expect(result).toEqual([]);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('exports conversations that do not have a file yet', () => {
    db.prepare.mockReturnValue({ all: jest.fn(() => [{ id: CONV_ID }]) });
    fs.existsSync.mockReturnValue(false); // file doesn't exist yet
    const result = exportAll();
    expect(result.length).toBe(1);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  test('skips conversations where exportConversation returns null', () => {
    db.prepare.mockReturnValue({ all: jest.fn(() => [{ id: CONV_ID }]) });
    fs.existsSync.mockReturnValue(false);
    // Make the conversation have only 1 message → exportConversation returns null
    Message.findByConversationId.mockReturnValue([SAMPLE_MESSAGES[0]]);
    const result = exportAll();
    expect(result).toEqual([]);
  });
});
