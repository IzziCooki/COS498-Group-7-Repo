# PC Pal — Deliverable 6: Navigation Map

> **Scope:** Every screen, every transition, every modal — a complete flow diagram. Authoritative reference for routing logic in App.jsx and any future router introduction.

---

## 1. Top-Level Architecture

```
                    ┌─────────────────┐
                    │   App entry      │
                    └────────┬────────┘
                             │
                  ┌──────────┴──────────┐
                  │  Auth/role detection │
                  └──┬───────┬──────────┘
                     │       │
         not signed in       signed in
                     │       │
              ┌──────▼──┐  ┌─▼─────────────────┐
              │ Auth    │  │ Role check         │
              │ flow    │  └─┬───────┬─────────┘
              └─────────┘    │       │
                       learner       helper
                             │       │
                  ┌──────────▼──┐  ┌─▼──────────────┐
                  │ Onboarding? │  │ Helper Home    │
                  └──┬─────┬────┘  └────────────────┘
                     │     │
                   yes     no
                     │     │
              ┌──────▼─┐  ┌▼───────────────┐
              │Onboard │  │ Learner Chat   │
              │ (5 sc.)│  │ (default tab)  │
              └────────┘  └────────────────┘
```

---

## 2. Learner Navigation Map

```
═══════════════════════════════════════════════════════════════════
LEARNER ROOT (bottom tab bar persists)
═══════════════════════════════════════════════════════════════════

  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────┐
  │ Chat    │    │ History  │    │ Helper   │    │ Me  │
  │ (default)│←──→│          │←──→│ (if pair)│←──→│     │
  └────┬────┘    └────┬─────┘    └────┬─────┘    └──┬──┘
       │              │                │             │
       │              │                │             │
  ┌────▼────────┐ ┌──▼──────────┐ ┌──▼──────────┐ ┌▼────────────┐
  │ See §2.1     │ │ See §2.2    │ │ See §2.3    │ │ See §2.4    │
  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

═══════════════════════════════════════════════════════════════════
```

### 2.1 Chat tab flow

```
  Chat (default)
  │
  ├── tap [⋯] menu ──► Options sheet (modal, 75% h)
  │                      ├── End chat & rate ──► Rating modal ──► Chat (new)
  │                      ├── Read aloud (toggle, in-place)
  │                      ├── Make text bigger ──► Text size sheet
  │                      ├── How to use PC Pal ──► Help guide (full-screen)
  │                      ├── All settings ──► Settings (Me tab routed)
  │                      ├── About PC Pal ──► About screen
  │                      └── Sign out ──► Confirm modal ──► Auth
  │
  ├── tap artifact card (Guide) ──► Guide viewer (full-screen overlay) [D3]
  │                                    ├── Step nav (◀/▶)
  │                                    ├── tap [Stuck?] ──► Stuck sheet (50% h)
  │                                    │                     ├── Send ──► AI replies in-sheet
  │                                    │                     └── Open in chat ──► back to Chat with prefill
  │                                    ├── tap [NEXT preview] ──► Peek panel (mini sheet)
  │                                    ├── final step Done ──► Chat (with celebration)
  │                                    └── back arrow ──► Chat (overlay closes)
  │
  ├── tap artifact card (Diagnostic) ──► Findings overlay (full-screen)
  │                                       ├── Status detail (per row)
  │                                       └── back ──► Chat
  │
  ├── tap artifact card (Video) ──► Video player overlay (full-screen)
  │                                  ├── play/pause/scrub
  │                                  ├── related videos list
  │                                  └── back ──► Chat
  │
  ├── tap artifact card (Resources) ──► Resources overlay (full-screen)
  │                                      ├── filter Watch/Read/Try
  │                                      ├── tap link ──► native browser (out of app)
  │                                      └── back ──► Chat
  │
  ├── tap artifact card (Practice) ──► Practice mode (full-screen takeover)
  │                                     ├── step-by-step simulation
  │                                     ├── checklist
  │                                     ├── completion ──► Chat
  │                                     └── exit ──► Confirm exit ──► Chat
  │
  ├── tap [+ Get Help] ──► AI generates Resources artifact in-thread (no nav)
  │
  ├── long-press message ──► Contextual sheet
  │                           ├── Copy ──► clipboard + toast
  │                           ├── Read aloud ──► TTS playback
  │                           ├── Send to Sarah ──► sends, toast confirm
  │                           ├── Explain differently ──► AI re-replies in thread
  │                           └── Cancel ──► Chat
  │
  ├── safety banner [Tell me what to do] ──► AI inserts safety advice in thread
  │
  ├── welcome banner [Read it] ──► scrolls to specific message OR opens Helper tab
  │
  └── empty state suggestion chip ──► fills textarea + auto-sends ──► Chat with response
```

### 2.2 History tab flow

