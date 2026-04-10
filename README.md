# PC Pal - Your Friendly Tech Helper

PC Pal is an AI-powered IT tutor designed for elderly and beginner PC users. It provides patient, step-by-step guidance through a web chat interface, using simple language and a warm, encouraging tone.

## Features

- **Conversational IT Help** — Ask any tech question and get clear, jargon-free answers
- **Vocabulary Simplification** — Automatically replaces technical terms with plain language (e.g., "browser" becomes "internet app")
- **Safety Monitoring** — Detects emergency keywords and scam patterns, alerts users immediately
- **User Profiles** — Remembers your name, device type, and comfort level to personalize responses
- **Skill Tracking** — Logs skills you've learned for future reference
- **Elderly-Friendly UI** — Large fonts (18px+), high contrast, big buttons, simple layout

## Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express + WebSocket
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Database**: SQLite (via better-sqlite3)

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- An [Anthropic API key](https://console.anthropic.com/)

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

   Edit `.env` and add your Anthropic API key:

   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
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

PC Pal will respond with clear, step-by-step instructions using simple language tailored to your comfort level.

### Safety Features

PC Pal monitors messages for:
- **Emergency keywords** (e.g., "I've fallen", "chest pain", "911") — displays an alert with emergency guidance
- **Scam patterns** (e.g., gift card requests, wire transfers, IRS impersonation) — warns you and explains the scam

## Running Tests

```bash
npm test
```

Runs 75 backend tests covering vocabulary filtering, safety monitoring, and task classification.

## Project Structure

```
client/                     # React frontend (Vite)
  src/
    components/
      Chat/                 # ChatWindow, MessageBubble, MessageInput
      Onboarding/           # OnboardingFlow wizard
      Layout/               # Header
    hooks/                  # useChat (WebSocket), useUser (profile)
    styles/                 # globals.css (elderly-friendly styles)

server/                     # Node.js + Express backend
  index.js                  # Express app + WebSocket server
  config.js                 # Environment config
  db/                       # SQLite database + schema
  models/                   # Data models (User, Conversation, Message, etc.)
  core/                     # Business logic modules
    agentOrchestrator.js    # Claude AI integration with tool-use
    vocabularyFilter.js     # Jargon replacement
    safetyMonitor.js        # Emergency + scam detection
    taskClassifier.js       # Message classification
    conversationState.js    # Session management
    userProfileManager.js   # User profile logic
  routes/                   # REST API endpoints
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
{ "type": "response", "text": "...", "safetyAlert": null }
```

## Team

COS 498 — Group 7
