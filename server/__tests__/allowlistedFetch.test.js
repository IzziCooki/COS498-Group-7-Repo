'use strict';

/**
 * Tests for the tier-4 allowlisted web fetch.
 *
 * Network calls are mocked via the injectable `fetchFn` parameter so
 * the tests are deterministic and offline-safe.
 */

const af = require('../core/allowlistedFetch');

describe('allowlistedFetch — URL validation', () => {
  it('rejects non-HTTPS schemes', () => {
    const v = af.validateUrl('http://support.microsoft.com/hello');
    expect(v.ok).toBe(false);
    expect(v.error).toMatch(/HTTPS/);
  });

  it('rejects malformed URLs', () => {
    const v = af.validateUrl('not a url');
    expect(v.ok).toBe(false);
    expect(v.error).toMatch(/Invalid URL/);
  });

  it('rejects domains not on the allowlist', () => {
    const v = af.validateUrl('https://evil.example.com/whatever');
    expect(v.ok).toBe(false);
    expect(v.error).toMatch(/allowlist/);
  });

  it('accepts the four trusted apex domains', () => {
    expect(af.validateUrl('https://support.microsoft.com/x').ok).toBe(true);
    expect(af.validateUrl('https://support.apple.com/x').ok).toBe(true);
    expect(af.validateUrl('https://support.google.com/x').ok).toBe(true);
    expect(af.validateUrl('https://support.mozilla.org/x').ok).toBe(true);
  });

  it('accepts subdomains of trusted apex domains', () => {
    expect(af.validateUrl('https://en.support.mozilla.org/kb/foo').ok).toBe(true);
    expect(af.validateUrl('https://learn.support.microsoft.com/x').ok).toBe(true);
  });

  it('rejects subdomain-hijack tricks', () => {
    expect(af.validateUrl('https://support.microsoft.com.evil.example/x').ok).toBe(false);
    expect(af.validateUrl('https://supportzmicrosoft.com/x').ok).toBe(false);
  });

  it('isAllowedHost is case-insensitive', () => {
    expect(af.isAllowedHost('SUPPORT.APPLE.COM')).toBe(true);
    expect(af.isAllowedHost('Support.Microsoft.Com')).toBe(true);
  });
});

describe('allowlistedFetch — HTML extraction', () => {
  it('extracts text from a <main> region preferentially', () => {
    const html = `
      <html>
        <head><title>Example Page</title></head>
        <body>
          <nav>SHOULD NOT APPEAR — long enough nav block to test removal</nav>
          <main>
            <h1>Main</h1>
            <p>This is the content the agent should read about how to do the thing.</p>
            <p>It contains useful instructions and is at least two hundred characters of meaningful prose so that the main extraction picks this region.</p>
          </main>
          <footer>SHOULD NOT APPEAR — copyright footer with enough text to verify removal</footer>
        </body>
      </html>`;
    const text = af.extractMainText(html);
    expect(text).toContain('content the agent should read');
    expect(text).not.toContain('SHOULD NOT APPEAR');
  });

  it('truncates output to MAX_CONTENT_CHARS with an ellipsis', () => {
    const longBody = 'x '.repeat(5000);
    const html = `<html><body><main><p>${longBody}</p></main></body></html>`;
    const text = af.extractMainText(html);
    expect(text.length).toBeLessThanOrEqual(af.MAX_CONTENT_CHARS);
    expect(text.endsWith('…')).toBe(true);
  });

  it('falls back to body when no main container is present', () => {
    const html = `<html><body><div>${'word '.repeat(100)}</div></body></html>`;
    const text = af.extractMainText(html);
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('word');
  });

  it('extractTitle reads <title> first', () => {
    const html = '<html><head><title>The Title</title></head><body><h1>Other</h1></body></html>';
    expect(af.extractTitle(html)).toBe('The Title');
  });

  it('extractTitle falls back to first H1', () => {
    const html = '<html><body><h1>Heading One</h1></body></html>';
    expect(af.extractTitle(html)).toBe('Heading One');
  });
});

describe('allowlistedFetch — end-to-end with mock fetch', () => {
  function makeFetch(htmlBody, opts = {}) {
    return async () => ({
      ok: opts.ok !== false,
      status: opts.status || 200,
      headers: { get: (h) => (h.toLowerCase() === 'content-type' ? (opts.contentType || 'text/html; charset=utf-8') : null) },
      text: async () => htmlBody,
    });
  }

  it('returns ok=true with extracted content for an allowed URL', async () => {
    const html = `<html><head><title>Hi</title></head><body><main><p>${'hello world '.repeat(60)}</p></main></body></html>`;
    const out = await af.allowlistedFetch('https://support.microsoft.com/test', { fetchFn: makeFetch(html) });
    expect(out.ok).toBe(true);
    expect(out.url).toBe('https://support.microsoft.com/test');
    expect(out.title).toBe('Hi');
    expect(out.content).toContain('hello world');
  });

  it('rejects disallowed domains before making any HTTP call', async () => {
    let called = false;
    const fetchFn = async () => { called = true; return { ok: true, status: 200, headers: { get: () => 'text/html' }, text: async () => '' }; };
    const out = await af.allowlistedFetch('https://example.com/x', { fetchFn });
    expect(out.ok).toBe(false);
    expect(called).toBe(false);
  });

  it('reports HTTP errors clearly', async () => {
    const fetchFn = makeFetch('', { ok: false, status: 404 });
    const out = await af.allowlistedFetch('https://support.apple.com/missing', { fetchFn });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/HTTP 404/);
  });

  it('refuses non-HTML content-types', async () => {
    const fetchFn = makeFetch('{}', { contentType: 'application/json' });
    const out = await af.allowlistedFetch('https://support.google.com/api', { fetchFn });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/non-HTML/);
  });

  it('formatResult emits a citation-friendly block', () => {
    const formatted = af.formatResult({ ok: true, url: 'https://support.apple.com/x', title: 'Hi', content: 'Body' });
    expect(formatted).toMatch(/^WEB_FETCH_RESULT:/m);
    expect(formatted).toMatch(/URL: https:\/\/support\.apple\.com\/x/);
    expect(formatted).toMatch(/Title: Hi/);
  });

  it('formatResult emits WEB_FETCH_ERROR for failures', () => {
    const formatted = af.formatResult({ ok: false, error: 'nope' });
    expect(formatted).toBe('WEB_FETCH_ERROR: nope');
  });
});
