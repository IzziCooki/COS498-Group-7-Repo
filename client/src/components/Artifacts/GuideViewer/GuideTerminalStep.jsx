import React, { useState, useCallback } from 'react';
import './GuideTerminalStep.css';

/**
 * GuideTerminalStep -- Terminal command step variant (D3 S3).
 * Shows a dark code block with Copy and Run buttons, explainer text,
 * and optional destructive-command warning.
 *
 * @param {{
 *   step: {
 *     title?: string,
 *     body: string,
 *     command: { text: string, destructive: boolean, explainer: string },
 *     note?: { kind: 'tip'|'warning', text: string },
 *   },
 *   onStuck: () => void,
 * }} props
 */
function GuideTerminalStep({ step, onStuck }) {
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const command = step.command;

  const handleCopy = useCallback(() => {
    if (!command?.text) return;
    navigator.clipboard.writeText(command.text).then(() => {
      setCopied(true);
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        setCopied(false);
      }, 4000);
    }).catch(() => {
      // Fallback: select the code text
    });
  }, [command]);

  const handleRun = useCallback(() => {
    // Run is disabled when no computer is connected -- this is a UI placeholder.
    // In a full implementation, this would trigger a confirmation modal and
    // then send the command via WebSocket.
  }, []);

  // Computer connected state -- for now always false (disabled)
  const computerConnected = false;

  return (
    <div className="pcp-terminal-step">
      {/* Copy success toast */}
      {toastVisible && (
        <div
          className="pcp-terminal-step__toast"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">&#10003;</span> Copied! Now paste it into the Terminal on your computer.
        </div>
      )}

      {/* Step text */}
      <div className="pcp-terminal-step__text">
        {step.title && (
          <h2 className="pcp-terminal-step__heading">{step.title}</h2>
        )}
        {step.body && (
          <p className="pcp-terminal-step__body">{step.body}</p>
        )}
      </div>

      {/* Code block */}
      <div className="pcp-terminal-step__code-block">
        <pre className="pcp-terminal-step__code">
          <code aria-label="Terminal command">{command.text}</code>
        </pre>
      </div>

      {/* Action row: Copy + Run */}
      <div className="pcp-terminal-step__actions">
        <button
          className="pcp-btn pcp-btn--ghost pcp-terminal-step__copy-btn"
          onClick={handleCopy}
          aria-label="Copy command to clipboard"
        >
          &#128203; {copied ? 'Copied!' : 'Copy it'}
        </button>
        <button
          className="pcp-btn pcp-btn--primary pcp-terminal-step__run-btn"
          onClick={handleRun}
          disabled={!computerConnected}
          aria-label="Run this command on your computer"
          aria-disabled={!computerConnected}
          aria-describedby={!computerConnected ? 'run-tooltip' : undefined}
        >
          &#9654; Run it for me
        </button>
      </div>

      {/* Disabled tooltip for Run button */}
      {!computerConnected && (
        <p id="run-tooltip" className="pcp-terminal-step__tooltip">
          Connect your computer first to run this for you.
        </p>
      )}

      {/* Explainer */}
      {command.explainer && (
        <div className="pcp-terminal-step__explainer">
          <h3 className="pcp-terminal-step__explainer-title">What this does</h3>
          <p className="pcp-terminal-step__explainer-text">{command.explainer}</p>
        </div>
      )}

      {/* Destructive warning */}
      {command.destructive && (
        <div className="pcp-terminal-step__warning" role="note">
          <span className="pcp-terminal-step__warning-icon" aria-hidden="true">&#9888;&#65039;</span>
          <span className="pcp-terminal-step__warning-text">
            This cannot be undone. The files will be gone for good.
          </span>
        </div>
      )}

      {/* Note callout */}
      {step.note && step.note.text && (
        <div
          className={`pcp-guide-step__note pcp-guide-step__note--${step.note.kind || 'tip'}`}
          role="note"
        >
          <span className="pcp-guide-step__note-icon" aria-hidden="true">
            {step.note.kind === 'warning' ? '\u26A0\uFE0F' : '\uD83D\uDCA1'}
          </span>
          <span className="pcp-guide-step__note-text">{step.note.text}</span>
        </div>
      )}

      {/* Stuck button */}
      <button
        className="pcp-btn pcp-btn--ghost pcp-terminal-step__stuck"
        onClick={onStuck}
        aria-label="Get help with this step"
      >
        &#10067; Stuck? Ask PC for help
      </button>
    </div>
  );
}

export default GuideTerminalStep;
