import React, { useState, useCallback, useRef, useEffect } from 'react';
import './PairingFlow.css';

/**
 * PairingFlow -- Enter buddy code to pair (D5 section 10).
 *
 * 6-box code input with auto-advance, backspace goes back, paste fills all.
 *
 * Props:
 *   learnerName   - string (if known from the code preview)
 *   onConnect     - (code: string) => Promise<void>
 *   onBack        - () => void
 *   onNoCode      - () => void
 *   isLoading     - boolean
 *   error         - string | null
 */

const CODE_LENGTH = 6;

function PairingFlow({
  learnerName,
  onConnect,
  onBack,
  onNoCode,
  isLoading = false,
  error = null,
}) {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef([]);

  // Ensure refs array is the right size
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, CODE_LENGTH);
  }, []);

  const focusInput = useCallback((index) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  }, []);

  const handleChange = useCallback(
    (index, value) => {
      // Only allow alphanumeric
      const char = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-1);
      const newDigits = [...digits];
      newDigits[index] = char;
      setDigits(newDigits);

      // Auto-advance
      if (char && index < CODE_LENGTH - 1) {
        focusInput(index + 1);
      }
    },
    [digits, focusInput]
  );

  const handleKeyDown = useCallback(
    (index, e) => {
      if (e.key === 'Backspace') {
        if (!digits[index] && index > 0) {
          // Move back on empty backspace
          const newDigits = [...digits];
          newDigits[index - 1] = '';
          setDigits(newDigits);
          focusInput(index - 1);
          e.preventDefault();
        } else {
          // Clear current
          const newDigits = [...digits];
          newDigits[index] = '';
          setDigits(newDigits);
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        focusInput(index - 1);
      } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
        focusInput(index + 1);
      }
    },
    [digits, focusInput]
  );

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData.getData('text') || '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, CODE_LENGTH);

      if (pasted.length > 0) {
        const newDigits = Array(CODE_LENGTH).fill('');
        for (let i = 0; i < pasted.length; i++) {
          newDigits[i] = pasted[i];
        }
        setDigits(newDigits);

        // Focus the next empty or last box
        const nextEmpty = newDigits.findIndex((d) => !d);
        focusInput(nextEmpty >= 0 ? nextEmpty : CODE_LENGTH - 1);
      }
    },
    [focusInput]
  );

  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH && digits.every(Boolean);

  const handleConnect = useCallback(() => {
    if (isComplete && onConnect) {
      onConnect(code);
    }
  }, [isComplete, code, onConnect]);

  const displayName = learnerName || 'your learner';

  return (
    <div className="pcp-pairing-flow" role="region" aria-label="Pair with a learner">
      {/* ── Back Button ─────────────────────────────────────────── */}
      <div className="pcp-pairing-flow__header">
        <button
          className="pcp-pairing-flow__back-btn"
          onClick={onBack}
          aria-label="Go back"
        >
          &larr; Back
        </button>
      </div>

      {/* ── Icon ────────────────────────────────────────────────── */}
      <div className="pcp-pairing-flow__icon" aria-hidden="true">
        P
      </div>

      {/* ── Title & Text ────────────────────────────────────────── */}
      <h1 className="pcp-pairing-flow__title">Become a helper</h1>
      <p className="pcp-pairing-flow__text">
        Enter the code {displayName} shared with you.
      </p>

      {/* ── Code Input ──────────────────────────────────────────── */}
      <div className="pcp-pairing-flow__code-row" role="group" aria-label="Pairing code">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            className={`pcp-pairing-flow__code-box${
              digit ? ' pcp-pairing-flow__code-box--filled' : ''
            }`}
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Code digit ${i + 1}`}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      <div className="pcp-pairing-flow__error" role="alert" aria-live="polite">
        {error || ''}
      </div>

      {/* ── Connect Button ──────────────────────────────────────── */}
      <button
        className="pcp-btn pcp-btn--primary pcp-btn--hero pcp-pairing-flow__connect-btn"
        onClick={handleConnect}
        disabled={!isComplete || isLoading}
        aria-label={`Connect with ${displayName}`}
      >
        {isLoading ? 'Connecting...' : `Connect with ${displayName}`}
      </button>

      {/* ── No Code Link ────────────────────────────────────────── */}
      <button
        className="pcp-pairing-flow__no-code"
        onClick={onNoCode}
        aria-label="I don't have a code yet"
      >
        I don&apos;t have a code yet
      </button>
    </div>
  );
}

export default PairingFlow;
