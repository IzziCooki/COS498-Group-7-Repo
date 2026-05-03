import React from 'react';
import OnboardingScreen from './OnboardingScreen';

/**
 * Screen 5 — Buddy Opt-In
 *
 * 80x80 illustration, "Want a helper?" heading,
 * can-do / cannot-do lists, two equal buttons:
 *   - "Get a code to share" (primary, 64px)
 *   - "No helper, thanks" (ghost, 56px with success check)
 */
function ScreenBuddy({ onGetCode, onSkip, onBack, direction }) {
  return (
    <OnboardingScreen
      step={5}
      totalSteps={5}
      showTopBar={true}
      onBack={onBack}
      headingId="pcp-buddy-heading"
      direction={direction}
      footer={
        <>
          <button
            type="button"
            className="pcp-onboarding-screen__cta pcp-onboarding-screen__cta--hero"
            onClick={onGetCode}
          >
            Get a code to share
          </button>
          <button
            type="button"
            className="pcp-onboarding-screen__skip"
            onClick={onSkip}
          >
            No helper, thanks &middot; I&apos;ll do this myself
            <span className="pcp-buddy__skip-check" aria-hidden="true">
              &#10003;
            </span>
          </button>
          <p
            className="pcp-buddy__reassurance"
            style={{ textAlign: 'center', margin: 0 }}
          >
            You can add a helper later anytime.
          </p>
        </>
      }
    >
      <div className="pcp-buddy">
        <div className="pcp-buddy__illustration" aria-hidden="true">
          &#x1F465;
        </div>

        <h1 id="pcp-buddy-heading" className="pcp-buddy__heading">
          Want a helper?
        </h1>

        <p className="pcp-buddy__body">
          A helper is someone in your family or a friend who can help you when
          you get stuck.
        </p>

        <div className="pcp-buddy__lists">
          {/* Can-do list */}
          <div>
            <p className="pcp-buddy__list-heading">They can:</p>
            <ul className="pcp-buddy__list">
              <li className="pcp-buddy__list-item">
                <span className="pcp-buddy__list-icon pcp-buddy__list-icon--success" aria-hidden="true">
                  &#10003;
                </span>
                Reply to your questions
              </li>
              <li className="pcp-buddy__list-item">
                <span className="pcp-buddy__list-icon pcp-buddy__list-icon--success" aria-hidden="true">
                  &#10003;
                </span>
                Have a video call with you
              </li>
              <li className="pcp-buddy__list-item">
                <span className="pcp-buddy__list-icon pcp-buddy__list-icon--success" aria-hidden="true">
                  &#10003;
                </span>
                Help fix things on your computer (only when you say it&apos;s okay)
              </li>
            </ul>
          </div>

          {/* Cannot-do list */}
          <div>
            <p className="pcp-buddy__list-heading">They cannot:</p>
            <ul className="pcp-buddy__list">
              <li className="pcp-buddy__list-item">
                <span className="pcp-buddy__list-icon pcp-buddy__list-icon--danger" aria-hidden="true">
                  &#10007;
                </span>
                See your private messages
              </li>
              <li className="pcp-buddy__list-item">
                <span className="pcp-buddy__list-icon pcp-buddy__list-icon--danger" aria-hidden="true">
                  &#10007;
                </span>
                Read your email or files
              </li>
              <li className="pcp-buddy__list-item">
                <span className="pcp-buddy__list-icon pcp-buddy__list-icon--danger" aria-hidden="true">
                  &#10007;
                </span>
                Do anything without asking you first
              </li>
            </ul>
          </div>
        </div>
      </div>
    </OnboardingScreen>
  );
}

export default ScreenBuddy;
