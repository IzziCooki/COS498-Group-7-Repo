import React, { useRef, useEffect } from 'react';
import './MessageInput.css';

/**
 * MessageInput — text input + send button for the chat.
 *
 * - Large input field (min 56px height)
 * - Prominent send button
 * - Submits on Enter (Shift+Enter adds a newline)
 * - Disabled while isTyping
 * - Auto-focused on mount
 */
function MessageInput({ onSend, isTyping }) {
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Re-focus after response arrives
  useEffect(() => {
    if (!isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTyping]);

  const handleSend = () => {
    const text = inputRef.current?.value ?? '';
    if (!text.trim() || isTyping) return;
    onSend(text);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleKeyDown = (e) => {
    // Enter submits; Shift+Enter adds newline (for textarea)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input-bar">
      <label htmlFor="chat-input" className="sr-only">
        Type your message
      </label>
      <input
        id="chat-input"
        ref={inputRef}
        type="text"
        className="message-input-field"
        placeholder="Type your question here..."
        disabled={isTyping}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        aria-label="Type your question here"
      />
      <button
        className="message-send-btn btn-primary"
        onClick={handleSend}
        disabled={isTyping}
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
}

export default MessageInput;
