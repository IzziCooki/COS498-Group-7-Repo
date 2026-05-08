import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { collectBrowserSystemInfo } from '../utils/collectBrowserSystemInfo';

/**
 * useChat — WebSocket chat hook for PC Pal
 *
 * Connects to /ws (proxied to ws://localhost:3001/ws by Vite),
 * sends an init message, and manages message state.
 *
 * @param {string|null} userId
 * @returns {{ messages: Array, sendMessage: (text: string) => void, gatherResources: (extraText: string) => void, pairAgent: (code: string, callback: Function) => void, agentConnected: boolean, runCommand: (command: string) => void, isConnected: boolean, isTyping: boolean, connectionFailed: boolean, activeSequence: object|null, welcomeBack: { reviewSkills: Array, pendingHelp: Array }|null, dismissWelcomeBack: () => void, conversationId: string|null, feedbackPrompt: { conversationId: string }|null, startNewChat: () => void, endChat: () => void, submitFeedback: (payload: { rating: number, comment?: string }) => Promise<{ ok: boolean, error?: string }>, skipFeedback: () => Promise<void>, terminalHistory: Array, terminalCwd: string|null, sendTerminalCommand: (command: string) => void, buddySession: object|null, buddyObserving: { buddyName: string }|null, joinBuddySession: (learnerId: string) => void, leaveBuddySession: (learnerId: string) => void, sendBuddyCommand: (learnerId: string, command: string) => void, sendScreenFrame: (imageBase64: string) => void, wsRef: React.MutableRefObject<WebSocket|null> }}
 */
