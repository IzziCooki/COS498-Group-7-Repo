# PC Pal — File-by-File Guide

<!-- Updated 2026-04-14: Added Electron files, Agent SDK orchestrator, system diagnostics, MCP tool server, diagnostic skill files, updated tool count (16→25), test count (69→169/8 suites), and new test file listings. -->

Every file in the project, what it does, and where it fits.

---

## Root Files

| File | Purpose |
|------|---------|
| `package.json` | Node.js project config. Dependencies, scripts (`npm run dev`, `npm test`) |
| `.env.example` | Template for environment variables. Copy to `.env` and fill in your keys |
| `.env` | Your actual API keys (gitignored — never committed) |
| `.gitignore` | Files git should ignore (node_modules, .env, database files) |
| `jest.config.js` | Test runner config — tells Jest to only look at `server/__tests__/` |
| `README.md` | Project overview and setup instructions |

---

## Electron Files

| File | Purpose |
|------|---------|
| `electron/main.js` | Electron main process — creates a `BrowserWindow`, loads the React frontend, manages app lifecycle (ready, window-all-closed, activate). Provides native desktop wrapper for PC Pal. |
| `electron/preload.js` | Preload script for secure IPC between the Electron renderer process and the main process. Runs in a sandboxed context with access to Node.js APIs. |

---

## Server Files

### `server/index.js` — The Entry Point
- Creates the Express HTTP server
- Sets up the WebSocket server on `/ws`
- Mounts REST routes (`/api/users`, `/api/chat`)
- Handles WebSocket message protocol: `init` → `chat` → `response`
- Auto-selects the Agent SDK orchestrator (primary) or falls back to the manual orchestrator
- Includes connection cleanup, input validation, and graceful shutdown

### `server/config.js` — Environment Config
- Loads `.env` file via dotenv
- Exports: `{ port, anthropicApiKey, geminiApiKey }`

---

### `server/db/` — Database

| File | What it does |
|------|-------------|
| `schema.sql` | Defines all 14 database tables. Runs automatically on startup. |
| `database.js` | Initializes SQLite via `better-sqlite3`. Enables WAL mode and foreign keys. Exports the `db` instance used by all models. |
| `pcpal.db` | The actual database file (created automatically, gitignored) |

---

### `server/models/` — Data Access Layer

Each model file exports an object with CRUD methods. All use synchronous `better-sqlite3` calls and `uuid` for ID generation.

| File | Table | Key Methods |
|------|-------|------------|
| `User.js` | `users` | `create`, `findById`, `findAll`, `update`, `delete` |
| `Conversation.js` | `conversations` | `create`, `findById`, `findByUserId`, `findActive`, `update`, `close`, `abandonStale` |
| `Message.js` | `messages` | `create`, `findByConversationId`, `getRecent(conversationId, limit=20)` |
| `StepSequence.js` | `step_sequences` | `create`, `findById`, `findByConversationId`, `update` — stores steps as JSON array |
| `SkillEvent.js` | `skill_events` | `create`, `findByUserId`, `findBySkillName` — tracks skill started/completed events |
| `SafetyEvent.js` | `safety_events` | `create`, `findByUserId` — logs emergency and scam detections |
| `UserNote.js` | `user_notes` | `create`, `findByUserId`, `findById`, `delete` — user's saved tips |
| `BuddyPair.js` | `buddy_pairs` | Buddy relationship management — invite codes, pairing, status |
| `ProgressShare.js` | `progress_shares` | Skill completion messages shared with buddies |
| `HelpRequest.js` | `help_requests` | Async help requests between learner and buddy |
| `SkillReview.js` | `skill_reviews` | Spaced repetition scheduling — 7-day review intervals |
| `UserGoal.js` | `user_goals` | User learning goals connected to skills |
| `ConversationQualityEvent.js` | `conversation_quality_events` | Per-turn conversation quality metrics |

---

### `server/core/` — Business Logic (The Brain)

This is where all the important logic lives.

#### `agentSdkOrchestrator.js` — The Primary Pipeline (Agent SDK)
**This is the primary orchestrator for production use.**

