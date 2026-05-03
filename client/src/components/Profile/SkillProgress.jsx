import React, { useEffect, useState, useCallback } from 'react';
import FullScreenOverlay from '../Overlays/FullScreenOverlay';
import { useToast } from '../../hooks/useToast';
import './SkillProgress.css';

/**
 * SkillProgress -- Full-screen overlay showing skill learning progress.
 * Fetches from /api/users/:id/skills. Groups skills by status.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   userId: string | number,
 *   onSendMessage?: (text: string) => void,
 * }} props
 */

const STATUS_ORDER = ['due', 'in-progress', 'completed'];

const STATUS_LABELS = {
  'due': 'Due for review',
  'in-progress': 'In progress',
  'completed': 'Completed',
};

const STATUS_ICONS = {
  'due': '\u23F0',
  'in-progress': '\uD83D\uDCDD',
  'completed': '\u2705',
};

/* Suggested skills for users who have not tried them yet */
const SUGGESTED_SKILLS = [
  'Sending email',
  'Copy and paste',
  'Text size',
  'Video calling',
  'Finding photos',
  'Connecting to Wi-Fi',
  'Printing a document',
  'Organizing your inbox',
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SkillProgress({ open, onClose, userId, onSendMessage }) {
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast() || {};

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;

    async function fetchSkills() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${userId}/skills`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Failed to load skills (${res.status})`);
        const data = await res.json();
        if (!cancelled) {
          setSkills(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSkills();
    return () => { cancelled = true; };
  }, [open, userId]);

  const handlePractice = useCallback((skillName) => {
    if (onSendMessage) {
      onSendMessage(`I want to practice: ${skillName}`);
    }
    toast?.({ kind: 'success', text: `Starting practice: ${skillName}` });
    onClose();
  }, [onSendMessage, toast, onClose]);

  const handleStartLearning = useCallback((skillName) => {
    if (onSendMessage) {
      onSendMessage(`How do I ${skillName.toLowerCase()}?`);
    }
    toast?.({ kind: 'success', text: `Let's learn: ${skillName}` });
    onClose();
  }, [onSendMessage, toast, onClose]);

  // Group skills by status
  const grouped = {};
  for (const skill of skills) {
    const st = skill.status || 'in-progress';
    if (!grouped[st]) grouped[st] = [];
    grouped[st].push(skill);
  }

  const sortedGroups = STATUS_ORDER.filter((s) => grouped[s]?.length > 0);

  // Determine suggested skills (ones the user has not tried yet)
  const knownSkills = new Set(skills.map((s) => s.skill_name.toLowerCase()));
  const suggestions = SUGGESTED_SKILLS.filter(
    (s) => !knownSkills.has(s.toLowerCase())
  ).slice(0, 3);

  return (
    <FullScreenOverlay
      open={open}
      onClose={onClose}
      title="My learning progress"
      backLabel="Back"
      labelledBy="pcp-skill-progress-title"
    >
      <div className="pcp-skill-progress" role="region" aria-label="Your skill progress">
        {/* Loading */}
        {isLoading && (
          <div className="pcp-skill-progress__loading" role="status" aria-live="polite">
            <div className="pcp-skill-progress__spinner" />
            <span>Loading your skills...</span>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="pcp-skill-progress__error" role="alert">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && skills.length === 0 && suggestions.length === 0 && (
          <div className="pcp-skill-progress__empty">
            <span className="pcp-skill-progress__empty-icon" aria-hidden="true">
              {'\uD83D\uDCDA'}
            </span>
            <h3 className="pcp-skill-progress__empty-title">No skills yet</h3>
            <p className="pcp-skill-progress__empty-text">
              As you learn things with PC Pal, your progress will show up here.
            </p>
          </div>
        )}

        {/* Skill list grouped by status */}
        {!isLoading && !error && sortedGroups.map((status) => (
          <section
            key={status}
            className="pcp-skill-progress__group"
            aria-label={`${STATUS_LABELS[status]} skills`}
          >
            <h3 className="pcp-skill-progress__group-title">
              <span aria-hidden="true">{STATUS_ICONS[status]}</span>
              {' '}
              {STATUS_LABELS[status]}
            </h3>
            {grouped[status].map((skill) => (
              <div key={skill.skill_name} className="pcp-skill-progress__item">
                <div className="pcp-skill-progress__item-body">
                  <span className={`pcp-skill-progress__badge pcp-skill-progress__badge--${status}`}>
                    {STATUS_LABELS[status]}
                  </span>
                  <p className="pcp-skill-progress__name">
                    {skill.skill_name}
                  </p>
                  {skill.last_practiced && (
                    <span className="pcp-skill-progress__date">
                      Last practiced: {formatDate(skill.last_practiced)}
                    </span>
                  )}
                </div>
                {(status === 'completed' || status === 'due') && (
                  <button
                    className="pcp-skill-progress__action"
                    type="button"
                    onClick={() => handlePractice(skill.skill_name)}
                  >
                    Practice again
                  </button>
                )}
              </div>
            ))}
          </section>
        ))}

        {/* Suggested next skills */}
        {!isLoading && !error && suggestions.length > 0 && (
          <section
            className="pcp-skill-progress__group"
            aria-label="Suggested skills"
          >
            <h3 className="pcp-skill-progress__group-title">
              <span aria-hidden="true">{'\uD83D\uDCA1'}</span>
              {' '}
              Suggested next
            </h3>
            {suggestions.map((name) => (
              <div key={name} className="pcp-skill-progress__item">
                <div className="pcp-skill-progress__item-body">
                  <span className="pcp-skill-progress__badge pcp-skill-progress__badge--suggested">
                    New
                  </span>
                  <p className="pcp-skill-progress__name">{name}</p>
                </div>
                <button
                  className="pcp-skill-progress__action pcp-skill-progress__action--start"
                  type="button"
                  onClick={() => handleStartLearning(name)}
                >
                  Start learning
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </FullScreenOverlay>
  );
}

export default SkillProgress;
