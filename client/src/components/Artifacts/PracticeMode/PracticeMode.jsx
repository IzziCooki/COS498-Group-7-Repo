import React, { useState } from 'react';
import PracticeStep from './PracticeStep';
import PracticeChecklist from './PracticeChecklist';
import practiceRegistry from '../../Chat/practiceRegistry';
import './PracticeMode.css';

const TASK_PICKER_META = {
  send_email: { icon: '\u270D\uFE0F', label: 'Send an Email' },
  copy_paste: { icon: '\uD83D\uDCCB', label: 'Copy and Paste' },
  open_browser: { icon: '\uD83C\uDF10', label: 'Open the Internet' },
  wifi: { icon: '\uD83D\uDCF6', label: 'Connect to Wi-Fi' },
  video_call: { icon: '\uD83D\uDCDE', label: 'Join a Video Call' },
  take_screenshot: { icon: '\uD83D\uDCF8', label: 'Take a Screenshot' },
  print_document: { icon: '\uD83D\uDDA8\uFE0F', label: 'Print a Document' },
  change_text_size: { icon: '\uD83D\uDD0E', label: 'Make Text Bigger' },
};

/**
 * Normalize steps from either built-in registry or custom AI-generated format
 * into a common shape for rendering.
 */
function getSteps(taskId, practice, osType) {
  const os = osType || 'Windows';

  // Custom AI-generated practice
  if (taskId === 'custom' && practice.customSteps) {
    return {
      title: practice.customTitle || 'Practice Session',
      steps: practice.customSteps.map((s) => ({
        instruction: s.instruction,
        whereToLook: s.whereToLook,
        whatItLooksLike: s.whatItLooksLike,
        deviceInstructions: s.deviceInstructions,
        afterThis: s.afterThis,
        confusedAlt: s.confusedAlt || null,
        image: s.image || null,
      })),
    };
  }

  // Built-in registry
  const content = practiceRegistry[taskId];
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
      image: s.image || null,
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
  const [selectedTaskId, setSelectedTaskId] = useState(
    practice?.taskId === '__picker__' ? null : practice?.taskId || null
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showAlt, setShowAlt] = useState({});

  const data = practice && selectedTaskId ? getSteps(selectedTaskId, practice) : null;
  const title = data?.title;
  const steps = data?.steps;
  const totalSteps = steps?.length ?? 0;
  const step = steps?.[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
      setShowAlt({});
    } else {
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setShowAlt({});
    }
  };

  const handleExplainDifferently = () => {
    setShowAlt((prev) => ({ ...prev, [currentStep]: true }));
    if (onSendMessage && step) {
      onSendMessage(`I'm confused about step ${currentStep + 1} -- "${step.instruction}". Can you explain differently?`);
    }
  };

  const handleTryForReal = () => {
    if (onSendMessage) {
      onSendMessage(`I finished practicing ${title}. I'm ready to try it for real now!`);
    }
    onClose();
  };

  const handlePracticeAgain = () => {
    setCurrentStep(0);
    setCompleted(false);
    setShowAlt({});
  };

  if (!practice) return null;

  if (!selectedTaskId) {
    return (
      <div className="pcp-practice">
        <div className="pcp-practice__banner" role="status">
          PRACTICE MODE -- Nothing will happen to your computer!
        </div>
        <div className="pcp-practice-picker">
          <h1 className="pcp-practice-picker__heading">What would you like to practice?</h1>
          <p className="pcp-practice-picker__subtitle">
            Pick a task below. This is just practice -- nothing will change on your computer.
          </p>
          <div className="pcp-practice-picker__grid">
            {Object.entries(TASK_PICKER_META).map(([taskId, meta]) => {
              const content = practiceRegistry[taskId];
              return (
                <button
                  key={taskId}
                  type="button"
                  className="pcp-practice-picker__card"
                  onClick={() => setSelectedTaskId(taskId)}
                >
                  <span className="pcp-practice-picker__card-icon" aria-hidden="true">{meta.icon}</span>
                  <div className="pcp-practice-picker__card-text">
                    <span className="pcp-practice-picker__card-title">{meta.label}</span>
                    {content?.description && (
                      <span className="pcp-practice-picker__card-desc">{content.description}</span>
                    )}
                  </div>
                  <span className="pcp-practice-picker__card-arrow" aria-hidden="true">{'\u203A'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

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
          <button
            className="pcp-overlay-topbar__back"
            onClick={() => {
              setSelectedTaskId(null);
              setCurrentStep(0);
              setCompleted(false);
              setShowAlt({});
            }}
          >
            <span aria-hidden="true">&lsaquo;</span> Back to task list
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
      {/* Top bar */}
      <div className="pcp-overlay-topbar">
        <button className="pcp-overlay-topbar__back" onClick={onClose}>
          <span aria-hidden="true">&lsaquo;</span> Back to chat
        </button>
        <button
          className="pcp-overlay-topbar__back"
          onClick={() => {
            setSelectedTaskId(null);
            setCurrentStep(0);
            setCompleted(false);
            setShowAlt({});
          }}
        >
          <span aria-hidden="true">&lsaquo;</span> Back to task list
        </button>
      </div>

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
