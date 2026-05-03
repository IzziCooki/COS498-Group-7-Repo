import React, { useEffect, useState, useCallback } from 'react';
import FullScreenOverlay from '../Overlays/FullScreenOverlay';
import ConfirmDialog from '../Overlays/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import './MemoryViewer.css';

/**
 * MemoryViewer — Full-screen overlay listing what the AI remembers.
 * Fetches from /api/users/:id/memories. Items grouped by type.
 * Each item has a "Forget" button with confirmation.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   userId: string | number,
 * }} props
 */

const TYPE_ORDER = ['preference', 'struggle', 'breakthrough', 'context', 'pattern'];

const TYPE_LABELS = {
  preference: 'Preference',
  struggle: 'Struggle',
  breakthrough: 'Breakthrough',
  context: 'Context',
  pattern: 'Pattern',
};

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

function MemoryViewer({ open, onClose, userId }) {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forgetTarget, setForgetTarget] = useState(null);
  const { toast } = useToast() || {};

  // ── Fetch memories on open ──
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;

    async function fetchMemories() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${userId}/memories`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Failed to load memories (${res.status})`);
        const data = await res.json();
        if (!cancelled) {
          setMemories(Array.isArray(data) ? data : data.memories || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMemories();
    return () => { cancelled = true; };
  }, [open, userId]);

  // ── Forget a memory ──
  const handleForget = useCallback(async () => {
    if (!forgetTarget) return;
    try {
      const res = await fetch(
        `/api/users/${userId}/memories/${forgetTarget.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (!res.ok) throw new Error('Failed to forget memory');

      setMemories((prev) => prev.filter((m) => m.id !== forgetTarget.id));
      toast?.({ kind: 'success', text: 'Memory forgotten.' });
    } catch (err) {
      toast?.({ kind: 'error', text: err.message });
    } finally {
      setForgetTarget(null);
    }
  }, [forgetTarget, userId, toast]);

  // ── Group memories by type ──
  const grouped = {};
  for (const mem of memories) {
    const type = mem.type || 'context';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(mem);
  }

  // Sort groups in canonical order
  const sortedGroups = TYPE_ORDER.filter((t) => grouped[t]?.length > 0);

  return (
    <>
      <FullScreenOverlay
        open={open}
        onClose={onClose}
        title="What PC Pal remembers"
        backLabel="Back"
        labelledBy="pcp-memory-viewer-title"
      >
        <div className="pcp-memory-viewer" role="region" aria-label="Your memories">
          {/* Loading */}
          {isLoading && (
            <div className="pcp-memory-viewer__loading" role="status" aria-live="polite">
              <div className="pcp-memory-viewer__spinner" />
              <span>Loading memories...</span>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="pcp-memory-viewer__error" role="alert">
              {error}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && memories.length === 0 && (
            <div className="pcp-memory-viewer__empty">
              <span className="pcp-memory-viewer__empty-icon" aria-hidden="true">
                {'\uD83E\uDDE0'}
              </span>
              <h3 className="pcp-memory-viewer__empty-title">No memories yet</h3>
              <p className="pcp-memory-viewer__empty-text">
                As you chat with PC Pal, it will remember what you like and what you
                find tricky. Those memories will appear here.
              </p>
            </div>
          )}

          {/* Memory list grouped by type */}
          {!isLoading && !error && sortedGroups.map((type) => (
            <section
              key={type}
              className="pcp-memory-viewer__group"
              aria-label={`${TYPE_LABELS[type] || type} memories`}
            >
              <h3 className="pcp-memory-viewer__group-title">
                {TYPE_LABELS[type] || type}
              </h3>
              {grouped[type].map((mem) => (
                <div key={mem.id} className="pcp-memory-viewer__item">
                  <div className="pcp-memory-viewer__item-body">
                    <span
                      className={`pcp-memory-viewer__badge pcp-memory-viewer__badge--${type}`}
                    >
                      {TYPE_LABELS[type] || type}
                    </span>
                    <p className="pcp-memory-viewer__content">
                      {mem.content || mem.text || mem.summary || ''}
                    </p>
                    {(mem.created_at || mem.date) && (
                      <span className="pcp-memory-viewer__date">
                        {formatDate(mem.created_at || mem.date)}
                      </span>
                    )}
                  </div>
                  <button
                    className="pcp-memory-viewer__forget"
                    type="button"
                    aria-label={`Forget: ${mem.content || mem.text || 'this memory'}`}
                    onClick={() => setForgetTarget(mem)}
                  >
                    Forget
                  </button>
                </div>
              ))}
            </section>
          ))}
        </div>
      </FullScreenOverlay>

      {/* Confirmation dialog for forgetting */}
      <ConfirmDialog
        open={Boolean(forgetTarget)}
        onCancel={() => setForgetTarget(null)}
        onConfirm={handleForget}
        title="Forget this memory?"
        body="PC Pal will no longer remember this. You cannot undo this action."
        cancelLabel="Keep it"
        confirmLabel="Forget"
        destructive
      />
    </>
  );
}

export default MemoryViewer;
