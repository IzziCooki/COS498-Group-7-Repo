import React from 'react';
import './StepSequencePanel.css';

/**
 * StepSequencePanel — fixed panel shown when the AI is guiding the user
 * through a multi-step task sequence.
 *
 * @param {object|null} activeSequence  - { id, taskName, steps, currentIndex, completed }
 * @param {function}    onSendMessage   - callback to send a chat message
 */
function StepSequencePanel({ activeSequence, onSendMessage }) {
  if (!activeSequence) return null;

  const { taskName, steps, currentIndex } = activeSequence;

  const totalSteps = steps?.length ?? 0;
  const safeIndex = Math.max(0, Math.min(currentIndex ?? 0, totalSteps - 1));
  const currentStep = steps?.[safeIndex] ?? '';
  const isLastStep = safeIndex >= totalSteps - 1;
  const stepNumber = safeIndex + 1;

  const handleNext = () => {
    if (isLastStep) {
      onSendMessage("I'm finished!");
    } else {
      onSendMessage('Done, next step!');
    }
  };

  const handleHelp = () => {
    onSendMessage('I need help with this step');
  };

  return (
    <div className="step-panel" role="complementary" aria-label="Step-by-step guide panel">
      {/* Header */}
      <div className="step-panel__header">
        <span className="step-panel__task-name">{taskName}</span>
        <span className="step-panel__step-count" aria-live="polite">
          Step {stepNumber} of {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="step-panel__progress"
        role="progressbar"
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Progress: step ${stepNumber} of ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`step-panel__progress-segment ${i <= safeIndex ? 'step-panel__progress-segment--filled' : ''}`}
          />
        ))}
      </div>

      {/* Current step */}
      <div className="step-panel__current-step" aria-live="polite">
        <p className="step-panel__step-text">{currentStep}</p>
      </div>

      {/* Action buttons */}
      <div className="step-panel__actions">
        <button
          className="step-panel__btn step-panel__btn--primary btn-primary"
          onClick={handleNext}
          aria-label={isLastStep ? "Mark task as finished" : "Mark this step done and go to next step"}
        >
          {isLastStep ? "I'm finished!" : 'Done — next step!'}
        </button>

        <button
          className="step-panel__btn step-panel__btn--secondary btn-secondary"
          onClick={handleHelp}
          aria-label="Ask for help with this step"
        >
          I need help with this step
        </button>
      </div>
    </div>
  );
}

export default StepSequencePanel;
