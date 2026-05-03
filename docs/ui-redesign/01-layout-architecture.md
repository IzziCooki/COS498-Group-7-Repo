# PC Pal — Deliverable 1: Mobile Layout Architecture

> **Scope:** Responsive layout system across phone, tablet, and desktop. Navigation pattern, artifact placement, modal behavior. Feeds Deliverables 2–8.

---

## 1. Navigation Pattern Decision

**Choice: Persistent bottom tab bar on phone, collapsible left rail on tablet/desktop.**

### Why bottom tabs for the 65+ demographic

| Considered | Verdict | Reason |
|---|---|---|
| **Bottom tab bar** | ✅ Chosen | Familiar from WhatsApp, Messages, FaceTime — apps Margaret already knows. Always visible, never hidden. Thumb-reachable. Each tab is a fixed 64px+ target that doesn't move. |
| Hamburger menu | ❌ Rejected | Hidden navigation is the #1 usability failure for elderly users. "Where did the menu go?" is the single most common confusion in usability studies of 65+ cohorts. |
| Swipe drawers | ❌ Rejected as primary | Discoverability problem — gestures aren't visible. Acceptable as *supplementary* (swipe right to peek at conversations), never as the only path. |
| Top tabs | ⚠️ Rejected | Out of thumb reach on modern tall phones; competes with status bar; small targets. |

### Tab structure (role-aware)

**Learner view (Margaret) — 4 tabs:**
```
💬  Chat        Default landing screen
📚  History     Past conversations + skill review
👥  Helper      Buddy status, video call, ask for help
👤  Me          Profile, memory, settings
```

**Helper/Buddy view (Sarah) — 4 tabs:**
```
🏠  Home        Learner dashboard at a glance
🎬  Sessions    Active + recent sessions
🛠   Tools      Remote terminal, video call
👤  Me          Helper profile + settings
```

**Why exactly 4, not 5:** Five tabs makes labels truncate at 18px font on a 360px viewport. Four leaves ~80px per tab, comfortably fitting "History" and "Helper".

### Where everything in the spec lives at each breakpoint

| Feature | Phone | Tablet | Desktop |
|---|---|---|---|
| Chat thread | Tab 1 (full screen) | Right pane | Center pane |
| Conversation list | Tab 2 (full screen) | Left pane (collapsible) | Persistent left rail |
| Step-by-step guide | Full-screen overlay over chat | Right sheet (60% width) | Right artifact panel (480px) |
| Diagnostic findings | Inline card → full-screen overlay | Inline card → right sheet | Inline card → right panel |
| YouTube videos | Inline thumbnail → full-screen player | Inline → right sheet | Inline → right panel |
| External resources | Inline card → full-screen list | Inline → right sheet | Inline → right panel |
| Practice mode | Full-screen takeover | Full-screen takeover | Full-screen takeover (no panels) |
| Safety alert | Sticky top banner (above tab bar content) | Sticky top banner | Sticky top banner |
| Onboarding | Full-screen sheets, 1 step per screen | Centered modal, 1 step | Centered modal, 1 step |
| Buddy video call | Full-screen takeover | Full-screen takeover | Floating window (resizable) |
| Buddy terminal | Tab 3 → "Run diagnostic" | Right sheet | Right panel |
| Connect computer | QR + 6-digit code (phone shows code, computer scans) | Centered modal | Centered modal |
| Welcome back banner | Top of Chat tab, dismissible | Top of chat pane | Top of chat pane |
| Admin feedback dashboard | Single-column scroll | Two-column | Full table view |

---

## 2. Phone Layout (`<640px`) — ASCII Wireframes

### 2.1 Chat tab (default landing)

