# Accessibility Bar + Quick-Help Tile Grid — Design

**Status:** Approved for implementation
**Author:** Alexander Sharon (with Claude)
**Date:** 2026-05-04
**Branch:** `feature/accessibility-quick-help`

## Why

PC Pal exists to help elderly and beginner computer users. The three accessibility blockers most commonly cited for that audience — small text, low contrast, and not knowing what to ask — are not currently addressed in the live app. A user opens PC Pal, sees a near-empty chat screen and a single text input, and has to invent what to type. Vision-impaired users have no in-app way to enlarge text or flip to a high-contrast theme. Users with motor difficulty or hand fatigue have no way to dictate questions or have replies read aloud.

This feature delivers a baseline that covers the WCAG 2.1 essentials our audience needs, plus a tap-to-start tile grid that removes the blank-page problem entirely.

## What ships

### A persistent accessibility bar

A horizontal control strip rendered above the main app shell. Always visible (does not hide on scroll). Three controls:

- **Text size:** `A−` / readout / `A+`. Three tiers (`normal` 18px → `large` 21px → `xlarge` 24px), proportional bumps to every font-size design token. Disabled-state on the bounds.
- **High contrast:** toggle. When on, swaps the color palette to pure black on pure white with thicker borders and a strong primary blue (`#003eb8`). Implemented as a `data-contrast="high"` attribute on `<html>` so every component using design tokens picks up the change automatically.
- **Read aloud:** toggle. When on, every assistant message is spoken via `SpeechSynthesis` at 0.95× rate (calmer cadence for older listeners). Markdown (`**bold**`, `[links](...)`, `` `code` ``) is stripped before speaking.

Preferences persist to `localStorage` under key `pcpal:a11y-prefs`. The hook reapplies them to `<html>` data attributes on every change.

### A microphone button on the message input

Rendered in the chat input area next to Send. Visible only when `SpeechRecognition` is supported (Chromium-based browsers; gracefully hidden on Firefox). Click to dictate; the transcript is dropped into the input field for the user to review and send. Reading aloud is automatically cancelled before listening starts to prevent the TTS voice from feeding back into the microphone.

### A quick-help tile grid on the empty chat screen

When the chat thread is empty, render a grid of large emoji tiles (220px+ desktop, 150px+ mobile, 48px emoji, 4px focus ring). Each tile, when tapped, drops a natural-sounding starter prompt into the chat:

- 📶 **Connect to Wi-Fi** → "I need help connecting to Wi-Fi."
- ✉️ **Send an email** → "I'd like to send an email — please walk me through it."
- 🛡️ **Is this a scam?** → "I think I might be looking at a scam — can you help me check?"
- (5 more from copy-paste, print-document, restart, screenshot, video-call skills.)

Tile order, label, emoji, and starter prompt all live in the existing skill JSON files under new fields (`quickHelp: true`, `quickHelpLabel`, `quickHelpEmoji`, `quickHelpStarter`, `quickHelpOrder`). The grid is data-driven — adding a new tile is a one-line edit to a skill JSON.

## Architecture

### Frontend modules

| Module | Path | Responsibility |
|---|---|---|
| `AccessibilityBar` | `client/src/components/Layout/AccessibilityBar.{jsx,css}` | Renders the three-control strip. Pure presentation; takes `prefs` + handlers as props. |
| `useAccessibilityPrefs` | `client/src/hooks/useAccessibilityPrefs.js` | Owns prefs state, persists to localStorage, applies `data-text-size` / `data-contrast` to `<html>`. |
| `useSpeech` | `client/src/hooks/useSpeech.js` | Wraps `SpeechSynthesis` (TTS) + `SpeechRecognition` (STT). Exposes capability flags so the UI can hide unsupported features. |
| `QuickHelpGrid` | `client/src/components/Chat/QuickHelpGrid.{jsx,css}` | Fetches `/api/skills/quick-help` once on mount; renders the tile grid; calls `onSelect(starter)` on tap. Hides itself on fetch error rather than blocking the empty state. |
| Theme tokens | `client/src/styles/globals.css` | New `:root[data-text-size="large"]`, `:root[data-text-size="xlarge"]`, and `:root[data-contrast="high"]` rule blocks. |

### Backend modules

| Module | Path | Responsibility |
|---|---|---|
| Quick-help endpoint | `server/routes/skills.js` | `GET /api/skills/quick-help` returns the curated tile list. Reads from `getAllSkills()` and filters by `quickHelp === true`, sorted by `quickHelpOrder` then `name`. |
| Endpoint test | `server/__tests__/skillsRoute.test.js` | Verifies endpoint returns 200 with valid tile shape; verifies sort order. |
| Skill JSON opt-in | `server/skills/{wifi,send-email,scam-protection,copy-paste,print-document,restart,screenshot,video-call}.json` | New fields: `quickHelp`, `quickHelpLabel`, `quickHelpEmoji`, `quickHelpStarter`, `quickHelpOrder`. |

### Wiring (the integration work)

The savepoint commit (`ef7ca7f` on local `refactor/remove-buddy-system`) targets the *old* chat architecture (`Chat/ChatWindow.jsx`, `Chat/MessageInput.jsx`). Current `main` uses `ChatScreen/` with `InputArea`, `MessageThread`, `ShellLayout`. Integration is therefore a re-do, not a copy:

