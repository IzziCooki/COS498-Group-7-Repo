# PC Pal — Deliverable 5: Buddy / Helper Experience (Mobile)

> **Scope:** The complete UI for Sarah (the helper). Different from Margaret's view but built from the same component vocabulary. Covers dashboard, joining a session, video call, remote terminal, help requests, and progress sharing.

---

## 1. Role-Differentiation Strategy

**Same app, different first screen.** PC Pal detects role at sign-in (or via the buddy code path) and routes to one of two top-level layouts.

| Role | Default tab | Tab bar | Top bar accent |
|---|---|---|---|
| Learner (Margaret) | Chat | Chat / History / Helper† / Me | Friendly blue (`--color-primary`) |
| Helper (Sarah) | Home | Home / Sessions / Tools‡ / Me | Slightly cooler blue (`--color-helper`) — same family, different shade so role is unmistakable |

† Helper tab only present when paired (per D1)
‡ Tools tab only enabled mid-session

**Visual contract:** Sarah's UI uses the same tokens, components, and chassis as Margaret's. The only differences are content, the cooler accent, and a persistent "Helper mode" pill in the top-left of every screen so the role is never ambiguous (especially important if Sarah is also a learner on her own account elsewhere).

```
┌──────────────────────────────────────────────┐
│  ◉ Helper mode    Margaret                ⋯  │  ← Helper top bar
│                                              │     "Helper mode" pill 24px tall
│                                              │     bg: helper-soft
│                                              │     text 14px medium helper
│                                              │     "Margaret" = current learner
│                                              │       (tap to switch if Sarah
│                                              │        helps multiple people)
└──────────────────────────────────────────────┘
```

---

## 2. Home — Helper Dashboard

The single most important helper screen. Sarah opens the app to "is Mom OK?" — and this answers it in one glance.

```
┌──────────────────────────────────────────────┐
│  ◉ Helper mode    Margaret  ▾            ⋯  │  Top bar (56px)
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐   │  ← STATUS HERO CARD
│  │  ┌──┐                                 │   │     ~140px tall
│  │  │MA│  Margaret                       │   │     bg: surface
│  │  └──┘  ● Online · learning right now  │   │     border: 1px border
│  │        Last chat: 8 min ago            │   │     radius: 16px
│  │                                        │   │     padding: 20px
│  │  ┌──────────┐  ┌──────────────────┐  │   │     margin: 16px
│  │  │ 📞 Call   │  │ 👀 Watch session  │  │   │
│  │  └──────────┘  └──────────────────┘  │   │     Avatar: 48×48
│  └──────────────────────────────────────┘   │     Name: 24px bold
│                                              │     Status row: 18px
│                                              │       ● = success / amber /
│                                              │        gray dot for state
│  ┌──────────────────────────────────────┐   │     Two action btns 56px
│  │ 🚨  1 alert from this week           │   │       Call: primary
│  │     Possible scam call · Tuesday     │   │       Watch: ghost
│  │                                ▸     │   │       (Watch only enabled if
│  └──────────────────────────────────────┘   │        Margaret is currently
│                                              │        in a chat session)
│  ┌──────────────────────────────────────┐   │
│  │ ❓  2 questions waiting                │   │  ← QUICK ALERT CARDS
│  │     "How do I add an attachment?"    │   │     80px tall each
│  │                                ▸     │   │     bg: surface
│  └──────────────────────────────────────┘   │     border-left: 4px
│                                              │       danger / warning /
│                                              │       primary depending on
│                                              │       category
│  PROGRESS THIS WEEK                          │     icon 24px, label 18px,
│                                              │     count 16px text-2,
│  ┌──────────────────────────────────────┐   │     preview 16px text-1,
│  │  Skills learned                       │   │     chevron
│  │                                       │   │
│  │  ████████████░░░░  3 of 5            │   │  ← PROGRESS CARD
│  │                                       │   │     bg: surface-2
│  │  Recent: Video calling ✓             │   │     padding: 16px
│  │          Sending email ✓              │   │     bar: 12px tall, primary
│  │          Photo sharing (in progress)  │   │       success when complete
│  └──────────────────────────────────────┘   │     items: 18px
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  See all activity                  ▸ │   │  ← VIEW-ALL ROW
│  └──────────────────────────────────────┘   │     Tap → Sessions tab
│                                              │       filtered to this learner
│                                              │
├──────────────────────────────────────────────┤
│   🏠         🎬         🛠         👤        │  Bottom tab bar (icon-only)
└──────────────────────────────────────────────┘  Tools icon dimmed when no
                                                   active session
```

