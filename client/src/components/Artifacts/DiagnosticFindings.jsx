import React from 'react';
import './DiagnosticFindings.css';

/**
 * Status icon mapping for diagnostic findings.
 */
const STATUS_CONFIG = {
  good: { icon: '\uD83D\uDC9A', className: 'pcp-diag__item--good', label: 'Good' },
  success: { icon: '\uD83D\uDC9A', className: 'pcp-diag__item--good', label: 'Good' },
  warning: { icon: '\uD83D\uDC9B', className: 'pcp-diag__item--warning', label: 'Warning' },
  error: { icon: '\u2764\uFE0F', className: 'pcp-diag__item--bad', label: 'Problem' },
  danger: { icon: '\u2764\uFE0F', className: 'pcp-diag__item--bad', label: 'Problem' },
  bad: { icon: '\u2764\uFE0F', className: 'pcp-diag__item--bad', label: 'Problem' },
};

/**
 * DiagnosticFindings -- Full-screen overlay showing diagnostic results.
 * Each finding has a status icon (green/yellow/red), label, and value.
 *
 * @param {{
 *   findings: { title: string, items: Array<{ status: string, label: string, value: string }> },
 *   onClose: () => void,
 *   titleId: string,
 * }} props
 */
function DiagnosticFindings({ findings, onClose, titleId }) {
  const items = findings?.items || findings?.findings || [];
  const title = findings?.title || 'Diagnostic Results';

  return (
    <div className="pcp-diag">
      {/* Top bar */}
      <div className="pcp-overlay-topbar">
        <button
          className="pcp-overlay-topbar__back"
          onClick={onClose}
          aria-label="Close diagnostics and return to chat"
        >
          <span aria-hidden="true">&lsaquo;</span> Back to chat
        </button>
      </div>

      {/* Title */}
      <div className="pcp-diag__title-section">
        <h1 id={titleId} className="pcp-diag__title">{title}</h1>
        <p className="pcp-diag__subtitle">
          {items.length} item{items.length !== 1 ? 's' : ''} checked
        </p>
      </div>

      {/* Findings list */}
      <div className="pcp-diag__content">
        <ul className="pcp-diag__list" role="list">
          {items.map((item, i) => {
            const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.good;
            return (
              <li key={i} className={`pcp-diag__item ${config.className}`}>
                <span className="pcp-diag__item-icon" aria-label={config.label}>
                  {config.icon}
                </span>
                <div className="pcp-diag__item-content">
                  <span className="pcp-diag__item-label">{item.label}</span>
                  <span className="pcp-diag__item-value">{item.value}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom action */}
      <div className="pcp-diag__footer">
        <button
          className="pcp-btn pcp-btn--primary pcp-diag__done-btn"
          onClick={onClose}
          aria-label="Done, back to chat"
        >
          Done &middot; Back to chat
        </button>
      </div>
    </div>
  );
}

export default DiagnosticFindings;
