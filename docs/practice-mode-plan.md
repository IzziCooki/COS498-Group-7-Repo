# Practice Mode — Implementation Plan

## What it is

A safe simulation mode where elderly users practice computer tasks step-by-step before doing them for real. The agent walks them through what each screen looks like, what to click, and what happens — without touching their actual computer. When they're comfortable, they switch to "do it for real" and the agent guides them through the actual task.

## Why it matters

- **82%** of homebound seniors cite "uncertainty on how to use devices" as their #1 barrier ([NIH/PMC, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12464506/))
- **50.8%** report "discomfort in learning new things" — fear, not inability
- The #1 barrier is **fear of breaking their device** (Marquié et al., 2002)
- No existing tool lets seniors practice safely before doing it for real

## User experience

```
User: "I want to practice sending an email"

Agent: "Let's practice! I'll show you each step — nothing will
happen to your computer until you say you're ready for real."

[Side panel shows: Practice Mode — Sending an Email]
  Step 1 of 5: Open your email app
  [Visual: screenshot/illustration of where to find the email app]
  [Description: "Look in the bottom-left corner for the envelope icon"]
  [Button: "I understand — next step"]
  [Button: "I'm confused — explain differently"]

  Step 2 of 5: Click "Compose" or "New Email"
  [Visual: where the compose button is]
  ...

After all 5 steps:
  "Great! You practiced all the steps. Want to try it for real
   on your computer now? I'll walk you through the same steps,
   but this time it'll actually send."

  [Button: "Yes, let's do it for real!"]
  [Button: "Let me practice again first"]
```

## Architecture

### What we can reuse (no changes needed)

| Existing system | Reuse for practice mode |
|---|---|
| `create_guide` MCP tool | Practice guides are guides with a `practice: true` flag |
| `CommandGuide.jsx` | Same component renders practice steps (no commands, just descriptions) |
| `SidePanel.jsx` | Practice guide opens in side panel exactly like regular guides |
| `StepSequence` model | Track practice progress (current_index, completed) |
| `StepSequencePanel.jsx` | Shows current step, "Done — next step!" button |
| Skill matcher | New practice-specific skill triggers |
| Memory system | Save practice completions as breakthroughs |

### What needs to be built

#### 1. Practice content registry (`client/src/components/Chat/practiceRegistry.js`)

Static practice content for each teachable skill — like `guideRegistry.js` but with richer step data:

```js
const practiceRegistry = {
  send_email: {
    title: "Sending an Email",
    totalSteps: 5,
    steps: [
      {
        instruction: "Find the email app on your computer",
        visual: "email-icon", // references a visual guide component
        whereToLook: "bottom-left corner of your screen",
        whatItLooksLike: "a small picture of an envelope",
        variants: {
          Windows: { app: "Outlook or Mail", location: "taskbar or Start menu" },
          Mac: { app: "Mail", location: "the dock at the bottom" },
          Android: { app: "Gmail", location: "your app drawer" },
          iPhone: { app: "Mail", location: "your home screen" },
        },
        confirmPrompt: "Can you picture where to find it?",
        confusedResponse: "Look at the very bottom of your screen...",
      },
      {
        instruction: "Click 'New Email' or 'Compose'",
        visual: "compose-button",
        whereToLook: "top-left area of the email app",
        whatItLooksLike: "a button that says 'New' or a pencil icon",
        // ...
      },
      // ... 3 more steps
    ],
    realModeTransition: "Now let's do it for real! Open your email app — I'll guide you through each step.",
  },
};
```

**Initial content**: 5-7 core tasks (send email, copy/paste, take screenshot, connect Wi-Fi, open browser, make text bigger, restart computer) — these align with the existing `guideRegistry.js` tasks.

#### 2. Practice mode MCP tool (`server/mcp/pcpalTools.js`)

```js
const startPractice = tool(
  'start_practice',
  "Start a practice session for a task. The user practices each step in a safe simulation before doing it for real. Use when the user says 'practice', 'let me try first', or seems nervous about a task.",
  {
    task_id: z.string().describe('Which task to practice (send_email, copy_paste, etc.)'),
  },
  async (args) => {
    // Create a practice-type step sequence
    // Return the practice guide data
  }
);
```

#### 3. Practice skill (`server/skills/practice-mode.json`)

