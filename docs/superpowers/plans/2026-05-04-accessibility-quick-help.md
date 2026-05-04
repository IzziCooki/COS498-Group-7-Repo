# Accessibility Bar + Quick-Help Tile Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an accessibility toolbar (text-size cycle, high-contrast theme, read-aloud TTS) plus a tap-to-start tile grid on the chat empty state, without breaking any existing main flow.

**Architecture:** Pure-additive frontend (5 new files, 1 hook lifted to App level, 1 callback added to useChat) plus pure-additive backend (1 new route file, additive JSON fields on 8 existing skills). The accessibility bar mounts as a sibling of ShellLayout (not inside its CSS Grid) so the existing layout is untouched. The mic button on InputArea is already on main and is not modified — we only use `useSpeech` for TTS via a new `onAssistantResponse` callback on `useChat`.

**Tech Stack:** React 19, Vite, Express, Web Speech API (`SpeechSynthesis` for TTS — universal browser support; `SpeechRecognition` already wired separately on InputArea).

**Spec:** `docs/superpowers/specs/2026-05-04-accessibility-quick-help-design.md`

**Savepoint commit (source of WIP file content):** `ef7ca7f` on local `refactor/remove-buddy-system`. To extract a file from it: `git show ef7ca7f:<path>`.

**The "don't break main" rule:** Every task ends with `npm test` and (where the change is visible) a manual smoke test. The branch must be pushable at every commit. If a step breaks tests, stop and diagnose before committing.

---

## Task 1: Add `*.stackdump` to `.gitignore`

Tiny commit, but it prevents the Cygwin crash dump from sneaking back into the tree.

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Append rule**

Edit `.gitignore` and append at the bottom:

```
# Cygwin/Git-for-Windows crash dumps
*.stackdump
```

- [ ] **Step 2: Verify no stackdump is currently tracked**

Run: `git ls-files | grep stackdump`
Expected: empty output (no tracked stackdumps).

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore *.stackdump (Cygwin/Git-for-Windows crash dumps)"
```

---

## Task 2: Drop the new files (pure additions, no integration yet)

These six files are pure additions — they don't touch any existing file, so they can't break anything. They live unused at the end of this task; tasks 3–8 wire them up.

**Files:**
- Create: `client/src/components/Layout/AccessibilityBar.jsx`
- Create: `client/src/components/Layout/AccessibilityBar.css`
- Create: `client/src/hooks/useAccessibilityPrefs.js`
- Create: `client/src/hooks/useSpeech.js`
- Create: `client/src/components/Chat/QuickHelpGrid.jsx`
- Create: `client/src/components/Chat/QuickHelpGrid.css`

Note: `client/src/components/Chat/` exists on main (it has `Terminal.jsx`, `FeedbackModal.css`, `ConnectComputer.jsx`, etc.) so `QuickHelpGrid` can live there.

- [ ] **Step 1: Verify the source commit exists locally**

Run: `git rev-parse --verify ef7ca7f`
Expected: outputs the full SHA `ef7ca7fa...`. If it errors, something has gone wrong with the savepoint — stop and ask the user.

- [ ] **Step 2: Extract each file from the savepoint**

```bash
git show ef7ca7f:client/src/components/Layout/AccessibilityBar.jsx > client/src/components/Layout/AccessibilityBar.jsx
git show ef7ca7f:client/src/components/Layout/AccessibilityBar.css > client/src/components/Layout/AccessibilityBar.css
git show ef7ca7f:client/src/hooks/useAccessibilityPrefs.js > client/src/hooks/useAccessibilityPrefs.js
git show ef7ca7f:client/src/hooks/useSpeech.js > client/src/hooks/useSpeech.js
git show ef7ca7f:client/src/components/Chat/QuickHelpGrid.jsx > client/src/components/Chat/QuickHelpGrid.jsx
git show ef7ca7f:client/src/components/Chat/QuickHelpGrid.css > client/src/components/Chat/QuickHelpGrid.css
```

If `client/src/components/Layout/` doesn't exist on main, create it first: `mkdir -p client/src/components/Layout`.

- [ ] **Step 3: Verify the files have content**

Run: `wc -l client/src/components/Layout/AccessibilityBar.jsx client/src/hooks/useAccessibilityPrefs.js client/src/hooks/useSpeech.js client/src/components/Chat/QuickHelpGrid.jsx`
Expected: lines counts approximately 84, 71, 131, 79 respectively. If any is 0 lines, re-extract.

- [ ] **Step 4: Verify the build still passes**

Run: `cd client && npm run build && cd ..`
Expected: build succeeds. The new files are not imported anywhere yet, so they should not affect the build.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all tests pass (no new tests yet).

- [ ] **Step 6: Commit**

```bash
git add client/src/components/Layout/AccessibilityBar.jsx \
        client/src/components/Layout/AccessibilityBar.css \
        client/src/hooks/useAccessibilityPrefs.js \
        client/src/hooks/useSpeech.js \
        client/src/components/Chat/QuickHelpGrid.jsx \
        client/src/components/Chat/QuickHelpGrid.css
