import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

/**
 * useChat — WebSocket chat hook for PC Pal
 *
 * Connects to /ws (proxied to ws://localhost:3001/ws by Vite),
 * sends an init message, and manages message state.
 *
 * @param {string|null} userId
 * @returns {object} chat state + callbacks (see destructured return below)
 */
export function useChat(userId) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [activeSequence, setActiveSequence] = useState(null);
  const [welcomeBack, setWelcomeBack] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [feedbackPrompt, setFeedbackPrompt] = useState(null);

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
      ws.send(JSON.stringify({ type: 'init', userId }));
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
            // The agent closed the session mid-turn (e.g. restart_conversation).
            // Surface the feedback modal for that closed conversation.
            setFeedbackPrompt({ conversationId: data.endedConversationId });
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

  return {
    messages,
    sendMessage,
    isConnected,
    isTyping,
    connectionFailed,
    activeSequence,
    welcomeBack,
    dismissWelcomeBack,
    conversationId,
    feedbackPrompt,
    endChat,
    submitFeedback,
    skipFeedback,
  };
}
