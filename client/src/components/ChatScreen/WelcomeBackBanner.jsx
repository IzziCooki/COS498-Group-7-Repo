import React from 'react';
import './WelcomeBackBanner.css';

/**
 * WelcomeBackBanner -- Non-sticky banner that scrolls with the message thread.
 * Shows skill reviews due and buddy help replies (D2 S3.3).
 *
 * @param {{ welcomeData: object|null, onSendMessage: (text:string) => void, onDismiss: () => void }} props
 */
function WelcomeBackBanner({ welcomeData, onSendMessage, onDismiss }) {
  if (!welcomeData) return null;

  const { reviewSkills = [], pendingHelp = [] } = welcomeData;
  if (reviewSkills.length === 0 && pendingHelp.length === 0) return null;

  const handleReview = (skill) => {
    onSendMessage(`I'd like to practice ${skill.skillName} again`);
    onDismiss();
  };

  return (
    <div role="status" aria-live="polite">
      {reviewSkills.length > 0 && (
        <div className="pcp-welcome">
          <button
            type="button"
            className="pcp-welcome__dismiss"
            onClick={onDismiss}
            aria-label="Dismiss welcome back banner"
          >
            &#10005;
          </button>
          <div className="pcp-welcome__heading">
            Welcome back!
          </div>
          <div className="pcp-welcome__body">
            Want to practice something you learned before?
          </div>
          <div className="pcp-welcome__skills">
            {reviewSkills.slice(0, 3).map((skill) => (
              <button
                key={skill.skillId || skill.skillName}
                type="button"
                className="pcp-welcome__skill-btn"
                onClick={() => handleReview(skill)}
              >
                Practice: {skill.skillName}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="pcp-welcome__cta"
            onClick={onDismiss}
          >
            Maybe later
          </button>
        </div>
      )}

      {pendingHelp.length > 0 && (
        <div className="pcp-welcome">
          <button
            type="button"
            className="pcp-welcome__dismiss"
            onClick={onDismiss}
            aria-label="Dismiss helper reply banner"
          >
            &#10005;
          </button>
          <div className="pcp-welcome__heading">
            {pendingHelp[0].buddyName} replied to your question
          </div>
          <div className="pcp-welcome__body">
            {pendingHelp[0].response}
          </div>
          <button
            type="button"
            className="pcp-welcome__cta"
            onClick={onDismiss}
          >
            Read it
          </button>
        </div>
      )}
    </div>
  );
}

export default WelcomeBackBanner;
