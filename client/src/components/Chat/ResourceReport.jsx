import React, { useState } from 'react';
import './ResourceReport.css';
import YouTubeEmbed from './YouTubeEmbed';

/**
 * ResourceReport — collapsible report of gathered videos and links.
 * Shown when user clicks "Resources" button.
 */
function ResourceReport({ resources }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !resources) return null;

  const { topic, summary, videos, links } = resources;
  const hasVideos = videos && videos.length > 0;
  const hasLinks = links && links.length > 0;

  if (!hasVideos && !hasLinks && !summary) return null;

  // Group links by type
  const watchLinks = links ? links.filter(l => l.type === 'watch') : [];
  const readLinks = links ? links.filter(l => l.type === 'read') : [];
  const tryLinks = links ? links.filter(l => l.type === 'try') : [];
  const otherLinks = links ? links.filter(l => !l.type || !['watch', 'read', 'try'].includes(l.type)) : [];

  const renderLinkGroup = (groupLinks, groupTitle) => {
    if (!groupLinks || groupLinks.length === 0) return null;
    return (
      <div className="res-report__section">
        <h4 className="res-report__section-title">{groupTitle}</h4>
        <ul className="res-report__links">
          {groupLinks.map((link, i) => (
            <li key={i} className="res-report__link-item">
              <div className="res-report__link-top">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="res-report__link">
                  {link.title || link.url}
                </a>
                {link.time && <span className="res-report__link-time">{link.time}</span>}
              </div>
              {link.description && <span className="res-report__link-desc">{link.description}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="res-report" role="region" aria-label="Resources">
      <div className="res-report__header">
        <div className="res-report__header-left">
          <span className="res-report__icon" aria-hidden="true">&#128218;</span>
          <span className="res-report__title">Resources: {topic || 'Related Topics'}</span>
        </div>
        <div className="res-report__controls">
          <button
            className="res-report__toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
          >
            {collapsed ? 'Open' : 'Collapse'}
          </button>
          <button
            className="res-report__dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            X
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="res-report__body">
          {summary && <p className="res-report__summary">{summary}</p>}

          {hasVideos && (
            <div className="res-report__section">
              <h4 className="res-report__section-title">Watch</h4>
              <YouTubeEmbed videos={videos} />
            </div>
          )}

          {renderLinkGroup(watchLinks, 'More Videos')}
          {renderLinkGroup(readLinks, 'Read')}
          {renderLinkGroup(tryLinks, 'Try It')}
          {renderLinkGroup(otherLinks, 'Other Resources')}
        </div>
      )}
    </div>
  );
}

export default ResourceReport;
