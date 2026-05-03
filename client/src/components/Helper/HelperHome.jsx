import React, { useMemo } from 'react';
import './HelperHome.css';

/**
 * HelperHome -- Helper dashboard (D5 section 2).
 *
 * Shows at a glance: learner status, alerts, open questions, progress,
 * and a link to the Sessions tab.
 *
 * Props:
 *   learner        - { id, name, status, lastChatAgo, localTime }
 *   alerts         - [{ id, title, preview, severity, timestamp }]
 *   questions      - [{ id, text, preview, timestamp }]
 *   progress       - { completed, total, completions: [{ name, done }] }
 *   onCall         - () => void
 *   onWatch        - () => void
 *   onAlertTap     - (alertId) => void
 *   onQuestionTap  - (questionId) => void
 *   onSeeAll       - () => void
 *   isLearnerInChat - boolean (enables Watch button)
 */
function HelperHome({
  learner,
  alerts = [],
  questions = [],
  progress = { completed: 0, total: 0, completions: [] },
  onCall,
  onWatch,
  onAlertTap,
  onQuestionTap,
  onSeeAll,
  isLearnerInChat = false,
}) {
  const initials = useMemo(() => {
    if (!learner?.name) return '??';
    return learner.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [learner?.name]);

  const statusDotClass = useMemo(() => {
    switch (learner?.status) {
      case 'online':
      case 'learning':
        return 'pcp-helper-home__status-dot--online';
      case 'sleeping':
        return 'pcp-helper-home__status-dot--sleeping';
      case 'needs-help':
        return 'pcp-helper-home__status-dot--needs-help';
      default:
        return 'pcp-helper-home__status-dot--offline';
    }
  }, [learner?.status]);

  const statusLabel = useMemo(() => {
    switch (learner?.status) {
      case 'learning':
        return 'Online \u00B7 learning right now';
      case 'online':
        return 'Online \u00B7 idle';
      case 'sleeping':
        return `Sleeping \u00B7 ${learner.localTime || ''}`;
      case 'needs-help':
        return 'Needs help \u00B7 open question';
      default:
        return `Offline \u00B7 last seen ${learner?.lastChatAgo || 'recently'}`;
    }
  }, [learner?.status, learner?.lastChatAgo, learner?.localTime]);

  const skillPct =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className="pcp-helper-home" role="region" aria-label="Helper dashboard">
      {/* ── Status Hero Card ─────────────────────────────────────── */}
      <section className="pcp-helper-home__hero" aria-label="Learner status">
        <div className="pcp-helper-home__hero-top">
          <div className="pcp-helper-home__avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="pcp-helper-home__info">
            <div className="pcp-helper-home__name">{learner?.name || 'Learner'}</div>
            <div className="pcp-helper-home__status-row">
              <span
                className={`pcp-helper-home__status-dot ${statusDotClass}`}
                aria-hidden="true"
              />
              <span>{statusLabel}</span>
            </div>
            {learner?.lastChatAgo && (
              <div className="pcp-helper-home__last-chat">
                Last chat: {learner.lastChatAgo} ago
              </div>
            )}
          </div>
        </div>

        <div className="pcp-helper-home__actions">
          <button
            className="pcp-btn pcp-btn--primary"
            onClick={onCall}
            aria-label={`Call ${learner?.name || 'learner'}`}
          >
            Call
          </button>
          <button
            className="pcp-btn pcp-btn--ghost"
            onClick={onWatch}
            disabled={!isLearnerInChat}
            aria-label={`Watch ${learner?.name || 'learner'}'s session`}
          >
            Watch session
          </button>
        </div>
      </section>

      {/* ── Alert Cards ──────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <button
          className="pcp-helper-home__card pcp-helper-home__card--alert"
          onClick={() => onAlertTap && onAlertTap(alerts[0].id)}
          aria-label={`${alerts.length} alert${alerts.length !== 1 ? 's' : ''}: ${alerts[0].title}`}
        >
          <span className="pcp-helper-home__card-icon" aria-hidden="true">
            !
          </span>
          <div className="pcp-helper-home__card-body">
            <div className="pcp-helper-home__card-title">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} from this week
            </div>
            <div className="pcp-helper-home__card-preview">
              {alerts[0].preview || alerts[0].title}
            </div>
          </div>
          <span className="pcp-helper-home__card-chevron" aria-hidden="true">
            &rsaquo;
          </span>
        </button>
      )}

      {/* ── Question Cards ───────────────────────────────────────── */}
      {questions.length > 0 && (
        <button
          className="pcp-helper-home__card pcp-helper-home__card--question"
          onClick={() => onQuestionTap && onQuestionTap(questions[0].id)}
          aria-label={`${questions.length} question${questions.length !== 1 ? 's' : ''} waiting: ${questions[0].text}`}
        >
          <span className="pcp-helper-home__card-icon" aria-hidden="true">
            ?
          </span>
          <div className="pcp-helper-home__card-body">
            <div className="pcp-helper-home__card-title">
              {questions.length} question{questions.length !== 1 ? 's' : ''} waiting
            </div>
            <div className="pcp-helper-home__card-preview">
              &ldquo;{questions[0].text}&rdquo;
            </div>
          </div>
          <span className="pcp-helper-home__card-chevron" aria-hidden="true">
            &rsaquo;
          </span>
        </button>
      )}

      {/* ── Progress Card ────────────────────────────────────────── */}
      <section className="pcp-helper-home__progress" aria-label="Learner progress">
        <div className="pcp-helper-home__progress-heading">Progress this week</div>
        <div className="pcp-helper-home__progress-label">Skills learned</div>
        <div
          className="pcp-helper-home__skill-bar"
          role="progressbar"
          aria-valuenow={progress.completed}
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-label={`${progress.completed} of ${progress.total} skills`}
        >
          <div
            className={`pcp-helper-home__skill-bar-fill${
              skillPct === 100 ? ' pcp-helper-home__skill-bar-fill--complete' : ''
            }`}
            style={{ width: `${skillPct}%` }}
          />
        </div>
        <div className="pcp-helper-home__skill-count">
          {progress.completed} of {progress.total}
        </div>

        {progress.completions.length > 0 && (
          <ul className="pcp-helper-home__completions">
            {progress.completions.map((item, i) => (
              <li key={i} className="pcp-helper-home__completion-item">
                {item.done ? (
                  <span className="pcp-helper-home__completion-check" aria-hidden="true">
                    &#10003;
                  </span>
                ) : (
                  <span className="pcp-helper-home__completion-progress" aria-hidden="true">
                    &#8987;
                  </span>
                )}
                <span className={item.done ? '' : 'pcp-helper-home__completion-progress'}>
                  {item.name}
                  {!item.done && ' (in progress)'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── See All Activity ─────────────────────────────────────── */}
      <button
        className="pcp-helper-home__see-all"
        onClick={onSeeAll}
        aria-label="See all activity"
      >
        <span>See all activity</span>
        <span aria-hidden="true">&rsaquo;</span>
      </button>
    </div>
  );
}

export default HelperHome;
