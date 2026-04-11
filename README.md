### Live Demo: https://agent.deanhauser.dev/

# PC Pal - Your Friendly Tech Helper

PC Pal is an AI-powered IT tutor designed for elderly and beginner computer users. Over 57 million Americans aged 65+ struggle with basic computer tasks, and existing support options are either too expensive, too technical, or too impersonal. PC Pal bridges that gap with patient, step-by-step guidance through a warm, conversational chat interface — like having a helpful grandchild who never gets frustrated.

## What Makes PC Pal Different

- **Behavioral science-informed teaching** — Scaffolding fade, spaced repetition, and mastery-based progression ensure users actually retain what they learn, not just follow instructions once
- **Buddy system for social accountability** — Users can invite a family member or friend to follow their progress and help when they get stuck, because learning works better with support from real people
- **Safety-first design** — Emergency detection and scam protection are always active, not optional features buried in settings
- **Truly accessible UI** — 18px+ fonts, 48px touch targets, high contrast, keyboard navigation, and reduced-motion support designed specifically for the 65+ demographic

## Features

### Core Tutoring
- **Visual Step-by-Step Guides** — Annotated cards with keyboard diagrams and numbered steps for 10 common tasks (copy/paste, screenshots, email, Wi-Fi, and more) across Windows, Mac, iPhone, and Android
- **Step Sequence Tracking** — Progress bar and quick-reply buttons walk users through multi-step tasks one step at a time
- **Conversational IT Help** — Ask any tech question and get clear, jargon-free answers
- **Vocabulary Simplification** — Automatically replaces 20+ technical terms with plain language (e.g., "browser" becomes "internet app") with 3 adaptation levels
- **Comfort-Level Adaptation** — Responses adjust based on the user's self-reported comfort level (1-5): brand new users get max 2 steps at a time with everyday analogies, experienced users get concise answers

### Learning Science
- **Skill Progression Chains** — Skills build on each other (copy/paste -> send email -> attach file) so users follow a natural learning path
- **Spaced Repetition** — Completed skills are scheduled for review after 7 days. Returning users see a "Welcome back! Want to practice?" prompt
- **Scaffolding Fade** — First time: full visual guide + step sequence. Second time: "Want the walkthrough or try yourself?" Third time+: just a hint
- **Goal-Connected Learning** — Users share why they're learning ("I want to email my grandkids") and PC Pal connects every step to that goal

### Collaboration (Buddy System)
- **Invite a Buddy** — Generate a simple 6-character code (e.g., "MAPLE7") to share with a family member or friend
- **Progress Sharing** — When you complete a skill, your buddy sees a celebration message ("Margaret just learned to send email!")
- **Ask My Buddy for Help** — When the AI isn't enough, send a help request to your buddy. They reply at their own pace
- **Welcome-Back Notifications** — See buddy replies and skill review prompts when you return

### Safety
- **Emergency Detection** — Recognizes 10+ emergency keyword patterns ("I've fallen", "chest pain", "can't breathe") and displays immediate guidance with 911 contact
- **Scam Protection** — Detects 8+ scam patterns (gift card requests, fake tech support, wire transfers, IRS impersonation) and warns users before they act
- **All events logged** — Safety events are recorded for later review by caregivers

