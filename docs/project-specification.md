# COS 498: Generative AI Agents - Agent Project Specification

**Spring 2026 - University of Maine**

---

## Team

| | |
|---|---|
| **Agent Name** | PC Pal |
| **Description** | AI tutor helping elderly users build lasting computer skills with buddy support |
| **Team Name** | Group 7 |
| **Team Members** | [Team Member 1], [Team Member 2], [Team Member 3], [Team Member 4] |

---

## 1. The Problem

**What are you trying to do?**

### Step 1 -- State the problem

Elderly adults are losing independence and social connection as essential daily tasks -- banking, healthcare, communication with family, government services -- move online. Over 57 million Americans aged 65 and older face a widening digital skills gap, but the support available to them is either too impatient (family help), too generic (AI assistants), too passive (video tutorials), or too expensive (professional tech support). The result is a growing population that cannot participate in increasingly digital daily life, leading to social isolation, missed healthcare, financial vulnerability, and lost autonomy.

### Step 2 -- Concrete example

Margaret is 72 years old and lives alone. Her grandchildren keep asking her to video call, but she doesn't know how to use the camera on her laptop. She tries searching YouTube for help, but the video assumes she knows what "Settings" means and where to find it. She calls her daughter, who tries to walk her through it over the phone, but gets frustrated after repeating "click the gear icon" five times -- Margaret doesn't know what a gear icon looks like. Margaret apologizes, says "never mind," and hangs up. She doesn't try again. Her grandchildren stop asking. Over the next year, Margaret's social contact decreases measurably, and she reports feeling "left behind by the world."

### Step 3 -- Prior solutions

Several approaches partially address this problem. **Video tutorials** (YouTube, wikiHow) provide free, visual instructions for common tasks. **Family and friend help** is the most common form of tech support for elderly users -- an estimated 75% of older adults turn to family first (Pew Research, 2024). **In-store support** (Apple Genius Bar, Best Buy Geek Squad, library programs) offers in-person guidance. **General-purpose AI assistants** (Siri, Alexa, ChatGPT) can answer tech questions conversationally.

### Step 4 -- Gap in prior solutions

These solutions fail to address three root causes simultaneously:

**No patience calibration.** Video tutorials move at a fixed pace. Family members lose patience. AI assistants give technically correct but overwhelming answers. None adapt to the specific moment-by-moment confusion an elderly learner experiences -- the blank stare at "click the gear icon" that means the instruction needs to be completely rephrased, not repeated louder.

**No retention mechanism.** All existing approaches treat each interaction as a one-time fix. The user completes the task with help but cannot do it independently a week later. There is no spaced repetition, no scaffolding fade, no mastery tracking. The user remains permanently dependent on the helper.

