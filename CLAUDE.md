# PC Pal — Developer Guide

## What is this?

PC Pal is an AI-powered IT tutor for elderly and beginner computer users. It runs as both a web app (Hugging Face Spaces) and a desktop app (Electron) with real system diagnostic capabilities. Tools are exposed via MCP (Model Context Protocol) for provider-agnostic use.

## Quick Start

```bash
# Web mode (development)
npm install && cd client && npm install && cd ..
npm run dev

# Desktop mode (Electron)
npm run start:desktop

# Tests
npm test
```

## Architecture

### Agent Layer
- **server/core/agentSdkOrchestrator.js** — Primary orchestrator using Claude Agent SDK + MCP tools
- **server/core/agentOrchestrator.js** — Fallback orchestrator with manual tool-use loop (original)
- **server/mcp/pcpalTools.js** — All 23 custom tools exposed as an in-process MCP server

### Core
- **server/index.js** — Express + WebSocket server (auto-selects Agent SDK or fallback orchestrator)
- **server/core/systemDiagnostics.js** — Sandboxed system diagnostic tools (read-only, allowlisted)
- **server/core/skillMatcher.js** — Matches user messages to skill definitions in `server/skills/*.json`
- **server/core/safetyMonitor.js** — Emergency and scam detection (runs before AI)
- **server/core/vocabularyFilter.js** — Replaces jargon with plain language
- **server/core/mockResponder.js** — Demo mode with diagnostic data injection
- **server/skills/*.json** — 24 skill definitions with triggers, prompts, and metadata
- **server/models/** — SQLite models (14 tables)
- **client/src/** — React 19 + Vite frontend
- **electron/main.js** — Electron wrapper for desktop mode

## Key Patterns

### Adding a new MCP tool
1. Define the tool in `server/mcp/pcpalTools.js` using `tool()` from the Agent SDK:
```js
const myTool = tool(
  'tool_name',
  'Description of what the tool does',
  { param: z.string().describe('What this param is') },
  async (args) => textResult('result string')
);
```
2. Add it to the `tools` array in `createPcPalMcpServer()`
3. The tool is now available to any MCP-compatible agent

### Adding a new skill
Create a JSON file in `server/skills/`:
```json
{
  "id": "skill_id",
  "name": "Human-Readable Name",
  "description": "What this skill helps with",
  "triggers": ["keyword1", "keyword2"],
  "category": "diagnostics|connectivity|security|basics",
  "difficulty": "beginner|intermediate|critical",
  "prompt": "Instructions for Claude when this skill matches"
}
```

### Provider flexibility
- **Claude (Anthropic direct):** Set `ANTHROPIC_API_KEY`
- **Claude via Bedrock:** Set `CLAUDE_CODE_USE_BEDROCK=1`
- **Claude via Vertex AI:** Set `CLAUDE_CODE_USE_VERTEX=1`
- **OpenAI/Gemini/Ollama:** Use LiteLLM proxy, set `ANTHROPIC_BASE_URL=http://localhost:4000`
- **MCP tools are fully provider-agnostic** — any MCP-compatible framework can use them

### Command execution security
All terminal commands pass through a two-layer filter in `systemDiagnostics.js`:
1. **Block list** (lines 318-342): instantly rejects `rm`, `sudo`, `curl`, `kill`, `shutdown`, pipes, semicolons, redirects, package managers, and 20+ other dangerous patterns
2. **Allow list** (lines 244-314): command must match a specific regex (~24 Mac, ~17 Windows, ~17 Linux patterns). Only read-only diagnostics: system info, network checks, process listing, disk usage, file reading (text/log only)

The agent's built-in tools (`get_system_info`, `check_network`, etc.) run hardcoded commands — not user input. The "Run" button in guide artifacts also goes through the same sandbox. See `SECURITY.md` for the full breakdown.

### Other safety rules
- Safety monitor checks every message for emergencies before AI sees it
- Never show raw command output to users — always translate to plain English
- Relay agent pairing codes expire after 5 minutes, rate-limited to 5 attempts/minute

## Git Workflow (MUST follow)

Never push directly to main. Always:

1. **Create a feature branch**: `git checkout -b feature/short-description` or `fix/short-description`
2. **Commit your changes** on the branch
3. **Push the branch**: `git push -u origin feature/short-description`
4. **Wait for CI to pass** — check with `git log --oneline origin/main..HEAD` and monitor the GitHub Actions run
5. **Verify all checks pass**: lint, build, tests, smoke tests, audit
6. **Merge to main**: `git checkout main && git pull origin main && git merge feature/short-description && git push origin main`

If CI fails, fix the issue on the feature branch, push again, and wait for CI to pass before merging.

Branch naming convention:
- `feature/...` — new features
- `fix/...` — bug fixes
- `refactor/...` — code restructuring
- `docs/...` — documentation updates

## Testing

```bash
npm test                          # All 169 tests across 8 suites
npx jest systemDiagnostics        # Diagnostic function + sandbox tests
npx jest skillMatcher             # Skill matching + routing tests
npx jest mockResponder            # Mock responder + diagnostic context tests
npx jest mcpServer                # MCP server + tool function tests
```

## Deployment

- **Web (Docker/HF Spaces):** Uses `Dockerfile`, serves on port 7860, Express + React bundle
- **Desktop (Electron):** `npm run start:desktop`, rebuilds native modules, launches BrowserWindow
- Mock mode works without API key: set `MOCK_MODE=true` or omit `ANTHROPIC_API_KEY`
