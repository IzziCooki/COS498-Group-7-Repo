'use strict';

const { filterResponse, enforceReadability } = require('../core/vocabularyFilter');

// filterResponse

describe('filterResponse', () => {
  // Basic level — every substitution in basicSubstitutions.json is applied
  describe('basic level', () => {
    test('replaces "browser" with "internet app"', () => {
      expect(filterResponse('Open your browser.', 'basic')).toBe('Open your internet app.');
    });

    test('leaves "download" unchanged (well-known term, awkward substitution removed)', () => {
      // "download" used to map to "save from the internet" which produced
      // ungrammatical output like "save from the internet it". The substitution
      // was removed because the word is well-known enough for elderly users.
      expect(filterResponse('Please download the file.', 'basic')).toBe(
        'Please download the file.'
      );
    });

    test('replaces "URL" with "web address"', () => {
      expect(filterResponse('Enter the URL in the box.', 'basic')).toBe(
        'Enter the web address in the box.'
      );
    });

    test('replaces basic-only term "spam" with "junk email"', () => {
      expect(filterResponse('That email looks like spam.', 'basic')).toBe(
        'That email looks like junk email.'
      );
    });

    test('replaces "router" with "internet box"', () => {
      expect(filterResponse('Restart your router.', 'basic')).toBe('Restart your internet box.');
    });
  });

  // Intermediate level — only INTERMEDIATE_KEYS subset is applied
  describe('intermediate level', () => {
    test('replaces an intermediate term like "malware"', () => {
      expect(filterResponse('Your computer has malware on it.', 'intermediate')).toBe(
        'Your computer has bad software on it.'
      );
    });

    test('replaces "phishing" with "trick email"', () => {
      expect(filterResponse('Watch out for phishing emails.', 'intermediate')).toBe(
        'Watch out for trick email emails.'
      );
    });

    test('does NOT replace basic-only terms like "spam"', () => {
      const result = filterResponse('That email looks like spam.', 'intermediate');
      expect(result).toBe('That email looks like spam.');
    });

    test('does NOT replace basic-only terms like "browser"', () => {
      const result = filterResponse('Open the browser please.', 'intermediate');
      expect(result).toBe('Open the browser please.');
    });
  });

  // Standard level — no replacements at all
  describe('standard level', () => {
    test('makes no changes to the text', () => {
      const original = 'Open your browser and download the file.';
      expect(filterResponse(original, 'standard')).toBe(original);
    });

    test('returns the original string unchanged', () => {
      const original = 'The cache and firewall settings are fine.';
      expect(filterResponse(original, 'standard')).toBe(original);
    });
  });

  // Whole-word replacement — "browsing" must NOT be touched when targeting "browser"
  describe('whole-word replacement', () => {
    test('does not replace "browsing" when targeting "browser"', () => {
      const result = filterResponse('I was browsing the web.', 'basic');
      expect(result).toBe('I was browsing the web.');
    });

    test('does not replace "cached" when targeting "cache"', () => {
      const result = filterResponse('The cached data is old.', 'intermediate');
      expect(result).toBe('The cached data is old.');
    });

    test('does not replace "downloading" when targeting "download"', () => {
      const result = filterResponse('I am downloading it now.', 'basic');
      expect(result).toBe('I am downloading it now.');
    });
  });

  // Case-insensitive matching
  describe('case-insensitive matching', () => {
    test('replaces "Browser" (capital B) at basic level', () => {
      expect(filterResponse('Open Browser now.', 'basic')).toContain('internet app');
    });

    test('replaces "BROWSER" (all caps) at basic level', () => {
      expect(filterResponse('Open BROWSER now.', 'basic')).toContain('internet app');
    });

    test('replaces "Malware" (capital M) at intermediate level', () => {
      expect(filterResponse('There is Malware here.', 'intermediate')).toContain('bad software');
    });
  });

  // Edge cases for null/empty input
  describe('graceful handling of empty / null input', () => {
    test('returns null when text is null', () => {
      expect(filterResponse(null, 'basic')).toBeNull();
    });

    test('returns undefined when text is undefined', () => {
      expect(filterResponse(undefined, 'basic')).toBeUndefined();
    });

    test('returns empty string unchanged', () => {
      expect(filterResponse('', 'basic')).toBe('');
    });

    test('returns empty string unchanged at standard level', () => {
      expect(filterResponse('', 'standard')).toBe('');
    });
  });
});

// enforceReadability

describe('enforceReadability', () => {
  test('leaves a short sentence (≤20 words) unchanged', () => {
    const short = 'Click the button to save your file.';
    expect(enforceReadability(short)).toBe(short);
  });

  test('splits a long sentence at "and"', () => {
    // 23 words — should be split
    const long =
      'First you need to open the browser and then you need to type the address and press the enter key on your keyboard.';
    const result = enforceReadability(long);
    // Should contain '. ' indicating a split was made
    expect(result).toContain('. ');
    // Original text should not be returned verbatim
    expect(result).not.toBe(long);
  });

  test('splits a long sentence at "but"', () => {
    const long =
      'You can try restarting your computer right now but you should save all of your work before you do that because it might take a while.';
    const result = enforceReadability(long);
    expect(result).toContain('. ');
  });

  test('splits a long sentence at "because"', () => {
    const long =
      'Your screen might be too dark to see clearly because the brightness setting on your monitor has been turned all the way down by someone.';
    const result = enforceReadability(long);
    expect(result).toContain('. ');
  });

  test('does not split a 20-word sentence exactly at the boundary', () => {
    // Exactly 20 words — should NOT be split
    const twenty =
      'You can click on the icon on the desktop to open the program that you want.';
    const wordCount = twenty.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(20);
    expect(enforceReadability(twenty)).toBe(twenty);
  });

  test('handles null input gracefully', () => {
    expect(enforceReadability(null)).toBeNull();
  });

  test('handles undefined input gracefully', () => {
    expect(enforceReadability(undefined)).toBeUndefined();
  });

  test('handles empty string gracefully', () => {
    expect(enforceReadability('')).toBe('');
  });

  test('does NOT split when the segment AFTER the conjunction would be too short', () => {
    // 21 words — triggers split logic (>20). The only "and" has a 2-word tail
    // ("click slowly"). Without the fix, the splitter would produce "...mouse
    // cursor. And click slowly." — exact pattern of the bug from test 11.
    // The after-segment word count check should now skip this break entirely.
    const text =
      'To open the system menu you should hover at the bottom of your screen with your mouse cursor and click slowly.';
    const result = enforceReadability(text);
    // No new sentence created at the "and": result must NOT contain ". And ".
    expect(result).not.toMatch(/\.\s+And\s/);
  });

  test('capitalizes first letter of each new segment after split', () => {
    const long =
      'You need to open the settings menu on your computer and then scroll down to the display section and change the brightness level.';
    const result = enforceReadability(long);
    // Each segment after a split should start with an uppercase letter
    const segments = result.split('. ');
    segments.forEach(seg => {
      if (seg.length > 0) {
        expect(seg.charAt(0)).toBe(seg.charAt(0).toUpperCase());
      }
    });
  });
});
