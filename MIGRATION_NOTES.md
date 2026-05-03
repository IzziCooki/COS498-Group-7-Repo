# PC Pal UI Redesign -- Migration Notes (Phase 0)

Generated: 2026-05-02
Repo: `/Users/wilder/dev/UMO/cosagents/gproj/COS498-Group-7-Repo`

---

## 1. Component Inventory

### 1.1 Root-Level JSX

| # | Path | Lines | Description | Decision |
|---|------|-------|-------------|----------|
| 1 | `client/src/App.jsx` | 175 | Root component: auth gate, onboarding gate, then main layout (Header + ConversationSidebar + ChatWindow + BuddyPanel), plus view switching for dashboard/admin. | **replace** -- ShellLayout with router replaces all conditional rendering and layout logic. |
| 2 | `client/src/main.jsx` | 11 | Vite entry point: mounts `<App />` into `#root` with StrictMode. | **keep** -- Only the import of `globals.css` path may change. |

### 1.2 Chat Components (`client/src/components/Chat/`)

| # | Path | Lines | Description | Decision |
|---|------|-------|-------------|----------|
| 3 | `ChatWindow.jsx` | 425 | Main chat view: manages live/past messages, artifact panel, terminal panel, buddy terminal, screen sharing, side panel orchestration. | **replace** -- Rebuilt as `ChatScreen/` with separate concerns (thread, input, artifact overlay, terminal). |
| 4 | `MessageBubble.jsx` | 142 | Single chat message: inline text formatting, artifact inline/tag modes, buddy terminal results, screenshots. | **replace** -- New MessageBubble per D2 spec: mascot avatar, long-press menu, tap-to-TTS, new artifact card chassis. |
| 5 | `MessageInput.jsx` | 83 | Text input bar with Send and "Get External Help" buttons. | **replace** -- New InputArea per D2: textarea (not input), pill-shaped send button (56px), mic button, suggestion chips row. |
| 6 | `SidePanel.jsx` | 94 | Side artifact panel: renders guide, findings, videos, resources, practice; supports left/right navigation between artifacts. | **replace** -- On phone becomes full-screen overlay; on desktop becomes ArtifactPanel (480px). Navigation model changes. |
| 7 | `ConversationSidebar.jsx` | 92 | Left sidebar: lists conversations, collapsible, new-chat button. | **replace** -- Phone: HistoryScreen (bottom tab). Tablet/desktop: part of SideRail. Conversation cards get date grouping, search, long-press actions. |
| 8 | `CommandGuide.jsx` | 223 | Step-by-step guide artifact with copy/run buttons, pagination, image hotspots. | **replace** -- New GuideViewer in `Artifacts/` per D3: full-screen overlay on phone, step navigation, stuck sheet, completion flow. |
| 9 | `DiagnosticFindings.jsx` | 56 | Collapsible diagnostic results with status icons (good/warning/bad). | **replace** -- New version in `Artifacts/` per D1/D3: full-screen overlay on phone, card on desktop. |
| 10 | `YouTubeEmbed.jsx` | 77 | YouTube video embeds with thumbnail-to-play, privacy mode (nocookie). | **replace** -- New VideoPlayer in `Artifacts/`: full-screen overlay on phone, related-videos list, back navigation. |
| 11 | `ResourceReport.jsx` | 97 | Collapsible resource report with video/link sections grouped by type (watch/read/try). | **replace** -- New ResourcesViewer in `Artifacts/`: full-screen overlay on phone, filter chips. |
| 12 | `PracticeMode.jsx` | 200 | Guided practice simulation: multi-step with progress bar, confused-alt explanations, "do it for real" completion. | **replace** -- New version in `Artifacts/`: full-screen takeover at all breakpoints, hides tab bar. |
| 13 | `FeedbackModal.jsx` | 130 | End-of-chat feedback modal: 1-5 star rating, optional comment textarea. | **modify** -- Same functionality, but needs to become a full-screen bottom sheet on phone per D1 modal rules. Token update required. |
| 14 | `ConnectComputer.jsx` | 147 | Button + modal for relay agent pairing (terminal command + code entry). | **modify** -- Same logic, but modal becomes centered on tablet/desktop, full-screen on phone. Code flow changes to show 6-digit code for phone users per D1. Token update needed. |
| 15 | `ScreenShare.jsx` | 210 | Browser screen sharing via getDisplayMedia, periodic frame capture to server. | **modify** -- Core logic is correct. Needs token update on status bar UI and responsive adjustments. |
| 16 | `AnimatedHotspot.jsx` | 21 | Pulsing red ring overlay for guide step images, positioned by percentage coordinates. | **keep** -- Pure presentational, works as-is. Will be imported into new GuideViewer. |
| 17 | `StepSequencePanel.jsx` | 103 | Fixed panel shown during multi-step AI sequences: progress bar, next/help/ask-buddy buttons. | **modify** -- Concept stays, but needs token update and responsive adaptation. On phone, should be a sticky panel above input. |
| 18 | `WelcomeBackBanner.jsx` | 83 | Banner for returning users: skill review suggestions, buddy help replies. | **modify** -- Same data model, needs new token styling and to render inside chat thread (non-sticky) per D1. |
| 19 | `artifactUtils.js` | 9 | Utility: `getArtifactLabel()` returns human-readable artifact name. | **keep** -- Pure utility, no UI. |
| 20 | `practiceRegistry.js` | ~180 | Practice content registry: device-specific steps for guided simulations (send_email, etc.). | **keep** -- Data file, no UI changes needed. |

### 1.3 Collaboration Components (`client/src/components/Collaboration/`)

| # | Path | Lines | Description | Decision |
|---|------|-------|-------------|----------|
| 21 | `BuddyPanel.jsx` | 223 | Slide-in overlay for buddy management: invite code gen, code entry, buddy status, progress shares, video call trigger, session join/leave. | **replace** -- Split into Helper screens per D5: learner gets HelperTab (call, message, ask-for-help); helper gets HelperHome (dashboard, watch, tools). |
| 22 | `BuddyTerminal.jsx` | 80 | Terminal emulator component: command history, cwd display, run button. | **modify** -- Core rendering is reusable. Needs token update and to be placed inside new Tools tab (helper) or side panel (desktop). |
| 23 | `VideoCall.jsx` | 245 | WebRTC peer-to-peer video call: signaling via WS, camera/mic controls. | **modify** -- Logic is sound. Needs responsive overhaul: full-screen takeover on phone/tablet, floating window on desktop per D1. Token update for controls. |

### 1.4 Dashboard (`client/src/components/Dashboard/`)

| # | Path | Lines | Description | Decision |
|---|------|-------|-------------|----------|
| 24 | `FamilyDashboard.jsx` | 284 | Helper dashboard: profile card, skill progress, safety alerts, conversations, struggles, milestones, feedback summary. | **replace** -- Becomes HelperHome per D5: completely different card layout, real-time watch, question queue, alert cards. |

### 1.5 Admin (`client/src/components/Admin/`)

| # | Path | Lines | Description | Decision |
|---|------|-------|-------------|----------|
| 25 | `AdminFeedback.jsx` | 270 | Admin feedback dashboard: summary stats, filterable table, expandable transcript rows, AI suggestion regeneration. | **modify** -- Stays but needs token update (colors, spacing, typography). Single-column on phone, two-column on tablet, full table on desktop per D1. |

### 1.6 Auth (`client/src/components/Auth/`)

| # | Path | Lines | Description | Decision |
|---|------|-------|-------------|----------|
| 26 | `AuthScreen.jsx` | 136 | Login/register/anonymous gate: email+password form, tab switcher, continue-without-account. | **modify** -- Same auth flow, needs token update and mobile-first layout. Form inputs must meet 56px height, buttons 56px. |

