import React from 'react';

/**
 * PracticeStep -- Single practice step with instruction details.
 *
 * @param {{
 *   step: {
 *     instruction: string,
 *     whereToLook: string,
 *     whatItLooksLike: string,
 *     deviceInstructions: string,
 *     afterThis: string,
 *     confusedAlt: string|null,
 *   },
 *   stepNumber: number,
 *   showAlt: boolean,
 * }} props
 */
function PracticeStep({ step, stepNumber, showAlt }) {
  return (
    <div className="pcp-practice-step">
      {/* Step number + instruction */}
      <div className="pcp-practice-step__header">
        <span className="pcp-practice-step__number" aria-hidden="true">{stepNumber}</span>
        <h2 className="pcp-practice-step__instruction">{step.instruction}</h2>
      </div>

      {/* Details */}
      <div className="pcp-practice-step__details">
        <div className="pcp-practice-step__detail">
          <strong className="pcp-practice-step__label">Where to look:</strong>
          <span>{step.whereToLook}</span>
        </div>
        <div className="pcp-practice-step__detail">
          <strong className="pcp-practice-step__label">What it looks like:</strong>
          <span>{step.whatItLooksLike}</span>
        </div>
        {step.deviceInstructions && (
          <div className="pcp-practice-step__detail">
            <strong className="pcp-practice-step__label">On your device:</strong>
            <span>{step.deviceInstructions}</span>
          </div>
        )}
        <div className="pcp-practice-step__detail">
          <strong className="pcp-practice-step__label">After this step:</strong>
          <span>{step.afterThis}</span>
        </div>
      </div>

      {/* Alternative explanation */}
      {showAlt && step.confusedAlt && (
        <div className="pcp-practice-step__alt" role="note">
          <strong className="pcp-practice-step__label">Another way to think about it:</strong>
          <p className="pcp-practice-step__alt-text">{step.confusedAlt}</p>
        </div>
      )}
    </div>
  );
}

export default PracticeStep;
