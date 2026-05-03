# PC Pal — Deliverable 4: Onboarding Flow (Mobile)

> **Scope:** Streamline the current 6-step onboarding to the minimum viable for personalization, without sacrificing the buddy opt-in or comfort signal. Honors all elderly-friendly constraints from the brief.

---

## 1. Streamlining Decision

### Current 6 steps (inferred from brief)
1. Welcome
2. Name
3. Device type
4. Comfort level
5. Learning goal
6. Buddy opt-in

### New 5 steps

| # | Screen | What it captures | Why kept |
|---|---|---|---|
| 1 | Welcome | nothing — just orientation | Sets expectations; reassures |
| 2 | Name + device (combined) | name, OS | Both are tiny, fit one screen |
| 3 | Comfort level | comfort 1–4 emoji scale | Drives AI tone calibration |
| 4 | Goal | free-text + 4 starter chips | Drives suggestion chips in chat |
| 5 | Buddy | opt-in / skip | Sensitive — earns its own screen |

**Why combine name + device, but not comfort + goal:**
- Name is one input. Device is a 2-tile choice. Both fit comfortably in one viewport at 18px+ with 56px touch targets. Combining saves a screen without crowding.
- Comfort and goal each need their own breathing room. Comfort uses an emoji scale that needs label space. Goal needs a textarea and chips that already fill a screen.

**Why buddy stays its own screen:**
- It's the highest-trust ask in onboarding ("I'll let my daughter watch what I'm doing").
- It needs an explicit, plain-language explanation of what the helper can and cannot do.
- It must be skippable without guilt — "no helper" is a fully supported state.

### Persistent affordances across all 5 screens
- **Top bar:** Progress dots (●●●○○), Back arrow (when applicable), no top-right action.
- **Bottom:** Primary action button, ghost "Skip for now" where appropriate.
- **No bottom tab bar during onboarding** — this is a focused linear flow.
- **No `⋯` menu during onboarding** — nothing to hide.

---

## 2. Screen 1 — Welcome

```
┌──────────────────────────────────────────────┐
│                                              │  No top bar on screen 1
│                                              │  (no back, no progress yet)
│                                              │
│                                              │
│              ┌────────┐                      │  ← MASCOT
│              │   🤖   │                      │     160×160 illustration
│              │   PC   │                      │     primary-soft circle bg
│              └────────┘                      │     (the friendly mascot
│                                              │      you confirmed in D2 Q1)
│                                              │
│         Hello! I'm PC Pal.                   │  ← HEADING
│                                              │     32px bold text-1
│                                              │     centered
│      I'm here to help you with               │     16px below mascot
│      your computer.                          │
│                                              │  ← BODY
│      I'm patient, I never get cross,         │     20px regular text-1
│      and I explain things in plain           │     centered, max 32ch
│      English.                                │     line-height 1.5
│                                              │
│                                              │
│                                              │
│                                              │  ← FOOT
│ ┌──────────────────────────────────────────┐│     16px from bottom
│ │   Let's get started  ▶                    ││     Primary 56px
│ └──────────────────────────────────────────┘│     Full-width minus 16px
│                                              │     gutters
│   Takes about a minute.                      │  ← REASSURANCE
│                                              │     16px text-2 centered
│                                              │     12px below button
└──────────────────────────────────────────────┘
```

**Why no Skip on screen 1:** Screen 1 has no question. There's nothing to skip. The first decision happens on screen 2.

---

## 3. Screen 2 — Name + Device

