# Sandbox Mode Expansion — From Practice to Production

## Vision

Transform PC Pal's practice mode from text-based step descriptions into a **fully interactive visual simulation** where elderly users can click through realistic UI mockups of their device, see exactly what each screen looks like, and build muscle memory before touching their real computer.

---

## Tier 1: Interactive Visual Simulator (in-browser)

### What it is
A visual sandbox that renders simplified, interactive mockups of common UIs (email app, browser, settings) directly in the side panel. Users click on highlighted elements to advance through steps — building real spatial memory of where things are.

### How it works
```
Side Panel:
┌─────────────────────────────┐
│  🟢 PRACTICE: Send an Email │
│  Step 2 of 5                │
│  ━━━━━━━━░░░░░░░            │
│                              │
│  ┌──────────────────────┐   │
│  │ [Inbox] [Sent] [...]  │   │
│  │                       │   │
│  │  ✨ Click here ✨      │   │
│  │  ┌─────────────┐     │   │
│  │  │ + New Email  │ ←── │   │  ← Pulsing highlight
│  │  └─────────────┘     │   │
│  │                       │   │
│  │  From: you@email.com  │   │
│  │  Subject: ...         │   │
│  └──────────────────────┘   │
│                              │
│  Click the "New Email"       │
│  button to start writing.    │
└─────────────────────────────┘
```

### Implementation
- **React components that look like simplified app UIs** — not screenshots, not iframes, just styled divs that look like an email app, browser, settings panel
- Each "screen" is a React component with highlighted click targets (pulsing border/glow)
- Clicking the right target advances to the next step. Clicking wrong shows: "Not quite — look for the button with the envelope icon."
- Device-specific variants: Windows Mail vs Mac Mail vs Gmail

### What to build
1. `SimulatedScreen.jsx` — renders a simplified app mockup with click targets
2. `simulatorScreens/` directory — one file per simulated app:
   - `EmailApp.jsx` — inbox view, compose view, send confirmation
   - `BrowserApp.jsx` — address bar, search, navigation
   - `SettingsApp.jsx` — Wi-Fi, display, sound panels
3. Integrate into `PracticeMode.jsx` — replace text descriptions with interactive screens
4. Track click accuracy per step (for agent memory and research metrics)

### Effort: 3-5 days
### Impact: **Very high** — transforms practice from reading to doing

---

## Tier 2: Product Tour Overlay (on the real computer)

