'use strict';

jest.mock('../models/Conversation', () => ({
  findActive: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  abandonStale: jest.fn(),
}));
jest.mock('../models/Message', () => ({
  getRecent: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../core/conversationExporter', () => ({
  exportConversation: jest.fn(),
}));

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const exporter = require('../core/conversationExporter');
const {
  getOrCreateSession,
  closeSession,
  abandonStale,
  getSessionMessages,
  addMessage,
} = require('../core/conversationState');

const SESSION_ID = 'session-123';
const USER_ID = 'user-abc';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getOrCreateSession ───────────────────────────────────────────────────────

describe('getOrCreateSession', () => {
  test('returns existing active session when one exists', () => {
    const existing = { id: SESSION_ID, user_id: USER_ID, status: 'active' };
    Conversation.findActive.mockReturnValue([existing]);
    const result = getOrCreateSession(USER_ID);
    expect(result).toBe(existing);
    expect(Conversation.create).not.toHaveBeenCalled();
  });

  test('creates a new session when no active session exists', () => {
    const newConv = { id: 'new-session', user_id: USER_ID, status: 'active' };
    Conversation.findActive.mockReturnValue([]);
    Conversation.create.mockReturnValue(newConv);
    const result = getOrCreateSession(USER_ID);
    expect(result).toBe(newConv);
    expect(Conversation.create).toHaveBeenCalledWith({ user_id: USER_ID });
  });

  test('creates a new session when findActive returns null', () => {
    const newConv = { id: 'new-session', user_id: USER_ID, status: 'active' };
    Conversation.findActive.mockReturnValue(null);
    Conversation.create.mockReturnValue(newConv);
    const result = getOrCreateSession(USER_ID);
    expect(Conversation.create).toHaveBeenCalledWith({ user_id: USER_ID });
    expect(result).toBe(newConv);
  });
});

// ─── closeSession ─────────────────────────────────────────────────────────────

describe('closeSession', () => {
  test('updates conversation status to completed and sets ended_at', () => {
    const closed = { id: SESSION_ID, status: 'completed' };
    Conversation.update.mockReturnValue(closed);
    const result = closeSession(SESSION_ID);
    expect(Conversation.update).toHaveBeenCalledWith(SESSION_ID, expect.objectContaining({
      status: 'completed',
      ended_at: expect.any(String),
    }));
    expect(result).toBe(closed);
  });

  test('calls exportConversation after closing', () => {
    Conversation.update.mockReturnValue({ id: SESSION_ID });
    closeSession(SESSION_ID);
    expect(exporter.exportConversation).toHaveBeenCalledWith(SESSION_ID);
  });

  test('does not throw if exportConversation throws', () => {
    Conversation.update.mockReturnValue({ id: SESSION_ID });
    exporter.exportConversation.mockImplementation(() => { throw new Error('export failed'); });
    expect(() => closeSession(SESSION_ID)).not.toThrow();
  });
});

// ─── abandonStale ─────────────────────────────────────────────────────────────

describe('abandonStale', () => {
  test('delegates to Conversation.abandonStale with 30-minute threshold', () => {
    Conversation.abandonStale.mockReturnValue(3);
    const count = abandonStale();
    expect(Conversation.abandonStale).toHaveBeenCalledWith(30);
    expect(count).toBe(3);
  });

  test('returns 0 when no stale sessions', () => {
    Conversation.abandonStale.mockReturnValue(0);
    expect(abandonStale()).toBe(0);
  });
});

// ─── getSessionMessages ───────────────────────────────────────────────────────

describe('getSessionMessages', () => {
  test('returns recent messages with default limit 20', () => {
    const msgs = [{ id: 'm1', body: 'hello' }];
    Message.getRecent.mockReturnValue(msgs);
    const result = getSessionMessages(SESSION_ID);
    expect(Message.getRecent).toHaveBeenCalledWith(SESSION_ID, 20);
    expect(result).toBe(msgs);
  });

  test('uses custom limit when provided', () => {
    Message.getRecent.mockReturnValue([]);
    getSessionMessages(SESSION_ID, 5);
    expect(Message.getRecent).toHaveBeenCalledWith(SESSION_ID, 5);
  });
});

// ─── addMessage ───────────────────────────────────────────────────────────────

describe('addMessage', () => {
  test('creates a user message', () => {
    const msg = { id: 'm1', role: 'user', body: 'Hello!' };
    Message.create.mockReturnValue(msg);
    const result = addMessage(SESSION_ID, 'user', 'Hello!');
    expect(Message.create).toHaveBeenCalledWith({
      conversation_id: SESSION_ID,
      role: 'user',
      body: 'Hello!',
    });
    expect(result).toBe(msg);
  });

  test('creates an assistant message', () => {
    const msg = { id: 'm2', role: 'assistant', body: 'Hi there!' };
    Message.create.mockReturnValue(msg);
    addMessage(SESSION_ID, 'assistant', 'Hi there!');
    expect(Message.create).toHaveBeenCalledWith({
      conversation_id: SESSION_ID,
      role: 'assistant',
      body: 'Hi there!',
    });
  });

  test('throws on invalid role', () => {
    expect(() => addMessage(SESSION_ID, 'system', 'Hello')).toThrow(/invalid role/);
    expect(() => addMessage(SESSION_ID, '', 'Hello')).toThrow(/invalid role/);
    expect(() => addMessage(SESSION_ID, 'moderator', 'Hello')).toThrow(/invalid role/);
  });
});
