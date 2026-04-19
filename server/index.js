const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const config = require('./config');
require('./db/database');

// Use Agent SDK orchestrator if available, fall back to original
let agentOrchestrator;
try {
  agentOrchestrator = require('./core/agentSdkOrchestrator');
  console.log('[server] Using Agent SDK orchestrator');
} catch (err) {
  console.warn('[server] Agent SDK orchestrator unavailable, using original:', err.message);
  agentOrchestrator = require('./core/agentOrchestrator');
}
const skillProgression = require('./core/skillProgression');
const clientInfoStore = require('./core/clientInfoStore');
const conversationState = require('./core/conversationState');
const HelpRequest = require('./models/HelpRequest');
const usersRouter = require('./routes/users');
const chatRouter = require('./routes/chat');
const exportRouter = require('./routes/export');
const buddyRouter = require('./routes/buddy');
const qualityRouter = require('./routes/quality');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'assets', 'annotated')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PC Pal server running' });
});

// Serve the connect script that curl can pipe to bash
app.get('/api/connect-script', (req, res) => {
  // Determine the WebSocket URL for the agent to connect to
  const host = req.headers.host || 'localhost:3001';
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'wss' : 'ws';
  const wsUrl = `${protocol}://${host}/ws`;

  res.type('text/plain').send(`#!/bin/bash
# PC Pal — Connect Your Computer
# This script connects your computer to PC Pal

echo ""
echo "  Setting up PC Pal helper..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "  Node.js is needed. Opening download page..."
  open "https://nodejs.org" 2>/dev/null || xdg-open "https://nodejs.org" 2>/dev/null
  echo "  Install Node.js, then run this command again."
  exit 1
fi

# Setup directory
DIR="$HOME/.pcpal-agent"
mkdir -p "$DIR"

# Install ws if needed
if [ ! -d "$DIR/node_modules/ws" ]; then
  echo '{"dependencies":{"ws":"^8.16.0"}}' > "$DIR/package.json"
  cd "$DIR" && npm install --silent 2>/dev/null
  echo "  Ready!"
  echo ""
fi

# Write the agent script — server URL is baked in
cat > "$DIR/agent.js" << AGENTEOF
const os=require("os"),{execSync}=require("child_process"),WebSocket=require("ws");
const SERVER="${wsUrl}";
const BLOCKED=[/rm\\\\s+-rf\\\\s+\\\\//, /mkfs/, /dd.*of=\\\\/dev/, /shutdown/, /reboot/, /format/];
function run(c,t){if(BLOCKED.some(function(p){return p.test(c)}))return{output:"BLOCKED",error:true};try{return{output:execSync(c,{encoding:"utf-8",timeout:t||15e3,maxBuffer:512*1024,stdio:["pipe","pipe","pipe"]}).trim(),error:false}}catch(e){return{output:e.stderr?e.stderr.trim():e.message,error:true}}}
function info(){return{platform:process.platform,hostname:os.hostname(),username:os.userInfo().username,cpu:os.cpus()[0]&&os.cpus()[0].model||"Unknown",cpu_cores:os.cpus().length,total_ram_gb:(os.totalmem()/1073741824).toFixed(1),free_ram_gb:(os.freemem()/1073741824).toFixed(1)}}
var attempts=0;
function connect(){
  attempts++;
  var url=SERVER;
  if(attempts>3&&url.startsWith("ws://")){url=url.replace("ws://","wss://");console.log("  Trying secure connection...")}
  var ws=new WebSocket(url,{headers:{"User-Agent":"PCPalAgent/1.0"}});
  ws.on("open",function(){attempts=0;ws.send(JSON.stringify({type:"agent_register",systemInfo:info()}))});
  ws.on("message",function(d){var m;try{m=JSON.parse(d)}catch(e){return}
    if(m.type==="agent_registered"){console.log("");console.log("  Your code: "+m.pairingCode);console.log("");console.log("  Type this code in PC Pal and click Connect.");console.log("  Keep this window open!");console.log("")}
    else if(m.type==="agent_paired"){console.log("  Connected to PC Pal! You can minimize this window.")}
    else if(m.type==="agent_command"){var r=run(m.command,m.timeout);ws.send(JSON.stringify({type:"agent_command_result",requestId:m.requestId,command:m.command,output:r.output,error:r.error}))}
    else if(m.type==="agent_ping"){ws.send(JSON.stringify({type:"agent_pong"}))}
  });
  ws.on("close",function(){
    var delay=Math.min(attempts*2,30);
    console.log("  Reconnecting in "+delay+"s...");
    setTimeout(connect,delay*1000)
  });
  ws.on("error",function(e){
    if(attempts<=1){console.log("  Connecting to PC Pal at "+url+"...")}
    else if(attempts===4){console.log("  Still trying... make sure PC Pal is running.")}
    else if(attempts>10){console.log("  Cannot reach PC Pal. Check that the website is up and try again.");process.exit(1)}
  });
  process.on("SIGINT",function(){ws.close();process.exit(0)})
}
connect();
AGENTEOF

# Run from the agent directory so node can find ws
cd "$DIR" && node agent.js
`);
});