### What it is
When the user transitions from practice to "do it for real," the agent generates an **overlay guide** that highlights the actual elements on their screen — similar to [Whatfix](https://whatfix.com/product-tour/), [UserGuiding](https://userguiding.com/blog/best-product-tour-software), or [Intro.js](https://introjs.com/).

### How it would work
Via the relay agent + a lightweight Electron overlay:
1. User finishes practice, clicks "Do it for real"
2. Relay agent launches a transparent overlay window on top of their desktop
3. Overlay highlights the exact location of the next click target with a pulsing circle and tooltip
4. User clicks the real button → overlay advances to next step
5. If they click wrong, the overlay gently redirects: "Look a little to the left..."

### Why this is powerful
- Bridges the gap between simulation and reality — product tour tools like [WalkMe](https://www.walkme.com/blog/best-product-tour-software/) prove this approach works for software adoption
- Spatial learning: users build **real muscle memory** of where things are on their actual screen
- Research shows "learning in the flow of work" has [91% adherence](https://pmc.ncbi.nlm.nih.gov/articles/PMC8437506/) vs standalone training

### Implementation
1. Electron overlay window (transparent, always-on-top, click-through except on targets)
2. Screen region detection (relay agent takes screenshot → AI identifies UI elements → overlay positions highlights)
3. Step-by-step tour data from the practice registry
4. Fall back to text instructions if overlay isn't available

### Effort: 5-7 days
### Impact: **Highest** — but requires Electron/desktop mode

---

## Tier 3: Virtual Desktop in Browser (Kasm/WebVM)

### What it is
A full virtual desktop environment running in the browser via [Kasm Workspaces](https://medium.com/@plegg/quick-setup-of-a-virtual-machine-in-a-web-browser-using-kasm-and-docker-01f3445146d1) or [Browser.lol](https://browser.lol/). Users practice on a real OS without risking their own computer.

### How it works
- Kasm runs a Docker container with a lightweight Linux desktop
- Streams the desktop to the user's browser via WebRTC
- PC Pal's agent controls the VM and guides the user through tasks
- Mistakes have zero consequences — the VM can be reset instantly

### Why
- **True sandbox**: every app, every setting, every file operation is real but disposable
- Addresses the research finding that [82% of seniors cite "uncertainty" as their #1 barrier](https://pmc.ncbi.nlm.nih.gov/articles/PMC12464506/) — this eliminates it completely
- [Google's research on accessibility agents](https://research.google/blog/how-ai-agents-can-redefine-universal-design-to-increase-accessibility/) shows AI agents navigating UIs on behalf of users is a viable pattern

### Implementation
1. Kasm Docker container with XFCE desktop + pre-installed apps
2. Embed via iframe in the side panel
3. Agent sends keyboard/mouse commands to the VM via WebSocket
4. User follows along or takes over control
5. "Reset" button restores clean state

### Effort: 7-10 days (infrastructure heavy)
### Impact: **Very high** — but deployment complexity

---

## Tier 4: Community Practice Rooms

### What it is
Group practice sessions where multiple users practice the same task together, guided by the agent. Like a virtual classroom but asynchronous.

### How it works
1. Agent posts a "Practice Challenge" — "This week: learn to send an email with a photo!"
2. Users practice at their own pace in the sandbox
3. Progress is shared with the group (anonymized): "3 of 5 people in your group finished today!"
4. Buddy pairs can practice together — one watches while the other tries
5. Weekly "graduation" celebration when everyone completes the challenge

### Why
- [NSF-funded research shows intergenerational mentoring works](https://publichealth.gmu.edu/news/2025-09/helping-older-adults-embrace-ai-and-emerging-technologies-national-science-foundation) — group practice extends this
- Social accountability drives completion ([gamification achieves 91% adherence](https://pmc.ncbi.nlm.nih.gov/articles/PMC8437506/))
- Reduces isolation — learning together is less scary than learning alone

### Effort: 3-4 days (leverages existing buddy system)
### Impact: **Medium-high** — social motivation is a strong driver

---

## Tier 5: Adaptive Difficulty & AI-Generated Practice Content

### What it is
Instead of static practice scripts, the agent **generates practice content dynamically** based on what the user actually needs to learn, their device, and their past struggles.

### How it works
1. User: "I want to learn how to use Zoom"
2. Agent checks: no pre-built practice for Zoom in the registry
3. Agent generates practice steps on the fly using Claude:
   - Detects user's device (Mac)
   - Generates 5 steps specific to Zoom on Mac
   - Creates visual descriptions for each step
   - Includes "confused" alternatives based on the user's known struggles
4. Practice is saved for future users who ask the same thing

### Why
- Current practice registry only covers 3 tasks — users will quickly outgrow it
- [Adaptive UI research shows context-informed interfaces outperform static ones](https://link.springer.com/article/10.1007/s10515-025-00547-z)
- The agent already knows the user's device, comfort level, and past struggles — it should generate personalized practice

### Implementation
1. New MCP tool: `generate_practice(task_description)` — calls Claude to create practice steps
2. Cache generated practice in DB for reuse
3. Inject user's known struggles into generation prompt: "This user gets confused by right-click — avoid steps that require it"
4. Quality check: generated steps must include spatial language, analogies, and device-specific instructions

### Effort: 2-3 days
### Impact: **Very high** — infinite practice content

---

## Deployment Options

### HuggingFace Spaces (current)
- **Sandbox tiers available**: 1 (visual simulator), 4 (community), 5 (AI-generated)
- **Not available**: 2 (overlay requires desktop), 3 (VM requires infrastructure)
- **Persistent storage**: `/data` volume for SQLite (already configured)

### Electron Desktop App
- **All tiers available** including overlay (Tier 2)
- **Best experience** for practice → real transition
- Distribution: downloadable from website or app stores

### Docker Self-Hosted
- **All tiers including VM** (Tier 3) — run Kasm alongside PC Pal
- **Best for**: senior centers, libraries, community organizations
- Deploy with `docker-compose` — one command setup

### Mobile (PWA)
- **Sandbox tiers available**: 1 (visual simulator), 5 (AI-generated)
- Add `manifest.json` + service worker for installable PWA
- Touch-friendly practice UI for phone/tablet users
- **Offline practice**: cache practice content for use without internet

### Embedded Widget
- PC Pal as a widget on existing websites (senior centers, library portals)
- `<script src="pcpal-widget.js">` embeds the chat + practice panel
- Organizations customize which skills are available
- Lightweight: just the chat + practice, no diagnostics

---

## Priority Roadmap

| Priority | Feature | Effort | Impact | Dependencies |
|----------|---------|--------|--------|-------------|
| **1** | Tier 5: AI-generated practice | 2-3 days | Very high | None — works immediately |
| **2** | Tier 1: Visual simulator | 3-5 days | Very high | React components |
| **3** | Mobile PWA deployment | 2 days | High | manifest.json + service worker |
| **4** | Tier 4: Community practice | 3-4 days | Medium-high | Existing buddy system |
| **5** | Tier 2: Product tour overlay | 5-7 days | Highest | Electron mode |
| **6** | Embedded widget | 2-3 days | Medium | Script bundle |
| **7** | Tier 3: Virtual desktop | 7-10 days | Very high | Kasm infrastructure |

---

## Sources

- [Adaptive UI for Elderly (Springer, 2025)](https://link.springer.com/article/10.1007/s10515-025-00547-z)
- [LLM-Based Simulator for Daily Activities (ArXiv, 2025)](https://arxiv.org/html/2603.29856v1)
- [Google: AI Agents Redefining Universal Design](https://research.google/blog/how-ai-agents-can-redefine-universal-design-to-increase-accessibility/)
- [Whatfix Product Tours](https://whatfix.com/product-tour/)
- [Intro.js Interactive Walkthroughs](https://introjs.com/)
- [Kasm Web-Based Virtual Desktops](https://medium.com/@plegg/quick-setup-of-a-virtual-machine-in-a-web-browser-using-kasm-and-docker-01f3445146d1)
- [Browser.lol Virtual Browser](https://browser.lol/)
- [NSF Intergenerational AI Training Grant (GMU, 2025)](https://publichealth.gmu.edu/news/2025-09/helping-older-adults-embrace-ai-and-emerging-technologies-national-science-foundation)
- [Gamification 91% Adherence (PMC, 2021)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8437506/)
- [Barriers to Digital Health for Elderly (PMC, 2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12464506/)
- [Multi-Agent Interaction for Elderly (PMC, 2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9331633/)