```
  History
  │
  ├── tap [+ Start a new chat] ──► Chat (new conversation, empty state)
  │
  ├── tap conversation card ──► Chat (resumed, scrolled to bottom)
  │
  ├── search input ──► filtered list (in-place, no nav change)
  │
  ├── long-press conversation card ──► Action sheet
  │                                    ├── Rename ──► Inline edit
  │                                    ├── Delete ──► Confirm modal ──► History (with undo banner)
  │                                    ├── Share with Sarah ──► Confirm + send ──► toast
  │                                    └── Cancel
  │
  └── pull-to-refresh ──► reload list
```

### 2.3 Helper tab flow (when paired)

```
  Helper
  │
  ├── tap [📞 Call Sarah] ──► Outgoing call screen (full-screen)
  │                            ├── (Sarah answers) ──► In-call UI [§ D5.6.2]
  │                            │                       └── End ──► Helper
  │                            └── (declined/no answer) ──► Helper with toast
  │
  ├── tap [✉ Send msg] ──► Compose sheet
  │                         ├── Send ──► Helper with toast
  │                         └── Cancel ──► Helper
  │
  ├── tap [❓ Ask Sarah for help] ──► Help compose (full-screen)
  │                                   ├── Send ──► Helper (waiting state)
  │                                   └── Cancel ──► Helper
  │
  ├── tap recent message card ──► Read message detail
  │                                ├── Reply ──► Compose sheet
  │                                └── ❤ React ──► toast confirm
  │
  ├── tap [Add another helper] ──► Generate code flow [§ D4 / D5.10 mirror]
  │
  └── tap stop-sharing pill (when watched) ──► Stop watch, Helper updates
```

**When NOT paired:** Helper tab shows empty state with [Get a code to share] CTA → opens Generate Code flow → returns to Helper tab.

### 2.4 Me tab flow

```
  Me
  │
  ├── tap profile card / [Change my details] ──► Edit profile (full-screen)
  │                                                ├── Edit name
  │                                                ├── Edit device
  │                                                ├── Edit comfort level
  │                                                ├── Edit goal
  │                                                ├── Edit AI model preference
  │                                                ├── Save ──► Me with toast
  │                                                └── Cancel ──► Me
  │
  ├── tap [What PC Pal remembers] ──► Memory viewer (full-screen)
  │                                    ├── List of memory items
  │                                    ├── Forget item ──► Confirm ──► reload
  │                                    └── back ──► Me
  │
  ├── tap [Try things safely] ──► Practice mode landing
  │                                ├── Browse skills
  │                                ├── Pick one ──► Practice mode takeover
  │                                └── back ──► Me
  │
  ├── tap [What Sarah has done] (if paired) ──► Audit timeline (full-screen)
  │                                              └── back ──► Me
  │
  ├── tap [Make text bigger] ──► Text size sheet (modal)
  │                              └── apply ──► Me with new size
  │
  ├── tap [Light or dark] ──► Theme sheet (modal)
  │
  ├── toggle [Read messages aloud] ──► in-place toggle
  │
  ├── tap [All settings] ──► Settings (full-screen)
  │                          ├── Notifications ──► sub-screen
  │                          ├── Privacy ──► sub-screen
  │                          ├── Account ──► sub-screen
  │                          └── back ──► Me
  │
  ├── tap [How to use PC Pal] ──► Help guide (full-screen)
  │
  └── tap [About PC Pal] ──► About screen (full-screen)
```

---

## 3. Helper Navigation Map

```
═══════════════════════════════════════════════════════════════════
HELPER ROOT (bottom tab bar persists)
═══════════════════════════════════════════════════════════════════

  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────┐
  │ Home    │    │ Sessions │    │ Tools    │    │ Me  │
  │ (default)│←──→│          │←──→│ (gated)  │←──→│     │
  └────┬────┘    └────┬─────┘    └────┬─────┘    └──┬──┘
       │              │                │             │
       │              │                │             │
  ┌────▼────────┐ ┌──▼──────────┐ ┌──▼──────────┐ ┌▼────────────┐
  │ See §3.1     │ │ See §3.2    │ │ See §3.3    │ │ See §3.4    │
  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### 3.1 Home (Helper)

```
  Home
  │
  ├── tap learner switcher (top bar dropdown) ──► Switcher sheet
  │                                                ├── pick learner ──► Home reloaded
  │                                                └── close ──► Home
  │
  ├── tap [📞 Call] ──► Outgoing call ──► In-call ──► Home
  │
  ├── tap [👀 Watch session] ──► Permission request to learner ──► (waits)
  │                               ├── approved ──► Watch view (§ D5.5)
  │                               │                ├── nudge sent ──► toast
  │                               │                ├── take over ──► take-over UI ──► back
  │                               │                └── stop ──► Home
  │                               └── declined / timed out ──► Home with toast
  │
  ├── tap alert card ──► Alert detail (full-screen)
  │                       ├── related conversation ──► read-only chat
  │                       └── back ──► Home
  │
  ├── tap question card ──► Reply composer (§ D5.4)
  │                          ├── Send ──► Home with toast
  │                          ├── Add photo ──► native picker
  │                          ├── Voice ──► STT inline
  │                          ├── AI-format toggle ──► sends to AI for guide
  │                          └── Cancel ──► Home
  │
  ├── tap progress card ──► Skills detail (full-screen)
  │                          ├── per-skill drill-down
  │                          └── back ──► Home
  │
  └── tap [See all activity] ──► Sessions tab (filtered)
