import React, { useState } from 'react';
import './PracticeMode.css';
import practiceRegistry from './practiceRegistry';

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
      steps: practice.customSteps.map(s => ({
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
    steps: content.steps.map(s => ({
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
 * PracticeMode — guided simulation for learning tasks safely.
 * Supports both built-in tasks (from practiceRegistry) and custom
 * AI-generated practice steps.
 */
function PracticeMode({ practice, osType, onComplete, onSendMessage }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAlt, setShowAlt] = useState({});
  const [completed, setCompleted] = useState(false);
  const [clickedWrong, setClickedWrong] = useState(false);

  if (!practice) return null;

  const data = getSteps(practice, osType);
  if (!data) return null;

  const { title, steps } = data;
  const step = steps[currentStep];

  const handleNext = () => {
    setClickedWrong(false);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowAlt({});
    } else {
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowAlt({});
      setClickedWrong(false);
    }
  };

  const handleExplainDifferently = () => {
    setShowAlt({ ...showAlt, [currentStep]: true });
    if (onSendMessage) {
      onSendMessage(`I'm confused about step ${currentStep + 1} — "${step.instruction}". Can you explain differently?`);
    }
  };

  const handleTryForReal = () => {
    if (onComplete) onComplete(practice.taskId, 'real');
    if (onSendMessage) {
      onSendMessage(`I finished practicing ${title}. I'm ready to try it for real now!`);
    }
  };

  const handlePracticeAgain = () => {
    setCurrentStep(0);
    setCompleted(false);
    setShowAlt({});
    setClickedWrong(false);
  };

  if (completed) {
    return (
      <div className="practice">
        <div className="practice__complete">
          <div className="practice__complete-header">Practice Complete!</div>
          <p className="practice__complete-text">
            You practiced all {steps.length} steps for <strong>{title}</strong>.
          </p>
          <div className="practice__checklist">
            {steps.map((s, i) => (
              <div key={i} className="practice__checklist-item">
                <span className="practice__check">&#10003;</span>
                <span>{s.instruction}</span>
              </div>
            ))}
          </div>
          <div className="practice__complete-actions">
            <button className="practice__real-btn" onClick={handleTryForReal}>
              Do it for real now!
            </button>
            <button className="practice__again-btn" onClick={handlePracticeAgain}>
              Practice again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="practice">
      <div className="practice__banner">
        PRACTICE MODE — Nothing will happen to your computer!
      </div>

      <div className="practice__progress">
        <div className="practice__progress-top">
          <span className="practice__progress-title">{title}</span>
          <span className="practice__progress-label">Step {currentStep + 1} of {steps.length}</span>
        </div>
        <div className="practice__progress-bar">
          <div
            className="practice__progress-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="practice__step">
        <div className="practice__step-number">{currentStep + 1}</div>
        <h3 className="practice__step-title">{step.instruction}</h3>
      </div>

      <div className="practice__details">
        <div className="practice__where">
          <strong>Where to look:</strong> {step.whereToLook}
        </div>
        <div className="practice__what">
          <strong>What it looks like:</strong> {step.whatItLooksLike}
        </div>
        <div className="practice__device">
          <strong>On your device:</strong> {step.deviceInstructions}
        </div>
        <div className="practice__after">
          <strong>After this step:</strong> {step.afterThis}
        </div>
      </div>

      {showAlt[currentStep] && step.confusedAlt && (
        <div className="practice__alt">
          <strong>Another way to think about it:</strong> {step.confusedAlt}
        </div>
      )}

      {clickedWrong && (
        <div className="practice__wrong">
          Not quite — read the description above and try to picture where it is on your screen.
        </div>
      )}

      <div className="practice__actions">
        <button className="practice__understand-btn" onClick={handleNext}>
          {currentStep < steps.length - 1 ? 'I understand — next step' : 'I understand — finish!'}
        </button>
        <button className="practice__confused-btn" onClick={handleExplainDifferently}>
          Explain differently
        </button>
        {currentStep > 0 && (
          <button className="practice__back-btn" onClick={handleBack}>
            Go back a step
          </button>
        )}
      </div>
    </div>
  );
}

export default PracticeMode;
