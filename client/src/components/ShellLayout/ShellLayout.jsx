import React, { useState } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useRole } from '../../contexts/RoleContext';
import TopBar from './TopBar';
import BottomTabBar from './BottomTabBar';
import SideRail from './SideRail';
import ArtifactPanel from './ArtifactPanel';
import LearnerSwitcher from '../Helper/LearnerSwitcher';
import './ShellLayout.css';

/**
 * ShellLayout -- The main responsive container.
 *
 * Uses CSS Grid with named template areas.
 *   Phone:   top-bar + main + tab-bar (vertical stack)
 *   Tablet:  top-bar + (side-rail | main)
 *   Desktop: top-bar + (side-rail | main | artifact-panel)
 *
 * Layout switching is CSS class-based (media queries), NOT JS-driven.
 * The breakpoint hook is only used for conditional rendering of shell
 * sub-components (tab bar vs side rail), not for layout itself.
 */
function ShellLayout({ children, title, onBack, navigate, currentView }) {
  const breakpoint = useBreakpoint();
  const { role, activeLearner, learners, switchLearner } = useRole();
  const [railExpanded, setRailExpanded] = useState(breakpoint === 'desktop');
  const [artifactOpen] = useState(false); // Will be connected in Phase 4
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const classNames = [
    'pcp-shell',
    `pcp-shell--${breakpoint}`,
    `pcp-shell--${role}`,
    breakpoint === 'tablet' && railExpanded ? 'pcp-shell--rail-expanded' : '',
    breakpoint === 'desktop' && !railExpanded ? 'pcp-shell--rail-collapsed' : '',
    breakpoint === 'desktop' && artifactOpen ? 'pcp-shell--artifact-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} data-accent={role === 'helper' ? 'helper' : 'primary'}>
      {/* Skip links for keyboard navigation */}
      <a href="#main-content" className="skip-link">Skip to chat</a>
      <a href="#pcp-chat-input" className="skip-link">Skip to input</a>

      <div className="pcp-shell__topbar">
        <TopBar
          title={title}
          onBack={onBack}
          breakpoint={breakpoint}
          onMenuToggle={() => setRailExpanded(prev => !prev)}
          showMenuToggle={breakpoint !== 'phone'}
          role={role}
          activeLearnerName={activeLearner?.name}
          onLearnerSwitcherToggle={() => setSwitcherOpen(true)}
          hasMultipleLearners={learners.length > 1}
          onInfoTap={() => setInfoOpen(true)}
        />
      </div>

      {breakpoint !== 'phone' && (
        <div className="pcp-shell__rail">
          <SideRail
            expanded={railExpanded}
            onToggle={() => setRailExpanded(prev => !prev)}
            navigate={navigate}
            currentView={currentView}
            role={role}
            breakpoint={breakpoint}
          />
        </div>
      )}

      <main id="main-content" className="pcp-shell__main">
        {children}
      </main>

      {breakpoint === 'desktop' && (
        <div className="pcp-shell__artifact">
          <ArtifactPanel isOpen={artifactOpen} />
        </div>
      )}

      {breakpoint === 'phone' && (
        <div className="pcp-shell__tabbar">
          <BottomTabBar
            navigate={navigate}
            currentView={currentView}
            role={role}
          />
        </div>
      )}

      {/* Learner Switcher overlay (helper role only) */}
      {role === 'helper' && (
        <LearnerSwitcher
          isOpen={switcherOpen}
          onClose={() => setSwitcherOpen(false)}
          learners={learners}
          activeLearnerId={activeLearner?.id}
          onSelect={switchLearner}
        />
      )}

      {/* About PC Pal info overlay */}
      {infoOpen && (
        <div
          className="pcp-info-overlay__backdrop"
          onClick={() => setInfoOpen(false)}
          aria-hidden="true"
        >
          <div
            className="pcp-info-overlay__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pcp-info-overlay-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pcp-info-overlay__header">
              <h2 id="pcp-info-overlay-title" className="pcp-info-overlay__title">
                What PC Pal Can Help With
              </h2>
              <button
                className="pcp-top-bar__btn"
                onClick={() => setInfoOpen(false)}
                aria-label="Close"
                type="button"
              >
                &#10005;
              </button>
            </div>

            <div className="pcp-info-overlay__body">
              <div className="pcp-info-overlay__section">
                <p className="pcp-info-overlay__section-heading">I can:</p>
                <ul className="pcp-info-overlay__list">
                  <li className="pcp-info-overlay__list-item">
                    <span className="pcp-info-overlay__icon pcp-info-overlay__icon--success" aria-hidden="true">&#10003;</span>
                    Answer your tech questions
                  </li>
                  <li className="pcp-info-overlay__list-item">
                    <span className="pcp-info-overlay__icon pcp-info-overlay__icon--success" aria-hidden="true">&#10003;</span>
                    Walk you through tasks step by step
                  </li>
                  <li className="pcp-info-overlay__list-item">
                    <span className="pcp-info-overlay__icon pcp-info-overlay__icon--success" aria-hidden="true">&#10003;</span>
                    Check your computer for problems
                  </li>
                  <li className="pcp-info-overlay__list-item">
                    <span className="pcp-info-overlay__icon pcp-info-overlay__icon--success" aria-hidden="true">&#10003;</span>
                    Find helpful videos and guides
                  </li>
                </ul>
              </div>

              <div className="pcp-info-overlay__section">
                <p className="pcp-info-overlay__section-heading">Less sure about:</p>
                <ul className="pcp-info-overlay__list">
                  <li className="pcp-info-overlay__list-item">
                    <span className="pcp-info-overlay__icon pcp-info-overlay__icon--warning" aria-hidden="true">?</span>
                    Advanced settings or registry changes
                  </li>
                  <li className="pcp-info-overlay__list-item">
                    <span className="pcp-info-overlay__icon pcp-info-overlay__icon--warning" aria-hidden="true">?</span>
                    Problems with specific apps I have not been trained on
                  </li>
                </ul>
              </div>

              <div className="pcp-info-overlay__section">
                <p className="pcp-info-overlay__section-heading">I will not:</p>
                <ul className="pcp-info-overlay__list">
                  <li className="pcp-info-overlay__list-item">
                    <span className="pcp-info-overlay__icon pcp-info-overlay__icon--danger" aria-hidden="true">&#10007;</span>
                    Click buttons or make changes for you &mdash; you stay in control
                  </li>
                  <li className="pcp-info-overlay__list-item">
                    <span className="pcp-info-overlay__icon pcp-info-overlay__icon--danger" aria-hidden="true">&#10007;</span>
                    Fix broken hardware
                  </li>
                  <li className="pcp-info-overlay__list-item">
                    <span className="pcp-info-overlay__icon pcp-info-overlay__icon--danger" aria-hidden="true">&#10007;</span>
                    Make phone calls or send messages for you
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShellLayout;
