import React from 'react';
import './SidePanel.css';
import YouTubeEmbed from './YouTubeEmbed';
import CommandGuide from './CommandGuide';
import DiagnosticFindings from './DiagnosticFindings';
import ResourceReport from './ResourceReport';

/**
 * SidePanel — displays the active artifact beside the chat on wide screens.
 * Shows videos, guides, resources, or findings in a persistent panel
 * that the user can close to return to full-width chat.
 */
function SidePanel({ artifact, onClose, onRunCommand, commandResults }) {
  if (!artifact) return null;

  const { type, data, sourceMessage } = artifact;

  return (
    <div className="side-panel">
      <div className="side-panel__header">
        <span className="side-panel__title">
          {type === 'guide' && (data.title || 'Guide')}
          {type === 'resources' && (data.topic ? `Resources: ${data.topic}` : 'Resources')}
          {type === 'findings' && (data.title || 'Diagnostic Details')}
          {type === 'videos' && 'Video Tutorials'}
        </span>
        <button className="side-panel__close" onClick={onClose} aria-label="Close panel">
          Close
        </button>
      </div>

      <div className="side-panel__content">
        {type === 'guide' && (
          <CommandGuide guide={data} onRunCommand={onRunCommand} commandResults={commandResults || {}} />
        )}
        {type === 'resources' && (
          <ResourceReport resources={data} />
        )}
        {type === 'findings' && (
          <DiagnosticFindings findings={data} />
        )}
        {type === 'videos' && (
          <YouTubeEmbed videos={data} />
        )}
      </div>
    </div>
  );
}

export default SidePanel;
