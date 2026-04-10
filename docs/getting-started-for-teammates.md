# Getting Started — For Teammates

Welcome to PC Pal! This guide will get you up and running in 5 minutes.

---

## What is this project?

PC Pal is a web app that helps elderly people learn to use their computer. Users chat with an AI assistant that:
- Explains things in simple language
- Shows visual guide cards with numbered steps and keyboard diagrams
- Tracks what skills they've learned
- Detects emergencies and scams

**You don't need an API key to run it.** The app has a built-in demo mode.

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/COS498-Group-7-Repo.git
cd COS498-Group-7-Repo
npm install
cd client && npm install && cd ..
```

### 2. Create your .env file

```bash
cp .env.example .env
```

That's it. The defaults enable demo mode automatically.

### 3. Start the app

```bash
npm run dev
```

This starts two servers:
- **Backend** on http://localhost:3001
- **Frontend** on http://localhost:5173

### 4. Open in your browser

Go to **http://localhost:5173**

You'll see the onboarding wizard. Fill in a name, pick a device, set comfort level, and you're in the chat.

---

## Try These in Demo Mode

| Type this | What happens |
|-----------|-------------|
| "How do I copy and paste?" | Visual guide card appears + step-by-step walkthrough starts |
| "done" or "next" | Advances to the next step |
| "How do I take a screenshot?" | Another visual guide with keyboard shortcuts |
| "What should I learn next?" | Suggests the next skill based on your progress |
| "My notes" | Shows saved tips from your session |
| "Start over" | Clears the conversation |
| "Help" | Lists everything PC Pal can help with |
| "I've fallen" | Triggers the emergency alert system |

---

## Project Structure (High Level)

```
client/           React frontend (what the user sees)
server/           Node.js backend (the brains)
  core/           Business logic (AI agent, safety, vocabulary)
  models/         Database access (users, messages, skills)
  routes/         REST API endpoints
  db/             SQLite database
docs/             Documentation (you are here)
```

**Want more detail?** Read `docs/file-by-file-guide.md` for a breakdown of every file.

**Want the big picture?** Read `docs/architecture-overview.md` for how everything connects.

---

## Common Tasks

### Run tests
```bash
npm test
```
74 tests, takes about 1 second.

### Reset the database
Delete `server/db/pcpal.db` and restart the server. A fresh database is created automatically.

### Switch from demo mode to real AI
1. Get an API key from [console.anthropic.com](https://console.anthropic.com/)
2. Edit `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   MOCK_MODE=false
   ```
3. Restart the server

### Add a new visual guide
1. Open `client/src/components/Chat/guideRegistry.js`
2. Add a new entry following the existing pattern (title, Windows/Mac steps, optional keyboard keys)
3. Add the new ID to `VALID_GUIDE_IDS` in `server/core/agentOrchestrator.js`

### Add a new vocabulary substitution
1. Open `server/assets/vocabulary/basicSubstitutions.json`
2. Add a new `"technical_term": "simple replacement"` entry

---

## Tech Stack Summary

| What | Technology | Why |
|------|-----------|-----|
| Frontend | React + Vite | Fast dev server, component-based UI |
| Backend | Node.js + Express | JavaScript everywhere, good WebSocket support |
| Real-time | WebSocket (`ws`) | Typing indicators, instant responses |
| AI | Claude API (Anthropic) | Best at tool-use and following instructions |
| Database | SQLite | Zero setup, single file, good enough for prototype |
| Tests | Jest | Standard Node.js test runner |

---

## Who Built What

This is the first prototype. The core implementation includes:
- 12 AI agent tools
- 10 visual task guides (Windows + Mac)
- Safety monitoring (emergencies + scams)
- Vocabulary simplification (20+ terms)
- Comfort-level adaptive responses
- Full demo mode
- 74 automated tests

---

## Need Help?

- **Architecture questions** → `docs/architecture-overview.md`
- **"What does this file do?"** → `docs/file-by-file-guide.md`
- **Setup problems** → Check that Node.js v18+ is installed and both `npm install` commands ran
- **Database issues** → Delete `server/db/pcpal.db` and restart
