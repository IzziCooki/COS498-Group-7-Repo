import React, { useState, useRef, useEffect, useCallback } from 'react';
import './GuideStuckSheet.css';

/**
 * GuideStuckSheet -- 50vh slide-up chat sheet for asking help mid-guide.
 * Pre-fills textarea with context, supports sending and streaming AI response.
 *
 * @param {{
 *   guideTitle: string,
 *   stepNumber: number,
 *   stepTitle: string,
 *   onClose: () => void,
 *   onSendMessage?: (text: string) => void,
 * }} props
 */
function GuideStuckSheet({ guideTitle, stepNumber, stepTitle, onClose, onSendMessage }) {
  const prefill = `I'm stuck on Step ${stepNumber} of ${guideTitle}.`;
  const [text, setText] = useState(prefill);
  const [sent, setSent] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const textareaRef = useRef(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      textareaRef.current.setSelectionRange(text.length, text.length);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    if (onSendMessage) {
      onSendMessage(text);
    }
    setSent(true);
    // Simulate AI response for demo; in production the response would stream
    // from the WebSocket into this sheet
    setAiResponse('I can help with that! Let me take a closer look at what might be going wrong. Try checking if the button is visible by scrolling up on your screen. If you still can\'t find it, I can walk you through an alternative way to do this step.');
  }, [text, onSendMessage]);

  const handleOpenInChat = useCallback(() => {
    if (!sent && onSendMessage) {
      onSendMessage(text);
    }
    onClose();
  }, [sent, text, onSendMessage, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="pcp-stuck-sheet__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="pcp-stuck-sheet"
        role="dialog"
        aria-label="Tell PC what's confusing"
      >
        {/* Drag handle */}
        <div className="pcp-stuck-sheet__handle" aria-hidden="true">
          <div className="pcp-stuck-sheet__handle-bar" />
        </div>

        {/* Header */}
        <div className="pcp-stuck-sheet__header">
          <h2 className="pcp-stuck-sheet__title">Tell PC what's confusing</h2>
          <button
            className="pcp-stuck-sheet__close"
            onClick={onClose}
            aria-label="Close help sheet"
          >
            &#10005;
          </button>
        </div>

        {/* Content */}
        <div className="pcp-stuck-sheet__content">
          {!sent ? (
            <>
              <textarea
                ref={textareaRef}
                className="pcp-stuck-sheet__textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Tell PC what's confusing"
                rows={4}
              />
              <div className="pcp-stuck-sheet__actions">
                <button
                  className="pcp-btn pcp-btn--primary pcp-stuck-sheet__send"
                  onClick={handleSend}
                >
                  &#8593; Send
                </button>
                <button
                  className="pcp-btn pcp-btn--ghost pcp-stuck-sheet__open-chat"
                  onClick={handleOpenInChat}
                >
                  Open in chat
                </button>
              </div>
            </>
          ) : (
            <>
              {/* AI response area */}
              <div className="pcp-stuck-sheet__sent-msg">
                <span className="pcp-stuck-sheet__sent-label">You asked:</span>
                <p className="pcp-stuck-sheet__sent-text">{text}</p>
              </div>
              {aiResponse ? (
                <div className="pcp-stuck-sheet__response">
                  <span className="pcp-stuck-sheet__response-label">PC says:</span>
                  <p className="pcp-stuck-sheet__response-text">{aiResponse}</p>
                </div>
              ) : (
                <div className="pcp-stuck-sheet__loading" role="status">
                  Thinking...
                </div>
              )}
              <div className="pcp-stuck-sheet__actions">
                <button
                  className="pcp-btn pcp-btn--primary pcp-stuck-sheet__continue"
                  onClick={onClose}
                >
                  Continue with guide
                </button>
                <button
                  className="pcp-btn pcp-btn--ghost pcp-stuck-sheet__open-chat"
                  onClick={handleOpenInChat}
                >
                  Open in chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default GuideStuckSheet;
