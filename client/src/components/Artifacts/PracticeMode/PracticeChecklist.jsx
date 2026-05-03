import React from 'react';

/**
 * PracticeChecklist -- Completion screen shown after finishing all practice steps.
 * Shows a checklist of completed steps and options to try for real or practice again.
 *
 * @param {{
 *   title: string,
 *   steps: Array<{ instruction: string }>,
 *   onTryForReal: () => void,
 *   onPracticeAgain: () => void,
 *   onClose: () => void,
 * }} props
 */
function PracticeChecklist({ title, steps, onTryForReal, onPracticeAgain, onClose }) {
  return (
    <div className="pcp-practice-checklist">
      {/* Celebration */}
      <div className="pcp-practice-checklist__celebration" aria-hidden="true">
        <div className="pcp-practice-checklist__emoji">&#127881;</div>
      </div>

      <h2 className="pcp-practice-checklist__heading">Practice Complete!</h2>
      <p className="pcp-practice-checklist__body">
        You practiced all {steps.length} steps for <strong>{title}</strong>.
      </p>

      {/* Checklist */}
      <div className="pcp-practice-checklist__list">
        {steps.map((step, i) => (
          <div key={i} className="pcp-practice-checklist__item">
            <span className="pcp-practice-checklist__check" aria-hidden="true">&#10003;</span>
            <span className="pcp-practice-checklist__item-text">{step.instruction}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="pcp-practice-checklist__actions">
        <button
          className="pcp-btn pcp-btn--primary pcp-practice-checklist__real-btn"
          onClick={onTryForReal}
        >
          Do it for real now
        </button>
        <button
          className="pcp-btn pcp-btn--ghost pcp-practice-checklist__again-btn"
          onClick={onPracticeAgain}
        >
          Practice again
        </button>
        <button
          className="pcp-btn pcp-btn--ghost pcp-practice-checklist__done-btn"
          onClick={onClose}
        >
          Done &middot; Back to chat
        </button>
      </div>
    </div>
  );
}

export default PracticeChecklist;