1. **Mount `AccessibilityBar` in `ShellLayout`** (above the `<main>` content area, so it appears on every view, not just chat). Read prefs from `useAccessibilityPrefs` at the App level and pass handlers down.
2. **Add the mic button to `ChatScreen/InputArea.jsx`** using `useSpeech` for STT. Match the existing button styling.
3. **Mount `QuickHelpGrid` in `ChatScreen/MessageThread.jsx`'s empty branch.** When tapped, the starter prompt should call the existing `sendMessage()` from `useChat`.
4. **Hook read-aloud into the response handler in `useChat.js`.** When a `response` arrives and `prefs.readAloud === true`, call `speak(text)`. Implementation: pass `prefs` from `useAccessibilityPrefs` (lifted to App-level) into `useChat` as a parameter. Avoid creating a new context for now; the prefs already live at App scope. If a third consumer appears later, refactor to context then.
5. **Register the new router in `server/index.js`:** `app.use('/api/skills', require('./routes/skills'))`.

### Data flow (read aloud)

```
WebSocket 'response' arrives in useChat
  → setMessages([..., assistantMsg])
  → if prefs.readAloud: speak(assistantMsg.text)
    → useSpeech cancels any in-flight utterance
    → SpeechSynthesis.speak(stripForSpeech(text))
```

### Data flow (mic)

```
User taps 🎤 in InputArea
  → useSpeech.startListening(onResult)
  → user speaks
  → SpeechRecognition fires onresult with transcript
  → input field value <- transcript
  → user reviews and clicks Send
  → standard sendMessage() path
```

### Data flow (quick-help tile)

```
QuickHelpGrid mounts in empty MessageThread
  → fetch('/api/skills/quick-help')
  → server reads server/skills/*.json, filters quickHelp === true
  → tiles render
  → user taps a tile
  → onSelect(starter) -> sendMessage(starter)
  → MessageThread re-renders with the user message
  → empty state (and grid) disappear
```

## What's already in `ef7ca7f`

| Status | File |
|---|---|
| ✅ Drops onto main as-is | `client/src/components/Layout/AccessibilityBar.{jsx,css}` |
| ✅ Drops onto main as-is | `client/src/hooks/{useAccessibilityPrefs,useSpeech}.js` |
| ✅ Drops onto main as-is | `client/src/components/Chat/QuickHelpGrid.{jsx,css}` |
| ✅ Drops onto main as-is | `server/routes/skills.js` |
| ✅ Drops onto main as-is | `server/__tests__/skillsRoute.test.js` |
| ✅ Drops onto main as-is | The CSS rule blocks added to `globals.css` |
| 🔧 Merge fields, do not overwrite | The `quickHelp*` fields on the 8 skill JSONs — main's JSONs may have evolved prompts; we only add the new keys, never replace existing content |
| 🔧 Re-do against new architecture | `App.jsx` mounting, `MessageInput` mic, `ChatWindow` empty state, `server/index.js` registration |
| 🚫 Discard | `bash.exe.stackdump` (Cygwin crash dump, not source) |

## Testing

- **Unit:** existing test suite must stay green. New endpoint test (`skillsRoute.test.js`) verifies tile shape and sort.
- **Manual smoke test (golden path):**
  1. Open the app. Accessibility bar visible.
  2. Click `A+` twice. Every text in the app gets larger.
  3. Toggle high-contrast. Background goes white, text goes black, borders thicken.
  4. Open chat. See empty state with tile grid.
  5. Tap "Connect to Wi-Fi" tile. Starter prompt sends. Response arrives.
  6. Toggle read-aloud. Send another message. Response gets spoken.
  7. Click 🎤 on input. Say "How do I send an email?" Stop. Input populates with transcript. Send.
  8. Reload the page. Prefs persist.
- **Edge cases:**
  - Firefox: mic button hidden; everything else works.
  - `localStorage` quota or private mode: prefs default and don't crash.
  - `/api/skills/quick-help` 500s: grid hides, empty state still renders without it.
  - Mid-utterance read-aloud + mic press: speech stops, then mic activates (no feedback loop).

## Out of scope

- Per-message "speak this" buttons (could be added later; for now read-aloud is global).
- Voice-as-output for the user side (only TTS for assistant messages).
- Wake-word / hands-free mode.
- Dyslexia-friendly font (OpenDyslexic). Could be a future text-style tier.
- Keyboard shortcut bindings (`Ctrl++` / `Ctrl+-`).
- Translating tile labels/starters (English only).
- Screen reader audit beyond ARIA labels already on components.
- Reordering tiles by user history (always uses `quickHelpOrder` from JSON).

## Risks

- **TTS browser variance.** `SpeechSynthesis` voices are wildly different across browsers and OSes. Some sound robotic. Mitigation: use defaults (no voice selection); rate set to 0.95 has been shown to help.
- **Tile JSON drift.** As skill JSONs evolve, someone could remove a `quickHelp*` field and silently break a tile. Mitigation: server filters defensively and the test asserts a non-empty list at startup.
- **High-contrast mode and existing components.** Components that hardcode color values (instead of using design tokens) won't switch. Mitigation: visual smoke test covers the main flow; out-of-scope components can be patched in follow-ups.

## Definition of done

- New branch `feature/accessibility-quick-help` off latest `origin/main`.
- All files in the "drops onto main as-is" list copied over.
- Integration done in `ShellLayout`, `ChatScreen/InputArea`, `ChatScreen/MessageThread`, `useChat`, `server/index.js`.
- `npm test` passes.
- Manual smoke test passes (all 8 golden-path steps).
- README updated with a short "Accessibility" section.
- PR opened against `main`. CI green. Ready for review.
