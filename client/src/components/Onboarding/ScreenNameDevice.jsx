import React, { useRef } from 'react';
import OnboardingScreen from './OnboardingScreen';

const MAX_NAME_LENGTH = 40;

/**
 * Screen 2 — Name + Device
 *
 * Text input for name (optional) + device tiles (Mac / Windows / iPhone / Android) + skip.
 * Everything is optional. User can skip the entire screen.
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

  const hasDevice = device !== null && device !== '';

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
    if (!hasDevice) onDeviceChange('unknown');
    onNext();
  };

  const handleSkip = () => {
    if (!hasDevice) onDeviceChange('unknown');
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
        <>
          <button
            type="button"
            className="pcp-onboarding-screen__cta"
            onClick={handleContinue}
          >
            Continue &#9654;
          </button>
          <button
            type="button"
            className="pcp-onboarding-screen__ghost"
            onClick={handleSkip}
          >
            Skip for now
          </button>
        </>
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
            aria-describedby="pcp-name-optional-hint"
            maxLength={MAX_NAME_LENGTH}
          />
          <p id="pcp-name-optional-hint" className="pcp-name-device__optional-hint">
            Adding your name helps me talk to you more naturally.
          </p>
        </div>

        {/* Device tiles */}
        <div>
          <p className="pcp-name-device__label" id="pcp-device-label">
            What device do you use? <span className="pcp-name-device__optional">(optional)</span>
          </p>
          <div
            className="pcp-name-device__tiles pcp-name-device__tiles--grid"
            role="radiogroup"
            aria-labelledby="pcp-device-label"
          >
            {[
              { id: 'mac', emoji: '\uD83C\uDF4E', name: 'Mac', desc: 'Apple computer' },
              { id: 'windows', emoji: '\uD83E\uDE9F', name: 'Windows', desc: 'Windows PC' },
              { id: 'iphone', emoji: '\uD83D\uDCF1', name: 'iPhone / iPad', desc: 'Apple phone or tablet' },
              { id: 'android', emoji: '\uD83E\uDD16', name: 'Android', desc: 'Android phone or tablet' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={device === d.id}
                className={`pcp-name-device__tile${device === d.id ? ' pcp-name-device__tile--selected' : ''}`}
                onClick={() => onDeviceChange(d.id)}
              >
                <span className="pcp-name-device__tile-emoji" aria-hidden="true">{d.emoji}</span>
                <span className="pcp-name-device__tile-name">{d.name}</span>
                <span className="pcp-name-device__tile-desc">{d.desc}</span>
                {device === d.id && (
                  <span className="pcp-name-device__tile-check" aria-hidden="true">&#10003;</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingScreen>
  );
}

export default ScreenNameDevice;