```
┌─────────────────────────────────┐
│ ◀  Chat with PC          ⋯     │  56px top bar
│    [end chat / settings shortcut]│  back arrow only if drilled in
├─────────────────────────────────┤
│ 🚨 I think this might be a scam │  Safety banner (when active)
│    Don't give them any info.    │  full-width, red, dismiss-protected
│    [ Tell me more ]             │  44–56px tall, sticky below top bar
├─────────────────────────────────┤
│                                 │
│ ┌──┐                            │
│ │PC│ Hello Margaret! What       │  AI message
│ └──┘ would you like help with   │  white card, left-aligned
│      today?                     │  18px text, 12px padding
│                                 │
│                ┌─────────────┐  │  User message
│                │ How do I    │  │  blue card, right-aligned
│                │ video call  │  │  white text, 18px
│                │ my grand-   │  │
│                │ daughter?   │  │
│                └─────────────┘  │
│                                 │
│ ┌──┐                            │
│ │PC│ Great question! I made     │
│ └──┘ you a guide:               │
│      ┌─────────────────────┐   │  Artifact card (inline)
│      │ 📖 Video Calling on  │   │  60–80px tall
│      │    FaceTime          │   │  full chat-width
│      │ 4 steps · Tap to open│   │  tap → full-screen overlay
│      └─────────────────────┘   │
│                                 │
│ ┌──┐ ● ● ●                      │  Typing indicator
│ └──┘                            │  3 dots, animated (respects
│                                 │   prefers-reduced-motion)
├─────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─┐│  Input area (sticky bottom,
│ │ Type your question...   │ │↑││   above tab bar)
│ └─────────────────────────┘ └─┘│  textarea 56px min height
│ [ + Get Help ]                  │  send btn 56×56
├─────────────────────────────────┤  secondary action below
│  💬     📚     👥     👤       │  Bottom tab bar
│  Chat  History Helper  Me       │  72px tall (icon 32 + label 18 + pad)
└─────────────────────────────────┘  active tab: filled icon + color
```

**Annotations:**
- **Top bar** is contextual: shows "Chat with PC" by default; back arrow appears when drilled into an artifact or sub-screen.
- **Safety banner** is the *only* element that can push the chat thread down. Cannot be dismissed by tapping outside; requires explicit action.
- **Artifact cards** in the message stream are 80px tall preview tiles. Tap → full-screen overlay (Deliverable 3).
- **Input area** never scrolls away. Send button is 56×56, never relies on the keyboard "return" key alone.
- **Tab bar** stays visible in chat. Hides during full-screen overlays (guide, video call, practice mode) so the user knows they're in a focused mode.

### 2.2 History tab

```
┌─────────────────────────────────┐
│ My Conversations                │  Top bar: title only, no back
├─────────────────────────────────┤
│ 🔍 Search conversations         │  Search input (sticky)
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ + Start a new chat          │ │  Big primary button
│ └─────────────────────────────┘ │  60px tall, full width
├─────────────────────────────────┤
│ TODAY                           │  Section header (small caps, gray)
│ ┌─────────────────────────────┐ │
│ │ 📧 Setting up email          │ │  Conversation card
│ │ "I learned how to..."        │ │  72px tall
│ │ 2 hours ago · ⭐⭐⭐⭐⭐       │ │  preview + date + rating
│ └─────────────────────────────┘ │
│                                 │
│ YESTERDAY                       │
│ ┌─────────────────────────────┐ │
│ │ 📶 Connecting to wifi        │ │
│ │ "The password was..."        │ │
│ │ Yesterday · ⭐⭐⭐⭐          │ │
│ └─────────────────────────────┘ │
│                                 │
│ THIS WEEK                       │
│ ┌─────────────────────────────┐ │
│ │ 📷 Sharing photos            │ │
│ │ Mon · ⭐⭐⭐⭐⭐               │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  💬     📚     👥     👤       │
└─────────────────────────────────┘
```

**Notes:** Conversations grouped by date proximity (Today / Yesterday / This Week / Earlier) — feels like a photo album. Long-press a card → contextual sheet (rename, delete with confirmation, share with helper).

### 2.3 Helper tab (learner view)

