import React, { useRef, useEffect, useState, useCallback } from 'react';
import './InputArea.css';

const MAX_INPUT_LENGTH = 4000;
const HAS_SPEECH = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

/**
 * InputArea -- Textarea + send button + Get Help ghost button (D2 S2/S6/S7).
 *
 * Key behaviors:
 * - Textarea auto-grows from 56px to 5-line max
 * - Enter does NOT submit (Margaret types newlines accidentally)
 * - Only the send button submits
 * - Send button: 56x56 circle, primary when has text, disabled when empty
 * - Get Help: full-width ghost button below input
 *
 * @param {{ onSend: (text:string) => void, onGatherResources: (text:string) => void, isTyping: boolean, hasMessages: boolean }} props
 */
function InputArea({ onSend, onGatherResources, isTyping, onPractice, onConnectComputer, onScreenShare, agentConnected }) {
  const textareaRef = useRef(null);
  const [value, setValue] = useState('');
  const [helpLoading, setHelpLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const hasText = value.trim().length > 0;

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  // Re-focus after AI finishes typing
  useEffect(() => {
    if (!isTyping && textareaRef.current) textareaRef.current.focus();
  }, [isTyping]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, el.offsetHeight * 5) + 'px';
  }, []);

  const handleChange = (e) => {
    let val = e.target.value;
    if (val.length > MAX_INPUT_LENGTH) {
      val = val.slice(0, MAX_INPUT_LENGTH);
    }
    setValue(val);
    autoResize();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    const currentLen = value.length;
    const selStart = e.target.selectionStart || 0;
    const selEnd = e.target.selectionEnd || 0;
    const selectedLen = selEnd - selStart;
    const newLen = currentLen - selectedLen + pasted.length;
    if (newLen > MAX_INPUT_LENGTH) {
      e.preventDefault();
      const allowed = MAX_INPUT_LENGTH - (currentLen - selectedLen);
      const truncated = pasted.slice(0, Math.max(0, allowed));
      const before = value.slice(0, selStart);
      const after = value.slice(selEnd);
      setValue(before + truncated + after);
      autoResize();
    }
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isTyping) return;
    onSend(trimmed);
    setValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleGetHelp = () => {
    if (isTyping || helpLoading) return;
    setHelpLoading(true);
    const text = value.trim();
    onGatherResources(text);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    // Reset loading after a brief period (server will handle via isTyping)
    setTimeout(() => setHelpLoading(false), 3000);
  };

  // ── Speech-to-text (STT) ──
  const toggleMic = useCallback(() => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    if (!HAS_SPEECH) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setValue((prev) => prev ? prev + ' ' + transcript : transcript);
      setListening(false);
      if (textareaRef.current) textareaRef.current.focus();
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  // Do NOT submit on Enter — only the send button submits
  // This is a deliberate design choice for elderly users
  const handleKeyDown = (e) => {
    // Prevent default nothing — Enter just creates a newline in textarea
    // No special handling needed; textarea handles Enter natively
    void e;
  };

  /**
   * Fill the textarea with text and auto-submit.
   * Called by EmptyState suggestion chips via parent.
   */
  const fillAndSubmit = useCallback((text) => {
    setValue(text);
    // Use a microtask so React processes the state update first
    queueMicrotask(() => {
      onSend(text);
      setValue('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    });
  }, [onSend]);

  // Expose fillAndSubmit to parent via a prop callback
  useEffect(() => {
    if (InputArea._fillRef) InputArea._fillRef.current = fillAndSubmit;
  }, [fillAndSubmit]);

  const sendBtnClass = hasText && !isTyping
    ? 'pcp-input-area__send pcp-input-area__send--active'
    : 'pcp-input-area__send pcp-input-area__send--disabled';

  const helpBtnClass = helpLoading
    ? 'pcp-input-area__help pcp-input-area__help--loading'
    : 'pcp-input-area__help';

  return (
    <div className="pcp-input-area">
      <div className="pcp-input-area__row">
        <label htmlFor="pcp-chat-input" className="sr-only">
          Type your question
        </label>
        <textarea
          id="pcp-chat-input"
          ref={textareaRef}
          className="pcp-input-area__textarea"
          placeholder="Type your question..."
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={isTyping}
          maxLength={MAX_INPUT_LENGTH}
          rows={1}
          autoComplete="off"
          aria-label="Type your question here"
        />
        {HAS_SPEECH && (
          <button
            type="button"
            className={`pcp-input-area__mic${listening ? ' pcp-input-area__mic--active' : ''}`}
            onClick={toggleMic}
            aria-label={listening ? 'Stop listening' : 'Speak your question'}
            title={listening ? 'Tap to stop' : 'Tap to speak'}
          >
            {listening ? '\uD83D\uDD34' : '\uD83C\uDF99\uFE0F'}
          </button>
        )}
        <button
          type="button"
          className={sendBtnClass}
          onClick={handleSend}
          disabled={!hasText || isTyping}
          aria-label="Send message"
          aria-disabled={!hasText || isTyping}
        >
          <span className="pcp-input-area__send-icon" aria-hidden="true">&#x2191;</span>
        </button>
      </div>
      <div className="pcp-input-area__actions">
        <button
          type="button"
          className="pcp-input-area__action-btn"
          onClick={() => onPractice ? onPractice() : onSend('I want to practice first')}
          disabled={isTyping}
          aria-label="Start a practice session"
        >
          <span aria-hidden="true">&#x1F3AF;</span>
          Practice Mode
        </button>
        <button
          type="button"
          className={helpBtnClass}
          onClick={handleGetHelp}
          disabled={isTyping}
          aria-label="Get external resources from PC Pal"
        >
          <span className="pcp-input-area__help-icon" aria-hidden="true">
            {helpLoading ? '\u21BB' : '\uD83D\uDD17'}
          </span>
          {helpLoading ? 'Searching...' : 'Get External Resources'}
        </button>
        {onConnectComputer && (
          <button
            type="button"
            className="pcp-input-area__action-btn"
            onClick={onConnectComputer}
            aria-label={agentConnected ? 'Computer connected' : 'Connect your computer'}
          >
            <span aria-hidden="true">{agentConnected ? '\u2705' : '\uD83D\uDDA5'}</span>
            {agentConnected ? 'Connected' : 'Connect Computer'}
          </button>
        )}
        {onScreenShare && (
          <button
            type="button"
            className="pcp-input-area__action-btn"
            onClick={onScreenShare}
            aria-label="Share your screen"
          >
            <span aria-hidden="true">&#x1F4F1;</span>
            Share Screen
          </button>
        )}
      </div>
    </div>
  );
}

export default InputArea;
