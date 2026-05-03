import React, { useState, useCallback, useRef, useEffect } from 'react';
import './WatchView.css';

/**
 * WatchView -- Live observation of learner's chat (D5 section 5).
 *
 * Props:
 *   learnerName  - string
 *   messages     - [{ id, sender: 'ai'|'learner', text, timestamp }]
 *   isThinking   - boolean (AI is generating)
 *   onStop       - () => void (end watch session)
 *   onNudge      - (text: string) => void (send private side message)
 *   onCall       - () => void
 *   onTakeOver   - () => void
 */
function WatchView({
  learnerName = 'Learner',
  messages = [],
  isThinking = false,
  onStop,
  onNudge,
  onCall,
  onTakeOver,
}) {
  const [nudgeText, setNudgeText] = useState('');
  const streamRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSendNudge = useCallback(() => {
    if (!nudgeText.trim()) return;
    onNudge && onNudge(nudgeText.trim());
    setNudgeText('');
  }, [nudgeText, onNudge]);

  const handleNudgeKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendNudge();
      }
    },
    [handleSendNudge]
  );

  return (
    <div className="pcp-watch-view" role="region" aria-label="Watch session">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="pcp-watch-view__header">
        <div className="pcp-watch-view__live-indicator">
          <span className="pcp-watch-view__live-dot" aria-hidden="true" />
          <span>Watching {learnerName} &middot; live</span>
        </div>
        <button
          className="pcp-watch-view__stop-btn"
          onClick={onStop}
          aria-label="Stop watching"
        >
          Stop
        </button>
      </div>

      {/* ── Connection Bar ──────────────────────────────────────── */}
      <div className="pcp-watch-view__connection" aria-live="polite">
        connection good
      </div>

      {/* ── Chat Stream (read-only) ─────────────────────────────── */}
      <div
        className="pcp-watch-view__stream"
        ref={streamRef}
        role="log"
        aria-label={`${learnerName}'s conversation`}
        aria-live="polite"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`pcp-watch-view__bubble ${
              msg.sender === 'ai'
                ? 'pcp-watch-view__bubble--ai'
                : 'pcp-watch-view__bubble--learner'
            }`}
          >
            <div className="pcp-watch-view__bubble-sender">
              {msg.sender === 'ai' ? 'PC Pal' : learnerName}
            </div>
            {msg.text}
          </div>
        ))}

        {isThinking && (
          <div className="pcp-watch-view__thinking" aria-live="polite">
            PC Pal is thinking...
          </div>
        )}
      </div>

      {/* ── Nudge Bar ───────────────────────────────────────────── */}
      <div className="pcp-watch-view__nudge">
        <div className="pcp-watch-view__nudge-input-row">
          <label htmlFor="pcp-watch-nudge" className="sr-only">
            Send a private message to {learnerName}
          </label>
          <input
            id="pcp-watch-nudge"
            className="pcp-watch-view__nudge-input"
            type="text"
            placeholder={`Send a quiet note to ${learnerName}...`}
            value={nudgeText}
            onChange={(e) => setNudgeText(e.target.value)}
            onKeyDown={handleNudgeKeyDown}
            aria-label={`Send a private message to ${learnerName}`}
          />
          <button
            className="pcp-watch-view__nudge-send"
            onClick={handleSendNudge}
            disabled={!nudgeText.trim()}
            aria-label="Send nudge"
          >
            &uarr;
          </button>
        </div>

        <div className="pcp-watch-view__actions">
          <button
            className="pcp-btn pcp-btn--ghost"
            onClick={onCall}
            aria-label={`Call ${learnerName}`}
          >
            Call her
          </button>
          <button
            className="pcp-btn pcp-btn--ghost"
            onClick={onTakeOver}
            aria-label="Take over briefly"
          >
            Take over briefly
          </button>
        </div>
      </div>
    </div>
  );
}

export default WatchView;
