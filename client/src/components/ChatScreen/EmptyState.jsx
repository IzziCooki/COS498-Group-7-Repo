import React from 'react';
import SuggestionChip from './SuggestionChip';
import './EmptyState.css';

const DEFAULT_SUGGESTIONS = [
  { icon: '\uD83D\uDCCC', label: 'How do I send an email?' },
  { icon: '\uD83D\uDCDE', label: 'How do I video call my family?' },
  { icon: '\uD83D\uDCF7', label: 'How do I find my photos?' },
];

/**
 * EmptyState -- Shown when there are no messages in the chat.
 * Displays mascot circle, heading, subtitle, and 3 suggestion chips.
 *
 * @param {{ onSendMessage: (text: string) => void }} props
 */
function EmptyState({ onSendMessage }) {
  const handleChipTap = (label) => {
    onSendMessage(label);
  };

  return (
    <div className="pcp-empty">
      <div className="pcp-empty__mascot" aria-hidden="true">
        <span className="pcp-empty__mascot-text">PC</span>
      </div>
      <h2 className="pcp-empty__heading">Hi, I'm PC Pal</h2>
      <p className="pcp-empty__subtitle">
        Ask me anything about your computer.
      </p>
      <p className="pcp-empty__label">Some things you can ask:</p>
      <div className="pcp-empty__chips">
        {DEFAULT_SUGGESTIONS.map((s) => (
          <SuggestionChip
            key={s.label}
            icon={s.icon}
            label={s.label}
            onTap={() => handleChipTap(s.label)}
          />
        ))}
      </div>
    </div>
  );
}

export default EmptyState;