```
┌─────────────────────────────────┐
│ My Helper                       │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │  ┌──┐                        │ │  Helper card
│ │  │SK│  Sarah                 │ │  120px tall
│ │  └──┘  Connected · seen 2m   │ │  large avatar, status,
│ │                              │ │  obvious "she's there" cue
│ │  ┌────────┐  ┌─────────────┐ │ │
│ │  │ 📞 Call │  │ ✉ Send msg  │ │ │  Two primary actions
│ │  └────────┘  └─────────────┘ │ │  56px tall each
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ ❓ Ask Sarah for help         │ │  Help request CTA
│ │    Send a question and she   │ │
│ │    will reply when she can   │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ RECENT FROM SARAH               │
│ ┌─────────────────────────────┐ │
│ │ "Hi Mom! I'm proud of you   │ │  Helper messages
│ │  for figuring out email."   │ │  appear like postcards
│ │  Yesterday · ❤️ Reply        │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [ Add another helper ]          │  Tertiary, small
├─────────────────────────────────┤
│  💬     📚     👥●    👤       │  Dot on Helper tab
└─────────────────────────────────┘  when there's an unread message
```

**If no helper paired:**
```
┌─────────────────────────────────┐
│ My Helper                       │
├─────────────────────────────────┤
│                                 │
│         ┌────┐                  │
│         │ 👥 │                  │  Empty state illustration
│         └────┘                  │
│                                 │
│   Connect a helper              │  Big friendly heading
│                                 │
│   A helper is someone in your   │  Plain-language explanation
│   family or a friend who can    │  18px, max 4 lines
│   help you when you get stuck.  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Get a code to share          │ │  Primary action 56px
│ └─────────────────────────────┘ │
│                                 │
│   No helper? That's OK.         │  Reassurance
│   PC Pal works fine without     │
│   one.                          │
│                                 │
├─────────────────────────────────┤
│  💬     📚     👥     👤       │
└─────────────────────────────────┘
```

### 2.4 Me tab

```
┌─────────────────────────────────┐
│ Me                              │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │  ┌──┐                        │ │  Profile card
│ │  │MA│  Margaret               │ │  tap to edit
│ │  └──┘  Mac · Just learning   │ │
│ │                              │ │
│ │  [ Change my details ]       │ │  56px button
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 🧠 What PC Pal remembers     ›  │  Row, 56px, tap to view
├─────────────────────────────────┤
│ 🔤 Make text bigger          ›  │  Quick accessibility shortcut
├─────────────────────────────────┤
│ 🎨 Light or dark           ›    │
├─────────────────────────────────┤
│ 🔊 Read messages aloud      ○   │  Toggle inline
├─────────────────────────────────┤
│ ⚙ All settings              ›   │
├─────────────────────────────────┤
│ ❓ How to use PC Pal        ›   │
├─────────────────────────────────┤
│ 📋 About PC Pal             ›   │
├─────────────────────────────────┤
│  💬     📚     👥     👤       │
└─────────────────────────────────┘
```

### 2.5 Modal patterns on phone

All modals are **full-screen sheets** that slide up from the bottom — no centered dialogs (too small for 18px text + 56px buttons on a 360px viewport).

```
┌─────────────────────────────────┐
│  ✕                              │  Close in top-left, 48×48
│                                 │  (top-right reserved for primary action)
│  How was your chat?             │  H2, 24px, friendly
│                                 │
│  Tap the stars to rate it.      │  Body, 18px
│                                 │
│   ⭐  ⭐  ⭐  ⭐  ⭐            │  Stars 56×56 each
│                                 │  generous spacing
│  ┌─────────────────────────┐   │
│  │ Anything else? (optional)│  │  Optional textarea
│  │                          │  │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Send                     │  │  Primary 56px
│  └─────────────────────────┘   │
│                                 │
│  [ Skip ]                       │  Tertiary text button
└─────────────────────────────────┘
```

---

## 3. Tablet Layout (640–1024px) — ASCII Wireframes

### 3.1 Chat default state

