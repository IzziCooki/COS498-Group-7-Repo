import React from 'react';
import FullScreenOverlay from '../Overlays/FullScreenOverlay';
import './HowToUseGuide.css';

/**
 * HowToUseGuide — Simple content page explaining what PC Pal can do.
 * Uses content card pattern. Rendered in a FullScreenOverlay.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 * }} props
 */

const SECTIONS = [
  {
    title: 'Ask anything about your computer',
    cards: [
      {
        icon: '\uD83D\uDCAC',
        title: 'Type or speak your question',
        text: 'Just describe what you need help with in your own words. PC Pal will understand and guide you step by step.',
      },
      {
        icon: '\uD83D\uDCD6',
        title: 'Follow along with guides',
        text: 'When PC Pal creates a guide, tap on it to see each step with pictures. Go at your own pace.',
      },
    ],
  },
  {
    title: 'Get help from your helper',
    cards: [
      {
        icon: '\uD83D\uDC65',
        title: 'Your helper is there for you',
        text: 'If you get stuck, tap the Helper tab to call or message your helper. They can see what you need help with.',
      },
      {
        icon: '\uD83D\uDCDE',
        title: 'Video and voice calls',
        text: 'You can start a call with your helper right from PC Pal. They can walk you through tricky steps.',
      },
    ],
  },
  {
    title: 'Keep track of what you learn',
    cards: [
      {
        icon: '\uD83D\uDCDA',
        title: 'Your conversation history',
        text: 'Tap the History tab to see all your past conversations. You can go back and review anything you learned.',
      },
      {
        icon: '\uD83E\uDDE0',
        title: 'PC Pal remembers',
        text: 'PC Pal remembers what you have learned and what you find tricky. You can see and manage these memories in your Me tab.',
      },
    ],
  },
];

function HowToUseGuide({ open, onClose }) {
  return (
    <FullScreenOverlay
      open={open}
      onClose={onClose}
      title="How to use PC Pal"
      backLabel="Back"
      labelledBy="pcp-how-to-use-title"
    >
      <div className="pcp-how-to-use" role="article" aria-label="How to use PC Pal">
        <p className="pcp-how-to-use__intro">
          PC Pal is your friendly computer helper. Here is everything you can do.
        </p>

        {SECTIONS.map((section, si) => (
          <section
            key={si}
            className="pcp-how-to-use__section"
            aria-label={section.title}
          >
            <h3 className="pcp-how-to-use__section-title">{section.title}</h3>
            {section.cards.map((card, ci) => (
              <div key={ci} className="pcp-how-to-use__card">
                <span className="pcp-how-to-use__card-icon" aria-hidden="true">
                  {card.icon}
                </span>
                <h4 className="pcp-how-to-use__card-title">{card.title}</h4>
                <p className="pcp-how-to-use__card-text">{card.text}</p>
              </div>
            ))}
          </section>
        ))}

        <div className="pcp-how-to-use__tip" role="note">
          <p className="pcp-how-to-use__tip-text">
            <strong>Tip:</strong> You can always come back to this page from the Me tab.
            If you ever feel stuck, just ask PC Pal &quot;help me&quot; in the chat.
          </p>
        </div>
      </div>
    </FullScreenOverlay>
  );
}

export default HowToUseGuide;