```

### 3.2 Sessions (Helper)

```
  Sessions
  │
  ├── search ──► filtered (in-place)
  │
  ├── filter chips (All/Open/Alerts/⭐) ──► filter (in-place)
  │
  ├── tap conversation card ──► Read-only transcript view
  │                              ├── ❤ React on message ──► toast
  │                              ├── jump to artifact ──► Read-only artifact viewer
  │                              └── back ──► Sessions
  │
  └── tap question card [Reply now] ──► Reply composer (§ D5.4)
```

### 3.3 Tools (Helper)

```
  Tools (no active session)
  │
  ├── tap [📞 Call] ──► call flow
  │
  └── tap [👀 Ask to watch] ──► watch request flow
  
  Tools (active session)
  │
  ├── tap quick-action tile (Battery/Disk/Wi-Fi/etc.) ──► runs command
  │                                                       ├── result card appears in History
  │                                                       └── learner notified (toast)
  │
  ├── type custom command + [Run] ──► destructive check
  │                                    ├── safe ──► runs, result in History
  │                                    └── destructive ──► waits for learner approval
  │                                                       ├── approved ──► runs
  │                                                       └── declined ──► error in History
  │
  └── tap result card [▼ Details] ──► expanded inline
```

### 3.4 Me (Helper)

```
  Me (Helper)
  │
  ├── tap [Edit my profile] ──► Edit profile (full-screen)
  │
  ├── tap learner card ──► Manage learner (full-screen)
  │                         ├── Rotate code
  │                         ├── Toggle permissions
  │                         ├── Unpair ──► Confirm ──► Me
  │                         └── back ──► Me
  │
  ├── tap [+ Help someone else] ──► Pairing flow [§ D5.10]
  │
  ├── tap [Notification settings] ──► sub-screen
  │
  ├── tap [Quiet hours] ──► sub-screen
  │
  ├── tap [Make text bigger] ──► sheet
  │
  ├── tap [All settings] ──► Settings (full-screen)
  │
  └── tap [How to be a good helper] ──► Helper guide (full-screen)
```

---

## 4. Onboarding Navigation (Linear)

```
   Welcome (S1) ──► Name+Device (S2) ──► Comfort (S3) ──► Goal (S4) ──► Buddy (S5) ──► Chat
        │                │                  │                │                │
        │                ▼                  ▼                ▼                ▼
        │              [◀ S1]            [◀ S2]           [◀ S3]            [◀ S4]
        │
        └── (no back) "Sign out?" prompt if hardware back
        
   On S5:
     [Get a code] ──► Code generated ──► Chat with welcome banner showing code
     [No helper]  ──► Chat with simple welcome
     
   On any screen:
     Force quit ──► state persisted, resumes on next launch
     Network fail at S5 completion ──► retry banner inline
