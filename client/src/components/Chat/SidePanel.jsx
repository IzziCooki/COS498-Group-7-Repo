import React from 'react';
import './SidePanel.css';
import CommandGuide from './CommandGuide';
import DiagnosticFindings from './DiagnosticFindings';
import YouTubeEmbed from './YouTubeEmbed';
import PracticeMode from './PracticeMode';

function ResourcesContent({ resources }) {
  const { summary, videos, links } = resources;
  const watchLinks = links ? links.filter(l => l.type === 'watch') : [];
  const readLinks = links ? links.filter(l => l.type === 'read') : [];
  const tryLinks = links ? links.filter(l => l.type === 'try') : [];
  const otherLinks = links ? links.filter(l => !l.type || !['watch', 'read', 'try'].includes(l.type)) : [];

  const renderLinks = (items, title) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="sp-res__section">
        <h4 className="sp-res__section-title">{title}</h4>
        {items.map((link, i) => (
          <div key={i} className="sp-res__link-item">
            <div className="sp-res__link-top">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="sp-res__link">{link.title || link.url}</a>
              {link.time && <span className="sp-res__time">{link.time}</span>}
            </div>
            {link.description && <span className="sp-res__link-desc">{link.description}</span>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="sp-res">
      {summary && <p className="sp-res__summary">{summary}</p>}
      {videos && videos.length > 0 && (
        <div className="sp-res__section">
          <h4 className="sp-res__section-title">Watch</h4>
          <YouTubeEmbed videos={videos} embedded />
        </div>
      )}
      {renderLinks(watchLinks, 'More Videos')}
      {renderLinks(readLinks, 'Read')}
      {renderLinks(tryLinks, 'Try It')}
      {renderLinks(otherLinks, 'Other Resources')}
    </div>
  );
}

/** Get a display title for an artifact */
function spArtifactTitle(artifact) {
  if (artifact.practice) return 'Practice Mode';
  if (artifact.guide) return artifact.guide.title || 'Guide';
  if (artifact.resources) return artifact.resources.topic ? `Resources: ${artifact.resources.topic}` : 'Resources';
  if (artifact.findings) return artifact.findings.title || 'Diagnostic Details';
  if (artifact.videos) return 'Video Tutorials';
  return 'Artifact';
}

/**
 * SidePanel — renders all parts of an artifact (findings + guide + videos + resources)
 * in a single scrollable panel, with left/right navigation between artifacts.
 *
 * Reuses CommandGuide, DiagnosticFindings, and YouTubeEmbed with embedded=true
 * to suppress their individual collapse/dismiss chrome.
 */
function SidePanel({ artifact, artifacts, activeIndex, onNavigate, onClose, onMoveToInline, onRunCommand, commandResults, osType, onSendMessage }) {
  if (!artifact) return null;

  const total = artifacts ? artifacts.length : 1;
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < total - 1;

  return (
    <div className="side-panel">
      <div className="side-panel__header">
        <div className="side-panel__nav">
          <button className="side-panel__nav-btn" onClick={() => onNavigate(activeIndex - 1)} disabled={!canPrev} aria-label="Previous">&#9664;</button>
          <span className="side-panel__nav-label">{activeIndex + 1} / {total}</span>
          <button className="side-panel__nav-btn" onClick={() => onNavigate(activeIndex + 1)} disabled={!canNext} aria-label="Next">&#9654;</button>
        </div>
        <span className="side-panel__title">{spArtifactTitle(artifact)}</span>
        <div className="side-panel__actions">
          <button className="side-panel__inline-btn" onClick={onMoveToInline}>Inline</button>
          <button className="side-panel__close" onClick={onClose}>Close</button>
        </div>
      </div>

      <div className="side-panel__content">
        {/* Render ALL parts of this artifact — findings first, then guide, then videos/resources */}
        {artifact.practice && <PracticeMode practice={artifact.practice} osType={osType} onSendMessage={onSendMessage} />}
        {artifact.findings && <DiagnosticFindings findings={artifact.findings} embedded />}
        {artifact.guide && <CommandGuide guide={artifact.guide} onRunCommand={onRunCommand} commandResults={commandResults || {}} embedded />}
        {artifact.videos && <YouTubeEmbed videos={artifact.videos} embedded />}
        {artifact.resources && <ResourcesContent resources={artifact.resources} />}
      </div>
    </div>
  );
}

export default SidePanel;
