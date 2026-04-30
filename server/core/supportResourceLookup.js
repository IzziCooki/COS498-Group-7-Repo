'use strict';

const path = require('path');
const knowledgeBase = require(path.join(__dirname, '..', 'assets', 'support-knowledge.json'));

const categories = knowledgeBase.categories;

/**
 * Normalize an OS string to a knowledge-base key.
 * Returns e.g. 'windows', 'mac', 'iphone', 'android', or null.
 */
function normalizeOs(osType) {
  if (!osType) return null;
  const lower = osType.toLowerCase();
  if (lower.includes('windows') || lower.includes('win')) return 'windows';
  if (lower.includes('mac') || lower.includes('macos') || lower.includes('os x')) return 'mac';
  if (lower.includes('iphone') || lower.includes('ios') || lower.includes('ipad')) return 'iphone';
  if (lower.includes('android')) return 'android';
  return null;
}

/**
 * Score how well a category matches a query topic.
 * Returns 0 for no match, higher for better matches.
 */
function scoreCategory(category, topic) {
  const lower = topic.toLowerCase();
  let score = 0;

  // Exact skill ID match
  for (const id of category.skill_ids) {
    if (lower === id || lower.replace(/\s+/g, '-') === id) return 100;
  }

  // Keyword matches
  for (const kw of category.keywords || []) {
    if (lower.includes(kw.toLowerCase())) score += 10;
  }

  // Name match
  if (lower.includes(category.name.toLowerCase())) score += 20;
  if (category.name.toLowerCase().includes(lower)) score += 15;

  return score;
}

/**
 * Look up curated resources for a topic.
 * @param {string} topic - The topic to search for (e.g. "copy and paste", "wifi")
 * @param {string|null} osType - User's OS (e.g. "Windows", "macOS", "iPhone")
 * @param {string|null} service - Specific service (e.g. "gmail", "zoom")
 * @returns {Array} Array of resource objects, up to 5
 */
function lookupResources(topic, osType, service) {
  if (!topic) return [];

  // Score all categories
  const scored = Object.entries(categories).map(([key, cat]) => ({
    key,
    cat,
    score: scoreCategory(cat, topic),
  }));

  // Filter to matches and sort by score
  const matches = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  if (matches.length === 0) return [];

  // Take top match (and second if close in score)
  const topCategories = [matches[0]];
  if (matches.length > 1 && matches[1].score >= matches[0].score * 0.5) {
    topCategories.push(matches[1]);
  }

  const os = normalizeOs(osType);
  const svc = service ? service.toLowerCase() : null;
  const results = [];

  for (const { cat } of topCategories) {
    const resources = cat.resources;

    // Service-specific first (e.g. gmail, zoom)
    if (svc && resources[svc]) {
      results.push(...resources[svc]);
    }

    // OS-specific
    if (os && resources[os]) {
      for (const r of resources[os]) {
        if (!results.some(existing => existing.url === r.url)) {
          results.push(r);
        }
      }
    }

    // General fallback
    if (resources.general) {
      for (const r of resources.general) {
        if (!results.some(existing => existing.url === r.url)) {
          results.push(r);
        }
      }
    }

    // If no OS specified and no general resources, include first available OS variant
    if (!os && !svc && results.length === 0) {
      for (const [key, osResources] of Object.entries(resources)) {
        if (key === 'general' || !Array.isArray(osResources)) continue;
        for (const r of osResources) {
          if (!results.some(existing => existing.url === r.url)) {
            results.push(r);
          }
        }
        if (results.length > 0) break;
      }
    }
  }

  return results.slice(0, 5);
}

/**
 * Look up resources by skill ID directly.
 * @param {string} skillId - e.g. "copy-paste", "wifi"
 * @param {string|null} osType - User's OS
 * @returns {Array} Array of resource objects
 */
function lookupBySkillId(skillId, osType) {
  if (!skillId) return [];

  for (const [, cat] of Object.entries(categories)) {
    if (cat.skill_ids.includes(skillId)) {
      return lookupResources(skillId, osType, null);
    }
  }

  return [];
}

/**
 * Get the list of trusted domains.
 * @returns {string[]}
 */
function getTrustedDomains() {
  return knowledgeBase.trusted_domains || [];
}

module.exports = {
  lookupResources,
  lookupBySkillId,
  getTrustedDomains,
  normalizeOs,
};