```
┌─────────────────────────────────────────────────────────────┐
│  ☰   PC Pal                                  Margaret  ⚙   │  64px top bar
├──────────────┬──────────────────────────────────────────────┤
│              │ 🚨 SAFETY ALERT (when active)                │
│  CHATS       ├──────────────────────────────────────────────┤
│              │                                              │
│  + New chat  │   ┌──┐                                       │
│              │   │PC│ Hello Margaret!                       │
│  ▸ Email     │   └──┘                                       │
│    today  ●  │                                              │
│              │              ┌──────────────────┐            │
│  ▸ Wifi      │              │ How do I video   │            │
│    yesterday │              │ call Anna?       │            │
│              │              └──────────────────┘            │
│  ▸ Photos    │                                              │
│    Mon       │   ┌──┐                                       │
│              │   │PC│ Here's a guide:                       │
│  ─────       │   └──┘ ┌──────────────────────────┐          │
│  HELPER      │        │ 📖 Video Calling · 4 steps│          │
│  • Sarah     │        └──────────────────────────┘          │
│    online    │                                              │
│              │   [Typing...]                                │
│  ─────       │                                              │
│  TABS        ├──────────────────────────────────────────────┤
│  💬 Chat ●   │  ┌────────────────────────────┐  [↑]         │
│  📚 History  │  │ Type your question...      │              │
│  👥 Helper   │  └────────────────────────────┘              │
│  👤 Me       │  [+ Get Help]                                │
└──────────────┴──────────────────────────────────────────────┘
   240px                       flexible
```

### 3.2 Chat with artifact open

```
┌─────────────────────────────────────────────────────────────┐
│  ☰   PC Pal                                  Margaret  ⚙   │
├──────┬─────────────────────┬────────────────────────────────┤
│      │ Chat (compressed)   │  ◀  Video Calling                │
│ Conv │                     │     Step 2 of 4                │
│      │   [PC] Hello...     │                                │
│      │                     │  ┌──────────────────────────┐  │
│      │     [User: How      │  │                          │  │
│      │      do I...]       │  │   [Annotated screenshot] │  │
│      │                     │  │                          │  │
│      │   [PC] Here's:      │  │     ╭─ pulse hotspot     │  │
│      │   ┌───────────┐     │  │     │                    │  │
│      │   │ 📖 Video  │     │  │                          │  │
│      │   │ (active)  │     │  └──────────────────────────┘  │
│      │   └───────────┘     │                                │
│      │                     │  Tap the green phone button    │
│      │                     │  in the top-right corner.       │
│      │                     │                                │
│      │ ┌──────────┐ [↑]   │  ┌─────────┐  ┌─────────────┐  │
│      │ │ Type...  │       │  │ ◀ Back  │  │   Next  ▶   │  │
│      │ └──────────┘       │  └─────────┘  └─────────────┘  │
└──────┴─────────────────────┴────────────────────────────────┘
  240px        flex                      ~60% on artifact open
```

**Tablet behavior notes:**
- Left pane is collapsible to a **64px icon rail** (☰ toggles). Settings, profile, and tab destinations are vertical icons.
- Artifact slides in from the right and pushes chat to the left (animated, respects `prefers-reduced-motion` → instant snap).
- Backdrop on chat dims by 30% to focus attention on artifact.
- Tap chat region to dismiss artifact (or use ◀ button).

---

## 4. Desktop Layout (>1024px) — ASCII Wireframes

### 4.1 Chat default state (no artifact open)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PC Pal                                              Margaret    ⚙   👤  │
├──────────────┬───────────────────────────────────────────────────────────┤
│              │                                                           │
│  CHATS       │   ┌──┐                                                    │
│              │   │PC│ Welcome back, Margaret!                            │
│  + New chat  │   └──┘ You're due to practice video calling — want to?   │
│              │                                                           │
│  ▸ Email   ● │                          ┌──────────────────────────┐    │
│    today     │                          │ How do I video call Anna?│    │
│              │                          └──────────────────────────┘    │
│  ▸ Wifi      │                                                           │
│    yest.     │   ┌──┐                                                    │
│              │   │PC│ Great question! Here's a guide:                    │
│  ▸ Photos    │   └──┘                                                    │
│    Mon       │        ┌────────────────────────────────────┐             │
│              │        │ 📖 Video Calling · 4 steps         │             │
│  ─────       │        │ Tap to open in panel               │             │
│              │        └────────────────────────────────────┘             │
│  HELPER      │                                                           │
│  ● Sarah     │   ┌──┐ ● ● ●                                              │
│    online    │   └──┘                                                    │
│              │                                                           │
│  ─────       │                                                           │
│              │                                                           │
│  ⚙ Settings  ├───────────────────────────────────────────────────────────┤
│  ❓ Help     │ ┌─────────────────────────────────────────────┐  [ ↑ Send] │
│              │ │ Type your question...                       │           │
│              │ └─────────────────────────────────────────────┘           │
│              │ [ + Get Help ]   [ 📞 Call Sarah ]   [ End chat ]         │
└──────────────┴───────────────────────────────────────────────────────────┘
   260px                              flexible