- Uses the Claude Agent SDK's `query()` function instead of a manual while loop
- Consumes all 25 tools via the in-process MCP server (`server/mcp/pcpalTools.js`)
- Same pipeline as the fallback orchestrator but with SDK-managed tool execution
- Falls back to `agentOrchestrator.js` if the Agent SDK is unavailable

#### `agentOrchestrator.js` — The Fallback Pipeline (~773 lines)
**This is the fallback orchestrator (the original implementation).**

- Defines 17 Claude AI tools with their schemas (including `analyze_scam_situation`)
- `processMessage(text, userId)` — the entry point for every user message
- Pipeline: safety check → mock mode check → user lookup → session management → classification → skill matching → Claude API call → tool handling loop → vocabulary filtering → save & return
- `handleFunctionCall(name, args, userId, sessionId)` — dispatches tool calls from the AI to the appropriate handler
- `buildSystemPrompt(profileString, user, classification)` — constructs the AI's personality and instructions based on user profile, comfort level, and matched skill prompts
- `buildComfortGuidelines(comfortLevel)` — returns different instruction sets for comfort levels 1, 2-3, and 4-5

#### `mockResponder.js` — Demo Mode (~250 lines)
- Used when no API key is set or `MOCK_MODE=true`
- Pattern-matches user messages (e.g., "copy" → copy/paste guide, "done" → advance step)
- Returns the same response shape as the real orchestrator
- Creates real step sequences, skill events, and notes in the database
- For diagnostic skills, injects real system diagnostic data (battery, disk, network) into Claude CLI prompts
- Exercises all UI features without any external API calls

#### `safetyMonitor.js` — Emergency & Scam Detection (~100 lines)
- `checkMessage(text, userId)` — scans every message before the AI sees it
- 10 emergency keyword patterns (word-boundary regex, case-insensitive)
- 8 scam detection patterns (gift cards, wire transfers, IRS, remote access, etc.)
- Logs detections to `SafetyEvent` model
- Returns `{ safe: true/false, type: 'emergency'|'scam'|null, response: string|null }`

#### `taskClassifier.js` — Message Classification (~85 lines)
- `classifyMessage(text, userProfile)` — calls Claude API to classify the message
- Returns: `{ taskType: 'learn_skill'|'troubleshoot'|'follow_up'|'accessibility'|'unknown', topic, urgency }`
- Gracefully falls back to `unknown` on any API error
- Strips markdown code fences from Claude's response before parsing

