# PC Pal — Deliverable 8: Implementation Spec for Claude Code

> **This is the prompt to send to Claude Code.** It is a complete, executable redesign brief that integrates Deliverables 1–7 into the existing codebase. Read end-to-end before starting; execute the migration in the order given.

---

## ⚡️ ROLE & MISSION

You are Claude Code. You will execute a complete UI redesign of **PC Pal**, an existing React 19 + Vite + Express + WebSocket app that teaches elderly users (65+) how to use computers. The redesign turns a desktop-only three-pane layout into a fully responsive mobile-first experience with bottom-tab navigation, role-aware UI (learner vs helper), and a unified design system.

The full design specification lives in seven companion documents in this same directory:

- `01-layout-architecture.md` — responsive layout system + nav pattern
- `02-chat-screen-mobile.md` — chat UI per-pixel
- `03-guide-viewer-mobile.md` — full-screen guide overlay
- `04-onboarding-mobile.md` — 5-screen onboarding
- `05-buddy-helper-mobile.md` — Sarah's complete UI
- `06-navigation-map.md` — every screen + transition
- `07-design-tokens.css` — the new globals.css token block

**Read all seven before writing any code.** They are the source of truth for visual decisions, behaviors, copy, accessibility, and edge cases. This document is the migration plan; the others are the design contract.

---

## 🛡 NON-NEGOTIABLE CONSTRAINTS

These are hard limits. If something else in this prompt seems to conflict with these, these win.

1. **Tech stack stays:** React 19, Vite, Express, WebSocket, vanilla CSS (no Tailwind/CSS-in-JS), BEM naming (`.block__element--modifier`).
2. **No new heavyweight dependencies.** Allowed additions: none required, but if absolutely needed, justify in a comment. Specifically: **no React Router, no styled-components, no UI library.**
3. **Minimum 18px font size** for all conversational text and labels. 14px allowed only for timestamps and sr-only.
4. **Minimum 48px touch targets**, 56px for primary actions, 96px for call-answer.
5. **WCAG AA minimum, AAA preferred.** Use the tokens in D7 — they are pre-calibrated.
6. **Honor `prefers-reduced-motion`** via the global gate in D7. Do not add motion that bypasses it.
7. **No jargon in UI copy.** "Helper" not "buddy", "internet app" not "browser", "computer" not "device" where possible. Match D2 / D5 copy verbatim where it appears.
8. **Safety alerts must be unmissable** — red banner, full-width, sticky, blocking-style, requires explicit dismiss. See D2 §3.2.
9. **Privacy guardrails for helper role are not optional.** See D5 §11.1. Sarah cannot do anything without Margaret's per-action consent for the items listed there.

---

## 🗺 PHASED MIGRATION ORDER

Do these in order. Do **not** skip ahead. Each phase produces a working app — no broken intermediate state.

| Phase | Title | Outcome |
|---|---|---|
| 0 | Discovery & inventory | Full file map, what's reusable |
| 1 | Design tokens + globals | New globals.css applied, app still renders |
| 2 | Layout shell + navigation | Bottom tab bar working on phone, side rail on desktop |
| 3 | Chat screen rebuild | Chat works to D2 spec across breakpoints |
| 4 | Artifact system overhaul | Guides, findings, videos, resources, practice — all to D3 spec |
| 5 | Onboarding redesign | 5-screen flow per D4 |
| 6 | Helper role split | Helper Home / Sessions / Tools / Me per D5 |
| 7 | Video call + remote terminal | Real-time helper features per D5.6 / D5.7 |
| 8 | Modals, toasts, banners | Cross-cutting UI patterns per D6 |
| 9 | Settings, profile, memory, audit | Me-tab destinations |
| 10 | Polish, a11y audit, edge cases | Final pass |

---

## PHASE 0 — DISCOVERY & INVENTORY

Before writing any new code:

1. **Run a tree of the repo.** Output the complete file structure to a working note (`MIGRATION_NOTES.md` in the repo root, gitignored or marked WIP).
2. **For each existing component**, record:
   - Path
   - Approximate line count
   - What it does
   - Whether it's kept / modified / replaced / deleted
3. **For each existing CSS file**, record:
   - Path
   - Whether it has any media queries (the brief notes only 8 of 22 do)
   - Whether it uses BEM correctly
4. **List all top-level routes / view states** rendered in `App.jsx`.
5. **List all WebSocket events** the client listens to and emits.

Save this inventory in `MIGRATION_NOTES.md`. Reference it during later phases.

