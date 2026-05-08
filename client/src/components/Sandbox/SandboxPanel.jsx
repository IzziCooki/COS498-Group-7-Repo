import React, { useMemo } from 'react';
import { useSandbox } from '../../hooks/useSandbox';
import './SandboxPanel.css';

/**
 * SandboxPanel — Auto-Fix Sandbox tab.
 *
 * Click "Run Diagnostics & Fix" and the agent autonomously inspects the
 * computer, applies curated fix tools, and reports a summary. Lives in
 * its own tab — the normal chat is unaffected.
 *
 * Desktop-only: in web mode the server cannot see the user's machine, so
 * the server returns an error which we render as a banner.
 */
export default function SandboxPanel({ chatData }) {
  const isDesktop = typeof window !== 'undefined'
    && (window.pcpal?.isDesktopApp || /Electron/i.test(navigator.userAgent || ''));

  const osType = useMemo(() => {
    const platform = window.pcpal?.platform;
    if (platform === 'win32') return 'Windows';
    if (platform === 'darwin') return 'macOS';
    if (platform === 'linux') return 'Linux';
    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.includes('win')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    return null;
  }, []);

  const { running, activity, summary, error, start, reset } = useSandbox(chatData?.wsRef, osType);

  return (
    <div className="pcp-sandbox">
      <div className="pcp-sandbox__hero">
        <h1 className="pcp-sandbox__title">Auto-Fix Sandbox</h1>
        <p className="pcp-sandbox__subtitle">
          Click and forget. PC Pal will look for problems and fix them on its own.
        </p>

        {!isDesktop && (
          <div className="pcp-sandbox__banner pcp-sandbox__banner--warn" role="status">
            Auto-Fix only works in the desktop app. In the web app, PC Pal can&apos;t
            see your computer.
          </div>
        )}

        <button
          type="button"
          className="pcp-sandbox__run-btn"
          onClick={start}
          disabled={running}
          aria-busy={running}
        >
          {running ? 'Working…' : (summary || error ? 'Run again' : 'Run Diagnostics & Fix')}
        </button>

        {(summary || error) && !running && (
          <button
            type="button"
            className="pcp-sandbox__reset-btn"
            onClick={reset}
          >
            Clear results
          </button>
        )}
      </div>

      {error && (
        <div className="pcp-sandbox__banner pcp-sandbox__banner--error" role="alert">
          {error}
        </div>
      )}

      {(running || activity.length > 0) && (
        <section className="pcp-sandbox__section" aria-labelledby="pcp-sandbox-activity-h">
          <h2 id="pcp-sandbox-activity-h" className="pcp-sandbox__section-title">Activity</h2>
          <ol className="pcp-sandbox__log">
            {activity.length === 0 && running && (
              <li className="pcp-sandbox__log-item pcp-sandbox__log-item--info">
                Getting started…
              </li>
            )}
            {activity.map((entry) => (
              <li
                key={entry.id}
                className={[
                  'pcp-sandbox__log-item',
                  `pcp-sandbox__log-item--${entry.kind}`,
                ].join(' ')}
              >
                <span className="pcp-sandbox__log-icon" aria-hidden="true">
                  {iconFor(entry.kind)}
                </span>
                <span className="pcp-sandbox__log-text">{entry.text}</span>
              </li>
            ))}
            {running && (
              <li className="pcp-sandbox__log-item pcp-sandbox__log-item--info">
                <span className="pcp-sandbox__log-icon" aria-hidden="true">…</span>
                <span className="pcp-sandbox__log-text">Working…</span>
              </li>
            )}
          </ol>
        </section>
      )}

      {summary && summary.ok && (
        <section className="pcp-sandbox__section" aria-labelledby="pcp-sandbox-summary-h">
          <h2 id="pcp-sandbox-summary-h" className="pcp-sandbox__section-title">Summary</h2>
          <div className="pcp-sandbox__summary">
            {summary.text && (
              <p className="pcp-sandbox__summary-text">{summary.text}</p>
            )}
            {summary.findings?.findings?.length > 0 && (
              <dl className="pcp-sandbox__findings">
                {summary.findings.findings.map((f, i) => (
                  <div
                    key={i}
                    className={[
                      'pcp-sandbox__finding',
                      `pcp-sandbox__finding--${f.status || 'good'}`,
                    ].join(' ')}
                  >
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="pcp-sandbox__summary-meta">
              {summary.fixesAttempted} fix{summary.fixesAttempted === 1 ? '' : 'es'} applied across {summary.toolCallCount} tool calls.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function iconFor(kind) {
  switch (kind) {
    case 'diag-start': return '\u{1F50D}'; // magnifier
    case 'fix-start':  return '\u{1F527}'; // wrench
    case 'ok':         return '✓';     // check
    case 'warn':       return '⚠';     // warning
    case 'needs-admin':return '\u{1F510}'; // closed lock
    case 'final':      return '\u{1F389}'; // party
    default:           return '·';     // middle dot
  }
}
