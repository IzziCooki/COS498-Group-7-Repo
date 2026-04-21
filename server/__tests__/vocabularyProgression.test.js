'use strict';

const crypto = require('crypto');
const { filterWithProgression, checkForTermQuestions } = require('../core/vocabularyProgression');
const UserVocabulary = require('../models/UserVocabulary');

// Use a truly unique user ID per test to avoid cross-contamination
function testUserId() {
  return `test-vp-${crypto.randomUUID()}`;
}

describe('filterWithProgression', () => {
  describe('phase 1 (encounters 0-1): simple term + parenthetical intro', () => {
    test('first encounter introduces the jargon term in parentheses', () => {
      const uid = testUserId();
      const result = filterWithProgression('Open your browser.', 'basic', uid);
      expect(result).toBe('Open your internet app (also called a browser).');
    });

    test('second encounter still uses intro format', () => {
      const uid = testUserId();
      filterWithProgression('Open your browser.', 'basic', uid); // encounter 1
      const result = filterWithProgression('Close the browser.', 'basic', uid); // encounter 2
      expect(result).toBe('Close the internet app (also called a browser).');
    });
  });

  describe('phase 2 (encounters 2-3): real term + parenthetical reminder', () => {
    test('third encounter switches to jargon-first format', () => {
      const uid = testUserId();
      filterWithProgression('Open your browser.', 'basic', uid); // 1
      filterWithProgression('Close the browser.', 'basic', uid); // 2
      const result = filterWithProgression('Use the browser.', 'basic', uid); // 3
      expect(result).toBe('Use the browser (internet app).');
    });

    test('fourth encounter still uses reminder format', () => {
      const uid = testUserId();
      filterWithProgression('a browser.', 'basic', uid); // 1
      filterWithProgression('a browser.', 'basic', uid); // 2
      filterWithProgression('a browser.', 'basic', uid); // 3
      const result = filterWithProgression('a browser.', 'basic', uid); // 4
      expect(result).toBe('a browser (internet app).');
    });
  });

  describe('phase 3 (encounters 4+): real term only', () => {
    test('fifth encounter uses jargon with no parenthetical', () => {
      const uid = testUserId();
      for (let i = 0; i < 4; i++) {
        filterWithProgression('a browser.', 'basic', uid);
      }
      const result = filterWithProgression('Open the browser.', 'basic', uid); // 5
      expect(result).toBe('Open the browser.');
    });
  });

  describe('standard level bypasses progression', () => {
    test('returns text unchanged at standard level', () => {
      const uid = testUserId();
      const original = 'Open your browser and check the cache.';
      expect(filterWithProgression(original, 'standard', uid)).toBe(original);
    });
  });

  describe('intermediate level only processes intermediate keys', () => {
    test('replaces intermediate term "malware" with progression', () => {
      const uid = testUserId();
      const result = filterWithProgression('You have malware.', 'intermediate', uid);
      expect(result).toBe('You have bad software (also called a malware).');
    });

    test('does NOT replace basic-only term "browser" at intermediate', () => {
      const uid = testUserId();
      const result = filterWithProgression('Open browser.', 'intermediate', uid);
      expect(result).toBe('Open browser.');
    });
  });

  describe('multiple terms track independently', () => {
    test('browser and URL progress at their own rates', () => {
      const uid = testUserId();
      // First encounter for both
      const r1 = filterWithProgression('Open browser and enter the URL.', 'basic', uid);
      expect(r1).toContain('internet app (also called a browser)');
      expect(r1).toContain('web address (also called a URL)');

      // Second encounter for browser only
      const r2 = filterWithProgression('Close browser.', 'basic', uid);
      expect(r2).toContain('internet app (also called a browser)');

      // Third encounter for browser (phase 2), second for URL (still phase 1)
      const r3 = filterWithProgression('Open browser and enter the URL.', 'basic', uid);
      expect(r3).toContain('browser (internet app)');
      expect(r3).toContain('web address (also called a URL)');
    });
  });

  describe('backward compatibility', () => {
    test('no userId falls back to flat replacement', () => {
      const result = filterWithProgression('Open your browser.', 'basic');
      expect(result).toBe('Open your internet app.');
    });

    test('null/empty text returns as-is', () => {
      expect(filterWithProgression(null, 'basic', 'u1')).toBeNull();
      expect(filterWithProgression('', 'basic', 'u1')).toBe('');
    });
  });
});

describe('checkForTermQuestions', () => {
  test('resets count when user asks "what is a browser?"', () => {
    const uid = testUserId();
    // Build up encounters
    filterWithProgression('Open browser.', 'basic', uid);
    filterWithProgression('Open browser.', 'basic', uid);
    filterWithProgression('Open browser.', 'basic', uid); // count = 3

    const term = UserVocabulary.getTerm(uid, 'browser');
    expect(term.encounter_count).toBe(3);

    // Ask about the term
    const reset = checkForTermQuestions('What is a browser?', uid);
    expect(reset).toContain('browser');

    // Count should be reset
    const after = UserVocabulary.getTerm(uid, 'browser');
    expect(after.encounter_count).toBe(0);
  });

  test('resets on "what\'s a router?"', () => {
    const uid = testUserId();
    filterWithProgression('Check router.', 'basic', uid);
    checkForTermQuestions("what's a router?", uid);
    const after = UserVocabulary.getTerm(uid, 'router');
    expect(after.encounter_count).toBe(0);
  });

  test('resets on "what does URL mean?"', () => {
    const uid = testUserId();
    filterWithProgression('Enter the URL.', 'basic', uid);
    checkForTermQuestions('what does URL mean?', uid);
    const after = UserVocabulary.getTerm(uid, 'URL');
    expect(after.encounter_count).toBe(0);
  });

  test('returns empty array when no terms match', () => {
    const uid = testUserId();
    const result = checkForTermQuestions('How do I send an email?', uid);
    expect(result).toEqual([]);
  });

  test('handles null input gracefully', () => {
    expect(checkForTermQuestions(null, 'u1')).toEqual([]);
    expect(checkForTermQuestions('hello', null)).toEqual([]);
  });

  test('progression restarts after reset', () => {
    const uid = testUserId();
    // Build to phase 2
    filterWithProgression('Open browser.', 'basic', uid);
    filterWithProgression('Open browser.', 'basic', uid);
    const phase2 = filterWithProgression('Open browser.', 'basic', uid);
    expect(phase2).toContain('browser (internet app)');

    // Reset
    checkForTermQuestions('What is a browser?', uid);

    // Should be back to phase 1
    const restarted = filterWithProgression('Open browser.', 'basic', uid);
    expect(restarted).toContain('internet app (also called a browser)');
  });
});
