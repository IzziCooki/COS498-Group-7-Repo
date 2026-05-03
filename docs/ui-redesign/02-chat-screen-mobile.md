# PC Pal — Deliverable 2: Chat Screen (Mobile)

> **Scope:** The single most important screen. Every pixel value, color token, and interaction documented. Tokens are tentative pending Deliverable 7; treat them as the working contract until then.

---

## 1. Tentative Design Tokens (used throughout this spec)

```
TYPOGRAPHY
  --font-size-xs    14px   (timestamps, tab tooltips on long-press)
  --font-size-sm    16px   (secondary subtitles, helper text)
  --font-size-base  18px   (BODY MINIMUM — all conversational text)
  --font-size-md    20px   (input field, primary buttons)
  --font-size-lg    24px   (screen titles, AI greetings)
  --font-size-xl    28px   (hero / safety banner first line)
  --line-height-body 1.45
  --font-weight-regular 400
  --font-weight-medium  500
  --font-weight-bold    600

SPACING (8px-based scale)
  --space-1   4px
  --space-2   8px
  --space-3   12px
  --space-4   16px
  --space-5   24px
  --space-6   32px
  --space-7   48px
  --space-8   64px

TOUCH TARGETS
  --tap-min        48px   (absolute minimum, secondary actions)
  --tap-primary    56px   (primary buttons, send, tab icons inside bar)
  --tap-bar        64px   (full bottom tab bar height + safe-area)

RADIUS
  --radius-sm   8px
  --radius-md   12px
  --radius-lg   16px   (message bubbles)
  --radius-xl   24px   (input pill, primary buttons)
  --radius-pill 9999px

COLORS (working palette — finalized in D7)
  --color-primary       #2B6CB0   (AAA on white, calm institutional blue)
  --color-primary-text  #FFFFFF
  --color-surface       #FFFFFF
  --color-surface-2     #F7FAFC   (chat thread background, artifact card)
  --color-surface-3     #EDF2F7   (input recess)
  --color-text-1        #1A202C   (AAA primary)
  --color-text-2        #4A5568   (timestamps, helper text)
  --color-text-3        #718096   (placeholders, disabled)
  --color-border        #E2E8F0
  --color-success       #2F855A
  --color-warning       #C05621
  --color-danger        #C53030
  --color-danger-bg     #FED7D7
  --color-danger-text   #742A2A
  --color-focus         #3182CE   (focus ring)

SHADOWS
  --shadow-card    0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)
  --shadow-input   0 -1px 0 var(--color-border)   (top-edge only)
  --shadow-overlay 0 8px 24px rgba(0,0,0,.12)

MOTION
  --duration-quick   120ms
  --duration-base    200ms
  --duration-slow    320ms
  --easing           cubic-bezier(0.2, 0, 0, 1)
  /* All durations → 0ms when prefers-reduced-motion: reduce */
```

---

## 2. Default Chat State — Annotated Wireframe

