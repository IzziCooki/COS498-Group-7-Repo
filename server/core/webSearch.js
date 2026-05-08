'use strict';

/**
 * Tier 5 grounding — thin wrapper over Anthropic's first-party web
 * search server tool.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { anthropicApiKey } = require('../config');

const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_MAX_USES = 3;
const DEFAULT_MAX_RESULTS = 5;

let _injectedClient = null;

function _setClient(client) { _injectedClient = client; }

function getClient() {
  if (_injectedClient) return _injectedClient;
  if (!anthropicApiKey) return null;
  return new Anthropic({ apiKey: anthropicApiKey });
}

function extractSearchResults(response) {
  const out = [];
  if (!response || !Array.isArray(response.content)) return out;
  for (const block of response.content) {
    if (block.type !== 'web_search_tool_result') continue;
    const items = Array.isArray(block.content) ? block.content : [];
    for (const item of items) {
      if (!item || item.type !== 'web_search_result') continue;
      out.push({
        url: item.url || null,
        title: item.title || null,
        page_age: item.page_age || null,
        encrypted_content: item.encrypted_content || null,
      });
    }
  }
  return out;
}

async function webSearch(query, opts = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { ok: false, error: 'Query must be a non-empty string.' };
  }
  const client = getClient();
  if (!client) {
    return {
      ok: false,
      error:
        'Web search is unavailable — ANTHROPIC_API_KEY is not configured. ' +
        'The agent should fall back to suggesting the user visit a trusted support site.',
    };
  }

  const maxResults = Math.max(1, Math.min(opts.max_results || DEFAULT_MAX_RESULTS, 10));
  const maxUses = Math.max(1, Math.min(opts.max_uses || DEFAULT_MAX_USES, 5));
  const model = opts.model || DEFAULT_MODEL;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: maxUses,
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Search the web for the most relevant pages and return URLs and titles only. Query: ${query.trim()}`,
        },
      ],
    });
    const all = extractSearchResults(response);
    return {
      ok: true,
      query: query.trim(),
      results: all.slice(0, maxResults),
      total: all.length,
    };
  } catch (err) {
    return { ok: false, error: `Web search failed: ${err && err.message ? err.message : String(err)}` };
  }
}

function formatResults(payload) {
  if (!payload.ok) return `WEB_SEARCH_ERROR: ${payload.error}`;
  if (payload.results.length === 0) {
    return 'NO_WEB_SEARCH_RESULTS: The web search returned no usable results. Tell the user honestly that you could not find a verified answer.';
  }
  const lines = payload.results.map((r, i) =>
    `${i + 1}. ${r.title || '(no title)'}\n   URL: ${r.url || '(no url)'}${r.page_age ? `\n   Age: ${r.page_age}` : ''}`
  );
  return `WEB_SEARCH_RESULTS (${payload.results.length}):\n${lines.join('\n')}`;
}

module.exports = {
  webSearch,
  extractSearchResults,
  formatResults,
  _setClient,
  DEFAULT_MODEL,
};
