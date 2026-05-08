'use strict';

/**
 * Tier 4 grounding — fetch a specific URL from a hardcoded allowlist
 * of trusted support domains, extract the main text content, and
 * return ~2000 chars suitable for the agent to summarize and cite.
 */

const cheerio = require('cheerio');

const ALLOWED_DOMAINS = [
  'support.microsoft.com',
  'support.apple.com',
  'support.google.com',
  'support.mozilla.org',
];

const MAX_CONTENT_CHARS = 2000;
const FETCH_TIMEOUT_MS = 8000;

function isAllowedHost(hostname) {
  const h = hostname.toLowerCase();
  return ALLOWED_DOMAINS.some((d) => h === d || h.endsWith('.' + d));
}

function validateUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (_) {
    return { ok: false, error: `Invalid URL: ${rawUrl}` };
  }
  if (parsed.protocol !== 'https:') {
    return { ok: false, error: `Only HTTPS URLs allowed, got ${parsed.protocol}` };
  }
  if (!isAllowedHost(parsed.hostname)) {
    return {
      ok: false,
      error:
        `Domain ${parsed.hostname} is not on the allowlist. ` +
        `Allowed: ${ALLOWED_DOMAINS.join(', ')}.`,
    };
  }
  return { ok: true, url: parsed };
}

function extractMainText(html) {
  const $ = cheerio.load(html);

  $('script, style, noscript, nav, footer, header, aside, form, iframe, .nav, .navigation, .breadcrumb').remove();

  const candidateSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '#mainContent',
    '#main-content',
    '.content',
    '#content',
  ];

  let mainText = '';
  for (const sel of candidateSelectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) {
      mainText = el.text();
      break;
    }
  }
  if (!mainText) mainText = $('body').text();

  const cleaned = mainText.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (cleaned.length <= MAX_CONTENT_CHARS) return cleaned;
  return cleaned.slice(0, MAX_CONTENT_CHARS - 1).trimEnd() + '…';
}

function extractTitle(html) {
  const $ = cheerio.load(html);
  const t = $('title').first().text().trim() || $('h1').first().text().trim();
  return t || null;
}

async function allowlistedFetch(rawUrl, opts = {}) {
  const v = validateUrl(rawUrl);
  if (!v.ok) return v;

  const fetchFn = opts.fetchFn || globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    return { ok: false, error: 'No fetch implementation available in this runtime.' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetchFn(v.url.href, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'PCPalAgent/1.0 (+https://github.com/anthropic/pcpal)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) {
      return { ok: false, error: `Fetch failed: HTTP ${res.status} for ${v.url.href}` };
    }
    const ctype = (res.headers && typeof res.headers.get === 'function')
      ? (res.headers.get('content-type') || '')
      : '';
    if (ctype && !ctype.includes('text/html') && !ctype.includes('application/xhtml')) {
      return { ok: false, error: `Refusing to extract from non-HTML content-type: ${ctype}` };
    }
    const html = await res.text();
    return {
      ok: true,
      url: v.url.href,
      title: extractTitle(html),
      content: extractMainText(html),
    };
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { ok: false, error: `Fetch timed out after ${FETCH_TIMEOUT_MS}ms` };
    }
    return { ok: false, error: `Fetch error: ${err && err.message ? err.message : String(err)}` };
  } finally {
    clearTimeout(timer);
  }
}

function formatResult(payload) {
  if (!payload.ok) return `WEB_FETCH_ERROR: ${payload.error}`;
  return [
    `WEB_FETCH_RESULT:`,
    `URL: ${payload.url}`,
    payload.title ? `Title: ${payload.title}` : null,
    `---`,
    payload.content,
  ].filter(Boolean).join('\n');
}

module.exports = {
  allowlistedFetch,
  validateUrl,
  isAllowedHost,
  extractMainText,
  extractTitle,
  formatResult,
  ALLOWED_DOMAINS,
  MAX_CONTENT_CHARS,
};
