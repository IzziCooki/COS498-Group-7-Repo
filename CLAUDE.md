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

### Safety rules
- `systemDiagnostics.js` has a strict allowlist — only read-only commands pass
- Dangerous patterns (rm, sudo, kill, curl, pipes, redirects) are always blocked
- Safety monitor checks every message for emergencies before AI sees it
- Never show raw command output to users — always translate to plain English

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
