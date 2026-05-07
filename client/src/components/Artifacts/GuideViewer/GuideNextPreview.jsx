import React from 'react';
import './GuideNextPreview.css';

/**
 * GuideNextPreview -- Peek panel for the next step (D3 S5).
 * Sticky strip between content and nav; tapping expands a mini preview sheet.
 *
 * @param {{
 *   nextStep: { title?: string, body: string, image?: { url: string, altText: string } },
 *   nextStepNumber: number,
 *   isOpen: boolean,
 *   onToggle: () => void,
 *   onSkip: () => void,
 * }} props
 */
function GuideNextPreview({ nextStep, nextStepNumber, isOpen, onToggle, onSkip }) {
  if (!nextStep) return null;

  const label = nextStep.title || nextStep.body || nextStep.text || '';
  const truncatedLabel = label.length > 40 ? label.slice(0, 40) + '...' : label;

  return (
    <>
      {/* Preview strip */}
      <button
        className="pcp-next-preview__strip"
        onClick={onToggle}
        aria-label={`Preview Step ${nextStepNumber}: ${label}`}
        aria-expanded={isOpen}
      >
        <span className="pcp-next-preview__strip-label">
          <span className="pcp-next-preview__strip-next">NEXT</span>
          <span className="pcp-next-preview__strip-title">
            Step {nextStepNumber} &middot; {truncatedLabel}
          </span>
        </span>
        <span className="pcp-next-preview__strip-chevron" aria-hidden="true">
          {isOpen ? '\u25B4' : '\u25BE'}
        </span>
      </button>

      {/* Expanded peek panel */}
      {isOpen && (
        <>
          <div
            className="pcp-next-preview__backdrop"
            onClick={onToggle}
            aria-hidden="true"
          />
          <div className="pcp-next-preview__panel">
            <div className="pcp-next-preview__panel-header">
              <span className="pcp-next-preview__panel-title">
                Coming up &middot; Step {nextStepNumber}
              </span>
              <button
                className="pcp-next-preview__panel-close"
                onClick={onToggle}
                aria-label="Close preview"
              >
                &#10005;
              </button>
            </div>

            <h3 className="pcp-next-preview__panel-step-title">
              {label}
            </h3>

            {nextStep.image && nextStep.image.url && (
              <div className="pcp-next-preview__panel-thumb">
                <img
                  src={nextStep.image.url}
                  alt={nextStep.image.altText || 'Next step preview'}
                  className="pcp-next-preview__panel-img"
                  loading="lazy"
                />
              </div>
            )}

            {(nextStep.body || nextStep.text) && nextStep.title && (
              <p className="pcp-next-preview__panel-body">
                {(() => { const b = nextStep.body || nextStep.text || ''; return b.length > 80 ? b.slice(0, 80) + '...' : b; })()}
              </p>
            )}

            <button
              className="pcp-btn pcp-btn--ghost pcp-next-preview__panel-skip"
              onClick={onSkip}
            >
              Skip to this step
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default GuideNextPreview;
