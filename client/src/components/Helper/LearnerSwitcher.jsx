import React, { useCallback, useEffect, useRef } from 'react';
import './LearnerSwitcher.css';

/**
 * LearnerSwitcher -- Bottom sheet triggered by tapping learner name in top bar.
 *
 * Lists all paired learners with their status pills.
 * Tap to switch context.
 *
 * Props:
 *   isOpen          - boolean
 *   onClose         - () => void
 *   learners        - [{ id, name, status, statusLabel }]
 *   activelearnerId - string
 *   onSelect        - (learnerId) => void
 */

function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusDotClass(status) {
  switch (status) {
    case 'online':
    case 'learning':
      return 'pcp-learner-switcher__status-dot--online';
    case 'sleeping':
      return 'pcp-learner-switcher__status-dot--sleeping';
    default:
      return 'pcp-learner-switcher__status-dot--offline';
  }
}

function LearnerSwitcher({
  isOpen,
  onClose,
  learners = [],
  activeLearnerId,
  onSelect,
}) {
  const sheetRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Close on overlay click
  const handleOverlayClick = useCallback(
    (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSelect = useCallback(
    (learnerId) => {
      onSelect(learnerId);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="pcp-learner-switcher__overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Switch learner"
    >
      <div className="pcp-learner-switcher__sheet" ref={sheetRef}>
        <div className="pcp-learner-switcher__handle">
          <div className="pcp-learner-switcher__handle-bar" />
        </div>
        <div className="pcp-learner-switcher__header">Switch learner</div>
        <div className="pcp-learner-switcher__list" role="listbox" aria-label="Available learners">
          {learners.map((learner) => (
            <button
              key={learner.id}
              className={`pcp-learner-switcher__item${
                learner.id === activeLearnerId ? ' pcp-learner-switcher__item--active' : ''
              }`}
              onClick={() => handleSelect(learner.id)}
              role="option"
              aria-selected={learner.id === activeLearnerId}
              aria-label={`Switch to ${learner.name}`}
            >
              <div className="pcp-learner-switcher__item-avatar" aria-hidden="true">
                {getInitials(learner.name)}
              </div>
              <div className="pcp-learner-switcher__item-info">
                <div className="pcp-learner-switcher__item-name">{learner.name}</div>
                <div className="pcp-learner-switcher__item-status">
                  <span
                    className={`pcp-learner-switcher__status-dot ${getStatusDotClass(learner.status)}`}
                    aria-hidden="true"
                  />
                  <span>{learner.statusLabel || learner.status || 'Offline'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LearnerSwitcher;
