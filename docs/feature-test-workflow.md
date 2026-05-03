# PC Pal Feature Test Workflow

Use this guide to verify all major features work correctly in the deployed app.

**Live URL:** https://celebrated-harmony-production-d339.up.railway.app/

---

## Setup

1. Open the URL in a browser
2. Create an account (or continue without one)
3. Complete onboarding (all steps are skippable)
4. You should land on the Chat tab

---

## Feature Tests

### 1. Email Guide (Manishjeet - PR #57)

**Type in chat:**
> How do I send an email in Gmail?

**Expected:** AI creates a step-by-step guide artifact card in the chat. Tap it to open the guide viewer. Should show numbered steps with real Gmail UI screenshots (compose button, recipient field, subject line, etc.).

**Also try:** "How do I send an email in Yahoo?" or "How about Outlook?"

---

### 2. Advanced Gmail Skills (Manishjeet - PR #57)

**Type in chat:**
> How do I read my email?

**Expected:** Triggers the read-email skill. AI walks through opening Gmail, finding unread messages, reading them.

**Also try:**
- "How do I organize my inbox?" (email-organize skill)
- "How do I search for an old email?" (search-email skill)
- "How do I reply to an email?" (reply-forward skill)
- "How do I find my drafts?" (email-drafts skill)

Each should produce a guide with Gmail-specific screenshots.

---

### 3. Video Call Guides (Frank - PRs #53, #54)

**Type in chat:**
> How do I make a video call on Zoom?

**Expected:** Multi-step illustrated guide with Zoom screenshots. Browser-aware (different steps for Chrome vs Safari). Includes a demo GIF.

**Also try:**
- "How do I FaceTime someone?" (6-step guide with FaceTime screenshots)
- "How do I call on Skype?" (10-step guide)
- "How do I use Microsoft Teams?" (10-step guide)

Each platform has its own set of illustrated steps and a demo GIF.

---

### 4. Animated Hotspots (Frank - PR #53)

**How to test:** During any illustrated guide (e.g., the Gmail send-email flow), look at steps that reference clicking a specific button. The gmail-compose-button step should show a **pulsing animated ring** overlaid on the screenshot, highlighting exactly where to click.

**What to look for:** Concentric rings that pulse outward from the click target. If `prefers-reduced-motion` is enabled in your OS settings, you'll see a static arrow + ring instead.

**Note:** Currently only the gmail-compose-button image has hotspot coordinates defined. Other images show the screenshot without the ring overlay.

---

### 5. Wi-Fi Connect Guide (Frank - PR #54)

**Type in chat:**
> How do I connect to Wi-Fi on Windows?

**Expected:** 6-step illustrated guide with Windows screenshots showing taskbar, Wi-Fi icon, network list, password entry, and connection confirmation. Includes a demo GIF.

**Note:** Mac/iPhone flows fall back to text-only instructions (no illustrated screenshots for those platforms yet).

---

### 6. Print Document Guide (Frank - PR #54)

**Type in chat:**
> How do I print something?

**Expected:** 5-step universal guide with screenshots showing Ctrl+P / Cmd+P, printer selection, settings, and print confirmation. Includes a demo GIF. Works for both Windows and Mac (with keyboard shortcut difference noted).

---

### 7. DLL Diagnosis

**Type in chat:**
> My program won't start, it says VCRUNTIME140.dll is missing

**Expected:** AI diagnoses the specific DLL, explains what it is, provides the official Microsoft download link, and walks through the fix. Should NOT suggest downloading DLLs from random websites.

---

### 8. Scam Detection

**Type in chat:**
> Microsoft called me and said my computer has a virus and I need to pay them to fix it

