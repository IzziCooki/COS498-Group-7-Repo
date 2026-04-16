import React, { useState } from 'react';
import './SidePanel.css';

function artifactTitle(artifact) {
  if (!artifact) return '';
  const { type, data } = artifact;
  if (type === 'guide') return data.title || 'Guide';
  if (type === 'resources') return data.topic ? `Resources: ${data.topic}` : 'Resources';
  if (type === 'findings') return data.title || 'Diagnostic Details';
  if (type === 'videos') return 'Video Tutorials';
  return 'Artifact';
}

function GuideContent({ guide, onRunCommand, commandResults = {} }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  function handleCopy(command, idx) {
    navigator.clipboard.writeText(command).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }

  return (
    <div className="sp-guide">
      {guide.description && <p className="sp-guide__desc">{guide.description}</p>}
      <ol className="sp-guide__steps">
        {guide.steps.map((step, i) => {
          const result = step.command ? commandResults[step.command] : null;
          return (
            <li key={i} className="sp-guide__step">
              <div className="sp-guide__step-text">{step.text}</div>
              {step.command && (
                <div className="sp-guide__cmd-block">
                  <div className="sp-guide__cmd-row">
                    <code className="sp-guide__code">{step.command}</code>
                    <div className="sp-guide__cmd-actions">
                      <button className="sp-guide__copy" onClick={() => handleCopy(step.command, i)}>
                        {copiedIdx === i ? 'Copied!' : 'Copy'}
                      </button>
                      {onRunCommand && (
                        <button className="sp-guide__run" onClick={() => onRunCommand(step.command)} disabled={result?.running}>
                          {result?.running ? 'Running...' : 'Run'}
                        </button>
                      )}
                    </div>
                  </div>
                  {result && !result.running && result.output && (
                    <pre className={`sp-guide__output ${result.error ? 'sp-guide__output--err' : ''}`}>{result.output}</pre>
                  )}
                </div>
              )}
              {step.note && <p className="sp-guide__note">{step.note}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FindingsContent({ findings }) {
  const icons = { good: '\u2705', warning: '\u26A0\uFE0F', bad: '\u274C' };
  return (
    <div className="sp-findings">
      {findings.findings.map((f, i) => (
        <div key={i} className={`sp-findings__row sp-findings__row--${f.status}`}>
          <span className="sp-findings__icon">{icons[f.status] || '\u2139\uFE0F'}</span>
          <div>
            <div className="sp-findings__label">{f.label}</div>
            <div className="sp-findings__value">{f.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * VideosContent — tries iframe embed first, falls back to "Watch on YouTube" link.
 * Embeds work on deployed domains but are blocked on localhost by YouTube.
 */
function VideosContent({ videos }) {
  const [playingId, setPlayingId] = useState(null);
  const [embedFailed, setEmbedFailed] = useState(new Set());

  return (
    <div className="sp-videos">
      {videos.map((video, i) => {
        const isPlaying = playingId === video.id && video.id;
        const isFailed = embedFailed.has(video.id);

        return (
          <div key={video.id || i} className="sp-videos__card">
            {isPlaying && !isFailed ? (
              <div className="sp-videos__player">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="sp-videos__iframe"
                  onError={() => setEmbedFailed(prev => new Set([...prev, video.id]))}
                />
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="sp-videos__external-link">
                  Having trouble? Open on YouTube
                </a>
              </div>
            ) : (
              <button className="sp-videos__thumb-btn" onClick={() => video.id ? setPlayingId(video.id) : window.open(video.url, '_blank')}>
                {video.thumbnail && <img src={video.thumbnail} alt="" className="sp-videos__thumb" loading="lazy" />}
                <div className="sp-videos__play-overlay">
                  <span className="sp-videos__play-icon">&#9654;</span>
                </div>
              </button>
            )}
            <div className="sp-videos__info">
              <a href={video.url} target="_blank" rel="noopener noreferrer" className="sp-videos__title">{video.title}</a>
              {video.channel && <span className="sp-videos__channel">{video.channel}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
          <VideosContent videos={videos} />
        </div>
      )}
      {renderLinks(watchLinks, 'More Videos')}
      {renderLinks(readLinks, 'Read')}
      {renderLinks(tryLinks, 'Try It')}
      {renderLinks(otherLinks, 'Other Resources')}
    </div>
  );
}

function SidePanel({ artifact, artifacts, activeIndex, onNavigate, onClose, onMoveToInline, onRunCommand, commandResults }) {
  if (!artifact) return null;

  const { type, data } = artifact;
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
        <span className="side-panel__title">{artifactTitle(artifact)}</span>
        <div className="side-panel__actions">
          <button className="side-panel__inline-btn" onClick={onMoveToInline}>Inline</button>
          <button className="side-panel__close" onClick={onClose}>Close</button>
        </div>
      </div>

      <div className="side-panel__content">
        {type === 'guide' && <GuideContent guide={data} onRunCommand={onRunCommand} commandResults={commandResults || {}} />}
        {type === 'findings' && <FindingsContent findings={data} />}
        {type === 'videos' && <VideosContent videos={data} />}
        {type === 'resources' && <ResourcesContent resources={data} />}
      </div>
    </div>
  );
}

export default SidePanel;
