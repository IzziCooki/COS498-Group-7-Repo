import React, { useRef } from 'react';
import OnboardingScreen from './OnboardingScreen';

const MAX_NAME_LENGTH = 40;

/**
 * Screen 2 — Name + Device
 *
 * Text input for name (optional) + two device tiles (Mac / Windows) + "I don't know" ghost button.
 * Continue disabled until device chosen. Name is encouraged but not required.
 * Return on keyboard does NOT submit.
 */
function ScreenNameDevice({
  name,
  onNameChange,
  device,
  onDeviceChange,
  onNext,
  onBack,
  direction,
}) {
  const inputRef = useRef(null);

  const trimmedName = name.trim();
  const nameTooLong = name.length > MAX_NAME_LENGTH;
  const canContinue = device !== null && device !== '';

  const handleNameChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_NAME_LENGTH) {
      onNameChange(val);
    } else {
      onNameChange(val.slice(0, MAX_NAME_LENGTH));
    }
  };

  const handleKeyDown = (e) => {
    // Return on soft keyboard should NOT submit — just blur
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputRef.current) inputRef.current.blur();
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    onNext();
  };

  return (
    <OnboardingScreen
      step={2}
      totalSteps={5}
      showTopBar={true}
      onBack={onBack}
      headingId="pcp-name-device-heading"
      direction={direction}
      footer={
        <button
          type="button"
          className="pcp-onboarding-screen__cta"
          onClick={handleContinue}
          aria-disabled={!canContinue}
          disabled={!canContinue}
        >
          Continue &#9654;
        </button>
      }
    >
      <div className="pcp-name-device">
        <h1 id="pcp-name-device-heading" className="pcp-name-device__section-heading">
          Tell me a little about you
        </h1>

        {/* Name input */}
        <div>
          <label htmlFor="pcp-name-input" className="pcp-name-device__label">
            What should I call you? <span className="pcp-name-device__optional">(optional)</span>
          </label>
          <input
            ref={inputRef}
            id="pcp-name-input"
            type="text"
            className="pcp-name-device__input"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            placeholder="Your first name"
            autoComplete="given-name"
            aria-describedby={nameTooLong ? 'pcp-name-hint' : 'pcp-name-optional-hint'}
            maxLength={MAX_NAME_LENGTH}
          />
          <p id="pcp-name-optional-hint" className="pcp-name-device__optional-hint">
            Adding your name helps me talk to you more naturally.
          </p>
          {name.length >= MAX_NAME_LENGTH && (
            <p id="pcp-name-hint" className="pcp-name-device__name-hint">
              That&apos;s a great name! I&apos;ll just call you the first part.
            </p>
          )}
        </div>

        {/* Device tiles */}
        <div>
          <p className="pcp-name-device__label" id="pcp-device-label">
            Which kind of computer do you have?
          </p>
          <div
            className="pcp-name-device__tiles"
            role="radiogroup"
            aria-labelledby="pcp-device-label"
          >
            <button
              type="button"
              role="radio"
              aria-checked={device === 'mac'}
              className={`pcp-name-device__tile${device === 'mac' ? ' pcp-name-device__tile--selected' : ''}`}
              onClick={() => onDeviceChange('mac')}
            >
              <span className="pcp-name-device__tile-emoji" aria-hidden="true">
                &#x1F34E;
              </span>
              <span className="pcp-name-device__tile-name">Mac</span>
              <span className="pcp-name-device__tile-desc">Made by Apple</span>
              {device === 'mac' && (
                <span className="pcp-name-device__tile-check" aria-hidden="true">&#10003;</span>
              )}
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={device === 'windows'}
              className={`pcp-name-device__tile${device === 'windows' ? ' pcp-name-device__tile--selected' : ''}`}
              onClick={() => onDeviceChange('windows')}
            >
              <span className="pcp-name-device__tile-emoji" aria-hidden="true">
                &#x1FA9F;
              </span>
              <span className="pcp-name-device__tile-name">Windows</span>
              <span className="pcp-name-device__tile-desc">Made by Microsoft</span>
              {device === 'windows' && (
                <span className="pcp-name-device__tile-check" aria-hidden="true">&#10003;</span>
              )}
            </button>
          </div>

          {/* "I don't know" option */}
          <div style={{ marginTop: 'var(--space-3)' }}>
            <button
              type="button"
              role="radio"
              aria-checked={device === 'unknown'}
              className={`pcp-name-device__unknown-btn${device === 'unknown' ? ' pcp-name-device__unknown-btn--selected' : ''}`}
              onClick={() => onDeviceChange('unknown')}
            >
              I don&apos;t know / I&apos;ll set this later
            </button>
          </div>
        </div>
      </div>
    </OnboardingScreen>
  );
}

export default ScreenNameDevice;
