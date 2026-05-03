import React, { useState, useMemo, useCallback } from 'react';
import './HelperSessions.css';

/**
 * HelperSessions -- Conversation history from helper's perspective (D5 section 3).
 *
 * Props:
 *   learnerName    - string
 *   conversations  - [{ id, title, preview, timestamp, starred }]
 *   questions      - [{ id, text, timestamp, status }]
 *   alerts         - [{ id, title, preview, timestamp, resolved }]
 *   onConversationTap - (id) => void
 *   onQuestionTap     - (id) => void
 *   onAlertTap        - (id) => void
 *   onReply           - (questionId) => void
 */

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'questions', label: 'Open questions' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'starred', label: '\u2605' },
];

function groupByDate(items) {
  const groups = {};
  for (const item of items) {
    const d = item.timestamp
      ? new Date(item.timestamp).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      : 'Unknown';

    const today = new Date();
    const itemDate = item.timestamp ? new Date(item.timestamp) : null;
    let label = d;
    if (itemDate) {
      const diff = Math.floor((today - itemDate) / 86400000);
      if (diff === 0) label = 'Today';
      else if (diff === 1) label = 'Yesterday';
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  return groups;
}

function HelperSessions({
  learnerName = 'Learner',
  conversations = [],
  questions = [],
  alerts = [],
  onConversationTap,
  onAlertTap,
  onReply,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // Merge all items into a single list, filtered
  const filteredItems = useMemo(() => {
    let items = [];

    if (activeFilter === 'all' || activeFilter === 'starred') {
      items = [
        ...conversations.map((c) => ({ ...c, _type: 'conversation' })),
        ...questions.map((q) => ({ ...q, _type: 'question', title: q.text })),
        ...alerts.map((a) => ({ ...a, _type: 'alert' })),
      ];
    } else if (activeFilter === 'questions') {
      items = questions.map((q) => ({ ...q, _type: 'question', title: q.text }));
    } else if (activeFilter === 'alerts') {
      items = alerts.map((a) => ({ ...a, _type: 'alert' }));
    }

    if (activeFilter === 'starred') {
      items = items.filter((i) => i.starred);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.preview && i.preview.toLowerCase().includes(q)) ||
          (i.text && i.text.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    items.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });

    return items;
  }, [conversations, questions, alerts, activeFilter, searchQuery]);

  const grouped = useMemo(() => groupByDate(filteredItems), [filteredItems]);

  return (
    <div className="pcp-helper-sessions" role="region" aria-label="Sessions">
      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="pcp-helper-sessions__search">
        <label htmlFor="pcp-helper-sessions-search" className="sr-only">
          Search {learnerName}&apos;s conversations
        </label>
        <input
          id="pcp-helper-sessions-search"
          className="pcp-helper-sessions__search-input"
          type="search"
          placeholder={`Search ${learnerName}'s chats`}
          value={searchQuery}
          onChange={handleSearch}
          aria-label={`Search ${learnerName}'s conversations`}
        />
      </div>

      {/* ── Filter Chips ─────────────────────────────────────────── */}
      <div className="pcp-helper-sessions__filters" role="tablist" aria-label="Filter sessions">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={activeFilter === f.id}
            className={`pcp-helper-sessions__chip${
              activeFilter === f.id ? ' pcp-helper-sessions__chip--active' : ''
            }`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Session List ─────────────────────────────────────────── */}
      <div className="pcp-helper-sessions__list" role="list">
        {Object.keys(grouped).length === 0 && (
          <div className="pcp-helper-sessions__empty">
            No sessions found.
          </div>
        )}

        {Object.entries(grouped).map(([dateLabel, items]) => (
          <React.Fragment key={dateLabel}>
            <div className="pcp-helper-sessions__date-group" role="presentation">
              {dateLabel}
            </div>

            {items.map((item) => {
              if (item._type === 'conversation') {
                return (
                  <button
                    key={`conv-${item.id}`}
                    className="pcp-helper-sessions__conv-card"
                    onClick={() => onConversationTap && onConversationTap(item.id)}
                    role="listitem"
                    aria-label={`Conversation: ${item.title}`}
                  >
                    <div className="pcp-helper-sessions__conv-title">{item.title}</div>
                    <div className="pcp-helper-sessions__conv-meta">
                      <span>{item.preview}</span>
                    </div>
                  </button>
                );
              }

              if (item._type === 'question') {
                return (
                  <div
                    key={`q-${item.id}`}
                    className="pcp-helper-sessions__question-card"
                    role="listitem"
                  >
                    <div className="pcp-helper-sessions__question-label">
                      Question for me
                    </div>
                    <div className="pcp-helper-sessions__question-text">
                      &ldquo;{item.text}&rdquo;
                    </div>
                    <div className="pcp-helper-sessions__question-time">
                      {item.status === 'waiting' ? 'Waiting for reply' : item.status}
                    </div>
                    <button
                      className="pcp-btn pcp-btn--primary pcp-helper-sessions__reply-btn"
                      onClick={() => onReply && onReply(item.id)}
                      aria-label={`Reply to question: ${item.text}`}
                    >
                      Reply now
                    </button>
                  </div>
                );
              }

              if (item._type === 'alert') {
                return (
                  <button
                    key={`alert-${item.id}`}
                    className="pcp-helper-sessions__alert-card"
                    onClick={() => onAlertTap && onAlertTap(item.id)}
                    role="listitem"
                    aria-label={`Alert: ${item.title}`}
                  >
                    <div className="pcp-helper-sessions__alert-body">
                      <div className="pcp-helper-sessions__alert-title">{item.title}</div>
                      <div className="pcp-helper-sessions__alert-preview">
                        &ldquo;{item.preview}&rdquo;
                      </div>
                      <div className="pcp-helper-sessions__alert-time">
                        {item.resolved ? 'Resolved' : 'Active'}
                      </div>
                    </div>
                    <span className="pcp-helper-sessions__chevron" aria-hidden="true">
                      &rsaquo;
                    </span>
                  </button>
                );
              }

              return null;
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default HelperSessions;
