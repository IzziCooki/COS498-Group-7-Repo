# PC Pal — Architecture Overview

## What is PC Pal?

PC Pal is a web-based AI chat assistant that helps elderly and beginner computer users learn basic PC skills. Think of it as a patient, friendly grandchild who teaches grandparents how to use their computer — through a simple chat interface with visual guides.

A user opens the app in their browser, goes through a quick onboarding (name, device, comfort level), and then chats with the AI. The AI responds with simple language, visual step-by-step guide cards, keyboard diagrams, and progress tracking.

---

## How It All Fits Together

```
┌─────────────────────────────────────────────────────┐
│                    USER'S BROWSER                    │
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
│  3. Agent Orchestrator ──→  Call Claude AI + tools   │
│  4. Vocabulary Filter  ──→  Simplify jargon          │
│  5. Save to Database   ──→  SQLite                  │
│                                                     │
│  OR (if no API key):                                │
│  3. Mock Responder     ──→  Pre-written demo answers │
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

If no API key is set (or `MOCK_MODE=true`), the pipeline skips the AI and uses pre-written pattern-matched responses instead. The mock responder still creates step sequences, logs skills, and saves notes — it exercises all the same features as the real AI.

### Step 4: Task Classification
**File:** `server/core/taskClassifier.js`

The message is classified into a type: `learn_skill`, `troubleshoot`, `follow_up`, `accessibility`, or `unknown`. This classification is passed to the AI along with the urgency level (low/medium/high), so it knows how to prioritize its response.

### Step 5: AI Agent (Claude)
**File:** `server/core/agentOrchestrator.js`

This is the core of the app. The AI receives:
- The user's message
- The conversation history (last 20 messages)
- The user's profile (name, OS, comfort level, skills)
- The task classification
- A system prompt with 12 tools it can call

The AI generates a response and may call tools like `show_visual_guide` or `start_step_sequence`. Tool calls are processed in a loop — the AI can call multiple tools before giving its final text answer.

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

## The 12 AI Tools

When the Claude AI is processing a message, it can decide to call any of these tools:

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

---

## Frontend Components

### React App Structure

```
App.jsx
  ├── OnboardingFlow.jsx    (shown first time only)
  │     Step 1: Name
  │     Step 2: Device type (Windows/Mac/iPhone/Android)
  │     Step 3: Comfort level (1-5)
  │
  └── Header.jsx + ChatWindow.jsx    (shown after onboarding)
        ├── Message List
        │     ├── MessageBubble.jsx   (each message)
        │     │     └── VisualGuide.jsx   (if guideId present)
        │     └── Typing indicator
        │
        ├── StepSequencePanel.jsx   (if step sequence active)
        │     ├── Progress bar
        │     ├── Current step text
        │     └── Quick-reply buttons ("Done!", "Help")
        │
        └── MessageInput.jsx   (text input + send button)
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

---

## Database

SQLite with 7 tables. The database file is created automatically at `server/db/pcpal.db` on first run.

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User profiles | name, os_type, vocabulary_level, comfort_level (1-5), onboarded |
| `conversations` | Chat sessions | user_id, task_type, status (active/completed/abandoned) |
| `messages` | Message history | conversation_id, role (user/assistant), body |
| `step_sequences` | Multi-step task tracking | conversation_id, steps (JSON array), current_index, completed |
| `skill_events` | Skill learning log | user_id, skill_name, status (started/completed), practiced_at |
| `safety_events` | Emergency/scam logs | user_id, event_type, trigger_text |
| `user_notes` | Saved tips | user_id, title, content |

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

# Start both servers
npm run dev

# Open in browser
http://localhost:5173
```

The app runs in demo mode by default. Set `MOCK_MODE=false` and add an `ANTHROPIC_API_KEY` in `.env` to use the real Claude AI.

## How to Test

```bash
npm test    # 74 backend tests
```