```
┌──────────────────────────────────────────────┐
│  ◀                            ●●○○○          │  ← TOP BAR
├──────────────────────────────────────────────┤     Back: 48×48 hit
│                                              │     Progress: dots 12px,
│   Tell me a little about you                 │       8px gap, centered top
│                                              │     Dots: filled primary,
│                                              │       outline border
│   What should I call you?                    │  ← FIELD 1 LABEL
│                                              │     20px medium text-1
│   ┌────────────────────────────────────┐    │
│   │ Margaret                           │    │  ← TEXT INPUT
│   └────────────────────────────────────┘    │     56px tall
│                                              │     bg: surface
│                                              │     border: 1px border
│                                              │     radius: 12px
│                                              │     padding: 16px
│   Which kind of computer do you have?        │     font: 20px text-1
│                                              │     Focus: 3px focus ring
│   ┌──────────────────┐ ┌──────────────────┐ │
│   │     ┌────┐       │ │     ┌────┐       │ │  ← DEVICE TILES
│   │     │ 🍎 │       │ │     │ 🪟 │       │ │     Two equal tiles
│   │     └────┘       │ │     └────┘       │ │     ~140px tall each
│   │                  │ │                  │ │     bg: surface
│   │      Mac         │ │     Windows      │ │     border: 1px border
│   │                  │ │                  │ │     radius: 12px
│   │   Made by Apple  │ │   Made by        │ │     8px gap between
│   │                  │ │   Microsoft      │ │
│   └──────────────────┘ └──────────────────┘ │     Selected state:
│                                              │       border: 3px primary
│   ┌──────────────────────────────────────┐  │       bg: primary-soft
│   │  I don't know  / I'll set this later │  │       check ✓ in top-right
│   └──────────────────────────────────────┘  │
│                                              │  ← UNCERTAIN ROW
│                                              │     56px ghost button
│                                              │     full width
│                                              │     For users who don't know
│                                              │     what their device is
│                                              │     (very common in 65+
│                                              │      cohort). Selecting this
│                                              │     defaults profile to
│                                              │     "unknown"; AI asks later.
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐│
│ │  Continue  ▶                              ││  ← PRIMARY
│ └──────────────────────────────────────────┘│     56px primary
│                                              │     Disabled until name is
│                                              │     entered (1+ char) AND
│                                              │     a device option chosen
└──────────────────────────────────────────────┘
```

