import React, { useState } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import './FamilyDashboard.css';

function SkillBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="dash-skill-bar">
      <div className="dash-skill-bar__fill" style={{ width: `${pct}%` }} />
      <span className="dash-skill-bar__label">{completed} / {total} skills</span>
    </div>
  );
}

function SafetyBadge({ type }) {
  if (type === 'emergency') return <span className="dash-safety-badge dash-safety-badge--emergency">Emergency</span>;
  if (type === 'scam' || type === 'scam_question') return <span className="dash-safety-badge dash-safety-badge--scam">Scam Alert</span>;
  return <span className="dash-safety-badge">{type}</span>;
}

function FamilyDashboard({ buddyPairs, currentUserId, onBack }) {
  const [selectedPairId, setSelectedPairId] = useState(
    buddyPairs.length > 0 ? buddyPairs[0].id : null
  );
  const selectedPair = buddyPairs.find(p => p.id === selectedPairId);

  // Determine who the learner is (the other person in the pair)
  const _learnerId = selectedPair
    ? (selectedPair.learner_id === currentUserId ? selectedPair.helper_id : selectedPair.learner_id)
    : null;
  void _learnerId; // used in future dashboard features
  const learnerName = selectedPair
    ? (selectedPair.learner_id === currentUserId ? selectedPair.helper_name : selectedPair.learner_name)
    : null;

  const { data, isLoading, error, refresh } = useDashboard(selectedPairId);

  if (buddyPairs.length === 0) {
    return (
      <div className="dash">
        <div className="dash__header">
          <button className="dash__back" onClick={onBack}>Back to Chat</button>
          <h1 className="dash__title">Family Dashboard</h1>
        </div>
        <div className="dash__empty">
          <h2>No Connections Yet</h2>
          <p>Connect with a family member or friend using the Buddy button in the header to see their progress here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <div className="dash__header">
        <button className="dash__back" onClick={onBack}>Back to Chat</button>
        <h1 className="dash__title">Family Dashboard</h1>
        {buddyPairs.length > 1 && (
          <select
            className="dash__pair-select"
            value={selectedPairId || ''}
            onChange={e => setSelectedPairId(e.target.value)}
          >
            {buddyPairs.map(p => {
              const name = p.learner_id === currentUserId ? p.helper_name : p.learner_name;
              return <option key={p.id} value={p.id}>{name}</option>;
            })}
          </select>
        )}
        <button className="dash__refresh" onClick={refresh} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="dash__error">{error}</div>}

      {isLoading && !data && (
        <div className="dash__loading">Loading dashboard for {learnerName}...</div>
      )}

      {data && (
        <div className="dash__grid">
          {/* Profile Card */}
          <div className="dash-card dash-card--profile">
            <div className="dash-card__icon">
              {data.learner.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="dash-card__name">{data.learner.name}</h2>
              <p className="dash-card__detail">{data.learner.osType} user</p>
              <p className="dash-card__detail">
                Comfort level: <strong>{data.learner.comfortLevel}/5</strong>
              </p>
              {data.learner.goalSummary && (
                <p className="dash-card__goal">{data.learner.goalSummary}</p>
              )}
            </div>
          </div>

          {/* Skill Progress */}
          <div className="dash-card">
            <h3 className="dash-card__title">Skill Progress</h3>
            <SkillBar
              completed={data.skills.completed.length}
              total={data.skills.totalAvailable}
            />
            {data.skills.completed.length > 0 && (
              <ul className="dash-skill-list">
                {data.skills.completed.slice(-6).map((s, i) => (
                  <li key={i} className="dash-skill-list__item">
                    <span className="dash-skill-list__check">&#10003;</span>
                    <span>{s.skill}</span>
                    <span className="dash-skill-list__date">
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {data.skills.completed.length === 0 && (
              <p className="dash-card__empty">No skills completed yet — they're just getting started!</p>
            )}
            {data.skills.next && (
              <div className="dash-next-skill">
                <strong>Next up:</strong> {data.skills.next.skill}
                {data.skills.next.reason && <span> — {data.skills.next.reason}</span>}
              </div>
            )}
          </div>

          {/* Safety Alerts */}
          <div className={`dash-card ${data.safety.events.length > 0 || data.safety.scamChecks.length > 0 ? 'dash-card--alert' : ''}`}>
            <h3 className="dash-card__title">Safety Alerts</h3>
            {data.safety.events.length === 0 && data.safety.scamChecks.length === 0 ? (
              <div className="dash-card__safe">
                <span className="dash-card__safe-icon">&#10003;</span>
                No safety concerns detected
              </div>
            ) : (
              <ul className="dash-safety-list">
                {data.safety.events.map((e, i) => (
                  <li key={'s' + i} className="dash-safety-list__item">
                    <SafetyBadge type={e.type} />
                    <span className="dash-safety-list__text">
                      {e.trigger}
                    </span>
                    <span className="dash-safety-list__date">
                      {new Date(e.date).toLocaleDateString()}
                    </span>
                  </li>
                ))}
                {data.safety.scamChecks.map((s, i) => (
                  <li key={'sc' + i} className="dash-safety-list__item">
                    <SafetyBadge type="scam" />
                    <span className="dash-safety-list__text">
                      {s.summary}
                      {s.riskLevel && <em> (Risk: {s.riskLevel})</em>}
                    </span>
                    <span className="dash-safety-list__date">
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Conversations */}
          <div className="dash-card">
            <h3 className="dash-card__title">
              Recent Conversations
              <span className="dash-card__count">{data.conversations.total} total</span>
            </h3>
            {data.conversations.recent.length > 0 ? (
              <ul className="dash-conv-list">
                {data.conversations.recent.map(conv => (
                  <li key={conv.id} className="dash-conv-list__item">
                    <div className="dash-conv-list__top">
                      <span className={`dash-conv-list__status dash-conv-list__status--${conv.status}`}>
                        {conv.status}
                      </span>
                      <span className="dash-conv-list__msgs">{conv.messageCount} messages</span>
                      {conv.rating && (
                        <span className="dash-conv-list__rating">
                          {'★'.repeat(conv.rating)}{'☆'.repeat(5 - conv.rating)}
                        </span>
                      )}
                    </div>
                    {conv.preview && (
                      <p className="dash-conv-list__preview">{conv.preview}</p>
                    )}
                    <span className="dash-conv-list__date">
                      {new Date(conv.startedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dash-card__empty">No conversations yet.</p>
            )}
          </div>

          {/* Needs Help / Struggles */}
          {(data.struggles.length > 0 || data.helpRequests.length > 0) && (
            <div className="dash-card dash-card--help">
              <h3 className="dash-card__title">
                {data.learner.name} might need help with...
              </h3>
              {data.helpRequests.length > 0 && (
                <ul className="dash-help-list">
                  {data.helpRequests.map(h => (
                    <li key={h.id} className="dash-help-list__item dash-help-list__item--request">
                      <span className="dash-help-list__icon">?</span>
                      <div>
                        <p className="dash-help-list__text">{h.question}</p>
                        {h.context_summary && (
                          <p className="dash-help-list__context">{h.context_summary}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {data.struggles.length > 0 && (
                <ul className="dash-help-list">
                  {data.struggles.map((s, i) => (
                    <li key={i} className="dash-help-list__item">
                      <span className="dash-help-list__icon">!</span>
                      <div>
                        <p className="dash-help-list__text">{s.content}</p>
                        <span className="dash-help-list__date">
                          {new Date(s.date).toLocaleDateString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Shared Progress */}
          {data.progressShares.length > 0 && (
            <div className="dash-card">
              <h3 className="dash-card__title">Shared Milestones</h3>
              <ul className="dash-milestone-list">
                {data.progressShares.slice(0, 8).map(ps => (
                  <li key={ps.id} className="dash-milestone-list__item">
                    <span className="dash-milestone-list__icon">&#127881;</span>
                    <span className="dash-milestone-list__text">{ps.message}</span>
                    <span className="dash-milestone-list__date">
                      {new Date(ps.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback Summary */}
          {data.feedback.count > 0 && (
            <div className="dash-card">
              <h3 className="dash-card__title">Session Satisfaction</h3>
              <div className="dash-feedback">
                <div className="dash-feedback__avg">
                  <span className="dash-feedback__number">
                    {Number(data.feedback.average_rating).toFixed(1)}
                  </span>
                  <span className="dash-feedback__label">avg rating</span>
                </div>
                <span className="dash-feedback__count">
                  across {data.feedback.count} rated sessions
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FamilyDashboard;