### Additional Features
- **Personal Notes** — Save tips and reminders to reference later
- **Conversation Export** — Export conversations for evaluation and quality analysis
- **Mock Demo Mode** — Full app demo without an API key using pre-written responses
- **Evaluation Framework** — 10 automated structural metrics + 6-dimension human rubric scoring

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, vanilla CSS |
| Backend | Node.js, Express 4, WebSocket (ws) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Database | SQLite (via better-sqlite3) |
| Image Processing | @napi-rs/canvas for annotated screenshots |

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- An [Anthropic API key](https://console.anthropic.com/) (optional — the app runs in demo mode without one)

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/IzziCooki/COS498-Group-7-Repo.git
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
4. **Share your goal** (optional) — "What's one thing you'd love to do on your computer?"
5. **Invite a buddy** (optional) — get a code to share with a family member or friend

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

### Buddy System

1. Click the **Buddy** button in the header to open the buddy panel
2. Click **Invite a Buddy** to generate a 6-character code
3. Share the code with your helper (by phone, text, or written down)
4. Your helper enters the code in their own PC Pal to connect
5. When you complete skills, they see your progress. When you're stuck, click **Ask my buddy for help**

### Safety Features

PC Pal monitors every message for:
- **Emergency keywords** (e.g., "I've fallen", "chest pain", "911") — displays an alert with emergency guidance
- **Scam patterns** (e.g., gift card requests, wire transfers, IRS impersonation) — warns you and explains the scam

## Agent Tools

PC Pal's AI agent has 16 tools it can use during conversations:

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
| `save_user_goal` | Record why the user is learning (connects skills to life goals) |
| `schedule_skill_review` | Schedule spaced repetition review for a completed skill |
| `share_progress_with_buddy` | Share a skill completion with the user's buddy |
| `ask_buddy_for_help` | Send a help request to the user's buddy |

## Running Tests

```bash
npm test
```

Runs 74 backend tests covering vocabulary filtering, safety monitoring, and task classification.

## Project Structure

```
client/                              # React frontend (Vite)
  src/
    components/
      Chat/                          # ChatWindow, MessageBubble, MessageInput
        VisualGuide.jsx              # Annotated guide cards with keyboard diagrams
        StepSequencePanel.jsx        # Step progress bar + quick-reply buttons
        WelcomeBackBanner.jsx        # Returning user prompts (reviews, buddy replies)
        guideRegistry.js             # 10 task guides (Windows + Mac + mobile variants)
      Collaboration/                 # Buddy system UI
        BuddyPanel.jsx              # Slide-in panel for buddy management
      Onboarding/                    # 5-step OnboardingFlow wizard
      Layout/                        # Header with buddy button
    hooks/
      useChat.js                     # WebSocket connection + message state
      useUser.js                     # User profile + localStorage persistence
      useBuddy.js                    # Buddy pair management + API calls
    styles/
      globals.css                    # Elderly-friendly design tokens

server/                              # Node.js + Express backend
  index.js                           # Express app + WebSocket server + welcome-back logic
  config.js                          # Environment config
  db/
    database.js                      # SQLite init + migrations
    schema.sql                       # 12 tables
  models/
    User.js                          # User profiles
    Conversation.js                  # Chat sessions
    Message.js                       # Message history
    SkillEvent.js                    # Skill learning/completion tracking
    SafetyEvent.js                   # Emergency/scam event logs
    StepSequence.js                  # Multi-step task state
    UserNote.js                      # Saved tips and notes
    BuddyPair.js                     # Buddy relationships + invite codes
    ProgressShare.js                 # Skill completions shared with buddies
    HelpRequest.js                   # Async help requests between buddies
    SkillReview.js                   # Spaced repetition scheduling
    UserGoal.js                      # Learning goals
  core/
    agentOrchestrator.js             # Claude AI integration (16 tools)
    mockResponder.js                 # Demo mode responses
    skillProgression.js              # Skill chains + next-skill + spaced repetition
    vocabularyFilter.js              # Jargon replacement (20+ terms)
    safetyMonitor.js                 # Emergency + scam detection
    taskClassifier.js                # Message classification
    conversationState.js             # Session management
    userProfileManager.js            # User profile + goal injection
  routes/
    users.js                         # User CRUD
    chat.js                          # REST chat fallback
    export.js                        # Conversation export for evaluation
    buddy.js                         # Buddy invite, accept, progress, help requests
  skills/                            # 16 skill definition JSON files

eval/                                # Evaluation framework
  structuralMetrics.js               # 10 automated conversation quality metrics
  rubricScorer.js                    # 6-dimension human rubric scoring
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
| POST | `/api/buddy/invite` | Generate a buddy invite code |
| POST | `/api/buddy/accept` | Accept an invite code to connect |
| GET | `/api/buddy/:userId` | Get active buddy pairs |
| GET | `/api/buddy/:pairId/progress` | Get shared progress for a pair |
| POST | `/api/buddy/:pairId/help` | Submit a help request |
| PUT | `/api/buddy/:pairId/help/:id` | Answer a help request |
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
// Connection acknowledged
{ "type": "init_ack", "userId": "your-uuid" }

// Returning user: skill reviews due + buddy replies
{ "type": "welcome_back", "reviewSkills": [...], "pendingHelp": [...] }

// AI is thinking
{ "type": "typing" }

// AI response with optional guide, steps, safety alert
{
  "type": "response",
  "text": "...",
  "safetyAlert": null,
  "stepSequence": { "id": "...", "steps": [...], "currentIndex": 0, "completed": false }
}
```

## Design Principles

1. **No jargon, ever** — If a word requires a computer science degree, the vocabulary filter catches it
2. **Two steps at a time** — Brand new users never see a wall of instructions
3. **Connect skills to life** — "Now you can email photos to your grandchildren" beats "Task complete"
4. **Real humans matter** — The buddy system exists because AI alone isn't enough for sustained behavior change
5. **Safety is not optional** — Emergency and scam detection runs on every single message, before the AI even sees it

## Team

COS 498 — Group 7
