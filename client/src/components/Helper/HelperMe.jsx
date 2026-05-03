import React, { useMemo } from 'react';
import './HelperMe.css';

/**
 * HelperMe -- Helper profile + settings (D5 section 9).
 *
 * Props:
 *   helperName       - string
 *   learners         - [{ id, name, relation, since, status }]
 *   onEditProfile    - () => void
 *   onManageLearner  - (learnerId) => void
 *   onAddLearner     - () => void
 *   onNavigateSetting - (settingId) => void
 */

const SETTINGS = [
  { id: 'notifications', icon: 'N',  label: 'Notification settings' },
  { id: 'quiet-hours',   icon: 'Q',  label: 'Quiet hours' },
  { id: 'text-size',     icon: 'T',  label: 'Make text bigger' },
  { id: 'all-settings',  icon: 'S',  label: 'All settings' },
  { id: 'guide',         icon: '?',  label: 'How to be a good helper' },
];

function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function HelperMe({
  helperName = 'Helper',
  learners = [],
  onEditProfile,
  onManageLearner,
  onAddLearner,
  onNavigateSetting,
}) {
  const helperInitials = useMemo(() => getInitials(helperName), [helperName]);
  const primaryLearner = learners[0];

  return (
    <div className="pcp-helper-me" role="region" aria-label="Helper profile">
      {/* ── Profile Card ────────────────────────────────────────── */}
      <section className="pcp-helper-me__profile" aria-label="Your profile">
        <div className="pcp-helper-me__avatar" aria-hidden="true">
          {helperInitials}
        </div>
        <div className="pcp-helper-me__name">{helperName}</div>
        <div className="pcp-helper-me__subtitle">
          {primaryLearner
            ? `Helper for ${primaryLearner.name}`
            : 'No learners paired yet'}
        </div>
        <button
          className="pcp-helper-me__edit-btn"
          onClick={onEditProfile}
          aria-label="Edit my profile"
        >
          Edit my profile
        </button>
      </section>

      {/* ── Who I Help ──────────────────────────────────────────── */}
      <section className="pcp-helper-me__section" aria-label="Who I help">
        <div className="pcp-helper-me__section-label">Who I help</div>

        {learners.map((learner) => (
          <button
            key={learner.id}
            className="pcp-helper-me__learner-card"
            onClick={() => onManageLearner && onManageLearner(learner.id)}
            aria-label={`Manage ${learner.name}`}
          >
            <div className="pcp-helper-me__learner-avatar" aria-hidden="true">
              {getInitials(learner.name)}
            </div>
            <div className="pcp-helper-me__learner-info">
              <div className="pcp-helper-me__learner-name">{learner.name}</div>
              <div className="pcp-helper-me__learner-relation">
                {learner.relation || ''}{learner.since ? ` \u00B7 since ${learner.since}` : ''}
              </div>
            </div>
            <span
              className={`pcp-helper-me__learner-status ${
                learner.status === 'online'
                  ? 'pcp-helper-me__learner-status--online'
                  : 'pcp-helper-me__learner-status--offline'
              }`}
              aria-label={learner.status === 'online' ? 'Online' : 'Offline'}
            />
            <span className="pcp-helper-me__learner-chevron" aria-hidden="true">
              &rsaquo;
            </span>
          </button>
        ))}

        <button
          className="pcp-helper-me__add-btn"
          onClick={onAddLearner}
          aria-label="Help someone else"
        >
          + Help someone else
        </button>
      </section>

      {/* ── Settings ────────────────────────────────────────────── */}
      <div className="pcp-helper-me__settings" role="list" aria-label="Settings">
        {SETTINGS.map((setting) => (
          <button
            key={setting.id}
            className="pcp-helper-me__setting-row"
            onClick={() => onNavigateSetting && onNavigateSetting(setting.id)}
            role="listitem"
            aria-label={setting.label}
          >
            <span className="pcp-helper-me__setting-icon" aria-hidden="true">
              {setting.icon}
            </span>
            <span className="pcp-helper-me__setting-label">{setting.label}</span>
            <span className="pcp-helper-me__setting-chevron" aria-hidden="true">
              &rsaquo;
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default HelperMe;
