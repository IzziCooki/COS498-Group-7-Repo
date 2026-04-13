# PC Pal — File-by-File Guide

<!-- Updated 2026-04-13: Corrected tool count (12→16), agentOrchestrator line count (~450→~773), added 6 missing server/core files, 6 missing models, 3 missing routes, fixed test counts (74→69), fixed onboarding step count (3→5), and added missing client components and hooks. -->

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

## Server Files

### `server/index.js` — The Entry Point
- Creates the Express HTTP server
- Sets up the WebSocket server on `/ws`
- Mounts REST routes (`/api/users`, `/api/chat`)
- Handles WebSocket message protocol: `init` → `chat` → `response`
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

#### `agentOrchestrator.js` — The Main Pipeline (~773 lines)
**This is the most important file in the project.**

- Defines 16 Claude AI tools with their schemas
- `processMessage(text, userId)` — the entry point for every user message
- Pipeline: safety check → mock mode check → user lookup → session management → classification → Claude API call → tool handling loop → vocabulary filtering → save & return
- `handleFunctionCall(name, args, userId, sessionId)` — dispatches tool calls from the AI to the appropriate handler
- `buildSystemPrompt(profileString, user, classification)` — constructs the AI's personality and instructions based on user profile and comfort level
- `buildComfortGuidelines(comfortLevel)` — returns different instruction sets for comfort levels 1, 2-3, and 4-5

#### `mockResponder.js` — Demo Mode (~250 lines)
- Used when no API key is set or `MOCK_MODE=true`
- Pattern-matches user messages (e.g., "copy" → copy/paste guide, "done" → advance step)
- Returns the same response shape as the real orchestrator
- Creates real step sequences, skill events, and notes in the database
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

#### `skillMatcher.js` — Skill Auto-Matching
- Automatically matches user questions to the 10 visual guides
- Injects specialized prompts to Claude for task-specific expertise
- Keyword-based matching against skill definitions in `server/skills/`

#### `skillProgression.js` — Learning Chains (~75 lines)
- Defines 3 skill progression chains:
  - `copy_paste → send_email → attach_file`
  - `open_browser → find_wifi → open_settings`
  - `take_screenshot → zoom_text → use_taskbar → restart_computer`
- `getNextSkill(userId)` — walks the chains and finds the first uncompleted skill
- `getSkillStatus(userId)` — returns all skills with completion status

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

### `server/__tests__/` — Backend Tests

| File | What it tests | # Tests |
|------|-------------|---------|
| `vocabularyFilter.test.js` | Word substitution, whole-word matching, readability splitting, edge cases | 30 |
| `safetyMonitor.test.js` | Emergency keywords, scam patterns, partial-word non-matching, DB logging | 22 |
| `taskClassifier.test.js` | Classification accuracy, error handling, JSON parsing, markdown stripping | 17 |

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
