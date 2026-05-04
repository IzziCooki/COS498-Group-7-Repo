const express = require('express');
const http = require('http');
const skillsRouter = require('../routes/skills');
const { getAllSkills } = require('../core/skillMatcher');

function startServer() {
  return new Promise((resolve) => {
    const app = express();
    app.use('/api/skills', skillsRouter);
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function getJSON(server, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    // agent: false → no keepalive, so the socket closes cleanly after the
    // response; otherwise server.close() hangs on Linux CI waiting for the
    // pooled connection to time out.
    http.get({ host: '127.0.0.1', port, path, agent: false }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

describe('GET /api/skills/quick-help', () => {
  let server;

  beforeAll(async () => { server = await startServer(); });
  afterAll(async () => {
    // closeAllConnections (Node 18.2+) belt-and-suspenders for any pooled
    // sockets the test runner might have left dangling.
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
  });

  it('returns only skills marked quickHelp: true', async () => {
    const { status, body } = await getJSON(server, '/api/skills/quick-help');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const flaggedIds = new Set(
      getAllSkills().filter((s) => s.quickHelp === true).map((s) => s.id)
    );
    expect(flaggedIds.size).toBe(body.length);
    for (const tile of body) {
      expect(flaggedIds.has(tile.id)).toBe(true);
    }
  });

  it('every tile has the fields the client renders', async () => {
    const { body } = await getJSON(server, '/api/skills/quick-help');
    for (const tile of body) {
      expect(typeof tile.id).toBe('string');
      expect(typeof tile.label).toBe('string');
      expect(tile.label.length).toBeGreaterThan(0);
      expect(typeof tile.emoji).toBe('string');
      expect(tile.emoji.length).toBeGreaterThan(0);
      expect(typeof tile.starter).toBe('string');
      expect(tile.starter.length).toBeGreaterThan(0);
      expect(typeof tile.category).toBe('string');
    }
  });

  it('orders tiles ascending by quickHelpOrder', async () => {
    const { body } = await getJSON(server, '/api/skills/quick-help');
    for (let i = 1; i < body.length; i++) {
      expect(body[i].order).toBeGreaterThanOrEqual(body[i - 1].order);
    }
  });

  it('does not leak the full skill prompt to the client', async () => {
    const { body } = await getJSON(server, '/api/skills/quick-help');
    for (const tile of body) {
      expect(tile.prompt).toBeUndefined();
      expect(tile.triggers).toBeUndefined();
    }
  });
});
