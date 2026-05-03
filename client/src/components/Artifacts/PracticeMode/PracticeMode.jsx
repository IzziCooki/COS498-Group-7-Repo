import React, { useState, useCallback } from 'react';
import PracticeStep from './PracticeStep';
import PracticeChecklist from './PracticeChecklist';
import practiceRegistry from '../../Chat/practiceRegistry';
import './PracticeMode.css';

/**
 * Normalize steps from either built-in registry or custom AI-generated format
 * into a common shape for rendering.
 */
function getSteps(practice, osType) {
  const os = osType || 'Windows';

  // Custom AI-generated practice
  if (practice.taskId === 'custom' && practice.customSteps) {
    return {
      title: practice.customTitle || 'Practice Session',
      steps: practice.customSteps.map((s) => ({
        instruction: s.instruction,
        whereToLook: s.whereToLook,
        whatItLooksLike: s.whatItLooksLike,
        deviceInstructions: s.deviceInstructions,
        afterThis: s.afterThis,
        confusedAlt: s.confusedAlt || null,
      })),
    };
  }

  // Built-in registry
  const content = practiceRegistry[practice.taskId];
  if (!content) return null;

  return {
    title: content.title,
    steps: content.steps.map((s) => ({
      instruction: s.instruction,
      whereToLook: s.whereToLook,
      whatItLooksLike: s.whatItLooksLike,
      deviceInstructions: s.variants?.[os] || s.variants?.Windows || '',
      afterThis: s.afterThis,
      confusedAlt: s.confusedAlt || null,
    })),
  };
}

/**
 * PracticeMode -- Full-screen takeover for guided simulation.
 * Shows progress segments, current step with instruction, navigation buttons,
 * and completion checklist.
 *
 * @param {{
 *   practice: { taskId: string, customTitle?: string, customSteps?: Array },
 *   onClose: () => void,
 *   onSendMessage?: (text: string) => void,
 *   titleId: string,
 * }} props
 */
function PracticeMode({ practice, onClose, onSendMessage, titleId }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showAlt, setShowAlt] = useState({});

  if (!practice) return null;

  const data = getSteps(practice);
  if (!data) {
    return (
      <div className="pcp-practice">
        <div className="pcp-overlay-topbar">
          <button className="pcp-overlay-topbar__back" onClick={onClose}>
            <span aria-hidden="true">&lsaquo;</span> Back to chat
          </button>
        </div>
        <div className="pcp-practice__error">
          <p>This practice session is not available.</p>
          <button className="pcp-btn pcp-btn--primary" onClick={onClose}>
            Back to chat
          </button>
        </div>
      </div>
    );
  }

  const { title, steps } = data;
  const step = steps[currentStep];
  const totalSteps = steps.length;

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
      setShowAlt({});
    } else {
      setCompleted(true);
    }
  }, [currentStep, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setShowAlt({});
    }
  }, [currentStep]);

  const handleExplainDifferently = useCallback(() => {
    setShowAlt((prev) => ({ ...prev, [currentStep]: true }));
    if (onSendMessage) {
      onSendMessage(`I'm confused about step ${currentStep + 1} -- "${step.instruction}". Can you explain differently?`);
    }
  }, [currentStep, step, onSendMessage]);

  const handleTryForReal = useCallback(() => {
    if (onSendMessage) {
      onSendMessage(`I finished practicing ${title}. I'm ready to try it for real now!`);
    }
    onClose();
  }, [title, onSendMessage, onClose]);

  const handlePracticeAgain = useCallback(() => {
    setCurrentStep(0);
    setCompleted(false);
    setShowAlt({});
  }, []);

  if (completed) {
    return (
      <div className="pcp-practice">
        <div className="pcp-overlay-topbar">
          <button
            className="pcp-overlay-topbar__back"
            onClick={onClose}
            aria-label="Close practice and return to chat"
          >
            <span aria-hidden="true">&lsaquo;</span> Back to chat
          </button>
        </div>
        <div className="pcp-practice__content">
          <PracticeChecklist
            title={title}
            steps={steps}
            onTryForReal={handleTryForReal}
            onPracticeAgain={handlePracticeAgain}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pcp-practice">
      {/* Banner */}
      <div className="pcp-practice__banner" role="status">
        PRACTICE MODE -- Nothing will happen to your computer!
      </div>

      {/* Progress segments */}
      <div className="pcp-practice__progress" aria-label={`Step ${currentStep + 1} of ${totalSteps}`}>
        {steps.map((_, i) => (
          <div
            key={i}
            className={`pcp-practice__segment ${
              i < currentStep
                ? 'pcp-practice__segment--done'
                : i === currentStep
                ? 'pcp-practice__segment--active'
                : ''
            }`}
          />
        ))}
      </div>

      {/* Title */}
      <div className="pcp-practice__header">
        <h1 id={titleId} className="pcp-practice__title">{title}</h1>
        <span className="pcp-practice__step-label">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Step content */}
      <div className="pcp-practice__content">
        <PracticeStep
          step={step}
          stepNumber={currentStep + 1}
          showAlt={!!showAlt[currentStep]}
        />
      </div>

      {/* Navigation */}
      <div className="pcp-practice__nav">
        <button
          className="pcp-btn pcp-btn--primary pcp-practice__nav-next"
          onClick={handleNext}
        >
          {currentStep < totalSteps - 1
            ? 'I understand -- next'
            : 'I understand -- finish!'}
        </button>
        <button
          className="pcp-btn pcp-btn--ghost pcp-practice__nav-explain"
          onClick={handleExplainDifferently}
        >
          Explain differently
        </button>
        {currentStep > 0 && (
          <button
            className="pcp-btn pcp-btn--ghost pcp-practice__nav-back"
            onClick={handleBack}
          >
            Go back
          </button>
        )}
      </div>
    </div>
  );
}

export default PracticeMode;
