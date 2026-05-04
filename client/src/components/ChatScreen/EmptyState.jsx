import React from 'react';
import SuggestionChip from './SuggestionChip';
import './EmptyState.css';

/**
 * Suggestion categories with examples relevant to elderly users.
 * Each category maps to real skills and features in the system.
 */
const CATEGORIES = [
  {
    heading: 'Email',
    items: [
      { icon: '\uD83D\uDCE7', label: 'How do I send an email?' },
      { icon: '\uD83D\uDCE8', label: 'How do I read my email?' },
      { icon: '\u2709\uFE0F', label: 'How do I reply to an email?' },
      { icon: '\uD83D\uDCCE', label: 'How do I attach a photo to an email?' },
      { icon: '\uD83D\uDD0D', label: 'How do I find an old email?' },
      { icon: '\uD83D\uDCC2', label: 'How do I organize my inbox?' },
    ],
  },
  {
    heading: 'Video calls',
    items: [
      { icon: '\uD83D\uDCDE', label: 'How do I video call my grandchildren?' },
      { icon: '\uD83C\uDFA5', label: 'How do I use Zoom?' },
      { icon: '\uD83D\uDCF1', label: 'How do I FaceTime someone?' },
      { icon: '\uD83D\uDCBB', label: 'How do I use Skype?' },
      { icon: '\uD83E\uDD1D', label: 'How do I use Microsoft Teams?' },
    ],
  },
  {
    heading: 'Everyday tasks',
    items: [
      { icon: '\uD83D\uDDA8\uFE0F', label: 'How do I print something?' },
      { icon: '\uD83D\uDCCB', label: 'How do I copy and paste?' },
      { icon: '\uD83D\uDCF7', label: 'How do I find and share my photos?' },
      { icon: '\uD83D\uDCBE', label: 'How do I save a file?' },
      { icon: '\uD83D\uDCF8', label: 'How do I take a screenshot?' },
      { icon: '\uD83D\uDD0E', label: 'How do I make the text bigger on my screen?' },
    ],
  },
  {
    heading: 'Internet and Wi-Fi',
    items: [
      { icon: '\uD83D\uDCF6', label: 'How do I connect to Wi-Fi?' },
      { icon: '\uD83C\uDF10', label: 'How do I search the internet?' },
      { icon: '\u2B50', label: 'How do I save a website I like?' },
    ],
  },
  {
    heading: 'Staying safe',
    items: [
      { icon: '\uD83D\uDEE1\uFE0F', label: 'How do I spot a scam?' },
      { icon: '\uD83D\uDD12', label: 'How do I create a strong password?' },
      { icon: '\u26A0\uFE0F', label: 'Someone called saying my computer has a virus. Is it real?' },
      { icon: '\uD83D\uDC40', label: 'Is this email safe to open?' },
    ],
  },
  {
    heading: 'Fixing problems',
    items: [
      { icon: '\uD83D\uDC22', label: 'My computer is running slowly' },
      { icon: '\uD83D\uDCF6', label: 'My internet is not working' },
      { icon: '\uD83D\uDD0B', label: 'My battery is draining fast' },
      { icon: '\u274C', label: 'A program won\'t open or keeps crashing' },
      { icon: '\uD83D\uDCBF', label: 'I\'m running out of storage space' },
      { icon: '\uD83D\uDD04', label: 'How do I restart my computer?' },
    ],
  },
];

/**
 * EmptyState -- Shown when there are no messages in the chat.
 * Displays mascot, heading, and a scrollable categorized list of
 * things the user can ask. Tapping a suggestion sends it as a message.
 */
function EmptyState({ onSendMessage }) {
  return (
    <div className="pcp-empty">
      <div className="pcp-empty__mascot" aria-hidden="true">
        <span className="pcp-empty__mascot-text">PC</span>
      </div>
      <h2 className="pcp-empty__heading">Hi, I'm PC Pal</h2>
      <p className="pcp-empty__subtitle">
        I can help you with your computer, phone, or tablet.
        Tap any question below, or type your own.
      </p>
      <div className="pcp-empty__scroll">
        {CATEGORIES.map((cat) => (
          <div key={cat.heading} className="pcp-empty__category">
            <p className="pcp-empty__category-heading">{cat.heading}</p>
            <div className="pcp-empty__chips">
              {cat.items.map((s) => (
                <SuggestionChip
                  key={s.label}
                  icon={s.icon}
                  label={s.label}
                  onTap={() => onSendMessage(s.label)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmptyState;
