import React, { useEffect, useState, useCallback } from 'react';
import './AdminFeedback.css';

const PAGE_SIZE = 50;

/**
 * AdminFeedback — admin-only page listing all feedback across the platform.
 *
 * Fetches /api/admin/feedback (server refuses unless req.user.is_admin),
 * shows a summary strip and a table of rows. Clicking a row expands to
 * show the conversation transcript.
 */
function AdminFeedback({ onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [ratingFilter, setRatingFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [transcripts, setTranscripts] = useState({}); // conversationId -> messages[]

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (ratingFilter) params.set('rating', ratingFilter);
      const res = await fetch(`/api/admin/feedback?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const payload = await res.json();
      setData(payload);
    } catch (e) {
      setError(e.message || 'Failed to load feedback.');
    } finally {
      setLoading(false);
    }
  }, [offset, ratingFilter]);

  useEffect(() => { load(); }, [load]);

  async function toggleExpand(row) {
    if (expandedId === row.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.id);
    if (!transcripts[row.conversation_id]) {
      try {
        const res = await fetch(`/api/admin/conversations/${row.conversation_id}/messages`, {
          credentials: 'include',
        });
        if (res.ok) {
          const msgs = await res.json();
          setTranscripts(prev => ({ ...prev, [row.conversation_id]: msgs }));
        }
      } catch (_) { /* ignore */ }
    }
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div className="admin-feedback">
      <div className="admin-feedback__header">
        <div>
          <h1 className="admin-feedback__title">Feedback</h1>
          <p className="admin-feedback__subtitle">All ratings submitted by users at end of chat.</p>
        </div>
        {onClose && (
          <button className="admin-feedback__close" type="button" onClick={onClose}>
            Back to chat
          </button>
        )}
      </div>

      {data && data.summary && (
        <div className="admin-feedback__summary">
          <div className="admin-feedback__stat">
            <span className="admin-feedback__stat-label">Total</span>
            <span className="admin-feedback__stat-value">{data.summary.total}</span>
          </div>
          <div className="admin-feedback__stat">
            <span className="admin-feedback__stat-label">Average</span>
            <span className="admin-feedback__stat-value">
              {data.summary.average_rating
                ? Number(data.summary.average_rating).toFixed(2)
                : '—'}
            </span>
          </div>
          {[5, 4, 3, 2, 1].map((r) => (
            <div key={r} className="admin-feedback__stat">
              <span className="admin-feedback__stat-label">{r}★</span>
              <span className="admin-feedback__stat-value">{data.summary.by_rating[r] || 0}</span>
            </div>
          ))}
        </div>
      )}

      <div className="admin-feedback__controls">
        <label className="admin-feedback__filter">
          Filter by rating
          <select
            value={ratingFilter}
            onChange={(e) => { setOffset(0); setRatingFilter(e.target.value); }}
          >
            <option value="">All</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </label>
      </div>

      {error && <div className="admin-feedback__error" role="alert">{error}</div>}
      {loading && <div className="admin-feedback__loading">Loading…</div>}

      {data && data.feedback && data.feedback.length === 0 && !loading && (
        <div className="admin-feedback__empty">No feedback yet.</div>
      )}

      {data && data.feedback && data.feedback.length > 0 && (
        <div className="admin-feedback__table-wrap">
          <table className="admin-feedback__table">
            <thead>
              <tr>
                <th>When</th>
                <th>Rating</th>
                <th>User</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {data.feedback.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    className={`admin-feedback__row ${expandedId === row.id ? 'admin-feedback__row--expanded' : ''}`}
                    onClick={() => toggleExpand(row)}
                  >
                    <td>{formatDate(row.created_at)}</td>
                    <td className="admin-feedback__rating">
                      {'★'.repeat(row.rating)}{'☆'.repeat(5 - row.rating)}
                    </td>
                    <td>
                      <div>{row.user_name || <em>Unnamed</em>}</div>
                      <div className="admin-feedback__email">
                        {row.email || (row.is_anonymous ? <em>Guest</em> : <em>No email</em>)}
                      </div>
                    </td>
                    <td className="admin-feedback__comment">{row.comment || <em>No comment</em>}</td>
                  </tr>
                  {expandedId === row.id && (
                    <tr className="admin-feedback__transcript-row">
                      <td colSpan={4}>
                        <div className="admin-feedback__transcript">
                          <strong>Conversation transcript</strong>
                          {transcripts[row.conversation_id]
                            ? transcripts[row.conversation_id].length === 0
                              ? <p><em>No messages recorded.</em></p>
                              : transcripts[row.conversation_id].map((m) => (
                                  <div key={m.id} className={`admin-feedback__msg admin-feedback__msg--${m.role}`}>
                                    <span className="admin-feedback__msg-role">{m.role}</span>
                                    <span className="admin-feedback__msg-body">{m.body}</span>
                                  </div>
                                ))
                            : <p><em>Loading transcript…</em></p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="admin-feedback__pagination">
          <button
            type="button"
            disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            ← Previous
          </button>
          <span>
            {offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} of {data.total}
          </span>
          <button
            type="button"
            disabled={offset + PAGE_SIZE >= data.total || loading}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminFeedback;
