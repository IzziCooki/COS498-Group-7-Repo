# Researcher Read-Aloud Script

Use this verbatim where bolded. Improvise minimally.

**Total budget: ~40 minutes.** Watch the clock — if you fall behind, drop the free-form task before the post-session interview, NOT the Likert form.

---

## Pre-session checklist (do BEFORE participant joins)

- [ ] Zoom recording armed. Local recording ON.
- [ ] Counterbalance order pulled from `participants.csv` (odd participant_id → PC Pal first, even → ChatGPT first).
- [ ] PC Pal test account ready: `pcpal-pXX@…` already onboarded with comfort level **"Just learning"** and the participant's device type. Tab open at https://celebrated-harmony-production-d339.up.railway.app/.
- [ ] ChatGPT tab open and ready (free tier, logged out OK).
- [ ] Google Form tab with participant_id pre-filled.
- [ ] `task_log.csv` open. New row stub for this participant.
- [ ] Stopwatch / phone timer ready.

---

## 1. Welcome & consent (~3 min)

> **"Hi [name], thank you so much for joining. Before we start, can I confirm you got the email I sent earlier with the participant acknowledgment?"**
>
> *(Wait for yes.)*
>
> **"Great. I want to be clear about a few things before we begin:**
>
> - **You are helping us test a chatbot we built for a class. We are testing the tool, not you. There are no right or wrong answers.**
> - **You can stop at any time, skip any question, end the session for any reason. No explanation needed.**
> - **I'm going to record the Zoom call. I'll delete it within 30 days, and your name won't appear in our report — only a participant code.**
> - **I'll never ask for any passwords or private info. If anything asks for that, just tell me.**
>
> **Are you OK with all of that, and OK if I start recording now?"**

*(Start recording. Re-confirm consent on tape.)*

---

## 2. Warm-up (~3 min)

> **"Before we start the tasks, just two quick questions to help me understand where you're coming from. There are no wrong answers."**
>
> 1. **"On a scale of 1 to 5, where 1 means 'I'm just learning' and 5 means 'I'm very confident', how would you rate yourself with computers and phones?"**
> 2. **"What kind of device do you usually use — a Windows computer, a Mac, an iPhone, an Android phone, or something else?"**

*(Note both answers in `task_log.csv` `notes` column. Make sure the PC Pal test account's onboarding matches their device.)*

---

## 3. Tasks (~25 min)

You'll run 3 tasks × 2 conditions = 6 task-runs total. Order is dictated by the counterbalance assignment. After each task-run, the participant fills the per-task Google Form before moving on.

### 3a. Read-aloud framing (do ONCE, before the first task)

> **"Now I'll give you three short situations. For each one, you'll try it twice — once with PC Pal, once with ChatGPT — so we can compare. After each try, I'll send you a quick 1-minute survey."**
>
> **"While you're working, please **think out loud** — say whatever comes to mind, even if it's confusing or you don't know what to do. That's the most useful thing for us. I'll be quiet unless you ask me a question. If you get really stuck, that's fine — just tell me you'd like to move on and we will."**

### 3b. Per-task wording (read EXACTLY at the start of each task)

For each task, fill in the condition and tool name:

> **"For this task, I'd like you to use [PC Pal / ChatGPT]. Here's the situation:"**

**Task `wifi` — Wi-Fi recovery**
> **"Imagine your Wi-Fi just stopped working and you can't get on the internet. Use [PC Pal / ChatGPT] to figure out how to reconnect. You don't actually have to disconnect — just go through the steps as if you were doing it for real. When you feel like you'd be back online, tell me you're done."**

**Task `scam` — Scam detection**
> **"Imagine you got a phone call. The person said they're from Microsoft and that your computer has a virus. They want you to pay $200 and give them remote access to fix it. Ask [PC Pal / ChatGPT] what you should do."**

**Task `freeform` — Free-form**
> **"For this last one, ask [PC Pal / ChatGPT] anything you've actually been stuck on with your computer or phone — something that's bugged you in real life. Take a moment to think of one."**

### 3c. During the task

- **Start the timer** when the participant types or speaks their first message to the agent.
- **Stop the timer** when the participant says "I'm done" or has clearly stopped engaging.
- Tally **clarification requests** = any time the participant asks the agent to explain again, repeats their question, or asks "what does that mean?"
- **Stay silent** otherwise. If the participant goes quiet for ≥ 30 seconds, ask: **"What are you thinking right now?"** Nothing else.
- If the participant directly asks you for help, say: **"I want to see how you'd handle it just with the tool — give it your best shot, and if you really can't, tell me to move on."**
- Note the success outcome (binary — see `success_rubric.md`) in `task_log.csv` immediately after the task.

### 3d. After each task-run

> **"Great, that's the end of that one. Could you fill out this 1-minute survey before we move on?"**

*(Drop the Google Form link in the Zoom chat with the correct condition + task pre-filled in the URL. Wait until they hit submit.)*

---

## 4. Post-session interview (~5 min)

> **"Last part — just three questions, and then we're done."**
>
> 1. **"Comparing PC Pal and ChatGPT, what was the biggest difference for you?"**
> 2. **"Was there a moment in either one that was especially helpful or especially confusing?"**
> 3. **"If you could change one thing about PC Pal, what would it be?"**

*(Take notes in `task_log.csv` `notes` column or a separate `interviews_raw.md` file. Recording is the backup.)*

---

## 5. Final survey + wrap (~3 min)

> **"One last 2-minute survey — this one is about your overall impression, not the individual tasks."**

*(Drop the post-session Google Form link in chat. Wait for submission.)*

> **"That's everything! I'll send your $15 gift card by email today. Thank you so much — this is genuinely useful for us."**

*(Stop recording. Save it with filename `pXX-YYYY-MM-DD.mp4`.)*

---

## Post-session housekeeping (do IMMEDIATELY after they leave)

- [ ] Save Zoom recording to the project drive.
- [ ] Append final row to `task_log.csv`.
- [ ] Spot-check that 6 per-task survey responses + 1 post-session response landed in the Form.
- [ ] Send the gift card.
- [ ] Free-write 3 sentences in `interviews_raw.md` about anything notable while it's fresh.

---

## Hard rules

- **Don't coach.** If a participant fails a task, that's data. Do not save them.
- **Don't react to scam content.** If the participant correctly identifies the scam, just say "OK, what would you do next?" — don't congratulate or correct.
- **Don't compare conditions in front of them.** Never say "yeah PC Pal does that better" — it biases the second condition's ratings.
- **Don't fix typos in PC Pal or ChatGPT.** Watch the participant struggle if needed; that's a finding.
