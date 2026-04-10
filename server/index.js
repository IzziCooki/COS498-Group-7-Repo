const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PC Pal server running' });
});

app.listen(config.port, () => {
  console.log(`PC Pal server listening on port ${config.port}`);
});

module.exports = app;