**No social accountability without dependency.** Family help creates a frustrating dynamic where the helper becomes impatient and the learner feels like a burden. But learning alone with an AI or a video is isolating and easy to abandon. No current solution provides social support and accountability (someone who sees your progress and cheers you on) while separating that from the actual teaching (so the human relationship isn't strained by the teaching task).

### Step 5 -- Design question

How might an AI agent, combined with a buddy accountability system and evidence-based learning science, help elderly users build lasting, independent computer skills -- while maintaining their social connection and autonomy?

---

## 2. Why Bother

**Why is this problem important, and why should we care about solving it?**

**The scale is enormous and growing.** There are 57.8 million Americans aged 65 and older (U.S. Census Bureau, 2023), a number projected to reach 82 million by 2050. Among them, approximately 25% have never used the internet (AARP, 2023), and 42% of adults 65+ do not own a smartphone (Pew Research Center, 2024). Yet the services they need are moving online: 75% of Medicare beneficiaries are now expected to manage their healthcare through patient portals, the IRS has shifted to digital-first filing, and most banks are closing physical branches in favor of online services.

**The consequences of inaction are severe and measurable.** Social isolation among elderly adults -- exacerbated by inability to use digital communication tools -- is associated with a 50% increased risk of dementia and a 29% increased risk of coronary heart disease (National Institute on Aging, 2021). During the COVID-19 pandemic, elderly adults who lacked digital skills were disproportionately cut off from telehealth, grocery delivery, and family contact. The AARP reports that digitally disconnected older adults are 3x more likely to report feeling lonely.

<!-- Note: These statistics come from published reports (Pew, AARP, NIA, Census). The team has verified the primary sources for the headline numbers. AI-generated detail below may benefit from additional verification. -->

**This problem has a sharp equity dimension.** Digital exclusion disproportionately affects low-income elderly adults (only 57% of those earning under $30K have home broadband vs. 92% of those earning $75K+), rural populations (where in-person support options are sparse), and elderly adults of color (who face compounding barriers of language, trust, and access). These are the same populations most affected by the shift to digital government services.

**The timing is right.** AI agents can now sustain patient, multi-turn conversational dialogue that adapts to the learner's pace -- something impossible with scripted chatbots even two years ago. The CollaborAITE platform provides the channel-based infrastructure needed for buddy collaboration: a learner and their helper can interact asynchronously around the AI's teaching, without needing to be online at the same time. This combination of patient AI + social scaffolding was not technically feasible at consumer scale before 2025.

---

## 3. Status Quo

**What are the current solutions and why do they fail?**

### Prior Solution 1: Video Tutorials and Online Guides (YouTube, wikiHow)

**Overview:** YouTube and written how-to guides are the most widely available free resources for learning computer tasks. Millions of tutorials exist for common tasks like sending email, connecting to Wi-Fi, and using video calling apps.

**How users currently use it:**
1. User has a tech question ("How do I send a photo in an email?")
2. User opens a web browser and searches (assuming they can navigate to a search engine)
3. User scrolls through results, selects a video or article
4. User watches/reads the guide, pausing and replaying as needed
5. User attempts to follow along on their own device
6. If stuck, user searches again or gives up

**Where it falls short:** Video tutorials assume a baseline of digital literacy that many elderly users do not have. The phrase "open Settings" in a YouTube video is useless to someone who does not know what the Settings icon looks like on their specific device. Tutorials are one-size-fits-all: a guide made for Windows 11 confuses a Windows 10 user, and a guide for Mac is incomprehensible to someone with a Chromebook. There is no feedback loop -- the tutorial cannot tell if the user successfully completed a step, cannot rephrase when they're confused, and cannot adapt its language. Most critically, there is no retention mechanism: the user who watches a video today cannot independently perform the task next week.

**How PC Pal differs:** PC Pal knows the user's specific device (collected during onboarding) and tailors every instruction to it. It uses a vocabulary filter that replaces jargon ("browser" becomes "internet app") calibrated to the user's comfort level. It confirms understanding at each step before advancing. It schedules spaced repetition reviews so the user practices the skill again in 7 days, building lasting independence rather than one-time completion.

---

### Prior Solution 2: Family and Friend Help

**Overview:** The most common form of tech support for elderly adults. A family member -- typically an adult child or grandchild -- walks the older adult through a task in person or over the phone.

**How users currently use it:**
1. User encounters a tech problem or wants to learn something new
2. User calls or waits to see a family member
3. Family member sits down (or talks over the phone) and walks through the task
4. User follows instructions, with the family member correcting in real time
5. Family member often takes over ("let me just do it for you") when frustrated
6. User thanks them, task is done, but the user didn't learn to do it independently

**Where it falls short:** This approach has a well-documented frustration dynamic. The helper has expertise but not teaching patience -- they skip steps that seem obvious, use jargon without realizing it, and grow visibly frustrated at repetition. The learner perceives this frustration, feels like a burden, and stops asking for help. A 2022 AARP study found that 40% of older adults said they avoid asking family for tech help because they "don't want to be a bother." Additionally, the family member typically does the task *for* the user rather than teaching them, creating dependency rather than skills. The interaction has no structure -- no steps, no progress tracking, no review.

**How PC Pal differs:** PC Pal separates the teaching role (handled by the AI, which has infinite patience) from the social support role (handled by the buddy). The AI never gets frustrated, never takes over, and never makes the user feel like a burden. The buddy -- a family member or friend -- receives progress updates ("Margaret just learned to send email!") and can answer asynchronous help requests, but is never put in the position of being the impatient teacher. This preserves the human relationship while providing structured learning. The buddy sees celebration, not frustration.

---

### Prior Solution 3: General-Purpose AI Assistants (ChatGPT, Siri, Alexa)

**Overview:** AI chatbots and voice assistants can answer tech questions conversationally. ChatGPT in particular can provide step-by-step instructions for almost any computer task.

**How users currently use it:**
1. User asks a question ("How do I connect to Wi-Fi?")
2. AI generates a multi-step response with instructions
3. User reads the response and attempts to follow along
4. If confused, user asks a follow-up question
5. AI provides additional detail

**Where it falls short:** General-purpose AI assistants are not designed for elderly users and fail them in specific, predictable ways. First, they use technical language without simplification -- ChatGPT will say "navigate to System Preferences" rather than "look for the picture of gears on your screen." Second, they provide too many steps at once: a 7-step instruction set overwhelms a comfort-level-1 user who can process 2 steps at a time. Third, they have no memory across sessions -- the user who learned to send email yesterday is treated as a complete stranger today. Fourth, they have no safety monitoring: if an elderly user mentions they've fallen or describes a scam call, ChatGPT provides generic advice rather than displaying an emergency alert. Fifth, they are entirely solo experiences with no social dimension.

**How PC Pal differs:** PC Pal is purpose-built for the elderly demographic with specific design decisions at every layer: vocabulary filtering that replaces 20+ technical terms automatically, comfort-level adaptation that limits brand-new users to 2 steps per response, persistent skill tracking across sessions with spaced repetition scheduling, emergency/scam detection that runs on every message *before* the AI even processes it, and a buddy system that connects the learning experience to a real human who cares about the user's progress.

---

## 4. Your Proposed Agent

### 4a. Agent Summary

PC Pal is a patient, conversational AI tutor that helps elderly and beginner computer users build lasting digital skills through a web chat interface. The core interaction loop is:

1. **Onboard** -- New users share their name, device, comfort level, learning goal, and optionally invite a buddy
2. **Learn** -- Users ask questions or request help; PC Pal responds with device-specific, jargon-free instructions using visual guide cards and step-by-step sequences
3. **Practice** -- After completing a skill, spaced repetition scheduling prompts the user to practice again in 7 days, with reduced scaffolding each time
4. **Share** -- Skill completions are shared with the user's buddy; the buddy can see progress and respond to help requests asynchronously

**Addressing the patience gap:** PC Pal's system prompt encodes specific behavioral rules: never say "simply," never give more than 2 steps at a time to comfort-level-1 users, always confirm understanding before advancing. A vocabulary filter automatically replaces 20+ technical terms. The agent never expresses frustration and always offers to rephrase.

**Addressing the retention gap:** Every completed skill is scheduled for spaced repetition review. On return visits, PC Pal prompts: "Last time you learned to send email. Want to practice again?" Scaffolding fades over repeated sessions: first time is full guide, second time offers a choice, third time gives only a hint.

**Addressing the social accountability gap:** The buddy system lets users invite a family member or friend via a simple 6-character code. The buddy sees celebration messages when skills are completed, and can answer asynchronous help requests when the AI isn't enough. The AI handles teaching; the human provides encouragement. Neither role creates frustration.

### 4b. Data Sources

**CollaborAITE Data Sources:**
- **User profile information:** Name, device type, comfort level, learning goal, vocabulary level, skill history. Used to personalize every response.
- **Channel conversations (including AI queries):** Prior interactions with PC Pal are loaded as conversation history (last 20 messages) to maintain continuity within a session.
- **User-uploaded documents:** Not currently used. Future: users could upload screenshots of error messages for diagnosis.

**What the agent deliberately does NOT access (privacy-by-design):**
- **Financial information:** PC Pal never asks about or accesses banking, spending, or financial data.
- **Health records:** While PC Pal detects emergency keywords and directs users to 911, it does not access or store health information.
- **Location data:** The buddy system uses invite codes, not location-based matching.
- **Other users' conversations:** Each user's learning history is private. Buddy relationships are opt-in and only share skill completion messages, not conversation content.

### 4c. Other Data Sources

**Skill Definition Database (16 JSON files)**
- **What it contains:** Trigger keywords, specialized prompts, difficulty levels, and category labels for 16 computer skills (copy/paste, send email, connect to Wi-Fi, take screenshot, etc.)
- **Why the agent needs it:** Enables automatic skill matching from natural language input and structured progression chains (copy/paste -> send email -> attach file)
- **How it's added:** Bundled with the application in `server/skills/*.json`
- **Maintenance:** Updated by the development team when new skills are added
- **Licensing:** Original content, no restrictions

**Vocabulary Substitution Map (JSON)**
- **What it contains:** 20+ technical term -> plain language mappings at 3 simplification levels (basic, intermediate, standard)
- **Why the agent needs it:** Ensures no jargon slips through in AI responses, regardless of what the LLM generates
- **How it's added:** Bundled with the application in `server/assets/vocabulary/basicSubstitutions.json`

### 4d. Human-Agent Collaboration Flow

```
User opens PC Pal (web or CollaborAITE)
    |
    v
[First visit?] --Yes--> Onboarding: Name -> Device -> Comfort -> Goal -> Buddy Invite
    |                                                                          |
    No                                                                    (generates
    |                                                                     invite code)
    v                                                                          |
Welcome Back Banner                                                            v
  - Skills due for review?  -----> "Want to practice [skill] again?"    Buddy enters
  - Buddy replied to help?  -----> Show buddy's response               code to connect
    |
    v
User asks a question or requests help
    |
    v
Safety Monitor (runs FIRST) --[emergency/scam]--> Alert + guidance
    |
    [safe]
    v
Task Classifier --> learn_skill | troubleshoot | follow_up
    |
    v
Agent Orchestrator (Claude + 16 tools)
    |-- show_visual_guide (device-specific guide card)
    |-- start_step_sequence (numbered walkthrough)
    |-- save_user_goal (capture life motivation)
    |-- schedule_skill_review (spaced repetition)
    |-- share_progress_with_buddy (celebration)
    |-- ask_buddy_for_help (human escape hatch)
    v
Vocabulary Filter --> simplified response
    |
    v
User sees response in chat
    |
    v
[Skill completed?] --Yes--> Celebration + share with buddy + schedule review
    |
    No (multi-turn continues)
```

### 4e. Example Interactions

**Interaction 1: First-time user learning to send email**

> **Learner context:** Margaret just completed onboarding. She selected Windows, comfort level 1 ("I'm brand new"), and set her goal as "Email photos to my grandkids."

```
@Margaret: How do I send an email?

@PC Pal: Great question, Margaret! Since you want to email photos
to your grandkids, learning to send email is the perfect first step.

Let me show you a guide first, then we'll do it together.

[Visual Guide Card: "Send an Email" - Windows steps with keyboard diagrams]

Let's start with just two steps:

Step 1 of 6: Look at the bottom of your screen. Do you see a long
bar with little pictures? That's called the taskbar. Find the
picture that looks like an envelope -- that's your email app.
Click on it.

Did that work? Tell me when you see the email app open.

@Margaret: I see it! There's a bunch of emails.

@PC Pal: You found it! Those are emails other people sent you.
Now let's write a new one.

Step 2 of 6: Look for a button that says "New" or "Compose" --
it might have a little plus sign (+) next to it. It's usually
near the top. Click on that.

Do you see it?
```

**Data sources used:** User profile (name, device, comfort level, goal), skill definitions (send_email.json), visual guide registry (send_email Windows variant)

---

**Interaction 2: Returning user -- spaced repetition review**

> **Learner context:** Margaret completed "Send an Email" 8 days ago. She opens PC Pal and sees the welcome-back banner.

```
[Welcome Back Banner]
"Welcome back, Margaret! Last time you learned Send an Email.
Want to practice it again?"
[Button: "Yes, let's practice!"] [Button: "Maybe later"]

@Margaret: [clicks "Yes, let's practice!"]
I'd like to practice Send an Email again

@PC Pal: I remember you learned this last week -- nice! Since
you've done it before, would you like me to walk you through
it step by step again, or would you like to try it on your own
and I'll help if you get stuck?

@Margaret: I'll try on my own

@PC Pal: Go for it! Open your email app and start writing
a new email. Let me know when you're done or if you need a hint.

@Margaret: I opened the email app and clicked New... but I
forget where to type the person's email address

@PC Pal: You're doing great -- you remembered how to find the
app and click New! The email address goes in the "To" box at
the very top of the new email. It should say "To" right next to it.

Now you can email photos to your grandkids anytime you want!
```

**Data sources used:** Skill review schedule (due date), skill events (prior completion), user profile (goal: "email photos to my grandkids")

---

**Interaction 3: Buddy help request flow**

> **Learner context:** Margaret is trying to attach a photo to an email and gets stuck. Her daughter Susan is her buddy.

```
@Margaret: I want to send a photo to my grandson but I
don't know how to put the photo in the email

@PC Pal: Let's attach a photo to your email! This builds
on sending email, which you already know.

Step 1 of 4: Open your email app and click "New" to start
a new email -- just like you practiced.

[StepSequencePanel with progress bar]
[Button: "Done -- next step!"]
[Button: "I need help with this step"]
[Button: "Ask my buddy for help"]

@Margaret: [clicks "Ask my buddy for help"]
Can my buddy help me with this?

@PC Pal: I've sent a message to Susan asking for help!
She'll reply when she can. In the meantime, would you
like to keep trying? I can explain the step differently.

--- Meanwhile, Susan sees in her buddy panel: ---

[Help Request from Margaret]
"Margaret needs help with: attaching a photo to an email"
Context: She was on Step 1 of 4 in "Attach a File to Email"

Susan replies: "Hi Mom! The paperclip button is what you
need -- it's the little paperclip picture at the top of
the email. Click that and then find the photo in your
Pictures folder."

--- Next time Margaret opens PC Pal: ---

[Welcome Back Banner]
"Good news! Susan replied to your question:
'The paperclip button is what you need -- it's the little
paperclip picture at the top of the email.'"
```

**Data sources used:** Buddy pair (Margaret + Susan), help request, skill events (prior email completion), step sequence state

### 4f. Harm Considerations

| Potential Harm | Likelihood | Design Safeguard | What If It Fails? |
|---|---|---|---|
| **Wrong device instructions** -- Agent tells a Mac user to press Ctrl+C (Windows shortcut), causing confusion and eroding trust | Medium | Device type is collected at onboarding and injected into every system prompt. Visual guides render OS-specific variants. The evaluation framework's `device_accuracy` metric flags any wrong-device references as CRITICAL. | User follows incorrect instructions and gets confused. They may lose trust in PC Pal. Mitigation: the vocabulary filter and evaluation framework catch most errors; user can report "that didn't work" and the agent rephrases. |
| **Learned helplessness** -- User becomes dependent on PC Pal and never develops independent skills | Medium | Scaffolding fade is built into the system prompt: first session = full guide, second = offer choice, third+ = hints only. Spaced repetition scheduling re-surfaces completed skills for independent practice. The agent explicitly asks "Would you like to try on your own?" | User always clicks "walk me through it" and never attempts independently. The buddy system provides an external accountability voice. If scaffolding fade fails, the user still has a functional support tool -- which is better than having no support at all. |
| **Over-reliance on AI for emergencies** -- User describes a medical emergency and waits for PC Pal's advice instead of calling 911 | Low | Safety monitoring runs on every message BEFORE AI processing. Emergency keywords trigger an immediate, prominent alert: "Please call 911 or your local emergency number right away." The agent does not provide medical advice. Emergency events are logged for caregiver review. | User sees the alert but doesn't act on it. The logged safety event can be reviewed by a caregiver or family member. PC Pal cannot force someone to call 911, but it ensures the guidance is immediate and prominent rather than buried in a chat response. |
| **Privacy breach via buddy system** -- Buddy sees private conversation content or personal information through the progress sharing feature | Low | The buddy system shares only skill completion messages ("Margaret learned to send email!") and explicit help requests -- never raw conversation content. Buddy pairing requires a mutual invite code (opt-in). All buddy features can be paused or ended. | A progress share message inadvertently reveals something the user didn't intend to share (e.g., skill name implies a sensitive context). Mitigation: AI generates the celebration message, keeping it generic and skill-focused rather than quoting conversation content. |

---

## 5. Technical Architecture and Design

### Tech Stack

| Component | Technology |
|---|---|
| Frontend | React 19, Vite 8, vanilla CSS |
| Backend | Node.js, Express 4, WebSocket (ws) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) with tool-use |
| Database | SQLite (via better-sqlite3) -- 12 tables |
| Image Processing | @napi-rs/canvas for annotated screenshots |
| Deployment | Standalone web app (agent.deanhauser.dev) + CollaborAITE integration (planned) |

