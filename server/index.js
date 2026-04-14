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
