#!/usr/bin/env node
/**
 * scripts/ingest-docs.js
 *
 * Walks server/docs-cache/, parses front-matter + markdown bodies,
 * splits each file into chunks at H2 / H3 headings, builds a
 * MiniSearch BM25 token index, and writes the corpus + index to
 * server/docs-cache/.index.json.
 *
 * Re-run this script whenever a markdown file is added or edited:
 *
 *   node scripts/ingest-docs.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const MiniSearch = require('minisearch');

const DOCS_DIR = path.resolve(__dirname, '..', 'server', 'docs-cache');
const INDEX_PATH = path.join(DOCS_DIR, '.index.json');

function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, body: match[2] };
}

function chunkBody(body) {
  const chunks = [];
  const lines = body.split(/\r?\n/);
  let currentHeading = 'Overview';
  let currentLevel = 1;
  let buffer = [];

  const flush = () => {
    const text = buffer.join('\n').trim();
    if (text) {
      chunks.push({ heading: currentHeading, level: currentLevel, body: text });
    }
    buffer = [];
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h2 || h3) {
      flush();
      currentHeading = (h2 ? h2[1] : h3[1]).trim();
      currentLevel = h2 ? 2 : 3;
    } else if (!/^#\s/.test(line)) {
      buffer.push(line);
    }
  }
  flush();
  return chunks;
}

function walkMarkdown(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
      acc.push(full);
    }
  }
  return acc;
}

function buildCorpus() {
  const files = walkMarkdown(DOCS_DIR);
  const documents = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const { meta, body } = parseFrontMatter(raw);
    if (!meta.source_url) {
      console.warn(`[ingest] Skipping ${file} — no source_url front-matter.`);
      continue;
    }
    if (!meta.title) {
      console.warn(`[ingest] Skipping ${file} — no title front-matter.`);
      continue;
    }

    const relPath = path.relative(DOCS_DIR, file).replace(/\\/g, '/');
    const chunks = chunkBody(body);
    chunks.forEach((chunk, i) => {
      documents.push({
        id: `${relPath}#${i}`,
        path: relPath,
        os: meta.os || 'general',
        title: meta.title,
        heading: chunk.heading,
        level: chunk.level,
        body: chunk.body,
        source_url: meta.source_url,
        last_verified: meta.last_verified || null,
      });
    });
  }

  return { files: files.length, documents };
}

function buildIndex(documents) {
  const mini = new MiniSearch({
    fields: ['title', 'heading', 'body'],
    storeFields: ['id', 'path', 'os', 'title', 'heading', 'body', 'source_url', 'last_verified'],
    searchOptions: {
      boost: { heading: 3, title: 2, body: 1 },
      fuzzy: 0.15,
      prefix: true,
    },
  });
  mini.addAll(documents);
  return mini;
}

function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`[ingest] docs-cache directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  const { files, documents } = buildCorpus();
  if (documents.length === 0) {
    console.error('[ingest] No documents were ingested. Add at least one markdown file under server/docs-cache/.');
    process.exit(1);
  }

  const mini = buildIndex(documents);
  const payload = {
    version: 1,
    generated_at: new Date().toISOString(),
    file_count: files,
    chunk_count: documents.length,
    index: mini.toJSON(),
    documents,
  };
  fs.writeFileSync(INDEX_PATH, JSON.stringify(payload), 'utf8');
  console.log(
    `[ingest] OK — ${files} files, ${documents.length} chunks → ${path.relative(process.cwd(), INDEX_PATH)}`
  );
}

if (require.main === module) {
  main();
}

module.exports = { parseFrontMatter, chunkBody, buildCorpus, buildIndex };
