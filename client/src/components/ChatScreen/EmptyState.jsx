import React, { useMemo } from 'react';
import SuggestionChip from './SuggestionChip';
import './EmptyState.css';

/**
 * Pool of suggestion chips. On each render, 5 are randomly selected.
 * This keeps the empty state fresh and exposes more skill categories.
 */
const SUGGESTION_POOL = [
  { icon: '\uD83D\uDCCC', label: 'How do I send an email?' },
  { icon: '\uD83D\uDCDE', label: 'How do I video call my family?' },
  { icon: '\uD83D\uDCF7', label: 'How do I find my photos?' },
  { icon: '\uD83D\uDCE8', label: 'How do I read my email?' },
  { icon: '\uD83D\uDCC2', label: 'How do I organize my inbox?' },
  { icon: '\uD83C\uDFA5', label: 'How do I video call on Zoom?' },
  { icon: '\uD83D\uDCF6', label: 'How do I connect to Wi-Fi?' },
  { icon: '\uD83D\uDDA8\uFE0F', label: 'How do I print something?' },
  { icon: '\uD83D\uDCCB', label: 'How do I copy and paste?' },
  { icon: '\uD83D\uDD0D', label: 'How do I make text bigger?' },
  { icon: '\uD83D\uDCBE', label: 'How do I save a file?' },
  { icon: '\uD83D\uDD12', label: 'How do I change my password?' },
  { icon: '\uD83D\uDCF1', label: 'How do I use my phone with my computer?' },
  { icon: '\uD83C\uDF10', label: 'How do I search the internet safely?' },
  { icon: '\uD83D\uDEE1\uFE0F', label: 'How do I spot a scam email?' },
];

const CHIP_COUNT = 5;

/**
 * Fisher-Yates shuffle for picking random chips.
 * Uses a copy so the original pool is not mutated.
 */
function pickRandom(pool, count) {
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/**
 * EmptyState -- Shown when there are no messages in the chat.
 * Displays mascot circle, heading, subtitle, and 5 randomly-selected
 * suggestion chips drawn from a pool of ~15 options.
 *
 * @param {{ onSendMessage: (text: string) => void }} props
 */
function EmptyState({ onSendMessage }) {
  const chips = useMemo(() => pickRandom(SUGGESTION_POOL, CHIP_COUNT), []);

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
        {chips.map((s) => (
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
