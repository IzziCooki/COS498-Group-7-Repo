import React, { useEffect, useRef } from 'react';
import OnboardingProgress from './OnboardingProgress';
import './OnboardingScreen.css';

/**
 * OnboardingScreen — chassis component wrapping each screen.
 *
 * Props:
 *   step          — current step (1-5)
 *   totalSteps    — always 5
 *   showTopBar    — false for welcome screen
 *   onBack        — handler for back arrow (null hides it)
 *   headingId     — id of the heading inside children (for aria-labelledby)
 *   direction     — 'forward' | 'back' for slide animation
 *   children      — screen content
 *   footer        — footer content (buttons)
 */
function OnboardingScreen({
  step,
  totalSteps,
  showTopBar = true,
  onBack,
  headingId,
  direction = 'forward',
  children,
  footer,
}) {
  const headingRef = useRef(null);

  // On screen entry, move focus to heading for screen reader announcement
  useEffect(() => {
    if (headingId) {
      const el = document.getElementById(headingId);
      if (el) {
        el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      }
    }
  }, [headingId, step]);

  const animClass =
    direction === 'back'
      ? 'pcp-onboarding-screen--animate-back'
      : 'pcp-onboarding-screen--animate-forward';

  return (
    <div
      className={`pcp-onboarding-screen ${animClass}`}
      role="main"
      aria-labelledby={headingId}
    >
      {showTopBar && (
        <div className="pcp-onboarding-screen__top-bar">
          <button
            type="button"
            className={`pcp-onboarding-screen__back${!onBack ? ' pcp-onboarding-screen__back--hidden' : ''}`}
            onClick={onBack || undefined}
            aria-label="Go back to previous step"
            disabled={!onBack}
          >
            &#9664;
          </button>
          <OnboardingProgress current={step} total={totalSteps} />
        </div>
      )}

      <div className="pcp-onboarding-screen__content" key={step}>
        {children}
      </div>

      {footer && (
        <div className="pcp-onboarding-screen__footer">
          {footer}
        </div>
      )}
    </div>
  );
}

export default OnboardingScreen;
