#!/usr/bin/env node
'use strict';

/**
 * Validate all URLs in support-knowledge.json.
 * Run: node scripts/validate-knowledge-base.js
 *
 * Exits with code 1 if any URLs are broken (for CI use).
 */

const path = require('path');
const { validateBatch } = require(path.join(__dirname, '..', 'server', 'core', 'urlValidator'));
const knowledgeBase = require(path.join(__dirname, '..', 'server', 'assets', 'support-knowledge.json'));

async function main() {
  const urls = [];

  for (const [catKey, cat] of Object.entries(knowledgeBase.categories)) {
    for (const [osKey, resources] of Object.entries(cat.resources)) {
      for (const r of resources) {
        urls.push({ url: r.url, category: catKey, os: osKey, title: r.title });
      }
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  const unique = urls.filter(u => {
    if (seen.has(u.url)) return false;
    seen.add(u.url);
    return true;
  });

  console.log(`Validating ${unique.length} unique URLs...\n`);

  const results = await validateBatch(unique.map(u => u.url), 10000);

  let broken = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const entry = unique[i];
    const status = r.valid ? 'OK' : 'BROKEN';
    const icon = r.valid ? '\u2713' : '\u2717';

    if (!r.valid) {
      broken++;
      console.log(`  ${icon} [${status}] ${r.statusCode || 'timeout'} — ${entry.category}/${entry.os}: ${entry.title}`);
      console.log(`    ${entry.url}\n`);
    } else {
      console.log(`  ${icon} [${status}] ${r.statusCode} — ${entry.category}/${entry.os}: ${entry.title}`);
    }
  }

  console.log(`\n${unique.length - broken}/${unique.length} URLs valid.`);

  if (broken > 0) {
    console.log(`\n${broken} broken URL(s) found. Please update support-knowledge.json.`);
    process.exit(1);
  } else {
    console.log('\nAll URLs valid!');
  }
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
