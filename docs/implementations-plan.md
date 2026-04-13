 Here is Claude's plan:                                                                                                                    ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ PC Pal - Implementation Plan

 <!-- Updated 2026-04-13: Added correction notes throughout. This was the original AI-generated plan written before implementation.
      Several planned names/technologies diverged during actual development. Corrections are marked with [ACTUAL: ...] annotations. -->

  
 Context

 PC Pal is an AI-powered IT tutor for elderly and beginner PC users, delivered via a web chat interface. The project addresses the gap     
 where 57M+ Americans aged 65+ struggle with basic computer tasks but existing solutions (YouTube, IT help desks, generic AI) fail to      
 teach lasting skills. PC Pal provides patient, step-by-step guidance with annotated visual screenshots, vocabulary simplification, and    
 persistent skill tracking.

 Delivery: Web UI (React) first. SMS (Twilio) and CollaborAITE integration planned for later.

 Timeline: v1 by Apr 14 | v2 by Apr 21 | v3 by Apr 28

 ---
 Tech Stack

 ┌──────────────────┬──────────────────────────────────────────────────────┐
 │    Component     │                        Choice                        │
 ├──────────────────┼──────────────────────────────────────────────────────┤
 │ Frontend         │ React (Vite)                                         │
 ├──────────────────┼──────────────────────────────────────────────────────┤
 │ Backend          │ Node.js + Express                                    │
 ├──────────────────┼──────────────────────────────────────────────────────┤
 │ AI               │ Anthropic SDK (@anthropic-ai/sdk) with tool-use      │
 ├──────────────────┼──────────────────────────────────────────────────────┤
 │ Database         │ SQLite (via better-sqlite3) [ACTUAL: stayed SQLite for all versions, no PostgreSQL migration] │
 ├──────────────────┼──────────────────────────────────────────────────────┤
 │ Real-time        │ WebSocket (via ws) for streaming chat [ACTUAL: ws only, Socket.IO not used] │
 ├──────────────────┼──────────────────────────────────────────────────────┤
 │ Image Processing │ @napi-rs/canvas for annotated screenshots [ACTUAL: uses @napi-rs/canvas, not Sharp] │
 ├──────────────────┼──────────────────────────────────────────────────────┤
 │ Scheduling       │ node-cron (v2+ for proactive messages)               │
 ├──────────────────┼──────────────────────────────────────────────────────┤
 │ Testing          │ Jest (backend) [ACTUAL: React Testing Library was never added as a dependency] │
 └──────────────────┴──────────────────────────────────────────────────────┘

 ---
 Architecture - Message Flow

 React Chat UI (browser)
     |  WebSocket or POST /api/chat
     v
 Express Server (server/index.js)
     |
     v
 ConversationRouter (server/core/conversationRouter.js) [ACTUAL: not a separate file; routing handled in server/index.js]
     |  lookup user, load/create session
     v
 SafetyMonitor (runs FIRST on every message)
     |  emergency/scam detection
     v
 TaskClassifier (Claude call)
     |  learn_skill | troubleshoot | follow_up | accessibility
     v
 AgentOrchestrator (Claude tool-use loop)
     |  system prompt with user profile, history, vocab level
     |  tools: get_next_step, complete_step, log_skill, flag_emergency
     v
 VocabularyFilter
     |  replace jargon, enforce sentence length
     v
 WebSocket/Response  →  React Chat UI

 ---
 Project Structure

 client/                          # React frontend (Vite)
   src/
     App.jsx                      # Main app with routing
     components/
       Chat/
         ChatWindow.jsx           # Main chat container
         MessageBubble.jsx        # Individual message display
         MessageInput.jsx         # Text input + send button
         StepIndicator.jsx        # "Step 2 of 5" progress bar [ACTUAL: implemented as StepSequencePanel.jsx]
         VisualGuide.jsx          # Annotated screenshot display (v2)
       Onboarding/
         OnboardingFlow.jsx       # Name, OS, comfort level collection
       Layout/
         Header.jsx               # App header with user info
         Sidebar.jsx              # Skill history panel (v3) [ACTUAL: not implemented]
     hooks/
       useChat.js                 # WebSocket connection + message state
       useUser.js                 # User profile state
     styles/
       globals.css                # Large fonts, high contrast, elderly-friendly
     main.jsx
   index.html
   vite.config.js

 server/                          # Node.js + Express backend
   index.js                       # Express app, WebSocket setup, DB init
   config.js                      # Environment variable loading
   db/
     database.js                  # SQLite connection + schema init
     schema.sql                   # Table definitions
   models/
     User.js                      # User CRUD operations
     Conversation.js              # Conversation CRUD
     Message.js                   # Message CRUD
     SkillEvent.js                # Skill event CRUD
     SafetyEvent.js               # Safety event CRUD
     StepSequence.js              # Step sequence CRUD
   core/
     agentOrchestrator.js         # Claude tool-use agent loop
     taskClassifier.js            # Message classification via Claude
     userProfileManager.js        # User profile logic + onboarding
     conversationState.js         # Session lifecycle + memory
     stepSequencer.js             # Numbered step management [ACTUAL: not created as separate file; step logic is in agentOrchestrator.js]
     vocabularyFilter.js          # Jargon replacement + readability
     skillTracker.js              # Skill logging + reinforcement [ACTUAL: implemented as skillProgression.js]
     safetyMonitor.js             # Emergency + scam detection
     proactiveEngine.js           # Scheduled messages (v2) [ACTUAL: not implemented]
     visualGuideGenerator.js      # Annotated screenshots [ACTUAL: implemented as imageAnnotator.js using @napi-rs/canvas]
   assets/
     vocabulary/
       basicSubstitutions.json    # Word replacement map
     screenshots/                 # Pre-captured OS screenshots (v2)
   routes/
     chat.js                      # POST /api/chat (REST fallback)
     users.js                     # GET/POST /api/users
     skills.js                    # GET /api/users/:id/skills (v3) [ACTUAL: not implemented; buddy.js, export.js, quality.js exist instead]
   __tests__/
     vocabularyFilter.test.js
     taskClassifier.test.js
     stepSequencer.test.js        [ACTUAL: not created]
     safetyMonitor.test.js
     conversationFlow.test.js     [ACTUAL: not created]

 package.json
 .env.example
 README.md

 ---
 Database Schema (SQLite)

 users

 CREATE TABLE users (
   id TEXT PRIMARY KEY,            -- UUID
   name TEXT,
   os_type TEXT,                   -- 'Windows 10', 'Windows 11', 'macOS', 'iPhone', 'Android'
   vocabulary_level TEXT DEFAULT 'basic',  -- basic | intermediate | standard
   accessibility_needs TEXT DEFAULT '[]',  -- JSON array
   comfort_level INTEGER DEFAULT 1,       -- 1-5
   onboarded INTEGER DEFAULT 0,           -- boolean
   created_at TEXT DEFAULT (datetime('now')),
   updated_at TEXT DEFAULT (datetime('now'))
 );

 conversations

 CREATE TABLE conversations (
   id TEXT PRIMARY KEY,
   user_id TEXT REFERENCES users(id),
   task_type TEXT,
   status TEXT DEFAULT 'active',          -- active | completed | abandoned
   context_summary TEXT,                  -- compressed older context
   started_at TEXT DEFAULT (datetime('now')),
   ended_at TEXT
 );

 messages

 CREATE TABLE messages (
   id TEXT PRIMARY KEY,
   conversation_id TEXT REFERENCES conversations(id),
   role TEXT NOT NULL,                     -- 'user' | 'assistant'
   body TEXT NOT NULL,
   created_at TEXT DEFAULT (datetime('now'))
 );

 step_sequences

 CREATE TABLE step_sequences (
   id TEXT PRIMARY KEY,
   conversation_id TEXT REFERENCES conversations(id),
   steps TEXT NOT NULL,                   -- JSON array of step objects
   current_index INTEGER DEFAULT 0,
   completed INTEGER DEFAULT 0
 );

 skill_events

 CREATE TABLE skill_events (
   id TEXT PRIMARY KEY,
   user_id TEXT REFERENCES users(id),
   skill_name TEXT NOT NULL,
   status TEXT DEFAULT 'started',         -- started | completed | abandoned
   practiced_at TEXT DEFAULT (datetime('now'))
 );

 safety_events

 CREATE TABLE safety_events (
   id TEXT PRIMARY KEY,
   user_id TEXT REFERENCES users(id),
   event_type TEXT NOT NULL,              -- emergency | scam_detected | distress
   trigger_text TEXT,
   created_at TEXT DEFAULT (datetime('now'))
 );

 ---
 Implementation Phases

 Phase 1 — v1 by April 14 (Core Chat Loop)

 Goal: User opens the web app, onboards (name + OS), and gets context-aware IT help from Claude with simplified vocabulary through a chat  
 interface.

 Steps:

 1. Project setup
   - Initialize Node.js project with package.json
   - Initialize React project with Vite in client/
   - Create .env.example with ANTHROPIC_API_KEY
   - Create server/config.js for env loading
   - Create server/db/database.js + schema.sql with all tables
   - Files: package.json, .env.example, server/config.js, server/db/*
 2. Express server + WebSocket
   - Express app in server/index.js with CORS, JSON parsing
   - WebSocket server (ws library) on same port for real-time chat
   - On WS connection: assign/lookup user session
   - On WS message: route through processing pipeline, send response back
   - REST fallback: POST /api/chat for non-WebSocket clients
   - File: server/index.js, server/routes/chat.js
 3. React chat UI
   - ChatWindow.jsx — scrollable message list + input
   - MessageBubble.jsx — styled differently for user vs assistant messages
   - MessageInput.jsx — large text input, prominent send button
   - useChat.js hook — manages WebSocket connection, message state, send/receive
   - Elderly-friendly CSS: minimum 18px font, high contrast, large click targets, simple layout
   - Files: client/src/components/Chat/*, client/src/hooks/useChat.js, client/src/styles/globals.css
 4. Onboarding flow
   - OnboardingFlow.jsx — large-button wizard: "What's your name?", "What computer do you use?" (Windows/Mac/iPhone/Android with icons),   
 "How comfortable are you with computers?" (1-5 scale)
   - Saves to users table via POST /api/users
   - Shown on first visit, skipped after (user ID stored in localStorage)
   - Files: client/src/components/Onboarding/OnboardingFlow.jsx, server/routes/users.js
 5. User profile manager
   - getOrCreateUser(id), updateProfile(id, fields)
   - Returns full user profile for system prompt injection
   - File: server/core/userProfileManager.js, server/models/User.js
 6. Task classifier
   - Single Claude call with classification prompt
   - Returns: learn_skill | troubleshoot | follow_up | accessibility | unknown
   - Also extracts: topic, urgency
   - File: server/core/taskClassifier.js
 7. Agent orchestrator
   - Build system prompt from user profile (name, OS, vocab level, skill history)
   - Claude messages API with tool-use: log_skill_started, flag_emergency
   - Load last 20 messages from DB as conversation history
   - Patient, elderly-appropriate tone in system prompt
   - Stream responses via WebSocket for real-time feel
   - File: server/core/agentOrchestrator.js
 8. Vocabulary filter
   - JSON config with word substitutions (browser→internet, attachment→file in the email, etc.)
   - filterResponse(text, vocabLevel) — applies substitutions
   - Sentence length enforcement: split sentences > 20 words
   - File: server/core/vocabularyFilter.js, server/assets/vocabulary/basicSubstitutions.json
 9. Conversation state
   - getOrCreateSession(userId) — find active session or start new
   - closeSession(sessionId) — mark completed
   - Timeout: abandon sessions inactive > 30 min
   - File: server/core/conversationState.js, server/models/Conversation.js
 10. Safety monitor (basic)
   - Emergency keyword regex: "fallen", "can't breathe", "chest pain", "help me", "911", "emergency"
   - On match: immediate response + log to safety_events
   - Display alert banner in chat UI
   - File: server/core/safetyMonitor.js
 11. Basic tests
   - Test vocabulary filter substitutions
   - Test safety monitor keyword detection
   - Test task classifier with mocked Claude responses
   - Files: server/__tests__/vocabularyFilter.test.js, server/__tests__/safetyMonitor.test.js

 ---
 Phase 2 — v2 by April 21 (Step Sequencer + Visual Guides + Skill Tracking)

 Goal: Multi-turn step-by-step walkthroughs with annotated screenshots displayed in chat.

 Steps:

 1. Step sequencer
   - createSequence(task, userId) — Claude generates numbered steps, stored in step_sequences
   - getCurrentStep(sessionId) — returns step text + "Step X of Y"
   - advanceStep(sessionId) — on user confirmation ("ok", "done", "got it", "next", "yes")
   - isConfirmation(text) — fuzzy match for elderly-friendly confirmations
   - File: server/core/stepSequencer.js
 2. Step UI component
   - StepIndicator.jsx — progress bar showing "Step 2 of 5"
   - Quick-reply buttons: "OK, done!", "I need help", "Go back"
   - File: client/src/components/Chat/StepIndicator.jsx
 3. Agent orchestrator v2 — add tool-use for steps
   - New tools: create_step_sequence, get_current_step, advance_step, send_visual_guide
   - Agent decides when to break a task into steps vs. quick answer
   - Update: server/core/agentOrchestrator.js
 4. Visual guide generator
   - Pre-captured base screenshots for top 10 tasks (Windows 10/11, macOS)
   - Sharp overlay: red circles, arrows, numbered callouts at JSON-defined coordinates
   - Serve annotated images via Express static route /assets/guides/
   - Display in VisualGuide.jsx component in chat
   - Files: server/core/visualGuideGenerator.js, server/assets/screenshots/, client/src/components/Chat/VisualGuide.jsx
 5. Skill tracker
   - logSkill(userId, skillName, status) — write to skill_events
   - getUserSkills(userId) — list all learned skills
   - getSkillsForReinforcement(userId) — skills not practiced in 7+ days
   - File: server/core/skillTracker.js
 6. Scam detection
   - Keyword patterns: gift cards, wire transfer, IRS, lottery, send money, Bitcoin
   - Warn user with prominent alert in chat
   - Update: server/core/safetyMonitor.js
 7. Context compression
   - After 20 messages in a session, call Claude to summarize older messages
   - Store summary in conversations.context_summary
   - Inject summary into system prompt for continuity
   - Update: server/core/conversationState.js
 8. Tests for v2 features
   - Test step sequencer (advancement, confirmation detection, boundary conditions)
   - Test full conversation flow (multi-turn mock)
   - Files: server/__tests__/stepSequencer.test.js, server/__tests__/conversationFlow.test.js

 ---
 Phase 3 — v3 by April 28 (Polish + Scaffolding Fade + Evaluation)

 Goal: Fade scaffolding, accessibility improvements, skill dashboard, deployment.

 Steps:

 1. Scaffolding fade logic
   - If user completed a skill 3+ times, agent offers: "Want to try this on your own first?"
   - On success: positive reinforcement. On failure: resume guided mode
   - Update: server/core/agentOrchestrator.js, server/core/skillTracker.js
 2. Accessibility improvements
   - Theme toggle: high contrast / large text / default
   - Keyboard navigation throughout
   - Larger step counts (more granular) for users with accessibility needs
   - Update: client/src/styles/globals.css, client/src/components/
 3. Skill history sidebar
   - Sidebar.jsx — shows all learned skills with dates and practice count
   - GET /api/users/:id/skills endpoint
   - Files: client/src/components/Layout/Sidebar.jsx, server/routes/skills.js
 4. Proactive messages (in-app)
   - node-cron job checks for skill reinforcement opportunities
   - Sends in-app notification: "Want to practice [skill] today?"
   - File: server/core/proactiveEngine.js
 5. Deployment
   - Build React → static files served by Express
   - Deploy to Railway or Render
   - Environment variables for secrets
   - Update: server/index.js (serve static), README.md
 6. Evaluation prep
   - Pre/post confidence survey component in React
   - Conversation log export endpoint: GET /api/conversations/:id/export
   - Skill completion rate metrics

 ---
 Key Design Decisions

 WebSocket for real-time chat: Streaming Claude responses token-by-token gives a natural chat feel. Fallback REST endpoint for
 reliability.

 SQLite for v1/v2: Zero setup, single file DB. Same query patterns transfer to PostgreSQL for production. better-sqlite3 is synchronous    
 but fast enough for a class project. If async needed, switch to sqlite3 with promises.

 Elderly-friendly UI defaults: 18px+ base font, high-contrast colors, large buttons, minimal navigation. No complex UI patterns — just a   
 chat window and onboarding wizard.

 Context compression at 20 messages: Bounds token cost while maintaining conversation continuity. Claude summarizes older messages into a  
 compact context string.

 Tool-use agent loop: Claude decides when to use tools (create steps, log skills, flag emergencies) rather than hardcoded routing. More    
 flexible and natural conversation flow.

 ---
 Verification Plan

 Local dev

 1. npm install in root and client/
 2. Set .env with ANTHROPIC_API_KEY
 3. npm run dev — starts Express (port 3001) + Vite dev server (port 5173) with proxy
 4. Open http://localhost:5173 in browser

 Automated tests

 - npm test — Jest tests for backend modules
 - Mock Claude API responses with Jest mocks
 - React Testing Library for component tests

 Manual QA checklist per version

 - Onboarding wizard collects name + OS + comfort level
 - Chat message sends and receives response
 - Vocabulary simplification in responses
 - Emergency keyword triggers safety alert
 - (v2) Step-by-step flow with progress bar and confirmation
 - (v2) Annotated screenshot displays in chat
 - (v2) Scam detection warning displays
 - (v3) Skill fade ("try on your own") after 3 completions
 - (v3) Skill history sidebar shows learned skills
 - (v3) Deployed and accessible via public URL