### 1.7 Layout (`client/src/components/Layout/`)

| # | Path | Lines | Description | Decision |
|---|------|-------|-------------|----------|
| 27 | `Header.jsx` | 263 | Top header bar: branding, user info, buddy button, dashboard/admin toggles, profile edit modal, memories viewer modal. | **replace** -- Replaced by TopBar (minimal: title + overflow menu on phone) + profile/memories move to MeTab. Header's edit-profile modal becomes EditProfile full-screen overlay. |

### 1.8 Onboarding (`client/src/components/Onboarding/`)

| # | Path | Lines | Description | Decision |
|---|------|-------|-------------|----------|
| 28 | `OnboardingFlow.jsx` | 368 | 6-step wizard: capabilities intro, name, device, comfort, goal, buddy opt-in. | **replace** -- New 5-screen onboarding per D4: Welcome+name+device combined into 2 screens (down from 3), comfort forced 4-option, goal stays, buddy stays. Full-screen sheets on phone. |

---

## 2. CSS Inventory

### 2.1 Global Styles

| Path | Lines | Media Queries | BEM | Token Migration |
|------|-------|---------------|-----|-----------------|
| `client/src/styles/globals.css` | 246 | `prefers-reduced-motion` | n/a (resets + utility classes) | **Full replacement** with `07-design-tokens.css`. See Section 6 for mapping. |

### 2.2 Component CSS Files

