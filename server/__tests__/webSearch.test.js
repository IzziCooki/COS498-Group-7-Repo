'use strict';

/**
 * Tests for the tier-5 web search wrapper.
 *
 * The Anthropic SDK client is replaced with a stub via `_setClient`
 * so we can exercise the parsing and formatting logic without making
 * real API calls.
 */

const ws = require('../core/webSearch');

afterEach(() => {
  ws._setClient(null);
});

describe('extractSearchResults — response parsing', () => {
  it('returns [] for an empty response', () => {
    expect(ws.extractSearchResults({})).toEqual([]);
    expect(ws.extractSearchResults({ content: [] })).toEqual([]);
  });

  it('skips non web_search_tool_result blocks', () => {
    const response = {
      content: [
        { type: 'text', text: 'I will search now.' },
        { type: 'server_tool_use', name: 'web_search', input: { query: 'q' } },
      ],
    };
    expect(ws.extractSearchResults(response)).toEqual([]);
  });

  it('extracts URL, title, and page_age fields from results', () => {
    const response = {
      content: [
        {
          type: 'web_search_tool_result',
          tool_use_id: 'srvtoolu_1',
          content: [
            {
              type: 'web_search_result',
              url: 'https://support.apple.com/en-us/HT123',
              title: 'How to do the thing',
              page_age: 'May 1, 2025',
              encrypted_content: 'enc1',
            },
            {
              type: 'web_search_result',
              url: 'https://support.microsoft.com/en-us/windows/abc',
              title: 'Windows version',
              encrypted_content: 'enc2',
            },
          ],
        },
      ],
    };
    const out = ws.extractSearchResults(response);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      url: 'https://support.apple.com/en-us/HT123',
      title: 'How to do the thing',
      page_age: 'May 1, 2025',
      encrypted_content: 'enc1',
    });
    expect(out[1].url).toMatch(/microsoft\.com/);
  });

  it('handles multiple web_search_tool_result blocks across iterations', () => {
    const response = {
      content: [
        { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://a/1', title: 'A1' }] },
        { type: 'text', text: 'thinking' },
        { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://b/2', title: 'B2' }] },
      ],
    };
    const out = ws.extractSearchResults(response);
    expect(out.map((r) => r.url)).toEqual(['https://a/1', 'https://b/2']);
  });

  it('tolerates malformed inner items without crashing', () => {
    const response = {
      content: [
        {
          type: 'web_search_tool_result',
          content: [
            null,
            { type: 'web_search_result_error', error_code: 'too_many_requests' },
            { type: 'web_search_result', url: 'https://support.google.com/x', title: 'OK' },
          ],
        },
      ],
    };
    const out = ws.extractSearchResults(response);
    expect(out).toEqual([
      { url: 'https://support.google.com/x', title: 'OK', page_age: null, encrypted_content: null },
    ]);
  });
});

describe('webSearch — input validation and client wiring', () => {
  it('rejects empty queries', async () => {
    const out = await ws.webSearch('');
    expect(out).toEqual({ ok: false, error: expect.any(String) });
  });

  it('returns a useful error when no API key + no injected client', async () => {
    ws._setClient(null);
    const { anthropicApiKey } = require('../config');
    if (anthropicApiKey) return; // skip — we have a real key
    const out = await ws.webSearch('hello');
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/ANTHROPIC_API_KEY/);
  });

  it('passes the query to the SDK client and returns parsed results', async () => {
    const calls = [];
    const stubClient = {
      messages: {
        create: async (args) => {
          calls.push(args);
          return {
            content: [
              {
                type: 'web_search_tool_result',
                content: [
                  { type: 'web_search_result', url: 'https://support.apple.com/x', title: 'Apple page' },
                  { type: 'web_search_result', url: 'https://support.microsoft.com/y', title: 'MS page' },
                ],
              },
            ],
          };
        },
      },
    };
    ws._setClient(stubClient);
    const out = await ws.webSearch('change text size');
    expect(out.ok).toBe(true);
    expect(out.results).toHaveLength(2);
    expect(out.query).toBe('change text size');
    expect(calls).toHaveLength(1);
    expect(calls[0].tools[0]).toMatchObject({ type: 'web_search_20250305', name: 'web_search' });
    expect(calls[0].messages[0].role).toBe('user');
  });

  it('respects max_results and caps results at 10', async () => {
    const fakeResults = Array.from({ length: 12 }, (_, i) => ({
      type: 'web_search_result',
      url: `https://support.apple.com/p${i}`,
      title: `T${i}`,
    }));
    ws._setClient({
      messages: {
        create: async () => ({
          content: [{ type: 'web_search_tool_result', content: fakeResults }],
        }),
      },
    });

    const limited = await ws.webSearch('q', { max_results: 3 });
    expect(limited.ok).toBe(true);
    expect(limited.results).toHaveLength(3);

    const capped = await ws.webSearch('q', { max_results: 999 });
    expect(capped.ok).toBe(true);
    expect(capped.results.length).toBeLessThanOrEqual(10);
  });

  it('reports SDK errors via the failure branch', async () => {
    ws._setClient({
      messages: {
        create: async () => { throw new Error('boom'); },
      },
    });
    const out = await ws.webSearch('q');
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/boom/);
  });
});

describe('formatResults — citation-friendly text', () => {
  it('emits WEB_SEARCH_RESULTS for ok payloads', () => {
    const formatted = ws.formatResults({
      ok: true,
      query: 'q',
      results: [{ url: 'https://support.apple.com/x', title: 'A', page_age: 'Jan 1, 2025' }],
    });
    expect(formatted).toMatch(/^WEB_SEARCH_RESULTS \(1\):/);
    expect(formatted).toMatch(/URL: https:\/\/support\.apple\.com\/x/);
    expect(formatted).toMatch(/Age: Jan 1, 2025/);
  });

  it('emits NO_WEB_SEARCH_RESULTS when results is empty', () => {
    const formatted = ws.formatResults({ ok: true, query: 'q', results: [] });
    expect(formatted).toMatch(/^NO_WEB_SEARCH_RESULTS/);
  });

  it('emits WEB_SEARCH_ERROR on failure', () => {
    const formatted = ws.formatResults({ ok: false, error: 'nope' });
    expect(formatted).toBe('WEB_SEARCH_ERROR: nope');
  });
});
