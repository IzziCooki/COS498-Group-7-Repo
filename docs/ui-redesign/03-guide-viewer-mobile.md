# PC Pal — Deliverable 3: Guide Viewer (Mobile)

> **Scope:** The full-screen artifact overlay shown when Margaret taps a guide card in chat. This is the second-most-used screen after chat itself. Honors the "2 steps at a time, never walls of text" constraint.

---

## 1. Pacing Decision (the most important call)

The constraint says "guides show 2 steps at a time." On a phone, two equally-weighted steps stacked vertically would push the action one below the fold. So:

> **One step at a time on phone, but with the next step previewed as a collapsed strip beneath it.** Margaret always sees: where she is, what she's doing now, and a hint of what's coming next.

This honors the constraint (two steps visible) while keeping the active step focused and the action buttons above the fold.

The top bar replaces the chat top bar. **Bottom tab bar is hidden** in this mode — Margaret is in focus, and the only way out is the explicit "Back to chat" control. This matches her mental model: "I went into the guide; I'll come out when I'm done."

---

## 2. Default Step — Image + Hotspot + Text + Note

```
                                                  ↓ status bar
┌──────────────────────────────────────────────┐
│  ◀  Back to chat                       🔊    │  ← TOP BAR (56px)
├──────────────────────────────────────────────┤     Back: 48×48 hit target
│  Video Calling on Mac                        │     "Back to chat" 18px medium
│  Step 2 of 4         ●●○○                    │     primary color
├──────────────────────────────────────────────┤     TTS button (from D2 carryover):
│                                              │       48×48, reads step aloud
│   ┌────────────────────────────────────┐    │     when active.
│   │                                    │    │
│   │                                    │    │  ← TITLE SECTION (72px)
│   │                                    │    │     Title: 24px bold text-1
│   │     [Annotated screenshot]         │    │     Step indicator row:
│   │                                    │    │       Counter 18px text-2 left
│   │            ╭─ pulsing              │    │       Dots aligned right
│   │            │  hotspot              │    │       Active dot: 12px primary
│   │            │  (32px ring)          │    │       Pending dot: 12px border
│   │                                    │    │       Done dot: 12px success
│   │                                    │    │
│   │                                    │    │  ← SCREENSHOT (16px gutters)
│   └────────────────────────────────────┘    │     bg: surface-2
│                                              │     border: 1px border
│   📍 Look in the top-right of your screen   │     radius: 12px
│                                              │     aspect-ratio preserved
│                                              │     max-height: 40vh (so action
│                                              │       buttons stay above fold)
│                                              │     pinch-to-zoom enabled
│                                              │
│                                              │     Caption below screenshot:
│   Tap the green phone button.                │       16px text-2, 12px gap
│                                              │       leading 📍 emoji
│   When you tap it, FaceTime will start       │       
│   calling Anna. You will hear a ringing      │  ← STEP TEXT (auto height)
│   sound while it connects.                   │     Heading 18px bold = step
│                                              │       short instruction
│                                              │     Body 18px regular text-1
│   ┌────────────────────────────────────┐    │       expansion paragraph
│   │ 💡 If you can't see the button,    │    │       max ~50 words per step
│   │    drag the corner of the window   │    │
│   │    to make it bigger.              │    │  ← NOTE CALLOUT (when present)
│   └────────────────────────────────────┘    │     bg: primary-soft #EBF8FF
│                                              │     border-left: 4px primary
│                                              │     radius: 12px
│   ┌────────────────────────────────────┐    │     padding: 16px
│   │ ❓ Stuck? Ask PC for help           │    │     icon 💡 24px, 12px gap
│   └────────────────────────────────────┘    │     text 18px text-1
│                                              │
├──────────────────────────────────────────────┤  ← STUCK BUTTON
│  NEXT  Step 3 · Choose Anna             ▾   │     Always present below note
├──────────────────────────────────────────────┤     56px tall, ghost style
│                                              │     bg: surface
│  ┌──────────┐    ┌──────────────────────┐   │     border: 1px border
│  │ ◀  Back  │    │  Got it · Next  ▶    │   │     radius: 12px
│  └──────────┘    └──────────────────────┘   │     text 18px primary
│                                              │     Triggers "Stuck flow" §6
│                                              │
└──────────────────────────────────────────────┘  ← NEXT-STEP PREVIEW STRIP
                                                    Sticky between content & nav
                                                    44px tall
                                                    bg: surface-3
                                                    border-top: 1px border
                                                    "NEXT" 14px caps text-2
                                                    Step title 18px text-1
                                                    Chevron ▾ 20px right
                                                    Tap → expand preview as
                                                      mini sheet (peek)
                                                  
                                                  ← BOTTOM NAV (sticky)
                                                    bg: surface
                                                    border-top: 1px border
                                                    padding: 16px
                                                    safe-area-inset-bottom
                                                    Back btn:
                                                      ghost, 56px tall
                                                      48% width
                                                      disabled on step 1
                                                    Next btn:
                                                      primary, 56px tall
                                                      flex-grow
                                                      label changes:
                                                        "Got it · Next ▶" mid
                                                        "I did it · Finish ✓"
                                                          on last step
                                                    16px gap between
```

