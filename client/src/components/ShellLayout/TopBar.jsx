import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import './TopBar.css';

/**
 * TopBar -- Minimal 56px top bar.
 *
 * - Shows contextual title (depends on current view)
 * - Left: back arrow (when drilled in) or menu toggle (tablet/desktop)
 * - For helper role: shows "Helper mode" pill on left + learner name (tappable switcher)
 * - Right: overflow menu button
 */

// Inline SVG icons
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const OverflowIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

function TopBar({
  title,
  onBack,
  onMenuToggle,
  showMenuToggle,
  role,
  activeLearnerName,
  onLearnerSwitcherToggle,
  hasMultipleLearners,
  onInfoTap,
}) {
  const [theme, setTheme] = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="pcp-top-bar" role="banner">
      <div className="pcp-top-bar__left">
        {onBack ? (
          <button
            className="pcp-top-bar__btn"
            onClick={onBack}
            aria-label="Go back"
          >
            <BackIcon />
          </button>
        ) : showMenuToggle ? (
          <button
            className="pcp-top-bar__btn"
            onClick={onMenuToggle}
            aria-label="Toggle navigation menu"
          >
            <MenuIcon />
          </button>
        ) : null}

        {/* Helper-mode pill */}
        {role === 'helper' && (
          <span className="pcp-top-bar__role-pill" aria-label="Helper mode">
            Helper mode
          </span>
        )}
      </div>

      {role === 'helper' && activeLearnerName ? (
        <button
          className="pcp-top-bar__learner-name"
          onClick={onLearnerSwitcherToggle}
          aria-label={`Viewing ${activeLearnerName}. Tap to switch learner.`}
          aria-haspopup="dialog"
        >
          {activeLearnerName}
          {hasMultipleLearners && (
            <span className="pcp-top-bar__learner-caret" aria-hidden="true">
              &#9662;
            </span>
          )}
        </button>
      ) : (
        <h1 className="pcp-top-bar__title">
          {title || 'PC Pal'}
        </h1>
      )}

      <div className="pcp-top-bar__right">
        {role !== 'helper' && onInfoTap && (
          <button
            className="pcp-top-bar__btn"
            onClick={onInfoTap}
            aria-label="About PC Pal"
            title="About PC Pal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        )}
        <button
          className="pcp-top-bar__btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </button>
      </div>
    </header>
  );
}

export default TopBar;
