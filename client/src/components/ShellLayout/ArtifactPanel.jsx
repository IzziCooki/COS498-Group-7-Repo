import React from 'react';
import './ArtifactPanel.css';

/**
 * ArtifactPanel — Desktop-only right panel placeholder.
 *
 * - 480px wide (controlled by CSS Grid column in ShellLayout.css)
 * - Shows "No artifact selected" placeholder for now
 * - Will be connected to artifact system in Phase 4
 */
function ArtifactPanel({ isOpen }) {
  if (!isOpen) return null;

  return (
    <aside className="pcp-artifact-panel" aria-label="Artifact viewer">
      <div className="pcp-artifact-panel__empty">
        <svg className="pcp-artifact-panel__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
        <p className="pcp-artifact-panel__empty-text">
          No artifact selected
        </p>
        <p className="pcp-artifact-panel__empty-hint">
          Tap a guide or resource in the chat to view it here.
        </p>
      </div>
    </aside>
  );
}

export default ArtifactPanel;
