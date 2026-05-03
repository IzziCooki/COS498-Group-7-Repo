import React from 'react';
import './SafetyBanner.css';

/**
 * SafetyBanner -- Critical safety alert.
 * Sticky below top bar, cannot be dismissed by tap outside.
 * Requires explicit action or dismiss button tap.
 *
 * @param {{ alert: string, onAction: () => void, onDismiss: () => void }} props
 */
function SafetyBanner({ alert, onAction, onDismiss }) {
  if (!alert) return null;

  // Parse the alert text -- first sentence is the heading, rest is body
  const sentences = alert.split(/(?<=\.)\s+/);
  const heading = sentences[0] || alert;
  const body = sentences.slice(1).join(' ');

  return (
    <div className="pcp-safety" role="alert" aria-live="assertive">
      <div className="pcp-safety__heading">
        <span aria-hidden="true">&#x1F6A8;</span>
        {heading}
      </div>
      {body && <div className="pcp-safety__body">{body}</div>}
      <div className="pcp-safety__actions">
        <button
          type="button"
          className="pcp-safety__action-btn"
          onClick={onAction}
          aria-label="Tell me what to do about this safety concern"
        >
          Tell me what to do
        </button>
        <button
          type="button"
          className="pcp-safety__dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss safety alert"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}

export default SafetyBanner;
