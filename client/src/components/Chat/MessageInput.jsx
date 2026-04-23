import React, { useRef, useEffect } from 'react';
import './MessageInput.css';

/**
 * MessageInput — text input + send button + resources button.
 *
 * - Large input field (min 56px height)
 * - Send button submits the message
 * - Resources button gathers videos/links related to conversation
 * - Submits on Enter (Shift+Enter adds a newline)
 * - Disabled while isTyping
 */
function MessageInput({ onSend, onGatherResources, isTyping }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!isTyping && inputRef.current) inputRef.current.focus();
  }, [isTyping]);

  const handleSend = () => {
    const text = inputRef.current?.value ?? '';
    if (!text.trim() || isTyping) return;
    onSend(text);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleResources = () => {
    if (isTyping) return;
    const text = inputRef.current?.value ?? '';
    onGatherResources(text.trim());
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
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
        className="message-resources-btn"
        onClick={handleResources}
        disabled={isTyping}
        aria-label="Get external help on this topic"
        title="Get external help"
      >
        Get External Help
      </button>
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