**Do not start phase 1 until the inventory is complete.** If anything in the codebase contradicts the deliverables (e.g., a feature listed in the brief doesn't actually exist yet), flag it in the notes and continue with what's there.

---

## PHASE 1 — DESIGN TOKENS + GLOBALS

### 1.1 Replace `globals.css`

Take the content of `07-design-tokens.css` verbatim and place it at the top of `src/styles/globals.css` (or wherever globals lives — adapt the path). **Preserve any project-specific resets or font imports below the token block.**

If there are existing CSS custom properties using different names (e.g., `--bg-color` instead of `--color-surface`), do **not** keep both. Migrate every reference in every CSS file to the new token names. Use a project-wide find/replace with explicit before/after values:

```
--bg-color           → --color-surface
--text-color         → --color-text-1
--accent             → --color-primary
--border-color       → --color-border
... etc.
```

Maintain a token-rename table in `MIGRATION_NOTES.md` showing every old → new mapping you applied.

### 1.2 Add the dynamic viewport fix

The brief calls out that 100vh breaks on mobile. The new globals.css uses `100dvh`. Find every occurrence of `100vh` in the project and convert to `100dvh` with a `100vh` fallback for old browsers:

```css
height: 100vh;       /* fallback */
height: 100dvh;
```

### 1.3 Add safe-area handling

Anywhere a component sticks to the top or bottom of the viewport (top bar, tab bar, input area, modal sheets), add safe-area padding:

```css
padding-top: max(var(--space-3), var(--safe-top));
padding-bottom: max(var(--space-3), var(--safe-bottom));
```

### 1.4 Add the theme switcher hook

Create `src/hooks/useTheme.js`:

```javascript
import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pcpal-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pcpal-theme', theme);
  }, [theme]);

  return [theme, setTheme];
}
```

Create `src/hooks/useTextSize.js` similarly, persisting `data-text-size` on `<html>` with values `default | larger | largest`.

### 1.5 Verify

After phase 1, the app should render exactly as before but using the new tokens. Run the existing UI flows by hand. Anything visually broken at this point is a token-rename miss — go fix it before phase 2.

---

## PHASE 2 — LAYOUT SHELL + NAVIGATION

### 2.1 Introduce a minimal router

Per D6 §9, introduce a dependency-free client router. Create `src/router/index.js`:

```javascript
// Minimal pushState-based view router. Replaces conditional rendering in App.jsx.
import { useEffect, useState, useCallback } from 'react';

const VIEW_MATCHERS = [
  { match: /^\/$/,                      view: 'chat'         },
  { match: /^\/onboarding$/,            view: 'onboarding'   },
  { match: /^\/history$/,               view: 'history'      },
  { match: /^\/helper$/,                view: 'helper'       },
  { match: /^\/me$/,                    view: 'me'           },
  { match: /^\/me\/(.+)$/,              view: 'me-sub'       },
  { match: /^\/chat\/([^\/]+)$/,        view: 'chat'         },
  { match: /^\/chat\/([^\/]+)\/guide$/, view: 'guide'        },
  { match: /^\/admin$/,                 view: 'admin'        },
  { match: /^\/helper\/home$/,          view: 'helper-home'  },
  { match: /^\/helper\/sessions$/,      view: 'helper-sessions' },
  { match: /^\/helper\/tools$/,         view: 'helper-tools' },
  { match: /^\/helper\/me$/,            view: 'helper-me'    },
  { match: /^\/pair$/,                  view: 'pair'         },
];

function viewFromPath(pathname) {
  for (const { match, view } of VIEW_MATCHERS) {
    const m = pathname.match(match);
    if (m) return { view, params: m.slice(1) };
  }
  return { view: 'chat', params: [] };
}

export function useRouter() {
  const [state, setState] = useState(() => viewFromPath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setState(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((path, { replace = false } = {}) => {
    if (replace) window.history.replaceState({}, '', path);
    else window.history.pushState({}, '', path);
    setState(viewFromPath(path));
  }, []);

  const back = useCallback(() => window.history.back(), []);

  return { ...state, navigate, back };
}
```

Refactor `App.jsx` to use this hook. The old `useState`-based view switch becomes:

```javascript
const { view, params, navigate } = useRouter();
return (
  <RoleProvider>
    <ShellLayout>
      {view === 'chat' && <ChatScreen chatId={params[0]} />}
      {view === 'history' && <HistoryScreen />}
      ...
    </ShellLayout>
  </RoleProvider>
);
```

### 2.2 Build the layout shell

Create `src/components/ShellLayout/`:

```
ShellLayout/
├── ShellLayout.jsx
├── ShellLayout.css
├── TopBar.jsx
├── TopBar.css
├── BottomTabBar.jsx
├── BottomTabBar.css
├── SideRail.jsx          (tablet/desktop only)
├── SideRail.css
└── ArtifactPanel.jsx     (desktop right pane container)
```

`ShellLayout.jsx` owns the responsive switch:

```jsx
function ShellLayout({ children }) {
  const breakpoint = useBreakpoint(); // returns 'phone' | 'tablet' | 'desktop'
  const role = useRole();              // 'learner' | 'helper'

  return (
    <div className={`pcp-shell pcp-shell--${breakpoint} pcp-shell--${role}`}>
      <TopBar />
      {breakpoint !== 'phone' && <SideRail />}
      <main className="pcp-shell__main">{children}</main>
      {breakpoint === 'desktop' && <ArtifactPanel />}
      {breakpoint === 'phone' && <BottomTabBar />}
    </div>
  );
}
```

CSS uses CSS Grid with named template areas, switched via media queries — no JavaScript-driven layout. Reference `01-layout-architecture.md` §4 for the exact structure.

### 2.3 Build `useBreakpoint` hook

```javascript
// src/hooks/useBreakpoint.js
import { useEffect, useState } from 'react';

export function useBreakpoint() {
  const [bp, setBp] = useState(() => detect());

  useEffect(() => {
    const mql1 = window.matchMedia('(max-width: 639px)');
    const mql2 = window.matchMedia('(min-width: 1025px)');
    const handler = () => setBp(detect());
    mql1.addEventListener('change', handler);
    mql2.addEventListener('change', handler);
    return () => {
      mql1.removeEventListener('change', handler);
      mql2.removeEventListener('change', handler);
    };
  }, []);

  return bp;
}

function detect() {
  if (window.matchMedia('(max-width: 639px)').matches) return 'phone';
  if (window.matchMedia('(min-width: 1025px)').matches) return 'desktop';
  return 'tablet';
}
```

### 2.4 Build `BottomTabBar`

Icon-only per onboarding decision (no labels). Tabs are role-aware. Use SVG icons inline (no icon library). Must be:

- Exactly 64px tall + safe-area-inset-bottom
- 3 or 4 tabs depending on helper-paired state for learner, always 4 for helper
- Active tab shows filled icon variant + `--color-primary` (or `--color-helper`)
- `role="tablist"` with proper `aria-selected` and `aria-label` per icon
- Long-press on a tab shows a tooltip with the label (D2 §2)

### 2.5 Verify

After phase 2, on a phone viewport the bottom tab bar appears, tabs are tappable, and they route between three or four placeholder views. Side rail appears on tablet/desktop. Top bar shows the current screen title.

---

## PHASE 3 — CHAT SCREEN REBUILD

Reference: `02-chat-screen-mobile.md` end-to-end.

### 3.1 Component structure

```
src/components/ChatScreen/
├── ChatScreen.jsx                  (orchestrator)
├── ChatScreen.css
├── MessageThread.jsx
├── MessageThread.css
├── MessageBubble.jsx               (handles user vs AI variants)
├── MessageBubble.css
├── TypingIndicator.jsx
├── TypingIndicator.css
├── SafetyBanner.jsx
├── SafetyBanner.css
├── WelcomeBackBanner.jsx
├── WelcomeBackBanner.css
├── EmptyState.jsx                  (empty-thread state with chips)
├── EmptyState.css
├── SuggestionChip.jsx              (also used in onboarding goal step)
├── SuggestionChip.css
├── InputArea.jsx
├── InputArea.css
├── GetHelpButton.jsx
├── ChatTopBar.jsx
├── ChatOptionsSheet.jsx            (the ⋯ menu)
├── ChatOptionsSheet.css
├── MessageContextSheet.jsx         (long-press menu)
└── MessageContextSheet.css
```

### 3.2 Critical implementation notes

- **Mascot avatar:** Per D2 Q1 decision, use an illustrated character. Add `src/components/Mascot.jsx` that renders an SVG mascot with prop `size`. For phase 3 ship a placeholder SVG (a friendly stylized "PC" character — can be polished later); reference it from `MessageBubble` for AI messages and from `EmptyState` and onboarding screens at larger sizes.

- **Suggestion chips are dynamic.** The empty state requests them from the AI server based on the user's goal text. Add a new WS event `chat:request-suggestions` → server replies with `chat:suggestions` containing 3 chip texts. Client renders. If the request fails or times out (3s), fall back to 3 generic chips ("How do I send an email?", "How do I make text bigger?", "How do I save a photo?").

- **TTS toggle in top bar.** Per D2 Q3 decision, this is a persistent button in the top bar (not the ⋯ menu). Use `window.speechSynthesis`. Toggle persists per-conversation.

- **Typing indicator with reduced-motion fallback.** Per D2 Q4: when `prefers-reduced-motion: reduce` matches, render the literal text "PC Pal is thinking…" instead of dots. Use an `aria-live="polite"` region either way.

- **Long-press is 500ms.** Use `pointerdown` / `pointerup` with a timer; cancel on `pointermove` (>10px) or `pointerleave`. Per D2 Q5: works on both AI and user messages.

- **Get Help button.** Per agreed behavior: button triggers an internal AI prompt that produces an `external_resources` artifact. Implement as: client emits `chat:get-help` WS event with current topic context; server responds with a normal AI message containing a Resources artifact. Button shows inline loading state during the round-trip.

- **Artifact cards in thread:** all share the same `ArtifactCard` component (chassis: icon circle + title + meta + chevron, 80px min height). Variant prop controls icon and styling. Clicking opens the corresponding overlay (phase 4).

- **Input area textarea:** auto-grows from 56px to 5-line max. Does NOT submit on Enter. Send button is always tap-to-submit.

### 3.3 CSS architecture

Per file. Each component has a `.css` file using BEM. Example for `MessageBubble.css`:

```css
.pcp-message {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  max-width: 75%;
}
.pcp-message--from-user {
  margin-left: auto;
  flex-direction: row-reverse;
}
.pcp-message--from-ai {
  margin-right: auto;
}
.pcp-message__avatar { width: 32px; height: 32px; flex-shrink: 0; }
.pcp-message__bubble {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}
.pcp-message--from-user .pcp-message__bubble {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}
.pcp-message--from-ai .pcp-message__bubble {
  background: var(--color-surface);
  color: var(--color-text-1);
  border: 1px solid var(--color-border);
}
.pcp-message__timestamp {
  font-size: var(--font-size-xs);
  color: var(--color-text-2);
  margin-top: var(--space-1);
}
@media (max-width: 414px) {
  .pcp-message { max-width: 70%; }
}
```

### 3.4 Verify

- Type a message, hit send, see it appear right-aligned in primary blue.
- Receive AI response, see it left-aligned with mascot avatar.
- Receive an artifact-bearing message, see the inline ArtifactCard chassis.
- Trigger a safety alert from the server, banner appears at top above thread, sticky.
- Open ⋯ menu, see the seven items per D2 §4 in correct order.
- Long-press a message (500ms), see the contextual sheet.
- Empty state shows mascot, friendly heading, and 3 suggestion chips.
- All text is at least 18px, all buttons at least 48px, no overflow at 360px width.

---

## PHASE 4 — ARTIFACT SYSTEM OVERHAUL

Reference: `03-guide-viewer-mobile.md` (guide is the deepest spec; others follow same patterns).

### 4.1 Component structure

```
src/components/Artifacts/
├── ArtifactCard.jsx              (inline preview in chat — phase 3)
├── ArtifactCard.css
├── ArtifactOverlay.jsx           (full-screen wrapper, role=dialog)
├── ArtifactOverlay.css
├── GuideViewer/
│   ├── GuideViewer.jsx
│   ├── GuideViewer.css
│   ├── GuideStep.jsx
│   ├── GuideStep.css
│   ├── GuideHotspot.jsx
│   ├── GuideHotspot.css
│   ├── GuideTerminalStep.jsx     (Copy/Run variant)
│   ├── GuideCompletionStep.jsx
│   ├── GuideStuckSheet.jsx
│   ├── GuideStuckSheet.css
│   ├── GuideNextPreview.jsx      (peek panel)
│   └── GuideNextPreview.css
├── DiagnosticFindings.jsx
├── DiagnosticFindings.css
├── VideoPlayer.jsx
├── VideoPlayer.css
├── ResourcesViewer.jsx
├── ResourcesViewer.css
└── PracticeMode/
    ├── PracticeMode.jsx
    ├── PracticeMode.css
    ├── PracticeStep.jsx
    └── PracticeChecklist.jsx
```

### 4.2 Guide viewer — exhaustive notes

Build to D3 spec point-by-point:

- One step visible at a time, with sticky preview strip showing next step.
- Hotspot: SVG group positioned by `{xPercent, yPercent}` from AI payload. Animation: 3 concentric rings, staggered, scaling 1→1.6 over 1.4s. Reduced-motion fallback: static arrow + ring (D3 §2).
- Terminal step Run button: per Q1, **visible-but-disabled** when no computer connected, with tooltip "Connect your computer first." Tap on disabled → opens Connect Computer flow.
- Per Q3 decision, terminal steps include a soft "Did it work?" check with **Yes / No / Skip** buttons after the Run/Copy. "No" routes to Stuck sheet pre-filled with the command text. "Yes" advances. "Skip" advances without recording success.
- Stuck sheet: 50vh slide-up with prefilled context. Per Q4, includes a **mic button (Web Speech API)** for voice-to-text on the textarea. Mic button is 48×48, in the textarea's input row. Speech permissions handled gracefully (toast if denied).
- Completion step: per Q2 decision, the practice offer appears **only** on the completion screen, not also as a chat follow-up.
- Overlay traps focus, Esc closes (with confirmation if mid-step), focus returns to originating ArtifactCard on close.

### 4.3 Server contracts

Define the WebSocket payloads explicitly (these are likely close to existing — adjust to match what's there, but ensure all fields below are supported):

```typescript
// AI message with artifacts
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  artifacts?: Artifact[];
};

type Artifact =
  | GuideArtifact
  | DiagnosticArtifact
  | VideoArtifact
  | ResourcesArtifact
  | PracticeArtifact;

type GuideArtifact = {
  type: 'guide';
  id: string;
  title: string;
  estimatedMinutes: number;
  steps: GuideStep[];
};

type GuideStep = {
  id: string;
  title?: string;       // short instruction
  body: string;         // longer prose, max 50 words
  caption?: string;     // text below screenshot
  note?: { kind: 'tip' | 'warning'; text: string };
  image?: { url: string; altText: string };
  hotspot?: { xPercent: number; yPercent: number };
  command?: { text: string; destructive: boolean; explainer: string };
};
```

The other artifact types follow similar shapes — define them in `src/types/artifacts.ts` (or `.js` with JSDoc if no TypeScript).

### 4.4 Verify

- Click guide ArtifactCard from chat — overlay slides up.
- Step 1 shows screenshot, hotspot pulses, caption appears.
- Tap Next — slides to step 2.
- On a terminal step, Copy works (toast confirms), Run is disabled if no PC connected with tooltip.
- "Did it work?" Yes/No/Skip routes appropriately.
- Stuck sheet opens with prefill; mic button transcribes speech.
- Completion shows celebration + practice offer.
- All overlays respect reduced motion (no slide, instant snap).

---

## PHASE 5 — ONBOARDING REDESIGN

Reference: `04-onboarding-mobile.md`.

### 5.1 Component structure

```
src/components/Onboarding/
├── Onboarding.jsx                  (orchestrator, manages state across screens)
├── Onboarding.css
├── OnboardingProgress.jsx          (the dot row)
├── OnboardingScreen.jsx            (chassis: top bar, content, bottom CTA)
├── OnboardingScreen.css
├── ScreenWelcome.jsx
├── ScreenNameDevice.jsx
├── ScreenComfort.jsx
├── ScreenGoal.jsx
├── ScreenBuddy.jsx
└── BuddyCodeShare.jsx              (post-onboarding code share)
```

### 5.2 Implementation notes

- Persist progress to `localStorage` on every screen advance under key `pcpal-onboarding-state`. Resume on relaunch within 7 days; clear and restart after.
- Per Q1: comfort is forced 4-option, no skip.
- Per Q2: on completion with "Get a code", generate the buddy code immediately and show it in the chat welcome banner.
- Per Q3: keep code-share post-onboarding (no 6th screen).
- Per Q4: AI's first chat message adapts to comfort level. The server sends comfort to the AI in the system prompt (e.g., "user comfort: beginner, keep responses gentle and short, ~2 sentences"). Update the server's system prompt template accordingly — this is a backend change in `server/ai/promptBuilder.js` or equivalent.
- Per Q5: empty-state suggestion chips after onboarding are seeded by the goal text. Add an endpoint or WS event `onboarding:complete` that returns 3 chip texts based on goal. Stored in client state; rendered on first chat empty state.
- The "Don't know" device option sets `device: 'unknown'`; server's first-message prompt template includes a clarifying question if device is unknown.

### 5.3 Verify

- Cold-start a fresh user: onboarding launches at screen 1.
- Complete all 5 screens. End in chat with welcome banner showing buddy code (if requested).
- Force-quit mid-flow: relaunch resumes at last screen.
- AI's first message references name, device, goal.
- Empty-state chips reflect the goal Margaret typed.

---

## PHASE 6 — HELPER ROLE SPLIT

Reference: `05-buddy-helper-mobile.md`.

### 6.1 Role detection

Add `src/contexts/RoleContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState('learner');
  const [activeLearner, setActiveLearner] = useState(null); // helper-only

  useEffect(() => {
    // role comes from server on auth response
    // helper.activeLearner persisted in localStorage
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, activeLearner, setActiveLearner }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
```

Top-level routing in `App.jsx` branches by role:

```jsx
{role === 'learner' && <LearnerLayout>{children}</LearnerLayout>}
{role === 'helper'  && <HelperLayout>{children}</HelperLayout>}
```

### 6.2 Helper screens

```
src/components/Helper/
├── HelperHome.jsx
├── HelperHome.css
├── HelperSessions.jsx
├── HelperSessions.css
├── HelperTools.jsx
├── HelperTools.css
├── HelperMe.jsx
├── HelperMe.css
├── LearnerSwitcher.jsx
├── LearnerSwitcher.css
├── ReplyComposer.jsx
├── ReplyComposer.css
├── WatchView.jsx
├── WatchView.css
├── PairingFlow.jsx
└── PairingFlow.css
```

### 6.3 Helper-mode pill in top bar

Top bar gets a slot for the persistent "Helper mode · Margaret ▾" pill when `role === 'helper'`. Tap the pill → opens `LearnerSwitcher` sheet.

### 6.4 Color accent change

The helper role uses `--color-helper` instead of `--color-primary` for accent surfaces. Implement via a parent-level data attribute:

```jsx
<div className="pcp-shell" data-accent={role === 'helper' ? 'helper' : 'primary'}>
```

CSS:

```css
[data-accent="helper"] {
  --color-primary: var(--color-helper);
  --color-primary-hover: var(--color-helper-hover);
  --color-primary-soft: var(--color-helper-soft);
}
```

This swaps the accent without rewriting components — they continue to use `--color-primary` references.

### 6.5 Privacy guardrails

Implement D5 §11.1 in the server. The client never has access to data Sarah isn't permitted to see, regardless of UI. The server validates every request against the helper's permission set for the active learner. Hard rules:

- Sarah requests to watch → server emits `watch:request` to Margaret's connected sockets → blocks until response → only then opens watch stream.
- Sarah runs destructive command → server emits `command:approve-request` to Margaret → blocks until response → only then forwards to the agent.
- All Sarah's actions append to an audit log Margaret can read at `/me/audit`.

### 6.6 Verify

- Sign in as Sarah → Helper Home appears as default.
- Helper top bar shows the role pill in cooler blue.
- Tap "Watch session" → Margaret's account receives the modal.
- Margaret approves → Sarah's Watch view opens with live chat stream.
- Margaret's chat shows the persistent "Sarah is watching" banner.
- Margaret's audit log records the watch session.

---

## PHASE 7 — VIDEO CALL + REMOTE TERMINAL

Reference: `05-buddy-helper-mobile.md` §6 and §7.

### 7.1 Video call

Build on top of the existing `VideoCall` component. The brief says it "has zero responsive layout" — fix that.

- Full-screen on phone (replaces the entire viewport including tab bar).
- Floating draggable+resizable on desktop (min 320×240, default 480×360).
- Self-preview snaps to four corners, default bottom-right.
- 5 control buttons (Mute, Camera, Speaker, Chat, End) at 72×72, in a bottom bar with translucent dark background.
- End button is the largest target and red.
- Auto-hide controls after 3s; tap anywhere to re-show.
- Captions toggle in Chat menu (uses Web Speech API where available).

### 7.2 Remote terminal

Reference: `BuddyTerminal` component (existing). The brief says "not usable on phone keyboards" — fix that.

- On phone, the custom command input uses `inputmode="text"` (not numeric/email) and `autocapitalize="none"`, `autocorrect="off"`, `spellcheck="false"`.
- Add quick-action grid above the input (per D5 §7.2): 6 tiles for Battery / Disk / Wi-Fi / Memory / Temp / Processes — these are pre-canned safe commands. Each tile is 56×56 + label.
- History list of run commands stays as result cards (collapsible).
- Destructive command flow per D5 §7.3: server determines `destructive: true` from a deny-list; if true, server emits `command:approve-request` to Margaret first.

### 7.3 Verify

- Call works at all breakpoints; controls reachable; end button always one tap.
- Quick-action tile (Battery) → command runs → result card appears.
- Custom command `rm -rf ~/Downloads/*` → triggers Margaret's approval modal.
- Margaret approves → command runs.
- Margaret declines → Sarah's history shows "declined."

---

## PHASE 8 — MODALS, TOASTS, BANNERS

Reference: `06-navigation-map.md` §5.

### 8.1 Modal infrastructure

Create `src/components/Overlays/`:

```
Overlays/
├── Modal.jsx                  (centered desktop, full-sheet mobile)
├── Modal.css
├── BottomSheet.jsx            (mobile-style slide-up)
├── BottomSheet.css
├── FullScreenOverlay.jsx      (chassis for guide/video/etc.)
├── FullScreenOverlay.css
├── ConfirmDialog.jsx
├── ToastHost.jsx              (singleton toast manager)
├── ToastHost.css
└── Banner.jsx                 (safety, welcome-back, generic)
```

`ToastHost` mounts once at the top of the tree. Toasts are dispatched via a `useToast()` hook:

```javascript
const { toast } = useToast();
toast({ kind: 'success', text: 'Copied!', duration: 4000 });
toast({ kind: 'error', text: 'Network error.', action: { label: 'Retry', onClick } });
```

Toast styling per D7 tokens. `aria-live="polite"` for status, `aria-live="assertive"` for errors.

### 8.2 Banner component

Polymorphic — same component handles safety, welcome-back, "Sarah is watching", and others. Variant prop drives styling:

```jsx
<Banner variant="safety" title="This sounds like a scam" body="..." action={{...}} dismissible={true} />
<Banner variant="welcome" title="Welcome back!" body="..." dismissible={true} />
<Banner variant="watch" title="Sarah is watching" action={{label: 'Stop sharing', onClick}} />
```

### 8.3 Verify

Run through every modal in D6 §5.1 — each should slide up properly on phone, center properly on desktop, trap focus, close on Esc.

---

## PHASE 9 — SETTINGS, PROFILE, MEMORY, AUDIT

These are smaller, mostly list-of-rows screens. Build them last.

### 9.1 Components

```
src/components/Profile/
├── EditProfile.jsx
├── MemoryViewer.jsx
├── AuditTimeline.jsx           (Margaret's "What Sarah has done")
├── Settings.jsx
├── SettingsRow.jsx             (reusable row component)
├── TextSizePicker.jsx
├── ThemePicker.jsx
└── HowToUseGuide.jsx
```

### 9.2 Settings row anatomy

```
┌────────────────────────────────────────┐
│ 🧠  What PC Pal remembers           ▸ │   64px tall
└────────────────────────────────────────┘   tap target
```

Reusable component:

```jsx
<SettingsRow icon="🧠" label="What PC Pal remembers" onClick={...} />
<SettingsRow icon="🔊" label="Read messages aloud" toggle={value} onToggle={...} />
<SettingsRow icon="🌙" label="Dark mode" trailing={<ThemeBadge />} onClick={...} />
```

### 9.3 Audit timeline

`/me/audit` route. Lists every helper action chronologically:

```
WEDNESDAY
  • Sarah started watching your chat at 2:14 PM (you approved)
  • Sarah ended watching at 2:38 PM
  • Sarah replied to your question about email at 2:40 PM

TUESDAY
  • Sarah ran a check on your battery at 11:02 AM
  • Sarah called you at 11:30 AM (lasted 14 minutes)
```

Read-only, paginated, with filters by helper (if Margaret has multiple) and action type.

### 9.4 Memory viewer

Lists what the AI remembers, derived from server. Each item has a "Forget" button that emits `memory:forget` WS event. Confirmation modal before forgetting.

### 9.5 Verify

All Me-tab destinations reachable; all settings persist (localStorage for client-side, server roundtrip for profile).

---

## PHASE 10 — POLISH, A11Y AUDIT, EDGE CASES

### 10.1 Accessibility checklist

Run through each item:

- [ ] All interactive elements have accessible names (visible label, `aria-label`, or `aria-labelledby`)
- [ ] All images have `alt` (decorative ones use `alt=""`)
- [ ] All form fields have linked `<label>`
- [ ] Focus order is logical and matches visual order
- [ ] Focus rings are visible on every focusable element (3px solid `--color-focus`)
- [ ] Keyboard navigation works for all flows: chat, guide nav, modals, settings
- [ ] Esc closes every modal and overlay
- [ ] `prefers-reduced-motion` disables animations globally (D7 gate)
- [ ] All text meets AA at 18px minimum, AAA where possible (use D7 tokens)
- [ ] Long-press gestures have button equivalents
- [ ] Voice Over (iOS) and TalkBack (Android) navigate the chat thread top-to-bottom in correct order
- [ ] Screen reader announces typing indicator, new messages, banners, toasts
- [ ] Skip links work at top of page (skip to input, skip to latest message, skip to tabs)
- [ ] `lang="en"` on `<html>` and any non-English content tagged
- [ ] `forced-colors` mode renders sensibly (D7 has the basics; spot-check)
- [ ] Tab bar tooltips work on long-press for icon-only state
- [ ] All copy avoids jargon per the constraint list

### 10.2 Responsive checklist

- [ ] 320px width (small Android) — no horizontal scroll, no overlap
- [ ] 360–414px (most phones) — default layout
- [ ] 414–639px (large phones) — 70% bubble width
- [ ] Landscape phone — top bar collapses, tab bar replaced with floating button
- [ ] 640–1024px (tablet) — two-pane with collapsible side rail
- [ ] 1025px+ (desktop) — three-pane with 260 + flex + 480
- [ ] iOS notch + home indicator handled via `--safe-*` tokens
- [ ] Address bar collapse on mobile doesn't break layout (`100dvh`)

### 10.3 Edge case checklist

- [ ] Network drop: WS reconnects with banner; queued messages send on reconnect
- [ ] Token expiry: graceful re-auth without losing chat draft
- [ ] AI response timeout (>30s): "PC is taking longer than usual..." inline
- [ ] Image fails to load in guide: placeholder + "Tap to retry"
- [ ] Helper goes offline mid-watch: Margaret sees banner change to "Sarah disconnected"
- [ ] Margaret rotates phone mid-call: video adjusts orientation
- [ ] User pastes 10,000 chars into chat input: client-side truncate to 4000 with toast
- [ ] User has no microphone permission: voice button disabled with tooltip
- [ ] User has no camera: video call button shows "Audio only" toast
- [ ] Quiet hours: helper notifications suppressed; learner banners delayed
- [ ] Multi-device login: sessions sync via WS broadcast

### 10.4 Final verify

Run the original brief's "current problems to solve" list and confirm each is fixed:

- ✅ Side panel fixed 420px breaks <768px → phone uses overlays, tablet uses sheets, desktop uses 480px
- ✅ Sidebar 280px doesn't collapse on mobile → bottom tab bar replaces it on phone; collapsible side rail on tablet/desktop
- ✅ 100vh issues → 100dvh
- ✅ No mobile navigation → bottom tab bar
- ✅ Three-pane layout on phone → progressive disclosure via overlays/sheets
- ✅ Artifacts compete with chat → unified ArtifactCard chassis, dedicated overlay viewer
- ✅ Only 8 of 22 CSS files responsive → all components have media queries via the responsive design system
- ✅ VideoCall no responsive layout → fixed in phase 7
- ✅ BuddyTerminal not phone-usable → fixed in phase 7
- ✅ Modals don't go full-screen on small viewports → BottomSheet/Modal infrastructure handles this
- ✅ Artifact navigation confusing → cards in thread, dedicated overlay
- ✅ No clear visual hierarchy → tokens + chassis system
- ✅ Onboarding is 6 steps → reduced to 5
- ✅ No empty states → every list has one
- ✅ Loading states inconsistent → standardized via spinner-with-label
- ✅ No conversation search → search input on History tab
- ✅ Buddy features hidden → Helper is its own bottom tab when paired

---

## 📋 ARTIFACTS THIS MIGRATION PRODUCES

By the end you should have:

```
NEW DIRECTORIES
  src/components/ShellLayout/        (8 files)
  src/components/ChatScreen/         (~18 files)
  src/components/Artifacts/          (~22 files including subdirs)
  src/components/Onboarding/         (~10 files)
  src/components/Helper/             (~14 files)
  src/components/Overlays/           (~10 files)
  src/components/Profile/            (~12 files)
  src/router/
  src/contexts/
  src/hooks/                          (additions)
  src/types/                          (or jsdoc)

MODIFIED FILES
  src/styles/globals.css              (replaced with D7)
  src/App.jsx                         (uses router + role)
  every existing component CSS file   (uses new tokens)
  server/ai/promptBuilder.js          (comfort-aware prompts)
  server's WebSocket event handlers   (new events: chat:get-help, watch:request,
                                       command:approve-request, memory:forget,
                                       chat:request-suggestions, etc.)

DELETED / DEPRECATED
  Old conditional-rendering view switch in App.jsx
  Any duplicated layout components made redundant by ShellLayout
  Old onboarding 6-screen flow
```

---

## 🧠 META-RULES FOR EXECUTION

1. **Commit per phase.** Don't pile 10 phases into one commit. Each phase ends in a working app and a single commit (or PR).
2. **Ask before deleting.** If a file might be in use somewhere obscure, leave it but mark deprecated. Confirm before removal.
3. **Don't invent features.** Build only what's specified across D1–D7 + this doc. New ideas → flag in `MIGRATION_NOTES.md` for human review.
4. **Test as you go.** After every phase, run the verify checklist for that phase before starting the next.
5. **Keep `MIGRATION_NOTES.md` current.** Token renames, deprecations, decisions you made under ambiguity, server-side changes — all logged.
6. **Preserve the WebSocket connection model.** Don't refactor the transport. Add new events; don't reshape existing ones unless absolutely necessary.
7. **No CSS-in-JS, no Tailwind.** Vanilla CSS + BEM. The token system in D7 makes this scale.
8. **Write small components.** A file over ~250 lines is a smell. Decompose.
9. **Accessibility is non-negotiable.** A failure on the §10.1 checklist blocks the phase.
10. **When in doubt, default to Margaret's interest.** The 72-year-old user with arthritis and presbyopia is the tiebreaker. Bigger, slower, simpler, more patient — that's right answer.

---

## ▶️ START

Begin Phase 0 now. Output the inventory before writing any new code. After each phase, summarize what changed and what's next.

When all 10 phases are complete, the result is a fully-redesigned PC Pal that works beautifully on Margaret's phone, Sarah's tablet, and the admin's laptop — with every feature from the spec reachable in two taps from chat, every interaction patient and forgiving, and every visual decision rooted in the design tokens she'll never have to think about.
