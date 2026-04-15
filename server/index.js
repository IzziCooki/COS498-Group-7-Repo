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
const imageAnnotator = require('./core/imageAnnotator');
const { getImagesForSkill } = require('./core/skillImages');
const skillProgression = require('./core/skillProgression');
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

// Serve annotated screenshot images
app.use('/images', express.static(path.join(__dirname, 'assets', 'annotated')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PC Pal server running' });
});

// REST routes
app.use('/api/users', usersRouter);
app.use('/api/chat', chatRouter);
app.use('/api/conversations', exportRouter);
app.use('/api/buddy', buddyRouter);
app.use('/api/quality', qualityRouter);

// Serve React build in production
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// All non-API routes fall through to React's index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path.startsWith('/images')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// Create HTTP server so WebSocket can share the same port
const server = http.createServer(app);

// WebSocket server at /ws
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });

wss.on('connection', (ws) => {
  let userId = null;

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

        // Use the safe command runner but with a broader allowlist for user-approved commands
        let output;
        try {
          const { execSync } = require('child_process');
          // Block only truly destructive patterns
          const BLOCKED = [/\brm\s+-rf\s+\//, /\bmkfs\b/, /\bdd\b.*of=\/dev/, />\s*\/dev\//, /\bshutdown\b/, /\breboot\b/];
          const isBlocked = BLOCKED.some(p => p.test(cmd));
          if (isBlocked) {
            output = 'This command was blocked for safety. It could damage your system.';
            ws.send(JSON.stringify({ type: 'command_result', command: cmd, output, error: true }));
          } else {
            output = execSync(cmd, { encoding: 'utf-8', timeout: 30000, maxBuffer: 1024 * 512, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
            ws.send(JSON.stringify({ type: 'command_result', command: cmd, output, error: false }));
          }
        } catch (err) {
          output = err.stderr ? err.stderr.trim() : err.message;
          ws.send(JSON.stringify({ type: 'command_result', command: cmd, output, error: true }));
        }

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
          // Look up annotated images if a skill matched
          const images = (result.matchedSkillId && result.userOsType)
            ? getImagesForSkill(result.matchedSkillId, result.userOsType)
            : null;

          ws.send(JSON.stringify({
            type: 'response',
            text: result.response,
            safetyAlert: result.safetyAlert,
            stepSequence: result.stepSequence || null,
            images: images,
            videos: result.videos || null,
            guide: result.guide || null,
            findings: result.findings || null,
            endedConversationId: result.endedConversationId || null,
            conversationId: result.conversationId || null,
          }));
        }
      }
    } catch (err) {
      console.error('[ws] Error processing message:', err);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'error', message: 'Something went wrong.' }));
      }
    }
  });

  ws.on('close', () => {
    console.log(`[ws] Connection closed for userId=${userId}`);
  });

  ws.on('error', (err) => {
    console.error('[ws] Socket error:', err.message);
  });
});

process.on('SIGTERM', () => {
  wss.close(() => { server.close(() => process.exit(0)); });
});

// Generate annotated screenshots on startup
imageAnnotator.generateAllAnnotations()
  .then(() => console.log('[imageAnnotator] All annotated images ready'))
  .catch(err => console.error('[imageAnnotator] Failed:', err.message));

// Use server.listen instead of app.listen
server.listen(config.port, () => {
  const mode = process.env.ELECTRON_MODE ? 'desktop (Electron)' : 'web';
  console.log(`PC Pal server listening on port ${config.port} [${mode} mode]`);
});

module.exports = server;
