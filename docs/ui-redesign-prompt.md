# PC Pal UI Redesign — Claude Canvas Prompt

Copy everything below the line into a new Claude conversation with Canvas enabled.

---

You are designing a complete mobile-first UI for **PC Pal**, an AI-powered IT tutor for elderly and beginner computer users (65+ demographic). The app currently works but has an inconsistent, desktop-only layout. Your job is to design a streamlined, accessible interface that works beautifully on phones, tablets, and desktops — then produce spec artifacts I can hand directly to an engineer (Claude Code) to implement.

## What PC Pal Is

PC Pal is a real-time chat app where an AI agent (Claude) patiently teaches elderly users how to use their computers. It's like having a helpful grandchild who never gets frustrated. The AI can:

- Answer questions in plain, jargon-free language
- Create interactive step-by-step guides with screenshots and "Run" buttons
- Run read-only diagnostics on the user's computer (battery, disk, network, processes)
- Search YouTube for tutorial videos
- Look up verified support links (Apple Support, Microsoft, Google, wikiHow)
- Detect emergencies ("I've fallen") and scams ("Microsoft called me")
- Track skill progression with spaced repetition
- Practice mode — safe simulation before doing things for real
- Connect a "buddy" (family member/friend) who can observe, video call, and run diagnostics remotely

## Target Users

**Primary:** Margaret, 72, lives alone, wants to video call her grandchildren but doesn't know how. She's intimidated by technology, has poor vision, arthritic hands, and has been burned by scam calls before. She needs large text, obvious buttons, and patience.

**Secondary:** Margaret's daughter Sarah, 45, who acts as a "buddy" — she can check Margaret's progress, answer help requests, and occasionally join a session to run diagnostics on Margaret's computer remotely.

**Tertiary:** Admin users who review feedback and conversation quality.

## Current Tech Stack (Do NOT Change)

- React 19 + Vite (vanilla CSS, no Tailwind/CSS framework)
- Express + WebSocket backend
- BEM CSS naming convention (`.block__element--modifier`)
- CSS custom properties for theming (already defined in globals.css)
- No router — single-page app with conditional rendering in App.jsx

## Design Constraints (Non-Negotiable)

1. **18px minimum font size** everywhere — elderly users with presbyopia
2. **48px minimum touch targets** — arthritic hands, imprecise tapping
3. **High contrast** — WCAG AA minimum, AAA preferred
4. **prefers-reduced-motion** support — respect vestibular issues
5. **Keyboard navigable** — Tab order, focus rings, Enter/Space activation
6. **No jargon in the UI** — "internet app" not "browser", "helper" not "buddy"
7. **Patient pacing** — guides show 2 steps at a time, never walls of text
8. **Safety alerts must be unmissable** — red banner, full-width, with action button

## Current Problems to Solve

### Layout
- **Side panel is fixed 420px** — breaks on anything under 768px
- **Conversation sidebar is 280px minimum** — doesn't collapse properly on mobile
- **100vh layout** — causes issues with mobile browser address bars
- **No mobile navigation** — three-pane layout (sidebar + chat + side panel) doesn't work on phones
- **Artifacts (guides, videos, findings) compete with chat** — unclear where to look

### Mobile
- Only 8 of 22 CSS files have any media queries
- VideoCall component has zero responsive layout
- BuddyTerminal not usable on phone keyboards
- Modals don't go full-screen on small viewports
- No touch gestures (swipe to navigate, pull to refresh)

### UX
- Artifact navigation is confusing — small "Guide" tag in messages, separate side panel with arrows
- No clear visual hierarchy between chat, guides, and diagnostic results
- Onboarding is 6 steps but could be streamlined
- No empty states (blank screen when no conversations)
- Loading states are inconsistent (dots, text, nothing)
- No way to search past conversations
- Buddy features are hidden behind a small header button

## All Features That Must Be Surfaced

Design the UI to accommodate ALL of these. Every feature must be reachable within 2 taps from the main chat screen.

### Core Chat
1. **Message thread** — user messages (right, blue), AI messages (left, white with "PC" avatar)
2. **Text input** — large textarea, Send button, "Get Help" button for external resources
3. **Typing indicator** — animated dots when AI is thinking
4. **Safety alerts** — red full-width banner for emergencies/scams with action buttons

### Artifacts (appear during chat, need dedicated viewing)
5. **Step-by-step guides** — numbered steps with reference images, animated hotspots, copy/run buttons, pagination (2 steps/page)
6. **Diagnostic findings** — card with rows: label + value + status icon (green/amber/red)
7. **YouTube videos** — thumbnail grid, click to expand iframe, privacy-safe embed
8. **External resources** — categorized links (Watch/Read/Try) with source badges
9. **Practice mode** — simulation with progress bar, "I understand — next" button, completion checklist
10. **Screenshots** — annotated device screenshots with hotspot overlays

### Navigation & History
11. **Conversation list** — past chats with preview, date, active indicator
12. **New chat button** — prominent, always reachable
13. **End chat + feedback** — 5-star rating modal with optional comment

### User Profile & Settings
14. **Onboarding wizard** — name, device type, comfort level, learning goal, buddy opt-in
15. **Profile editor** — name, device, comfort level, AI model preference
16. **Memory viewer** — see what the AI remembers about you

