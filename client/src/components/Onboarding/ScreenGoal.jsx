import React, { useRef, useCallback } from 'react';
import OnboardingScreen from './OnboardingScreen';

const STARTER_CHIPS = [
  { emoji: '\u{1F4DE}', text: 'Video call my family' },
  { emoji: '\u{1F48C}', text: 'Send and receive email' },
  { emoji: '\u{1F4F7}', text: 'Look at and share photos' },
  { emoji: '\u{1F310}', text: 'Browse and search the web' },
];

/**
 * Screen 4 — Learning Goal
 *
 * Textarea (96px min, auto-grows to 5 lines) + 4 starter chips.
 * Chip tap fills textarea (editable). "I'm not sure yet" skip below Continue.
 */
function ScreenGoal({ goal, onGoalChange, onNext, onSkip, onBack, direction }) {
  const textareaRef = useRef(null);
  const liveRef = useRef(null);

  const canContinue = goal.trim().length > 0;

  const handleChipClick = useCallback((text) => {
    onGoalChange(text);
    // Announce chip selection to screen readers
    if (liveRef.current) {
      liveRef.current.textContent = `Selected: ${text}. You can edit this.`;
    }
    // Focus the textarea so user can edit
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [onGoalChange]);

  const handleTextareaInput = (e) => {
    onGoalChange(e.target.value);
    // Auto-grow: reset height then set to scrollHeight
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const handleContinue = () => {
    if (!canContinue) return;
    onNext();
  };

  return (
    <OnboardingScreen
      step={4}
      totalSteps={5}
      showTopBar={true}
      onBack={onBack}
      headingId="pcp-goal-heading"
      direction={direction}
      footer={
        <>
          <button
            type="button"
            className="pcp-onboarding-screen__cta"
            onClick={handleContinue}
            aria-disabled={!canContinue}
            disabled={!canContinue}
          >
            Continue &#9654;
          </button>
          <button
            type="button"
            className="pcp-onboarding-screen__skip"
            onClick={onSkip}
          >
            I&apos;m not sure yet
          </button>
        </>
      }
    >
      <div className="pcp-goal">
        <h1 id="pcp-goal-heading" className="pcp-goal__heading">
          What would you like to learn?
        </h1>
        <p className="pcp-goal__reassurance">
          You can change this anytime.
        </p>

        <div>
          <label htmlFor="pcp-goal-textarea" className="sr-only">
            What would you like to learn?
          </label>
          <textarea
            ref={textareaRef}
            id="pcp-goal-textarea"
            className="pcp-goal__textarea"
            value={goal}
            onChange={handleTextareaInput}
            placeholder="Tell me what you'd like to do..."
            rows={3}
          />
        </div>

        <div>
          <p className="pcp-goal__chips-label">Or pick one to start:</p>
          <div className="pcp-goal__chips" role="list">
            {STARTER_CHIPS.map((chip) => (
              <button
                key={chip.text}
                type="button"
                role="listitem"
                className="pcp-goal__chip"
                onClick={() => handleChipClick(chip.text)}
              >
                <span className="pcp-goal__chip-emoji" aria-hidden="true">
                  {chip.emoji}
                </span>
                {chip.text}
              </button>
            ))}
          </div>
        </div>

        {/* Live region for chip selection announcements */}
        <div ref={liveRef} aria-live="polite" className="sr-only" />
      </div>
    </OnboardingScreen>
  );
}

export default ScreenGoal;