| # | Path | Lines | Media Queries | BEM Correct | Token Migration Needed |
|---|------|-------|---------------|-------------|----------------------|
| 1 | `Chat/ChatWindow.css` | 335 | `min-width: 768px` (x2) | Yes | `--color-bg`, `--color-surface`, `--color-border`, `--color-text-light`, `--color-primary`, `--color-white`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 2 | `Chat/CommandGuide.css` | 388 | `prefers-reduced-motion`, `max-width: 480px` (x2) | Yes | `--color-surface-alt`, `--color-primary`, `--color-border`, `--color-text`, `--color-text-light`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 3 | `Chat/ConnectComputer.css` | 212 | No | Yes | `--color-success`, `--color-primary`, `--color-border`, `--color-white`, `--spacing-*`, `--radius-*` |
| 4 | `Chat/ConversationSidebar.css` | 152 | `max-width: 767px` | Yes | `--color-bg`, `--color-surface`, `--color-border`, `--color-primary`, `--color-primary-light`, `--color-text`, `--color-text-light`, `--spacing-*` |
| 5 | `Chat/DiagnosticFindings.css` | 85 | No | Yes | `--color-success`, `--color-warning`, `--color-danger`, `--color-surface-alt`, `--color-border`, `--spacing-*` |
| 6 | `Chat/FeedbackModal.css` | 146 | No | Yes | `--color-bg`, `--color-surface`, `--color-primary`, `--color-warning`, `--color-border`, `--color-shadow`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 7 | `Chat/MessageBubble.css` | 341 | No | Yes | `--color-primary`, `--color-primary-light`, `--color-white`, `--color-text`, `--color-text-light`, `--color-surface`, `--color-border`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 8 | `Chat/MessageInput.css` | 76 | No | Yes | `--color-white`, `--color-border`, `--color-primary`, `--color-text`, `--color-text-light`, `--spacing-*`, `--font-size-*`, `--touch-target` |
| 9 | `Chat/PracticeMode.css` | 254 | No | Yes | `--color-primary`, `--color-success`, `--color-warning`, `--color-surface-alt`, `--color-border`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 10 | `Chat/ResourceReport.css` | 159 | No | Yes | `--color-primary`, `--color-surface`, `--color-border`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 11 | `Chat/ScreenShare.css` | 101 | No | Yes | `--color-success`, `--color-danger`, `--color-surface`, `--color-text`, `--spacing-*` |
| 12 | `Chat/SidePanel.css` | 107 | No | Yes | `--color-surface`, `--color-border`, `--color-text`, `--color-primary`, `--spacing-*`, `--radius-*` |
| 13 | `Chat/StepSequencePanel.css` | 136 | `max-width: 480px` | Yes | `--color-primary`, `--color-surface`, `--color-border`, `--color-text`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 14 | `Chat/WelcomeBackBanner.css` | 84 | No | Yes | `--color-primary-light`, `--color-primary`, `--color-surface`, `--color-text`, `--spacing-*`, `--radius-*` |
| 15 | `Chat/YouTubeEmbed.css` | 190 | `max-width: 480px` | Yes | `--color-surface`, `--color-border`, `--color-text`, `--color-primary`, `--spacing-*`, `--radius-*` |
| 16 | `Collaboration/BuddyPanel.css` | 259 | `max-width: 480px` | Yes | `--color-surface`, `--color-border`, `--color-primary`, `--color-text`, `--color-shadow`, `--spacing-*`, `--radius-*` |
| 17 | `Collaboration/BuddyTerminal.css` | 147 | No | Yes | `--color-surface`, `--color-border`, `--color-text`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 18 | `Collaboration/VideoCall.css` | 149 | No | Yes | `--color-surface`, `--color-danger`, `--color-text`, `--color-border`, `--spacing-*`, `--radius-*` |
| 19 | `Dashboard/FamilyDashboard.css` | 517 | `max-width: 768px` | Yes | `--color-surface`, `--color-bg`, `--color-border`, `--color-primary`, `--color-success`, `--color-warning`, `--color-danger`, `--color-text`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 20 | `Admin/AdminFeedback.css` | 266 | No | Yes | `--color-surface`, `--color-border`, `--color-primary`, `--color-text`, `--color-text-light`, `--color-danger`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 21 | `Auth/AuthScreen.css` | 175 | No | Mixed (some classes lack block prefix, e.g. `auth-tab` vs `auth-screen__tab`) | `--color-bg`, `--color-surface`, `--color-primary`, `--color-border`, `--color-text`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 22 | `Layout/Header.css` | 423 | `max-width: 480px` | Yes | `--color-primary`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-light`, `--color-white`, `--color-shadow`, `--spacing-*`, `--radius-*`, `--font-size-*` |
| 23 | `Onboarding/OnboardingFlow.css` | 345 | `max-width: 480px` (x2) | Yes | `--color-bg`, `--color-surface`, `--color-primary`, `--color-primary-light`, `--color-border`, `--color-text`, `--color-text-light`, `--spacing-*`, `--radius-*`, `--font-size-*` |

**Summary:** All 23 component CSS files use BEM naming (AuthScreen.css is slightly inconsistent). All 18 component files reference old tokens via `var(--)`. Every file will need token migration at minimum; files belonging to **replace** components will be deleted and rewritten.

---

## 3. View States in App.jsx

App.jsx uses conditional rendering with these control paths:

| Condition | What renders | State variable(s) |
|-----------|-------------|-------------------|
| `isLoading === true` | Loading spinner ("Loading PC Pal...") | `useUser().isLoading` |
| `!user` | `<AuthScreen>` | `useUser().user` |
| `!isOnboarded` | `<OnboardingFlow>` | `useUser().isOnboarded` |
| `currentView === 'admin'` | `<AdminFeedback>` | `currentView` (local state) |
| `currentView === 'dashboard'` | `<FamilyDashboard>` | `currentView` (local state) |
| `currentView === 'chat'` (default) | `<ConversationSidebar>` + `<ChatWindow>` | `currentView` (local state) |
| Always (when onboarded) | `<Header>` at top | Unconditional |
| Always (when onboarded) | `<BuddyPanel>` overlay (controlled by `buddyPanelOpen`) | `buddyPanelOpen` (local state) |
| `viewingConversationId !== null` | ChatWindow shows past conversation (read-only) | `viewingConversationId` (local state) |
| `sidebarCollapsed === true` | ConversationSidebar collapses | `sidebarCollapsed` (local state) |

**Migration impact:** All of this conditional logic is replaced by a router (per D6 recommendation). The new architecture:
- Auth/onboarding remain as route guards
- Tab bar drives navigation between Chat, History, Helper, Me
- Admin becomes a route or sub-screen of Me (admin-only)
- Dashboard becomes HelperHome tab (helper role only)

---

## 4. WebSocket Events

### 4.1 Events the client LISTENS to (server -> client)

Source: `client/src/hooks/useChat.js`

| Event type | Payload | What happens |
|-----------|---------|-------------|
| `init_ack` | `{ conversationId }` | Sets conversation ID |
| `welcome_back` | `{ reviewSkills[], pendingHelp[] }` | Shows WelcomeBackBanner |
| `typing` | `{}` | Shows typing indicator |
| `response` | `{ text, safetyAlert, stepSequence, images, videos, guide, findings, practice, screenshot, conversationId, endedConversationId }` | Adds assistant message; updates sequence; may trigger feedback modal |
| `resources` | `{ text, resources }` | Adds resource message |
| `command_result` | `{ command, output, error }` | Updates command result in guide |
| `pair_result` | `{ success, message }` | Updates agent connection status |
| `agent_status` | `{ connected }` | Updates agent connection badge |
| `new_chat_ack` | `{ conversationId }` | Clears messages, starts fresh |
| `chat_ended` | `{ conversationId }` | Opens feedback modal |
| `error` | `{ message }` | Shows error in chat |
| `terminal_result` | `{ requestId, output, error, cwd }` | Updates terminal history entry |
| `buddy_join_ack` | `{ learnerId, learnerName, messages[] }` | Initializes buddy session state |
| `buddy_chat_forward` | `{ role, text, timestamp }` | Adds message to buddy session |
| `buddy_command_result` | `{ requestId, output, error, cwd }` | Updates buddy terminal entry |
| `buddy_joined` | `{ buddyName }` | Shows "X is helping you" badge |
| `buddy_left` | `{}` | Removes buddy observation badge |
| `buddy_terminal_start` | `{ requestId, command, buddyName }` | Shows pending terminal command in chat |
| `buddy_terminal_result` | `{ requestId, output, error, command, buddyName }` | Updates terminal result in chat |

Source: `client/src/components/Collaboration/VideoCall.jsx`

| Event type | Payload | What happens |
|-----------|---------|-------------|
| `video_signal` | `{ signal }` | WebRTC signaling (offer/answer/ICE) |
| `video_end` | `{}` | Ends video call |

### 4.2 Events the client EMITS (client -> server)

| Event type | Payload | Source |
|-----------|---------|-------|
| `init` | `{ userId, browserSystemInfo }` | useChat (on connect) |
| `chat` | `{ text }` | sendMessage |
| `gather_resources` | `{ text }` | gatherResources |
| `run_command` | `{ command }` | runCommand |
| `pair_agent` | `{ code }` | pairAgent |
| `new_chat` | `{}` | startNewChat |
| `end_chat` | `{}` | endChat |
| `terminal_command` | `{ command, requestId }` | sendTerminalCommand |
| `buddy_join` | `{ learnerId }` | joinBuddySession |
| `buddy_leave` | `{ learnerId }` | leaveBuddySession |
| `buddy_command` | `{ learnerId, command, requestId }` | sendBuddyCommand |
| `screen_frame` | `{ imageBase64 }` | sendScreenFrame |
| `video_signal` | `{ signal }` | VideoCall (WebRTC signaling) |
| `video_end` | `{}` | VideoCall (hang up) |

**Migration impact:** The WS protocol does not change. The useChat hook stays mostly intact; only the UI consumers change. VideoCall's separate WS connection should be unified with the main WS in the redesign.

---

## 5. Hooks Inventory

| # | Hook | File | Description | Decision |
|---|------|------|-------------|----------|
| 1 | `useChat` | `hooks/useChat.js` (597 lines) | WebSocket connection, message state, typing, artifacts, sequences, feedback, terminal, buddy sessions, screen sharing. The central data hook. | **modify** -- Core WS logic stays. Extract buddy session state into a sub-hook or move to context. VideoCall WS should be unified here. |
| 2 | `useAuth` | `hooks/useAuth.js` (48 lines) | HTTP auth actions: register, login, logout. Session-cookie based. | **keep** -- Works as-is. |
| 3 | `useUser` | `hooks/useUser.js` (117 lines) | User profile management: bootstrap from session, create user, onboarding, profile update. | **modify** -- Add role detection (learner vs helper) for the new role-aware UI. |
| 4 | `useBuddy` | `hooks/useBuddy.js` (110 lines) | Buddy pair management: fetch buddy data, generate/accept invite codes, progress shares. | **modify** -- Needs to support the new helper role features (watch requests, help questions queue). |
| 5 | `useConversations` | `hooks/useConversations.js` (35 lines) | Fetches conversation list for a user. | **modify** -- Add search, date grouping support for HistoryScreen. |
| 6 | `useDashboard` | `hooks/useDashboard.js` (29 lines) | Fetches buddy dashboard data for a pair. | **modify** -- Adapts to new HelperHome data requirements. |

### 5.1 Utility Files

| # | File | Description | Decision |
|---|------|-------------|----------|
| 1 | `utils/collectBrowserSystemInfo.js` (80 lines) | Collects OS, browser, GPU, screen info from browser APIs. | **keep** -- No UI, pure utility. |
| 2 | `components/Chat/artifactUtils.js` (9 lines) | `getArtifactLabel()` utility. | **keep** |
| 3 | `components/Chat/practiceRegistry.js` (~180 lines) | Practice task content data. | **keep** |

---

## 6. Token Rename Table

Old tokens (`client/src/styles/globals.css`) mapped to new tokens (`docs/ui-redesign/07-design-tokens.css`):

### 6.1 Colors

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `--color-bg` | `--color-surface-2` | Old `#f5f5f5` -> new `#F7FAFC` (chat thread bg) |
| `--color-text` | `--color-text-1` | Old `#1a1a2e` -> new `#1A202C` |
| `--color-text-light` | `--color-text-2` | Old `#4a4a6a` -> new `#4A5568` |
| `--color-primary` | `--color-primary` | Old `#2563eb` -> new `#2B6CB0` (slightly different hue for AAA) |
| `--color-primary-dark` | `--color-primary-hover` | Old `#1d4ed8` -> new `#2C5282` |
| `--color-primary-light` | `--color-primary-soft` | Old `#dbeafe` -> new `#EBF8FF` |
| `--color-success` | `--color-success` | Old `#16a34a` -> new `#2F855A` |
| `--color-success-light` | `--color-success-soft` | Old `#dcfce7` -> new `#C6F6D5` |
| `--color-warning` | `--color-warning` | Old `#d97706` -> new `#C05621` |
| `--color-warning-light` | `--color-warning-soft` | Old `#fef3c7` -> new `#FEEBC8` |
| `--color-danger` | `--color-danger` | Old `#dc2626` -> new `#C53030` |
| `--color-danger-light` | `--color-danger-soft` | Old `#fee2e2` -> new `#FED7D7` |
| `--color-white` | `--color-surface` | Old `#ffffff` -> new `#FFFFFF` (same value) |
| `--color-border` | `--color-border` | Old `#d1d5db` -> new `#E2E8F0` |
| `--color-surface` | `--color-surface` | Old `#ffffff` -> new `#FFFFFF` (same value) |
| `--color-surface-alt` | `--color-surface-3` | Old `#f0f0f8` -> new `#EDF2F7` |
| `--color-shadow` | _(removed)_ | Replaced by `--shadow-card`, `--shadow-overlay`, etc. |
| _(new)_ | `--color-surface-inset` | `#F1F5F9` -- no old equivalent |
| _(new)_ | `--color-text-3` | `#718096` -- placeholder/tertiary text |
| _(new)_ | `--color-text-on-primary` | `#FFFFFF` |
| _(new)_ | `--color-text-on-helper` | `#FFFFFF` |
| _(new)_ | `--color-text-on-danger` | `#FFFFFF` |
| _(new)_ | `--color-border-strong` | `#CBD5E0` -- form inputs |
| _(new)_ | `--color-border-focus` | `#3182CE` |
| _(new)_ | `--color-helper` | `#2C5282` -- helper role color |
| _(new)_ | `--color-helper-hover` | `#2A4365` |
| _(new)_ | `--color-helper-soft` | `#DEEBFA` |
| _(new)_ | `--color-focus` | `#3182CE` |
| _(new)_ | `--color-focus-shadow` | `rgba(49,130,206,0.3)` |
| _(new)_ | `--color-overlay` | `rgba(26,32,44,0.4)` |
| _(new)_ | `--color-scrim-dark` | `rgba(0,0,0,0.6)` |
| _(new)_ | `--color-code-bg` | `#1A202C` |
| _(new)_ | `--color-code-text` | `#F7FAFC` |