export function useChat(userId, options = {}) {
  const { onAssistantResponse } = options;
  // Stable ref so callback identity changes don't reconnect the WebSocket.
  const onAssistantResponseRef = useRef(onAssistantResponse);
  useEffect(() => { onAssistantResponseRef.current = onAssistantResponse; }, [onAssistantResponse]);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [activeSequence, setActiveSequence] = useState(null);
  const [welcomeBack, setWelcomeBack] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [feedbackPrompt, setFeedbackPrompt] = useState(null);
  const [agentConnected, setAgentConnected] = useState(false);
  // Standalone terminal history (user's own terminal panel)
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [terminalCwd, setTerminalCwd] = useState(null);
  // Buddy session state — set when THIS user is observing a learner's session
  const [buddySession, setBuddySession] = useState(null);
  // Set when a buddy is observing OUR session (we are the learner)
  const [buddyObserving, setBuddyObserving] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageIdRef = useRef(0);
  const reconnectAttemptsRef = useRef(0);
  const connectRef = useRef(null);
  const conversationIdRef = useRef(null);

  const nextId = () => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  };

  // Keep a ref in sync so callbacks can read the latest conversation id
  // without being re-created on every change.
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const connect = useCallback(() => {
    if (!userId) return;

    // Determine WS URL: use relative path so Vite proxy handles it
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionFailed(false);
      reconnectAttemptsRef.current = 0;
      // Send init message so the server knows who we are
      const browserSystemInfo = collectBrowserSystemInfo();
      ws.send(JSON.stringify({ type: 'init', userId, browserSystemInfo }));
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        console.error('PC Pal: invalid JSON from server', event.data);
        return;
      }

      switch (data.type) {
        case 'init_ack':
          if (data.conversationId) {
            setConversationId(data.conversationId);
          }
          break;

        case 'welcome_back':
          setWelcomeBack({
            reviewSkills: data.reviewSkills || [],
            pendingHelp: data.pendingHelp || [],
          });
          break;

        case 'typing':
          setIsTyping(true);
          break;

        case 'response':
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: nextId(),
              role: 'assistant',
              text: data.text ?? '',
              timestamp: new Date().toISOString(),
              safetyAlert: data.safetyAlert ?? null,
              stepSequence: data.stepSequence || null,
              images: data.images || null,
              videos: data.videos || null,
              guide: data.guide || null,
              findings: data.findings || null,
              practice: data.practice || null,
              screenshot: data.screenshot || null,
              confidence: data.confidence || null,
              systemModifying: !!data.systemModifying,
              systemModifyingMatches: data.systemModifyingMatches || null,
            },
          ]);
          if (data.stepSequence) {
            if (data.stepSequence.completed) {
              setActiveSequence(null);
            } else {
              setActiveSequence(data.stepSequence);
            }
          }
          if (data.conversationId) {
            setConversationId(data.conversationId);
          }
          if (data.endedConversationId) {
            setFeedbackPrompt({ conversationId: data.endedConversationId });
          }
          {
            const cb = onAssistantResponseRef.current;
            if (typeof cb === 'function' && typeof data.text === 'string' && data.text.length > 0) {
              cb(data.text);
            }
          }
          break;

        case 'resources':
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: nextId(),
              role: 'assistant',
              text: data.text ?? '',
              timestamp: new Date().toISOString(),
              resources: data.resources || null,
            },
          ]);
          break;

        case 'command_result':
          // Update the command result in the most recent message's guide
          setMessages((prev) => {
            const updated = [...prev];
            // Find the latest assistant message with a guide
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].guide) {
                updated[i] = {
                  ...updated[i],
                  commandResults: {
                    ...(updated[i].commandResults || {}),
                    [data.command]: { output: data.output, running: false, error: data.error },
                  },
                };
                break;
              }
            }
            return updated;
          });
          break;

        case 'pair_result':
          if (data.success) {
            setAgentConnected(true);
          }
          // The callback is handled via pairAgent below
          break;

        case 'agent_status':
          setAgentConnected(!!data.connected);
          break;

        case 'new_chat_ack':
          // Server created a fresh session after closing the previous one
          setMessages([]);
          setActiveSequence(null);
          setFeedbackPrompt(null);
          if (data.conversationId) {
            setConversationId(data.conversationId);
          }
          break;

        case 'chat_ended':
          // User clicked "End chat". Server confirmed the session is closed;
          // show the feedback modal.
          if (data.conversationId) {
            setFeedbackPrompt({ conversationId: data.conversationId });
          }
          break;

        case 'error':
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: nextId(),
              role: 'assistant',
              text: data.message ?? 'Something went wrong. Please try again.',
              timestamp: new Date().toISOString(),
              safetyAlert: null,
            },
          ]);
          break;

        case 'terminal_result':
          setTerminalHistory(prev => prev.map(entry =>
            entry.requestId === data.requestId
              ? { ...entry, output: data.output, error: data.error, running: false }
              : entry
          ));
          if (data.cwd) setTerminalCwd(data.cwd);
          break;

        // ─── Buddy session messages ───
        case 'buddy_join_ack':
          setBuddySession({
            learnerId: data.learnerId,
            learnerName: data.learnerName,
            messages: (data.messages || []).map((m, i) => ({ ...m, id: 'bh_' + i })),
            terminalHistory: [],
          });
          break;

        case 'buddy_chat_forward':
          setBuddySession(prev => prev ? {
            ...prev,
            messages: [...prev.messages, { id: 'bf_' + Date.now(), role: data.role, text: data.text, timestamp: data.timestamp }],
          } : prev);
          break;

        case 'buddy_command_result':
          setBuddySession(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              cwd: data.cwd || prev.cwd,
              terminalHistory: prev.terminalHistory.map(entry =>
                entry.requestId === data.requestId
                  ? { ...entry, output: data.output, error: data.error, running: false }
                  : entry
              ),
            };
          });
          break;

        case 'buddy_joined':
          setBuddyObserving({ buddyName: data.buddyName });
          break;

        case 'buddy_left':
          setBuddyObserving(null);
          break;

        case 'buddy_terminal_start':
          // Learner sees buddy starting a command
          setMessages(prev => [...prev, {
            id: 'bt_' + data.requestId,
            role: 'assistant',
            text: `${data.buddyName} is running a diagnostic command...`,
            timestamp: new Date().toISOString(),
            buddyTerminal: { requestId: data.requestId, command: data.command, output: '', error: false, running: true, buddyName: data.buddyName },
          }]);
          break;

        case 'buddy_terminal_result':
          // Update the pending terminal message with the result
          setMessages(prev => prev.map(m =>
            m.buddyTerminal && m.buddyTerminal.requestId === data.requestId
              ? { ...m, text: `${data.buddyName} ran: ${data.command}`, buddyTerminal: { ...m.buddyTerminal, output: data.output, error: data.error, running: false } }
              : m
          ));
          break;

        default:
          console.warn('PC Pal: unknown message type', data.type);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsTyping(false);
      const attempts = reconnectAttemptsRef.current;
      if (attempts >= 5) {
        setConnectionFailed(true);
        return;
      }
      reconnectAttemptsRef.current = attempts + 1;
      const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
      reconnectTimeoutRef.current = setTimeout(() => connectRef.current?.(), delay);
    };

    ws.onerror = (err) => {
      console.error('PC Pal WebSocket error', err);
      ws.close();
    };
  }, [userId]);

  // Keep the ref in sync so ws.onclose can call the latest connect without
  // capturing it as a const (which would be a temporal dead zone violation).
  useLayoutEffect(() => {
    connectRef.current = connect;
  });

  useEffect(() => {
    if (!userId) return;
    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        // Remove the onclose handler before closing so we don't trigger reconnect
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [userId, connect]);

  /**
   * Send a chat message.
   * @param {string} text
   */
  const sendMessage = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Optimistically add the user's message to the list
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'user',
          text: trimmed,
          timestamp: new Date().toISOString(),
          safetyAlert: null,
        },
      ]);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'chat', text: trimmed }));
      } else {
        console.warn('PC Pal: WebSocket not open, message not sent');
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            text: 'Sorry, the connection was lost. Please refresh the page and try again.',
            timestamp: new Date().toISOString(),
            safetyAlert: null,
          },
        ]);
      }
    },
    [],
  );

  const dismissWelcomeBack = useCallback(() => setWelcomeBack(null), []);

  /**
   * Pair with a relay agent using a code. Calls back with { success, message }.
   */
  const pairAgent = useCallback((code, callback) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      callback({ success: false, message: 'Not connected to PC Pal server.' });
      return;
    }
    // Listen for the pair result
    const handler = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'pair_result') {
        wsRef.current.removeEventListener('message', handler);
        if (data.success) setAgentConnected(true);
        callback(data);
      }
    };
    wsRef.current.addEventListener('message', handler);
    wsRef.current.send(JSON.stringify({ type: 'pair_agent', code }));
  }, []);

  /**
   * Gather resources (videos + links) related to the conversation.
   * Optionally takes extra text from the input field for context.
   */
  const gatherResources = useCallback((extraText) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setIsTyping(true);
    // Add a user message showing what was requested
    const displayText = extraText
      ? `Find resources about: ${extraText}`
      : 'Find resources related to our conversation';
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text: displayText, timestamp: new Date().toISOString() },
    ]);
    wsRef.current.send(JSON.stringify({
      type: 'gather_resources',
      text: extraText || '',
    }));
  }, []);

  /**
   * Run a user-approved command from a guide artifact.
   * Sets the command as "running" immediately, then sends to server.
   */
  const runCommand = useCallback((command) => {
    if (!command) return;
    // Mark as running in the most recent guide
    setMessages((prev) => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].guide) {
          updated[i] = {
            ...updated[i],
            commandResults: {
              ...(updated[i].commandResults || {}),
              [command]: { output: '', running: true, error: false },
            },
          };
          break;
        }
      }
      return updated;
    });
    // Send to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'run_command', command }));
    }
  }, []);

  /**
   * Start a fresh conversation. Closes the current session server-side
   * and creates a new one. The server replies with `new_chat_ack`.
   */
  const startNewChat = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'new_chat' }));
    }
  }, []);

  /**
   * Trigger the end-of-chat flow. Tells the server to close the session;
   * the server replies with `chat_ended` and the hook opens the modal.
   */
  const endChat = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_chat' }));
    } else if (conversationIdRef.current) {
      // WS not open — fall back to opening the modal locally so the user
      // can still leave feedback. The POST below will still persist it.
      setFeedbackPrompt({ conversationId: conversationIdRef.current });
    }
  }, []);

  /**
   * Reset local state after the server has closed a conversation.
   */
  const resetChatLocally = useCallback(() => {
    setMessages([]);
    setActiveSequence(null);
    setConversationId(null);
    setFeedbackPrompt(null);
  }, []);

  /**
   * POST the rating + optional comment to /api/quality/feedback.
   * On success, resets local state so the next message starts a fresh chat.
   * @param {{ rating: number, comment?: string }} payload
   */
  const submitFeedback = useCallback(async ({ rating, comment }) => {
    const target = feedbackPrompt?.conversationId;
    if (!target || !userId) {
      resetChatLocally();
      return { ok: false, error: 'missing_context' };
    }
    try {
      const res = await fetch('/api/quality/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: target,
          userId,
          rating,
          comment: comment || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('PC Pal: feedback POST failed', res.status, body);
        return { ok: false, error: body.error || `http_${res.status}` };
      }
    } catch (err) {
      console.error('PC Pal: feedback POST threw', err);
      return { ok: false, error: 'network' };
    }
    resetChatLocally();
    return { ok: true };
  }, [feedbackPrompt, userId, resetChatLocally]);

  /**
   * User dismissed the feedback modal — POST to /skip so the session closes
   * cleanly without recording a rating.
   */
  const skipFeedback = useCallback(async () => {
    const target = feedbackPrompt?.conversationId;
    if (target && userId) {
      try {
        await fetch('/api/quality/feedback/skip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: target, userId }),
        });
      } catch (err) {
        console.error('PC Pal: feedback skip POST threw', err);
      }
    }
    resetChatLocally();
  }, [feedbackPrompt, userId, resetChatLocally]);

  const terminalCmdIdRef = useRef(0);
  const sendTerminalCommand = useCallback((command) => {
    const trimmed = command.trim();
    if (!trimmed) return;
    terminalCmdIdRef.current += 1;
    const requestId = 'tcmd_' + terminalCmdIdRef.current + '_' + Date.now();
    setTerminalHistory(prev => [...prev, { requestId, command: trimmed, output: '', error: false, running: true }]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'terminal_command', command: trimmed, requestId }));
    }
  }, []);

  const joinBuddySession = useCallback((learnerId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'buddy_join', learnerId }));
    }
  }, []);

  const leaveBuddySession = useCallback((learnerId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && learnerId) {
      wsRef.current.send(JSON.stringify({ type: 'buddy_leave', learnerId }));
    }
    setBuddySession(null);
  }, []);

  const buddyCommandIdRef = useRef(0);
  const sendBuddyCommand = useCallback((learnerId, command) => {
    const trimmed = command.trim();
    if (!trimmed || !learnerId) return;
    buddyCommandIdRef.current += 1;
    const requestId = 'bcmd_' + buddyCommandIdRef.current + '_' + Date.now();
    setBuddySession(prev => prev ? {
      ...prev,
      terminalHistory: [...prev.terminalHistory, { requestId, command: trimmed, output: '', error: false, running: true }],
    } : prev);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'buddy_command', learnerId, command: trimmed, requestId }));
    }
  }, []);

  return {
    messages,
    sendMessage,
    gatherResources,
    pairAgent,
    agentConnected,
    runCommand,
    isConnected,
    isTyping,
    connectionFailed,
    activeSequence,
    welcomeBack,
    dismissWelcomeBack,
    conversationId,
    feedbackPrompt,
    startNewChat,
    endChat,
    submitFeedback,
    skipFeedback,
    terminalHistory,
    terminalCwd,
    sendTerminalCommand,
    buddySession,
    buddyObserving,
    joinBuddySession,
    leaveBuddySession,
    sendBuddyCommand,
    sendScreenFrame: useCallback((imageBase64) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'screen_frame', imageBase64 }));
      }
    }, []),
    wsRef,
  };
}
