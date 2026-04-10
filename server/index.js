const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const config = require('./config');
require('./db/database');

const agentOrchestrator = require('./core/agentOrchestrator');
const usersRouter = require('./routes/users');
const chatRouter = require('./routes/chat');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PC Pal server running' });
});

// REST routes
app.use('/api/users', usersRouter);
app.use('/api/chat', chatRouter);

// Create HTTP server so WebSocket can share the same port
const server = http.createServer(app);

// WebSocket server at /ws
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'init') {
        // Client sends userId to associate the connection
        userId = msg.userId;
        ws.send(JSON.stringify({ type: 'init_ack', userId }));
      } else if (msg.type === 'chat') {
        // Process the chat message through the agent orchestrator
        if (!userId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not initialized. Send init message first.' }));
          return;
        }
        // Send a "typing" indicator
        ws.send(JSON.stringify({ type: 'typing' }));

        const result = await agentOrchestrator.processMessage(msg.text, userId);

        ws.send(JSON.stringify({
          type: 'response',
          text: result.response,
          safetyAlert: result.safetyAlert,
        }));
      }
    } catch (err) {
      console.error('[ws] Error processing message:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Something went wrong.' }));
    }
  });
});

// Use server.listen instead of app.listen
server.listen(config.port, () => {
  console.log(`PC Pal server listening on port ${config.port}`);
});

module.exports = app;