### 6.2 Typography

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `--font-family` | `--font-family-base` | Value changes: added Inter, removed Segoe UI as primary |
| _(new)_ | `--font-family-mono` | For code/terminal |
| `--font-size-base` (`18px`) | `--font-size-base` (`1.125rem`) | Same effective size |
| `--font-size-sm` (`16px`) | `--font-size-sm` (`1rem`) | Same effective size |
| `--font-size-md` (`20px`) | `--font-size-md` (`1.25rem`) | Same effective size |
| `--font-size-lg` (`24px`) | `--font-size-lg` (`1.5rem`) | Same effective size |
| `--font-size-xl` (`30px`) | `--font-size-xl` (`1.75rem` = 28px) | Slightly smaller |
| `--font-size-2xl` (`36px`) | `--font-size-2xl` (`2rem` = 32px) | Slightly smaller |
| _(new)_ | `--font-size-xs` (`0.875rem` = 14px) | Timestamps, captions |
| `--line-height` (`1.6`) | `--line-height-base` (`1.45`) | Slightly tighter |
| _(new)_ | `--line-height-tight` (`1.25`) | Headings |
| _(new)_ | `--line-height-loose` (`1.6`) | AI text, accessibility |
| _(new)_ | `--font-weight-regular` (`400`) | |
| _(new)_ | `--font-weight-medium` (`500`) | |
| _(new)_ | `--font-weight-bold` (`600`) | |
| _(new)_ | `--font-weight-heavy` (`700`) | |

### 6.3 Spacing

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `--spacing-xs` (`4px`) | `--space-1` (`0.25rem`) | Same effective size |
| `--spacing-sm` (`8px`) | `--space-2` (`0.5rem`) | Same effective size |
| `--spacing-md` (`16px`) | `--space-4` (`1rem`) | Same effective size |
| `--spacing-lg` (`24px`) | `--space-5` (`1.5rem`) | Same effective size |
| `--spacing-xl` (`32px`) | `--space-6` (`2rem`) | Same effective size |
| `--spacing-2xl` (`48px`) | `--space-7` (`3rem`) | Same effective size |
| _(new)_ | `--space-3` (`0.75rem` = 12px) | No old equivalent |
| _(new)_ | `--space-8` (`4rem` = 64px) | Hero spacing |

### 6.4 Touch Targets

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `--touch-target` (`48px`) | `--tap-comfort` (`3rem` = 48px) | Same effective size |
| _(new)_ | `--tap-min` (`2.75rem` = 44px) | Sub-actions (close buttons) |
| _(new)_ | `--tap-primary` (`3.5rem` = 56px) | Primary buttons, send |
| _(new)_ | `--tap-hero` (`4rem` = 64px) | Onboarding primary, high-stakes |
| _(new)_ | `--tap-call` (`6rem` = 96px) | Call answer/decline |
| _(new)_ | `--tab-bar-height` (`4rem` = 64px) | Tab bar |

### 6.5 Border Radius

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `--radius-sm` (`6px`) | `--radius-sm` (`0.5rem` = 8px) | Slightly larger |
| `--radius-md` (`12px`) | `--radius-md` (`0.75rem` = 12px) | Same |
| `--radius-lg` (`18px`) | `--radius-lg` (`1rem` = 16px) | Slightly smaller |
| `--radius-full` (`9999px`) | `--radius-pill` (`9999px`) | Renamed |
| _(new)_ | `--radius-xl` (`1.5rem` = 24px) | Input pill, primary button |
| _(new)_ | `--radius-2xl` (`2rem` = 32px) | Modal, hero |

### 6.6 Motion / Transitions

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `--transition` (`200ms ease`) | _(removed)_ | Use `--duration-base` + `--easing-standard` separately |
| _(new)_ | `--duration-instant` (`0ms`) | |
| _(new)_ | `--duration-quick` (`120ms`) | |
| _(new)_ | `--duration-base` (`200ms`) | |
| _(new)_ | `--duration-slow` (`320ms`) | |
| _(new)_ | `--duration-page` (`420ms`) | |
| _(new)_ | `--easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| _(new)_ | `--easing-decel` | `cubic-bezier(0, 0, 0.2, 1)` |
| _(new)_ | `--easing-accel` | `cubic-bezier(0.4, 0, 1, 1)` |
| _(new)_ | `--easing-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

### 6.7 Shadows

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `--color-shadow` (`rgba(26,26,46,0.12)`) | _(removed)_ | Replaced by shadow tokens below |
| _(new)_ | `--shadow-card` | Subtle card elevation |
| _(new)_ | `--shadow-card-hover` | Hovered card |
| _(new)_ | `--shadow-input-top` | Sticky input top edge |
| _(new)_ | `--shadow-overlay` | Full-screen overlays |
| _(new)_ | `--shadow-modal` | Modals |
| _(new)_ | `--shadow-focus` | Focus ring |

### 6.8 Layout

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| _(new)_ | `--layout-max-width` (`100%`) | |
| _(new)_ | `--layout-content-max` (`640px`) | |
| _(new)_ | `--layout-sidebar-w` (`260px`) | |
| _(new)_ | `--layout-sidebar-collapsed` (`64px`) | |
| _(new)_ | `--layout-artifact-w` (`480px`) | |
| _(new)_ | `--layout-top-bar-h` (`3.5rem` = 56px) | |
| _(new)_ | `--layout-input-area-min` (`3.5rem` = 56px) | |
| _(new)_ | `--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right` | iOS safe areas |

### 6.9 Z-Index

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| _(no old scale)_ | `--z-base` (0) | |
| | `--z-content` (1) | |
| | `--z-sticky` (10) | Top bar, input, tab bar |
| | `--z-banner` (20) | Safety banner |
| | `--z-overlay` (100) | Full-screen overlays |
| | `--z-modal` (200) | Modals |
| | `--z-toast` (300) | Toasts |
| | `--z-tooltip` (400) | Tooltips |

