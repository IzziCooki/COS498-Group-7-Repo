const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const config = require('./config');
require('./db/database');

const agentOrchestrator = require('./core/agentOrchestrator');
const imageGenerator = require('./core/imageGenerator');
const usersRouter = require('./routes/users');
const chatRouter = require('./routes/chat');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PC Pal server running' });
});

// Serve generated guide images
app.use('/images', express.static(path.join(__dirname, 'assets', 'generated')));

// REST routes
app.use('/api/users', usersRouter);
app.use('/api/chat', chatRouter);

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
          ws.send(JSON.stringify({ type: 'init_ack', userId }));
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
          const guideId = result.guideId || null;
          const imageUrls = guideId ? {
            keyboard: `/images/${guideId}_keyboard.png`,
            screen: `/images/${guideId}_screen.png`,
          } : null;

          ws.send(JSON.stringify({
            type: 'response',
            text: result.response,
            safetyAlert: result.safetyAlert,
            guideId,
            stepSequence: result.stepSequence || null,
            imageUrls,
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

// Generate guide images on startup
imageGenerator.generateAllGuideImages()
  .then(() => console.log('[imageGenerator] All guide images ready'))
  .catch(err => console.error('[imageGenerator] Failed to generate images:', err.message));

// Use server.listen instead of app.listen
server.listen(config.port, () => {
  console.log(`PC Pal server listening on port ${config.port}`);
});

module.exports = app;
