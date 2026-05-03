# PC Pal Redesign — Complete Package

This is the full redesign specification for PC Pal — an AI-powered IT tutor for elderly users (65+). It contains everything needed to take the existing desktop-only React app and turn it into a mobile-first, accessible, role-aware experience.

## How to use this package

There are eight deliverables. Read them in order at least once before starting work. Then point Claude Code at deliverable 8.

| # | File | What it is | Audience |
|---|---|---|---|
| 1 | `01-layout-architecture.md` | Responsive layout system, navigation pattern decision (bottom tabs), per-breakpoint placement of every feature | Designer + engineer |
| 2 | `02-chat-screen-mobile.md` | Pixel-level spec of the most important screen — message thread, input, banners, ⋯ menu, long-press menu | Engineer |
| 3 | `03-guide-viewer-mobile.md` | The full-screen artifact overlay shown when Margaret taps a guide. Includes terminal-command and completion variants | Engineer |
| 4 | `04-onboarding-mobile.md` | Streamlined 5-screen onboarding flow with comfort calibration, goal capture, and buddy opt-in | Engineer |
| 5 | `05-buddy-helper-mobile.md` | Sarah's complete UI: dashboard, watch sessions, video call, remote terminal, help requests, privacy guardrails | Engineer + privacy reviewer |
| 6 | `06-navigation-map.md` | Every screen, every transition, every modal — flow diagram for routing logic | Engineer |
| 7 | `07-design-tokens.css` | Drop-in replacement for `globals.css` — all colors, typography, spacing, motion, themes | Engineer |
| 8 | **`08-claude-code-prompt.md`** | **The executable migration prompt to send to Claude Code.** Phased, verifiable, integrates everything into the existing codebase | Claude Code |

## The headline decisions

- **Bottom tab bar on phone**, collapsible side rail on tablet/desktop. Hidden navigation is the #1 usability failure for the 65+ cohort.
- **Icon-only tabs** (no labels) with long-press tooltips, 3 or 4 tabs depending on whether a helper is paired.
- **Role-aware UI:** Margaret (learner) sees friendly blue Chat / History / Helper / Me. Sarah (helper) sees cooler blue Home / Sessions / Tools / Me, with a persistent "Helper mode" pill in the top bar.
- **Unified artifact chassis:** every artifact (guide, finding, video, resources, practice) is a card in the chat thread; tapping opens the full-screen overlay appropriate to that type.
- **Mascot avatar** for the AI — friendly illustrated character, not text initials.
- **5-screen onboarding** (down from 6) — name + device combined, comfort and goal stay separate, buddy stays its own moment.
- **Buddy features get genuine privacy guardrails.** Sarah cannot watch, run destructive commands, or initiate sensitive actions without Margaret's per-event consent. Every action is in Margaret's audit log.
- **18px minimum body, 48px minimum touch target, 56px primary, 96px call answer.** Tokens enforce this across the system.
- **AAA contrast where possible**, AA minimum. `prefers-reduced-motion` is a global gate. `100dvh` everywhere instead of `100vh`. Safe-area insets on all sticky elements.

## How to hand off to Claude Code

1. Place all 8 files (this README + 01–08) in a directory.
2. Open a Claude Code session in your existing PC Pal repo.
3. Send: *"Read the design package in [path] starting with 08-claude-code-prompt.md. Begin Phase 0."*
4. Review Phase 0's output (`MIGRATION_NOTES.md` with the codebase inventory) before approving Phase 1.
5. Verify each phase using the checklist embedded in Deliverable 8 before approving the next.

The migration is structured as 10 phases, each leaving the app in a working state. Don't let phases collapse into each other — the verify steps matter.

## Decisions you've already made

These were locked in during the design conversation:

| Decision | Value |
|---|---|
| Tab bar labels | Drop (icons only) |
| "Get Help" button behavior | Triggers AI to fetch external resources, generates Resources artifact |
| Helper tab visibility | Only when helper is paired |
| Practice mode entry | Its own destination (Me tab + contextual chat button) |
| Connect-computer flow on phone | Phone shows 6-digit code + URL, user types on computer |
| Top bar | Minimal title + ⋯ menu containing all secondary actions |
| AI avatar | Illustrated mascot |
| Suggestion chips | AI-generated dynamically from goal text |
| TTS toggle location | Persistent in top bar (not buried in menu) |
| Reduced-motion typing indicator | Replace dots with literal text "PC Pal is thinking…" |
| Long-press "Send to Sarah" | Available on both AI and user messages |
| Comfort screen | Forced 4-option, no skip |
| Buddy code generation | Immediate on completion, shown in chat welcome banner |
| Code-share flow | Post-onboarding (preserves 5-screen count) |
| AI tone calibration | Adapts to comfort level via system prompt |
| First-chat suggestion chips | Seeded from onboarding goal text |
| Run command (when no PC connected) | Visible-but-disabled with explanatory tooltip |
| Practice offer placement | Completion screen only (not also in chat) |
| Terminal command verification | Soft "Did it work?" Yes/No/Skip after Run/Copy |
| Voice input on Stuck sheet | Yes — mic button using Web Speech API |
| Multi-device guidance | Separate guides per device |

The remaining decisions are recorded in Deliverable 5 §12 and noted in Deliverable 8 with rationale — feel free to override any of them in the migration notes.

---

Built end-to-end on May 2, 2026, for the PC Pal redesign. Every decision is traceable to either the original brief or an explicit conversation choice.
