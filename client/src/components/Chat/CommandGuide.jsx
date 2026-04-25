import React, { useState } from 'react';
import AnimatedHotspot from './AnimatedHotspot';
import './CommandGuide.css';

/**
 * CommandGuide — Interactive guide artifact with copy-paste commands
 * and optional "Run" buttons for user-approved terminal execution.
 *
 * @param {{ guide: { title: string, description?: string, steps: Array<{ text: string, command?: string, note?: string }> }, onRunCommand?: (command: string) => void, commandResults?: Record<string, { output: string, running: boolean, error?: boolean }>, embedded?: boolean }} props
 *
 * When `embedded` is true, the header with collapse/dismiss controls is hidden
 * (used by SidePanel which provides its own chrome).
 */
function CommandGuide({ guide, onRunCommand, commandResults = {}, embedded = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (dismissed || !guide || !guide.steps) return null;

  function handleCopy(command, idx) {
    navigator.clipboard.writeText(command).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }

  const showBody = embedded || !collapsed;

  return (
    <div className="cmd-guide" role="region" aria-label={guide.title || 'Guide'}>
      {!embedded && (
        <div className="cmd-guide__header">
          <div className="cmd-guide__header-left">
            <span className="cmd-guide__icon" aria-hidden="true">&#9776;</span>
            <span className="cmd-guide__title">{guide.title || 'Guide'}</span>
          </div>
          <div className="cmd-guide__controls">
            <button
              className="cmd-guide__toggle"
              onClick={() => setCollapsed(!collapsed)}
              aria-expanded={!collapsed}
            >
              {collapsed ? 'Open' : 'Collapse'}
            </button>
            <button
              className="cmd-guide__dismiss"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss guide"
            >
              X
            </button>
          </div>
        </div>
      )}

      {showBody && (
        <div className="cmd-guide__body">
          {guide.description && (
            <p className="cmd-guide__desc">{guide.description}</p>
          )}

          <ol className="cmd-guide__steps">
            {guide.steps.map((step, i) => {
              const result = step.command ? commandResults[step.command] : null;

              return (
                <li key={i} className="cmd-guide__step">
                  <div className="cmd-guide__step-text">{step.text}</div>

                  {step.image && step.image.url && (
                    <figure className="cmd-guide__step-image">
                      <div className="cmd-guide__image-wrap">
                        <img
                          src={step.image.url}
                          alt={step.image.alt || 'Reference image'}
                          loading="lazy"
                          onError={(e) => {
                            // Graceful fallback: hide the figure if the file is
                            // missing on disk. The step still renders text-only.
                            const fig = e.currentTarget.closest('figure');
                            if (fig) fig.style.display = 'none';
                          }}
                        />
                        {Array.isArray(step.image.hotspots) &&
                          step.image.hotspots.map((h, hi) => (
                            <AnimatedHotspot
                              key={hi}
                              x={h.x}
                              y={h.y}
                              label={h.label}
                            />
                          ))}
                      </div>
                      {step.image.alt && (
                        <figcaption className="cmd-guide__step-image-caption">
                          {step.image.alt}
                        </figcaption>
                      )}
                    </figure>
                  )}

                  {step.command && (
                    <div className="cmd-guide__command-block">
                      <div className="cmd-guide__command-row">
                        <code className="cmd-guide__code">{step.command}</code>
                        <div className="cmd-guide__command-actions">
                          <button
                            className="cmd-guide__copy-btn"
                            onClick={() => handleCopy(step.command, i)}
                            aria-label={`Copy: ${step.command}`}
                          >
                            {copiedIdx === i ? 'Copied!' : 'Copy'}
                          </button>
                          {onRunCommand && (
                            <button
                              className="cmd-guide__run-btn"
                              onClick={() => onRunCommand(step.command)}
                              disabled={result?.running}
                              aria-label={`Run: ${step.command}`}
                            >
                              {result?.running ? 'Running...' : 'Run'}
                            </button>
                          )}
                        </div>
                      </div>

                      {result && !result.running && result.output && (
                        <pre className={`cmd-guide__output ${result.error ? 'cmd-guide__output--error' : ''}`}>
                          {result.output}
                        </pre>
                      )}
                    </div>
                  )}

                  {step.note && (
                    <p className="cmd-guide__note">{step.note}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

export default CommandGuide;
