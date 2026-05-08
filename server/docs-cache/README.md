# PC Pal Docs Cache (Tier 3)

Static, hand-curated knowledge corpus that backs the `search_docs_cache`
MCP tool. Each markdown file is a small, focused page describing a single
topic, chunked at H2/H3 boundaries during ingestion.

## How this works

1. Add or edit a `.md` file under `windows-11/` or `macos/`.
2. Re-run `node scripts/ingest-docs.js` — this rebuilds `.index.json`.
3. The agent's tier-3 grounding tool now serves your new content.

## Required front-matter

Every file MUST start with YAML front-matter:

```markdown
---
title: Short, human-readable page title
source_url: https://support.microsoft.com/...   # upstream citation
os: windows-11                                  # or macos
last_verified: 2026-05-07                       # ISO date
---

# Page Title

## Section name

Short, plain-language paragraph. Avoid jargon — these chunks are read by
elderly users.
```

## Source policy

Every page must derive from one of:

* support.microsoft.com
* support.apple.com
* support.google.com
* support.mozilla.org

This matches the allowlist in `allowlisted_web_fetch` so the two tiers
are mutually consistent.
