import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useSandbox — piggybacks on the existing useChat WebSocket to drive the
 * Auto-Fix Sandbox tab.
 *
 * Listens for two server message types:
 *   - autofix_progress: streamed tool-use events ({ phase, toolName, args, result, ... })
 *   - autofix_summary:  final completion event ({ ok, text, findings, sessionId, ... })
 *
 * Sends one outbound message:
 *   - { type: 'autofix_run', osType }
 *
 * The hook receives a wsRef from useChat so it shares the connection
 * rather than opening a parallel WebSocket.
 *
 * @param {React.MutableRefObject<WebSocket|null>} wsRef
 * @param {string|null} osType  client-side OS hint (optional)
 */
export function useSandbox(wsRef, osType) {
  const [running, setRunning] = useState(false);
  const [activity, setActivity] = useState([]); // [{ kind, toolName, text, ts }]
  const [summary, setSummary] = useState(null); // { ok, text, findings, sessionId, ... }
  const [error, setError] = useState(null);
  const idRef = useRef(0);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  // Map raw tool names to friendly activity log entries.
  const friendlyEntry = useCallback((event) => {
    const { phase, toolName, result, isError, args } = event;
    // Tool names come through as `mcp__pcpal-tools__<name>`.
    const bare = (toolName || '').replace(/^mcp__pcpal-tools(?:-sandbox)?__/, '');

    if (phase === 'tool_start') {
      const isFix = bare.startsWith('fix_');
      const label = LABELS[bare] || bare.replace(/_/g, ' ');
      const argHint = args && args.name ? ` (${args.name})` : '';
      return {
        id: nextId(),
        kind: isFix ? 'fix-start' : 'diag-start',
        toolName: bare,
        text: (isFix ? 'Fixing: ' : 'Checking: ') + label + argHint,
        ts: event.ts,
      };
    }
    if (phase === 'tool_end') {
      const ok = !isError && !/NEEDS_ADMIN|FAILED|REJECTED/.test(result || '');
      return {
        id: nextId(),
        kind: ok ? 'ok' : (/NEEDS_ADMIN/.test(result) ? 'needs-admin' : 'warn'),
        toolName: bare,
        text: ok ? 'Done.' : firstLine(result),
        ts: event.ts,
      };
    }
    if (phase === 'final') {
      return {
        id: nextId(),
        kind: 'final',
        text: `Finished — ${event.fixesAttempted} fix${event.fixesAttempted === 1 ? '' : 'es'} attempted across ${event.toolCallCount} tool calls.`,
        ts: event.ts,
      };
    }
    return null;
  }, []);

  useEffect(() => {
    const ws = wsRef?.current;
    if (!ws) return undefined;
    const handler = (msgEvent) => {
      let data;
      try { data = JSON.parse(msgEvent.data); } catch { return; }
      if (data.type === 'autofix_progress') {
        const entry = friendlyEntry(data);
        if (entry) setActivity(prev => [...prev, entry]);
      } else if (data.type === 'autofix_summary') {
        setRunning(false);
        if (data.ok) {
          setSummary({
            ok: true,
            text: data.text || '',
            findings: data.findings || null,
            sessionId: data.sessionId || null,
            toolCallCount: data.toolCallCount || 0,
            fixesAttempted: data.fixesAttempted || 0,
          });
          setError(null);
        } else {
          setError(data.error || 'Sandbox run failed.');
        }
      }
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [wsRef, friendlyEntry]);

  const start = useCallback(() => {
    const ws = wsRef?.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError('Not connected to PC Pal. Try reopening the app.');
      return;
    }
    setActivity([]);
    setSummary(null);
    setError(null);
    setRunning(true);
    ws.send(JSON.stringify({ type: 'autofix_run', osType }));
  }, [wsRef, osType]);

  const reset = useCallback(() => {
    setActivity([]);
    setSummary(null);
    setError(null);
    setRunning(false);
  }, []);

  return { running, activity, summary, error, start, reset };
}

const LABELS = {
  // Diagnostics
  get_system_info: 'system info',
  check_network: 'network and DNS',
  list_running_apps: 'running apps',
  read_error_log: 'recent error logs',
  check_disk_health: 'disk space',
  check_installed_software: 'installed apps',
  get_battery_status: 'battery',
  run_safe_command: 'system command',
  take_screenshot: 'the screen',
  // Fixes
  fix_flush_dns_cache: 'flush DNS cache',
  fix_renew_dhcp_lease: 'renew network address',
  fix_reset_winsock: 'reset network stack',
  fix_restart_network_adapter: 'restart Wi-Fi adapter',
  fix_kill_process_by_name: 'close frozen app',
  fix_restart_explorer: 'restart desktop',
  fix_clear_temp_files: 'clear temp files',
  fix_empty_recycle_bin: 'empty Recycle Bin',
  fix_run_sfc_scannow: 'check Windows system files (slow)',
  fix_run_dism_restore_health: 'repair Windows component store (slow)',
  fix_restart_print_spooler: 'restart print spooler',
  fix_restart_audio_service: 'restart audio service',
};

function firstLine(s) {
  if (!s) return '';
  const idx = s.indexOf('\n');
  return idx === -1 ? s : s.slice(0, idx);
}