### Hotspot animation spec

```
  Default (with motion):
                                      
              ╭─ ─╮     ← outer ring (8px stroke,
            ╱       ╲       primary 40% opacity)
           │   ●     │    ← inner dot (16px, primary solid)
            ╲       ╱
              ╰─ ─╯
              
  Animation: scale(1) → scale(1.6) over 1.4s ease-out,
             opacity 1 → 0 in same duration
             3 concentric rings, staggered 0.4s apart
  
  prefers-reduced-motion fallback:
  
              ╭───╮  →  arrow with 8px stroke pointing
            ╱     ╲    from caption position toward dot
           │   ●   │   solid, no animation
            ╲     ╱
              ╰─╯
```

The hotspot's screen position is provided by the AI as `{xPercent, yPercent}` relative to the screenshot natural dimensions, so it scales correctly when the image is responsively resized.

---

## 3. Variant — Terminal Command Step

When the guide includes a terminal command (e.g., "type this to clear cache"), the screenshot is replaced by a code block with explicit Copy and Run actions.

```
┌──────────────────────────────────────────────┐
│  ◀  Back to chat                       🔊    │
├──────────────────────────────────────────────┤
│  Clean up your downloads folder              │
│  Step 2 of 3         ●●○                     │
├──────────────────────────────────────────────┤
│                                              │
│   ┌────────────────────────────────────┐    │  ← CODE BLOCK
│   │                                    │    │     bg: #1A202C (dark)
│   │  rm -rf ~/Downloads/*.dmg          │    │     text: #F7FAFC monospace
│   │                                    │    │     16px (smaller is OK here
│   │                                    │    │       — code, not prose)
│   └────────────────────────────────────┘    │     padding: 20px
│                                              │     radius: 12px
│   ┌──────────────┐  ┌────────────────────┐  │     overflow-x scroll if long
│   │ 📋  Copy it  │  │ ▶  Run it for me   │  │     long-press → select all
│   └──────────────┘  └────────────────────┘  │
│                                              │  ← ACTION ROW
│   What this does                             │     Two buttons, equal width
│                                              │     Each 56px tall, radius 12px
│   This removes the leftover installer        │     Copy: ghost, primary text
│   files from your Downloads folder.          │     Run: primary filled
│   It will not delete your photos, music,     │       Disabled if computer not
│   or documents.                              │       connected → tooltip
│                                              │       "Connect your computer
│   ┌────────────────────────────────────┐    │       first to run this for you"
│   │ ⚠️  This cannot be undone.          │    │
│   │    The files will be gone for good. │    │  ← WARNING CALLOUT
│   └────────────────────────────────────┘    │     bg: warning-bg #FEEBC8
│                                              │     border-left: 4px warning
│   ┌────────────────────────────────────┐    │     icon ⚠️ 24px
│   │ ❓ Stuck? Ask PC for help           │    │     text 18px warning-text
│   └────────────────────────────────────┘    │
│                                              │
├──────────────────────────────────────────────┤
│  NEXT  Step 3 · Empty the Trash         ▾   │
├──────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────────────────┐   │
│  │ ◀  Back  │    │  Got it · Next  ▶    │   │
│  └──────────┘    └──────────────────────┘   │
└──────────────────────────────────────────────┘
```