**Validation behavior:**
- Name: any non-empty string accepted, including emoji or single character. Trim on submit. No "real name" enforcement.
- Device: must select one of three (Mac / Windows / Don't know).
- Continue button stays disabled (visible state, not hidden) until both fulfilled. Disabled state has 50% opacity and is announced as `aria-disabled="true"` to screen readers.

**Keyboard behavior:**
- Tap name field → keyboard rises → input scrolls into view above the keyboard.
- Hitting Return on the soft keyboard does NOT submit. It dismisses the keyboard and reveals the device tiles. (Margaret will accidentally hit Return; auto-submitting feels rude.)

---

## 4. Screen 3 — Comfort Level

```
┌──────────────────────────────────────────────┐
│  ◀                            ●●●○○          │
├──────────────────────────────────────────────┤
│                                              │
│   How do you feel about computers?           │  ← HEADING
│                                              │     24px bold text-1
│                                              │
│   There are no wrong answers.                │  ← REASSURANCE
│                                              │     18px text-2
│                                              │     20px below heading
│                                              │
│                                              │
│   ┌────────────────────────────────────┐    │
│   │  ┌──┐  Just learning              │    │  ← OPTION 1
│   │  │😊│  I'm new to computers.      │    │     Tile 80px tall
│   │  └──┘  Take it slow with me.       │    │     bg: surface
│   └────────────────────────────────────┘    │     border: 1px border
│                                              │     radius: 12px
│   ┌────────────────────────────────────┐    │     padding: 16px
│   │  ┌──┐  Getting there              │    │     12px gap between
│   │  │🙂│  I know some things, but    │    │     
│   │  └──┘  I'm still learning.         │    │     Emoji 32px in 48×48
│   └────────────────────────────────────┘    │       circle, primary-soft
│                                              │     Title 18px medium text-1
│   ┌────────────────────────────────────┐    │     Body 16px text-2
│   │  ┌──┐  Pretty comfortable         │    │
│   │  │😎│  I use my computer often    │    │     Selected:
│   │  └──┘  but not for everything.     │    │       border 3px primary
│   └────────────────────────────────────┘    │       bg primary-soft
│                                              │       check ✓ right
│   ┌────────────────────────────────────┐    │
│   │  ┌──┐  Confident                  │    │  Single-select.
│   │  │🤓│  I just want quick answers  │    │  Selecting one deselects
│   │  └──┘  when I get stuck.           │    │  others.
│   └────────────────────────────────────┘    │
│                                              │  Stored as enum
│                                              │  beginner | learning |
│                                              │  comfortable | confident
│                                              │  → AI uses this to pick
│                                              │  vocabulary, pacing, and
│                                              │  amount of explanation.
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐│
│ │  Continue  ▶                              ││  56px primary
│ └──────────────────────────────────────────┘│  disabled until selected
└──────────────────────────────────────────────┘
```

**Why a 4-option list, not a slider:**
- Sliders require fine motor control. Margaret's arthritis makes 4-position sliders unreliable.
- A list with text labels removes any ambiguity — "what does the middle of the slider mean?"
- Each option has both an emoji *and* explicit prose so the meaning is unambiguous in any language.

**No "Skip" here:** Comfort level is the single most important AI-calibration signal. If we let users skip, we have to default to a guess (probably "learning"), which is fine but loses signal. We treat this as the only required answer apart from name.

**Tap behavior:** Tapping a tile selects it but does NOT auto-advance. User must tap Continue. Auto-advance feels jarring; explicit advance feels in-control.

---

## 5. Screen 4 — Learning Goal

```
┌──────────────────────────────────────────────┐
│  ◀                            ●●●●○          │
├──────────────────────────────────────────────┤
│                                              │
│   What would you like to learn?              │  ← HEADING
│                                              │     24px bold text-1
│                                              │
│   You can change this anytime.               │  ← REASSURANCE
│                                              │     18px text-2
│                                              │
│                                              │
│   ┌────────────────────────────────────┐    │
│   │ I want to video call my            │    │  ← TEXTAREA
│   │ grandchildren.                     │    │     min-height 96px (3 lines)
│   │                                    │    │     auto-grows to 5 lines
│   └────────────────────────────────────┘    │     bg: surface
│                                              │     border: 1px border
│                                              │     radius: 12px
│                                              │     padding: 16px
│                                              │     font 20px text-1
│   Or pick one to start:                      │     placeholder:
│                                              │       "Tell me what you'd
│   ┌────────────────────────────────────┐    │        like to do..."
│   │ 📞  Video call my family            │    │
│   └────────────────────────────────────┘    │  ← STARTER CHIPS
│                                              │     Heading 16px text-2
│   ┌────────────────────────────────────┐    │     16px gap above chips
│   │ 💌  Send and receive email          │    │
│   └────────────────────────────────────┘    │     Each chip:
│                                              │       full-width
│   ┌────────────────────────────────────┐    │       56px tall
│   │ 📷  Look at and share photos        │    │       bg: surface-2
│   └────────────────────────────────────┘    │       border: 1px border
│                                              │       radius: 12px
│   ┌────────────────────────────────────┐    │       padding: 12px 16px
│   │ 🌐  Browse and search the web       │    │       text 18px text-1
│   └────────────────────────────────────┘    │       emoji 24px, 12px gap
│                                              │     8px gap between chips
│                                              │     
│                                              │     Tap → fills textarea
│                                              │     with chip text. Does NOT
│                                              │     auto-advance. User can
│                                              │     edit the prefill before
│                                              │     continuing.
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐│
│ │  Continue  ▶                              ││  Primary 56px
│ └──────────────────────────────────────────┘│  Enabled if textarea has 1+
│                                              │  non-whitespace char
│   [ I'm not sure yet ]                       │  ← SKIP
│                                              │     Ghost text button
│                                              │     48px, centered
│                                              │     8px below primary
│                                              │     Sets goal to null
│                                              │     AI will ask in first chat
└──────────────────────────────────────────────┘
```

**Why both free-text AND chips:**
- Chips give Margaret a no-typing path. Lower friction.
- Free-text supports the "I want to learn how to attach a file in Outlook to send to my accountant" case the chips can't capture.
- Chips populate the textarea so users see they CAN edit the chip text. This subtly teaches that the field is editable.

**"I'm not sure yet" placement:** Below primary, smaller, ghost. Visible but secondary. Margaret should know skipping is OK without it being the obvious default.

---

## 6. Screen 5 — Buddy Opt-In

This is the most sensitive screen. It must:
- Explain what a helper is in one sentence.
- Explain what the helper CAN do.
- Explain what the helper CANNOT do.
- Make "no helper" a fully celebrated path, not a sad default.

```
┌──────────────────────────────────────────────┐
│  ◀                            ●●●●●          │
├──────────────────────────────────────────────┤
│                                              │
│              ┌────────┐                      │
│              │   👥   │                      │  ← ILLUSTRATION
│              └────────┘                      │     80×80 primary-soft circle
│                                              │
│   Want a helper?                             │  ← HEADING
│                                              │     24px bold text-1
│                                              │     centered
│   A helper is someone in your family or      │  ← BODY
│   a friend who can help you when you         │     18px text-1
│   get stuck.                                 │     centered, max 36ch
│                                              │
│                                              │
│   They can:                                  │  ← CAN-DO LIST
│                                              │     16px medium text-1
│   ✓ Reply to your questions                  │     12px gap above items
│   ✓ Have a video call with you               │     Items 18px text-1
│   ✓ Help fix things on your computer         │     ✓ in success color
│     (only when you say it's okay)             │     16px gap between
│                                              │
│                                              │
│   They cannot:                               │  ← CANNOT-DO LIST
│                                              │     16px medium text-1
│   ✗ See your private messages                │     Items 18px text-1
│   ✗ Read your email or files                 │     ✗ in danger color
│   ✗ Do anything without asking you first     │
│                                              │
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ ┌──┐  Get a code to share                ││  ← PRIMARY
│ │ │📨│                                      ││     64px (extra tall — this
│ │ └──┘                                      ││      is a high-stakes choice)
│ └──────────────────────────────────────────┘│     bg: primary
│                                              │     icon + label
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │  No helper, thanks · I'll do this myself  ││  ← SKIP
│ │                              ✓             ││     56px ghost
│ └──────────────────────────────────────────┘│     border: 1px border
│                                              │     text 18px text-1
│   You can add a helper later anytime.        │     ✓ icon right (success)
│                                              │       — signals
│                                              │       "this is a complete
│                                              │        valid choice"
│                                              │
│                                              │  ← REASSURANCE
│                                              │     16px text-2 centered
│                                              │     12px below buttons
└──────────────────────────────────────────────┘
```

**Why two equally-weighted buttons:**
- Conventional UX puts Skip as a small text link to nudge toward the primary. For this flow, that nudge is wrong. Some elderly users feel pressured by family to opt into surveillance-feeling features. PC Pal's stance is: both paths are first-class.
- The skip button has a ✓ in success color to subliminally signal "this is also a complete answer." It's not dressed down.

**If Margaret picks "Get a code to share":**
- Onboarding completes (mark account as ready).
- She's dropped into the chat screen with a welcome banner:
  ```
  👋 You're all set, Margaret!
  Here's your helper code: A4-K9-2P
  Share it with someone you trust.   [ Show me how ]
  ```
- Tapping "Show me how" opens a quick mini-flow: the code is shown larger, with three sharing options (Text, Email, Just show on screen). This is documented in Deliverable 5.

**If Margaret picks "No helper, thanks":**
- Onboarding completes immediately.
- Chat opens with empty-state suggestion chips (per D2 §3.1).
- No nag, no banner, no "are you sure?" The choice is honored.

---

## 7. Onboarding Completion → First Chat

After screen 5, there's no "you're done!" celebration screen — that adds a 6th screen we just removed. Instead, the AI's first chat message handles the welcome:

```
   ┌──┐
   │PC│ Hi Margaret! It's nice to meet you.
   └──┘
        I see you have a Mac and you'd like to
        learn how to video call your family.
        That's a great place to start.

        Whenever you're ready, just ask me
        anything. I'll go at your pace.
```

This message references the data she just gave (name, device, goal) so the onboarding feels like it was *heard*, not just collected. The AI is instructed to do this by a system prompt addition. Empty-state suggestion chips appear below this first message.

**If goal was skipped:** AI omits the goal sentence and instead invites: "What would you like to try first?"

**If device was 'Don't know':** AI follows up with: "Before we dive in — can you tell me what's on the front of your computer? Is there an apple, or a Windows logo, or something else?"

---

## 8. Cross-Screen Behaviors

| Behavior | Spec |
|---|---|
| Back navigation | Always returns to previous screen with all values preserved. State is in-memory; restored on back. |
| Hardware/swipe back | Same as ◀ button. On screen 1, prompts "Sign out?" with Cancel/Sign out (since there's nothing to go back to). |
| Force quit + relaunch | Onboarding state is persisted to localStorage on every screen advance. User resumes at their last screen. |
| Network failure on completion | The final POST that creates the profile is retried automatically; if it fails, an inline banner appears: "Trouble saving — let me try again. [ Try again ] [ Skip for now ]". Skipping uses local-only profile until next launch. |
| Returning user (already onboarded) | Onboarding is bypassed entirely. Goes straight to chat. |
| Slow keyboard rise (Android) | Inputs use `viewport-fit=cover` and adjust scroll position when keyboard appears. No content jumps under the keyboard. |
| Screen reader navigation | Each screen sets focus to the heading on entry. Progress dots are announced as "Step 2 of 5". Continue button is the last focusable element before bottom edge. |

---

## 9. Tokens for the Buddy Code (used in §6 outcome)

```
CODE FORMAT
  6 characters: 2 letters - 2 digits - 2 letters/digits
  Example: A4-K9-2P
  Excludes: 0/O, 1/I/L (visual confusion)
  Display: 32px monospace bold, letter-spacing 4px
  Speakable (each char distinct on phone)

CODE TIMEOUT
  24 hours from generation
  Expired codes show "This code has expired. Get a new one."

CODE COPY/SHARE
  Native share sheet on tap
  Pre-filled message: "Hi! Margaret would like you to be her
  helper on PC Pal. Use this code: A4-K9-2P
  Get the app: pcpal.app/helper"
```

These show up in Deliverable 5 (Helper experience) when implementing the share sheet.

---

## 10. Accessibility Annotations

| Element | Treatment |
|---|---|
| Screen container | `role="main"` with `aria-labelledby` pointing to screen heading |
| Progress dots | `<nav aria-label="Onboarding progress">` with `<ol>` of dots; sr-only text "Step 2 of 5" |
| Back button | `aria-label="Go back to previous step"` — disabled visibly + by attribute on screen 1 |
| Headings | Single `<h1>` per screen, focus-targeted on entry |
| Name input | `<label>` linked properly, `autocomplete="given-name"`, `aria-describedby` for any helper text |
| Device tiles | `role="radiogroup"`, each tile `role="radio"` with `aria-checked` |
| Comfort tiles | Same radio group pattern |
| Chips | `<button>` with full text in accessible name; activating moves text into textarea + announces via aria-live |
| Buddy can/cannot lists | `<ul>` with proper semantics; ✓/✗ are `aria-hidden` (success/danger color is supplementary, not the only signal) |
| Continue button | `aria-disabled` reflects validation state; on disable-tap, focus moves to first invalid field with announcement "Please enter your name first" |

**All animations** during onboarding (slide-in transitions, mascot bob) are gated by `prefers-reduced-motion`. Without motion: instant snap, mascot static.

---

## 11. Edge Cases

| Case | Behavior |
|---|---|
| User taps back from screen 5 → returns to screen 4 with goal preserved |
| User abandons mid-flow, returns 3 days later | Resumes at last completed screen. After 7 days: clears state, restarts at screen 1 |
| User enters very long name (>40 chars) | Truncated to 40 with friendly inline message "That's a great name! I'll just call you the first part." |
| User pastes URL or sentence into name field | Accept it; trim to 40 |
| Comfort tile and chip use same emoji | Acceptable; chips use emoji to convey topic, comfort tiles use them to convey feeling. Distinct contexts. |
| Device shows wrong logos in user's mental model | "I don't know" path covers this. AI clarifies in first chat message. |
| User selects "Don't know" device but writes "I have an iPad" in goal | AI parses goal text on first chat and offers to update device profile. |
| Voice control / Switch Control users | All tiles, chips, buttons reachable in linear DOM order. No drag, no multi-touch required. |
| Onboarding triggered by buddy code (Sarah inviting Margaret) | Skips to a single-screen variant: "Sarah invited you to use PC Pal. Tap to accept." Then runs full onboarding pre-paired. |

---

## 12. Open Questions Before Deliverable 5

1. **Skip on screen 3 (comfort)** — currently no skip. Margaret must pick one of 4. Is that too coercive? Alternative: "Not sure yet" 5th option that maps to "learning" internally. I'd recommend keeping the 4-option forced choice for AI calibration value, but easy to add a 5th tile if you'd rather.

2. **Buddy code on completion** — when Margaret picks "Get a code to share," do we generate the code on-device immediately and show it on the chat welcome banner (as drawn), or wait until she initiates sharing from the Helper tab? My draft shows it immediately so the code is visible at first chat. Alternative: tap-through to Helper tab to generate when ready.

3. **Onboarding-time helper invitation** — should there be a 6th micro-screen for "Send the code now to..." with native share sheet, or keep it post-onboarding (chat banner → tap "Show me how" → share sheet)? I have it post-onboarding to keep the flow at 5 screens. Override?

4. **Welcome message wording** — the AI's first message is generated dynamically using onboarding data. Should the AI's tone/length adapt to the comfort level chosen (e.g., "beginner" gets shorter, gentler; "confident" gets terser)? This is a backend concern but affects the spec. I'd recommend yes — that's the whole point of capturing comfort level.

5. **First-chat suggestion chips after onboarding** — should they be pre-seeded based on goal (e.g., goal = "video call family" → chips are video-call subtopics), or general starter chips? My draft assumes goal-seeded. This means the chip generator needs the goal text. Confirm?

Once these are settled, I'll move to **Deliverable 5: Buddy/Helper Experience (Mobile)**.