### 6.10 New: Dark Theme and Text Size

The new token file includes `[data-theme="dark"]` and `[data-text-size="larger"]` / `[data-text-size="largest"]` variants. The old globals.css has no dark theme or text scaling support.

### 6.11 New: Utility Classes

The new token file adds utility base classes (`pcp-card`, `pcp-btn`, `pcp-btn--primary`, `pcp-btn--ghost`, `pcp-btn--danger`, `pcp-btn--hero`, `skip-link`). The old globals.css only has `btn-primary`, `btn-secondary`, `sr-only`, and animation utilities.

| Old Class | New Class | Notes |
|-----------|-----------|-------|
| `btn-primary` | `pcp-btn pcp-btn--primary` | Different sizing model (min-height: tap-primary vs touch-target) |
| `btn-secondary` | `pcp-btn pcp-btn--ghost` | Ghost style instead of bordered |
| `sr-only` | `sr-only` | Same |
| `animate-fade-in` | _(removed)_ | Use duration tokens directly |
| `animate-slide-up` | _(removed)_ | Use duration tokens directly |

---

## 7. Contradictions and Flags

### 7.1 Codebase vs Design Docs

| # | Area | Contradiction | Resolution |
|---|------|---------------|------------|
| 1 | **Onboarding step count** | Current code has 6 steps (capabilities, name, device, comfort, goal, buddy). Design spec D4 specifies 5 screens (welcome combines with name, device is its own screen). | Follow D4: merge Welcome+Name into screen 1 and Device into screen 2 (Name+Device combined per README "5-screen onboarding -- name + device combined into 2 screens"). |
| 2 | **MessageInput uses `<input>` not `<textarea>`** | D2 specifies a multi-line textarea for the input area. Current code uses `<input type="text">` (single line, Shift+Enter not possible). | Replace with `<textarea>` in the new InputArea component. |
| 3 | **No router** | Current App.jsx uses manual `currentView` state. D6 section 9 recommends a minimal `useView()` client-side router using `history.pushState`. | Introduce `useView()` hook in Phase 2. |
| 4 | **Side panel fixed width** | Current SidePanel has no fixed width constraint and relies on CSS flex. D1 specifies desktop artifact panel at exactly 480px. | Set `--layout-artifact-w: 480px` and enforce it. |
| 5 | **Sidebar width** | ConversationSidebar doesn't declare a fixed width. D1 specifies 260px full / 64px collapsed. | Enforce via `--layout-sidebar-w` and `--layout-sidebar-collapsed`. |
| 6 | **No tab bar** | No bottom tab bar exists. D1 makes this the primary navigation on phone. | Build BottomTabBar component in Phase 2. |
| 7 | **No role-aware UI** | Current code has no learner/helper role distinction in the frontend. Both roles see the same UI. D5 specifies completely different tab sets for learners vs helpers. | Add role detection in `useUser` hook; render different tab sets. |
| 8 | **100vh usage** | App.jsx uses `height: 100vh` inline. D7 mandates `100dvh` to avoid mobile address-bar bugs. | Replace all `100vh` with `100dvh` in new layout. |
| 9 | **No dark theme** | Current globals.css has no dark theme support. D7 provides a complete `[data-theme="dark"]` token set. | Implement during Phase 1 token replacement. |
| 10 | **No text scaling** | No user-adjustable text size. D7 provides `[data-text-size="larger"]` and `[data-text-size="largest"]`. | Add data attributes and toggle in Me tab settings. |
| 11 | **Header contains profile edit + memories** | Header.jsx (263 lines) includes profile editing modal and memories viewer modal inline. D6 moves these to full-screen overlays accessible from the Me tab. | Extract into standalone EditProfile and MemoryViewer components. |
| 12 | **BuddyPanel is a single monolith** | One 223-line component handles invite generation, code entry, buddy status, progress shares, video call, and session management. D5 splits this across multiple screens (HelperTab for learner, HelperHome + Sessions + Tools for helper). | Decompose completely in Phase 6. |
| 13 | **VideoCall creates its own WebSocket** | VideoCall.jsx opens a separate WS connection for signaling. The main app already has a WS via useChat. D5 implies unified signaling through the existing WS. | Unify video signaling through the main WS in the redesign. |
| 14 | **No toast system** | No toast/notification infrastructure exists. D6 section 5.3 specifies 10+ toast scenarios. | Build toast infrastructure in Phase 8. |
| 15 | **No long-press actions** | No long-press menu on messages or conversation cards. D2 and D6 specify long-press contextual sheets with copy, TTS, send-to-helper, explain-differently. | Implement in Phase 3 (chat) and Phase 2 (history). |
| 16 | **No suggestion chips** | MessageInput has no suggestion chips. D2 specifies AI-generated suggestion chips seeded from onboarding goal. | Add to new InputArea in Phase 3. |
| 17 | **Tab labels** | README states "Drop (icons only)" for tab bar labels, but D1 section 1 shows labels below icons. README overrides: icons only with long-press tooltips. | Follow README decision: icon-only tabs. |
| 18 | **Comfort level options** | Current onboarding has 5 comfort levels (1-5). README states "Comfort screen: Forced 4-option, no skip." | Change to 4 options in Phase 5. |
| 19 | **AI avatar** | Current code uses text "PC" as avatar. README states "AI avatar: Illustrated mascot." | Replace with mascot image/SVG in Phase 3. |
| 20 | **Get Help button** | Current "Get External Help" button calls `gatherResources()`. README confirms: "Triggers AI to fetch external resources, generates Resources artifact." No change to behavior, only to presentation (button text, position, style). | Keep behavior, update UI. |

### 7.2 Internal Design Doc Inconsistencies

| # | Doc A | Doc B | Issue | Resolution |
|---|-------|-------|-------|------------|
| 1 | D1 shows tab labels (Chat, History, Helper, Me) | README says "Icon-only tabs" | README is authoritative (explicit decision table). | Icons only. |
| 2 | D1 specifies 4 tabs including Helper always visible | README says "Helper tab visibility: Only when helper is paired" | README is authoritative. | 3 tabs by default, 4 when paired. |
| 3 | D1 tab bar height "72px" (icon + label + pad) | D7 `--tab-bar-height: 4rem` (64px) | With icons-only (no labels), 64px is correct. | Use `--tab-bar-height` (64px). |

---

## 8. File Structure After Migration (Planned)

For reference, the target file structure that later phases will build toward:

