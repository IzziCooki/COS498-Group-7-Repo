import React, { useState, useCallback, useRef, useEffect } from 'react';
import GuideStep from './GuideStep';
import GuideTerminalStep from './GuideTerminalStep';
import GuideCompletionStep from './GuideCompletionStep';
import GuideStuckSheet from './GuideStuckSheet';
import GuideNextPreview from './GuideNextPreview';
import './GuideViewer.css';

/**
 * GuideViewer -- Step-by-step guide overlay (D3 spec).
 * One step at a time with next-step preview strip, Back/Next navigation,
 * TTS button, stuck sheet, and completion screen.
 *
 * @param {{
 *   guide: { title: string, description?: string, steps: Array, source?: string },
 *   onClose: () => void,
 *   onSendMessage?: (text: string) => void,
 *   onStepChange?: (step: number) => void,
 *   titleId: string,
 * }} props
 */
function GuideViewer({ guide, onClose, onSendMessage, onStepChange, titleId }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [stuckOpen, setStuckOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [ttsActive, setTtsActive] = useState(false);
  const contentRef = useRef(null);
  const announceRef = useRef(null);

  const steps = Array.isArray(guide?.steps) ? guide.steps : [];
  const totalSteps = steps.length;
  const step = steps[currentStep] || null;
  const isLast = currentStep >= totalSteps - 1;
  const isFirst = currentStep === 0;
  const isSingleStep = totalSteps <= 1;

  // Guard: if no steps at all, show a fallback
  if (totalSteps === 0) {
    return (
      <div className="pcp-guide" style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
        <div className="pcp-overlay-topbar">
          <button className="pcp-overlay-topbar__back" onClick={onClose} aria-label="Back to chat">
            <span aria-hidden="true">&lsaquo;</span> Back to chat
          </button>
        </div>
        <h1 id={titleId} style={{ fontSize: 'var(--font-size-lg)', marginTop: 'var(--space-5)' }}>
          {guide?.title || 'Guide'}
        </h1>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-2)', marginTop: 'var(--space-3)' }}>
          {guide?.description || 'This guide has no steps to display.'}
        </p>
      </div>
    );
  }

  // Notify parent of step changes
  useEffect(() => {
    if (onStepChange) onStepChange(currentStep);
  }, [currentStep, onStepChange]);

  // Scroll content to top on step change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (isLast) {
      setCompleted(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
    setPreviewOpen(false);
  }, [isLast]);

  const handleBack = useCallback(() => {
    if (!isFirst) {
      setCurrentStep((s) => s - 1);
    }
    setPreviewOpen(false);
  }, [isFirst]);

  const handleDone = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleStuck = useCallback(() => {
    setStuckOpen(true);
  }, []);

  const handleStuckClose = useCallback(() => {
    setStuckOpen(false);
  }, []);

  const handleTts = useCallback(() => {
    if (ttsActive) {
      window.speechSynthesis?.cancel();
      setTtsActive(false);
      return;
    }
    if (!step) return;
    const textParts = [step.title, step.body, step.caption].filter(Boolean);
    const text = textParts.join('. ');
    if (window.speechSynthesis && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.onend = () => setTtsActive(false);
      utterance.onerror = () => setTtsActive(false);
      window.speechSynthesis.speak(utterance);
      setTtsActive(true);
    }
  }, [step, ttsActive]);

  // Cancel TTS on unmount or step change
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentStep]);

  const handleSkipToStep = useCallback((stepIndex) => {
    setCurrentStep(stepIndex);
    setPreviewOpen(false);
  }, []);

  // Determine if step is a terminal step (has command)
  const isTerminalStep = step?.command != null;

  // Progress dots renderer
  const renderDots = () => {
    if (isSingleStep) return null;
    // Truncate if >5 steps
    if (totalSteps > 5) {
      return (
        <span className="pcp-guide__dots" aria-hidden="true">
          {steps.map((_, i) => {
            if (i < currentStep) {
              return <span key={i} className="pcp-guide__dot pcp-guide__dot--done" />;
            }
            if (i === currentStep) {
              return <span key={i} className="pcp-guide__dot pcp-guide__dot--active" />;
            }
            // Show first two pending, then ellipsis, then last
            if (i === currentStep + 1 || i === currentStep + 2 || i === totalSteps - 1) {
              return <span key={i} className="pcp-guide__dot pcp-guide__dot--pending" />;
            }
            if (i === currentStep + 3) {
              return <span key={i} className="pcp-guide__dot-ellipsis">...</span>;
            }
            return null;
          })}
        </span>
      );
    }
    return (
      <span className="pcp-guide__dots" aria-hidden="true">
        {steps.map((_, i) => {
          let mod = 'pcp-guide__dot--pending';
          if (i < currentStep) mod = 'pcp-guide__dot--done';
          if (i === currentStep) mod = 'pcp-guide__dot--active';
          return <span key={i} className={`pcp-guide__dot ${mod}`} />;
        })}
      </span>
    );
  };

  if (completed) {
    return (
      <div className="pcp-guide">
        {/* Top bar */}
        <div className="pcp-overlay-topbar">
          <button
            className="pcp-overlay-topbar__back"
            onClick={onClose}
            aria-label="Close guide and return to chat"
          >
            <span aria-hidden="true">&lsaquo;</span> Back to chat
          </button>
        </div>

        {/* Title section */}
        <div className="pcp-guide__title-section">
          <h1 id={titleId} className="pcp-guide__title">{guide.title}</h1>
          {!isSingleStep && (
            <div className="pcp-guide__step-indicator">
              <span className="pcp-guide__counter" aria-label={`Step ${totalSteps} of ${totalSteps}`}>
                Step {totalSteps} of {totalSteps}
              </span>
              {renderDots()}
            </div>
          )}
        </div>

        <div className="pcp-guide__content" ref={contentRef}>
          <GuideCompletionStep
            guide={guide}
            steps={steps}
            onDone={handleDone}
            onSendMessage={onSendMessage}
          />
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="pcp-guide">
      {/* Screen reader announcement on step change */}
      <div ref={announceRef} className="sr-only" aria-live="polite" role="status">
        Step {currentStep + 1} of {totalSteps}. {step.title || step.body}
      </div>

      {/* Top bar */}
      <div className="pcp-overlay-topbar">
        <button
          className="pcp-overlay-topbar__back"
          onClick={onClose}
          aria-label="Close guide and return to chat"
        >
          <span aria-hidden="true">&lsaquo;</span> Back to chat
        </button>
        <button
          className="pcp-overlay-topbar__tts"
          onClick={handleTts}
          aria-label={ttsActive ? 'Stop reading aloud' : 'Read this step aloud'}
          aria-pressed={ttsActive}
        >
          {ttsActive ? '\uD83D\uDD0A' : '\uD83D\uDD08'}
        </button>
      </div>

      {/* Title section */}
      <div className="pcp-guide__title-section">
        <h1 id={titleId} className="pcp-guide__title">{guide.title}</h1>
        {!isSingleStep && (
          <div className="pcp-guide__step-indicator">
            <span className="pcp-guide__counter" aria-label={`Step ${currentStep + 1} of ${totalSteps}`}>
              Step {currentStep + 1} of {totalSteps}
            </span>
            {renderDots()}
          </div>
        )}
        {guide.source && (
          <div className="pcp-guide__source">
            Source: {(() => { try { return new URL(guide.source).hostname.replace('www.', ''); } catch { return guide.source; } })()}
          </div>
        )}
      </div>

      {/* Step content (scrollable) */}
      <div className="pcp-guide__content" ref={contentRef}>
        {isTerminalStep ? (
          <GuideTerminalStep
            step={step}
            onStuck={handleStuck}
          />
        ) : (
          <GuideStep
            step={step}
            onStuck={handleStuck}
          />
        )}
      </div>

      {/* Next-step preview strip */}
      {!isLast && (
        <GuideNextPreview
          nextStep={steps[currentStep + 1]}
          nextStepNumber={currentStep + 2}
          isOpen={previewOpen}
          onToggle={() => setPreviewOpen(!previewOpen)}
          onSkip={() => handleSkipToStep(currentStep + 1)}
        />
      )}

      {/* Bottom navigation */}
      <div className="pcp-guide__nav">
        {isSingleStep ? (
          <button
            className="pcp-btn pcp-btn--primary pcp-guide__nav-btn pcp-guide__nav-btn--full"
            onClick={handleDone}
          >
            Done &middot; Back to chat
          </button>
        ) : (
          <>
            <button
              className="pcp-btn pcp-btn--ghost pcp-guide__nav-back"
              onClick={handleBack}
              disabled={isFirst}
              aria-label="Go to previous step"
            >
              <span aria-hidden="true">&lsaquo;</span> Back
            </button>
            <button
              className="pcp-btn pcp-btn--primary pcp-guide__nav-next"
              onClick={handleNext}
            >
              {isLast ? (
                <>I did it &middot; Finish &#10003;</>
              ) : (
                <>Got it &middot; Next &#9656;</>
              )}
            </button>
          </>
        )}
      </div>

      {/* Stuck sheet */}
      {stuckOpen && (
        <GuideStuckSheet
          guideTitle={guide.title}
          stepNumber={currentStep + 1}
          stepTitle={step.title || step.body}
          onClose={handleStuckClose}
          onSendMessage={onSendMessage}
        />
      )}
    </div>
  );
}

export default GuideViewer;
