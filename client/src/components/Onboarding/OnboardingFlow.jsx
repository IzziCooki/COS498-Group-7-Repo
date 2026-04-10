import React, { useState } from 'react';
import './OnboardingFlow.css';

const TOTAL_STEPS = 3;

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
 * Submit: calls createUser, then completeOnboarding
 */
function OnboardingFlow({ createUser, completeOnboarding }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [osType, setOsType] = useState('');
  const [comfortLevel, setComfortLevel] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const canGoNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return osType.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const newUser = await createUser({
        name: name.trim(),
        os_type: osType,
        comfort_level: comfortLevel,
      });
      await completeOnboarding(newUser.id);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Onboarding error:', err);
    } finally {
      setIsSubmitting(false);
    }
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
              <h1 className="onboarding-heading">Almost done!</h1>
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
              Next
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
