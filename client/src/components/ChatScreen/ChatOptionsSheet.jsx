import React, { useState, useEffect, useRef } from 'react';
import './ChatOptionsSheet.css';

/**
 * ChatOptionsSheet -- Bottom sheet with chat options (D2 S4).
 * 75% viewport height, swipe-down or tap-x to dismiss.
 *
 * Items: End chat & rate, Read aloud toggle, Make text bigger,
 *        How to use, All settings, About, Sign out
 *
 * @param {{ isOpen: boolean, onClose: () => void, onEndChat: () => void, hasMessages: boolean }} props
 */
function ChatOptionsSheet({ isOpen, onClose, onEndChat, hasMessages, onConnectComputer, onScreenShare, agentConnected, navigate, onLogout }) {
  const [readAloud, setReadAloud] = useState(false);
  const sheetRef = useRef(null);

  // Focus trap: focus the close button when opened
  const closeRef = useRef(null);
  useEffect(() => {
    if (isOpen && closeRef.current) {
      closeRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEndChat = () => {
    onEndChat();
    onClose();
  };

  const handleReadAloud = () => {
    setReadAloud((prev) => !prev);
    // TTS toggle would be wired here
  };

  const handleTextBigger = () => {
    const root = document.documentElement;
    const current = root.getAttribute('data-text-size');
    if (!current) root.setAttribute('data-text-size', 'larger');
    else if (current === 'larger') root.setAttribute('data-text-size', 'largest');
    else root.removeAttribute('data-text-size');
  };

  const handleMenuItem = (label) => {
    onClose();
    if (label === 'settings' && navigate) navigate('/me');
    else if (label === 'sign-out' && onLogout) onLogout();
    else if (label === 'how-to-use' && navigate) navigate('/me');
    else if (label === 'about' && navigate) navigate('/me');
  };

  return (
    <>
      <div
        className="pcp-options-sheet__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="pcp-options-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Chat options"
        ref={sheetRef}
      >
        <div className="pcp-options-sheet__handle" aria-hidden="true" />
        <div className="pcp-options-sheet__header">
          <h2 className="pcp-options-sheet__title">Chat options</h2>
          <button
            type="button"
            className="pcp-options-sheet__close"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close chat options"
          >
            &#10005;
          </button>
        </div>

        <div className="pcp-options-sheet__section-label">Tips for using PC Pal</div>

        <div className="pcp-options-sheet__tips">
          <div className="pcp-options-sheet__tip">
            <span className="pcp-options-sheet__tip-icon" aria-hidden="true">&#x1F517;</span>
            <span className="pcp-options-sheet__tip-text">
              Tap <strong>Get External Resources</strong> below the chat to find videos, articles, and official guides about any topic.
            </span>
          </div>
          <div className="pcp-options-sheet__tip">
            <span className="pcp-options-sheet__tip-icon" aria-hidden="true">&#x1F4D6;</span>
            <span className="pcp-options-sheet__tip-text">
              When PC Pal creates a <strong>guide</strong>, tap the card in chat to open it with step-by-step pictures.
            </span>
          </div>
          <div className="pcp-options-sheet__tip">
            <span className="pcp-options-sheet__tip-icon" aria-hidden="true">&#x1F3AF;</span>
            <span className="pcp-options-sheet__tip-text">
              Try <strong>Practice Mode</strong> to safely rehearse tasks like sending email before doing it for real.
            </span>
          </div>
          <div className="pcp-options-sheet__tip">
            <span className="pcp-options-sheet__tip-icon" aria-hidden="true">&#x1F3A4;</span>
            <span className="pcp-options-sheet__tip-text">
              Tap the <strong>microphone</strong> to speak your question instead of typing it.
            </span>
          </div>
          <div className="pcp-options-sheet__tip">
            <span className="pcp-options-sheet__tip-icon" aria-hidden="true">&#x1F50A;</span>
            <span className="pcp-options-sheet__tip-text">
              Tap the <strong>speaker</strong> on any answer to have it read aloud to you.
            </span>
          </div>
          <div className="pcp-options-sheet__tip">
            <span className="pcp-options-sheet__tip-icon" aria-hidden="true">&#x1F44D;</span>
            <span className="pcp-options-sheet__tip-text">
              Use <strong>thumbs up or down</strong> on answers to help PC Pal learn what works for you.
            </span>
          </div>
        </div>

        <div className="pcp-options-sheet__section-label">Chat</div>

        <div className="pcp-options-sheet__items">
          <button
            type="button"
            className="pcp-options-sheet__item"
            onClick={handleEndChat}
            disabled={!hasMessages}
            aria-label="End chat and rate it"
          >
            <span className="pcp-options-sheet__item-icon" aria-hidden="true">&#x1F6D1;</span>
            <span className="pcp-options-sheet__item-label">End chat & rate it</span>
          </button>

          <button
            type="button"
            className="pcp-options-sheet__item"
            onClick={handleReadAloud}
            aria-label={`Read messages aloud, currently ${readAloud ? 'on' : 'off'}`}
          >
            <span className="pcp-options-sheet__item-icon" aria-hidden="true">&#x1F50A;</span>
            <span className="pcp-options-sheet__item-label">Read messages aloud</span>
            <div
              className={`pcp-options-sheet__toggle ${readAloud ? 'pcp-options-sheet__toggle--on' : ''}`}
              role="switch"
              aria-checked={readAloud}
            >
              <div className="pcp-options-sheet__toggle-knob" />
            </div>
          </button>

          <button
            type="button"
            className="pcp-options-sheet__item"
            onClick={handleTextBigger}
            aria-label="Make text bigger"
          >
            <span className="pcp-options-sheet__item-icon" aria-hidden="true">&#x1F524;</span>
            <span className="pcp-options-sheet__item-label">Make text bigger</span>
            <span className="pcp-options-sheet__item-trailing" aria-hidden="true">&#x25B8;</span>
          </button>
        </div>

        <div className="pcp-options-sheet__section-label">Tools</div>

        <div className="pcp-options-sheet__items">
          <button
            type="button"
            className="pcp-options-sheet__item"
            onClick={onConnectComputer}
            aria-label={agentConnected ? 'Computer connected' : 'Connect your computer'}
          >
            <span className="pcp-options-sheet__item-icon" aria-hidden="true">&#x1F5A5;</span>
            <span className="pcp-options-sheet__item-label">
              {agentConnected ? 'Computer connected' : 'Connect your computer'}
            </span>
            {agentConnected && (
              <span className="pcp-options-sheet__item-trailing" aria-hidden="true" style={{ color: 'var(--color-success, green)' }}>&#x2713;</span>
            )}
            {!agentConnected && (
              <span className="pcp-options-sheet__item-trailing" aria-hidden="true">&#x25B8;</span>
            )}
          </button>

          <button
            type="button"
            className="pcp-options-sheet__item"
            onClick={onScreenShare}
            aria-label="Share your screen"
          >
            <span className="pcp-options-sheet__item-icon" aria-hidden="true">&#x1F4F1;</span>
            <span className="pcp-options-sheet__item-label">Share your screen</span>
            <span className="pcp-options-sheet__item-trailing" aria-hidden="true">&#x25B8;</span>
          </button>
        </div>

        <div className="pcp-options-sheet__section-label">Other</div>

        <div className="pcp-options-sheet__items">
          <button
            type="button"
            className="pcp-options-sheet__item"
            onClick={() => handleMenuItem('how-to-use')}
            aria-label="How to use PC Pal"
          >
            <span className="pcp-options-sheet__item-icon" aria-hidden="true">&#x2753;</span>
            <span className="pcp-options-sheet__item-label">How to use PC Pal</span>
            <span className="pcp-options-sheet__item-trailing" aria-hidden="true">&#x25B8;</span>
          </button>

          <button
            type="button"
            className="pcp-options-sheet__item"
            onClick={() => handleMenuItem('settings')}
            aria-label="All settings"
          >
            <span className="pcp-options-sheet__item-icon" aria-hidden="true">&#x2699;</span>
            <span className="pcp-options-sheet__item-label">All settings</span>
            <span className="pcp-options-sheet__item-trailing" aria-hidden="true">&#x25B8;</span>
          </button>

          <button
            type="button"
            className="pcp-options-sheet__item"
            onClick={() => handleMenuItem('about')}
            aria-label="About PC Pal"
          >
            <span className="pcp-options-sheet__item-icon" aria-hidden="true">&#x1F4CB;</span>
            <span className="pcp-options-sheet__item-label">About PC Pal</span>
            <span className="pcp-options-sheet__item-trailing" aria-hidden="true">&#x25B8;</span>
          </button>

          <button
            type="button"
            className="pcp-options-sheet__item"
            onClick={() => handleMenuItem('sign-out')}
            aria-label="Sign out"
          >
            <span className="pcp-options-sheet__item-icon" aria-hidden="true">&#x1F44B;</span>
            <span className="pcp-options-sheet__item-label pcp-options-sheet__item-label--secondary">Sign out</span>
            <span className="pcp-options-sheet__item-trailing" aria-hidden="true">&#x25B8;</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default ChatOptionsSheet;
