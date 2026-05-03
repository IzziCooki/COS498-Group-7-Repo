import React from 'react';
import './SettingsRow.css';

/**
 * SettingsRow — Reusable Me-tab row.
 *
 * Three modes:
 *   1. Navigation: icon + label + chevron, onClick fires.
 *   2. Toggle:     icon + label + switch, onToggle fires.
 *   3. Custom:     icon + label + trailing ReactNode, onClick fires.
 *
 * @param {{
 *   icon: string,                     // emoji or single character
 *   label: string,
 *   onClick?: () => void,
 *   toggle?: boolean,                 // if defined, renders toggle switch
 *   onToggle?: (next: boolean) => void,
 *   trailing?: React.ReactNode,       // custom trailing element
 *   ariaLabel?: string,               // override accessible label
 * }} props
 */
function SettingsRow({
  icon,
  label,
  onClick,
  toggle,
  onToggle,
  trailing,
  ariaLabel,
}) {
  const hasToggle = typeof toggle === 'boolean';
  const isNavigation = !hasToggle && !trailing;

  // Toggle rows render as a div with an embedded toggle button
  if (hasToggle) {
    return (
      <div
        className="pcp-settings-row pcp-settings-row--static"
        role="group"
        aria-label={ariaLabel || label}
      >
        <span className="pcp-settings-row__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="pcp-settings-row__label">{label}</span>
        <div className="pcp-settings-row__trailing">
          <button
            className="pcp-settings-row__toggle"
            type="button"
            role="switch"
            aria-checked={toggle}
            aria-label={label}
            onClick={() => onToggle?.(!toggle)}
          >
            <span className="pcp-settings-row__toggle-knob" />
          </button>
        </div>
      </div>
    );
  }

  // Navigation or custom-trailing rows render as a button
  return (
    <button
      className="pcp-settings-row"
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
    >
      <span className="pcp-settings-row__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="pcp-settings-row__label">{label}</span>
      <div className="pcp-settings-row__trailing">
        {trailing || null}
        {isNavigation && (
          <span className="pcp-settings-row__chevron" aria-hidden="true">
            &#x25B8;
          </span>
        )}
      </div>
    </button>
  );
}

export default SettingsRow;