### Message Processing Pipeline

Every user message flows through a 7-step pipeline:

1. **Safety Check** -- Emergency keywords and scam patterns detected (runs first, before AI)
2. **User Lookup** -- Load user profile (name, device, comfort level, vocabulary level, goal, skill history)
3. **Session Management** -- Get or create conversation session
4. **Task Classification** -- Claude classifies message as learn_skill, troubleshoot, follow_up, accessibility, or unknown
5. **AI Agent** -- Claude with 16 tools generates a response (up to 10 tool-use rounds)
6. **Vocabulary Filter** -- Jargon replacement + sentence length enforcement
7. **Save & Respond** -- Store in database, send via WebSocket

### Agent Tools (16)

| Tool | Purpose |
|---|---|
| `show_visual_guide` | Display device-specific visual guide card |
| `start_step_sequence` | Begin numbered walkthrough with progress bar |
| `advance_step` | Move to next step on user confirmation |
| `complete_step_sequence` | Mark task finished, log skill completion |
| `log_skill_started` | Record when a skill lesson begins |
| `suggest_next_skill` | Recommend next skill based on progression chains |
| `repeat_last_step` | Re-display current step without advancing |
| `adjust_vocabulary_level` | Dynamically change jargon filtering level |
| `save_note_for_user` | Save a tip for later reference |
| `get_user_notes` | Retrieve saved notes |
| `restart_conversation` | Clear session and start fresh |
| `flag_emergency` | Alert on medical/safety emergencies |
| `save_user_goal` | Record why the user is learning |
| `schedule_skill_review` | Schedule spaced repetition review |
| `share_progress_with_buddy` | Share skill completion with buddy |
| `ask_buddy_for_help` | Send help request to buddy |