```
client/src/
  styles/
    globals.css              (replaced with D7 tokens)
  components/
    Shell/
      ShellLayout.jsx        (new: top bar + tab bar + content area)
      TopBar.jsx             (new: replaces Header)
      BottomTabBar.jsx       (new)
      SideRail.jsx           (new: tablet/desktop sidebar)
    ChatScreen/
      ChatScreen.jsx         (new: replaces ChatWindow)
      MessageBubble.jsx      (new: replaces old)
      InputArea.jsx          (new: replaces MessageInput)
      SuggestionChips.jsx    (new)
      TypingIndicator.jsx    (new: extracted)
      SafetyBanner.jsx       (new: extracted)
      WelcomeBackBanner.jsx  (modified)
      StepSequencePanel.jsx  (modified)
    Artifacts/
      ArtifactCard.jsx       (new: inline chat card)
      GuideViewer.jsx        (new: replaces CommandGuide)
      FindingsViewer.jsx     (new: replaces DiagnosticFindings)
      VideoPlayer.jsx        (new: replaces YouTubeEmbed)
      ResourcesViewer.jsx    (new: replaces ResourceReport)
      PracticeMode.jsx       (new: replaces old)
      ArtifactPanel.jsx      (new: desktop side panel)
    Onboarding/
      OnboardingFlow.jsx     (new: 5-screen version)
    Helper/
      HelperTab.jsx          (new: learner's helper view)
      HelperHome.jsx         (new: helper's dashboard)
      SessionsScreen.jsx     (new)
      ToolsScreen.jsx        (new)
    History/
      HistoryScreen.jsx      (new: replaces ConversationSidebar on phone)
    Profile/
      MeScreen.jsx           (new)
      EditProfile.jsx        (new: extracted from Header)
      MemoryViewer.jsx       (new: extracted from Header)
    Overlays/
      FeedbackModal.jsx      (modified)
      ConnectComputer.jsx    (modified)
    Collaboration/
      VideoCall.jsx          (modified)
      BuddyTerminal.jsx     (modified)
      ScreenShare.jsx        (modified)
    Admin/
      AdminFeedback.jsx      (modified)
    Auth/
      AuthScreen.jsx         (modified)
    shared/
      AnimatedHotspot.jsx    (kept as-is)
  hooks/
    useChat.js               (modified)
    useAuth.js               (kept)
    useUser.js               (modified)
    useBuddy.js              (modified)
    useConversations.js      (modified)
    useDashboard.js          (modified)
    useView.js               (new: minimal router)
  utils/
    collectBrowserSystemInfo.js  (kept)
    artifactUtils.js             (kept, moved from Chat/)
    practiceRegistry.js          (kept, moved from Chat/)
  router/
    routes.js                (new: route definitions)
```

---

## 9. Summary Statistics

| Metric | Count |
|--------|-------|
| JSX components | 26 |
| CSS files | 24 (23 component + 1 global) |
| Hooks | 6 |
| Utility files | 3 |
| Components to **replace** | 12 |
| Components to **modify** | 10 |
| Components to **keep** | 4 |
| Components to **delete** | 0 (all replaced or modified; old files are retired when new ones land) |
| WebSocket event types (listen) | 20 |
| WebSocket event types (emit) | 14 |
| Total CSS lines | ~5,300 |
| Old tokens to rename | ~25 color + ~8 typography + ~6 spacing + ~5 radius + ~1 transition + ~1 touch |
| New tokens with no old equivalent | ~50+ (dark theme, shadows, z-index, layout, motion, safe areas, etc.) |
| Contradictions flagged | 20 (codebase vs spec) + 3 (internal doc) |

---

## 10. Phase 1: Design Token Migration (Completed 2026-05-02)

### 10.1 What Changed

**globals.css fully replaced** with `docs/ui-redesign/07-design-tokens.css` content. The new file includes:
- Complete new token system (typography, spacing, colors, shadows, motion, z-index, layout, safe-areas)
- Dark theme (`[data-theme="dark"]`)
- Text scaling (`[data-text-size="larger"]`, `[data-text-size="largest"]`)
- Reduced motion support
- Forced colors / high contrast support
- Global resets and defaults (box-sizing, focus rings, button/input base styles)
- BEM utility classes (`pcp-card`, `pcp-btn`, etc.)
- Legacy `btn-primary` / `btn-secondary` classes preserved for backward compatibility
- Animation keyframes (`fadeIn`, `pulse`, `slideUp`) and utility classes preserved for existing component references

**All 23 component CSS files migrated.** Token renames applied:

| Old Token | New Token | Files Affected |
|-----------|-----------|----------------|
| `--color-bg` | `--color-surface-2` | ChatWindow, FamilyDashboard, AuthScreen |
| `--color-text` | `--color-text-1` | 11 component CSS files |
| `--color-text-light` | `--color-text-2` | 11 component CSS files |
| `--color-primary-dark` | `--color-primary-hover` | OnboardingFlow, StepSequencePanel, FeedbackModal |
| `--color-primary-light` | `--color-primary-soft` | OnboardingFlow, FamilyDashboard, Header, ConversationSidebar, MessageInput, FeedbackModal, StepSequencePanel, BuddyPanel |
| `--color-success-light` | `--color-success-soft` | ChatWindow, FamilyDashboard |
| `--color-warning-light` | `--color-warning-soft` | ChatWindow, FamilyDashboard |
| `--color-danger-light` | `--color-danger-soft` | OnboardingFlow, FamilyDashboard, Header, MessageBubble |
| `--color-white` | `--color-surface` | 11 component CSS files |
| `--color-surface-alt` | `--color-surface-3` | OnboardingFlow, FamilyDashboard, Header, ConversationSidebar, MessageInput, StepSequencePanel |
| `--color-shadow` | Shadow tokens | ChatWindow (`--shadow-card`), MessageBubble (`--shadow-card`), ConversationSidebar (`--shadow-overlay`), MessageInput (`--shadow-input-top`), FeedbackModal (`--shadow-modal`), StepSequencePanel (`--shadow-overlay`), Header (`--shadow-card`), FamilyDashboard (`--shadow-card`) |
| `--radius-full` | `--radius-pill` | FamilyDashboard, Header, StepSequencePanel, ChatWindow |
| `--transition` | `--duration-base` + `--easing-standard` | OnboardingFlow, Header, MessageInput, StepSequencePanel |
| `--transition-fast` | `--duration-quick` + `--easing-standard` | Header, BuddyPanel |
| `--spacing-sm` | `--space-2` | ConversationSidebar, StepSequencePanel |
| `--spacing-md` | `--space-4` | ConversationSidebar, StepSequencePanel |
| `--spacing-lg` | `--space-5` | ConversationSidebar, StepSequencePanel |
| `--font-family` | `--font-family-base` | MessageBubble |
| `--line-height` | `--line-height-base` | StepSequencePanel |

**App.jsx inline styles updated:**
- `minHeight: '100vh'` changed to `'100dvh'`
- `height: '100vh'` changed to `'100dvh'`
- `'var(--color-text-light)'` changed to `'var(--color-text-2)'`

**100vh -> 100dvh migration:**
- `globals.css`: html, body, #root all use `100vh` fallback + `100dvh`
- `OnboardingFlow.css`: `min-height: 100vh` fallback + `100dvh`
- `AuthScreen.css`: `min-height: 100vh` fallback + `100dvh`
- `App.jsx`: inline styles updated to `100dvh`

**Safe-area handling added:**
- `MessageInput.css`: `padding-bottom: max(16px, var(--safe-bottom))`
- `StepSequencePanel.css`: `padding-bottom: max(var(--space-4), var(--safe-bottom))`
- `FeedbackModal.css`: `padding-bottom: max(20px, var(--safe-bottom))`

### 10.2 New Files Created

| File | Purpose |
|------|---------|
| `client/src/hooks/useTheme.js` | Theme toggle hook (light/dark). Reads `prefers-color-scheme`, persists to `localStorage`, sets `data-theme` on `<html>`. |
| `client/src/hooks/useTextSize.js` | Text size toggle hook (default/larger/largest). Persists to `localStorage`, sets `data-text-size` on `<html>`. |

### 10.3 Decisions Made

1. **Legacy animation classes preserved.** The old `animate-fade-in` and `animate-slide-up` classes are still referenced by existing components. Rather than doing a full component rewrite (which belongs in later phases), we kept the keyframes and utility classes in globals.css, but updated them to use the new duration/easing tokens.

2. **Legacy `btn-primary`/`btn-secondary` classes preserved.** Multiple components reference these. They are now defined using new tokens in globals.css. They will be replaced with `pcp-btn` variants when each component is rebuilt in later phases.

