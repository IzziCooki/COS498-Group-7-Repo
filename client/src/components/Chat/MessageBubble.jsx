import React from 'react';
import './MessageBubble.css';

/**
 * MessageBubble — displays a single chat message.
 *
 * User messages: right-aligned, blue background.
 * Assistant messages: left-aligned, white background.
 * Shows a red safety alert banner when safetyAlert is present.
 */
function MessageBubble({ message }) {
  const { role, text, timestamp, safetyAlert } = message;
  const isUser = role === 'user';

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--assistant'}`}>
      {safetyAlert && (
        <div className="safety-alert" role="alert">
          <span className="safety-alert__icon" aria-hidden="true">!</span>
          <span>{safetyAlert}</span>
        </div>
      )}

      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--assistant'}`}>
        <p className="bubble__text">{text}</p>
        <time className="bubble__time" dateTime={timestamp}>{formattedTime}</time>
      </div>

      {!isUser && (
        <span className="message-avatar" aria-hidden="true">PC</span>
      )}
    </div>
  );
}

export default MessageBubble;