```

### 4.2 Chat with artifact panel open

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PC Pal                                              Margaret    ⚙   👤  │
├──────────┬───────────────────────────────┬───────────────────────────────┤
│          │                               │  ◀  Video Calling             │
│ CHATS    │   ┌──┐                        │     Step 2 of 4    ●●○○      │
│          │   │PC│ Welcome back...        │                               │
│ + New    │   └──┘                        │  ┌─────────────────────────┐  │
│          │                               │  │                         │  │
│ ▸ Email ●│                ┌────────────┐ │  │  [Screenshot with       │  │
│   today  │                │ How do I...│ │  │   pulsing hotspot]      │  │
│          │                └────────────┘ │  │                         │  │
│ ▸ Wifi   │                               │  │                         │  │
│   yest.  │   ┌──┐                        │  └─────────────────────────┘  │
│          │   │PC│ Here's a guide:        │                               │
│ ▸ Photos │   └──┘                        │  Tap the green phone button   │
│   Mon    │   ┌─────────────────┐        │  in the top-right corner.     │
│          │   │📖 Video Calling │        │                               │
│ ─────    │   │   (open) ●      │        │  💡 If you don't see it,      │
│          │   └─────────────────┘        │     swipe down from the top.  │
│ HELPER   │                               │                               │
│ ● Sarah  │   ┌──┐ ● ● ●                  │  ┌─────────┐  ┌─────────────┐ │
│   online │   └──┘                        │  │ ◀ Back  │  │  Next ▶     │ │
│          │                               │  └─────────┘  └─────────────┘ │
│ ─────    ├───────────────────────────────┤                               │
│ ⚙ Set..  │ ┌──────────────────┐  [ Send]│  [ Close guide ]              │
│ ❓ Help  │ └──────────────────┘          │                               │
└──────────┴───────────────────────────────┴───────────────────────────────┘
   260px               flex (~50%)                       480px
```

**Desktop behavior notes:**
- Artifact panel is **fixed 480px** (per current spec; reduced from 420 to better hold guide screenshots at readable size).
- Conversation rail is **fixed 260px**, can be collapsed to 64px icon rail via toggle in top-left.
- When practice mode launches, **all panels collapse** and the practice screen takes the full viewport (focus mode).
- Video call: opens as a **floating, draggable, resizable window** (min 320×240, default 480×360) so the learner can see the chat AND their helper at once.

---

## 5. Cross-Cutting Behaviors

### 5.1 Safety alert banner

**Always rendered above all content, below top bar, full-width.**

```
┌─────────────────────────────────────────────┐
│ 🚨  This sounds like a scam                 │
│     Don't give them any information.        │
│     [ Tell me what to do ]   [ Dismiss ]   │
└─────────────────────────────────────────────┘
```

- Background: `--color-danger-bg` (light red)
- Border-left: 4px solid `--color-danger`
- Text: 18px, bold first line
- Action button: 48×48 minimum, primary contrast
- Dismiss requires explicit tap on "Dismiss" button — never tap-outside-to-close
- Sticky on scroll until dismissed
- Same banner pattern, same position at all breakpoints

### 5.2 Welcome back banner

Renders **inside the chat tab/pane** above the message thread (NOT sticky), dismissible by swipe or tap-x.

```
┌─────────────────────────────────┐
│ 👋 Welcome back, Margaret!     ✕│
│ Sarah replied to your question  │
│ about photos. [ Read it ]       │
└─────────────────────────────────┘
```

### 5.3 Loading & empty states