**Copy behavior:** Tap → command goes to clipboard → toast appears at top:

```
   ┌─────────────────────────────────┐
   │ ✓ Copied! Now paste it into     │
   │   the Terminal on your computer.│
   └─────────────────────────────────┘
   Toast: 56px tall, success-soft bg, slides down 240ms,
          stays 4s, dismissable. aria-live="polite".
```

**Run behavior:**
- If computer is connected: confirmation modal "Run this command on your computer?" with the command echoed and a Cancel/Run pair. Result appears as a new message in chat (overlay closes briefly to show it, or shows inline result card).
- If computer not connected: button is disabled state (opacity 0.5, no shadow) with persistent tooltip below it: "Connect your computer first." Tap on disabled button → opens Connect Computer flow.

For destructive commands (deleting, modifying system) the Run button gets an extra-explicit confirmation. The AI is responsible for marking commands as `destructive: true` when generating them; the UI honors that flag.

---

## 4. Variant — Last Step / Completion

```
┌──────────────────────────────────────────────┐
│  ◀  Back to chat                       🔊    │
├──────────────────────────────────────────────┤
│  Video Calling on Mac                        │
│  Step 4 of 4         ●●●●                    │
├──────────────────────────────────────────────┤
│                                              │
│              ┌───────┐                       │  Celebration illustration
│              │  🎉   │                       │  120×120 centered
│              └───────┘                       │  primary-soft circle bg
│                                              │
│        You did it, Margaret!                 │  H1 28px bold text-1
│                                              │  centered
│                                              │
│   You now know how to video call your        │  Body 18px text-1
│   family on your Mac. The next time you      │  centered, max ~40ch
│   want to call Anna, just open FaceTime      │  
│   and start typing her name.                 │
│                                              │
│                                              │
│   ┌────────────────────────────────────┐    │  ← REVIEW CHECKLIST
│   │ What you learned today:            │    │     bg: surface-2
│   │                                    │    │     radius: 12px
│   │ ✓ Open FaceTime                    │    │     padding: 16px
│   │ ✓ Find the green phone button      │    │     Title 18px medium
│   │ ✓ Choose Anna from your contacts   │    │     Items 18px text-1
│   │ ✓ End the call when you're done    │    │     Each ✓ in success color,
│   │                                    │    │       24px, 12px gap
│   └────────────────────────────────────┘    │
│                                              │
│   ┌────────────────────────────────────┐    │  ← PRACTICE OFFER
│   │ 🎯  Want to try it safely first?   │    │     56px tall, ghost
│   │     (no real call will happen)     │    │     border: 1px primary
│   └────────────────────────────────────┘    │     Tap → enter Practice Mode
│                                              │     for this skill
│                                              │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐   │  ← FINISH BUTTON
│  │  Done · Back to chat            ✓    │   │     full width
│  └──────────────────────────────────────┘   │     primary 56px
│                                              │     replaces Back/Next pair
└──────────────────────────────────────────────┘     on last step
```

After tapping Done:
1. Overlay slides down to dismiss (320ms, instant if reduced motion).
2. Margaret returns to chat.
3. AI inserts a celebratory message: "Great work! Want me to remind you how to do this in a few days, so you don't forget?" — this is the spaced-repetition tracker entry point. Yes/Not now.

---

## 5. Next-Step Preview Strip — Expanded State

If Margaret taps the "NEXT  Step 3 · Choose Anna ▾" strip, it expands upward as a peek sheet showing a thumbnail and one-line description, without leaving the current step.

```
┌──────────────────────────────────────────────┐
│                                              │
│   [step 2 content, dimmed 30% backdrop]      │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ Coming up · Step 3                    ✕│  │  ← PEEK PANEL
│ │                                        │  │     Slides up from preview strip
│ │ Choose Anna from your contacts         │  │     ~280px tall
│ │                                        │  │     bg: surface
│ │ ┌────────────────────────────────────┐│  │     radius: 16px top-only
│ │ │  [thumbnail of contact list view]  ││  │     shadow-overlay
│ │ └────────────────────────────────────┘│  │     padding: 20px
│ │                                        │  │     Tap ✕ or backdrop to close
│ │ Tap her name in the list to call her.  │  │     Does NOT advance the guide
│ │                                        │  │     — purely a preview
│ │ [ Skip to this step ]                  │  │     Skip btn: ghost, optional
│ └────────────────────────────────────────┘  │       jump (rarely used; for
└──────────────────────────────────────────────┘     when AI mis-paced it)
```

