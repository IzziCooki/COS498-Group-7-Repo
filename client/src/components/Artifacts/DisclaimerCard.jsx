import React from 'react';
import './DisclaimerCard.css';

/**
 * DisclaimerCard
 *
 * Inline warning rendered next to a step sequence whose steps will mutate
 * the user's machine (registry edits, service toggles, package installs,
 * etc.). The detection happens server-side in
 * server/core/systemModifyingDetector.js — this component just renders
 * when the parent message has `systemModifying: true`.
 *
 * The visual language matches MessageBubble.css's confidence-badge so
 * the user has already learned to read amber boxes as "slow down."
 *
 * @param {{ matches?: string[] | null, compact?: boolean }} props
 */
function DisclaimerCard({ matches = null, compact = false }) {
  return (
    <div
      className={`pcp-disclaimer-card ${compact ? 'pcp-disclaimer-card--compact' : ''}`}
      role="note"
      aria-label="Caution: these steps change settings on your computer"
    >
      <div className="pcp-disclaimer-card__icon" aria-hidden="true">
        {'⚠️'}
      </div>
      <div className="pcp-disclaimer-card__body">
        <div className="pcp-disclaimer-card__title">
          Heads up — these steps change your computer
        </div>
        <p className="pcp-disclaimer-card__text">
          These steps change settings on your computer. If anything looks
          different from what's on your screen, stop and ask your buddy —
          don't guess.
        </p>
        {Array.isArray(matches) && matches.length > 0 && (
          <details className="pcp-disclaimer-card__why">
            <summary>Why we're showing this</summary>
            <span>
              {/* matches are short snake_case rule names from the detector;
                  rendered as a soft hint, not jargon to learn. */}
              Detected: {matches.join(', ')}
            </span>
          </details>
        )}
      </div>
    </div>
  );
}

export default DisclaimerCard;
