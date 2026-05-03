import React, { useState, useRef, useCallback } from 'react';
import GuideViewer from '../Artifacts/GuideViewer/GuideViewer';
import VideoPlayer from '../Artifacts/VideoPlayer';
import DiagnosticFindings from '../Artifacts/DiagnosticFindings';
import ResourcesViewer from '../Artifacts/ResourcesViewer';
import PracticeMode from '../Artifacts/PracticeMode/PracticeMode';
import './ArtifactPanel.css';

/**
 * ArtifactPanel -- Desktop-only right panel, resizable via drag handle.
 * Only rendered when an artifact is open (ShellLayout gates this).
 */
function ArtifactPanel({ artifact, onClose, onSendMessage, onMoveInline }) {
  const titleId = 'pcp-artifact-panel-title';
  const panelRef = useRef(null);
  const [width, setWidth] = useState(480);
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const startX = e.clientX;
    const startW = width;

    const onMove = (ev) => {
      if (!dragging.current) return;
      const delta = startX - ev.clientX;
      const newW = Math.max(320, Math.min(800, startW + delta));
      setWidth(newW);
      // Update CSS grid column in real time
      const shell = panelRef.current?.closest('.pcp-shell');
      if (shell) shell.style.setProperty('--artifact-w-live', newW + 'px');
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [width]);

  if (!artifact) return null;

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
    <aside
      className="pcp-artifact-panel"
      aria-label="Artifact viewer"
      aria-labelledby={titleId}
      ref={panelRef}
      style={{ width: width + 'px' }}
    >
      {/* Drag handle on left edge */}
      <div
        className="pcp-artifact-panel__resize"
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize artifact panel"
        tabIndex={0}
      />
      <div className="pcp-artifact-panel__header">
        <button
          className="pcp-artifact-panel__header-btn"
          onClick={onClose}
          aria-label="Close panel"
          type="button"
          title="Close"
        >
          &#10005;
        </button>
        {onMoveInline && (
          <button
            className="pcp-artifact-panel__header-btn"
            onClick={onMoveInline}
            aria-label="Show inline in chat"
            type="button"
            title="Show inline"
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
