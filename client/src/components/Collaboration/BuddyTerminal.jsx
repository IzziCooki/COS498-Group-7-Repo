import React, { useState, useRef, useEffect, useCallback } from 'react';
import './BuddyTerminal.css';

/**
 * BuddyTerminal -- Remote diagnostic terminal for helpers.
 *
 * Phase 7 fixes:
 *   - Mobile keyboard optimization (inputmode, autocapitalize, autocorrect, spellcheck)
 *   - Quick-action grid (6 tiles) above input
 *   - Result cards with collapsible history (green check / red X)
 *   - Mobile-friendly input with full-width monospace dark bg
 *   - BEM pcp- prefix, design tokens
 */

/**
 * Quick-action tiles -- same set as HelperTools (D5 section 7.2).
 * Imported by reference rather than duplicated; if HelperTools changes
 * its list the two stay in sync because they both map to the same
 * server-side safe-command allowlist.
 */
const QUICK_ACTIONS = [
  { id: 'battery',   emoji: '\uD83D\uDD0B', label: 'Battery',   command: 'system_profiler SPBatteryDataType' },
  { id: 'disk',      emoji: '\uD83D\uDCBE', label: 'Disk',      command: 'df -h' },
  { id: 'wifi',      emoji: '\uD83D\uDCF6', label: 'Wi-Fi',     command: 'networksetup -getairportnetwork en0' },
  { id: 'memory',    emoji: '\uD83E\uDDE0', label: 'Memory',    command: 'vm_stat' },
  { id: 'temp',      emoji: '\uD83C\uDF21\uFE0F', label: 'Temp',      command: 'sudo powermetrics --samplers smc -n1' },
  { id: 'processes', emoji: '\uD83D\uDCCB', label: 'Processes', command: 'ps aux --sort=-%mem | head -10' },
];

function shortenPath(p) {
  if (!p) return '';
  const home = p.match(/^(\/Users\/[^/]+|\/home\/[^/]+|C:\\Users\\[^\\]+)/);
  if (home) return '~' + p.slice(home[0].length);
  return p;
}

function BuddyTerminal({ terminalHistory, onRunCommand, learnerName, disabled, cwd }) {
  const [input, setInput] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const outputRef = useRef(null);

  const displayName = learnerName || 'Learner';

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onRunCommand(input.trim());
    setInput('');
  };

  const handleQuickAction = useCallback(
    (command) => {
      if (disabled) return;
      onRunCommand(command);
    },
    [disabled, onRunCommand]
  );

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="pcp-buddy-terminal" role="region" aria-label="Remote terminal">
      {/* ---- Quick-Action Grid ---- */}
      <div className="pcp-buddy-terminal__quick-section">
        <div className="pcp-buddy-terminal__section-label">Run a quick check</div>
        <div
          className="pcp-buddy-terminal__quick-grid"
          role="grid"
          aria-label="Quick diagnostic actions"
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              className="pcp-buddy-terminal__quick-tile"
              onClick={() => handleQuickAction(action.command)}
              disabled={disabled}
              aria-label={`Run ${action.label} check`}
            >
              <span className="pcp-buddy-terminal__quick-icon" aria-hidden="true">
                {action.emoji}
              </span>
              <span className="pcp-buddy-terminal__quick-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Result Cards (History) ---- */}
      <div className="pcp-buddy-terminal__history" ref={outputRef}>
        {terminalHistory.length === 0 && (
          <div className="pcp-buddy-terminal__empty">
            Type a command or tap a quick check to run it on {displayName}&apos;s computer.
            <br />
            Only safe, read-only commands are allowed.
          </div>
        )}
        {terminalHistory.map((entry) => {
          const isExpanded = expandedIds.has(entry.requestId);
          const succeeded = !entry.error && !entry.running;

          return (
            <div key={entry.requestId} className="pcp-buddy-terminal__result-card">
              <button
                className="pcp-buddy-terminal__result-header"
                onClick={() => toggleExpand(entry.requestId)}
                aria-expanded={isExpanded}
                aria-label={`Command: ${entry.command}, ${
                  entry.running ? 'running' : succeeded ? 'succeeded' : 'failed'
                }`}
              >
                <span className="pcp-buddy-terminal__result-cmd">$ {entry.command}</span>
                {entry.running ? (
                  <span
                    className="pcp-buddy-terminal__result-status pcp-buddy-terminal__result-status--running"
                    aria-label="Running"
                  >
                    ...
                  </span>
                ) : (
                  <span
                    className={`pcp-buddy-terminal__result-status ${
                      succeeded
                        ? 'pcp-buddy-terminal__result-status--success'
                        : 'pcp-buddy-terminal__result-status--error'
                    }`}
                    aria-hidden="true"
                  >
                    {succeeded ? '\u2713' : '\u2717'}
                  </span>
                )}
              </button>

              {/* Summary line */}
              {!entry.running && entry.output && (
                <div className="pcp-buddy-terminal__result-summary">
                  {entry.output.split('\n')[0].slice(0, 120)}
                  {entry.output.length > 120 ? '...' : ''}
                </div>
              )}

              {/* Collapsible details */}
              {isExpanded && entry.output && (
                <pre className="pcp-buddy-terminal__result-details">
                  {entry.output}
                </pre>
              )}

              {entry.output && entry.output.split('\n').length > 1 && (
                <button
                  className="pcp-buddy-terminal__result-toggle"
                  onClick={() => toggleExpand(entry.requestId)}
                  aria-label={isExpanded ? 'Hide details' : 'Show details'}
                >
                  {isExpanded ? '\u25B2 Hide' : '\u25BC Details'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ---- Input Bar ---- */}
      <form className="pcp-buddy-terminal__input-bar" onSubmit={handleSubmit}>
        {cwd && (
          <span className="pcp-buddy-terminal__cwd" aria-label={`Directory: ${cwd}`}>
            {shortenPath(cwd)}
          </span>
        )}
        <span className="pcp-buddy-terminal__input-dollar" aria-hidden="true">$</span>
        <input
          type="text"
          className="pcp-buddy-terminal__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. df -h"
          disabled={disabled}
          autoFocus
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          aria-label="Terminal command input"
        />
        <button
          type="submit"
          className="pcp-buddy-terminal__run-btn"
          disabled={disabled || !input.trim()}
          aria-label={`Run command on ${displayName}'s computer`}
        >
          Run
        </button>
      </form>
    </div>
  );
}

export default BuddyTerminal;
