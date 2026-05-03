import React, { useEffect, useState, useCallback } from 'react';
import FullScreenOverlay from '../Overlays/FullScreenOverlay';
import './AuditTimeline.css';

/**
 * AuditTimeline — Chronological log of helper actions, grouped by date.
 * Read-only, paginated. Fetches from buddy pair dashboard data.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   userId: string | number,
 *   helperName?: string,
 * }} props
 */

const PAGE_SIZE = 20;

/**
 * Group entries by day label (TODAY, YESTERDAY, WEDNESDAY, etc.).
 */
function groupByDay(entries) {
  const groups = {};
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (const entry of entries) {
    const d = new Date(entry.timestamp || entry.created_at || Date.now());
    const dateStr = d.toDateString();
    let label;

    if (dateStr === todayStr) {
      label = 'Today';
    } else if (dateStr === yesterdayStr) {
      label = 'Yesterday';
    } else {
      label = dayNames[d.getDay()].toUpperCase();
      // If older than a week, add the date
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      if (diffDays > 6) {
        label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
      }
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }

  return groups;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function AuditTimeline({ open, onClose, userId, helperName = 'Your helper' }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // ── Fetch audit entries ──
  const fetchEntries = useCallback(
    async (pageNum, append = false) => {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/users/${userId}/audit?page=${pageNum}&limit=${PAGE_SIZE}`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error(`Failed to load audit log (${res.status})`);
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.entries || data.actions || [];
        if (append) {
          setEntries((prev) => [...prev, ...items]);
        } else {
          setEntries(items);
        }
        setHasMore(items.length >= PAGE_SIZE);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!open) return;
    setPage(1);
    fetchEntries(1, false);
  }, [open, fetchEntries]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEntries(nextPage, true);
  }, [page, fetchEntries]);

  const grouped = groupByDay(entries);
  const groupKeys = Object.keys(grouped);

  return (
    <FullScreenOverlay
      open={open}
      onClose={onClose}
      title={`What ${helperName} has done`}
      backLabel="Back"
      labelledBy="pcp-audit-timeline-title"
    >
      <div className="pcp-audit-timeline" role="log" aria-label="Helper activity timeline">
        {/* Loading (initial) */}
        {isLoading && entries.length === 0 && (
          <div className="pcp-audit-timeline__loading" role="status" aria-live="polite">
            <div className="pcp-audit-timeline__spinner" />
            <span>Loading activity...</span>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && entries.length === 0 && (
          <div className="pcp-audit-timeline__error" role="alert">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && entries.length === 0 && (
          <div className="pcp-audit-timeline__empty">
            <span className="pcp-audit-timeline__empty-icon" aria-hidden="true">
              {'\uD83D\uDC41\uFE0F'}
            </span>
            <h3 className="pcp-audit-timeline__empty-title">No activity yet</h3>
            <p className="pcp-audit-timeline__empty-text">
              When {helperName} helps you, their actions will be recorded here so
              you always know what happened.
            </p>
          </div>
        )}

        {/* Timeline entries grouped by day */}
        {groupKeys.map((dayLabel) => (
          <section
            key={dayLabel}
            className="pcp-audit-timeline__group"
            aria-label={dayLabel}
          >
            <h3 className="pcp-audit-timeline__group-title">{dayLabel}</h3>
            {grouped[dayLabel].map((entry, i) => (
              <div key={entry.id || i} className="pcp-audit-timeline__entry">
                <span className="pcp-audit-timeline__bullet" aria-hidden="true" />
                <span className="pcp-audit-timeline__entry-text">
                  {entry.description || entry.text || entry.summary || 'Action performed'}
                </span>
                <span className="pcp-audit-timeline__entry-meta">
                  {formatTime(entry.timestamp || entry.created_at)}
                </span>
              </div>
            ))}
          </section>
        ))}

        {/* Load more */}
        {hasMore && (
          <button
            className="pcp-audit-timeline__load-more"
            type="button"
            onClick={handleLoadMore}
            disabled={isLoading}
            aria-label="Load older activity"
          >
            {isLoading ? 'Loading...' : 'Load older activity'}
          </button>
        )}
      </div>
    </FullScreenOverlay>
  );
}

export default AuditTimeline;
