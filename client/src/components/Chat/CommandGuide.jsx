import React, { useState, useRef, useEffect } from 'react';
import AnimatedHotspot from './AnimatedHotspot';
import './CommandGuide.css';

// Pagination size for guide steps. Long guides (especially the 8-step
// send-email flow with illustrations) overwhelm elderly users when shown
// as one big scroll; 2 per page lets them focus on a small chunk and
// click Next when ready. Guides with <= STEPS_PER_PAGE render single-page.
const STEPS_PER_PAGE = 2;

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
  const [pageStart, setPageStart] = useState(0);
  const stepsRef = useRef(null);

  // When the user advances to a new page, scroll the guide back to the top
  // of the steps list so they're not still looking at the bottom of the
  // previous page. Only fires after the initial render.
  useEffect(() => {
    if (pageStart > 0 && stepsRef.current) {
      stepsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pageStart]);

  // When the user switches between guides (e.g. Gmail → Yahoo → Outlook),
  // React reuses the same CommandGuide instance and pageStart would carry
  // over from the previous guide — so a brand-new guide could open at
  // page 4 instead of page 1. Reset to the start whenever the guide
  // identity changes (title is the cheapest stable key here).
  useEffect(() => {
    setPageStart(0);
  }, [guide?.title]);

  if (dismissed || !guide || !guide.steps) return null;

  function handleCopy(command, idx) {
    navigator.clipboard.writeText(command).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }

  const showBody = embedded || !collapsed;
  const totalSteps = guide.steps.length;
  const paginated = totalSteps > STEPS_PER_PAGE;
  const pageEnd = Math.min(pageStart + STEPS_PER_PAGE, totalSteps);
  const visibleSteps = paginated
    ? guide.steps.slice(pageStart, pageEnd)
    : guide.steps;

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

          <ol className="cmd-guide__steps" ref={stepsRef}>
            {visibleSteps.map((step, i) => {
              const globalIdx = (paginated ? pageStart : 0) + i;
              const stepNum = globalIdx + 1;
              const result = step.command ? commandResults[step.command] : null;

              return (
                <li
                  key={globalIdx}
                  className="cmd-guide__step"
                  data-step-num={stepNum}
                >
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
                            onClick={() => handleCopy(step.command, globalIdx)}
                            aria-label={`Copy: ${step.command}`}
                          >
                            {copiedIdx === globalIdx ? 'Copied!' : 'Copy'}
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

          {paginated && (
            <div className="cmd-guide__pager" role="navigation" aria-label="Guide steps pagination">
              <button
                type="button"
                className="cmd-guide__pager-btn"
                onClick={() => setPageStart(Math.max(0, pageStart - STEPS_PER_PAGE))}
                disabled={pageStart === 0}
                aria-label="Previous steps"
              >
                ← Previous
              </button>
              <span className="cmd-guide__pager-status" aria-live="polite">
                Steps {pageStart + 1}–{pageEnd} of {totalSteps}
              </span>
              <button
                type="button"
                className="cmd-guide__pager-btn"
                onClick={() => setPageStart(Math.min(totalSteps - STEPS_PER_PAGE, pageStart + STEPS_PER_PAGE))}
                disabled={pageEnd >= totalSteps}
                aria-label="Next steps"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommandGuide;