```
                                                  ↓ status bar (env-safe)
┌──────────────────────────────────────────────┐   
│  Chat with PC                          ⋯     │  ← TOP BAR
├──────────────────────────────────────────────┤     56px tall
│                                              │     Title: 20px medium, text-1
│  ┌──┐                                        │     ⋯ btn: 48×48, 4px right
│  │PC│ ┌────────────────────────────┐         │     No back arrow on root chat
│  └──┘ │ Hello Margaret! What can   │         │
│       │ I help you with today?     │         │  ← AI MESSAGE
│       └────────────────────────────┘         │     Avatar: 32×32 circle
│       8:42 AM                                │     bg primary-soft, "PC" 14px
│                                              │     Bubble:
│                                              │       bg: surface
│                                              │       border: 1px border
│                            ┌──────────────┐  │       radius: 16px
│                            │ How do I     │  │       padding: 12px 16px
│                            │ video call   │  │       text: 18px text-1
│                            │ Anna?        │  │       max-width: 75% viewport
│                            └──────────────┘  │     Timestamp: 14px text-2
│                            8:42 AM           │       4px gap below bubble
│                                              │
│  ┌──┐                                        │  ← USER MESSAGE
│  │PC│ ┌────────────────────────────┐         │     Right-aligned, 16px right
│  └──┘ │ Great question! Here's a   │         │     No avatar
│       │ guide just for you:        │         │     Bubble:
│       └────────────────────────────┘         │       bg: primary
│                                              │       text: primary-text 18px
│       ┌──────────────────────────────┐       │       radius: 16px
│       │ ┌──┐                          │       │
│       │ │📖│ Video Calling on Mac     │       │  ← ARTIFACT CARD (inline)
│       │ └──┘ 4 steps · 2 minutes      │       │     Width: matches AI bubble (75%)
│       │      Tap to open it         ▸ │       │     bg: surface-2
│       └──────────────────────────────┘       │     border: 1px border
│                                              │     radius: 12px
│                                              │     padding: 16px
│  ┌──┐  ●●●                                   │     min-height: 80px
│  │PC│                                        │     Icon: 40×40 circle bg
│  └──┘                                        │       primary-soft, emoji 24px
│                                              │     Title: 18px medium text-1
│                                              │     Meta: 16px text-2 (1 line)
│                                              │     Action hint: 16px text-2
│                                              │     Chevron: 20px text-3 right
│                                              │     Hover/active: surface-3 bg
│                                              │       2px primary border
│                                              │
├──────────────────────────────────────────────┤  ← TYPING INDICATOR
│ ┌──────────────────────────┐  ┌──────┐       │     Same row layout as AI msg
│ │ Type your question...    │  │  ↑   │       │     3 dots 8px, #4A5568
│ │                          │  │      │       │     Bounce anim 1.4s loop
│ └──────────────────────────┘  └──────┘       │     prefers-reduced-motion:
│                                              │       text "PC is thinking..."
│ ┌──────────────────────────────────────┐    │
│ │  + Get Help                          │    │  ← INPUT AREA (sticky bottom)
│ └──────────────────────────────────────┘    │     bg: surface
├──────────────────────────────────────────────┤     border-top: 1px border
│                                              │     padding: 12px 16px
│   💬          📚          👤                 │     Textarea:
│                                              │       min-height: 56px
└──────────────────────────────────────────────┘     max-height: 5 lines, then
                                                       internal scroll
                                                     bg: surface-3
                                                     radius: 24px (pill)
                                                     padding: 14px 20px
                                                     font: 20px text-1
                                                     placeholder: 20px text-3
                                                     focus: 3px focus ring
                                                   Send btn:
                                                     56×56 circle
                                                     bg: primary
                                                     icon: ↑ 24px white
                                                     12px gap from textarea
                                                     disabled state:
                                                       bg surface-3, icon text-3
                                                   Get Help btn:
                                                     full-width below input
                                                     8px top margin
                                                     48px tall
                                                     ghost style:
                                                       bg transparent
                                                       border: 1px border
                                                       text: 18px primary
                                                       radius: 24px
                                                   
                                                   BOTTOM TAB BAR
                                                     64px + safe-area-inset
                                                     bg: surface
                                                     border-top: 1px border
                                                     3 tabs equal flex
                                                     Each tab:
                                                       56×56 hit target
                                                       icon 32×32 centered
                                                       NO label
                                                       aria-label required
                                                     Active state:
                                                       filled icon variant
                                                       color: primary
                                                       (no underline / pill)
                                                     Inactive:
                                                       outline icon
                                                       color: text-2
                                                     Long-press → tooltip
                                                       shows label 14px
```

### Z-order on this screen (back to front)
1. Chat thread (scrollable)
2. Sticky top bar
3. Sticky input area
4. Bottom tab bar
5. Safety alert banner (when active — pushes everything below it)
6. ⋯ menu sheet
7. Long-press contextual sheet
8. Full-screen overlays (artifact, video call, practice)

---

## 3. State Variations

### 3.1 Empty state — first message in a new chat

```
┌──────────────────────────────────────────────┐
│  New chat                              ⋯     │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│                                              │
│              ┌──────┐                        │  Friendly illustration
│              │  PC  │                        │  120×120, primary-soft circle
│              └──────┘                        │
│                                              │
│         Hi, I'm PC Pal                       │  24px lg, text-1, centered
│                                              │
│      Ask me anything about                   │  18px base, text-2, centered
│      your computer.                          │  max 32ch, line height 1.5
│                                              │
│                                              │
│      Some things you can ask:                │  16px sm, text-2
│                                              │
│   ┌──────────────────────────────────────┐  │
│   │ 💌  How do I send an email?          │  │  Suggestion chips
│   └──────────────────────────────────────┘  │  Each 56px tall, full-width
│                                              │  bg: surface-2
│   ┌──────────────────────────────────────┐  │  border: 1px border
│   │ 📞  How do I video call my family?   │  │  radius: 12px
│   └──────────────────────────────────────┘  │  padding: 12px 16px
│                                              │  text: 18px text-1
│   ┌──────────────────────────────────────┐  │  emoji: 24px, 12px gap
│   │ 📷  How do I find my photos?         │  │  Tap → fills textarea +
│   └──────────────────────────────────────┘  │     submits immediately
│                                              │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────┐  ┌──────┐       │
│ │ Type your question...    │  │  ↑   │       │
│ └──────────────────────────┘  └──────┘       │
│ [ + Get Help ]                                │
├──────────────────────────────────────────────┤
│   💬          📚          👤                 │
└──────────────────────────────────────────────┘
```