git commit -m "feat(a11y): add AccessibilityBar, useAccessibilityPrefs, useSpeech, QuickHelpGrid (no wiring yet)"
```

---

## Task 3: Add accessibility theme tokens to `globals.css`

Adds the `:root[data-text-size="large|xlarge"]` and `:root[data-contrast="high"]` rule blocks. Without the matching `<html>` data attributes, these blocks have no effect — pure additive.

**Files:**
- Modify: `client/src/styles/globals.css`

- [ ] **Step 1: Find where to insert**

Read `client/src/styles/globals.css` and find the end of the `:root { ... }` block (the existing design tokens). The new blocks go immediately after that closing brace, before the `/* Reset */` comment.

- [ ] **Step 2: Insert the additive blocks**

Add this after the closing `}` of the existing `:root { ... }` block:

```css
/* Text-size scaling (per-user accessibility preference). The 'normal' tier
   matches the base values above. Larger tiers proportionally scale every
   font-size token so layout that uses var(--font-size-*) follows along. */
:root[data-text-size="large"] {
  --font-size-base: 21px;
  --font-size-sm: 19px;
  --font-size-md: 23px;
  --font-size-lg: 28px;
  --font-size-xl: 35px;
  --font-size-2xl: 42px;
}

:root[data-text-size="xlarge"] {
  --font-size-base: 24px;
  --font-size-sm: 22px;
  --font-size-md: 27px;
  --font-size-lg: 32px;
  --font-size-xl: 40px;
  --font-size-2xl: 48px;
}

/* High-contrast theme — pure black on pure white with thicker borders.
   Overrides the surface, text, and border tokens; component CSS that
   uses these tokens picks up the change automatically. */
:root[data-contrast="high"] {
  --color-bg: #ffffff;
  --color-text: #000000;
  --color-text-light: #1a1a1a;
  --color-primary: #003eb8;
  --color-primary-dark: #002a82;
  --color-primary-light: #e0e8ff;
  --color-border: #000000;
  --color-surface: #ffffff;
  --color-surface-alt: #f0f0f0;
  --color-shadow: rgba(0, 0, 0, 0.4);
  --color-success: #006625;
  --color-warning: #8a4500;
  --color-danger: #a30000;
}

