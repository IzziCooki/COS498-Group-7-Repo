'use strict';

/**
 * Tests for the tier-3 cached docs search.
 *
 * The .index.json artifact is built by `node scripts/ingest-docs.js`.
 * We rebuild it as a setup step so the tests don't depend on whether
 * the developer ran ingest manually first.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const docsCacheSearch = require('../core/docsCacheSearch');

const INDEX_PATH = path.resolve(__dirname, '..', 'docs-cache', '.index.json');

beforeAll(() => {
  const script = path.resolve(__dirname, '..', '..', 'scripts', 'ingest-docs.js');
  if (!fs.existsSync(INDEX_PATH)) {
    execFileSync(process.execPath, [script], { stdio: 'pipe' });
  }
  docsCacheSearch._resetCache();
});

describe('searchDocsCache — tier 3 cached corpus', () => {
  it('the index file exists and is non-empty', () => {
    expect(fs.existsSync(INDEX_PATH)).toBe(true);
    const stat = fs.statSync(INDEX_PATH);
    expect(stat.size).toBeGreaterThan(1000);
  });

  it('rejects empty queries', () => {
    expect(docsCacheSearch.searchDocsCache('')).toEqual({ ok: false, error: expect.any(String) });
    expect(docsCacheSearch.searchDocsCache('   ')).toEqual({ ok: false, error: expect.any(String) });
    expect(docsCacheSearch.searchDocsCache(null)).toEqual({ ok: false, error: expect.any(String) });
  });

  it('finds a Wi-Fi page when asked about wifi', () => {
    const out = docsCacheSearch.searchDocsCache('connect to wifi');
    expect(out.ok).toBe(true);
    expect(out.results.length).toBeGreaterThan(0);
    const titles = out.results.map((r) => r.title.toLowerCase());
    expect(titles.some((t) => t.includes('wi-fi') || t.includes('wifi'))).toBe(true);
  });

  it('returns top result with source_url, heading, and excerpt', () => {
    const out = docsCacheSearch.searchDocsCache('printer setup');
    expect(out.ok).toBe(true);
    const top = out.results[0];
    expect(top.source_url).toMatch(/^https:\/\//);
    expect(top.heading).toEqual(expect.any(String));
    expect(top.excerpt).toEqual(expect.any(String));
    expect(top.excerpt.length).toBeGreaterThan(0);
    expect(top.os === 'windows-11' || top.os === 'macos').toBe(true);
  });

  it('honors the os filter (windows-11)', () => {
    const out = docsCacheSearch.searchDocsCache('display text size', { os: 'windows-11' });
    expect(out.ok).toBe(true);
    expect(out.results.length).toBeGreaterThan(0);
    for (const r of out.results) {
      expect(['windows-11', 'general']).toContain(r.os);
    }
  });

  it('honors the os filter (macos)', () => {
    const out = docsCacheSearch.searchDocsCache('finder', { os: 'macos' });
    expect(out.ok).toBe(true);
    expect(out.results.length).toBeGreaterThan(0);
    for (const r of out.results) {
      expect(['macos', 'general']).toContain(r.os);
    }
  });

  it('respects the limit option', () => {
    const out = docsCacheSearch.searchDocsCache('settings', { limit: 2 });
    expect(out.ok).toBe(true);
    expect(out.results.length).toBeLessThanOrEqual(2);
  });

  it('caps the limit at 10 even if a larger value is requested', () => {
    const out = docsCacheSearch.searchDocsCache('settings', { limit: 999 });
    expect(out.ok).toBe(true);
    expect(out.results.length).toBeLessThanOrEqual(10);
  });

  it('all source_urls are HTTPS and from trusted support domains', () => {
    const out = docsCacheSearch.searchDocsCache('bluetooth');
    expect(out.ok).toBe(true);
    const trusted = ['support.microsoft.com', 'support.apple.com', 'support.google.com', 'support.mozilla.org'];
    for (const r of out.results) {
      expect(r.source_url).toMatch(/^https:\/\//);
      const url = new URL(r.source_url);
      const ok = trusted.some((d) => url.hostname === d || url.hostname.endsWith('.' + d));
      expect(ok).toBe(true);
    }
  });

  it('returns a friendly empty result for nonsense queries', () => {
    const out = docsCacheSearch.searchDocsCache('zxqlkjqzlkjqzlkj');
    expect(out.ok).toBe(true);
    expect(out.results).toEqual([]);
  });

  it('formatResults produces a multi-line citation-friendly string', () => {
    const out = docsCacheSearch.searchDocsCache('printer setup');
    const formatted = docsCacheSearch.formatResults(out);
    expect(formatted).toMatch(/^DOCS_CACHE_RESULTS/);
    expect(formatted).toMatch(/Source: https:\/\//);
  });

  it('formatResults emits NO_DOCS_CACHE_RESULTS for empty matches', () => {
    const out = docsCacheSearch.searchDocsCache('zzzzzqqqqqxxxxx');
    const formatted = docsCacheSearch.formatResults(out);
    expect(formatted).toMatch(/^NO_DOCS_CACHE_RESULTS/);
  });

  it('formatResults emits DOCS_CACHE_ERROR for failed lookups', () => {
    const formatted = docsCacheSearch.formatResults({ ok: false, error: 'index missing' });
    expect(formatted).toBe('DOCS_CACHE_ERROR: index missing');
  });
});
