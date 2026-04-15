import React from 'react';
import './MessageBubble.css';
import YouTubeEmbed from './YouTubeEmbed';
import CommandGuide from './CommandGuide';
import DiagnosticFindings from './DiagnosticFindings';

/**
 * Parse simple markdown into React elements.
 * Supports: **bold**, numbered lists (1. 2. 3.), and line breaks.
 */
function formatMessage(text) {
  if (!text) return null;

  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

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

    return <p key={i} className="bubble__paragraph">{renderInline(trimmed)}</p>;
  });
}

/**
 * Render inline markdown: **bold** text.
 */
function renderInline(text) {
  if (!text) return null;

  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="bubble__bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * MessageBubble — displays a single chat message with formatted text and images.
 */
function MessageBubble({ message, onRunCommand }) {
  const { role, text, timestamp, safetyAlert, images, videos, guide, commandResults, findings } = message;
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

        {/* Diagnostic findings dropdown */}
        {findings && <DiagnosticFindings findings={findings} />}

        {/* Interactive command guide */}
        {guide && <CommandGuide guide={guide} onRunCommand={onRunCommand} commandResults={commandResults || {}} />}

        {/* YouTube tutorial videos */}
        {videos && <YouTubeEmbed videos={videos} />}

        {/* Annotated device screenshots */}
        {images && images.length > 0 && (
          <div className="bubble__screenshots">
            {images.map((img, i) => (
              <div key={i} className="bubble__screenshot-card">
                <img
                  src={img.url}
                  alt={img.alt}
                  className="bubble__screenshot-img"
                  loading="lazy"
                />
                <p className="bubble__screenshot-caption">{img.alt}</p>
              </div>
            ))}
          </div>
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
