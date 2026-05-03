import React from 'react';
import BottomSheet from '../Overlays/BottomSheet';
import './ThemePicker.css';

/**
 * ThemePicker — Bottom sheet with 3 theme options: light, dark, system.
 * Applies immediately via useTheme hook.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   theme: 'light' | 'dark' | 'system',
 *   onChangeTheme: (theme: string) => void,
 * }} props
 */

const OPTIONS = [
  { value: 'light',  label: 'Light',  icon: '\u2600\uFE0F' },   /* sun emoji */
  { value: 'dark',   label: 'Dark',   icon: '\uD83C\uDF19' },   /* crescent moon */
  { value: 'system', label: 'System', icon: '\uD83D\uDCBB' },   /* laptop */
];

function ThemePicker({ open, onClose, theme, onChangeTheme }) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Light or dark"
      labelledBy="pcp-theme-picker-title"
    >
      <div
        className="pcp-theme-picker"
        role="radiogroup"
        aria-label="Theme options"
      >
        {OPTIONS.map((opt) => {
          const isActive = theme === opt.value;
          const optionClass = [
            'pcp-theme-picker__option',
            isActive ? 'pcp-theme-picker__option--active' : '',
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
              aria-label={`${opt.label} theme`}
              onClick={() => onChangeTheme(opt.value)}
            >
              <span className="pcp-theme-picker__icon" aria-hidden="true">
                {opt.icon}
              </span>
              <span className="pcp-theme-picker__label">{opt.label}</span>
              <span className="pcp-theme-picker__radio">
                <span className="pcp-theme-picker__radio-dot" />
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

export default ThemePicker;