### Database Schema (12 tables)

**Core:** users, conversations, messages, step_sequences, skill_events, safety_events, user_notes

**Collaboration:** buddy_pairs, progress_shares, help_requests

**Learning science:** skill_reviews, user_goals

### Implementation Timeline

| Phase | Deadline | What was built |
|---|---|---|
| v1 | Apr 14 | Core chat loop: onboarding, Claude integration, vocabulary filter, safety monitoring, visual guides, step sequences, skill tracking, demo mode |
| v2 | Apr 21 | Buddy system (invite codes, progress sharing, help requests), spaced repetition, scaffolding fade in system prompt, welcome-back experience, improved system prompt with behavioral science rules |
| v3 | Apr 28 | CollaborAITE integration, scaffolding fade automation, evaluation with real users, accessibility improvements |

---

## 6. Evaluation / Metrics of Success

**How do you know if you solved the problem?**

### 6a. Success Criteria

**Criterion 1: Users can independently perform a skill they learned with PC Pal**
- *How we observe it:* During the evaluation, users who completed a skill in a prior session are prompted to perform it again with scaffolding reduced. Success = the user completes the task with only a hint (no full walkthrough). We measure this via the scaffolding fade interaction pattern.

**Criterion 2: Users report feeling more confident with technology after using PC Pal**
- *How we observe it:* Pre/post confidence survey. Before the session: "On a scale of 1-5, how confident are you that you could [send an email / connect to Wi-Fi] on your own?" After: same question. We look for a measurable increase.