Suggestion chips are personalized based on onboarding (device type, comfort level, stated goal). Always 3 chips, never more — choice paralysis is a known issue with this cohort.

### 3.2 With safety alert banner

```
┌──────────────────────────────────────────────┐
│  Chat with PC                          ⋯     │  Top bar unchanged
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │  ← SAFETY BANNER
│ │ 🚨  This sounds like a scam              │ │     Sticky just below top bar
│ │                                          │ │     bg: danger-bg
│ │     Don't give them any information      │ │     border-left: 4px danger
│ │     or money. I can help.                │ │     padding: 16px
│ │                                          │ │     First line:
│ │  ┌────────────────────────────┐  ┌──┐   │ │       28px bold danger-text
│ │  │ Tell me what to do         │  │ ✕│   │ │     Body: 18px danger-text
│ │  └────────────────────────────┘  └──┘   │ │     Action btn:
│ └──────────────────────────────────────────┘ │       bg danger, white text
├──────────────────────────────────────────────┤       56px tall, radius 12px
│                                              │     Dismiss btn:
│  ┌──┐ ┌────────────────────────────┐         │       48×48, ghost
│  │PC│ │ Margaret, before you do      │         │       requires explicit tap
│  └──┘ │ anything else, please...     │         │     The banner does NOT
│       └────────────────────────────┘         │       collapse from scroll
│       8:55 AM                                │     Cannot be tap-outside
│                                              │       dismissed
│                                              │     Stays until user taps
│                                              │       primary action OR
│                                              │       dismiss button
└──────────────────────────────────────────────┘
```

### 3.3 With welcome-back banner

```
┌──────────────────────────────────────────────┐
│  Chat with PC                          ⋯     │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐ │  ← WELCOME BACK BANNER
│  │ 👋 Welcome back, Margaret             ✕│ │     bg: primary-soft (#EBF8FF)
│  │                                        │ │     border-left: 4px primary
│  │ Sarah replied to your question about   │ │     radius: 12px
│  │ photos.                                │ │     margin: 12px 16px
│  │                                        │ │     padding: 16px
│  │  ┌────────────────────────┐            │ │     Heading: 18px bold text-1
│  │  │ Read it                │            │ │     Body: 18px text-2
│  │  └────────────────────────┘            │ │     CTA: 48px ghost button
│  └────────────────────────────────────────┘ │     Dismiss: 32×32 ✕ in
│                                              │       top-right
│  ┌──┐ ┌──────────────────┐                  │     This banner SCROLLS with
│  │PC│ │ Welcome back!    │                  │       the thread (not sticky)
│  └──┘ └──────────────────┘                  │     Up to 3 banners can stack
│                                              │       (skill review, helper
│                                              │        reply, milestone)
└──────────────────────────────────────────────┘
```

### 3.4 Multiple artifact types in thread

All artifacts use the same card chassis — only icon, title, and meta change.

