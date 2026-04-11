import React from 'react';
import './WelcomeBackBanner.css';

/**
 * WelcomeBackBanner — shown at the top of the chat when the user returns
 * and has skills due for review or buddy help replies.
 *
 * @param {object} welcomeData - { reviewSkills, pendingHelp }
 * @param {function} onSendMessage - callback to send a chat message
 * @param {function} onDismiss - callback to close the banner
 */
function WelcomeBackBanner({ welcomeData, onSendMessage, onDismiss }) {
  if (!welcomeData) return null;

  const { reviewSkills = [], pendingHelp = [] } = welcomeData;

  if (reviewSkills.length === 0 && pendingHelp.length === 0) return null;

  const handleReview = (skill) => {
    onSendMessage(`I'd like to practice ${skill.skillName} again`);
    onDismiss();
  };

  const handleDismissHelp = () => {
    onDismiss();
  };

  return (
    <div className="welcome-banner" role="status" aria-label="Welcome back">
      {/* Skill reviews due */}
      {reviewSkills.length > 0 && (
        <div className="welcome-banner__section">
          <p className="welcome-banner__text">
            Welcome back! Want to practice something you learned before?
          </p>
          <div className="welcome-banner__skills">
            {reviewSkills.slice(0, 3).map((skill) => (
              <button
                key={skill.skillId || skill.skillName}
                className="btn-primary welcome-banner__skill-btn"
                onClick={() => handleReview(skill)}
              >
                Practice: {skill.skillName}
              </button>
            ))}
          </div>
          <button
            className="welcome-banner__dismiss"
            onClick={onDismiss}
          >
            Maybe later
          </button>
        </div>
      )}

      {/* Buddy help replies */}
      {pendingHelp.length > 0 && (
        <div className="welcome-banner__section welcome-banner__section--help">
          <p className="welcome-banner__text">
            Good news! {pendingHelp[0].buddyName} replied to your question:
          </p>
          <div className="welcome-banner__help-reply">
            <p className="welcome-banner__help-question">
              You asked: "{pendingHelp[0].question}"
            </p>
            <p className="welcome-banner__help-response">
              {pendingHelp[0].response}
            </p>
          </div>
          <button
            className="welcome-banner__dismiss"
            onClick={handleDismissHelp}
          >
            Got it, thanks!
          </button>
        </div>
      )}
    </div>
  );
}

export default WelcomeBackBanner;