**Criterion 3: Agent responses are device-accurate, jargon-free, and elderly-appropriate**
- *How we observe it:* Run the automated evaluation framework on all conversation logs. Success = 0 device accuracy errors (CRITICAL), 0 jargon flags (WARNING), average response length under 150 words, and encouragement in 20%+ of responses.

**Criterion 4: The buddy system is used and valued**
- *How we observe it:* At least one user generates an invite code and connects with a buddy. In post-interaction interview, ask: "Did knowing someone could see your progress affect how you felt about learning?"

### 6b. Design Workshop Plan

**What we'll demo:** Live walkthrough of the buddy invite flow (generate code -> enter code -> see progress share) and a step-by-step skill teaching sequence (copy/paste with visual guide).

**Questions for peers:**
1. Is the invite code process simple enough for a 72-year-old to share with their daughter over the phone?
2. Does the vocabulary simplification feel natural or patronizing?
3. What's missing from the buddy panel that would make you actually use it?

**How we capture feedback:** Structured feedback form with the 3 questions above + open-ended "What would you change?" field. One team member takes notes on verbal feedback during the demo.

### 6c. Mini-Evaluation Plan

**Participants:** 2-3 users recruited from [class/community]. Ideally, at least one user aged 60+ and one user acting as a buddy (family member or peer).

