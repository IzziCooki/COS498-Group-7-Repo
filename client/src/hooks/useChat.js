import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useChat — WebSocket chat hook for PC Pal
 *
 * Connects to /ws (proxied to ws://localhost:3001/ws by Vite),
 * sends an init message, and manages message state.
 *
 * @param {string|null} userId
 * @returns {{ messages, sendMessage, isConnected, isTyping }}
 */
export function useChat(userId) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [activeSequence, setActiveSequence] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageIdRef = useRef(0);
  const reconnectAttemptsRef = useRef(0);

  const nextId = () => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  };

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
          // Server acknowledged the init — nothing extra needed
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
            },
          ]);
          if (data.stepSequence) {
            if (data.stepSequence.completed) {
              setActiveSequence(null);
            } else {
              setActiveSequence(data.stepSequence);
            }
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
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = (err) => {
      console.error('PC Pal WebSocket error', err);
      ws.close();
    };
  }, [userId]);

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

  return { messages, sendMessage, isConnected, isTyping, connectionFailed, activeSequence };
}
