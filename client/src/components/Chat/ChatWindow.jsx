import React, { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import './ChatWindow.css';

/**
 * ChatWindow — main chat container.
 *
 * - Full-height layout with scrollable message list above input
 * - Auto-scrolls to the latest message
 * - Shows "PC Pal is typing..." indicator
 */
function ChatWindow({ userId }) {
  const { messages, sendMessage, isConnected, isTyping } = useChat(userId);
  const bottomRef = useRef(null);
  const listRef = useRef(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  return (
    <div className="chat-window">
      {/* Connection status banner */}
      {!isConnected && (
        <div className="connection-banner" role="status">
          Connecting to PC Pal... please wait.
        </div>
      )}

      {/* Scrollable message list */}
      <div className="chat-messages" ref={listRef} role="log" aria-live="polite" aria-label="Chat messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-empty__text">
              Hello! I'm PC Pal, your friendly tech helper.
              <br />
              Ask me anything about your computer!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="typing-indicator" aria-live="polite" role="status">
            <div className="typing-indicator__dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-indicator__label">PC Pal is typing...</span>
          </div>
        )}

        {/* Invisible anchor to scroll to */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Input area */}
      <MessageInput onSend={sendMessage} isTyping={isTyping} />
    </div>
  );
}

export default ChatWindow;