```
┌──────────────────────────────────────────────┐
│       ┌──────────────────────────────┐       │
│       │ ┌──┐  Video Calling on Mac   │       │  GUIDE
│       │ │📖│  4 steps · 2 minutes    │       │  Icon: 📖
│       │ └──┘  Tap to open         ▸  │       │  Bg: surface-2
│       └──────────────────────────────┘       │
│                                              │
│       ┌──────────────────────────────┐       │
│       │ ┌──┐  Battery Health         │       │  DIAGNOSTIC FINDING
│       │ │💚│  All good · checked now │       │  Icon: status emoji
│       │ └──┘  Tap to see details  ▸  │       │       (💚 / 💛 / ❤️)
│       └──────────────────────────────┘       │  Status color in border-left
│                                              │       4px (success/warning/
│                                              │        danger)
│       ┌──────────────────────────────┐       │
│       │ ┌──┐  Set up Gmail           │       │  VIDEO TUTORIAL
│       │ │▶ │  3 videos from YouTube  │       │  Icon: ▶ in 40px circle,
│       │ └──┘  Tap to watch        ▸  │       │       bg: red-soft
│       └──────────────────────────────┘       │
│                                              │
│       ┌──────────────────────────────┐       │
│       │ ┌──┐  Help with Wi-Fi        │       │  EXTERNAL RESOURCES
│       │ │🔗│  3 articles, 2 videos   │       │  (Get Help button result)
│       │ └──┘  Tap to browse       ▸  │       │  Icon: 🔗
│       └──────────────────────────────┘       │
│                                              │
│       ┌──────────────────────────────┐       │
│       │ ┌──┐  Practice: Send Email   │       │  PRACTICE INVITE
│       │ │🎯│  Try it safely first    │       │  Icon: 🎯
│       │ └──┘  Tap to start        ▸  │       │  Border: 2px primary dashed
│       └──────────────────────────────┘       │       (signals "different")
│                                              │  This card looks distinct so
│                                              │    Margaret notices the
└──────────────────────────────────────────────┘    "practice" framing
```

---

## 4. Top-Bar `⋯` Menu (full-screen sheet)

Tapping `⋯` opens a bottom sheet (75% viewport height, swipe down or tap-x to dismiss). Contains everything that doesn't earn permanent screen real estate.

```
┌──────────────────────────────────────────────┐
│  ─────                                       │  Sheet drag handle, 32×4
│                                              │
│  ✕                                           │  Close 48×48 top-left
│                                              │
│  Chat options                                │  24px lg text-1
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 🛑  End chat & rate it                 │ │  Each row 64px tall
│  └────────────────────────────────────────┘ │  bg: surface-2
│                                              │  radius: 12px
│  ┌────────────────────────────────────────┐ │  padding: 16px
│  │ 🔊  Read messages aloud           ○    │ │  margin-bottom: 8px
│  └────────────────────────────────────────┘ │  icon 24px, 16px gap, label
│                                              │    18px medium text-1
│  ┌────────────────────────────────────────┐ │  trailing: chevron OR toggle
│  │ 🔤  Make text bigger                ▸  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Other                                       │  Section divider, 16px sm
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ❓  How to use PC Pal               ▸  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ⚙   All settings                    ▸  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 📋  About PC Pal                    ▸  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 👋  Sign out                        ▸  │ │  Tertiary, text-2
│  └────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
```

"End chat & rate it" is intentionally first and most prominent — it's the most common reason to open this menu mid-conversation, and prior usability tests on similar apps show users hunt for it.

---

## 5. Long-Press on a Message — Contextual Sheet

```
┌──────────────────────────────────────────────┐
│  ─────                                       │
│                                              │
│  ┌────────────────────────────────────────┐ │  Selected message echoed
│  │ "How do I video call Anna?"            │ │  at top, dimmed
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 📋  Copy                               │ │  64px row each
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 🔊  Read it aloud                      │ │  TTS playback
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 👥  Send to Sarah                      │ │  Only if helper paired
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ ❓  Explain this differently           │ │  Asks AI to rephrase
│  └────────────────────────────────────────┘ │
│                                              │
│  [ Cancel ]                                  │  48px ghost
└──────────────────────────────────────────────┘
```

Long-press duration: 500ms (longer than mobile default to avoid accidental triggers from arthritic users with tremor).

---

## 6. Send Button States

| State | Visual | Behavior |
|---|---|---|
| Empty textarea | bg surface-3, icon text-3, no shadow | Disabled, `aria-disabled="true"` |
| Has text | bg primary, icon white, shadow-card | Enabled, primary color |
| Sending | bg primary, spinner replaces ↑ | Disabled briefly, returns when AI ack received |
| Error | bg surface, border 2px danger, ↻ icon | Tap retries last message |

The textarea NEVER auto-submits on Enter — Margaret types newlines accidentally. Send is always an explicit button tap.

---

## 7. Get Help Button — Behavior

User taps `+ Get Help` → not a modal. Instead:

1. The button shows a brief inline loading state (spinner replaces "+", text becomes "Looking for help...")
2. The AI is sent an internal prompt: "User wants verified external resources for the current topic. Use search tools (YouTube, Apple Support, Microsoft, Google, wikiHow) and produce an `external_resources` artifact with categories Watch / Read / Try."
3. AI's response appears in the thread as normal, with a Resources artifact card inline.
4. Tapping the card opens the full-screen Resources view (Deliverable 3 sibling — covered briefly in D1).