:root[data-contrast="high"] button {
  border: 2px solid currentColor;
}
```

- [ ] **Step 3: Verify the build passes**

Run: `cd client && npm run build && cd ..`
Expected: build succeeds.

- [ ] **Step 4: Visual smoke test (no change expected)**

Run: `npm run dev` and visit the site. The app should look exactly the same as before — no `<html>` data attributes are set yet, so the new blocks are dormant. If anything looks different, the existing `:root { ... }` block was nested incorrectly.

- [ ] **Step 5: Commit**

```bash
git add client/src/styles/globals.css
git commit -m "feat(a11y): add data-text-size and data-contrast theme token overrides"
```

---

## Task 4: Wire up the quick-help endpoint and add tests

Drops in the route file, the test, and registers the router in `server/index.js`. Also adds the `quickHelp*` fields to 8 skill JSONs (additive only).

**Files:**
- Create: `server/routes/skills.js` (extract from savepoint)
- Create: `server/__tests__/skillsRoute.test.js` (extract from savepoint)
- Modify: `server/index.js` (one line — register the router)
- Modify: 8 skill JSONs in `server/skills/`

- [ ] **Step 1: Extract route + test from savepoint**

```bash
git show ef7ca7f:server/routes/skills.js > server/routes/skills.js
git show ef7ca7f:server/__tests__/skillsRoute.test.js > server/__tests__/skillsRoute.test.js
```

- [ ] **Step 2: Run the test — it should fail (route not registered yet)**

Run: `npx jest server/__tests__/skillsRoute.test.js`
Expected: FAIL — the test hits `/api/skills/quick-help` which 404s because the router isn't mounted.

If it PASSES, the test is too lenient — read it and check assertions before continuing.

- [ ] **Step 3: Register the router in `server/index.js`**

Find where other routers are registered (search for `app.use(` lines registering route files). Add this line in the same block:

```js
app.use('/api/skills', require('./routes/skills'));
```

- [ ] **Step 4: Re-run the test — it should still fail (no skills opted in yet)**

Run: `npx jest server/__tests__/skillsRoute.test.js`
Expected: the test that asserts a non-empty tile list will FAIL because no skill has `quickHelp: true` yet.

- [ ] **Step 5: Add `quickHelp*` fields to 8 skill JSONs (additive only)**

For each of these 8 files in `server/skills/`, open the JSON and add the new fields **alongside the existing fields**, without modifying anything else. Use the JSON-comma carefully (add a comma to the previous field, not after the last one).

`server/skills/wifi.json` — add:
```json
"quickHelp": true,
"quickHelpLabel": "Connect to Wi-Fi",
"quickHelpEmoji": "📶",
"quickHelpStarter": "I need help connecting to Wi-Fi.",
"quickHelpOrder": 4,
```

`server/skills/send-email.json` — add:
```json
"quickHelp": true,
"quickHelpLabel": "Send an email",
"quickHelpEmoji": "✉️",
"quickHelpStarter": "I'd like to send an email — please walk me through it.",
"quickHelpOrder": 1,
```

`server/skills/scam-protection.json` — add:
```json
"quickHelp": true,
"quickHelpLabel": "Is this a scam?",
"quickHelpEmoji": "🛡️",
"quickHelpStarter": "I think I might be looking at a scam — can you help me check?",
"quickHelpOrder": 7,
```

`server/skills/copy-paste.json` — add:
```json
"quickHelp": true,
"quickHelpLabel": "Copy and paste",
"quickHelpEmoji": "📋",
"quickHelpStarter": "Show me how to copy and paste something.",
"quickHelpOrder": 5,
```

`server/skills/print-document.json` — add:
```json
"quickHelp": true,
"quickHelpLabel": "Print a document",
"quickHelpEmoji": "🖨️",
"quickHelpStarter": "I'd like to print a document.",
"quickHelpOrder": 6,
```

`server/skills/restart.json` — add:
```json
"quickHelp": true,
"quickHelpLabel": "Restart my computer",
"quickHelpEmoji": "🔄",
"quickHelpStarter": "How do I restart my computer the right way?",
"quickHelpOrder": 8,
```

`server/skills/screenshot.json` — add:
```json
"quickHelp": true,
"quickHelpLabel": "Take a screenshot",
"quickHelpEmoji": "📸",
"quickHelpStarter": "Help me take a screenshot.",
"quickHelpOrder": 3,
```

`server/skills/video-call.json` — add:
```json
"quickHelp": true,
"quickHelpLabel": "Video call",
"quickHelpEmoji": "📞",
"quickHelpStarter": "I want to video call someone — please walk me through it.",
"quickHelpOrder": 2,
```

After every edit, the file must remain valid JSON. Verify with `node -e "JSON.parse(require('fs').readFileSync('server/skills/wifi.json'))"` etc.

- [ ] **Step 6: Re-run the test — it should now pass**

Run: `npx jest server/__tests__/skillsRoute.test.js`
Expected: PASS.

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: all tests pass. (Other suites should be unaffected — we only added fields to JSONs and added one Express route.)

- [ ] **Step 8: Manual smoke test of the endpoint**

Run: `npm run dev` and in another terminal: `curl http://localhost:3001/api/skills/quick-help`
Expected: a JSON array of 8 objects, each with `id`, `label`, `emoji`, `starter`, `category`, `order`. Sorted by order ascending.

- [ ] **Step 9: Commit**

```bash
git add server/routes/skills.js server/__tests__/skillsRoute.test.js server/index.js server/skills/
git commit -m "feat(a11y): add /api/skills/quick-help endpoint + opt-in 8 skills"
```

---

## Task 5: Mount AccessibilityBar at the App level (above ShellLayout)

Mounting AccessibilityBar OUTSIDE ShellLayout's CSS Grid avoids any risk of breaking the existing layout. The bar becomes a sibling of `<ShellLayout>` in `App.jsx`'s render tree, with `useAccessibilityPrefs` lifted to `AppContent`.

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Read App.jsx**

Open `client/src/App.jsx`. The render tree starts with `<ShellLayout title=... > {children} </ShellLayout>` inside `AppContent()`. We need to:
1. Import `AccessibilityBar` and `useAccessibilityPrefs`
2. Call the hook at the top of `AppContent`
3. Wrap the existing return value in a `<>...</>` fragment with the bar above

- [ ] **Step 2: Add imports**

Near the other imports in `App.jsx`, add:

```js
import AccessibilityBar from './components/Layout/AccessibilityBar';
import { useAccessibilityPrefs } from './hooks/useAccessibilityPrefs';
```

- [ ] **Step 3: Call the hook inside `AppContent()`**

At the top of `function AppContent() { ... }`, after the existing `const { view, navigate, back } = useRouter();` line, add:

```js
const a11y = useAccessibilityPrefs();
```

This automatically applies the `data-text-size` and `data-contrast` attributes to `<html>` on every render.

- [ ] **Step 4: Render the bar above ShellLayout**

Find the main return block of `AppContent` (the one returning `<><ShellLayout ...>...</ShellLayout></>` near the end). Wrap the existing fragment so the bar renders first:

```jsx
return (
  <>
    <AccessibilityBar
      prefs={a11y.prefs}
      onCycleTextSize={a11y.cycleTextSize}
      onToggleHighContrast={a11y.toggleHighContrast}
      onToggleReadAloud={a11y.toggleReadAloud}
      speechSupported={typeof window !== 'undefined' && 'speechSynthesis' in window}
    />
    <ShellLayout ...>
      ...existing children...
    </ShellLayout>
  </>
);
```

Keep all existing props and children of `<ShellLayout>` exactly as they were.

- [ ] **Step 5: Verify the build**

Run: `cd client && npm run build && cd ..`
Expected: build succeeds.

- [ ] **Step 6: Visual smoke test**

Run: `npm run dev`, visit the site (logged in past onboarding so you see the chat shell):
1. Accessibility bar visible at the very top of the page.
2. Click `A+` once. Every text in the app gets larger (Normal → Large).
3. Click `A+` again. Even larger (Large → Extra Large). `A+` button now disabled.
4. Click `A−` twice to return to Normal. `A−` now disabled.
5. Toggle "High contrast: Off" → "On". Page background becomes white, text black, buttons gain thicker borders.
6. Toggle off. Returns to normal palette.
7. Open DevTools → Inspect `<html>`. With high-contrast on, you should see `data-contrast="high"`.
8. Reload the page. Whatever state the bar was in persists (localStorage). 
9. Check that ShellLayout's Phone/Tablet/Desktop layouts still work by resizing the window.
10. The "Read aloud" toggle is visible (assuming a Chromium browser); toggle it on. Nothing happens yet — that's wired in Task 6.

If anything looks broken, stop and fix before committing.

- [ ] **Step 7: Run tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat(a11y): mount AccessibilityBar above ShellLayout, lift prefs hook to App"
```

---

## Task 6: Wire read-aloud TTS into useChat via callback

`useChat` currently has no awareness of accessibility prefs. Rather than coupling it to the prefs hook, we add an optional `onAssistantResponse(text)` parameter. App-level code passes `speak` as the callback when `prefs.readAloud` is true.

**Files:**
- Modify: `client/src/hooks/useChat.js`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Add `onAssistantResponse` to `useChat`'s signature**

In `client/src/hooks/useChat.js`, change the function signature from:

```js
export function useChat(userId) {
```

to:

```js
export function useChat(userId, options = {}) {
  const { onAssistantResponse } = options;
```

- [ ] **Step 2: Call the callback when a response message is added**

Find the `case 'response':` block in the `ws.onmessage` switch. After `setMessages((prev) => [..., {...assistant message...}])`, add:

```js
if (onAssistantResponse && typeof data.text === 'string' && data.text.length > 0) {
  onAssistantResponse(data.text);
}
```

The `onAssistantResponse` reference must be captured in `useCallback` deps — find the `connect` `useCallback` definition and add `onAssistantResponse` to its dependency array.

- [ ] **Step 3: Wire it up in App.jsx**

In `App.jsx`, find the line `const chatData = useChat(user?.id);` and replace it with:

```js
const speech = useSpeech();
const chatData = useChat(user?.id, {
  onAssistantResponse: (text) => {
    if (a11y.prefs.readAloud && speech.synthSupported) {
      speech.speak(text);
    }
  },
});
```

Add the `useSpeech` import at the top:

```js
import { useSpeech } from './hooks/useSpeech';
```

- [ ] **Step 4: Verify the build**

Run: `cd client && npm run build && cd ..`
Expected: build succeeds.

- [ ] **Step 5: Visual smoke test**

Run: `npm run dev`:
1. Toggle "Read aloud: On" in the accessibility bar.
2. Send a message: "What is Wi-Fi?"
3. When the response arrives, the browser speaks the reply aloud.
4. Send another message while the previous one is still speaking — the new utterance should cancel the old (no two voices at once).
5. Toggle "Read aloud: Off". Send another message. Silence.
6. Markdown like `**bold**` in responses is NOT read literally as "asterisk asterisk".

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: all tests pass. (`useChat` callback addition is backward compatible — existing callers without the options param still work.)

- [ ] **Step 7: Commit**

```bash
git add client/src/hooks/useChat.js client/src/App.jsx
git commit -m "feat(a11y): wire SpeechSynthesis to assistant responses via useChat callback"
```

---

## Task 7: Add QuickHelpGrid to MessageThread's empty state

We supplement (not replace) the existing `<EmptyState>` component. The grid renders below the existing empty state content, so users get both the existing tutorial cues AND the new quick-start tiles.

**Files:**
- Modify: `client/src/components/ChatScreen/MessageThread.jsx`

- [ ] **Step 1: Read EmptyState to understand current empty UX**

Run: `cat client/src/components/ChatScreen/EmptyState.jsx | head -30`
Read what it renders so you can decide whether the grid goes above or below it visually. Default: below (the existing copy frames the conversation; the tiles are the action).

- [ ] **Step 2: Add the import**

In `client/src/components/ChatScreen/MessageThread.jsx`, add:

```js
import QuickHelpGrid from '../Chat/QuickHelpGrid';
```

- [ ] **Step 3: Render the grid in the empty branch**

Find the existing block (around line 113):

```jsx
{isEmpty && !isViewingPast && (
  <EmptyState onSendMessage={onSendMessage} />
)}
```

Replace with:

```jsx
{isEmpty && !isViewingPast && (
  <>
    <EmptyState onSendMessage={onSendMessage} />
    <QuickHelpGrid onSelect={onSendMessage} />
  </>
)}
```

`onSendMessage` is already a prop of `MessageThread`; the grid's `onSelect` callback receives the starter prompt and we pipe it directly into `sendMessage`.

- [ ] **Step 4: Verify the build**

Run: `cd client && npm run build && cd ..`
Expected: build succeeds.

- [ ] **Step 5: Visual smoke test**

Run: `npm run dev`:
1. Start a fresh chat (clear localStorage if needed, or use the "New chat" button).
2. Empty state shows the existing EmptyState content followed by the tile grid.
3. Tiles show 8 emojis (📶 ✉️ 🛡️ 📋 🖨️ 🔄 📸 📞) in `quickHelpOrder` (Send email first, video call second, etc.).
4. Tap "Connect to Wi-Fi" tile. The starter prompt drops into the chat as a user message and PC Pal responds.
5. Once the first message arrives, both EmptyState and the grid disappear.
6. Resize the window to phone width. Grid reflows to a tighter layout.
7. With high-contrast mode on (toggle the bar), tiles still look correct (white background, black borders, blue primary on hover/focus).

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/ChatScreen/MessageThread.jsx
git commit -m "feat(a11y): render QuickHelpGrid below EmptyState on chat empty state"
```

---

## Task 8: README accessibility section

Adds a short paragraph about the new accessibility features. Put it under "What is this?" or before "Quick Start", whichever reads better in context.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read the current README**

Find a logical insertion point — likely after the project intro and before "Quick Start", or as a new "Accessibility" section near the top of the features list.

- [ ] **Step 2: Add the section**

Insert this block at the chosen location:

```markdown
## Accessibility

PC Pal includes a persistent accessibility toolbar across the top of the app:

- **Text size:** three tiers (Normal / Large / Extra Large) that scale every font in the app proportionally.
- **High contrast:** swaps the palette to pure black on pure white with thicker borders and a strong primary blue.
- **Read aloud:** speaks PC Pal's replies through the browser's built-in voice (`SpeechSynthesis`), at a calmer rate suited to older listeners.

Preferences persist across sessions via `localStorage`.

The chat empty state also shows a tap-to-start tile grid with the most common tasks (Send email, Connect to Wi-Fi, Take a screenshot, etc.) so users don't have to invent what to type. Tiles are data-driven — opt a skill in by adding `quickHelp: true` and a few descriptive fields to its JSON.

A microphone button on the message input (Chromium-based browsers) lets users dictate their question instead of typing.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README accessibility section"
```

---

## Task 9: Final verification

Before pushing.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests green. If anything fails, do not proceed.

- [ ] **Step 2: Build the client**

Run: `cd client && npm run build && cd ..`
Expected: production build succeeds, no warnings about unused imports.

- [ ] **Step 3: Manual end-to-end smoke test (golden path)**

Run: `npm run dev` and walk through every step in the spec's "Manual smoke test (golden path)" list:
1. Open the app. Accessibility bar visible.
2. Click `A+` twice. Every text in the app gets larger.
3. Toggle high-contrast. Background goes white, text goes black, borders thicken.
4. Open chat. See empty state with tile grid.
5. Tap "Connect to Wi-Fi" tile. Starter prompt sends. Response arrives.
6. Toggle read-aloud. Send another message. Response gets spoken.
7. Click 🎤 on input (this is the existing main mic, untouched). Say "How do I send an email?" Stop. Input populates with transcript. Send.
8. Reload the page. Prefs persist.

- [ ] **Step 4: Edge case smoke test**

1. Open the app in Firefox (no SpeechRecognition). The "Read aloud" toggle is still visible (TTS works); the mic button on InputArea is hidden (already main behavior, unchanged).
2. With DevTools open, run `localStorage.clear()` and reload. App defaults gracefully to Normal text, no high-contrast, read-aloud off.
3. Stop the server, send a message in the UI. The existing connection-lost banner appears (no regression).
4. Restart the server. The accessibility bar is unaffected by reconnection.

- [ ] **Step 5: Inspect git log**

Run: `git log --oneline origin/main..HEAD`
Expected: ~9 clean commits, each named meaningfully. No "WIP" or "fix typo" noise.

---

## Task 10: Push and open the PR

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feature/accessibility-quick-help
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Accessibility toolbar + quick-help tile grid" --body "$(cat <<'EOF'
## Summary
- Persistent accessibility toolbar (text-size cycle, high-contrast theme, read-aloud TTS)
- Tap-to-start tile grid on the chat empty state, driven by skill JSON opt-in
- Read-aloud auto-speaks assistant responses when enabled

## What's new

**Frontend:**
- `AccessibilityBar` mounted above `ShellLayout` (sibling, not inside the CSS Grid — avoids any layout regression risk)
- `useAccessibilityPrefs` hook persists prefs to `localStorage` and applies `data-text-size` / `data-contrast` to `<html>`
- `useSpeech` hook wraps `SpeechSynthesis` for TTS with markdown-stripping
- `QuickHelpGrid` fetches `/api/skills/quick-help` and renders large emoji tiles in the empty chat state
- New `:root[data-text-size]` and `:root[data-contrast]` rule blocks in `globals.css`
- `useChat` accepts an `onAssistantResponse` callback so App can wire TTS conditionally

**Backend:**
- `GET /api/skills/quick-help` returns the curated tile list, sorted by `quickHelpOrder`
- 8 existing skills opt in via additive JSON fields (`quickHelp: true` + label/emoji/starter/order)
- Test added: `server/__tests__/skillsRoute.test.js`

## What's NOT changed
- The existing inline mic button on `InputArea` is untouched (already on main)
- `ShellLayout` CSS Grid is untouched (bar mounts as sibling)
- No buddy/helper/role logic changed
- All existing skill prompt fields preserved (additive merge only)

## Test Plan
- [ ] `npm test` (all suites green)
- [ ] Accessibility bar visible at top of every view
- [ ] Text-size cycle scales every font proportionally; bounds correctly disable buttons
- [ ] High-contrast palette flips correctly; restores on toggle off
- [ ] Read-aloud speaks assistant responses, cancels prior utterance on new message
- [ ] Quick-help tiles tap-to-start sends a starter prompt
- [ ] Prefs persist across reload via localStorage
- [ ] Firefox: mic hidden (main behavior), TTS works, layout unbroken
- [ ] No regression to existing chat, onboarding, helper-mode, or admin flows

## Spec
`docs/superpowers/specs/2026-05-04-accessibility-quick-help-design.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Wait for CI**

Per `CLAUDE.md` rule: "Wait for CI to pass before merging."

Run: `gh pr checks --watch`
Expected: all checks (lint, build, tests, smoke tests, audit) pass green.

If a check fails, fix on this branch and push again. Do NOT merge until green.

- [ ] **Step 4: Hand off to user**

Tell the user the PR URL, the CI status, and that the merge decision is theirs. Do not auto-merge.

---

## Self-Review Checklist (run after writing the plan)

- [x] Spec coverage: every section of the spec has a corresponding task (a11y bar → T5; mic → noted as already-on-main, no task needed; tile grid → T7; read-aloud → T6; tile API → T4; theme tokens → T3; testing → T9; README → T8; gitignore → T1).
- [x] Placeholder scan: no TBDs, TODOs, or vague directions. Each step has either an exact command, exact code, or a specific file path with line-level guidance.
- [x] Type consistency: `useAccessibilityPrefs` returns `{ prefs, setTextSize, cycleTextSize, toggleHighContrast, toggleReadAloud }` (per the source file). The plan uses `cycleTextSize`, `toggleHighContrast`, `toggleReadAloud`, `prefs.readAloud`, `prefs.textSize`, `prefs.highContrast` — consistent. `useSpeech` returns `{ synthSupported, recognitionSupported, isSpeaking, isListening, speak, stopSpeaking, startListening, stopListening }` — the plan uses `synthSupported` and `speak`, consistent.
- [x] No spec requirement without a task: yes (mic is the one exception, intentionally noted as already on main).
- [x] "Don't break main" gate: every task ends with `npm test` and (for visible changes) a manual smoke test. Each commit leaves main in a working state.