```

---

## 5. Modal vs Full-Screen Inventory

### 5.1 Modals (overlay other content, dismissible)

| Modal | Trigger | Dismiss |
|---|---|---|
| ⋯ menu options sheet | tap ⋯ in chat | tap ✕, swipe down, tap backdrop |
| End chat rating | tap "End chat" in ⋯ | tap [Send] or [Skip] |
| Long-press message sheet | long-press message | tap action or [Cancel] |
| Stuck sheet (in guide) | tap [Stuck?] in guide | tap ✕ or "Continue with guide" |
| Peek panel (in guide) | tap NEXT preview strip | tap ✕ or backdrop |
| Action sheet (history card) | long-press conv card | tap action or [Cancel] |
| Rating modal (post-chat) | end chat | tap [Send] or [Skip] |
| Confirm delete | tap delete in action sheet | tap [Cancel] or [Delete] |
| Confirm sign out | tap sign out in ⋯ | tap [Cancel] or [Sign out] |
| Watch permission (Margaret) | Sarah requests watch | tap [Yes] or [Not now] |
| Destructive command approval (Margaret) | Sarah runs destructive cmd | tap [Yes] or [No] |
| Learner switcher (Sarah) | tap dropdown in top bar | tap learner or backdrop |
| Theme picker | Me → Light or dark | tap option |
| Text size picker | Me → Make text bigger | tap option |

### 5.2 Full-screen overlays (replace content, explicit close)

| Overlay | Trigger | Close |
|---|---|---|
| Guide viewer | tap guide artifact | back arrow / Done |
| Diagnostic findings | tap finding artifact | back arrow |
| Video player | tap video artifact | back arrow |
| Resources viewer | tap resources artifact | back arrow |
| Practice mode | tap practice artifact | back / exit confirm |
| Edit profile | tap profile card | save / cancel |
| Memory viewer | tap "What PC Pal remembers" | back |
| Settings | tap "All settings" | back |
| Help guide | tap "How to use" | back |
| About | tap "About" | back |
| Audit timeline (Margaret) | tap "What Sarah has done" | back |
| Manage learner (Sarah) | tap learner card in Me | back |
| Read-only transcript (Sarah) | tap conv in Sessions | back |
| Reply composer (Sarah) | tap "Reply now" | send / cancel |
| Watch view (Sarah) | tap "Watch session" | stop |
| In-call (both) | tap call answer / outgoing | end |
| Outgoing call | tap call button | cancel / connected |
| Incoming call | call rings | answer / decline |
| Pairing code entry (Sarah) | sign-up flow / Add helper | submit / cancel |
| Onboarding screens 1–5 | first launch | linear nav |
| Confirm exit practice | back during practice | confirm / continue |

### 5.3 Toasts (auto-dismiss notifications)

| Toast | Trigger | Duration |
|---|---|---|
| Copied! | tap Copy | 4s |
| Saved | tap Save in profile | 3s |
| Sent to Sarah | long-press → send | 3s |
| Sarah replied | inbound message | 5s, tap to open |
| Sarah ran a check | non-destructive cmd | 4s, tap for details |
| Skill complete | end of guide / practice | 4s |
| Connection lost | WS drop | persistent until reconnect |
| Network error | API fail | 6s with [Retry] |
| Undo delete | after delete | 8s with [Undo] |

---

## 6. Back Navigation Rules

| Screen | Back behavior |
|---|---|
| Tab root (Chat/History/Helper/Me/Home/Sessions/Tools) | Hardware back → confirm exit app (Android) / no-op (iOS, since no native back). Tab bar stays. |
| Onboarding S1 | Hardware back → "Sign out?" confirm |
| Onboarding S2–S5 | Hardware back → previous screen |
| Modal | Hardware back / Esc → dismiss modal |
| Full-screen overlay | Hardware back / swipe → close overlay, restore underlying tab |
| In-call | Hardware back → minimize to PIP (if supported) or no-op |
| Practice mode | Hardware back → exit confirm |
| Guide mid-step | Hardware back → confirm "Leave the guide?" |
| Edit profile with unsaved changes | Hardware back → "Discard changes?" |
| Reply composer with text | Hardware back → "Discard reply?" |

---

## 7. Triggers Summary (What Causes Each Transition)

| Trigger type | Examples |
|---|---|
| Tap | Buttons, cards, chips, tab icons, list items |
| Long-press | Messages (500ms), conversation cards, artifact cards (preview) |
| Swipe | History card swipe-actions; pull-to-refresh; back-edge swipe (iOS) |
| Hardware back | Android back button, browser back |
| Esc key | Desktop close-modal |
| AI action | Safety banner appears; artifact card inserted; welcome message |
| Push notification | Foreground tap → deep link to specific screen |
| WebSocket event | Sarah comes online (status pill update); incoming call; question received |
| Time | Quiet hours toggle; code expiration (24h); take-over auto-release (5min) |
| State sync | Cross-device login; profile update from another session |

---

## 8. Deep Links

PC Pal supports deep links for notifications and helper invitations.

```
pcpal.app/                       → app launch (default)
pcpal.app/helper                 → install + helper sign-up
pcpal.app/pair?code=A4-K9-2P     → pre-fill pairing code
pcpal.app/chat/{id}              → open specific chat (auth required)
pcpal.app/question/{id}          → open question detail (helper)
pcpal.app/alert/{id}             → open alert detail (helper)
pcpal.app/practice/{skill}       → open practice mode for a skill
```

Each deep link respects auth state — if not signed in, routes through auth → onboarding → final destination.

---

## 9. Routing Implementation Note (for Claude Code)

The brief specifies "no router — single-page app with conditional rendering in App.jsx." This deliverable shows enough screens that conditional rendering becomes painful. **Recommendation for D8:** introduce a minimal client-side router that doesn't break the existing pattern. Concretely:

```javascript
// useView() hook returning current view + navigate()
// State stored in window.history via pushState
// No external router library
// Renders one of N top-level views based on state.view
```

This keeps the "no router library" constraint while making the navigation map executable. D8 specifies the implementation.

Deliverables 7 and 8 follow.