// Open Terminal on macOS (only works when running locally, not on deployed servers)
app.get('/api/open-terminal', (req, res) => {
  // Only allow on localhost — never on deployed servers
  const host = req.hostname || '';
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return res.json({ ok: false, reason: 'Only available when running locally' });
  }
  try {
    // Hardcoded command — no user input, safe
    require('child_process').execSync('open -a Terminal', { timeout: 5000 });
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

app.use('/api/users', usersRouter);
app.use('/api/chat', chatRouter);
app.use('/api/conversations', exportRouter);
app.use('/api/buddy', buddyRouter);
app.use('/api/quality', qualityRouter);

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Non-API routes fall through to React's index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path.startsWith('/images')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

const server = http.createServer(app);

// Single WebSocket server — chat clients and relay agents share /ws
// The first message determines the connection type:
//   { type: 'init', userId } → chat client
//   { type: 'agent_register', systemInfo } → relay agent
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 256 * 1024 });

const pendingAgents = new Map();   // code → { ws, systemInfo }
const pairedAgents = new Map();    // userId → { ws, systemInfo, code }
const pendingCommands = new Map(); // requestId → { resolve, timer }
let commandIdCounter = 0;

function generatePairingCode() {
  const words = ['APPLE', 'MAPLE', 'SUNNY', 'OCEAN', 'CLOUD', 'RIVER', 'BLOOM', 'PEARL', 'COZY', 'HAPPY',
    'BREEZE', 'GARDEN', 'SUNSET', 'MEADOW', 'CORAL', 'HARBOR', 'FOREST', 'WILLOW', 'CLOVER', 'SPARROW'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 2 digits: 10-99
  return word + num;
}

/**
 * Send a command to a paired relay agent and wait for the result.
 * Returns { output, error } or null if no agent is paired.
 */
function sendCommandToAgent(userId, command, timeout = 20000) {
  const agent = pairedAgents.get(userId);
  if (!agent || agent.ws.readyState !== 1) return null;

  const requestId = 'cmd_' + (++commandIdCounter);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingCommands.delete(requestId);
      resolve({ output: 'Command timed out. The computer may be busy.', error: true });
    }, timeout);

    pendingCommands.set(requestId, { resolve, timer });

    agent.ws.send(JSON.stringify({
      type: 'agent_command',
      requestId,
      command,
      timeout,
    }));
  });
}

function hasRelayAgent(userId) {
  const agent = pairedAgents.get(userId);
  return agent && agent.ws.readyState === 1;
}

app.locals.sendCommandToAgent = sendCommandToAgent;
app.locals.hasRelayAgent = hasRelayAgent;