This means **Get Help has no special UI of its own beyond the button** — it's a shortcut for "ask AI to research this." The AI controls the result.

If there's no current topic (start of chat), Get Help instead inserts "Can you help me find resources for..." into the textarea and focuses it.

---

## 8. Accessibility Annotations

| Element | A11y treatment |
|---|---|
| Top bar title | `<h1>` per screen, announced by screen reader on navigation |
| `⋯` button | `aria-label="More options"`, `aria-haspopup="menu"` |
| Tab bar buttons | `<button role="tab" aria-label="Chat">`, `aria-selected` on active |
| Tab bar | `role="tablist"`, `aria-label="Main sections"` |
| Message bubbles | `role="article"` with `aria-label="Message from PC Pal at 8:42 AM"` |
| Typing indicator | `aria-live="polite"`, text "PC Pal is thinking" (also visible to reduced-motion users) |
| Send button | `aria-label="Send message"`, disabled state announced |
| Get Help button | `aria-label="Ask PC Pal for outside resources"` |
| Artifact card | `role="button"`, full description in `aria-label` ("Open guide: Video Calling on Mac, 4 steps, 2 minutes") |
| Safety banner | `role="alert"`, `aria-live="assertive"` — wakes screen readers immediately |
| Welcome banner | `role="status"`, `aria-live="polite"` |
| Suggestion chips | `<button>` with full text as accessible name |

**Focus order:** Top bar (title-skip-link → ⋯) → message thread (most recent first via "skip to latest" link) → input → Get Help → tab bar.

**Skip links:** Visually hidden until focused: "Skip to input", "Skip to tabs", "Skip to latest message".

---

## 9. Responsive Behavior Inside The Phone Range

| Viewport | Adjustment |
|---|---|
| `<360px` (very small Android, older devices) | Suggestion chips stack to single column with reduced padding (12→8px). Tab icon size 28px. |
| `360–414px` (most phones) | Default spec applies as drawn. |
| `414–639px` (large phones, foldables closed) | Message bubble max-width drops from 75% to 70% to prevent over-long lines. Suggestions get a 4th chip. |
| Landscape orientation | Top bar collapses to 48px. Tab bar is hidden in landscape; replaced with a 56×56 floating tab-switcher button bottom-right (returns to portrait UX on rotation). |

---

## 10. Motion & Reduced Motion

| Animation | Default | `prefers-reduced-motion: reduce` |
|---|---|---|
| New message bubble appears | Fade + slide up 8px, 200ms | Instant appear |
| Typing indicator | Bounce dots, 1.4s loop | Replaced with text "PC Pal is thinking..." |
| Artifact card tap → overlay | Slide up from card position, 320ms | Instant cross-fade |
| Sheet open (`⋯` menu) | Slide up from bottom, 320ms | Instant appear with backdrop fade only |
| Safety banner appear | Slide down + 1px shake to draw eye, 240ms | Instant appear, no shake |
| Send button press | Scale 0.96 then 1.0, 120ms | No scale |
| Tab change | Cross-fade 120ms | No transition |

---

## 11. Open Questions Before Deliverable 3

1. **Avatar style** — current spec shows a 32×32 circle with "PC" text. Should it be a friendly illustrated character instead (consistent persona)? An illustrated mascot may make Margaret feel more at ease, but adds design work and a character to design-review.

2. **Suggestion chips on empty state** — should they use AI to dynamically generate based on Margaret's recent skills/struggles, or be a static list curated to her onboarding answers? Static is simpler; dynamic is more useful but introduces latency on screen open.

3. **"Read messages aloud" toggle** — placement in the `⋯` menu or as a persistent button in the top bar? Some elderly users with vision issues will use TTS for every chat. Top-bar promotes it; menu hides it.

4. **Typing indicator wording for reduced-motion users** — "PC Pal is thinking..." vs "PC Pal is typing..." vs "Just a moment..."? "Thinking" sets a more accurate expectation (AI may be slow on long answers); "typing" is more familiar.

5. **Long-press → "Send to Sarah" option** — should this also work for AI messages (forward an explanation Margaret found helpful), or only on her own messages (forward a question to get a second opinion)? I have it on both currently.

Once these are settled, I'll build **Deliverable 3: Guide Viewer (Mobile)** — the full-screen artifact overlay that Margaret enters when she taps the guide card.
