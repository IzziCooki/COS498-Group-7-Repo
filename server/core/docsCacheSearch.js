'use strict';

/**
 * Tier 3 grounding — search the static markdown corpus under
 * server/docs-cache/. The corpus is built offline by
 * `node scripts/ingest-docs.js`, which writes a single JSON artifact
 * (`.index.json`) containing both the document store and a serialized
 * MiniSearch BM25 index. We load that artifact lazily on first use and
 * keep it in module scope.
 *
 * The agent calls `searchDocsCache(query, { os, limit })` and gets
 * back the top-N chunks, each with its source URL and heading path so
 * the agent can cite the upstream support page in its answer.
 */

const fs = require('fs');
const path = require('path');
const MiniSearch = require('minisearch');

const INDEX_PATH = path.resolve(__dirname, '..', 'docs-cache', '.index.json');

let _cache = null;

function loadIndex() {
  if (_cache) return _cache;
  if (!fs.existsSync(INDEX_PATH)) return null;

  const raw = fs.readFileSync(INDEX_PATH, 'utf8');
  const payload = JSON.parse(raw);
  const mini = MiniSearch.loadJSON(JSON.stringify(payload.index), {
    fields: ['title', 'heading', 'body'],
    storeFields: ['id', 'path', 'os', 'title', 'heading', 'body', 'source_url', 'last_verified'],
    searchOptions: {
      boost: { heading: 3, title: 2, body: 1 },
      fuzzy: 0.15,
      prefix: true,
    },
  });

  _cache = {
    mini,
    documents: payload.documents || [],
    generated_at: payload.generated_at,
    chunk_count: payload.chunk_count || (payload.documents ? payload.documents.length : 0),
  };
  return _cache;
}

function _resetCache() {
  _cache = null;
}

function searchDocsCache(query, opts = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { ok: false, error: 'Query must be a non-empty string.' };
  }

  const cache = loadIndex();
  if (!cache) {
    return {
      ok: false,
      error:
        'Docs cache index is missing. Run `node scripts/ingest-docs.js` to build it before using search_docs_cache.',
    };
  }

  const limit = Math.max(1, Math.min(opts.limit || 5, 10));
  const filterOs = opts.os ? String(opts.os).toLowerCase() : null;

  const hits = cache.mini.search(query.trim(), {
    filter: filterOs
      ? (doc) => doc.os === filterOs || doc.os === 'general'
      : undefined,
  });

  const results = hits.slice(0, limit).map((hit) => ({
    id: hit.id,
    title: hit.title,
    heading: hit.heading,
    os: hit.os,
    source_url: hit.source_url,
    last_verified: hit.last_verified,
    excerpt: truncateExcerpt(hit.body, 600),
    score: Number(hit.score.toFixed(3)),
  }));

  return {
    ok: true,
    results,
    generated_at: cache.generated_at,
    chunk_count: cache.chunk_count,
    matched: hits.length,
  };
}

function truncateExcerpt(text, max) {
  if (!text) return '';
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

function formatResults(payload) {
  if (!payload.ok) return `DOCS_CACHE_ERROR: ${payload.error}`;
  if (payload.results.length === 0) {
    return 'NO_DOCS_CACHE_RESULTS: The cached corpus did not match this query. Consider falling back to allowlisted_web_fetch or web_search.';
  }
  const lines = payload.results.map((r, i) =>
    `${i + 1}. [${r.os}] ${r.title} → ${r.heading}\n` +
    `   Source: ${r.source_url}\n` +
    `   ${r.excerpt}`
  );
  return `DOCS_CACHE_RESULTS (${payload.results.length} of ${payload.matched}):\n${lines.join('\n\n')}`;
}

module.exports = {
  searchDocsCache,
  formatResults,
  _resetCache,
  INDEX_PATH,
};