---

## 6. "Stuck? Ask PC for help" Flow

This is critical. When Margaret taps it:

1. Overlay does NOT close. Instead, a small chat sheet slides up from the bottom of the guide overlay (50% height).
2. The textarea is pre-focused and pre-seeded with context: "I'm stuck on Step 2 of Video Calling on Mac."
3. Margaret can edit the prefilled text, type her own question, or hit a quick "Just send it" button.
4. AI response streams into the sheet WITHOUT leaving the guide. Step 2 stays visible at top.
5. When AI responds, Margaret can read it and continue with the guide, or tap "Open in chat" to pop out to full chat.

```
┌──────────────────────────────────────────────┐
│  [step 2 content, dimmed 50% backdrop]       │
│                                              │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ ─────                                  │  │
│ │                                        │  │  ← STUCK SHEET (50vh)
│ │ Tell PC what's confusing             ✕ │  │     Slide up 320ms
│ │                                        │  │     bg: surface
│ │ ┌────────────────────────────────────┐ │  │     radius 16px top
│ │ │ I'm stuck on Step 2 of Video       │ │  │     drag-handle visible
│ │ │ Calling on Mac.                    │ │  │     
│ │ │                                    │ │  │     Prefilled textarea:
│ │ │ I can't see a green button.        │ │  │       editable
│ │ └────────────────────────────────────┘ │  │       seeded text greyed
│ │                                        │  │       lighter until edited
│ │ ┌────────────────┐  ┌──────────────┐  │  │     
│ │ │ ↑ Send         │  │ Open in chat │  │  │     Send: primary 56px
│ │ └────────────────┘  └──────────────┘  │  │     Open in chat: ghost 56px
│ │                                        │  │       dismisses sheet, closes
│ └────────────────────────────────────────┘  │       guide, focuses chat input
└──────────────────────────────────────────────┘     with same prefill
```

After tapping Send: AI response streams into the sheet, replacing the form. "Continue with guide" button appears at bottom. Sheet expands to 75vh if response is long.

---

## 7. Long Steps — Scroll Behavior

If a step's text exceeds the available height (rare — AI is instructed to keep steps under 50 words), the screenshot stays sticky-pinned at the top of the scroll area while the prose scrolls beneath it. Action buttons stay sticky at bottom. This means Margaret never loses sight of either the visual reference or the action she needs to take.

```
┌──────────────────────────────────────────────┐
│  ◀  Back to chat                       🔊    │  Top bar (sticky)
├──────────────────────────────────────────────┤
│  Title + step indicator                      │  Sticky title (scrolls under)
├──────────────────────────────────────────────┤
│   [Screenshot — sticks to top of content]    │  Sticky on scroll
│                                              │
│   📍 caption                                  │
├──────────────────────────────────────────────┤
│                                              │
│   Step text scrolls here...                  │  Scrolls
│   ...                                        │
│   ...                                        │
│                                              │
│   [💡 Note]                                   │
│   [❓ Stuck button]                           │
│                                              │
├──────────────────────────────────────────────┤
│  NEXT preview                                │  Sticky
├──────────────────────────────────────────────┤
│  Back / Next                                 │  Sticky
└──────────────────────────────────────────────┘
```

---

## 8. Entry & Exit Animation

| Direction | Default | Reduced motion |
|---|---|---|
| Card → overlay (entry) | Card scales/translates from its position in chat to fill viewport, 320ms `--easing` | Cross-fade 0ms (instant) |
| Step → next step | Slide left 240ms; image cross-fades | Instant swap |
| Overlay → chat (exit) | Reverse of entry | Instant |
| Stuck sheet | Slide up from bottom 320ms | Instant + backdrop fade only |
| Peek panel | Slide up from preview strip 240ms | Instant |
| Hotspot | See §2 | Static arrow + ring |