#### `vocabularyFilter.js` — Jargon Replacement (~100 lines)
- `filterResponse(text, vocabLevel)` — replaces technical terms with plain language
- 3 levels: `basic` (all 20+ substitutions), `intermediate` (8 technical terms only), `standard` (no changes)
- Whole-word matching (won't replace "browsing" when targeting "browser")
- `enforceReadability(text)` — splits sentences >20 words at conjunctions (and, but, or, so, because)

#### `conversationState.js` — Session Management (~70 lines)
- `getOrCreateSession(userId)` — finds the user's active conversation or creates a new one
- `closeSession(sessionId)` — marks a conversation as completed
- `abandonStale()` — marks conversations with no activity for 30+ minutes as abandoned
- `addMessage(sessionId, role, body)` — adds a message to the conversation
- `getSessionMessages(sessionId, limit)` — retrieves recent messages

#### `userProfileManager.js` — Profile Logic (~110 lines)
- `getOrCreateUser(id)` — finds or creates a user record
- `updateProfile(id, fields)` — updates allowed profile fields only
- `getProfileForPrompt(id)` — returns a formatted string for injecting into the AI's system prompt, including name, OS, vocabulary level, comfort level, and skill history with relative timestamps

#### `conversationExporter.js` — Conversation Export
- Exports full conversation logs for evaluation and analysis
- Used by the export route to provide data for the evaluation framework

#### `conversationQualityTracker.js` — Quality Metrics
- Tracks real-time conversation quality events per turn
- Monitors confusion, jargon slips, device mismatches, response length, step overload
- Generates aggregated quality summaries for post-session analysis

#### `imageAnnotator.js` — Annotated Screenshot Generator
- Generates annotated screenshots at startup using `@napi-rs/canvas`
- Creates keyboard diagrams and step annotations for visual guides
- Cached and served as static image files

#### `imageGenerator.js` — Image Generation Utilities
- Supporting utilities for image generation and processing

#### `skillImages.js` — Skill Image Registry
- Maps skills to their corresponding visual guide images
- Provides image paths for the annotated screenshot system

#### `systemDiagnostics.js` — Sandboxed System Diagnostics
- Provides 8 diagnostic functions: `getSystemInfo`, `checkNetwork`, `listRunningApps`, `readErrorLog`, `runSafeCommand`, `checkDiskHealth`, `checkInstalledSoftware`, `getBatteryStatus`
- All functions execute real terminal commands on the host machine
- Strict allowlist ensures only read-only commands are permitted
- Dangerous patterns (rm, sudo, kill, curl, pipes, redirects) are always blocked
- Cross-platform: supports macOS, Windows, and Linux commands

#### `skillMatcher.js` — Skill Auto-Matching
- Automatically matches user questions to the 24 skill definitions (17 original + 7 diagnostic)
- Injects specialized prompts to Claude for task-specific expertise
- Keyword-based matching against skill definitions in `server/skills/`
- Difficulty-based priority tie-breaking (critical skills outrank beginner skills when multiple match)
- Imported into the orchestrator to enrich the system prompt

#### `skillProgression.js` — Learning Chains (~75 lines)
- Defines 3 skill progression chains:
  - `copy_paste → send_email → attach_file`
  - `open_browser → find_wifi → open_settings`
  - `take_screenshot → zoom_text → use_taskbar → restart_computer`
- `getNextSkill(userId)` — walks the chains and finds the first uncompleted skill
- `getSkillStatus(userId)` — returns all skills with completion status

---

### `server/mcp/` — MCP Tool Server

| File | What it does |
|------|-------------|
| `pcpalTools.js` | Exposes all 25 custom tools (17 core + 8 diagnostic) as an in-process MCP server using `@anthropic-ai/claude-agent-sdk`. Each tool is defined with Zod schemas for input validation and returns structured results via `textResult()`. Consumed by the Agent SDK orchestrator. Provider-agnostic — works with Claude direct, Bedrock, Vertex AI, or any LLM via LiteLLM proxy. |

---

### `server/skills/` — Skill Definitions (24 JSON files)

Each skill is a JSON file with trigger keywords, specialized prompts, difficulty level, and category. The skill matcher loads these at startup.

**Original skills (17):** copy-paste, send-email, attach-file, open-browser, find-wifi, open-settings, take-screenshot, zoom-text, use-taskbar, restart-computer, and others covering basic PC tasks.

**Diagnostic skills (7):**

| File | Skill | When it triggers |
|------|-------|-----------------|
| `diagnose-system.json` | System diagnosis | User asks "What's wrong with my computer?" |
| `network-fix.json` | Network troubleshooting | User reports internet/Wi-Fi problems |
| `slow-computer.json` | Slow computer diagnosis | User says "My computer is slow" |
| `disk-cleanup.json` | Disk cleanup guidance | User reports low storage or slow disk |
| `app-troubleshoot.json` | App troubleshooting | User says an app is crashing or not working |
| `battery-power.json` | Battery/power diagnosis | User asks about battery or power issues |
| `system-checkup.json` | Full system checkup | User asks "Check my computer" or wants a health check |

---

### `server/routes/` — REST API

| File | Endpoints |
|------|----------|
| `users.js` | `POST /api/users` (create), `GET /api/users/:id` (read), `PUT /api/users/:id` (update), `PUT /api/users/:id/onboard` (mark onboarded) |
| `chat.js` | `POST /api/chat` (REST fallback for WebSocket chat) |
| `buddy.js` | Buddy invite, accept, progress sharing, and help request endpoints |
| `export.js` | `GET /api/conversations` — conversation export for evaluation |
| `quality.js` | Conversation quality metrics endpoints |

---

### `server/__tests__/` — Backend Tests (169 tests, 8 suites)

| File | What it tests | # Tests |
|------|-------------|---------|
| `vocabularyFilter.test.js` | Word substitution, whole-word matching, readability splitting, edge cases | 30 |
| `safetyMonitor.test.js` | Emergency keywords, scam patterns, partial-word non-matching, DB logging | 22 |
| `taskClassifier.test.js` | Classification accuracy, error handling, JSON parsing, markdown stripping | 17 |
| `systemDiagnostics.test.js` | Diagnostic function execution, sandbox allowlist enforcement, blocked command patterns, cross-platform support | — |
| `skillMatcher.test.js` | Skill matching accuracy, keyword triggers, priority tie-breaking, prompt injection | — |
| `mockResponder.test.js` | Mock response patterns, diagnostic data injection, step sequence creation | — |
| `mcpServer.test.js` | MCP server initialization, tool registration, tool function execution, Zod schema validation | — |
| `agentOrchestrator.test.js` | Orchestrator pipeline, tool dispatch, system prompt construction | — |

All tests mock external dependencies (Claude API, database models) so they run instantly without any setup.

---

## Client Files

### `client/src/App.jsx` — Root Component
- If user is not onboarded → show `OnboardingFlow`
- If user is onboarded → show `Header` + `ChatWindow`
- Passes `userId` and `osType` to `ChatWindow`

### `client/src/main.jsx` — Entry Point
- Imports global CSS
- Renders `App` in React StrictMode

---

### `client/src/hooks/`

| File | What it does |
|------|-------------|
| `useChat.js` | Manages WebSocket connection, message state, typing indicators, reconnection with backoff (max 5 attempts), and `activeSequence` state for step tracking |
| `useUser.js` | Manages user profile state, localStorage persistence, API calls for create/update/onboard |
| `useBuddy.js` | Manages buddy relationships, progress shares, help requests, and pending notifications |

---

### `client/src/components/Chat/`

| File | What it renders |
|------|----------------|
| `ChatWindow.jsx` | The main chat container — scrollable message list, typing indicator, step panel, message input |
| `MessageBubble.jsx` | A single message — user (right/blue) or assistant (left/white). Shows safety alerts and renders `VisualGuide` when a `guideId` is present |
| `MessageInput.jsx` | Large text input (56px) + Send button. Enter to submit. Disabled while typing. Auto-focus |
| `VisualGuide.jsx` | Renders a visual guide card — blue header, numbered step circles (36px), keyboard `<kbd>` diagrams. Looks up data from `guideRegistry.js` |
| `StepSequencePanel.jsx` | Step progress panel — task name, "Step X of Y", progress bar, current step text, quick-reply buttons ("Done!", "Help", "Ask my buddy") |
| `WelcomeBackBanner.jsx` | Shown on return visits — displays skills due for review and pending buddy replies |
| `guideRegistry.js` | Data file with 10 task guides (Windows + Mac variants, ~200 lines). Each step has text and optional keyboard keys |

---

### `client/src/components/Collaboration/`

| File | What it renders |
|------|----------------|
| `BuddyPanel.jsx` | Buddy management UI — invite via code, accept invites, view progress shares, send/receive help requests |

---

### `client/src/components/Onboarding/`

| File | What it renders |
|------|----------------|
| `OnboardingFlow.jsx` | 5-step wizard: name → device type (large buttons) → comfort level (1-5 scale with friendly labels) → learning goal → buddy invite (optional). Progress dots and Next/Back navigation |

---

### `client/src/components/Layout/`

| File | What it renders |
|------|----------------|
| `Header.jsx` | Top bar with "PC Pal" title, subtitle, and user name/OS badge |

---

### `client/src/styles/globals.css`
- CSS custom properties (variables) for colors, spacing, fonts, borders
- 18px base font size, 1.6 line-height
- 48px minimum touch target for all interactive elements
- High-contrast color palette
- `prefers-reduced-motion` media query for accessibility
- Focus-visible outlines for keyboard navigation
