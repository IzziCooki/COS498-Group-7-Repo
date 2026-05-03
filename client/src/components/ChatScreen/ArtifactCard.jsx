import React from 'react';
import './ArtifactCard.css';

/**
 * Artifact type config: icon, default title, meta text builder, CSS modifier
 */
const ARTIFACT_TYPES = {
  guide: {
    icon: '\uD83D\uDCD6',
    getTitle: (data) => data?.title || 'Guide',
    getMeta: (data) => {
      const steps = data?.steps?.length || 0;
      return steps > 0 ? `${steps} steps` : 'Tap to open';
    },
    modifier: '',
  },
  diagnostic: {
    icon: '\uD83D\uDC9A',
    getTitle: (data) => data?.title || 'Diagnostic',
    getMeta: (data) => {
      if (!data?.items) return 'Tap to see details';
      const count = data.items.length;
      return `${count} item${count !== 1 ? 's' : ''} checked`;
    },
    modifier: '',
    getStatusIcon: (data) => {
      if (!data?.items) return '\uD83D\uDC9A';
      const hasError = data.items.some((i) => i.status === 'error' || i.status === 'danger');
      const hasWarn = data.items.some((i) => i.status === 'warning');
      if (hasError) return '\u2764\uFE0F';
      if (hasWarn) return '\uD83D\uDC9B';
      return '\uD83D\uDC9A';
    },
    getModifier: (data) => {
      if (!data?.items) return '';
      const hasError = data.items.some((i) => i.status === 'error' || i.status === 'danger');
      const hasWarn = data.items.some((i) => i.status === 'warning');
      if (hasError) return 'pcp-artifact-card--diagnostic-danger';
      if (hasWarn) return 'pcp-artifact-card--diagnostic-warning';
      return 'pcp-artifact-card--diagnostic-success';
    },
  },
  video: {
    icon: '\u25B6',
    getTitle: (data) => {
      if (Array.isArray(data) && data.length > 0) return data[0].title || 'Video Tutorial';
      return 'Video Tutorials';
    },
    getMeta: (data) => {
      if (Array.isArray(data)) return `${data.length} video${data.length !== 1 ? 's' : ''}`;
      return 'Tap to watch';
    },
    modifier: '',
    iconModifier: 'pcp-artifact-card__icon--video',
  },
  resources: {
    icon: '\uD83D\uDD17',
    getTitle: (data) => data?.topic ? `Help with ${data.topic}` : 'Resources',
    getMeta: (data) => {
      if (!data?.links) return 'Tap to browse';
      return `${data.links.length} resource${data.links.length !== 1 ? 's' : ''}`;
    },
    modifier: '',
  },
  practice: {
    icon: '\uD83C\uDFAF',
    getTitle: (data) => data?.title || 'Practice Mode',
    getMeta: () => 'Try it safely first',
    modifier: 'pcp-artifact-card--practice',
  },
};

/**
 * ArtifactCard -- Inline preview card for artifacts in chat thread.
 * Same chassis for all types; variant prop controls icon and styling.
 *
 * @param {{ type: string, data: any, onTap: () => void, onShowInline?: () => void }} props
 */
function ArtifactCard({ type, data, onTap, onShowInline }) {
  const config = ARTIFACT_TYPES[type] || ARTIFACT_TYPES.guide;
  const icon = config.getStatusIcon ? config.getStatusIcon(data) : config.icon;
  const title = config.getTitle(data);
  const meta = config.getMeta(data);
  const modifier = config.getModifier ? config.getModifier(data) : config.modifier;
  const iconMod = config.iconModifier || '';

  const ariaLabel = `Open ${type}: ${title}, ${meta}`;

  return (
    <div className={`pcp-artifact-card-wrap ${modifier}`.trim()}>
      <button
        type="button"
        className={`pcp-artifact-card ${modifier}`.trim()}
        onClick={onTap}
        role="button"
        aria-label={ariaLabel}
      >
        <div className={`pcp-artifact-card__icon ${iconMod}`.trim()} aria-hidden="true">
          {icon}
        </div>
        <div className="pcp-artifact-card__content">
          <div className="pcp-artifact-card__title">{title}</div>
          <div className="pcp-artifact-card__meta">{meta}</div>
        </div>
        <span className="pcp-artifact-card__chevron" aria-hidden="true">&#x25B8;</span>
      </button>
      {onShowInline && (
        <button
          type="button"
          className="pcp-artifact-card__inline-btn"
          onClick={(e) => { e.stopPropagation(); onShowInline(); }}
          aria-label={`Show ${type} inline`}
        >
          Show inline
        </button>
      )}
    </div>
  );
}

export default ArtifactCard;
