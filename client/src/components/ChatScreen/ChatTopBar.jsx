import React, { useState, useEffect, useRef } from 'react';
import './ChatTopBar.css';

const TIPS = [
  { icon: '\uD83D\uDD17', text: 'Tap "Get External Resources" for videos and guides' },
  { icon: '\uD83D\uDCD6', text: 'Tap a guide card in chat to see step-by-step pictures' },
  { icon: '\uD83C\uDFAF', text: 'Try Practice Mode to rehearse before doing it for real' },
  { icon: '\uD83C\uDFA4', text: 'Tap the microphone to speak instead of type' },
  { icon: '\uD83D\uDD0A', text: 'Tap the speaker icon to hear any answer read aloud' },
  { icon: '\uD83D\uDC4D', text: 'Use thumbs up/down on answers to help PC Pal learn' },
];

function ChatTopBar({ onOpenOptions, buddyObserving, onEndChatAndRate, hasMessages, tipsVisible, onDismissTips }) {
  const [tipIndex, setTipIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!tipsVisible) return;
    timerRef.current = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, [tipsVisible]);

  const tip = TIPS[tipIndex];

  return (
    <div className="pcp-chat-topbar">
      {buddyObserving && (
        <div className="pcp-chat-topbar__buddy">
          {buddyObserving.buddyName} is helping you
        </div>
      )}

      {/* Spacer pushes everything after it to the right */}
      <span className="pcp-chat-topbar__spacer" />

      {/* Rotating hint — right side of the bar */}
      {tipsVisible && (
        <div className="pcp-chat-topbar__hint" aria-live="polite">
          <span className="pcp-chat-topbar__hint-icon" aria-hidden="true">{tip.icon}</span>
          <span className="pcp-chat-topbar__hint-text">{tip.text}</span>
          <button
            className="pcp-chat-topbar__hint-close"
            onClick={onDismissTips}
            aria-label="Hide tips"
            title="Hide tips"
            type="button"
          >&#10005;</button>
        </div>
      )}

      {hasMessages && onEndChatAndRate && (
        <button
          type="button"
          className="pcp-chat-topbar__end-btn"
          onClick={onEndChatAndRate}
          aria-label="End chat and leave feedback"
        >
          End &amp; Rate
        </button>
      )}
      <button
        type="button"
        className="pcp-chat-topbar__menu-btn"
        onClick={onOpenOptions}
        aria-label="More options"
        aria-haspopup="menu"
      >
        &#x22EF;
      </button>
    </div>
  );
}

export default ChatTopBar;
