import React, { useState, useCallback } from 'react';
import ArtifactCard from './ArtifactCard';
import GuideViewer from '../Artifacts/GuideViewer/GuideViewer';
import VideoPlayer from '../Artifacts/VideoPlayer';
import DiagnosticFindings from '../Artifacts/DiagnosticFindings';
import ResourcesViewer from '../Artifacts/ResourcesViewer';
import PracticeMode from '../Artifacts/PracticeMode/PracticeMode';
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

function getArtifactEntries(message) {
  const entries = [];
  if (message.guide) entries.push({ key: 'guide', type: 'guide', data: message.guide });
  if (message.findings) entries.push({ key: 'diagnostic', type: 'diagnostic', data: message.findings });
  if (message.videos) entries.push({ key: 'video', type: 'video', data: message.videos });
  if (message.resources) entries.push({ key: 'resources', type: 'resources', data: message.resources });
  if (message.practice) entries.push({ key: 'practice', type: 'practice', data: message.practice });
  return entries;
}

/* ── Inline artifact renderer ──────────────────────────────── */

function InlineArtifact({ type, data, onClose, onSendMessage, onOpenInPanel }) {
  const titleId = `pcp-inline-artifact-${type}`;
  return (
    <div className="pcp-message__inline-artifact">
      <div className="pcp-message__inline-artifact-header">
        <button
          type="button"
          className="pcp-message__inline-artifact-btn"
          onClick={onClose}
          aria-label="Collapse inline artifact"
        >
          &#9660; Collapse
        </button>
        {onOpenInPanel && (
          <button
            type="button"
            className="pcp-message__inline-artifact-btn"
            onClick={onOpenInPanel}
            aria-label="Open in panel"
          >
            Open in panel &#8599;
          </button>
        )}
      </div>
      <div className="pcp-message__inline-artifact-content">
        {type === 'guide' && (
          <GuideViewer
            guide={data}
            onClose={onClose}
            onSendMessage={onSendMessage}
            onStepChange={() => {}}
            titleId={titleId}
          />
        )}
        {type === 'video' && (
          <VideoPlayer
            videos={data}
            onClose={onClose}
            titleId={titleId}
          />
        )}
        {type === 'diagnostic' && (
          <DiagnosticFindings
            findings={data}
            onClose={onClose}
            titleId={titleId}
          />
        )}
        {type === 'resources' && (
          <ResourcesViewer
            resources={data}
            onClose={onClose}
            titleId={titleId}
          />
        )}
        {type === 'practice' && (
          <PracticeMode
            practice={data}
            onClose={onClose}
            onSendMessage={onSendMessage}
            titleId={titleId}
          />
        )}
      </div>
    </div>
  );
}

/**
 * MessageBubble -- Single message in the chat thread (D2 S2).
 * AI: left-aligned with 32x32 mascot avatar, white bubble + border.
 * User: right-aligned, primary blue bubble, white text, no avatar.
 *
 * @param {{ message: object, onArtifactTap: (type:string, data:any) => void, onLongPress: (message:object) => void, onSendMessage?: (text:string) => void }} props
 */
function MessageBubble({ message, onArtifactTap, onLongPress, onSendMessage }) {
  const { role, text, timestamp, images, buddyTerminal, screenshot } = message;
  const isUser = role === 'user';
  const isAI = !isUser;

  // ── Inline-expanded artifact state ──
  const [inlineExpanded, setInlineExpanded] = useState({});

  const toggleInline = useCallback((key) => {
    setInlineExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const collapseInline = useCallback((key) => {
    setInlineExpanded((prev) => ({ ...prev, [key]: false }));
  }, []);

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

  const artifactEntries = isAI ? getArtifactEntries(message) : [];
  const onArtifactTapSafe = onArtifactTap || (() => {});

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

        {/* Artifact cards + inline expansions */}
        {artifactEntries.length > 0 && (
          <div className="pcp-message__artifacts">
            {artifactEntries.map((entry) => (
              <React.Fragment key={entry.key}>
                {inlineExpanded[entry.key] ? (
                  <InlineArtifact
                    type={entry.type}
                    data={entry.data}
                    onClose={() => collapseInline(entry.key)}
                    onSendMessage={onSendMessage}
                    onOpenInPanel={() => {
                      collapseInline(entry.key);
                      onArtifactTapSafe(entry.type, entry.data);
                    }}
                  />
                ) : (
                  <ArtifactCard
                    type={entry.type}
                    data={entry.data}
                    onTap={() => onArtifactTapSafe(entry.type, entry.data)}
                    onShowInline={() => toggleInline(entry.key)}
                  />
                )}
              </React.Fragment>
            ))}
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
