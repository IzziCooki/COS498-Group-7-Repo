import React, { useState, useCallback } from 'react';
import './HelperTools.css';

/**
 * HelperTools -- Remote diagnostic terminal + quick-action grid (D5 section 7).
 *
 * Props:
 *   learnerName    - string
 *   hasActiveSession - boolean (watch or call active)
 *   onCall         - () => void
 *   onWatch        - () => void
 *   onRunCommand   - (cmd: string) => Promise<{ success, summary, details }>
 *   history        - [{ id, command, success, summary, details }]
 */

const QUICK_ACTIONS = [
  { id: 'battery',   icon: 'BAT',  label: 'Battery',   command: 'system_profiler SPBatteryDataType' },
  { id: 'disk',      icon: 'DSK',  label: 'Disk',      command: 'df -h' },
  { id: 'wifi',      icon: 'NET',  label: 'Wi-Fi',     command: 'networksetup -getairportnetwork en0' },
  { id: 'memory',    icon: 'MEM',  label: 'Memory',    command: 'vm_stat' },
  { id: 'temp',      icon: 'TMP',  label: 'Temp',      command: 'sudo powermetrics --samplers smc -n1' },
  { id: 'processes', icon: 'PRC',  label: 'Processes',  command: 'ps aux --sort=-%mem | head -10' },
];

function HelperTools({
  learnerName = 'Learner',
  hasActiveSession = false,
  onCall,
  onWatch,
  onRunCommand,
  history = [],
}) {
  const [customCmd, setCustomCmd] = useState('');
  const [expandedResult, setExpandedResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCommand = useCallback(
    async (cmd) => {
      if (!cmd.trim() || !onRunCommand) return;
      setIsRunning(true);
      try {
        await onRunCommand(cmd.trim());
      } finally {
        setIsRunning(false);
        setCustomCmd('');
      }
    },
    [onRunCommand]
  );

  const handleCustomRun = useCallback(() => {
    handleRunCommand(customCmd);
  }, [customCmd, handleRunCommand]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleCustomRun();
      }
    },
    [handleCustomRun]
  );

  const toggleDetails = useCallback((id) => {
    setExpandedResult((prev) => (prev === id ? null : id));
  }, []);

  // ── No Active Session: Empty State ──
  if (!hasActiveSession) {
    return (
      <div className="pcp-helper-tools" role="region" aria-label="Tools">
        <div className="pcp-helper-tools__empty">
          <div className="pcp-helper-tools__empty-icon" aria-hidden="true">
            W
          </div>
          <div className="pcp-helper-tools__empty-title">Tools need a session</div>
          <div className="pcp-helper-tools__empty-text">
            To run anything on {learnerName}&apos;s computer, you&apos;ll need to be in a session with her.
          </div>
          <div className="pcp-helper-tools__empty-actions">
            <button
              className="pcp-btn pcp-btn--primary"
              onClick={onCall}
              aria-label={`Call ${learnerName}`}
            >
              Call {learnerName}
            </button>
            <button
              className="pcp-btn pcp-btn--ghost"
              onClick={onWatch}
              aria-label={`Ask to watch ${learnerName}'s chat`}
            >
              Ask to watch her chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Session: Full Tools ──
  return (
    <div className="pcp-helper-tools" role="region" aria-label="Tools">
      <div className="pcp-helper-tools__content">
        {/* ── Quick-Action Grid ─────────────────────────────────── */}
        <div>
          <div className="pcp-helper-tools__section-label">Run a quick check</div>
        </div>
        <div className="pcp-helper-tools__grid" role="grid" aria-label="Quick diagnostic actions">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              className="pcp-helper-tools__tile"
              onClick={() => handleRunCommand(action.command)}
              disabled={isRunning}
              aria-label={`Run ${action.label} check`}
            >
              <span className="pcp-helper-tools__tile-icon" aria-hidden="true">
                {action.icon}
              </span>
              <span className="pcp-helper-tools__tile-label">{action.label}</span>
            </button>
          ))}
        </div>

        {/* ── Custom Command ────────────────────────────────────── */}
        <div className="pcp-helper-tools__cmd-section">
          <label htmlFor="pcp-helper-tools-cmd" className="pcp-helper-tools__section-label">Custom command</label>
          <input
            id="pcp-helper-tools-cmd"
            className="pcp-helper-tools__cmd-input"
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            placeholder="$ type a command..."
            value={customCmd}
            onChange={(e) => setCustomCmd(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Custom terminal command"
          />
          <button
            className="pcp-btn pcp-btn--primary pcp-helper-tools__run-btn"
            onClick={handleCustomRun}
            disabled={isRunning || !customCmd.trim()}
            aria-label={`Run command on ${learnerName}'s computer`}
          >
            {isRunning ? 'Running...' : `Run on ${learnerName}'s computer`}
          </button>
        </div>

        {/* ── History ───────────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="pcp-helper-tools__history">
            <div className="pcp-helper-tools__section-label">History</div>
            {history.map((result) => (
              <div key={result.id} className="pcp-helper-tools__result-card">
                <button
                  className="pcp-helper-tools__result-header"
                  onClick={() => toggleDetails(result.id)}
                  aria-expanded={expandedResult === result.id}
                  aria-label={`Command: ${result.command}, ${result.success ? 'succeeded' : 'failed'}`}
                >
                  <span className="pcp-helper-tools__result-cmd">$ {result.command}</span>
                  <span
                    className={`pcp-helper-tools__result-status ${
                      result.success
                        ? 'pcp-helper-tools__result-status--success'
                        : 'pcp-helper-tools__result-status--error'
                    }`}
                    aria-hidden="true"
                  >
                    {result.success ? '\u2713' : '\u2717'}
                  </span>
                </button>
                <div className="pcp-helper-tools__result-summary">{result.summary}</div>
                {expandedResult === result.id && result.details && (
                  <div className="pcp-helper-tools__result-details">{result.details}</div>
                )}
                {result.details && (
                  <button
                    className="pcp-helper-tools__result-toggle"
                    onClick={() => toggleDetails(result.id)}
                    aria-label={expandedResult === result.id ? 'Hide details' : 'Show details'}
                  >
                    {expandedResult === result.id ? '\u25B2 Hide' : '\u25BC Details'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HelperTools;
