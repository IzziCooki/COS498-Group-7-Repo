import React from 'react';
import OnboardingScreen from './OnboardingScreen';

const COMFORT_OPTIONS = [
  {
    value: 'beginner',
    emoji: '\u{1F60A}', // smiling face
    title: 'Just learning',
    desc: "I'm new to computers. Take it slow with me.",
  },
  {
    value: 'learning',
    emoji: '\u{1F642}', // slightly smiling
    title: 'Getting there',
    desc: "I know some things, but I'm still learning.",
  },
  {
    value: 'comfortable',
    emoji: '\u{1F60E}', // sunglasses
    title: 'Pretty comfortable',
    desc: 'I use my computer often but not for everything.',
  },
  {
    value: 'confident',
    emoji: '\u{1F913}', // nerd face
    title: 'Confident',
    desc: 'I just want quick answers when I get stuck.',
  },
];

/**
 * Screen 3 — Comfort Level
 *
 * 4-option emoji scale, single select (radio group).
 * No skip — required for AI calibration.
 * Selecting does NOT auto-advance.
 * Maps to: beginner | learning | comfortable | confident
 */
function ScreenComfort({ comfort, onComfortChange, onNext, onBack, direction }) {
  const canContinue = comfort !== null && comfort !== '';

  const handleContinue = () => {
    if (!canContinue) onComfortChange('learning');
    onNext();
  };

  const handleSkip = () => {
    onComfortChange('learning');
    onNext();
  };

  return (
    <OnboardingScreen
      step={4}
      totalSteps={6}
      showTopBar={true}
      onBack={onBack}
      headingId="pcp-comfort-heading"
      direction={direction}
      footer={
        <>
          <button
            type="button"
            className="pcp-onboarding-screen__cta"
            onClick={handleContinue}
          >
            Continue &#9654;
          </button>
          <button
            type="button"
            className="pcp-onboarding-screen__ghost"
            onClick={handleSkip}
          >
            Skip for now
          </button>
        </>
      }
    >
      <div className="pcp-comfort">
        <h1 id="pcp-comfort-heading" className="pcp-comfort__heading">
          How do you feel about computers?
        </h1>
        <p className="pcp-comfort__reassurance">
          There are no wrong answers.
        </p>

        <div
          className="pcp-comfort__options"
          role="radiogroup"
          aria-labelledby="pcp-comfort-heading"
        >
          {COMFORT_OPTIONS.map((opt) => {
            const selected = comfort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`pcp-comfort__tile${selected ? ' pcp-comfort__tile--selected' : ''}`}
                onClick={() => onComfortChange(opt.value)}
              >
                <span className="pcp-comfort__tile-emoji" aria-hidden="true">
                  {opt.emoji}
                </span>
                <span className="pcp-comfort__tile-text">
                  <span className="pcp-comfort__tile-title">{opt.title}</span>
                  <span className="pcp-comfort__tile-desc">{opt.desc}</span>
                </span>
                {selected && (
                  <span className="pcp-comfort__tile-check" aria-hidden="true">
                    &#10003;
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingScreen>
  );
}

export default ScreenComfort;
