'use strict';

const path = require('path');
const supportResourceLookup = require('../core/supportResourceLookup');
const knowledgeBase = require(path.join(__dirname, '..', 'assets', 'support-knowledge.json'));

describe('Support Resource Knowledge Base', () => {
  describe('structure validation', () => {
    const categories = knowledgeBase.categories;

    it('has categories defined', () => {
      expect(Object.keys(categories).length).toBeGreaterThan(0);
    });

    it('every category has required fields', () => {
      for (const [key, cat] of Object.entries(categories)) {
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('skill_ids');
        expect(cat).toHaveProperty('keywords');
        expect(cat).toHaveProperty('resources');
        expect(Array.isArray(cat.skill_ids)).toBe(true);
        expect(Array.isArray(cat.keywords)).toBe(true);
        expect(cat.skill_ids.length).toBeGreaterThan(0);
        expect(cat.keywords.length).toBeGreaterThan(0);
      }
    });

    it('every resource has required fields', () => {
      for (const [key, cat] of Object.entries(categories)) {
        for (const [osKey, resources] of Object.entries(cat.resources)) {
          for (const r of resources) {
            expect(r).toHaveProperty('title');
            expect(r).toHaveProperty('url');
            expect(r).toHaveProperty('source');
            expect(r).toHaveProperty('type');
            expect(r).toHaveProperty('time');
            expect(r).toHaveProperty('description');
            expect(typeof r.title).toBe('string');
            expect(typeof r.url).toBe('string');
          }
        }
      }
    });

    it('all URLs start with https://', () => {
      for (const [, cat] of Object.entries(categories)) {
        for (const [, resources] of Object.entries(cat.resources)) {
          for (const r of resources) {
            expect(r.url).toMatch(/^https:\/\//);
          }
        }
      }
    });

    it('all URLs are from trusted domains', () => {
      const trusted = knowledgeBase.trusted_domains;
      for (const [, cat] of Object.entries(categories)) {
        for (const [, resources] of Object.entries(cat.resources)) {
          for (const r of resources) {
            const url = new URL(r.url);
            const domain = url.hostname;
            const isTrusted = trusted.some(d => domain === d || domain.endsWith('.' + d));
            expect(isTrusted).toBe(true);
          }
        }
      }
    });

    it('has a trusted_domains array', () => {
      expect(Array.isArray(knowledgeBase.trusted_domains)).toBe(true);
      expect(knowledgeBase.trusted_domains.length).toBeGreaterThan(0);
    });

    it('has a last_verified date', () => {
      expect(knowledgeBase.last_verified).toBeDefined();
      expect(typeof knowledgeBase.last_verified).toBe('string');
    });
  });

  describe('lookupResources', () => {
    it('returns resources for "copy and paste"', () => {
      const results = supportResourceLookup.lookupResources('copy and paste', null, null);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('url');
      expect(results[0]).toHaveProperty('source');
    });

    it('returns resources for "wifi"', () => {
      const results = supportResourceLookup.lookupResources('wifi', null, null);
      expect(results.length).toBeGreaterThan(0);
    });

    it('filters by OS type (Windows)', () => {
      const results = supportResourceLookup.lookupResources('copy and paste', 'Windows', null);
      expect(results.length).toBeGreaterThan(0);
      const hasMicrosoft = results.some(r => r.source === 'Microsoft Support');
      expect(hasMicrosoft).toBe(true);
    });

    it('filters by OS type (macOS)', () => {
      const results = supportResourceLookup.lookupResources('copy and paste', 'macOS', null);
      expect(results.length).toBeGreaterThan(0);
      const hasApple = results.some(r => r.source === 'Apple Support');
      expect(hasApple).toBe(true);
    });

    it('filters by OS type (iPhone)', () => {
      const results = supportResourceLookup.lookupResources('wifi', 'iPhone', null);
      expect(results.length).toBeGreaterThan(0);
      const hasApple = results.some(r => r.source === 'Apple Support');
      expect(hasApple).toBe(true);
    });

    it('filters by service (gmail)', () => {
      const results = supportResourceLookup.lookupResources('email', null, 'gmail');
      expect(results.length).toBeGreaterThan(0);
      const hasGoogle = results.some(r => r.source === 'Google Support');
      expect(hasGoogle).toBe(true);
    });

    it('filters by service (zoom)', () => {
      const results = supportResourceLookup.lookupResources('video call', null, 'zoom');
      expect(results.length).toBeGreaterThan(0);
      const hasZoom = results.some(r => r.source === 'Zoom Support');
      expect(hasZoom).toBe(true);
    });

    it('returns general resources when OS is unknown', () => {
      const results = supportResourceLookup.lookupResources('copy and paste', null, null);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown topic', () => {
      const results = supportResourceLookup.lookupResources('quantum computing', null, null);
      expect(results).toEqual([]);
    });

    it('returns at most 5 results', () => {
      const results = supportResourceLookup.lookupResources('settings', 'Windows', null);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('does not return duplicate URLs', () => {
      const results = supportResourceLookup.lookupResources('wifi', 'iPhone', null);
      const urls = results.map(r => r.url);
      const unique = new Set(urls);
      expect(urls.length).toBe(unique.size);
    });
  });

  describe('lookupBySkillId', () => {
    it('returns resources for skill "copy-paste"', () => {
      const results = supportResourceLookup.lookupBySkillId('copy-paste', null);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns resources for skill "wifi"', () => {
      const results = supportResourceLookup.lookupBySkillId('wifi', 'Windows');
      expect(results.length).toBeGreaterThan(0);
      const hasMicrosoft = results.some(r => r.source === 'Microsoft Support');
      expect(hasMicrosoft).toBe(true);
    });

    it('returns empty array for non-existent skill', () => {
      const results = supportResourceLookup.lookupBySkillId('nonexistent-skill', null);
      expect(results).toEqual([]);
    });
  });

  describe('getTrustedDomains', () => {
    it('returns an array of domain strings', () => {
      const domains = supportResourceLookup.getTrustedDomains();
      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBeGreaterThan(0);
      for (const d of domains) {
        expect(typeof d).toBe('string');
      }
    });
  });

  describe('normalizeOs', () => {
    it('normalizes Windows variants', () => {
      expect(supportResourceLookup.normalizeOs('Windows')).toBe('windows');
      expect(supportResourceLookup.normalizeOs('Windows 11')).toBe('windows');
      expect(supportResourceLookup.normalizeOs('win10')).toBe('windows');
    });

    it('normalizes Mac variants', () => {
      expect(supportResourceLookup.normalizeOs('macOS')).toBe('mac');
      expect(supportResourceLookup.normalizeOs('Mac')).toBe('mac');
      expect(supportResourceLookup.normalizeOs('OS X')).toBe('mac');
    });

    it('normalizes iPhone/iOS variants', () => {
      expect(supportResourceLookup.normalizeOs('iPhone')).toBe('iphone');
      expect(supportResourceLookup.normalizeOs('iOS')).toBe('iphone');
      expect(supportResourceLookup.normalizeOs('iPad')).toBe('iphone');
    });

    it('normalizes Android', () => {
      expect(supportResourceLookup.normalizeOs('Android')).toBe('android');
    });

    it('returns null for unknown or empty', () => {
      expect(supportResourceLookup.normalizeOs(null)).toBeNull();
      expect(supportResourceLookup.normalizeOs('Commodore 64')).toBeNull();
    });
  });
});
