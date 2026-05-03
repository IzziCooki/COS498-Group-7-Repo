import React, { useState, useRef, useCallback } from 'react';
import './BottomTabBar.css';

/**
 * BottomTabBar — Phone-only bottom tab bar.
 *
 * - 64px + safe-area-inset-bottom
 * - Icon-only (no labels) per spec decision
 * - Role-aware: learner gets Chat/History/Helper/Me; helper gets Home/Sessions/Tools/Me
 * - Active tab: filled icon + primary color
 * - role="tablist" with aria-selected and aria-label per icon
 * - Long-press shows tooltip with label (14px)
 */

// ── Inline SVG icons ──

// Chat = speech bubble
const ChatIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// History = clock
const HistoryIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {filled ? (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
    ) : (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    )}
  </svg>
);

// Helper = people
const HelperIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {filled ? (
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    ) : (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    )}
  </svg>
);

// Me = person
const MeIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {filled ? (
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    ) : (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    )}
  </svg>
);

// Home = house (helper role)
const HomeIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {filled ? (
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    ) : (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    )}
  </svg>
);

// Sessions = film (helper role)
const SessionsIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {filled ? (
      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
    ) : (
      <>
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
        <line x1="17" y1="17" x2="22" y2="17" />
      </>
    )}
  </svg>
);

// Tools = wrench (helper role)
const ToolsIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {filled ? (
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
    ) : (
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    )}
  </svg>
);

// Tab definitions per role
const LEARNER_TABS = [
  { id: 'chat',    label: 'Chat',    path: '/',        Icon: ChatIcon    },
  { id: 'history', label: 'History', path: '/history',  Icon: HistoryIcon },
  { id: 'helper',  label: 'Helper',  path: '/helper',   Icon: HelperIcon  },
  { id: 'me',      label: 'Me',      path: '/me',       Icon: MeIcon      },
];

const HELPER_TABS = [
  { id: 'helper-home',     label: 'Home',     path: '/helper/home',     Icon: HomeIcon     },
  { id: 'helper-sessions', label: 'Sessions', path: '/helper/sessions', Icon: SessionsIcon },
  { id: 'helper-tools',    label: 'Tools',    path: '/helper/tools',    Icon: ToolsIcon    },
  { id: 'helper-me',       label: 'Me',       path: '/helper/me',       Icon: MeIcon       },
];

function BottomTabBar({ navigate, currentView, role }) {
  const tabs = role === 'helper' ? HELPER_TABS : LEARNER_TABS;
  const [tooltipId, setTooltipId] = useState(null);
  const longPressTimer = useRef(null);

  const handleLongPressStart = useCallback((tabId) => {
    longPressTimer.current = setTimeout(() => {
      setTooltipId(tabId);
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Hide tooltip after a brief delay
    setTimeout(() => setTooltipId(null), 1200);
  }, []);

  const handleTabClick = useCallback((path) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setTooltipId(null);
    navigate(path);
  }, [navigate]);

  return (
    <nav className="pcp-tab-bar" role="tablist" aria-label="Main navigation">
      {tabs.map(({ id, label, path, Icon }) => {
        const isActive = currentView === id || (id === 'chat' && currentView === 'chat');
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            className={[
              'pcp-tab-bar__tab',
              isActive ? 'pcp-tab-bar__tab--active' : '',
              role === 'helper' ? 'pcp-tab-bar__tab--helper-role' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleTabClick(path)}
            onPointerDown={() => handleLongPressStart(id)}
            onPointerUp={handleLongPressEnd}
            onPointerLeave={handleLongPressEnd}
          >
            <Icon filled={isActive} />
            <span
              className={[
                'pcp-tab-bar__tooltip',
                tooltipId === id ? 'pcp-tab-bar__tooltip--visible' : '',
              ].join(' ')}
              role="tooltip"
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomTabBar;
