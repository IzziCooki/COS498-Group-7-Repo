import React from 'react';
import ArtifactCard from './ArtifactCard';
import './MessageBubble.css';

/* ── Text formatting helpers ─────────────────────────────────── */

function renderInline(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="pcp-message__bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function formatMessage(text) {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
    const stepMatch = trimmed.match(/^(\d+)\.\s*(.*)/s);
    if (stepMatch) {
      return (
        <div key={i} className="pcp-message__step">
          <span className="pcp-message__step-num">{stepMatch[1]}.</span>
          <span>{renderInline(stepMatch[2])}</span>
        </div>
      );
    }
    return <p key={i}>{renderInline(trimmed)}</p>;
  });
}

/* ── Helper: determine artifact types present in a message ──── */

function getArtifactCards(message, onArtifactTap) {
  const cards = [];
  if (message.guide) {
    cards.push(
      <ArtifactCard
        key="guide"
        type="guide"
        data={message.guide}
        onTap={() => onArtifactTap('guide', message.guide)}
      />
    );
  }
  if (message.findings) {
    cards.push(
      <ArtifactCard
        key="diagnostic"
        type="diagnostic"
        data={message.findings}
        onTap={() => onArtifactTap('diagnostic', message.findings)}
      />
    );
  }
  if (message.videos) {
    cards.push(
      <ArtifactCard
        key="video"
        type="video"
        data={message.videos}
        onTap={() => onArtifactTap('video', message.videos)}
      />
    );
  }
  if (message.resources) {
    cards.push(
      <ArtifactCard
        key="resources"
        type="resources"
        data={message.resources}
        onTap={() => onArtifactTap('resources', message.resources)}
      />
    );
  }
  if (message.practice) {
    cards.push(
      <ArtifactCard
        key="practice"
        type="practice"
        data={message.practice}
        onTap={() => onArtifactTap('practice', message.practice)}
      />
    );
  }
  return cards;
}

/**
 * MessageBubble -- Single message in the chat thread (D2 S2).
 * AI: left-aligned with 32x32 mascot avatar, white bubble + border.
 * User: right-aligned, primary blue bubble, white text, no avatar.
 *
 * @param {{ message: object, onArtifactTap: (type:string, data:any) => void, onLongPress: (message:object) => void }} props
 */
function MessageBubble({ message, onArtifactTap, onLongPress }) {
  const { role, text, timestamp, images, buddyTerminal, screenshot } = message;
  const isUser = role === 'user';
  const isAI = !isUser;

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const ariaLabel = `Message from ${isUser ? 'you' : 'PC Pal'}${formattedTime ? ` at ${formattedTime}` : ''}`;

  /* ── Long-press handler: 500ms, cancel on move ────────────── */
  const longPressTimer = React.useRef(null);
  const startPos = React.useRef(null);

  const handlePointerDown = (e) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      if (onLongPress) onLongPress(message);
    }, 500);
  };

  const handlePointerMove = (e) => {
    if (!startPos.current || !longPressTimer.current) return;
    const dx = Math.abs(e.clientX - startPos.current.x);
    const dy = Math.abs(e.clientY - startPos.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const handlePointerLeave = () => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const artifactCards = isAI ? getArtifactCards(message, onArtifactTap || (() => {})) : [];

  return (
    <div
      className={`pcp-message ${isUser ? 'pcp-message--user' : 'pcp-message--ai'}`}
      role="article"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {isAI && (
        <div className="pcp-message__avatar" aria-hidden="true">PC</div>
      )}
      <div className="pcp-message__body">
        <div className="pcp-message__bubble">
          {isUser ? (
            <span>{text}</span>
          ) : (
            <>
              {isAI && message.confidence === 'low' && (
                <div className="pcp-message__confidence-badge">
                  I'm less sure about this one — please double-check these steps
                </div>
              )}
              <div className="pcp-message__formatted">{formatMessage(text)}</div>
            </>
          )}

          {/* Buddy terminal inline */}
          {buddyTerminal && (
            <div className="pcp-message__buddy-terminal">
              <div className="pcp-message__buddy-header">
                {buddyTerminal.buddyName} ran a command
              </div>
              <div className="pcp-message__buddy-cmd">$ {buddyTerminal.command}</div>
              {buddyTerminal.running ? (
                <div style={{ color: 'var(--color-code-comment)' }}>Running...</div>
              ) : (
                <pre className={`pcp-message__buddy-output ${buddyTerminal.error ? 'pcp-message__buddy-output--err' : ''}`}>
                  {buddyTerminal.output || '(no output)'}
                </pre>
              )}
            </div>
          )}

          {/* Annotated screenshot */}
          {screenshot && (
            <div className="pcp-message__screenshots" style={{ marginTop: 'var(--space-3)' }}>
              <div className="pcp-message__screenshot-card">
                <img
                  src={screenshot.imageUrl}
                  alt={screenshot.description || 'Your screen'}
                  className="pcp-message__screenshot-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {screenshot.description && <p className="pcp-message__screenshot-caption">{screenshot.description}</p>}
              </div>
            </div>
          )}

          {/* Device screenshots */}
          {images && images.length > 0 && (
            <div className="pcp-message__screenshots">
              {images.map((img, i) => (
                <div key={i} className="pcp-message__screenshot-card">
                  <img
                    src={img.url}
                    alt={img.alt || 'Screenshot'}
                    className="pcp-message__screenshot-img"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <p className="pcp-message__screenshot-caption">{img.alt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Artifact cards appear below the bubble text, inside the AI message area */}
        {artifactCards.length > 0 && (
          <div className="pcp-message__artifacts">
            {artifactCards}
          </div>
        )}

        {formattedTime && (
          <time className="pcp-message__timestamp" dateTime={timestamp}>
            {formattedTime}
          </time>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
