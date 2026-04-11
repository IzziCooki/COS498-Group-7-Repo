import React, { useState } from 'react';
import './OnboardingFlow.css';

const TOTAL_STEPS = 5;

const OS_OPTIONS = [
  { value: 'Windows', label: 'Windows' },
  { value: 'Mac', label: 'Mac' },
  { value: 'iPhone', label: 'iPhone' },
  { value: 'Android', label: 'Android' },
];

const COMFORT_LABELS = {
  1: "I'm brand new",
  2: 'I know a little',
  3: 'I know the basics',
  4: 'Getting confident',
  5: 'Pretty comfortable',
};

/**
 * OnboardingFlow — multi-step wizard for new users.
 *
 * Step 1: Name
 * Step 2: Device / OS type
 * Step 3: Comfort level (1–5)
 * Step 4: Learning goal (optional)
 * Step 5: Buddy opt-in
 * Submit: calls createUser, then completeOnboarding
 */
function OnboardingFlow({ createUser, completeOnboarding }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [osType, setOsType] = useState('');
  const [comfortLevel, setComfortLevel] = useState(3);
  const [goalText, setGoalText] = useState('');
  const [wantsBuddy, setWantsBuddy] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const canGoNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return osType.length > 0;
    return true; // steps 3, 4, 5 always have valid defaults or are optional
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const newUser = await createUser({
        name: name.trim(),
        os_type: osType,
        comfort_level: comfortLevel,
        goal_summary: goalText.trim() || null,
        collaboration_opt_in: wantsBuddy ? 1 : 0,
      });

      // If user wants a buddy, generate invite code
      if (wantsBuddy) {
        try {
          const res = await fetch('/api/buddy/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: newUser.id }),
          });
          const data = await res.json();
          if (data.inviteCode) {
            setInviteCode(data.inviteCode);
          }
        } catch (e) {
          console.error('Failed to generate invite code:', e);
        }
      }

      // Save goal if provided
      if (goalText.trim()) {
        try {
          await fetch('/api/buddy/invite', { method: 'OPTIONS' }); // warm up
        } catch { /* ignore */ }
      }

      await completeOnboarding(newUser.id);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Onboarding error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 5 special: if they chose buddy and got invite code, show it before proceeding
  const handleBuddyChoice = (choice) => {
    setWantsBuddy(choice);
  };

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-card" role="main">
        {/* Progress indicator */}
        <div className="onboarding-progress" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`onboarding-progress__dot ${i + 1 <= step ? 'onboarding-progress__dot--active' : ''}`}
              aria-hidden="true"
            />
          ))}
          <span className="onboarding-progress__label">Step {step} of {TOTAL_STEPS}</span>
        </div>

        {/* Step content */}
        <div className="onboarding-step" key={step}>
          {step === 1 && (
            <div className="animate-slide-up">
              <h1 className="onboarding-heading">Welcome to PC Pal!</h1>
              <p className="onboarding-intro">
                I'm here to help you with your computer — no question is too simple!
              </p>
              <label htmlFor="user-name" className="onboarding-label">
                What's your name?
              </label>
              <input
                id="user-name"
                type="text"
                className="onboarding-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your first name"
                autoFocus
                autoComplete="given-name"
                onKeyDown={(e) => { if (e.key === 'Enter' && canGoNext()) goNext(); }}
              />
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <h1 className="onboarding-heading">
                {name ? `Nice to meet you, ${name}!` : 'Your Device'}
              </h1>
              <p className="onboarding-label">What kind of computer do you use?</p>
              <div className="os-grid">
                {OS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`os-btn ${osType === opt.value ? 'os-btn--selected' : ''}`}
                    onClick={() => setOsType(opt.value)}
                    aria-pressed={osType === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-slide-up">
              <h1 className="onboarding-heading">How comfortable are you?</h1>
              <p className="onboarding-label">
                How comfortable are you with computers?
              </p>
              <div className="comfort-scale">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`comfort-btn ${comfortLevel === level ? 'comfort-btn--selected' : ''}`}
                    onClick={() => setComfortLevel(level)}
                    aria-pressed={comfortLevel === level}
                    aria-label={`${level} — ${COMFORT_LABELS[level]}`}
                  >
                    <span className="comfort-btn__number">{level}</span>
                    <span className="comfort-btn__label">{COMFORT_LABELS[level]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-slide-up">
              <h1 className="onboarding-heading">Your Goal</h1>
              <p className="onboarding-label">
                What's one thing you'd love to do on your computer?
              </p>
              <p className="onboarding-hint">
                For example: "Email photos to my grandkids" or "Video call my doctor"
              </p>
              <input
                id="user-goal"
                type="text"
                className="onboarding-input"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="Type your goal here (optional)"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') goNext(); }}
              />
            </div>
          )}

          {step === 5 && (
            <div className="animate-slide-up">
              <h1 className="onboarding-heading">Want a Buddy?</h1>
              <p className="onboarding-label">
                Would you like a family member or friend to follow along as you learn?
              </p>
              <p className="onboarding-hint">
                A buddy can see your progress and help when you get stuck. You'll get a code to share with them.
              </p>

              {/* Show invite code if already generated */}
              {inviteCode && (
                <div className="onboarding-invite-display">
                  <p className="onboarding-invite-label">Share this code with your buddy:</p>
                  <div className="onboarding-invite-code">{inviteCode}</div>
                </div>
              )}

              {!inviteCode && (
                <div className="onboarding-buddy-choices">
                  <button
                    type="button"
                    className={`os-btn ${wantsBuddy === true ? 'os-btn--selected' : ''}`}
                    onClick={() => handleBuddyChoice(true)}
                    aria-pressed={wantsBuddy === true}
                  >
                    Yes, let's set that up!
                  </button>
                  <button
                    type="button"
                    className={`os-btn ${wantsBuddy === false ? 'os-btn--selected' : ''}`}
                    onClick={() => handleBuddyChoice(false)}
                    aria-pressed={wantsBuddy === false}
                  >
                    Maybe later
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="onboarding-error" role="alert">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="onboarding-nav">
          {step > 1 && (
            <button
              type="button"
              className="btn-secondary onboarding-nav__back"
              onClick={goBack}
              disabled={isSubmitting}
            >
              Back
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              className="btn-primary onboarding-nav__next"
              onClick={goNext}
              disabled={!canGoNext()}
            >
              {step === 4 && !goalText.trim() ? 'Skip' : 'Next'}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary onboarding-nav__submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting things up...' : "Let's get started!"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;
