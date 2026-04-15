# PC Pal — Architecture Overview

<!-- Updated 2026-04-14: Added Electron desktop mode, MCP architecture, system diagnostics (8 tools), Agent SDK orchestrator, updated tool count (16→25), skill count (17→24), test count (69→169/8 suites), added provider flexibility and new npm scripts. -->

## What is PC Pal?

PC Pal is a web-based AI chat assistant that helps elderly and beginner computer users learn basic PC skills. Think of it as a patient, friendly grandchild who teaches grandparents how to use their computer — through a simple chat interface with visual guides.

A user opens the app in their browser, goes through a quick onboarding (name, device, comfort level), and then chats with the AI. The AI responds with simple language, visual step-by-step guide cards, keyboard diagrams, and progress tracking.

---

## How It All Fits Together

```
┌─────────────────────────────────────────────────────┐
│            USER'S BROWSER  or  ELECTRON APP          │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Onboarding  │  │  Chat Window │  │  Visual   │ │
│  │  Wizard      │  │  + Messages  │  │  Guides   │ │
│  └──────────────┘  └──────┬───────┘  └───────────┘ │
│                           │                         │
│                    WebSocket / REST                  │
└───────────────────────────┼─────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────┐
│                   EXPRESS SERVER                     │
│                   (Node.js, port 3001)               │
│                                                     │
│  1. Safety Monitor    ──→  Check for emergencies    │
│  2. Task Classifier   ──→  What kind of question?   │
│  3. Skill Matcher     ──→  Match to skill prompts   │
│  4. Agent SDK Orch.   ──→  Claude + MCP tools       │
│     (fallback: manual Agent Orchestrator loop)      │
│  5. Vocabulary Filter ──→  Simplify jargon          │
│  6. Save to Database  ──→  SQLite                  │
│                                                     │
│  OR (if no API key):                                │
│  4. Mock Responder    ──→  Demo answers + diag data │
│                                                     │
│  ┌────────────────────────────────────────────┐     │
│  │          MCP TOOL SERVER (in-process)      │     │
│  │  25 tools exposed as provider-agnostic MCP │     │
│  │  (Claude, Bedrock, Vertex, LiteLLM, etc.)  │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

---

## The Message Pipeline

Every time a user sends a message, it flows through this pipeline:

### Step 1: Safety Check
**File:** `server/core/safetyMonitor.js`

Before anything else, the message is scanned for emergency keywords ("fallen", "chest pain", "911") and scam patterns ("gift card", "wire transfer", "IRS"). If detected, the pipeline short-circuits and returns an immediate safety response. This runs even in demo mode.

### Step 2: User Lookup
**File:** `server/core/userProfileManager.js`

The user's profile is loaded from the database — their name, OS type, comfort level (1-5), vocabulary level, and skill history. This information is injected into the AI's system prompt so it can personalize its responses.

### Step 3: Mock Mode Check
**File:** `server/core/mockResponder.js`

If no API key is set (or `MOCK_MODE=true`), the pipeline skips the AI and uses pre-written pattern-matched responses instead. The mock responder still creates step sequences, logs skills, and saves notes — it exercises all the same features as the real AI. For diagnostic skills, the mock responder injects real system diagnostic data (battery, disk, network) into Claude CLI prompts.

### Step 4: Task Classification
**File:** `server/core/taskClassifier.js`

The message is classified into a type: `learn_skill`, `troubleshoot`, `follow_up`, `accessibility`, or `unknown`. This classification is passed to the AI along with the urgency level (low/medium/high), so it knows how to prioritize its response.

### Step 4b: Skill Matching
**File:** `server/core/skillMatcher.js`

The user's message is matched against the 24 skill definitions in `server/skills/`. If a match is found, the skill's specialized prompt is injected into the system prompt so Claude has task-specific expertise. Matching uses keyword triggers with difficulty-based priority tie-breaking (critical skills outrank beginner skills when multiple match).

### Step 5: AI Agent (Claude)
**File:** `server/core/agentSdkOrchestrator.js` (primary) / `server/core/agentOrchestrator.js` (fallback)

This is the core of the app. The primary path uses the **Agent SDK orchestrator**, which calls the Agent SDK's `query()` function with MCP tools. If the Agent SDK is unavailable, the server falls back to the **manual orchestrator** with its while-loop tool handling.

The AI receives:
- The user's message
- The conversation history (last 20 messages)
- The user's profile (name, OS, comfort level, skills)
- The task classification
- Matched skill prompts (if any)
- A system prompt with 25 tools it can call (via MCP)

The AI generates a response and may call tools like `show_visual_guide`, `start_step_sequence`, or any of the 8 system diagnostic tools. Tool calls are processed in a loop (up to 10 rounds) — the AI can call multiple tools before giving its final text answer.

### Step 6: Vocabulary Filter
**File:** `server/core/vocabularyFilter.js`

The AI's response is filtered to replace technical jargon with simple language. "Browser" becomes "internet app", "URL" becomes "web address", "attachment" becomes "file in the email", etc. Sentences longer than 20 words are split at natural break points.

### Step 7: Save & Respond

The response is saved to the database and sent back to the user via WebSocket (or REST). The response includes:
- `text` — the message text
- `guideId` — which visual guide to show (if any)
- `stepSequence` — step progress data (if any)
- `safetyAlert` — emergency/scam alert (if any)

---

## The 25 AI Tools

When the Claude AI is processing a message, it can decide to call any of these tools. All 25 are exposed as provider-agnostic MCP tools via `server/mcp/pcpalTools.js`.

### Core Teaching & Interaction Tools (17)

| Tool | What it does | When the AI uses it |
|------|-------------|-------------------|
| `show_visual_guide` | Shows a visual card with numbered steps and keyboard diagrams | User asks how to do a common task (copy/paste, email, etc.) |
| `start_step_sequence` | Creates a multi-step walkthrough with progress bar | Task has 3+ steps |
| `advance_step` | Moves to the next step | User says "done", "ok", "next" |
| `complete_step_sequence` | Marks task finished, logs the skill | User finishes all steps |
| `log_skill_started` | Records that a new skill lesson began | AI starts teaching a new topic |
| `suggest_next_skill` | Recommends what to learn next | User asks "what should I learn?" or finishes a skill |
| `repeat_last_step` | Re-shows the current step | User says "repeat" or seems confused |
| `adjust_vocabulary_level` | Changes jargon filtering level | User seems confused (lower) or confident (raise) |
| `save_note_for_user` | Saves a tip for later reference | AI teaches something important |
| `get_user_notes` | Shows saved tips | User asks "what have I learned?" |
| `restart_conversation` | Clears the session | User says "start over" or seems lost |
| `flag_emergency` | Logs an emergency alert | User mentions injury, falling, medical issue |
| `analyze_scam_situation` | Analyzes a potential scam message for the user | User describes a suspicious call, email, or message |
| `save_user_goal` | Records the user's learning motivation | User shares why they want to learn |
| `schedule_skill_review` | Schedules a spaced repetition review | User completes a skill (review in 7 days) |
| `share_progress_with_buddy` | Shares skill completion with buddy | User finishes a skill and has a connected buddy |
| `ask_buddy_for_help` | Sends a help request to the user's buddy | User is stuck and wants human help |

### System Diagnostic Tools (8)

| Tool | What it does | When the AI uses it |
|------|-------------|-------------------|
| `get_system_info` | Returns OS version, CPU, memory, uptime | User asks "What kind of computer do I have?" or troubleshooting needs context |
| `check_network` | Tests network connectivity and DNS resolution | User reports internet problems |
| `list_running_apps` | Lists currently running applications | User asks what's open or computer seems slow |
| `read_error_log` | Reads recent system error/crash logs | User reports crashes or errors |
| `run_safe_command` | Runs an allowlisted terminal command | Specific diagnostic needs (e.g., checking a setting) |
| `check_disk_health` | Checks disk usage and storage space | User reports "disk full" or slow performance |
| `check_installed_software` | Lists installed applications | User asks what's installed or needs to find an app |
| `get_battery_status` | Returns battery level and charging state | User asks about battery or laptop won't stay on |

---

## System Diagnostics

**File:** `server/core/systemDiagnostics.js`

PC Pal can run real terminal commands on the user's machine to diagnose problems — but only safe, read-only commands. All commands pass through a strict allowlist before execution:

- **Allowed commands:** `df`, `top`, `uptime`, `sw_vers`, `systeminfo`, `wmic`, `ipconfig`, `ifconfig`, `ping`, `nslookup`, `netstat`, `ls`, `dir`, `cat`, `type`, `free`, `lsblk`, `diskutil`, `system_profiler`, `pmset`, `powercfg`, `tasklist`, `ps`, and similar read-only utilities.
- **Blocked patterns:** `rm`, `sudo`, `kill`, `curl`, `wget`, pipes (`|`), redirects (`>`), semicolons (`;`), and any other potentially destructive or injection-prone syntax.
- **Output handling:** Raw command output is never shown directly to the user. The AI translates diagnostic results into plain English appropriate for the user's comfort level.

The 7 diagnostic skill definitions in `server/skills/` (diagnose-system, network-fix, slow-computer, disk-cleanup, app-troubleshoot, battery-power, system-checkup) provide Claude with specialized prompts for each diagnostic scenario.

---

## MCP Architecture

**File:** `server/mcp/pcpalTools.js`

All 25 tools (17 core + 8 diagnostic) are exposed as an **in-process MCP (Model Context Protocol) tool server** using `@anthropic-ai/claude-agent-sdk`. This makes the tools fully provider-agnostic — they work with:

- Claude (Anthropic direct API)
- Claude via AWS Bedrock
- Claude via Google Vertex AI
- Any LLM via LiteLLM proxy (OpenAI, Gemini, Ollama, Azure, etc.)

Each tool is defined with Zod schemas for input validation and returns structured results via `textResult()`. The MCP server runs in-process (no separate server needed) and is consumed by the Agent SDK orchestrator.

---

## Desktop Mode (Electron)

**Files:** `electron/main.js`, `electron/preload.js`

PC Pal can run as a native desktop application via Electron. The Electron wrapper:

- Creates a `BrowserWindow` that loads the same React frontend
- Uses a preload script for secure IPC between the renderer and main process
- Provides access to system-level APIs (useful for diagnostic tools)
- Launches with `npm run start:desktop` (or `npm run electron`)

Desktop mode is especially useful for the diagnostic features, since Electron has direct access to the local machine's system information. The same Express server runs in the background.

---

## Frontend Components

### React App Structure

```
App.jsx
  ├── OnboardingFlow.jsx    (shown first time only)
  │     Step 1: Name
  │     Step 2: Device type (Windows/Mac/iPhone/Android)
  │     Step 3: Comfort level (1-5)
  │     Step 4: Learning goal
  │     Step 5: Buddy invite (optional)
  │
  └── Header.jsx + ChatWindow.jsx + BuddyPanel.jsx    (shown after onboarding)
        ├── WelcomeBackBanner.jsx   (shows due skill reviews + buddy replies)
        ├── Message List
        │     ├── MessageBubble.jsx   (each message)
        │     │     └── VisualGuide.jsx   (if guideId present)
        │     └── Typing indicator
        │
        ├── StepSequencePanel.jsx   (if step sequence active)
        │     ├── Progress bar
        │     ├── Current step text
        │     └── Quick-reply buttons ("Done!", "Help", "Ask my buddy")
        │
        ├── MessageInput.jsx   (text input + send button)
        │
        └── BuddyPanel.jsx   (buddy management — invite, progress, help requests)