**Every list view has an empty state.** Three rules:
1. Friendly illustration (simple, low-detail, large)
2. One sentence of explanation in plain language
3. One primary CTA (or reassurance if nothing to do)

**Loading states are uniform:** centered spinner with text label ("Just a moment..."). Never bare dots, never blank screens. AI typing in chat is the only place "..." dots are used.

### 5.4 Gesture inventory

Gestures are **all supplementary** — every gesture must have a button equivalent.

| Gesture | Phone | Tablet | Desktop |
|---|---|---|---|
| Tap conversation | Open chat | Open chat | Open chat |
| Long-press conversation | Action sheet (rename/delete/share) | Action sheet | Right-click menu |
| Swipe right on conv. card | Quick "share with helper" | Same | n/a |
| Swipe left on conv. card | Quick "delete" with undo banner | Same | n/a |
| Swipe down at top of chat | Pull-to-refresh (load older messages) | Same | n/a |
| Pinch | Resize text in artifact (image zoom) | Same | Mouse wheel |

`prefers-reduced-motion` disables all transition animations but keeps state changes instant.

### 5.5 Keyboard navigation (desktop)

| Key | Action |
|---|---|
| `Tab` | Move between focusable elements in DOM order |
| `Shift+Tab` | Reverse |
| `Enter` / `Space` | Activate focused element |
| `Esc` | Close artifact panel / modal / dismiss banner |
| `Cmd/Ctrl + N` | New chat |
| `Cmd/Ctrl + K` | Search conversations |
| `↑` in empty input | Edit last sent message |

Focus rings: 3px solid `--color-focus`, 2px offset, never removed.

---

## 6. What This Architecture Solves vs. The Brief

| Stated problem | How this fixes it |
|---|---|
| Side panel fixed 420px breaks <768px | Phone uses full-screen artifact overlays; tablet uses 60% sheet; desktop uses 480px panel |
| Sidebar 280px doesn't collapse | Tablet/desktop sidebars collapse to 64px icon rails; phone replaces with bottom tab bar |
| 100vh layout broken on mobile | Layout uses `dvh` (dynamic viewport) — Deliverable 7 will spec this |
| No mobile navigation | Bottom tab bar with 4 tabs |
| Artifacts compete with chat | Inline preview cards → tap to open in dedicated overlay/sheet/panel; chat dims behind |
| Buddy hidden behind small button | Helper is its own bottom tab with status indicator |
| No empty states | Every list has illustrated empty state with reassurance copy |
| No conversation search | Search input sticky at top of History tab |
| Modals don't go full-screen | All phone modals are full-screen bottom sheets |

---

## 7. Open Questions Before Deliverable 2

I want your input on these before I lock in the chat screen spec:

1. **Tab bar labels under icons — keep or drop?** Labels eat ~20px of vertical space but help discoverability for elderly users. Strong default: keep. Override?

2. **"Get Help" button in chat input area — what does it do?** Currently ambiguous in the brief. My read: opens the external resources sheet (verified support links). Alternative: pings the helper. Which?

3. **Helper's role on phone tab bar — always there, or only when paired?** I have it always present, with the empty state reassuring "you don't need one." Alternative: hide entirely until paired, replace with another tab (e.g., "Skills"). Preference?

4. **Practice mode entry point — full-screen takeover from chat, or its own destination?** I have it as a takeover (focus mode). Should it also be reachable from a tab/menu, e.g., "Try things safely" in the Me tab?

5. **Connect-computer flow on phone** — Margaret is on her phone but her computer is the device that needs the helper installed. Does PC Pal on phone display a 6-digit code that she types into a one-page web installer on her computer? Or does the phone version simply not offer this (computer-side flow only)?

6. **Top bar on phone — minimal title only, or include a persistent "End chat" button?** Currently I show `⋯` for end-chat/settings shortcut. Alternative: dedicated `[End chat]` button visible at all times in chat tab.

Once these are settled, I'll build **Deliverable 2: Chat Screen (Mobile)** with full pixel/spacing/color annotations against the design tokens we'll finalize in Deliverable 7.
