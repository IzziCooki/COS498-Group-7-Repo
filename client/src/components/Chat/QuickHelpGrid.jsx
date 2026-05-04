import React, { useEffect, useState } from 'react';
import './QuickHelpGrid.css';

/**
 * QuickHelpGrid — large-tile homepage shown on the chat empty state.
 *
 * Tiles are fetched from /api/skills/quick-help, which is generated from
 * skill JSONs that opt in via "quickHelp": true. Clicking a tile sends a
 * starter prompt into the chat — no typing required.
 */
function QuickHelpGrid({ onSelect, userName }) {
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/skills/quick-help')
      .then((r) => {
        if (!r.ok) throw new Error('bad status');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setTiles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="quick-help quick-help--loading" role="status">
        Getting your shortcuts ready...
      </div>
    );
  }

  if (error || tiles.length === 0) {
    // Don't block the chat empty state if the endpoint fails — just hide.
    return null;
  }

  return (
    <section className="quick-help" aria-label="Quick help shortcuts">
      <h2 className="quick-help__title">
        {userName ? `What can I help you with today, ${userName}?` : 'What can I help you with today?'}
      </h2>
      <p className="quick-help__subtitle">
        Pick one of these to start, or just type your question below.
      </p>
      <div className="quick-help__grid" role="list">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className="quick-help__tile"
            onClick={() => onSelect(tile.starter)}
            role="listitem"
            aria-label={`Start: ${tile.label}`}
          >
            <span className="quick-help__tile-emoji" aria-hidden="true">
              {tile.emoji}
            </span>
            <span className="quick-help__tile-label">{tile.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickHelpGrid;
