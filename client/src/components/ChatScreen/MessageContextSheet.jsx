import React, { useEffect, useRef } from 'react';
import './MessageContextSheet.css';

/**
 * MessageContextSheet -- Long-press context menu for messages (D2 S5).
 * Items: Copy, Read aloud, Send to helper, Explain differently.
 *
 * @param {{ message: object|null, onClose: () => void, hasBuddy: boolean, onSendMessage: (text:string) => void }} props
 */
function MessageContextSheet({ message, onClose, hasBuddy, onSendMessage }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (message && closeRef.current) closeRef.current.focus();
  }, [message]);

  // Close on Escape
  useEffect(() => {
    if (!message) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [message, onClose]);

  if (!message) return null;

  const previewText = message.text || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
    } catch {
      // Fallback: noop for now
      console.log('Copy failed');
    }
    onClose();
  };

  const handleReadAloud = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(previewText);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    onClose();
  };

  const handleSendToHelper = () => {
    // Phase 5+: wire to buddy system
    console.log('Send to helper:', previewText);
    onClose();
  };

  const handleExplainDifferently = () => {
    if (onSendMessage) {
      onSendMessage('Can you explain that differently?');
    }
    onClose();
  };

  return (
    <>
      <div
        className="pcp-context-sheet__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="pcp-context-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Message options"
      >
        <div className="pcp-context-sheet__handle" aria-hidden="true" />
        <div className="pcp-context-sheet__preview">
          &ldquo;{previewText.slice(0, 200)}{previewText.length > 200 ? '...' : ''}&rdquo;
        </div>

        <div className="pcp-context-sheet__items">
          <button
            type="button"
            className="pcp-context-sheet__item"
            onClick={handleCopy}
            aria-label="Copy message text"
          >
            <span className="pcp-context-sheet__item-icon" aria-hidden="true">&#x1F4CB;</span>
            <span className="pcp-context-sheet__item-label">Copy</span>
          </button>

          <button
            type="button"
            className="pcp-context-sheet__item"
            onClick={handleReadAloud}
            aria-label="Read this message aloud"
          >
            <span className="pcp-context-sheet__item-icon" aria-hidden="true">&#x1F50A;</span>
            <span className="pcp-context-sheet__item-label">Read it aloud</span>
          </button>

          {hasBuddy && (
            <button
              type="button"
              className="pcp-context-sheet__item"
              onClick={handleSendToHelper}
              aria-label="Send this message to your helper"
            >
              <span className="pcp-context-sheet__item-icon" aria-hidden="true">&#x1F465;</span>
              <span className="pcp-context-sheet__item-label">Send to helper</span>
            </button>
          )}

          <button
            type="button"
            className="pcp-context-sheet__item"
            onClick={handleExplainDifferently}
            aria-label="Ask PC Pal to explain this differently"
          >
            <span className="pcp-context-sheet__item-icon" aria-hidden="true">&#x2753;</span>
            <span className="pcp-context-sheet__item-label">Explain this differently</span>
          </button>
        </div>

        <button
          type="button"
          className="pcp-context-sheet__cancel"
          onClick={onClose}
          ref={closeRef}
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

export default MessageContextSheet;
