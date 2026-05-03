import React from 'react';
import GuideViewer from '../Artifacts/GuideViewer/GuideViewer';
import VideoPlayer from '../Artifacts/VideoPlayer';
import DiagnosticFindings from '../Artifacts/DiagnosticFindings';
import ResourcesViewer from '../Artifacts/ResourcesViewer';
import PracticeMode from '../Artifacts/PracticeMode/PracticeMode';
import './ArtifactPanel.css';

/**
 * ArtifactPanel -- Desktop-only right panel (480px, controlled by CSS Grid).
 *
 * Renders the appropriate artifact viewer based on the artifact's type.
 * Shows an empty-state prompt when no artifact is selected.
 *
 * @param {{
 *   artifact: { type: string, data: any } | null,
 *   onClose: () => void,
 *   onSendMessage?: (text: string) => void,
 *   onMoveInline?: () => void,
 * }} props
 */
function ArtifactPanel({ artifact, onClose, onSendMessage, onMoveInline }) {
  const titleId = 'pcp-artifact-panel-title';

  if (!artifact) {
    return (
      <aside className="pcp-artifact-panel pcp-artifact-panel--empty" aria-label="Artifact viewer">
        <div className="pcp-artifact-panel__placeholder">
          <svg className="pcp-artifact-panel__placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          <p className="pcp-artifact-panel__placeholder-text">
            No artifact selected
          </p>
          <p className="pcp-artifact-panel__placeholder-hint">
            Tap a guide, video, or finding in chat to view it here.
          </p>
        </div>
      </aside>
    );
  }

  const renderContent = () => {
    switch (artifact.type) {
      case 'guide':
        return (
          <GuideViewer
            guide={artifact.data}
            onClose={onClose}
            onSendMessage={onSendMessage}
            onStepChange={() => {}}
            titleId={titleId}
          />
        );
      case 'video':
        return (
          <VideoPlayer
            videos={artifact.data}
            onClose={onClose}
            titleId={titleId}
          />
        );
      case 'diagnostic':
        return (
          <DiagnosticFindings
            findings={artifact.data}
            onClose={onClose}
            titleId={titleId}
          />
        );
      case 'resources':
        return (
          <ResourcesViewer
            resources={artifact.data}
            onClose={onClose}
            titleId={titleId}
          />
        );
      case 'practice':
        return (
          <PracticeMode
            practice={artifact.data}
            onClose={onClose}
            onSendMessage={onSendMessage}
            titleId={titleId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <aside className="pcp-artifact-panel" aria-label="Artifact viewer" aria-labelledby={titleId}>
      <div className="pcp-artifact-panel__header">
        <button
          className="pcp-artifact-panel__header-btn"
          onClick={onClose}
          aria-label="Close panel"
          type="button"
        >
          &#10005;
        </button>
        {onMoveInline && (
          <button
            className="pcp-artifact-panel__header-btn"
            onClick={onMoveInline}
            aria-label="Show inline in chat"
            type="button"
          >
            &#8601; Inline
          </button>
        )}
      </div>
      <div className="pcp-artifact-panel__content">
        {renderContent()}
      </div>
    </aside>
  );
}

export default ArtifactPanel;
