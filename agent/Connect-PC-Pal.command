#!/bin/bash
# PC Pal — Connect Your Computer
# Double-click this file to connect your Mac to PC Pal!

clear
echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║     PC Pal — Connect Your Computer  ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "  Node.js is needed but not installed."
    echo "  Opening the download page for you..."
    open "https://nodejs.org"
    echo ""
    echo "  After installing Node.js, double-click this file again."
    echo ""
    read -n 1 -s -r -p "  Press any key to close."
    exit 1
fi

# Create a temp working directory
WORKDIR="$HOME/.pcpal-agent"
mkdir -p "$WORKDIR"

# Write the agent script
cat > "$WORKDIR/agent.js" << 'AGENT_SCRIPT'
const { execSync } = require('child_process');
const os = require('os');

const serverUrl = process.env.PCPAL_SERVER || 'ws://localhost:3001/agent-ws';
const BLOCKED = [/\brm\s+-rf\s+\//, /\bmkfs\b/, /\bdd\b.*of=\/dev/, />\s*\/dev\//, /\bshutdown\b/, /\breboot\b/, /\bchmod\b/, /\bchown\b/, /\bcurl\b.*\|.*sh/, /\bformat\b/];

function run(cmd, timeout) {
  if (BLOCKED.some(p => p.test(cmd))) return { output: 'BLOCKED for safety.', error: true };
  try { return { output: execSync(cmd, { encoding: 'utf-8', timeout: timeout || 15000, maxBuffer: 512*1024, stdio: ['pipe','pipe','pipe'] }).trim(), error: false }; }
  catch(e) { return { output: e.stderr ? e.stderr.trim() : e.message, error: true }; }
}

function sysInfo() {
  return {
    platform: process.platform,
    os_version: process.platform === 'darwin' ? execSync('sw_vers -productVersion',{encoding:'utf-8'}).trim() : os.release(),
    hostname: os.hostname(), username: os.userInfo().username,
    cpu: os.cpus()[0]?.model || 'Unknown', cpu_cores: os.cpus().length,
    total_ram_gb: (os.totalmem()/(1024**3)).toFixed(1), free_ram_gb: (os.freemem()/(1024**3)).toFixed(1),
  };
}

const WebSocket = require('ws');
let cmdId = 0;

function connect() {
  const ws = new WebSocket(serverUrl);
  ws.on('open', () => ws.send(JSON.stringify({ type: 'agent_register', systemInfo: sysInfo() })));
  ws.on('message', (data) => {
    let m; try { m = JSON.parse(data); } catch { return; }
    if (m.type === 'agent_registered') {
      console.log('');
      console.log('  ╔══════════════════════════════════════╗');
      console.log('  ║          Connected!                  ║');
      console.log('  ║                                      ║');
      console.log('  ║  Your code:  ' + m.pairingCode + '                ║');
      console.log('  ║                                      ║');
      console.log('  ║  Go back to PC Pal in your browser,  ║');
      console.log('  ║  click "Connect Computer" and        ║');
      console.log('  ║  type this code.                     ║');
      console.log('  ║                                      ║');
      console.log('  ║  Keep this window open!              ║');
      console.log('  ╚══════════════════════════════════════╝');
      console.log('');
    } else if (m.type === 'agent_paired') {
      console.log('  Connected to PC Pal! You can minimize this window.');
      console.log('');
    } else if (m.type === 'agent_command') {
      console.log('  Running: ' + m.command.substring(0,60));
      const r = run(m.command, m.timeout);
      ws.send(JSON.stringify({ type: 'agent_command_result', requestId: m.requestId, command: m.command, output: r.output, error: r.error }));
    } else if (m.type === 'agent_ping') {
      ws.send(JSON.stringify({ type: 'agent_pong' }));
    }
  });
  ws.on('close', () => { console.log('  Reconnecting...'); setTimeout(connect, 5000); });
  ws.on('error', (e) => {
    if (e.code === 'ECONNREFUSED') console.log('  Waiting for PC Pal server...');
    else console.log('  Error: ' + e.message);
    setTimeout(connect, 5000);
  });
  process.on('SIGINT', () => { ws.close(); process.exit(0); });
}
connect();
AGENT_SCRIPT

# Write a minimal package.json
cat > "$WORKDIR/package.json" << 'PKG'
{"name":"pcpal-agent","version":"1.0.0","dependencies":{"ws":"^8.16.0"}}
PKG

# Install ws if needed (one-time, silent)
if [ ! -d "$WORKDIR/node_modules/ws" ]; then
    echo "  Setting up (one-time only)..."
    cd "$WORKDIR" && npm install --silent 2>/dev/null
    echo "  Done!"
    echo ""
fi

# Run it
echo "  Starting PC Pal helper..."
echo ""
cd "$WORKDIR" && node agent.js
