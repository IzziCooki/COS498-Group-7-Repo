import React from 'react';
import './AccessibilityBar.css';

/**
 * AccessibilityBar — persistent top strip with quick-access toggles.
 *
 * Text size +/-, high-contrast, and read-aloud. Voice-input is exposed
 * separately on the message input bar; this component covers preferences
 * that affect the whole app rather than a single message.
 */
function AccessibilityBar({
  prefs,
  onCycleTextSize,
  onToggleHighContrast,
  onToggleReadAloud,
  speechSupported,
}) {
  const sizeLabel = {
    normal: 'Normal',
    large: 'Large',
    xlarge: 'Extra Large',
  }[prefs.textSize] || 'Normal';

  return (
    <div className="a11y-bar" role="region" aria-label="Accessibility controls">
      <span className="a11y-bar__label" aria-hidden="true">Accessibility</span>

      <div className="a11y-bar__group" role="group" aria-label="Text size">
        <button
          type="button"
          className="a11y-bar__btn"
          onClick={() => onCycleTextSize('down')}
          disabled={prefs.textSize === 'normal'}
          aria-label="Make text smaller"
          title="Smaller text"
        >
          A−
        </button>
        <span
          className="a11y-bar__readout"
          aria-live="polite"
          aria-label={`Text size is ${sizeLabel}`}
        >
          {sizeLabel}
        </span>
        <button
          type="button"
          className="a11y-bar__btn"
          onClick={() => onCycleTextSize('up')}
          disabled={prefs.textSize === 'xlarge'}
          aria-label="Make text bigger"
          title="Bigger text"
        >
          A+
        </button>
      </div>

      <button
        type="button"
        className={`a11y-bar__toggle ${prefs.highContrast ? 'a11y-bar__toggle--on' : ''}`}
        onClick={onToggleHighContrast}
        aria-pressed={prefs.highContrast}
        title="Toggle high-contrast colors"
      >
        High contrast: {prefs.highContrast ? 'On' : 'Off'}
      </button>

      {speechSupported && (
        <button
          type="button"
          className={`a11y-bar__toggle ${prefs.readAloud ? 'a11y-bar__toggle--on' : ''}`}
          onClick={onToggleReadAloud}
          aria-pressed={prefs.readAloud}
          title="Read PC Pal's replies aloud"
        >
          Read aloud: {prefs.readAloud ? 'On' : 'Off'}
        </button>
      )}
    </div>
  );
}

export default AccessibilityBar;
