import React, { useState, useCallback } from 'react';

// Preload voices — Chrome loads them async after page load
let _voicesReady = false;
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices(); // trigger initial load
  window.speechSynthesis.onvoiceschanged = () => { _voicesReady = true; };
}
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
  // The systemModifying flag rides on the parent message and is forwarded
  // only to the guide entry — DisclaimerCard renders next to step sequences.
  const guideMeta = {
    systemModifying: !!message.systemModifying,
    systemModifyingMatches: message.systemModifyingMatches || null,
  };
  if (message.guide) entries.push({ key: 'guide', type: 'guide', data: message.guide, meta: guideMeta });
  if (message.findings) entries.push({ key: 'diagnostic', type: 'diagnostic', data: message.findings });
  if (message.videos) entries.push({ key: 'video', type: 'video', data: message.videos });
  if (message.resources) entries.push({ key: 'resources', type: 'resources', data: message.resources });
  if (message.practice) entries.push({ key: 'practice', type: 'practice', data: message.practice });
  return entries;
}

/* ── Inline artifact renderer ──────────────────────────────── */

function InlineArtifact({ type, data, meta, onClose, onSendMessage, onOpenInPanel }) {
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
            systemModifying={!!meta?.systemModifying}
            systemModifyingMatches={meta?.systemModifyingMatches || null}
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
function MessageBubble({ message, onArtifactTap, onLongPress, onSendMessage, onRate }) {
  const { role, text, timestamp, images, buddyTerminal, screenshot } = message;
  const isUser = role === 'user';
  const isAI = !isUser;
  const [rated, setRated] = React.useState(null); // 'up' | 'down' | null
  const [speaking, setSpeaking] = React.useState(false);

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
                    meta={entry.meta}
                    onClose={() => collapseInline(entry.key)}
                    onSendMessage={onSendMessage}
                    onOpenInPanel={() => {
                      collapseInline(entry.key);
                      onArtifactTapSafe(entry.type, entry.data, entry.meta);
                    }}
                  />
                ) : (
                  <ArtifactCard
                    type={entry.type}
                    data={entry.data}
                    onTap={() => onArtifactTapSafe(entry.type, entry.data, entry.meta)}
                    onShowInline={() => toggleInline(entry.key)}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="pcp-message__meta-row">
          {formattedTime && (
            <time className="pcp-message__timestamp" dateTime={timestamp}>
              {formattedTime}
            </time>
          )}
          {isAI && text && (
            <div className="pcp-message__rate">
              <button
                type="button"
                className={`pcp-message__rate-btn${speaking ? ' pcp-message__rate-btn--active' : ''}`}
                onClick={() => {
                  if (speaking) {
                    window.speechSynthesis.cancel();
                    setSpeaking(false);
                  } else if (text && 'speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 0.95;
                    utterance.pitch = 1.0;
                    // Pick the best available English voice
                    const voices = window.speechSynthesis.getVoices();
                    const english = voices.filter(v => v.lang.startsWith('en'));
                    // Prefer high-quality voices by name (order = preference)
                    const preferred = [
                      'Google UK English Female',   // Chrome — natural, warm
                      'Google US English',           // Chrome fallback
                      'Samantha',                    // macOS — high quality
                      'Karen',                       // macOS Australian
                      'Daniel',                      // macOS British
                      'Microsoft Zira',              // Windows
                      'Microsoft Jenny',             // Windows 11 neural
                      'Moira',                       // macOS Irish
                    ];
                    let best = null;
                    for (const name of preferred) {
                      best = english.find(v => v.name.includes(name));
                      if (best) break;
                    }
                    // Fallback: any English voice, preferring non-default
                    if (!best) best = english.find(v => !v.localService) || english[0];
                    if (best) utterance.voice = best;
                    utterance.onend = () => setSpeaking(false);
                    utterance.onerror = () => setSpeaking(false);
                    window.speechSynthesis.speak(utterance);
                    setSpeaking(true);
                  }
                }}
                aria-label={speaking ? 'Stop reading' : 'Read aloud'}
                title={speaking ? 'Stop' : 'Read aloud'}
              >
                {speaking ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
              </button>
            </div>
          )}
          {isAI && text && (
            <div className="pcp-message__rate">
              <button
                type="button"
                className={`pcp-message__rate-btn${rated === 'up' ? ' pcp-message__rate-btn--active' : ''}`}
                onClick={() => {
                  const next = rated === 'up' ? null : 'up';
                  setRated(next);
                  if (onRate) onRate(message.id, next);
                }}
                aria-label={rated === 'up' ? 'Remove thumbs up' : 'Thumbs up - helpful'}
                title="Helpful"
              >
                {rated === 'up' ? '\uD83D\uDC4D' : '\uD83D\uDC4D\uD83C\uDFFB'}
              </button>
              <button
                type="button"
                className={`pcp-message__rate-btn${rated === 'down' ? ' pcp-message__rate-btn--active-down' : ''}`}
                onClick={() => {
                  const next = rated === 'down' ? null : 'down';
                  setRated(next);
                  if (onRate) onRate(message.id, next);
                }}
                aria-label={rated === 'down' ? 'Remove thumbs down' : 'Thumbs down - not helpful'}
                title="Not helpful"
              >
                {rated === 'down' ? '\uD83D\uDC4E' : '\uD83D\uDC4E\uD83C\uDFFB'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