wss.on('connection', (ws) => {
  let userId = null;
  let agentCode = null; // set if this connection is a relay agent
  let agentPingInterval = null;

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'init') {
        // Validate userId before associating the connection
        if (!msg.userId || typeof msg.userId !== 'string' || msg.userId.trim() === '') {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid or missing userId.' }));
          }
          return;
        }
        // Client sends userId to associate the connection
        userId = msg.userId;
        // Store browser-collected system info if provided
        if (msg.browserSystemInfo && typeof msg.browserSystemInfo === 'object') {
          clientInfoStore.set(userId, msg.browserSystemInfo);
        }
        if (ws.readyState === ws.OPEN) {
          let conversationId = null;
          try {
            const session = conversationState.getOrCreateSession(userId);
            conversationId = session.id;
          } catch (err) {
            console.error('[ws] Error getting/creating session on init:', err.message);
          }
          ws.send(JSON.stringify({ type: 'init_ack', userId, conversationId }));

          // Send welcome-back data: due skill reviews + answered help requests
          try {
            const reviewSkills = skillProgression.getSkillsForReview(userId);
            const answeredHelp = HelpRequest.findAnsweredForLearner(userId);
            const pendingHelp = answeredHelp.map(h => ({
              requestId: h.id,
              question: h.question,
              response: h.response,
              buddyName: h.helper_name || 'Your buddy',
            }));

            if (reviewSkills.length > 0 || pendingHelp.length > 0) {
              ws.send(JSON.stringify({
                type: 'welcome_back',
                reviewSkills,
                pendingHelp,
              }));
            }
          } catch (err) {
            console.error('[ws] Error building welcome_back:', err.message);
          }
        }
      } else if (msg.type === 'end_chat') {
        // User clicked "End chat". Close the active session (if any) and
        // reply so the client can show the feedback modal.
        if (!userId) {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not initialized. Send init message first.' }));
          }
          return;
        }
        try {
          const active = require('./models/Conversation').findActive(userId);
          const conversationId = active.length > 0 ? active[0].id : null;
          if (conversationId) {
            conversationState.closeSession(conversationId);
          }
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'chat_ended', conversationId }));
          }
        } catch (err) {
          console.error('[ws] Error ending chat:', err.message);
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Unable to end the chat.' }));
          }
        }
      } else if (msg.type === 'pair_agent') {
        // User is entering a pairing code to connect their computer
        const code = (msg.code || '').toUpperCase().trim();
        if (!userId || !code || code.length > 10) {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'pair_result', success: false, message: 'Please enter a valid code.' }));
          }
          return;
        }
        // Rate limit: max 5 pairing attempts per minute per user
        const now = Date.now();
        if (!ws._pairAttempts) ws._pairAttempts = [];
        ws._pairAttempts = ws._pairAttempts.filter(t => now - t < 60000);
        if (ws._pairAttempts.length >= 5) {
          ws.send(JSON.stringify({ type: 'pair_result', success: false, message: 'Too many attempts. Please wait a minute and try again.' }));
          return;
        }
        ws._pairAttempts.push(now);

        const agent = pendingAgents.get(code);
        if (!agent) {
          ws.send(JSON.stringify({ type: 'pair_result', success: false, message: 'Code not found. Make sure the helper program is running and try again.' }));
          return;
        }
        // Pair them
        pendingAgents.delete(code);
        pairedAgents.set(userId, { ws: agent.ws, systemInfo: agent.systemInfo, code });
        agent.ws.send(JSON.stringify({ type: 'agent_paired' }));
        ws.send(JSON.stringify({
          type: 'pair_result',
          success: true,
          message: 'Connected! PC Pal can now check your computer.',
          systemInfo: agent.systemInfo,
        }));
        console.log(`[relay] User ${userId} paired with agent ${code}`);

      } else if (msg.type === 'check_agent') {
        // Check if user has a connected relay agent
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'agent_status',
            connected: hasRelayAgent(userId),
          }));
        }

      } else if (msg.type === 'gather_resources') {
        // User clicked "Resources" button — gather videos + links
        if (!userId) {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not initialized.' }));
          }
          return;
        }
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'typing' }));
        }

        try {
          const youtubeSearch = require('./core/youtubeSearch');

          // Build search context from recent messages + user input
          const session = conversationState.getOrCreateSession(userId);
          const recentMsgs = conversationState.getSessionMessages(session.id, 10);
          const conversationTopics = recentMsgs
            .map(m => m.body)
            .join(' ')
            .substring(0, 500);
          const extraText = msg.text || '';
          const searchContext = extraText || conversationTopics;

          // Extract a concise topic using simple keyword extraction
          const topic = extraText || recentMsgs
            .filter(m => m.role === 'user')
            .map(m => m.body)
            .slice(-2)
            .join(' ')
            .substring(0, 100) || 'computer help';

          // Search YouTube
          const videos = await youtubeSearch.searchVideos(topic, 3);

          // Use the AI to generate a brief summary and relevant links
          let summary = `Here are resources related to: ${topic}`;
          let links = [];

          try {
            const { anthropicApiKey } = require('./config');
            const { matchSkill, buildSkillPrompt } = require('./core/skillMatcher');

            if (anthropicApiKey && process.env.MOCK_MODE !== 'true') {
              // Load the gather-resources skill prompt for curation guidance
              const skillMatch = matchSkill('find resources about ' + topic);
              const skillPrompt = skillMatch ? buildSkillPrompt(skillMatch.skill) : '';

              const Anthropic = require('@anthropic-ai/sdk');
              const client = new Anthropic({ apiKey: anthropicApiKey });
              const aiResponse = await client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 800,
                system: `You curate learning resources for elderly and beginner computer users. ${skillPrompt}`,
                messages: [{
                  role: 'user',
                  content: `The user is learning about: "${topic}". Recent conversation: "${conversationTopics.substring(0, 300)}".

Return a JSON object with:
1. "summary": A 2-3 sentence plain-English summary of the topic and why these resources help (under 60 words). Write like you're explaining to a grandparent.
2. "links": An array of 3-5 resource objects, each with:
   - "title": Name of the resource
   - "url": Real URL (only well-known sites you're confident exist: Apple Support, Microsoft Support, wikiHow, YouTube, public libraries)
   - "description": One sentence explaining WHY this is useful, e.g. "Shows you exactly which buttons to click with big pictures"
   - "time": Estimated time, e.g. "Quick read (2 min)" or "Short video (5 min)"
   - "type": One of "watch", "read", or "try"

Order from easiest to most detailed. ONLY include URLs you are confident are real. Return ONLY valid JSON.`,
                }],
              });
              const jsonText = aiResponse.content[0]?.text || '';
              // Strip markdown fences if present
              const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              summary = parsed.summary || summary;
              links = parsed.links || [];
            }
          } catch (aiErr) {
            console.error('[ws] AI resource generation failed:', aiErr.message);
          }

          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
              type: 'resources',
              text: summary,
              resources: {
                topic: topic.substring(0, 80),
                summary,
                videos,
                links,
              },
            }));
          }
        } catch (err) {
          console.error('[ws] gather_resources error:', err);
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Unable to gather resources right now.' }));
          }
        }

      } else if (msg.type === 'run_command') {
        // User approved a command from a guide artifact
        if (!userId || !msg.command) {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'command_result', command: msg.command || '', output: 'Invalid request.', error: true }));
          }
          return;
        }
        const systemDiagnostics = require('./core/systemDiagnostics');
        const cmd = msg.command.trim();
        console.log(`[ws] User ${userId} approved command: "${cmd}"`);

        // Use the same sandbox as systemDiagnostics.runSafeCommand
        // This ensures ALL commands go through the allowlist + blocklist
        const output = systemDiagnostics.runSafeCommand(cmd);
        const isBlocked = output.includes('BLOCKED');
        ws.send(JSON.stringify({
          type: 'command_result',
          command: cmd,
          output: output,
          error: isBlocked,
        }));

      } else if (msg.type === 'chat') {
        // Process the chat message through the agent orchestrator
        if (!userId) {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not initialized. Send init message first.' }));
          }
          return;
        }
        // Validate msg.text before processing
        if (!msg.text || typeof msg.text !== 'string') {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid or missing message text.' }));
          }
          return;
        }
        // Send a "typing" indicator
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'typing' }));
        }

        const result = await agentOrchestrator.processMessage(msg.text, userId);

        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'response',
            text: result.response,
            safetyAlert: result.safetyAlert,
            stepSequence: result.stepSequence || null,
            videos: result.videos || null,
            guide: result.guide || null,
            findings: result.findings || null,
            endedConversationId: result.endedConversationId || null,
            conversationId: result.conversationId || null,
          }));
        }
      // Relay agent messages — same /ws path, distinguished by message type
      } else if (msg.type === 'agent_register') {
        agentCode = generatePairingCode();
        pendingAgents.set(agentCode, { ws, systemInfo: msg.systemInfo || {} });
        ws.send(JSON.stringify({ type: 'agent_registered', pairingCode: agentCode }));
        console.log(`[relay] Agent registered with code: ${agentCode}`);
        setTimeout(() => {
          if (pendingAgents.has(agentCode)) {
            pendingAgents.delete(agentCode);
            console.log(`[relay] Pairing code ${agentCode} expired`);
          }
        }, 5 * 60 * 1000);
        // Start keepalive pings for relay agents
        agentPingInterval = setInterval(() => {
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'agent_ping' }));
          else clearInterval(agentPingInterval);
        }, 30000);

      } else if (msg.type === 'agent_command_result') {
        const pending = pendingCommands.get(msg.requestId);
        if (pending) {
          clearTimeout(pending.timer);
          pendingCommands.delete(msg.requestId);
          pending.resolve({ output: msg.output, error: msg.error });
        }

      } else if (msg.type === 'agent_pong') {
        // keepalive response
      }
    } catch (err) {
      console.error('[ws] Error processing message:', err);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'error', message: 'Something went wrong.' }));
      }
    }
  });

  ws.on('close', () => {
    console.log(`[ws] Connection closed for userId=${userId} agentCode=${agentCode}`);
    if (userId) clientInfoStore.remove(userId);
    if (agentPingInterval) clearInterval(agentPingInterval);
    // Clean up relay agent state
    if (agentCode) {
      pendingAgents.delete(agentCode);
      for (const [uid, agent] of pairedAgents.entries()) {
        if (agent.code === agentCode) {
          pairedAgents.delete(uid);
          console.log(`[relay] Agent ${agentCode} disconnected from user ${uid}`);
          break;
        }
      }
    }
  });

  ws.on('error', (err) => {
    console.error('[ws] Socket error:', err.message);
  });
});

process.on('SIGTERM', () => {
  wss.close(() => { server.close(() => process.exit(0)); });
});

server.listen(config.port, () => {
  const mode = process.env.ELECTRON_MODE ? 'desktop (Electron)' : 'web';
  console.log(`PC Pal server listening on port ${config.port} [${mode} mode]`);
});

module.exports = server;