### Buddy System ("My Helper")
17. **Invite/pair** — generate 6-char code, share with family member
18. **Buddy status** — show when helper is connected/observing
19. **Video call** — WebRTC with mute/camera/end buttons
20. **Buddy terminal** — helper runs diagnostics on learner's computer
21. **Help request** — learner asks buddy for help, buddy replies
22. **Progress sharing** — learner's skill completions visible to buddy

### Dashboard (for Buddy/Helper view)
23. **Learner profile card** — name, OS, comfort level, goal
24. **Skill progress** — bar chart + recent completions
25. **Safety alerts log** — emergency/scam detections
26. **Conversation history** — with ratings
27. **Help requests** — open questions from learner
28. **Shared milestones** — progress celebrations

### Desktop-Specific
29. **Connect computer** — modal with terminal instructions + code entry
30. **Screen sharing** — browser capture with status badge
31. **Local terminal** — command input + output display

### Admin
32. **Feedback dashboard** — filterable table of all ratings, expandable transcripts, AI suggestions

### Passive/Background
33. **Welcome back banner** — skills due for review, pending buddy replies
34. **Skill progression tracking** — spaced repetition reminders
35. **Vocabulary adaptation** — automatic, no UI needed
36. **Confusion detection** — automatic, adjusts AI behavior

## What I Need You to Produce

Create these deliverables in Canvas, one at a time. After each, I'll review and we'll iterate before moving to the next.

### Deliverable 1: Mobile Layout Architecture

Design the responsive layout system. Show me:
- **Phone** (<640px): How does the three-pane layout collapse? Where do artifacts go? How does navigation work?
- **Tablet** (640-1024px): Two-pane with swipe?
- **Desktop** (>1024px): Enhanced three-pane with the current sidebar + chat + panel?
- Navigation pattern: bottom tab bar? Hamburger? Swipe drawers?
- Where does each feature type live at each breakpoint?

Produce an **ASCII wireframe** for each breakpoint showing the layout skeleton. Label every region.

### Deliverable 2: Component Spec — Chat Screen (Mobile)

The single most important screen. Show me a detailed wireframe with:
- Message bubbles (user vs AI, with avatar)
- How artifacts appear inline vs expanded
- Input area with all buttons
- Typing indicator placement
- Safety alert banner position
- How to access: conversation list, buddy panel, settings, end chat
- Exact spacing, font sizes, touch target sizes

Produce a **detailed ASCII wireframe** with annotations for colors, spacing, and interaction notes.

### Deliverable 3: Component Spec — Guide Viewer (Mobile)

When the AI creates a step-by-step guide, this is the most important artifact. Show:
- Full-screen or card overlay?
- Step image with hotspot overlay
- Step text + note
- Copy/Run buttons for terminal commands
- Pagination (prev/next)
- How to return to chat
- Progress indicator

**ASCII wireframe** with interaction annotations.

### Deliverable 4: Component Spec — Onboarding Flow (Mobile)

Streamline the current 6-step onboarding. Consider:
- Can any steps be combined?
- Large touch targets for device selection
- Comfort level as a simple slider or emoji scale?
- Goal input with suggestions/examples
- Buddy opt-in with clear explanation

**ASCII wireframe** for each step.

### Deliverable 5: Component Spec — Buddy/Helper Experience (Mobile)

The buddy sees a different UI than the learner. Show:
- Dashboard overview (learner's progress at a glance)
- How to join a session and observe
- Video call overlay
- Terminal for running diagnostics
- Help request notifications
- How this differs from the learner's view

**ASCII wireframe** with role annotations.

### Deliverable 6: Navigation Map

A complete screen-by-screen flow diagram:
- Every screen the user can reach
- What triggers each transition (tap, swipe, AI action)
- Which screens are modals vs full pages
- Back navigation for every screen

**ASCII flow diagram** with arrows and labels.

### Deliverable 7: Design Tokens & Style Guide

Update the existing CSS custom properties for the redesign:
- Color palette (primary, secondary, success, warning, danger, surfaces)
- Typography scale (h1-h4, body, small, with exact px values)
- Spacing scale (xs through 2xl)
- Border radius scale
- Shadow scale
- Animation durations
- Focus ring styles
- Touch target sizes per breakpoint

Produce as a **CSS custom properties block** I can drop into globals.css.

### Deliverable 8: Implementation Spec for Claude Code

A structured markdown document that Claude Code can follow to implement the redesign:
- File-by-file changes (which components to modify, which to create, which to delete)
- CSS changes per component
- New responsive breakpoints
- Component prop changes
- Hook changes (if any)
- Migration path (what order to implement in)
- Testing checklist

This should be detailed enough that an AI coding agent can execute it without ambiguity.

## Design Inspiration

- **Apple Health app** — clean cards, large text, status colors
- **Google Messages** — simple chat with inline media
- **Calm app** — patient, uncluttered, large touch targets
- **Goodrx / MyChart** — elderly-friendly medical app patterns
- **WhatsApp** — familiar chat pattern for 65+ users (many already know it)

## Start With Deliverable 1

Begin with the Mobile Layout Architecture. Show me ASCII wireframes for phone, tablet, and desktop breakpoints with every region labeled. Explain your navigation pattern choice and why it works for elderly users.