**Status pill states:**

| State | Visual | Meaning |
|---|---|---|
| ● Online · learning right now | green dot | In active chat in last 5 min |
| ● Online · idle | green dot, "idle" text | Logged in, no recent activity |
| ● Offline · last seen 2 hours ago | gray dot | Not logged in |
| ● Sleeping · 11:42 PM her time | indigo dot | Logged out + Margaret's local time is between 22:00–07:00 (so Sarah doesn't worry / doesn't call mid-night) |
| 🚨 Needs help · open question | red dot | Pending help request |

**Multiple-learner case:** If Sarah helps her father too, the "Margaret ▾" in the top bar is a learner switcher. Tap → sheet listing all paired learners with their status pills. Tapping switches the entire dashboard context.

---

## 3. Sessions Tab — Conversation History (Helper View)

Sarah can review what Margaret has been chatting about. Read-only by default; she can leave reactions but not edit Margaret's chats.

```
┌──────────────────────────────────────────────┐
│  ◉ Helper mode    Margaret  ▾            ⋯  │
├──────────────────────────────────────────────┤
│  🔍 Search Margaret's chats                  │  Search input (sticky)
├──────────────────────────────────────────────┤
│  All  ●  Open questions  ·  Alerts  ·  ⭐    │  Filter chips, horizontal scroll
├──────────────────────────────────────────────┤
│  TODAY                                       │
│  ┌──────────────────────────────────────┐   │
│  │ 📧 Setting up email                  │   │  Conversation card
│  │ "I learned how to..."  · 8 min ago   │   │  Same chassis as learner
│  │ ⭐⭐⭐⭐⭐                              │   │    History tab
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ ❓ Question for me                   │   │  Question card variant
│  │ "How do I add an attachment?"        │   │  border-left: 4px primary
│  │ 1 hour ago · waiting for reply       │   │  Tap → reply composer
│  │  ┌────────────┐                      │   │
│  │  │ Reply now ▸│                      │   │
│  │  └────────────┘                      │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  TUESDAY                                     │
│  ┌──────────────────────────────────────┐   │
│  │ 🚨 Possible scam · Margaret was OK   │   │  Alert card variant
│  │ "Microsoft called and said..."       │   │  border-left: 4px danger
│  │ Tuesday 2:14 PM · resolved           │   │  bg: danger-bg-lite
│  │                                  ▸   │   │
│  └──────────────────────────────────────┘   │
│                                              │
├──────────────────────────────────────────────┤
│   🏠         🎬●        🛠         👤        │  Sessions has unread dot
└──────────────────────────────────────────────┘
```

