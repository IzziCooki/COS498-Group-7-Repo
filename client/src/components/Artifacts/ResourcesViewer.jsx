import React, { useState } from 'react';
import './ResourcesViewer.css';

/**
 * Categorize a resource as Watch/Read/Try based on its type or url.
 */
function categorize(resource) {
  if (resource.category) return resource.category;
  const url = (resource.url || '').toLowerCase();
  if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo')) return 'watch';
  if (resource.type === 'video') return 'watch';
  if (resource.type === 'interactive' || resource.type === 'tool') return 'try';
  return 'read';
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'watch', label: 'Watch' },
  { key: 'read', label: 'Read' },
  { key: 'try', label: 'Try' },
];

/**
 * ResourcesViewer -- Full-screen overlay with categorized links.
 * Filter tabs: Watch / Read / Try / All.
 * Each resource: title, source badge, description, external link icon.
 *
 * @param {{
 *   resources: { topic?: string, summary?: string, videos?: Array, links?: Array },
 *   onClose: () => void,
 *   titleId: string,
 * }} props
 */
function ResourcesViewer({ resources, onClose, titleId }) {
  const [activeFilter, setActiveFilter] = useState('all');

  // Combine videos and links into a unified list
  const allResources = [];

  if (resources?.videos) {
    resources.videos.forEach((v) => {
      allResources.push({
        title: v.title,
        url: v.url,
        description: v.channel || '',
        source: v.channel || 'Video',
        category: 'watch',
      });
    });
  }

  if (resources?.links) {
    resources.links.forEach((l) => {
      allResources.push({
        title: l.title || l.url,
        url: l.url,
        description: l.description || '',
        source: l.source || new URL(l.url || 'https://example.com').hostname,
        category: categorize(l),
      });
    });
  }

  const filtered = activeFilter === 'all'
    ? allResources
    : allResources.filter((r) => r.category === activeFilter);

  const topicTitle = resources?.topic
    ? `Help with ${resources.topic}`
    : 'Resources';

  return (
    <div className="pcp-resources">
      {/* Top bar */}
      <div className="pcp-overlay-topbar">
        <button
          className="pcp-overlay-topbar__back"
          onClick={onClose}
          aria-label="Close resources and return to chat"
        >
          <span aria-hidden="true">&lsaquo;</span> Back to chat
        </button>
      </div>

      {/* Title */}
      <div className="pcp-resources__title-section">
        <h1 id={titleId} className="pcp-resources__title">{topicTitle}</h1>
        {resources?.summary && (
          <p className="pcp-resources__summary">{resources.summary}</p>
        )}
      </div>

      {/* Filter tabs */}
      <div className="pcp-resources__tabs" role="tablist" aria-label="Filter resources">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`pcp-resources__tab ${activeFilter === tab.key ? 'pcp-resources__tab--active' : ''}`}
            onClick={() => setActiveFilter(tab.key)}
            role="tab"
            aria-selected={activeFilter === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resource list */}
      <div className="pcp-resources__content" role="tabpanel">
        {filtered.length === 0 ? (
          <p className="pcp-resources__empty">
            No {activeFilter === 'all' ? '' : activeFilter} resources found.
          </p>
        ) : (
          <ul className="pcp-resources__list" role="list">
            {filtered.map((resource, i) => (
              <li key={i} className="pcp-resources__item">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pcp-resources__link"
                >
                  <div className="pcp-resources__link-info">
                    <span className="pcp-resources__link-title">{resource.title}</span>
                    <span className="pcp-resources__link-source">
                      {resource.source}
                    </span>
                    {resource.description && (
                      <span className="pcp-resources__link-desc">{resource.description}</span>
                    )}
                  </div>
                  <span className="pcp-resources__link-external" aria-hidden="true">
                    &#8599;
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="pcp-resources__footer">
        <button
          className="pcp-btn pcp-btn--primary pcp-resources__done-btn"
          onClick={onClose}
          aria-label="Done, back to chat"
        >
          Done &middot; Back to chat
        </button>
      </div>
    </div>
  );
}

export default ResourcesViewer;