3. **`--color-shadow` mapped per-context.** The old `--color-shadow` was a single `rgba()` value used everywhere. The new system has context-specific shadow tokens (`--shadow-card`, `--shadow-input-top`, `--shadow-overlay`, `--shadow-modal`). Each usage was mapped to the most semantically appropriate shadow token.

4. **Hardcoded colors left in component CSS files.** Many component files (CommandGuide, PracticeMode, VideoCall, BuddyTerminal, etc.) use hardcoded hex colors rather than tokens. These are not migrated in Phase 1 because those components are scheduled for full replacement in later phases. Only token-referenced values were migrated.

5. **`--transition-fast` was not a defined token.** Header.css and BuddyPanel.css referenced `--transition-fast` which never existed in the old globals.css. These were mapped to `--duration-quick` + `--easing-standard`.

### 10.4 Verification

- `cd client && npx vite build` -- **PASS** (170ms, all assets generated)
- `npx jest --config jest.config.js` -- **PASS** (604 tests, 27 suites, 0 failures)

---

## 11. Phase 2: Layout Shell + Navigation (Completed 2026-05-02)

### 11.1 What Changed

**New files created:**

| File | Purpose |
|------|---------|
| `client/src/router/index.js` | Minimal pushState-based router. `useRouter()` hook returns `{ view, params, navigate, back }`. Matches 15 route patterns per D6 section 9. No external dependencies. |
| `client/src/hooks/useBreakpoint.js` | Returns `'phone'` / `'tablet'` / `'desktop'` using `matchMedia` listeners. Breakpoints: phone < 640px, tablet 640-1024px, desktop > 1024px. |
| `client/src/contexts/RoleContext.jsx` | `RoleProvider` + `useRole()` hook. Provides `{ role, setRole, activeLearner, setActiveLearner }`. Defaults to `'learner'`. Helper role detection deferred to Phase 6. |
| `client/src/components/ShellLayout/ShellLayout.jsx` | Main responsive container using CSS Grid with named template areas. Renders TopBar, SideRail (tablet/desktop), BottomTabBar (phone), ArtifactPanel (desktop). |
| `client/src/components/ShellLayout/ShellLayout.css` | CSS Grid layout with media queries for phone (3-row stack), tablet (2-col with rail), desktop (2-col with rail + optional artifact panel). Uses design tokens for all dimensions. |
| `client/src/components/ShellLayout/TopBar.jsx` + `.css` | 56px contextual top bar. Left: back arrow (when drilled in) or menu toggle (tablet/desktop). Right: overflow menu + optional helper role pill. |
| `client/src/components/ShellLayout/BottomTabBar.jsx` + `.css` | Phone-only 64px + safe-area bottom tab bar. Icon-only (no labels per spec). Role-aware: learner gets Chat/History/Helper/Me; helper gets Home/Sessions/Tools/Me. `role="tablist"` with `aria-selected` and `aria-label`. Long-press shows tooltip. |
| `client/src/components/ShellLayout/SideRail.jsx` + `.css` | Tablet/desktop collapsible side rail. Collapsed 64px (icon-only), expanded 260px (icons + labels). Toggle button. Tablet defaults to collapsed, desktop defaults to expanded. |
| `client/src/components/ShellLayout/ArtifactPanel.jsx` + `.css` | Desktop-only 480px right panel placeholder. Shows "No artifact selected" empty state. Will be connected in Phase 4. |

**App.jsx refactored:**

- Wrapped in `<RoleProvider>` at the root level
- Split into `App` (provides RoleProvider) and `AppContent` (uses router + shell)
- Old `currentView` state replaced by `useRouter()` hook with pushState navigation
- Old Header + conditional view rendering replaced by `<ShellLayout>` with routed content
- Auth gate, onboarding gate, and loading state preserved unchanged
- ChatWindow + ConversationSidebar + BuddyPanel all preserved and still functional
- Placeholder components created for History, Helper, and Me views
- Admin and Dashboard views preserved and accessible via routes `/admin` and `/helper/home`

**ConversationSidebar.css updated:**

- Added `@media (max-width: 639px)` rule to hide `.conv-sidebar` inside `.pcp-shell` on phone viewports (navigation handled by bottom tab bar instead)

### 11.2 CSS Architecture

All new CSS uses BEM naming with `pcp-` prefix. Layout is CSS Grid-driven via media queries:

- **Phone** (`<640px`): `grid-template-areas: "topbar" "main" "tabbar"` with 3 rows
- **Tablet** (`640px-1024px`): `grid-template-areas: "topbar topbar" / "rail main"` with 2 columns
- **Desktop** (`>1024px`): `grid-template-areas: "topbar topbar" / "rail main"` with optional artifact panel column

Layout switching is class-based (media queries), not JS-driven. The `useBreakpoint()` hook is only used for conditional rendering of shell sub-components (which sub-components to mount), not for layout.

### 11.3 Inline SVG Icons

All tab bar and side rail icons are inline SVGs (no icon library dependency). Icons include:
- Chat (speech bubble), History (clock), Helper (people), Me (person)
- Home (house), Sessions (film), Tools (wrench) for helper role
- Back arrow, hamburger menu, overflow dots, collapse chevron for navigation

Active state uses filled icon variants; inactive uses stroked outlines.

### 11.4 Decisions Made

1. **ConversationSidebar hidden on phone.** The old conversation list sidebar is hidden on phone viewports since navigation is now handled by the bottom tab bar. On tablet/desktop, it remains visible inside the chat view for conversation switching. Full replacement with HistoryScreen comes in Phase 3.

2. **ConversationSidebar collapsed by default in shell.** Within the chat view, the sidebar is rendered in collapsed state. On desktop, the SideRail handles primary navigation; the ConversationSidebar provides conversation switching within the chat. This preserves existing functionality without conflict.

3. **BuddyPanel rendered outside the shell.** The BuddyPanel overlay is rendered as a sibling to ShellLayout (not inside it) so it can overlay the entire viewport as before.

4. **Router falls back to 'chat' view.** Any unrecognized URL path maps to the chat view, ensuring the app always shows a usable state.

5. **SideRail defaults.** Tablet: collapsed (64px icons). Desktop: expanded (260px with labels). Both can be toggled.

### 11.5 Verification

- `cd client && npx vite build` -- **PASS** (158ms, all assets generated)
- `npx jest --config jest.config.js` -- **PASS** (604 tests, 27 suites, 0 failures)
- Phone viewport (360px): bottom tab bar visible with 4 icon tabs, tabs switch between views via pushState router
- Desktop viewport (1200px): side rail visible on left with icons + labels, no tab bar, chat view fills main area
- Chat functionality preserved: ChatWindow + ConversationSidebar + BuddyPanel all render and connect correctly

---

## 12. Phase 10: Polish, A11y Audit, Edge Cases (Completed 2026-05-03)