**Tap a regular conversation:** Opens a read-only transcript view. Same chat layout as Margaret sees, but with a banner at top: "Read-only · You're seeing what Margaret saw." A floating "❤ React" button lets Sarah leave reactions on individual AI or learner messages (these appear in Margaret's view as small heart with "From Sarah").

**Tap a question card:** Opens reply composer (§4).

**Tap an alert card:** Opens alert detail view (§7).

---

## 4. Reply Composer — Helper Answering a Question

When Margaret asks for help, Sarah taps "Reply now" → goes to the composer.

```
┌──────────────────────────────────────────────┐
│  ◀ Cancel                                    │
├──────────────────────────────────────────────┤
│  Reply to Margaret                           │  24px lg
│                                              │
│  ┌──────────────────────────────────────┐   │  ← QUESTION ECHO
│  │ Margaret asked, 1 hour ago:          │   │     bg: surface-2
│  │                                       │   │     dimmed border
│  │ "How do I add an attachment?         │   │     padding 16px
│  │  I want to send a picture to my       │   │     italic body 18px
│  │  accountant."                         │   │
│  │                                       │   │     Context: skill, device,
│  │ Context: Email · Mac · learning      │   │       comfort level — helps
│  └──────────────────────────────────────┘   │       Sarah pitch right
│                                              │
│  Your reply                                  │
│  ┌──────────────────────────────────────┐   │
│  │ Hi Mom! In your email, click the     │   │  Textarea, 5 lines
│  │ paperclip icon...                    │   │  bg: surface
│  │                                       │   │  border 1px
│  └──────────────────────────────────────┘   │  20px text-1
│                                              │
│  ┌────────────┐  ┌────────────────────┐     │
│  │ 🎤 Voice    │  │ 📷 Add photo        │     │  Voice → speech-to-text
│  └────────────┘  └────────────────────┘     │  Photo → attach screenshot
│                                              │     for Margaret to see
│  ┌──────────────────────────────────────┐   │
│  │ 🤖 Let PC turn this into a guide     │ ○ │   │  Toggle: when ON, Sarah's
│  └──────────────────────────────────────┘   │  reply is fed to AI which
│                                              │  produces a proper guide
│                                              │  artifact for Margaret. Sarah
│                                              │  becomes the source author;
│                                              │  AI does the formatting.
│                                              │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐│
│ │  Send to Margaret  ▶                      ││  Primary 56px
│ └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

**Why the AI-formatting toggle matters:** Sarah is busy. She might dash off "click the paperclip, then find the photo, then click attach." The toggle lets the AI take her plain-language answer and generate Margaret-grade output (with screenshots, hotspots, large fonts). Sarah's name is credited at the top of the generated guide ("Made with help from Sarah").

---

## 5. Watch Session — Live Observation

The most powerful helper feature. Sarah can watch Margaret's chat unfold in real time, send private nudges to Margaret, and (with explicit permission) take over briefly.

### 5.1 Entry & permission

Watch is gated. When Sarah taps "Watch session" on the dashboard, **Margaret must approve**. A modal appears in Margaret's chat:

```
   ┌────────────────────────────────────────┐
   │                                        │   In Margaret's UI
   │   Sarah wants to watch                 │
   │                                        │   role="alertdialog"
   │   She'll see your messages with PC     │   blocks chat input
   │   while you chat. You can stop her      │
   │   from watching anytime.                │
   │                                        │
   │  ┌────────────┐  ┌──────────────────┐  │
   │  │ Not now    │  │ Yes, that's OK   │  │
   │  └────────────┘  └──────────────────┘  │
   └────────────────────────────────────────┘
```

If Margaret declines or doesn't respond within 60s, Sarah sees: "Margaret is busy. She'll see your request when she has a moment."

### 5.2 Sarah's watch view

```
┌──────────────────────────────────────────────┐
│  ◉ Watching Margaret · live          ✕ Stop  │  Top bar
│  ─────────── connection good ──────────      │  Persistent live indicator
├──────────────────────────────────────────────┤  Stop ends watch session
│                                              │  immediately
│   ┌──┐ Hello Margaret! What...               │
│   │PC│                                       │
│   └──┘                                       │  Read-only chat,
│                                              │  same layout, but bubbles
│              ┌─────────────────┐             │  are slightly desaturated
│              │ How do I send   │             │  (hint that it's Margaret's
│              │ an attachment?  │             │  chat, not Sarah's)
│              └─────────────────┘             │
│                                              │
│   ┌──┐ Great question, Margaret!             │
│   │PC│ Here's a guide:                       │
│   └──┘                                       │  Sarah can also tap
│                                              │  artifact cards to preview
│                                              │  — opens read-only guide
│                                              │  viewer (same as D3 but no
│                                              │  Run/Next buttons)
│                                              │
│   [PC Pal is thinking...]                    │
│                                              │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌────┐     │  ← NUDGE BAR
│  │ Send a quiet note to Mom...│  │ 📤 │     │     Sarah's input
│  └────────────────────────────┘  └────┘     │     Sends a side message
│  [ 📞 Call her ]   [ 🛠 Take over briefly ]  │     visible only to Margaret,
│                                              │     not in the AI's context
│                                              │     ("Mom, that's a scam.
│                                              │      Hang up.")
└──────────────────────────────────────────────┘
                                                
                                               In Margaret's UI, nudges
                                               appear as a distinct bubble:
                                               
                                               ┌──┐ 💬 From Sarah
                                               │SA│  ┌──────────────┐
                                               └──┘  │ "That sounds │
                                                     │  like a scam."│
                                                     └──────────────┘
                                               bg: helper-soft
                                               border: 1px helper
```

**Take-over briefly:** Pauses Margaret's keyboard, replaces input area with "Sarah is helping... [ Stop ]" banner. Sarah's input goes directly into the chat as if Margaret typed it — but is labelled in the transcript as "From Sarah." Maximum 5 minutes; auto-releases.

### 5.3 Margaret's watch indicator

While being watched, Margaret sees a persistent banner at the bottom of her chat (above input area):

```
┌──────────────────────────────────────────────┐
│ ◉ Sarah is watching · she sees what you see  │  56px tall
│                              [ Stop sharing ]│  bg: helper-soft
└──────────────────────────────────────────────┘  text 16px helper
                                                   button 48px ghost
                                                   "Stop sharing" → revokes
                                                   permission immediately
```

Margaret can stop the watch at any moment. No friction.

---

## 6. Video Call

WebRTC-based, full-screen on phone. Designed so a 72-year-old can answer with one tap and a 45-year-old can run it during a busy morning.

### 6.1 Incoming call (Margaret receiving)

```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │  Full-screen overlay,
│                                              │  bypasses tab bar
│              ┌────────┐                      │
│              │   SA   │                      │  Avatar 160×160
│              │        │                      │  primary-soft circle
│              └────────┘                      │
│                                              │
│            Sarah is calling                  │  H1 32px bold
│                                              │
│           Your daughter                      │  Subtitle 20px text-2
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│        ┌─────────┐    ┌─────────┐            │  Two enormous buttons
│        │   📞    │    │   ❌    │            │  96×96 circles
│        │ Answer  │    │ Decline │            │  Answer: success bg
│        └─────────┘    └─────────┘            │  Decline: danger bg
│         (large green)  (large red)            │  Labels 20px below
│                                              │
│           Slide ▾ for message                │  Optional: drag down
│                                              │  to send canned reply
└──────────────────────────────────────────────┘
```

### 6.2 In-call (both ends)

```
┌──────────────────────────────────────────────┐
│  Sarah                          12:34         │  Top bar 56px
│                                              │  Auto-hides after 3s,
├──────────────────────────────────────────────┤  re-shows on tap
│                                              │
│                                              │
│            [Sarah's video feed]              │  Main feed
│             full-bleed                        │  black bg if no video
│                                              │
│                                              │
│                                              │  ┌──────────┐
│                                              │  │self preview│
│                                              │  │ 96×128   │
│                                              │  └──────────┘
│                                              │  bottom-right
│                                              │  16px from edges
│                                              │  drag to reposition
│                                              │  (snaps to corners)
├──────────────────────────────────────────────┤
│                                              │
│   ┌──┐    ┌──┐    ┌──┐    ┌──┐    ┌──┐      │  Bottom control bar
│   │🎤│    │📹│    │🔊│    │💬│    │❌│      │  72×72 each, 16px gap
│   └──┘    └──┘    └──┘    └──┘    └──┘      │  bg: rgba(0,0,0,0.5)
│   Mute   Camera  Speaker  Chat   End         │  All white icons
│                                              │  Labels 14px below
│                                              │  End button: red bg
│                                              │  (always one-tap end)
└──────────────────────────────────────────────┘  
```

**On Sarah's end (helper):** Same UI plus a "Run diagnostic" button next to Chat that reveals the Tools tab in a sliding panel without ending the call.

### 6.3 Connection states

| State | Visual |
|---|---|
| Connecting | Spinning ring around avatar, "Connecting..." text |
| Bad connection | Yellow banner top: "Connection is poor — your video may freeze. [ Switch to audio only ]" |
| Reconnecting | Banner: "Trying to reconnect..." with countdown |
| Failed | Full-screen friendly error: "Couldn't connect. [ Try again ] [ Send a message instead ]" |

### 6.4 Accessibility

- All five control buttons have proper `aria-label`s
- "End" button is the largest (96×96) and red — discoverable in panic
- Captions toggle (TTS read-back of helper's speech) available in 💬 menu — uses browser SpeechRecognition where supported
- `prefers-reduced-motion`: self-preview drag snap is instant; control bar appears/disappears without slide

---

## 7. Tools Tab — Remote Diagnostic Terminal

Sarah's window into Margaret's computer. Read-only by default; destructive commands require Margaret's explicit on-screen approval.

### 7.1 Tools tab landing (no active session)

```
┌──────────────────────────────────────────────┐
│  ◉ Helper mode    Margaret               ⋯  │
├──────────────────────────────────────────────┤
│                                              │
│              ┌──────┐                        │
│              │  🛠   │                        │
│              └──────┘                        │
│                                              │
│         Tools need a session                 │  Empty state
│                                              │
│   To run anything on Margaret's computer,    │
│   you'll need to be in a session with her.   │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  📞  Call Margaret                      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  👀  Ask to watch her chat              │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### 7.2 Tools tab during active session

```
┌──────────────────────────────────────────────┐
│  ◉ Active session · Margaret           ⋯    │  Top bar shows active state
│  ─────────── connection good ──────────      │
├──────────────────────────────────────────────┤
│  RUN A QUICK CHECK                           │  Section header
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │  Quick-action grid
│  │ 🔋      │ │ 💾      │ │ 📶      │        │  56×56 each + label
│  │ Battery │ │ Disk    │ │ Wi-Fi   │        │  bg: surface-2
│  └─────────┘ └─────────┘ └─────────┘        │  primary text on tap
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ 🧠      │ │ 🌡       │ │ 📋      │        │
│  │ Memory  │ │ Temp    │ │Processes│        │
│  └─────────┘ └─────────┘ └─────────┘        │
│                                              │
│  CUSTOM COMMAND                              │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ $ _                                    │ │  Terminal input
│  └────────────────────────────────────────┘ │  Monospace 16px
│                                              │  bg: #1A202C
│  [ ▶ Run on Margaret's computer ]           │  text: #F7FAFC
│                                              │
│  HISTORY                                     │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ $ df -h                              ✓  │ │  Result cards
│  │ Filesystem 487G total · 312G used      │ │  collapsible
│  │ ~64% full                              │ │  ✓ green = succeeded
│  │                              ▼ Details  │ │  ✗ red = failed
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ $ system_profiler SPBatteryDataType  ✓ │ │
│  │ Battery: 87% capacity · Cycle 142     │ │
│  │                              ▼ Details │ │
│  └────────────────────────────────────────┘ │
│                                              │
├──────────────────────────────────────────────┤
│   🏠         🎬         🛠●        👤        │
└──────────────────────────────────────────────┘
```

### 7.3 Destructive command flow

If Sarah types or selects a command flagged destructive (rm, sudo, write operations), running it triggers a blocking modal on Margaret's screen:

```
   In Margaret's UI:
   
   ┌────────────────────────────────────────┐
   │  ⚠️  Sarah wants to run something       │
   │                                        │
   │  This command:                         │
   │  ┌──────────────────────────────────┐ │
   │  │ rm -rf ~/Downloads/*.dmg         │ │
   │  └──────────────────────────────────┘ │
   │                                        │
   │  Sarah says:                           │
   │  "I'm cleaning up old install files."  │
   │                                        │
   │  Is this OK?                           │
   │                                        │
   │  ┌────────────┐  ┌──────────────────┐ │
   │  │ No, cancel │  │ Yes, go ahead    │ │
   │  └────────────┘  └──────────────────┘ │
   │                                        │
   │  This cannot be undone.                │
   └────────────────────────────────────────┘
```

Sarah's terminal shows "Waiting for Margaret to approve..." until Margaret responds. Auto-cancel after 60s of no response.

### 7.4 Read-only by default

Non-destructive commands (df, ps, system_profiler, ping, etc.) execute without Margaret's per-command approval — but Margaret sees a non-blocking notification slide in: "Sarah just checked your battery." Tappable for details.

---

## 8. Help Request — Notification & Detail

When Margaret sends a question to Sarah (from the Helper tab in her UI), Sarah gets a push notification.

### 8.1 Push notification

```
   PC Pal                                  now
   ❓ Margaret has a question
   "How do I add an attachment to email?"
```

### 8.2 In-app: Sarah's home shows it (already specced in §2)

### 8.3 Detail view (when tapped from notification or home)

```
┌──────────────────────────────────────────────┐
│  ◀                                           │
├──────────────────────────────────────────────┤
│                                              │
│   ┌──┐                                        │
│   │MA│  Margaret asked, 1 hour ago            │
│   └──┘                                        │
│                                              │
│   ┌──────────────────────────────────────┐  │
│   │ "How do I add an attachment? I want  │  │
│   │  to send a picture to my accountant."│  │
│   └──────────────────────────────────────┘  │
│                                              │
│   What was happening                         │
│                                              │
│   Margaret was chatting with PC about         │  Auto-summary
│   sending email. PC offered a guide but       │  generated by AI
│   she got stuck on Step 3.                    │  to give Sarah context
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ▸ See what Margaret saw                │ │  Tap → opens read-only
│  └────────────────────────────────────────┘ │  guide viewer at Step 3
│                                              │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐│
│ │  Reply to Margaret  ▶                     ││
│ └──────────────────────────────────────────┘│
│                                              │
│ [ Suggest she watch a video ]   [ Call her ] │
└──────────────────────────────────────────────┘
```

---

## 9. Helper "Me" Tab

Smaller surface than Margaret's Me tab. Helper-specific settings.

```
┌──────────────────────────────────────────────┐
│  ◉ Helper mode                          ⋯   │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐ │
│  │  ┌──┐                                   │ │
│  │  │SA│  Sarah                            │ │
│  │  └──┘  Helper for Margaret              │ │
│  │                                         │ │
│  │  [ Edit my profile ]                    │ │
│  └────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  Who I help                                  │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  ┌──┐  Margaret                  ●     │ │  Connected learner
│  │  │MA│  Mom · since March 2025          │ │
│  │  └──┘  Tap to manage             ▸     │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  + Help someone else                    │ │
│  └────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  🔔 Notification settings                ▸  │
│  🌙 Quiet hours                          ▸  │  Don't get pinged 10pm-7am
│  🔤 Make text bigger                     ▸  │
│  ⚙  All settings                         ▸  │
│  ❓ How to be a good helper              ▸  │  Onboarding-style guide
│                                              │  for helpers
├──────────────────────────────────────────────┤
│   🏠         🎬         🛠         👤        │
└──────────────────────────────────────────────┘
```

**Manage Margaret screen** (from tapping her card) lets Sarah:
- See pairing date and rotate the buddy code
- Toggle which permissions she has (watch, call, run commands, see alerts)
- Unpair (with confirmation modal)

---

## 10. Pairing Flow — Sarah Joining Margaret

When Margaret has generated a code and shared it with Sarah, Sarah taps the share link or enters the code:

```
┌──────────────────────────────────────────────┐
│  ◀                                           │
├──────────────────────────────────────────────┤
│              ┌────────┐                      │
│              │   👥   │                      │
│              └────────┘                      │
│                                              │
│        Become a helper                       │  H1 28px
│                                              │
│   Enter the code Margaret shared with you.   │  Body 18px
│                                              │
│  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐   │  Code input — 6 boxes
│  │ A │  │ 4 │  │ K │  │ 9 │  │ 2 │  │ P │   │  Each 56×56
│  └───┘  └───┘  └───┘  └───┘  └───┘  └───┘   │  Auto-advance on type
│                                              │  Backspace goes back
│                                              │  Paste fills all six
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │  Connect with Margaret  ▶                 ││
│ └──────────────────────────────────────────┘│
│                                              │
│ [ I don't have a code yet ]                  │  → instruction screen on
│                                              │     how to ask the learner
│                                              │     to generate one
└──────────────────────────────────────────────┘
```

After successful pairing:
1. Sarah lands on Helper home with Margaret already loaded.
2. Margaret gets a notification: "Sarah is now your helper. [ See what she can do ]"
3. Both sides see a celebratory banner for 24h.

---

## 11. Cross-Cutting Helper Behaviors

### 11.1 Privacy guardrails (always)

- Sarah **cannot** see Margaret's profile data (name preferences, AI memory, billing) without explicit per-item permission.
- Sarah **cannot** see chats from before the pairing date unless Margaret enables "share history."
- Sarah **cannot** initiate a watch session without Margaret's per-session approval.
- Sarah **cannot** end a chat or delete anything in Margaret's account.
- All Sarah's actions are logged in Margaret's audit timeline (visible in Margaret's Me → "What Sarah has done").

### 11.2 Notification matrix

| Event | Margaret receives | Sarah receives |
|---|---|---|
| Sarah requests to watch | Modal with Approve/Decline | "Waiting for Margaret..." inline |
| Margaret asks a question | Confirmation toast | Push notification |
| Sarah replies to a question | Welcome banner + chat insert | Confirmation toast |
| Sarah calls | Incoming call screen | Outgoing call screen |
| Safety alert in Margaret's chat | Inline banner (per D2 §3.2) | Push notification (high priority) |
| Margaret completes a skill | Optional celebration toast | Optional progress notification |
| Sarah runs a non-destructive command | Slide-in toast | Inline result |
| Sarah requests destructive command | Blocking modal | "Waiting..." indicator |

All notifications respect quiet hours per role.

### 11.3 Multi-helper case

Margaret can have up to 3 helpers. Each sees their own dashboard. Helpers don't see each other's actions but do see "Sarah replied" attribution on shared timeline. The first helper has no special status.

### 11.4 Reduced motion / accessibility

All helper UI inherits learner-side accessibility tokens. Specific helper considerations:
- Live indicators (the "● connection good" pill) flash 2x per minute by default; reduced motion replaces flash with a static dot.
- Self-preview in video call is draggable; alternative keyboard focus + arrow keys to reposition.
- Quick-action grid in Tools is keyboard-navigable in 2D (arrow keys move grid).

---

## 12. Open Questions Resolved by Best Judgment

(per your direction to use judgment from here on)

| Question | Decision | Rationale |
|---|---|---|
| Helper accent color | New `--color-helper` (cooler blue, darker than primary) | Distinct enough that role is unambiguous, related enough to feel same-app |
| Self-preview window in video call | Draggable, snaps to 4 corners, default bottom-right | Familiar from FaceTime; corner-snap prevents accidental dismissal |
| Multi-learner case | Top bar dropdown switcher | Explicit, never-hidden; no surprise context switches |
| Helper take-over time limit | 5 minutes auto-release | Long enough to actually help, short enough that Margaret regains autonomy quickly |
| Audit log location | Margaret's Me tab → "What Sarah has done" | Margaret-controlled, transparent, not buried |
| Quiet hours default | 22:00–07:00 learner-local | Standard sleep window; helpers see "sleeping" state |
| Read-only diagnostic notifications | Non-blocking slide-in toast | Visible but not interrupting; tappable for details |

Deliverables 6–8 follow.
