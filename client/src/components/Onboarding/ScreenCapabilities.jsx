import React from 'react';
import OnboardingScreen from './OnboardingScreen';

const CAN_DO = [
  'Answer your tech questions',
  'Walk you through tasks step by step',
  'Check your computer for problems',
  'Find helpful videos and guides',
];

const LESS_SURE = [
  'Advanced settings or registry changes',
  "Problems with specific apps I haven't been trained on",
];

const WONT_DO = [
  "Click buttons or make changes for you \u2014 you stay in control",
  'Fix broken hardware',
  'Make phone calls or send messages for you',
];

/**
 * Screen 2 — Capabilities
 *
 * Shows what PC Pal can help with, what it's less sure about,
 * and what it won't do. Plain language for 60+ users.
 */
function ScreenCapabilities({ onNext, onBack, direction }) {
  return (
    <OnboardingScreen
      step={2}
      totalSteps={6}
      showTopBar={true}
      onBack={onBack}
      headingId="pcp-capabilities-heading"
      direction={direction}
      footer={
        <button
          type="button"
          className="pcp-onboarding-screen__cta"
          onClick={onNext}
        >
          Next &#9654;
        </button>
      }
    >
      <div className="pcp-capabilities">
        <h1 id="pcp-capabilities-heading" className="pcp-capabilities__heading">
          What PC Pal Can Help With
        </h1>

        {/* Can do — 2x2 grid */}
        <div className="pcp-capabilities__grid">
          {CAN_DO.map((item) => (
            <div key={item} className="pcp-capabilities__grid-card">
              <span
                className="pcp-capabilities__icon pcp-capabilities__icon--success"
                aria-hidden="true"
              >
                &#10003;
              </span>
              <span className="pcp-capabilities__grid-text">{item}</span>
            </div>
          ))}
        </div>

        {/* Less sure about */}
        <div className="pcp-capabilities__section">
          <p className="pcp-capabilities__section-heading">
            Less sure about:
          </p>
          <ul className="pcp-capabilities__list">
            {LESS_SURE.map((item) => (
              <li key={item} className="pcp-capabilities__list-item">
                <span
                  className="pcp-capabilities__icon pcp-capabilities__icon--warning"
                  aria-hidden="true"
                >
                  ?
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Won't do */}
        <div className="pcp-capabilities__section">
          <p className="pcp-capabilities__section-heading">
            Won&apos;t do:
          </p>
          <ul className="pcp-capabilities__list">
            {WONT_DO.map((item) => (
              <li key={item} className="pcp-capabilities__list-item">
                <span
                  className="pcp-capabilities__icon pcp-capabilities__icon--danger"
                  aria-hidden="true"
                >
                  &#10007;
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </OnboardingScreen>
  );
}

export default ScreenCapabilities;
