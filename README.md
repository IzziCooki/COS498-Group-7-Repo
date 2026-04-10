###DEMO: https://agent.deanhauser.dev/


# PC Pal - Your Friendly Tech Helper

PC Pal is an AI-powered IT tutor designed for elderly and beginner PC users. It provides patient, step-by-step guidance through a web chat interface, using simple language and a warm, encouraging tone.

## Features

- **Visual Step-by-Step Guides** — Annotated cards with keyboard diagrams and numbered steps for common tasks (copy/paste, screenshots, email, Wi-Fi, and more)
- **Step Sequence Tracking** — Progress bar and quick-reply buttons walk users through multi-step tasks one step at a time
- **Conversational IT Help** — Ask any tech question and get clear, jargon-free answers
- **Vocabulary Simplification** — Automatically replaces 20+ technical terms with plain language (e.g., "browser" becomes "internet app")
- **Comfort-Level Adaptation** — Responses adjust based on the user's comfort level (1-5): brand new users get detailed analogies, experienced users get concise answers
- **Safety Monitoring** — Detects emergency keywords and scam patterns, alerts users immediately
- **Skill Progression** — Tracks learned skills and suggests what to learn next in a natural progression
- **Personal Notes** — Saves tips and reminders the user can reference later
- **Mock Demo Mode** — Full app demo without an API key using pre-written responses
- **Elderly-Friendly UI** — Large fonts (18px+), high contrast, big buttons, simple layout

## Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express + WebSocket
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Database**: SQLite (via better-sqlite3)

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- An [Anthropic API key](https://console.anthropic.com/) (optional — the app runs in demo mode without one)

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/COS498-Group-7-Repo.git
   cd COS498-Group-7-Repo
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Create your environment file**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your settings:

   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here   # Leave blank for demo mode
   MOCK_MODE=true                            # Set to false when using a real API key
   PORT=3001
   ```

4. **Start the development servers**

   ```bash
   npm run dev
   ```

   This starts both:
   - Backend server on `http://localhost:3001`
   - React dev server on `http://localhost:5173`

5. **Open the app**

   Go to [http://localhost:5173](http://localhost:5173) in your browser.

## Demo Mode

PC Pal includes a full mock/demo mode that works without an API key. When `MOCK_MODE=true` or no `ANTHROPIC_API_KEY` is set, the app uses pre-written responses that exercise all features:

**Try these in demo mode:**
- "How do I copy and paste?" — visual guide card + step-by-step walkthrough
- "done" / "next" — advance through steps
- "How do I take a screenshot?" — another visual guide with keyboard diagrams
- "What should I learn next?" — skill progression suggestion
- "My notes" — view saved tips
- "Start over" — restart the conversation
- "Help" — see everything PC Pal can help with

Safety monitoring still works in demo mode — try "I've fallen" to see the emergency alert.

## Usage

### First Visit — Onboarding

When you first open PC Pal, you'll go through a quick setup:

1. **Enter your name** — so PC Pal can address you personally
2. **Select your device** — Windows, Mac, iPhone, or Android
3. **Rate your comfort level** — from "I'm brand new" to "Pretty comfortable"

### Chatting with PC Pal

After onboarding, you'll see the chat interface. Just type your question and press Send (or hit Enter).

**Example questions:**
- "How do I copy and paste?"
- "My internet isn't working"
- "How do I make the text bigger on my screen?"
- "How do I send an email with a photo attached?"

PC Pal responds with:
- **Visual guide cards** with numbered steps and keyboard diagrams
- **Step-by-step progress tracking** with "Done — next step!" buttons
- Clear, simple text tailored to your comfort level

### Safety Features

PC Pal monitors messages for:
- **Emergency keywords** (e.g., "I've fallen", "chest pain", "911") — displays an alert with emergency guidance
- **Scam patterns** (e.g., gift card requests, wire transfers, IRS impersonation) — warns you and explains the scam

## Agent Tools

PC Pal's AI agent has 12 tools it can use during conversations:

| Tool | Purpose |
|------|---------|
| `show_visual_guide` | Display a visual guide card for common tasks |
| `start_step_sequence` | Begin a multi-step walkthrough with progress tracking |
| `advance_step` | Move to the next step when user confirms |
| `complete_step_sequence` | Mark a task as finished and log the skill |
| `log_skill_started` | Record when a new skill lesson begins |
| `suggest_next_skill` | Recommend the next skill based on learning history |
| `repeat_last_step` | Re-display the current step without advancing |
| `adjust_vocabulary_level` | Dynamically change jargon filtering |
| `save_note_for_user` | Save a helpful tip for later reference |
| `get_user_notes` | Retrieve saved notes and tips |
| `restart_conversation` | Clear the session and start fresh |
| `flag_emergency` | Alert on medical/safety emergencies |

## Running Tests

```bash
npm test
```

Runs 74 backend tests covering vocabulary filtering, safety monitoring, and task classification.

## Project Structure

```
client/                          # React frontend (Vite)
  src/
    components/
      Chat/                      # ChatWindow, MessageBubble, MessageInput
        VisualGuide.jsx          # Annotated guide cards with keyboard diagrams
        StepSequencePanel.jsx    # Step progress bar + quick-reply buttons
        guideRegistry.js         # 10 task guides (Windows + Mac variants)
      Onboarding/                # OnboardingFlow wizard
      Layout/                    # Header
    hooks/                       # useChat (WebSocket), useUser (profile)
    styles/                      # globals.css (elderly-friendly styles)

server/                          # Node.js + Express backend
  index.js                       # Express app + WebSocket server
  config.js                      # Environment config
  db/                            # SQLite database + schema
  models/                        # Data models
    User.js                      # User profiles
    Conversation.js              # Chat sessions
    Message.js                   # Message history
    SkillEvent.js                # Skill learning/completion tracking
    SafetyEvent.js               # Emergency/scam event logs
    StepSequence.js              # Multi-step task state
    UserNote.js                  # Saved tips and notes
  core/                          # Business logic
    agentOrchestrator.js         # Claude AI integration (12 tools)
    mockResponder.js             # Demo mode responses
    skillProgression.js          # Skill chains + next-skill logic
    vocabularyFilter.js          # Jargon replacement (20+ terms)
    safetyMonitor.js             # Emergency + scam detection
    taskClassifier.js            # Message classification
    conversationState.js         # Session management
    userProfileManager.js        # User profile logic
  routes/                        # REST API endpoints
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/users` | Create a new user |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update user profile |
| PUT | `/api/users/:id/onboard` | Mark user as onboarded |
| POST | `/api/chat` | Send a chat message (REST fallback) |
| WS | `/ws` | WebSocket for real-time chat |

## WebSocket Protocol

Connect to `/ws` and send JSON messages:

```json
// 1. Initialize with your user ID
{ "type": "init", "userId": "your-uuid" }

// 2. Send a chat message
{ "type": "chat", "text": "How do I copy and paste?" }
```

Responses:
```json
{ "type": "init_ack", "userId": "your-uuid" }
{ "type": "typing" }
{
  "type": "response",
  "text": "...",
  "safetyAlert": null,
  "guideId": "copy_paste",
  "stepSequence": { "id": "...", "steps": [...], "currentIndex": 0, "completed": false }
}
```

## Team

COS 498 — Group 7