```

### Visual Guide System

Visual guides are **not images** — they are styled HTML/CSS cards rendered from a data registry. This means:
- No image files to maintain
- Guides adapt to OS type (Windows vs Mac keyboard shortcuts)
- They render instantly with no loading

**File:** `client/src/components/Chat/guideRegistry.js`

Contains structured data for 10 tasks, each with Windows and Mac variants. Each step can optionally include keyboard key combinations displayed as styled `<kbd>` elements.

**File:** `client/src/components/Chat/VisualGuide.jsx`

Renders a guide card with a blue header, numbered step circles, step descriptions, and keyboard diagrams.

### Hooks

- **`useChat.js`** — Manages the WebSocket connection, message state, typing indicators, and active step sequence. Exposes `messages`, `sendMessage`, `isConnected`, `isTyping`, `activeSequence`.
- **`useUser.js`** — Manages user profile state, localStorage persistence, and API calls for creating/updating users.
- **`useBuddy.js`** — Manages buddy relationships, progress shares, and help requests. Exposes buddy pair state, invite/accept actions, and pending notifications.

---

## Database

SQLite with 14 tables. The database file is created automatically at `server/db/pcpal.db` on first run.

**Core tables:**

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User profiles | name, os_type, vocabulary_level, comfort_level (1-5), onboarded |
| `conversations` | Chat sessions | user_id, task_type, status (active/completed/abandoned) |
| `messages` | Message history | conversation_id, role (user/assistant), body |
| `step_sequences` | Multi-step task tracking | conversation_id, steps (JSON array), current_index, completed |
| `skill_events` | Skill learning log | user_id, skill_name, status (started/completed), practiced_at |
| `safety_events` | Emergency/scam logs | user_id, event_type, trigger_text |
| `user_notes` | Saved tips | user_id, title, content |

**Collaboration tables:**

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `buddy_pairs` | Buddy relationships | learner_id, buddy_id, invite_code, status |
| `progress_shares` | Skill completions shared with buddies | buddy_pair_id, skill_name, message |
| `help_requests` | Async help requests between learner and buddy | buddy_pair_id, question, response, status |

**Learning science tables:**

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `skill_reviews` | Spaced repetition scheduling | user_id, skill_name, review_date |
| `user_goals` | User learning goals | user_id, goal_text, connected_skill |

**Quality tracking tables:**

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `conversation_quality_events` | Per-turn quality metrics | conversation_id, event_type, details |
| `conversation_quality_summaries` | Aggregated session quality scores | conversation_id, metrics (JSON) |

---

## Key Design Decisions

**Why WebSocket instead of just REST?**
WebSocket lets us send a "typing" indicator before the AI responds. The AI can take 3-10 seconds, and without a typing indicator, elderly users think the app is broken. WebSocket also enables future features like proactive messages.

**Why SQLite instead of PostgreSQL?**
Zero setup. The database is a single file that's created automatically. For a prototype with <100 users, SQLite is more than enough. The same queries work with PostgreSQL if we scale later.

**Why HTML/CSS guide cards instead of screenshots?**
Screenshots go stale when OS interfaces change, require capturing and hosting image files, and can't adapt to different OS types. HTML cards are generated from data, render instantly, and automatically show the right keyboard shortcuts for Windows vs Mac.

**Why mock mode?**
An API key costs money and requires account setup. Mock mode lets the entire team test and demo the app immediately without any external dependencies.

**Why vocabulary filtering instead of just prompting the AI?**
The AI is prompted to use simple language, but it sometimes slips. The vocabulary filter is a guaranteed safety net that catches jargon in every response, regardless of what the AI says.

---

## How to Run

```bash
# Install
npm install
cd client && npm install && cd ..

# Configure (demo mode — no API key needed)
cp .env.example .env

# Start both servers (web mode)
npm run dev

# Open in browser
http://localhost:5173

# Or start as a desktop app (Electron)
npm run start:desktop
```

The app runs in demo mode by default. Set `MOCK_MODE=false` and add an `ANTHROPIC_API_KEY` in `.env` to use the real Claude AI.

**Provider flexibility:** Instead of `ANTHROPIC_API_KEY`, you can use Claude via Bedrock (`CLAUDE_CODE_USE_BEDROCK=1`), Vertex AI (`CLAUDE_CODE_USE_VERTEX=1`), or any LLM via LiteLLM proxy (`ANTHROPIC_BASE_URL=http://localhost:4000`).

## How to Test

```bash
npm test    # 169 tests across 8 suites
```