**Task:** Users complete a guided learning task with PC Pal:
1. Complete onboarding (5 steps)
2. Ask PC Pal to help them with one skill (e.g., "How do I copy and paste?")
3. Complete the step sequence
4. (If buddy available) Generate an invite code and have the buddy connect

**Observation method:** One team member observes live (screen share or in-person), noting moments of confusion, delight, and abandonment. Conversation logs are exported automatically via the conversation export API.

**Feedback collection:** 5-minute post-session interview:
1. What was the easiest part?
2. What was the most confusing part?
3. Did PC Pal ever use a word you didn't understand?
4. Would you use this again? Why or why not?
5. (If buddy) Did the progress notification feel meaningful?

**Analysis:** We look for patterns in confusion points (same step? same jargon term? same UI element?), compare automated metrics (jargon count, device accuracy, encouragement rate) against the user's subjective experience, and identify the top 3 changes for v3.

### 6d. Final Evaluation Plan

**Automated analysis** of all collected conversation logs using the PC Pal evaluation framework:
- 10 structural metrics (turn count, question ratio, response length, step formatting, bold usage, device accuracy, jargon check, safety response, encouragement, steps per response)
- 6 rubric dimensions scored by the team (clarity, device accuracy, empathy, formatting, task completion, safety)

**Usage data analysis:**
- Skill completion rates (how many users complete a full step sequence?)
- Buddy adoption rate (what % of users generate an invite code? What % of codes are accepted?)
- Return rate (how many users come back for a second session?)
- Spaced repetition engagement (when prompted to review, what % of users say yes?)

**Qualitative synthesis** of interview feedback, observation notes, and conversation log review to identify the 3-5 most impactful improvements and make a recommendation on whether PC Pal should be deployed more broadly.