**Expected:** A red safety banner appears immediately at the top of the chat saying "This sounds like a scam." The banner has a "Tell me what to do" action button and requires explicit dismissal (can't tap outside to close it). The AI's response will include specific guidance about the scam.

**Also try:**
- "Someone wants me to buy gift cards to fix my computer"
- "Is this email from my bank legitimate?"

---

### 9. YouTube Video Search

**Type in chat:**
> Can you find me a video about how to use email?

**Expected:** AI calls the YouTube search tool and returns a video artifact card. Tap to open the video viewer. Videos play inside PC Pal via embedded YouTube player (privacy-safe, using youtube-nocookie.com). Multiple videos show as a list.

**Alternative trigger:** Click the "Get External Resources" button below the chat input. This searches for both YouTube videos and verified support links related to the current conversation topic.

---

### 10. Support Resource Lookup (Verified URLs)

**Trigger:** Click the "Get External Resources" button during any conversation, or ask the AI directly:
> Can you find me some help articles about Wi-Fi?

**Expected:** A resources artifact card appears. Tap to open. Shows categorized links from official sources (Apple Support, Microsoft Support, Google Support, wikiHow, etc.) with source badges. Links open in a new browser tab. All URLs are verified and curated, not AI-generated.

---

### 11. Practice Mode

**Type in chat:**
> Can I practice sending an email?

**Expected:** A practice artifact card appears. Tap to open practice mode (full-screen). Shows a safe simulation walkthrough with progress segments, step-by-step instructions, and "I understand - next" buttons. Completion shows a checklist of what you learned and a "Do it for real now" option.

**Built-in practice tasks:** send_email, copy_paste, open_browser (with device-specific variants for Windows/Mac/iPhone/Android).

---

### 12. Vocabulary Filter

**How to test:** During onboarding, select "Just learning" as your comfort level. Then chat normally. The AI's responses should avoid jargon -- for example, saying "internet app" instead of "browser", "the main screen" instead of "desktop", etc.

**Compare:** Create a second account with "Confident" comfort level. The same questions should produce responses with standard technical terminology.

---

### 13. Universal Troubleshooter

**Type in chat:**
> My computer is being weird, can you help?

**Expected:** The universal troubleshooter skill activates. AI follows a 4-phase playbook: (1) asks one clarifying question, (2) suggests 1-2 diagnostics, (3) proposes exactly one fix, (4) verifies or iterates. Should feel patient and systematic.

---

### 14. Spaced Repetition / Skill Progression

**How to test:**
1. Complete a guide (e.g., send-email)
2. The AI should offer to schedule a review reminder
3. Log out and log back in after the review period
4. The welcome-back banner should show "You're due to practice [skill]" with a quick practice button

**Check your progress:** Go to Me tab > "My learning progress" to see all completed skills, in-progress skills, and upcoming reviews.

---

### 15. User Memories

**How to test:**
1. Have a few conversations on different topics
2. The AI automatically saves observations (preferences, struggles, breakthroughs)
3. Go to Me tab > "What PC Pal remembers"
4. Should show a grouped list of what the AI has learned about you
5. Each memory has a "Forget" button to delete it

---

### 16. Artifact Side Panel (Desktop)

**How to test (desktop browser, >1024px wide):**
1. Get the AI to produce any artifact (guide, video, finding)
2. Tap the artifact card in chat
3. It should open in a **side panel** on the right (not full-screen)
4. Drag the left edge of the panel to resize it (320px to 800px)
5. Click X to close it completely -- chat expands back to full width
6. Click "Show inline" on an artifact card to expand it directly in the message bubble

**On phone/tablet (<1024px):** Artifacts open as full-screen overlays instead.

---

### 17. Connect Computer + Screen Share

**How to test:**
1. Click the "Connect Computer" button below the chat input
2. Follow the instructions to run the relay agent script on your computer
3. Enter the pairing code
4. Once connected, the AI can run read-only diagnostics on your machine

**Screen Share:**
1. Click the "Share Screen" button below the chat input
2. Select a screen/window to share
3. The AI can now see your screen and help you find things

---

### 18. Dark Mode

**How to test:** Click the sun/moon icon in the top-right of the top bar. Theme toggles instantly and persists across page reloads.

---

## Conversation History

After running the tests above, go to the **History tab** (clock icon in bottom bar on phone, or side rail on desktop). You should see all your conversations listed with:
- First message as the title
- Date (Today / Yesterday / etc.)
- Active or Ended status
- Copy button to copy the full transcript

---

## Account Persistence

1. Create an account with email + password
2. Run some tests, have some conversations
3. Close the browser completely
4. Reopen and go to the URL
5. You should be automatically logged in (session cookie)
6. All conversations, memories, and skill progress should be intact