The entry animation matters: it gives Margaret a clear spatial sense of "I came from there, I can go back." The card she tapped is the same surface, just enlarged.

---

## 9. Accessibility Annotations

| Element | Treatment |
|---|---|
| Overlay container | `role="dialog"` `aria-modal="true"` `aria-labelledby="guide-title"` |
| Back button | `aria-label="Close guide and return to chat"` |
| Step counter | `aria-label="Step 2 of 4"` updated on navigation |
| Progress dots | Decorative `aria-hidden="true"` (counter has the info) |
| Hotspot | `aria-hidden="true"` (caption text describes it) |
| Caption | Programmatically tied to screenshot via `aria-describedby` |
| Note callout | `role="note"` |
| Code block | `<pre><code>` with `aria-label="Terminal command"` |
| Copy button | `aria-label="Copy command to clipboard"` |
| Copy success toast | `role="status"` `aria-live="polite"` |
| Run button | `aria-label="Run this command on your computer"` plus `aria-disabled` and `aria-describedby` for disabled-tooltip |
| Run confirmation modal | `role="alertdialog"` (interrupts) |
| Next step preview strip | `<button aria-label="Preview Step 3: Choose Anna" aria-expanded="false">` |
| Stuck button | `aria-label="Get help with this step"` |
| Stuck sheet textarea | Auto-focus, `aria-label="Tell PC what's confusing"` |
| Done state | Focus moves to "Done" button on completion; success illustration `aria-hidden="true"` |

**Focus trap:** While overlay is open, tab focus is trapped within it. Esc closes (with confirmation if mid-step). Focus returns to the originating artifact card in the chat thread on exit.

**Screen reader announcement on step change:** `aria-live="polite"` region announces "Step 3 of 4. Choose Anna from your contacts." when Next is tapped.

---

## 10. Edge Cases

| Case | Behavior |
|---|---|
| Image fails to load | Placeholder card with 📷 icon and "Picture didn't load. Tap to try again." Caption text still serves as instruction. |
| AI sends step with no image | Step renders with no screenshot section; step text and note expand to fill. The caption emoji prefix changes from 📍 to 👉. |
| AI sends step with no caption | Caption row is omitted, not left blank. |
| User taps Next without doing the step | We don't gate progress. Trust the user. (Practice mode is where we'd gate; not here.) |
| Network drops mid-Run command | Run button shows "Trying to reach your computer…" spinner, then error state with Retry. |
| Margaret swipes back gesture (iOS) | Treated as "Back to chat" — same as ◀ button. Confirmation modal on iOS swipe? No — swipe is intentional. |
| Margaret rotates to landscape | Image takes left half, text takes right half. Action buttons full width at bottom. |
| Guide is 1 step only | Hide step counter and progress dots. Hide Back button. Next button label is "Done · Back to chat". |
| Guide is >5 steps | Progress dots truncate to "● ● ● … ○ ○" with current step always shown numerically. |

---

## 11. Open Questions Before Deliverable 4

1. **Run-command requires computer connection** — for users on phone-only (no PC connected), should Run be hidden entirely (less confusing), or visible-but-disabled with the tooltip explaining how to connect? I currently have visible-but-disabled. Override?

2. **Last-step practice offer** — should it be a CTA on the completion screen (as drawn), an automatic prompt from PC in chat after Done, or both? I have it on the completion screen only currently. Both might be redundant.

3. **Step gating** — currently Margaret can hit Next without doing anything. We trust her. Is there value in a soft check on terminal-command steps ("Did the command run successfully?") — Yes/No/Skip? Adds friction; might add safety. Default: no gating. Override?

4. **Voice input on Stuck flow** — should the Stuck-sheet textarea offer a microphone button (speech-to-text)? Margaret has arthritis; typing the explanation of what's confusing is itself frustrating. I'd recommend yes, but it's scope. Add or defer?

5. **Multi-device guides** — if Margaret asks "how do I set up email" and her profile says Mac but the AI thinks the answer applies to her iPhone too, should one guide span both, or should the AI produce two separate guides? I'd recommend two separate guides (less cognitive load per session), but the AI controls this; the UI just needs to handle either case.

Once these are settled, I'll move to **Deliverable 4: Onboarding Flow (Mobile)** — streamlining the current 6 steps.
