import React from 'react';
import './SideRail.css';

/**
 * SideRail — Tablet/desktop side rail.
 *
 * - Collapsed (64px): icon-only vertical nav matching tab bar icons
 * - Expanded (260px): icons + labels
 * - Toggle button to expand/collapse
 * - On tablet: collapsed by default
 * - On desktop: expanded by default
 */

// ── Inline SVG icons (same as BottomTabBar) ──

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const HelperIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SessionsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const ToolsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const SandboxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2v6" />
    <path d="M12 22v-6" />
    <path d="M4.93 4.93l4.24 4.24" />
    <path d="M14.83 14.83l4.24 4.24" />
    <path d="M2 12h6" />
    <path d="M22 12h-6" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CollapseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// Tab definitions per role
const LEARNER_ITEMS = [
  { id: 'chat',    label: 'Chat',    path: '/',         Icon: ChatIcon    },
  { id: 'sandbox', label: 'Sandbox', path: '/sandbox',  Icon: SandboxIcon },
  { id: 'history', label: 'History', path: '/history',  Icon: HistoryIcon },
  { id: 'helper',  label: 'Helper',  path: '/helper',   Icon: HelperIcon  },
  { id: 'me',      label: 'Me',      path: '/me',       Icon: MeIcon      },
];

const HELPER_ITEMS = [
  { id: 'helper-home',     label: 'Home',     path: '/helper/home',     Icon: HomeIcon     },
  { id: 'helper-sessions', label: 'Sessions', path: '/helper/sessions', Icon: SessionsIcon },
  { id: 'helper-tools',    label: 'Tools',    path: '/helper/tools',    Icon: ToolsIcon    },
  { id: 'helper-me',       label: 'Me',       path: '/helper/me',       Icon: MeIcon       },
];

function SideRail({ expanded, onToggle, navigate, currentView, role }) {
  const items = role === 'helper' ? HELPER_ITEMS : LEARNER_ITEMS;

  return (
    <nav
      className={[
        'pcp-side-rail',
        expanded ? 'pcp-side-rail--expanded' : 'pcp-side-rail--collapsed',
        role === 'helper' ? 'pcp-side-rail--helper' : '',
      ].filter(Boolean).join(' ')}
      aria-label="Main navigation"
    >
      <div className="pcp-side-rail__nav" role="tablist">
        {items.map((item) => {
          const isActive = currentView === item.id || (item.id === 'chat' && currentView === 'chat');
          const ItemIcon = item.Icon;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              className={[
                'pcp-side-rail__item',
                isActive ? 'pcp-side-rail__item--active' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => navigate(item.path)}
              title={expanded ? undefined : item.label}
            >
              <span className="pcp-side-rail__item-icon">
                <ItemIcon />
              </span>
              <span className="pcp-side-rail__item-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <button
        className="pcp-side-rail__toggle"
        onClick={onToggle}
        aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
      >
        <CollapseIcon />
        <span className="pcp-side-rail__toggle-label">
          {expanded ? 'Collapse' : ''}
        </span>
      </button>
    </nav>
  );
}

export default SideRail;
