'use strict';

const https = require('https');
const http = require('http');

/**
 * Send a single HTTP request and resolve with status info.
 */
function sendRequest(url, method, timeoutMs) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method, timeout: timeoutMs }, (res) => {
      // Consume the body so the socket is freed
      res.resume();
      resolve({
        url,
        valid: res.statusCode >= 200 && res.statusCode < 400,
        statusCode: res.statusCode,
      });
    });
    req.on('error', () => resolve({ url, valid: false, statusCode: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ url, valid: false, statusCode: 0 }); });
    req.end();
  });
}

/**
 * Validate a single URL. Tries HEAD first, falls back to GET if HEAD
 * returns 404/405 (some sites like Google Support block HEAD requests).
 * Returns { url, valid, statusCode }.
 */
async function validateUrl(url, timeoutMs = 5000) {
  const headResult = await sendRequest(url, 'HEAD', timeoutMs);
  if (headResult.valid) return headResult;
  // Retry with GET for sites that block HEAD
  if (headResult.statusCode === 404 || headResult.statusCode === 405) {
    return sendRequest(url, 'GET', timeoutMs);
  }
  return headResult;
}

/**
 * Validate multiple URLs in parallel.
 * Returns array of { url, valid, statusCode }.
 */
function validateBatch(urls, timeoutMs = 5000) {
  return Promise.all(urls.map(url => validateUrl(url, timeoutMs)));
}

module.exports = { validateUrl, validateBatch };
