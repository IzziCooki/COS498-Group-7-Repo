import React from 'react';
import BottomSheet from '../Overlays/BottomSheet';
import './TextSizePicker.css';

/**
 * TextSizePicker — Bottom sheet with 3 text-size options.
 * Applies immediately via the useTextSize hook value.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   textSize: 'default' | 'larger' | 'largest',
 *   onChangeSize: (size: string) => void,
 * }} props
 */

const OPTIONS = [
  {
    value: 'default',
    label: 'Default',
    preview: 'Text looks like this',
  },
  {
    value: 'larger',
    label: 'Larger',
    preview: 'Text looks like this',
  },
  {
    value: 'largest',
    label: 'Largest',
    preview: 'Text looks like this',
  },
];

function TextSizePicker({ open, onClose, textSize, onChangeSize }) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Make text bigger"
      labelledBy="pcp-text-size-title"
    >
      <div
        className="pcp-text-size-picker"
        role="radiogroup"
        aria-label="Text size options"
      >
        {OPTIONS.map((opt) => {
          const isActive = textSize === opt.value;
          const optionClass = [
            'pcp-text-size-picker__option',
            isActive ? 'pcp-text-size-picker__option--active' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={opt.value}
              className={optionClass}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${opt.label} text size`}
              onClick={() => onChangeSize(opt.value)}
            >
              <span className="pcp-text-size-picker__radio">
                <span className="pcp-text-size-picker__radio-dot" />
              </span>
              <span className="pcp-text-size-picker__label-group">
                <span
                  className={`pcp-text-size-picker__label pcp-text-size-picker__label--${opt.value}`}
                >
                  {opt.label}
                </span>
                <span
                  className={`pcp-text-size-picker__preview pcp-text-size-picker__preview--${opt.value}`}
                >
                  {opt.preview}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

export default TextSizePicker;
