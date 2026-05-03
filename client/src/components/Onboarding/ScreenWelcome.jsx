import React from 'react';
import OnboardingScreen from './OnboardingScreen';

/**
 * Screen 1 — Welcome
 *
 * No top bar, no progress dots, no back.
 * 160x160 mascot circle, greeting, body, primary CTA, reassurance.
 */
function ScreenWelcome({ onNext, direction }) {
  return (
    <OnboardingScreen
      step={1}
      totalSteps={5}
      showTopBar={false}
      headingId="pcp-welcome-heading"
      direction={direction}
      footer={
        <>
          <button
            type="button"
            className="pcp-onboarding-screen__cta"
            onClick={onNext}
          >
            Let&apos;s get started &#9654;
          </button>
          <p
            className="pcp-welcome__reassurance"
            style={{ textAlign: 'center', margin: 0 }}
          >
            Takes about a minute.
          </p>
        </>
      }
    >
      <div className="pcp-welcome">
        <div className="pcp-welcome__mascot" aria-hidden="true">
          PC
        </div>
        <h1 id="pcp-welcome-heading" className="pcp-welcome__heading">
          Hello! I&apos;m PC Pal.
        </h1>
        <p className="pcp-welcome__body">
          I&apos;m here to help you with your computer. I&apos;m patient,
          I never get cross, and I explain things in plain English.
        </p>
      </div>
    </OnboardingScreen>
  );
}

export default ScreenWelcome;
