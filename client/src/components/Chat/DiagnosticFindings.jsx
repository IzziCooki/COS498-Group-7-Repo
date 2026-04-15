import React, { useState } from 'react';
import './DiagnosticFindings.css';

/**
 * DiagnosticFindings — Collapsible dropdown showing diagnostic results.
 * Shows how the agent reached its conclusions.
 */
function DiagnosticFindings({ findings }) {
  const [expanded, setExpanded] = useState(false);

  if (!findings || !findings.findings || findings.findings.length === 0) return null;

  const statusIcon = { good: '\u2705', warning: '\u26A0\uFE0F', bad: '\u274C' };
  const statusLabel = { good: 'Good', warning: 'Attention', bad: 'Issue' };

  return (
    <div className="diag-findings">
      <button
        className="diag-findings__toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="diag-findings__toggle-icon">{expanded ? '\u25BC' : '\u25B6'}</span>
        <span className="diag-findings__toggle-title">{findings.title || 'Diagnostic Details'}</span>
        <span className="diag-findings__toggle-hint">
          {expanded ? 'Click to hide' : 'Click to see what was checked'}
        </span>
      </button>

      {expanded && (
        <div className="diag-findings__body">
          {findings.findings.map((f, i) => (
            <div key={i} className={`diag-findings__row diag-findings__row--${f.status}`}>
              <span className="diag-findings__status" aria-label={statusLabel[f.status]}>
                {statusIcon[f.status] || '\u2139\uFE0F'}
              </span>
              <div className="diag-findings__content">
                <span className="diag-findings__label">{f.label}</span>
                <span className="diag-findings__value">{f.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DiagnosticFindings;
