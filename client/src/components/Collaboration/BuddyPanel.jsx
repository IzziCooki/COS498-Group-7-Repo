import React, { useState } from 'react';
import './BuddyPanel.css';
import VideoCall from './VideoCall';

/**
 * BuddyPanel — slide-in panel for managing buddy/collaboration features.
 *
 * Shows invite code generation, code entry, buddy status, and progress shares.
 */
function BuddyPanel({ isOpen, onClose, buddyData, currentUserId, onJoinSession, onLeaveSession, isInSession }) {
  const {
    buddyPair,
    progressShares,
    inviteCode,
    isLoading,
    error,
    hasBuddy,
    generateInvite,
    acceptInvite,
  } = buddyData;

  const [codeInput, setCodeInput] = useState('');
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  if (!isOpen) return null;

  const handleGenerateInvite = async () => {
    await generateInvite();
  };

  const handleAcceptInvite = async () => {
    if (codeInput.trim().length > 0) {
      const result = await acceptInvite(codeInput.trim());
      if (result) {
        setCodeInput('');
        setShowCodeEntry(false);
      }
    }
  };

  const buddyName = buddyPair
    ? (buddyPair.helper_name || buddyPair.learner_name || 'Your Buddy')
    : null;

  return (
    <div className="buddy-panel-overlay" onClick={onClose}>
      <div className="buddy-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Buddy panel">
        <div className="buddy-panel__header">
          <h2 className="buddy-panel__title">My Buddy</h2>
          <button
            className="buddy-panel__close"
            onClick={onClose}
            aria-label="Close buddy panel"
          >
            &times;
          </button>
        </div>

        <div className="buddy-panel__body">
          {/* Error display */}
          {error && (
            <div className="buddy-panel__error" role="alert">{error}</div>
          )}

          {/* Connected buddy */}
          {hasBuddy ? (
            <div className="buddy-panel__connected">
              <div className="buddy-panel__buddy-badge">
                <span className="buddy-panel__buddy-icon" aria-hidden="true">
                  {buddyName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="buddy-panel__buddy-name">{buddyName}</p>
                  <p className="buddy-panel__buddy-status">Connected</p>
                </div>
              </div>

              {/* Video call button */}
              <button
                className="btn-primary buddy-panel__action-btn buddy-panel__video-btn"
                onClick={() => setShowVideoCall(!showVideoCall)}
              >
                {showVideoCall ? 'Close Video Call' : 'Video Call'}
              </button>

              {showVideoCall && (
                <VideoCall
                  userId={currentUserId}
                  buddyName={buddyName}
                  onClose={() => setShowVideoCall(false)}
                />
              )}

              {/* Join/Leave session — available for either role */}
              {currentUserId && onJoinSession && (
                <div className="buddy-panel__section">
                  {!isInSession ? (
                    <button
                      className="btn-primary buddy-panel__action-btn"
                      onClick={() => {
                        const targetId = buddyPair.helper_id === currentUserId
                          ? buddyPair.learner_id
                          : buddyPair.helper_id;
                        onJoinSession(targetId);
                      }}
                    >
                      Join {buddyPair.helper_id === currentUserId
                        ? (buddyPair.learner_name || "Buddy's")
                        : (buddyPair.helper_name || "Buddy's")} Session
                    </button>
                  ) : (
                    <button
                      className="btn-secondary buddy-panel__action-btn"
                      onClick={() => {
                        const targetId = buddyPair.helper_id === currentUserId
                          ? buddyPair.learner_id
                          : buddyPair.helper_id;
                        onLeaveSession(targetId);
                      }}
                    >
                      Leave Session
                    </button>
                  )}
                </div>
              )}

              {/* Recent progress */}
              {progressShares.length > 0 && (
                <div className="buddy-panel__section">
                  <h3 className="buddy-panel__section-title">Recent Progress</h3>
                  <ul className="buddy-panel__progress-list">
                    {progressShares.slice(0, 5).map((share) => (
                      <li key={share.id} className="buddy-panel__progress-item">
                        <span className="buddy-panel__progress-check" aria-hidden="true">&#10003;</span>
                        <span>{share.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {progressShares.length === 0 && (
                <p className="buddy-panel__empty">
                  No shared progress yet. Complete a skill and your buddy will see it here!
                </p>
              )}
            </div>
          ) : (
            /* No buddy yet — invite or enter code */
            <div className="buddy-panel__setup">
              <p className="buddy-panel__intro">
                A buddy is a friend or family member who cheers you on as you learn.
                They can see your progress and help when you get stuck!
              </p>

              {/* Show generated invite code */}
              {inviteCode && (
                <div className="buddy-panel__invite-display">
                  <p className="buddy-panel__invite-label">Share this code with your buddy:</p>
                  <div className="buddy-panel__invite-code" aria-label="Invite code">
                    {inviteCode}
                  </div>
                  <p className="buddy-panel__invite-hint">
                    They can enter this code on their PC Pal to connect with you.
                  </p>
                </div>
              )}

              {/* Generate invite button */}
              {!inviteCode && (
                <button
                  className="btn-primary buddy-panel__action-btn"
                  onClick={handleGenerateInvite}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Invite a Buddy'}
                </button>
              )}

              {/* Enter someone else's code */}
              {!showCodeEntry ? (
                <button
                  className="btn-secondary buddy-panel__action-btn"
                  onClick={() => setShowCodeEntry(true)}
                >
                  I have an invite code
                </button>
              ) : (
                <div className="buddy-panel__code-entry">
                  <label htmlFor="invite-code-input" className="buddy-panel__code-label">
                    Enter your buddy's code:
                  </label>
                  <input
                    id="invite-code-input"
                    type="text"
                    className="buddy-panel__code-input"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. MAPLE7"
                    maxLength={6}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAcceptInvite(); }}
                  />
                  <button
                    className="btn-primary buddy-panel__action-btn"
                    onClick={handleAcceptInvite}
                    disabled={isLoading || codeInput.trim().length === 0}
                  >
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BuddyPanel;