```json
{
  "id": "practice_mode",
  "name": "Practice Mode",
  "triggers": ["practice", "let me try first", "can I practice",
    "I'm scared", "what if I break", "afraid to try",
    "nervous", "simulate", "pretend", "dry run"],
  "prompt": "The user wants to practice before doing it for real.
    Use start_practice with the relevant task_id. Be extra
    reassuring: 'Nothing will happen to your computer — this is
    just practice!'"
}
```

#### 4. Practice UI component (`client/src/components/Chat/PracticeMode.jsx`)

A specialized version of CommandGuide that:
- Shows a "PRACTICE MODE" banner (green, reassuring)
- Each step has a visual description (not a command)
- "I understand" and "Explain differently" buttons instead of Copy/Run
- Progress bar showing which step they're on
- At the end: "Try for real" or "Practice again" buttons
- No terminal commands — purely visual/descriptive

#### 5. Database tracking

```sql
CREATE TABLE IF NOT EXISTS practice_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  confusion_count INTEGER DEFAULT 0,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  transitioned_to_real INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

This tracks:
- How many times each user practiced each task
- How many steps they needed help on (confusion_count)
- Whether they transitioned to "do it for real" after practicing
- Completion rate — for the agent's memory and for research metrics

## Implementation phases

### Phase 1: Core practice flow (2-3 days)

1. Create `practiceRegistry.js` with 3 tasks (send_email, copy_paste, open_browser)
2. Create `start_practice` MCP tool
3. Create `practice-mode.json` skill
4. Create `PracticeMode.jsx` component
5. Add `practice_sessions` table to schema
6. Wire through the artifact pipeline (side panel rendering)

### Phase 2: Adaptive practice (1-2 days)

7. Track confusion per step — if user clicks "Explain differently" 2+ times on a step, the agent remembers this as a struggle
8. Save practice completions as memory breakthroughs
9. When the user asks to do a task they've practiced, the agent says "You practiced this last week — want to try it for real this time?"

### Phase 3: Rich visuals (2-3 days)

10. Add device-specific visual illustrations for each step (simple SVG or CSS diagrams showing where to click — same approach as `VisualGuide.jsx`)
11. Add keyboard shortcut display for relevant steps
12. Add "What it should look like after this step" confirmation images

### Phase 4: "Do it for real" transition (1 day)

13. When user clicks "Try for real", switch from practice content to the actual `create_guide` flow with real commands/instructions
14. Agent's system prompt shifts from "this is practice" to "now guide them through the real task"
15. If the relay agent is connected, the agent can verify each step was actually completed

## How it connects to existing systems

```
User: "I want to practice sending an email"
    │
    ├── Skill matcher → practice-mode.json skill
    │
    ├── Agent calls start_practice("send_email")
    │     ├── Creates practice_session in DB
    │     └── Returns practice guide data via side-channel
    │
    ├── Side panel opens with PracticeMode component
    │     ├── Shows step 1 with visual + description
    │     ├── "I understand" → advance to step 2
    │     └── "Explain differently" → agent rephrases
    │
    ├── User completes all steps
    │     ├── save_memory("breakthrough", "Practiced sending email")
    │     └── practice_session updated (completed=1)
    │
    └── "Try for real?" → switches to create_guide with real steps
```

## What makes this different from just using create_guide

| create_guide (current) | Practice mode (new) |
|---|---|
| Shows real commands | Shows descriptions only |
| "Run" button executes commands | "I understand" confirms comprehension |
| One pass through | Can restart, go back |
| No tracking | Tracks confusion, completion, transition |
| Agent assumes user will follow | Agent confirms understanding each step |
| Same for all comfort levels | Extra reassurance for comfort 1-2 |

## Cost estimate

- **New files**: ~5 (practiceRegistry.js, PracticeMode.jsx, PracticeMode.css, practice-mode.json, schema migration)
- **Modified files**: ~4 (pcpalTools.js, SidePanel.jsx, ChatWindow.jsx, useChat.js)
- **New DB table**: 1 (practice_sessions)
- **Content creation**: 5-7 task practice scripts (the most time-consuming part)
- **Estimated total**: 500-800 lines of new code + 200-300 lines of practice content

## Research metrics this enables

Once practice mode is live, we can measure:
1. **Practice → real conversion rate**: How often do users who practice actually do the task for real?
2. **Confusion hotspots**: Which steps cause the most "explain differently" clicks?
3. **Confidence growth**: Does practice completion correlate with higher comfort_level over time?
4. **Retention**: Do users who practiced a task remember it better on spaced repetition reviews?

These directly support the project's research claims about behavioral science-informed teaching.
