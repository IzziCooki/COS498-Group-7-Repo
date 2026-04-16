#!/usr/bin/env node

/**
 * PC Pal Relay Agent
 *
 * A tiny agent that runs on the user's computer and connects
 * back to the PC Pal web server. Allows the web-based AI to
 * run safe diagnostic commands on the user's actual machine.
 *
 * Usage:
 *   node pcpal-agent.js [server-url]
 *   npx pcpal-agent
 *
 * The agent:
 * 1. Connects to the PC Pal server via WebSocket
 * 2. Receives a 6-character pairing code
 * 3. User enters the code in the web app
 * 4. Server relays diagnostic commands through this agent
 * 5. Agent runs commands locally (sandboxed) and sends results back
 */

const { execSync } = require('child_process');
const os = require('os');
const { BLOCKED_PATTERNS } = require('../server/core/sharedConstants');

// ─── Configuration ───────────────────────────────────────────────

const DEFAULT_SERVER = 'ws://localhost:3001/agent-ws';
const serverUrl = process.argv[2] || process.env.PCPAL_SERVER || DEFAULT_SERVER;

// ─── Safety: blocked command patterns ────────────────────────────
// BLOCKED_PATTERNS imported from sharedConstants.js — single source of truth

function isSafe(cmd) {
  return !BLOCKED_PATTERNS.some(p => p.test(cmd));
}

function runCommand(cmd, timeout = 15000) {
  if (!isSafe(cmd)) {
    return { output: 'BLOCKED: This command was blocked for your safety.', error: true };
  }
  try {
    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout,
      maxBuffer: 1024 * 512,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return { output, error: false };
  } catch (err) {
    return { output: err.stderr ? err.stderr.trim() : err.message, error: true };
  }
}

// ─── System info (sent on connect for context) ───────────────────

function getSystemSummary() {
  return {
    platform: process.platform,
    os_version: process.platform === 'darwin'
      ? execSync('sw_vers -productVersion', { encoding: 'utf-8' }).trim()
      : os.release(),
    hostname: os.hostname(),
    username: os.userInfo().username,
    cpu: os.cpus()[0]?.model || 'Unknown',
    cpu_cores: os.cpus().length,
    total_ram_gb: (os.totalmem() / (1024 ** 3)).toFixed(1),
    free_ram_gb: (os.freemem() / (1024 ** 3)).toFixed(1),
  };
}

// ─── WebSocket connection ────────────────────────────────────────

let WebSocket;
try {
  WebSocket = require('ws');
} catch {
  // ws not installed — use a minimal implementation
  // This should not happen when run via npx with the package.json
  console.error('Error: "ws" package not found. Run: npm install ws');
  process.exit(1);
}

function connect() {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║        PC Pal Computer Helper        ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log('  ║  Connecting to PC Pal server...      ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');

  const ws = new WebSocket(serverUrl);

  ws.on('open', () => {
    // Register as a relay agent
    const systemInfo = getSystemSummary();
    ws.send(JSON.stringify({
      type: 'agent_register',
      systemInfo,
    }));
  });

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    if (msg.type === 'agent_registered') {
      console.log('  ╔══════════════════════════════════════╗');
      console.log('  ║          Connected!                  ║');
      console.log('  ║                                      ║');
      console.log(`  ║  Your code:  ${msg.pairingCode}                ║`);
      console.log('  ║                                      ║');
      console.log('  ║  Go to the PC Pal website and        ║');
      console.log('  ║  click "Connect Computer", then      ║');
      console.log('  ║  type this code.                     ║');
      console.log('  ║                                      ║');
      console.log('  ║  Keep this window open!              ║');
      console.log('  ╚══════════════════════════════════════╝');
      console.log('');
    } else if (msg.type === 'agent_paired') {
      console.log('  ✓ Paired with the website! PC Pal can now help with your computer.');
      console.log('');
    } else if (msg.type === 'agent_command') {
      // Server is requesting a command to run
      const cmd = msg.command;
      console.log(`  → Running: ${cmd.substring(0, 60)}${cmd.length > 60 ? '...' : ''}`);
      const result = runCommand(cmd, msg.timeout || 15000);
      ws.send(JSON.stringify({
        type: 'agent_command_result',
        requestId: msg.requestId,
        command: cmd,
        output: result.output,
        error: result.error,
      }));
      console.log(`  ← Done (${result.error ? 'error' : 'ok'})`);
    } else if (msg.type === 'agent_ping') {
      ws.send(JSON.stringify({ type: 'agent_pong' }));
    }
  });

  ws.on('close', () => {
    console.log('  Disconnected from PC Pal. Reconnecting in 5 seconds...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.log(`  Cannot reach PC Pal server at ${serverUrl}`);
      console.log('  Make sure PC Pal is running. Retrying in 5 seconds...');
    } else {
      console.log(`  Connection error: ${err.message}. Retrying in 5 seconds...`);
    }
    setTimeout(connect, 5000);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n  Disconnecting from PC Pal. Goodbye!');
    ws.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    ws.close();
    process.exit(0);
  });
}

connect();