### 12.1 Accessibility Checklist Results

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | All interactive elements have accessible names | PASS | All buttons, tabs, inputs have `aria-label` or visible labels |
| 2 | All images have `alt` | PASS (FIXED) | Added `onError` handlers to `<img>` in MessageBubble, VideoPlayer, VideoCall; decorative images use `alt=""` |
| 3 | All form fields have linked `<label>` | PASS (FIXED) | Added linked `<label>` to: HelperTools custom command, HelperSessions search, WatchView nudge, OnboardingFlow goal input. InputArea, ReplyComposer, PairingFlow, ScreenNameDevice, ScreenGoal already had linked labels. |
| 4 | Focus order is logical | PASS | Tab order matches visual order across all components |
| 5 | Focus rings visible (3px solid `--color-focus`) | PASS | Global `:focus-visible` rule in globals.css provides 3px solid `--color-focus` on all focusable elements |
| 6 | Keyboard navigation (Tab, Shift+Tab, Enter, Space, Esc) | PASS | Esc closes all overlays (ChatOptionsSheet, MessageContextSheet, ArtifactOverlay, BottomSheet, ConfirmDialog, Modal, FullScreenOverlay, LearnerSwitcher). Focus traps in all overlays. Tab cycles through focusable elements. |
| 7 | `prefers-reduced-motion` disables animations | PASS (FIXED) | Global gate in globals.css zeros all durations. Added `prefers-reduced-motion` to OnboardingScreen.css slide animations and OnboardingFlow.css transitions (were missing). Already present in: MessageBubble, MessageThread, SafetyBanner, WelcomeBackBanner, ArtifactOverlay, ArtifactCard, SuggestionChip, ChatOptionsSheet, MessageContextSheet, InputArea, TypingIndicator. |
| 8 | All text meets AA at 18px minimum | PASS | Body minimum is `--font-size-base` (18px). Only timestamps/captions use `--font-size-xs` (14px) and `--font-size-sm` (16px) which are acceptable for non-body text per WCAG. |
| 9 | Screen reader announcements | PASS | TypingIndicator: `aria-live="polite"` + `role="status"` + `sr-only` text. SafetyBanner: `role="alert"` + `aria-live="assertive"`. WelcomeBackBanner: `role="status"` + `aria-live="polite"`. ToastHost: `aria-live` (polite/assertive) + `role="status"`. Connection banner: `role="alert"` + `aria-live="assertive"`. Slow response warning: `role="status"` + `aria-live="polite"`. |
| 10 | `lang="en"` on `<html>` | PASS | Already present in `client/index.html` |
| 11 | Skip links | PASS (FIXED) | Added skip links to ShellLayout: "Skip to chat" (`#main-content`) and "Skip to input" (`#pcp-chat-input`). Added `id="main-content"` to `<main>`. Skip link CSS (`.skip-link`) already defined in globals.css. |

### 12.2 Responsive Checklist Results

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | 320px (small Android) - no horizontal scroll | PASS | All components use `max-width: 100%`, flex/grid layouts, and `overflow-x: hidden` on main containers. MessageBubble has `@media (max-width: 359px)` for tighter padding. EmptyState has small-screen padding rules. |
| 2 | 360-414px (most phones) - default layout | PASS | Phone layout: top-bar + main + tab-bar via CSS Grid. Bottom tab bar 64px + safe-area. All touch targets meet 48px minimum. |
| 3 | 640-1024px (tablet) - two-pane with side rail | PASS | CSS Grid: `grid-template-columns: var(--layout-sidebar-collapsed) 1fr` with expandable rail. SideRail hidden on phone, tab bar hidden on tablet+. |
| 4 | 1025px+ (desktop) - three-pane | PASS | CSS Grid supports artifact panel column (`grid-template-columns: var(--layout-sidebar-w) 1fr var(--layout-artifact-w)`) when `pcp-shell--artifact-open`. |
| 5 | No `px` widths that overflow on small screens | PASS (FIXED) | Added `max-width: 100%` to onboarding invite code display. Message screenshots already have `width: 100%`. |
| 6 | Missing media queries in new components | PASS | All new components have appropriate media queries. |
| 7 | `100vh` that should be `100dvh` | PASS (FIXED) | Fixed `min-height` order in OnboardingScreen.css (fallback `100vh` now comes before `100dvh`). All other locations already correct. |
| 8 | Fixed-width elements have `max-width: 100%` | PASS (FIXED) | Added `max-width: 100%` to screenshot images in MessageBubble.css. |

### 12.3 Edge Case Checklist Results

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Network drop: WS reconnect toast | PASS (FIXED) | Connection banner in MessageThread changed from `role="status"` to `role="alert"` with `aria-live="assertive"` and updated text to "Connection lost. Trying to reconnect..." |
| 2 | AI response timeout (>30s) | PASS (FIXED) | Added 30-second timer in MessageThread. When `isTyping` exceeds 30s, shows "PC Pal is taking longer than usual. Please wait..." with warning styling. Auto-clears when typing ends. |
| 3 | Image load failure | PASS (FIXED) | Added `onError` handlers to all `<img>` elements: MessageBubble screenshots (2 locations), VideoPlayer thumbnails, VideoCall buddy avatars (2 locations). Handler hides the broken image element. |
| 4 | Long text: `overflow-wrap: break-word` | PASS (FIXED) | Added `overflow-wrap: break-word` and `word-wrap: break-word` to `body` in globals.css (cascades globally). Also added explicitly to MessageThread connection banner, slow response warning, and SafetyBanner body. MessageBubble already had it. |
| 5 | Input paste handling | PASS (FIXED) | Added `MAX_INPUT_LENGTH = 4000` constant and `onPaste` handler to InputArea textarea. Paste is truncated to 4000 chars. Also added `maxLength` attribute as secondary guard. PairingFlow already handles paste correctly for code input. |

### 12.4 Files Modified

| File | Changes |
|------|---------|
| `client/src/components/ShellLayout/ShellLayout.jsx` | Added skip links, `id="main-content"` on `<main>` |
| `client/src/components/ChatScreen/MessageThread.jsx` | Added slow response timer (30s), improved connection banner a11y (`role="alert"`), imported `useState` |
| `client/src/components/ChatScreen/MessageThread.css` | Added `.pcp-thread__slow-response` style |
| `client/src/components/ChatScreen/MessageBubble.jsx` | Added `onError` handlers to all `<img>`, ensured `alt` fallback on device screenshots |
| `client/src/components/ChatScreen/MessageBubble.css` | Added `max-width: 100%` to screenshot images |
| `client/src/components/ChatScreen/WelcomeBackBanner.css` | Increased dismiss button to `--tap-min` (44px) from 32px |
| `client/src/components/ChatScreen/SafetyBanner.css` | Added `overflow-wrap: break-word` to body text |
| `client/src/components/ChatScreen/TypingIndicator.css` | Added horizontal padding for alignment consistency |
| `client/src/components/ChatScreen/InputArea.jsx` | Added paste truncation, `MAX_INPUT_LENGTH`, `maxLength` attribute |
| `client/src/components/Artifacts/VideoPlayer.jsx` | Added `onError` to thumbnail images, `aria-label` to Done button |
| `client/src/components/Artifacts/DiagnosticFindings.jsx` | Added `aria-label` to Done button |
| `client/src/components/Artifacts/ResourcesViewer.jsx` | Added `aria-label` to Done button |
| `client/src/components/Collaboration/VideoCall.jsx` | Added `onError` to buddy avatar images |
| `client/src/components/Helper/HelperTools.jsx` | Added linked `<label>` for custom command input |
| `client/src/components/Helper/HelperSessions.jsx` | Added linked `<label>` for search input |
| `client/src/components/Helper/WatchView.jsx` | Added linked `<label>` for nudge input |
| `client/src/components/Onboarding/OnboardingScreen.css` | Fixed `min-height` fallback order, added `prefers-reduced-motion` for slide animations |
| `client/src/components/Onboarding/OnboardingFlow.jsx` | Added linked `<label>` for goal input |
| `client/src/components/Onboarding/OnboardingFlow.css` | Added `prefers-reduced-motion`, `max-width: 100%` to invite code |
| `client/src/styles/globals.css` | Added `overflow-wrap: break-word` to body |

### 12.5 Verification

- `cd client && npx vite build` -- **PASS** (155ms, all assets generated)
- `npx jest --config jest.config.js` -- **PASS** (604 tests, 27 suites, 0 failures)
