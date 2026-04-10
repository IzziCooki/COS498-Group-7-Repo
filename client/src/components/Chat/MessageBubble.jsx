import React from 'react';
import './MessageBubble.css';

/**
 * Parse simple markdown into React elements.
 * Supports: **bold**, numbered lists (1. 2. 3.), and line breaks.
 */
function formatMessage(text) {
  if (!text) return null;

  // Split into paragraphs by double newline
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Check if this paragraph is a numbered step (starts with "1.", "2.", etc.)
    const stepMatch = trimmed.match(/^(\d+)\.\s*(.*)/s);
    if (stepMatch) {
      const num = stepMatch[1];
      const content = stepMatch[2];
      return (
        <div key={i} className="bubble__step">
          <span className="bubble__step-num">{num}</span>
          <span className="bubble__step-text">{renderInline(content)}</span>
        </div>
      );
    }

    // Regular paragraph
    return <p key={i} className="bubble__paragraph">{renderInline(trimmed)}</p>;
  });
}

/**
 * Render inline markdown: **bold** text.
 */
function renderInline(text) {
  if (!text) return null;

  // Split by **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="bubble__bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * MessageBubble — displays a single chat message.
 *
 * User messages: right-aligned, blue background.
 * Assistant messages: left-aligned, white/formatted background.
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
        {isUser ? (
          <p className="bubble__text">{text}</p>
        ) : (
          <div className="bubble__formatted">{formatMessage(text)}</div>
        )}
        <time className="bubble__time" dateTime={timestamp}>{formattedTime}</time>
      </div>

      {!isUser && (
        <span className="message-avatar" aria-hidden="true">PC</span>
      )}
    </div>
  );
}

export default MessageBubble;
