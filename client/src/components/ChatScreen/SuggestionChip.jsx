import React from 'react';
import './SuggestionChip.css';

/**
 * SuggestionChip -- empty-state suggestion button.
 * Tap fills the textarea and auto-submits.
 *
 * @param {{ icon: string, label: string, onTap: () => void }} props
 */
function SuggestionChip({ icon, label, onTap }) {
  return (
    <button
      type="button"
      className="pcp-chip"
      onClick={onTap}
      aria-label={label}
    >
      <span className="pcp-chip__icon" aria-hidden="true">{icon}</span>
      <span className="pcp-chip__label">{label}</span>
    </button>
  );
}

export default SuggestionChip;
