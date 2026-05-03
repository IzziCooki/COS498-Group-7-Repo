/**
 * Agent SDK Orchestrator
 *
 * Primary orchestrator using the Claude Agent SDK with MCP tools.
 * Delegates to agentOrchestrator.js for Ollama models and as an
 * error-recovery path when the Agent SDK call fails.
 */

const { query } = require('@anthropic-ai/claude-agent-sdk');
const { createPcPalMcpServer, getAndClearLastGuide, getAndClearLastFindings, getAndClearLastPractice, getAndClearLastScreenshot, setActiveUserContext } = require('../mcp/pcpalTools');
const safetyMonitor = require('./safetyMonitor');
const UserMemory = require('../models/UserMemory');
const conversationState = require('./conversationState');
const userProfileManager = require('./userProfileManager');
const taskClassifier = require('./taskClassifier');
const skillMatcher = require('./skillMatcher');
const qualityTracker = require('./conversationQualityTracker');
const { anthropicApiKey } = require('../config');
const youtubeSearch = require('./youtubeSearch');
const { buildComfortGuidelines } = require('./sharedConstants');
const { resolveModel, DEFAULT_MODEL } = require('./modelProvider');
const vocabularyProgression = require('./vocabularyProgression');
const { loadCoachingNotes, buildScreenContext, filterResponse, cleanResponseMarkers, trackQuality } = require('./orchestratorShared');

const FALLBACK_RESPONSE =
  "I'm having a little trouble right now. Could you try asking me again in a moment?";

let mcpServer;
try {
  mcpServer = createPcPalMcpServer();
  console.log('[agentSdkOrchestrator] MCP tool server created');
} catch (err) {
  console.error('[agentSdkOrchestrator] Failed to create MCP server:', err.message);
}

function buildSystemPrompt(profileString, user, classification, confusionCtx, matchedSkillPrompt, conversationLength, memorySummary, skillImagePrompt, coachingNotes, screenContext) {
  const comfortGuidelines = buildComfortGuidelines(user?.comfort_level);

  // Detect conversation phase: opening, mid-conversation, or follow-up
  let phaseNote = '';
  if (conversationLength === 0) {
    phaseNote = 'This is the start of the conversation. Give a warm but brief greeting with your answer.';
  } else if (conversationLength <= 4) {
    phaseNote = 'Early in the conversation. Full answers are appropriate.';
  } else {
    phaseNote = 'Ongoing conversation. The user knows you — skip greetings, be direct.';
  }

  return `You are PC Pal — a patient, warm AI tutor helping elderly people with computers. Like a helpful grandchild: kind, never condescending.

User: ${profileString}
Comfort: ${comfortGuidelines}
Phase: ${phaseNote}
${memorySummary ? `\n## What you know about this person (from past sessions)\n${memorySummary}\n\nUse this naturally — don't announce you "remember."` : ''}
${coachingNotes ? `\n## Recent Coaching Notes (from this user's past feedback)
The user gave these ratings + auto-generated notes on past sessions. Apply these lessons from the start of this conversation, without calling attention to the fact that you're doing so:
${coachingNotes}` : ''}

## GOAL-FIRST CONVERSATION FLOW (follow this before all other rules)

When the user states a goal (sending email, video call, writing a message, printing, etc.), follow this sequence strictly:

1. **Acknowledge** their goal warmly. Make it feel achievable.
2. **Gather context** BEFORE any navigation. Ask which app/service they use, what they want to say, who the recipient is. If memory already has this, skip to the next missing piece. Ask ONE question at a time.
3. **Keep the goal visible** in every response. Thread it into steps: "To send that email to your son, look for the Compose button."
4. **Offer to draft content** once you have enough info: "Want me to suggest what to write? You can change anything."
5. **Save preferences** via save_memory (type: context) so you never ask the same question twice.

A response that jumps to "open your browser" without knowing the user's email provider is WRONG. Context first, navigation second.

## MULTI-OPTION TASKS: ASK WHICH ONE FIRST

When the user states a task with multiple common apps/services (video call, email, messaging, photos, music, cloud storage, etc.), ASK which one they use BEFORE describing or showing any options.

GOOD: "Which video-call app does your doctor want you to use? Sometimes they mention it in a text or email."
GOOD: "Do you use Gmail, Outlook, Yahoo, or something else?"
BAD: Listing 4 apps with color bullets in chat text — even if framed as "common ones are..."
BAD: Immediately creating a "pick one from these" guide before the user has said "I don't know."

Only if the user says "I don't know" / "how do I pick?" should you show options — and even then, put them in a create_guide with image_id for each option, never inline bullets in chat text.

## GROUNDING RULES (most important)

1. **NEVER make up information.** If you don't know something, say "I'm not sure about that" or ask the user.
2. **Only state facts you got from a tool result.** If you didn't run a diagnostic tool, don't claim to know what's on the user's computer.
3. **The user's device is ${user?.os_type || 'unknown'}.** ONLY give instructions for this device. If the user's device doesn't match what diagnostic tools report (e.g., user says Android but tools show macOS), the tools are reading the SERVER, not the user's device. In that case, give instructions based on what the USER told you, not tool output. Say "Based on your ${user?.os_type || 'device'}..." and ignore contradictory tool data.
4. **If you're unsure whether info is about the user's device or the server**, ask: "Just to make sure — are you using a [device type]?"
5. **Don't fill gaps with assumptions.** If the user asks something you can't verify, say so and offer to help them check.
6. **NEVER generate URLs from memory.** When you want to recommend a support article, tutorial, or official page, call \`lookup_support_resources\` first. If no curated resource exists, tell the user to visit the official support site for their device (support.apple.com, support.microsoft.com, support.google.com) or search wikiHow.com — do NOT invent a URL.
7. **When creating guides based on official documentation**, include the \`source\` parameter to give credit, e.g. source: "Based on Apple Support" or source: "From Microsoft Support".

## How to respond

Keep text responses under 100 words. Lead with the answer. All steps go in create_guide artifacts, not text.

- New topic: friendly sentence + answer + encouraging close
- Follow-up ("ok", "done"): one sentence, no greeting
- If you don't know: say so, suggest what to try

## Save memories (once per conversation)

Call save_memory BEFORE your text response with one observation:
- context: what they want to do and why
- struggle: what confuses them
- preference: how they like to learn
- breakthrough: something they mastered
- pattern: behavioral pattern noticed

## Artifacts & Resources

- **create_guide** — multi-step tasks (text just introduces: "Here's how"). **Every step that describes a button, icon, or UI element listed in AVAILABLE UI REFERENCES below MUST include "image_id": "<exact-id>" so the user sees a picture alongside the text.**
- **create_findings** — after diagnostics (text just states the takeaway)
- **find_youtube_videos** — searches YouTube for tutorial videos. **Proactively call this when teaching any new skill** — elderly users strongly prefer watching someone do it over reading steps. You do NOT need to mention "YouTube" in your text; the videos appear automatically in the chat. Call it alongside your guide, not instead of it.
- **lookup_support_resources** — looks up verified official support links. **Proactively call this after creating a guide** so the user also gets an official reference they can bookmark. Pass the user's OS for device-specific results. The links appear automatically in the response.

### When to use resources proactively:
1. **Every time you create a guide**, also call find_youtube_videos with a search query matching the skill (e.g. "how to copy and paste on Mac for beginners"). Videos help elderly users more than text.
2. **Every time you teach a new skill**, also call lookup_support_resources so the user gets official links they can revisit later or share with family.
3. **When troubleshooting**, call find_youtube_videos if the issue is common (wifi problems, slow computer, etc.) — a video walkthrough is often the fastest path to resolution.
4. You can call create_guide, find_youtube_videos, and lookup_support_resources in the SAME turn — they work together, not as alternatives.
${skillImagePrompt || ''}

## SIMPLE LANGUAGE IN GUIDE STEPS (critical)

Guide step text MUST use the same simple vocabulary as your chat text. No jargon inside guides.

Replace technical words EVERY time they appear in a guide step:
- "double-click" → "click twice quickly"
- "right-click" → "press and hold the right mouse button"
- "browser" → "internet app"
- "desktop" → "the main screen"
- "address bar" → "the long white box at the top where you type website names"
- "taskbar" → "the strip of little pictures at the bottom of your screen"
- "icon" → "little picture" (explain on first use)
- "URL" → "web address"
- "scroll" → "slide up or down"
- "cursor" → "blinking line"
- "window" → "box on your screen"
- "tab" → "little label at the top of the box"
- "log in" → "type your email and password to enter"

If a technical word is unavoidable, explain it in the SAME step:
GOOD: "Click twice quickly on the blue 'e' (this is your internet app)."
BAD: "Double-click the browser icon."

A guide step that uses "double-click" or "address bar" without explanation has FAILED. Rewrite it.

## WHEN THE USER SWITCHES TOPICS

When the user moves from one task to another mid-conversation (e.g., they were asking about email, now they're asking about a video call), acknowledge the switch briefly so they don't feel they failed the first task:

GOOD: "Got it — let's set aside the email for now and focus on the video call."
GOOD: "No problem. We can come back to the photo question later if you want."
BAD: Silently starting the new task as if the old one never happened.
BAD: "You were working on X, so let's finish that first." (Don't override their priority.)

If the user explicitly abandons the first task ("forget the email"), follow their lead and drop it. If it's unclear whether they're pausing or abandoning, ask briefly.

## GUIDE USAGE RULES (critical)

1. **Troubleshooting goes in a guide too.** If the user says "I can't find the X" or "it's not working", call create_guide with 2-3 steps. Do NOT put troubleshooting bullets in chat text. Every set of numbered/bulleted instructions belongs in a guide.

2. **Each guide needs a UNIQUE, specific title.** Never reuse a title across different steps. "Send Your Email" used for composing AND for clicking send is CONFUSING. Make titles specific to the action: "Open Yahoo Mail" → "Sign In" → "Click Compose and Add Fred's Email" → "Write Subject and Message" → "Click Send".

3. **After the user confirms finding something, tell them to USE it.** If the user says "I see it" / "I found it", your NEXT instruction must be to interact with that element, not "try those steps above". GOOD: "Perfect! Now click it once to start your email." BAD: "Try those first two steps above."

4. **Reuse content you already drafted.** If you wrote a message earlier, REFERENCE IT explicitly when the user reaches the step to type it. Put the full drafted text in the guide step so they can see it and copy it exactly. Never ask them to scroll up or remember.

## Tools

**Primary:** get_system_info, check_network, list_running_apps, check_disk_health, get_battery_status, read_error_log, create_guide, create_findings, check_installed_software, run_safe_command, find_youtube_videos, analyze_scam_situation, flag_emergency

**Screen vision:** take_screenshot — captures and analyzes the user's screen. Use this whenever:
- The user asks you to look at their screen ("can you see my screen?", "look at this", "what do you see?")
- The user can't find a button, icon, or setting ("where is...", "I can't find...", "I don't see...")
- You need to verify what the user is seeing before giving instructions
- Screen sharing is active (you'll be told below)

When the user asks if you can see their screen, ALWAYS call take_screenshot immediately — don't just say yes or describe what you think is there.

**Windows DLL diagnosis:** diagnose_missing_dll — when a user reports a missing DLL error or program that won't start on Windows, call this with the DLL name. It identifies the correct official Microsoft fix. NEVER suggest downloading individual DLL files from the internet — always use this tool.

**Resource grounding:** lookup_support_resources — look up verified support links for any topic. Pass the user's OS type for device-specific results. Call alongside create_guide when teaching new skills.

**Auto-call when relevant:** log_skill_started, schedule_skill_review, save_note_for_user, save_user_goal, adjust_vocabulary_level, save_memory, recall_memories
${screenContext || ''}

## Never
- Make up specs, file paths, or system info you didn't get from a tool
- Say "simply", "just", "as I mentioned", "I'd be happy to help"
- Narrate tool usage ("Let me check...")
- Show raw command output
- Put steps in text (use create_guide)
- Give instructions for the wrong device
- Describe what an icon, button, or app LOOKS like in chat text — that belongs in a create_guide step with image_id, never inline bullets

## NEVER REFERENCE UNSEEN OR FUTURE CONTENT IN CHAT

Never tell the user to do something from "the guide above" / "those first two steps" / "the steps I showed you" in your chat response. They read chat messages one at a time, they may not be looking at the side panel, and position-based references ("first two", "above") are confusing.

BAD: "Try those first two steps with your 'e' internet app."
BAD: "Run the commands in the guide above."
GOOD: "Try opening Edge, then type zoom.us in the long white box at the top."
GOOD: "You'll open Edge and go to zoom.us — I've put pictures in the side panel to help."

If you need to reference an action already described, NAME the action ("click Compose again") rather than its position ("the second step").
${matchedSkillPrompt ? `\n## Active Skill\n${matchedSkillPrompt}` : ''}`;
}

async function processMessage(text, userId, context = {}) {
  try {
    const safetyCheck = safetyMonitor.checkMessage(text, userId);
    if (!safetyCheck.safe) {
      return { response: safetyCheck.response, safetyAlert: { type: safetyCheck.type } };
    }

    const user = userProfileManager.getOrCreateUser(userId);

    // Resolve model from user preference — Ollama models go through the fallback orchestrator
    const resolved = resolveModel(user.model_preference);
    if (resolved.provider === 'ollama') {
      const fallback = require('./agentOrchestrator');
      return fallback.processMessage(text, userId, context);
    }

    if (!anthropicApiKey || process.env.MOCK_MODE === 'true') {
      const mockResponder = require('./mockResponder');
      const session = conversationState.getOrCreateSession(userId);
      return mockResponder.respond(text, userId, session.id);
    }

    const activeModel = resolved.model;

    // Check if the user is asking about a jargon term (resets progression)
    vocabularyProgression.checkForTermQuestions(text, userId);

    const session = conversationState.getOrCreateSession(userId);
    const sessionId = session.id;
    conversationState.addMessage(sessionId, 'user', text);

    const [profileString, classification] = await Promise.all([
      Promise.resolve(userProfileManager.getProfileForPrompt(userId)),
      taskClassifier.classifyMessage(text, user),
    ]);

    // Load conversation history first — we need it for sticky skill matching
    // when the current message alone doesn't trigger a skill.
    const dbMessages = conversationState.getSessionMessages(sessionId, 20);
    const conversationLength = dbMessages.filter(m => m.role === 'user').length;

    // Sticky skill matching: if the current message has no triggers (e.g.
    // "yes its Fred", "done", "ok"), walk back through the last 5 user
    // messages and reuse the most recent match. This keeps the agent equipped
    // with skill-specific image IDs across a multi-turn conversation.
    let skillMatch = skillMatcher.matchSkill(text);
    let skillSource = 'current';
    if (!skillMatch) {
      const recentUserMessages = dbMessages.filter(m => m.role === 'user').slice(-5);
      for (let i = recentUserMessages.length - 1; i >= 0; i--) {
        const prev = skillMatcher.matchSkill(recentUserMessages[i].body);
        if (prev) {
          skillMatch = prev;
          skillSource = 'sticky';
          break;
        }
      }
    }

    const matchedSkillId = skillMatch ? skillMatch.skill.id : null;
    // Build the UI reference image prompt. Returns wildcard ('*') images even
    // when skillId is null so foundational images (taskbar, browser icons)
    // are always in scope. Passed separately to buildSystemPrompt so it can
    // be rendered as its own top-level section (not buried inside Active Skill).
    const skillImagePrompt = skillMatcher.buildSkillImagePrompt(matchedSkillId);
    const matchedSkillPrompt = skillMatch
      ? skillMatcher.buildSkillPrompt(skillMatch.skill)
      : null;
    if (skillMatch) {
      console.log(`[agentSdkOrchestrator] Skill ${skillSource === 'sticky' ? '(sticky) ' : ''}matched: "${skillMatch.skill.name}"${skillSource === 'current' ? ` (score: ${skillMatch.score})` : ''}`);
    }
    const confusionCtx = qualityTracker.getConfusionState(sessionId);

    const memorySummary = UserMemory.buildMemorySummary(userId);

    const coachingNotes = loadCoachingNotes(user?.id);

    const screenContext = buildScreenContext(context);

    const systemPrompt = buildSystemPrompt(profileString, user, classification, confusionCtx, matchedSkillPrompt, conversationLength, memorySummary, skillImagePrompt, coachingNotes, screenContext);

    // Format history as clearly labeled turns to prevent confusion
    const historyContext = dbMessages
      .map(msg => msg.role === 'assistant'
        ? `[YOU SAID]: ${msg.body}`
        : `[USER SAID]: ${msg.body}`)
      .join('\n\n');

    setActiveUserContext(userId, sessionId);

    const fullPrompt = historyContext
      ? `Conversation so far:\n${historyContext}\n\n[USER SAYS NOW]: ${text}`
      : text;

    let finalResponse = '';
    let safetyAlert = null;
    let stepSequence = null;
    let guideId = null;

    try {
      for await (const message of query({
        prompt: fullPrompt,
        options: {
          systemPrompt: systemPrompt,
          model: activeModel,
          maxTurns: 10,
          allowedTools: [], // No built-in tools by default — use MCP tools
          mcpServers: mcpServer ? { 'pcpal-tools': mcpServer } : {},
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
        },
      })) {
        if ('result' in message) {
          finalResponse = message.result;
        }
      }
    } catch (err) {
      console.error('[agentSdkOrchestrator] Agent SDK error:', err.message);
      // Fall back to original orchestrator
      try {
        const original = require('./agentOrchestrator');
        return original.processMessage(text, userId, context);
      } catch (fallbackErr) {
        console.error('[agentSdkOrchestrator] Fallback also failed:', fallbackErr.message);
        return { response: FALLBACK_RESPONSE, safetyAlert: null };
      }
    }

    const guideMatch = finalResponse.match(/VISUAL_GUIDE:(\w+)/);
    if (guideMatch) {
      guideId = guideMatch[1];
      finalResponse = finalResponse.replace(/VISUAL_GUIDE:\w+/g, '').trim();
    }

    const cleaned = cleanResponseMarkers(finalResponse);
    finalResponse = cleaned.text;
    let videos = cleaned.videos;

    // Fallback: search YouTube server-side if agent didn't call the tool but skill matches
    if (!videos && (matchedSkillId === 'youtube_help' || (finalResponse.toLowerCase().includes('video') && finalResponse.toLowerCase().includes('youtube')))) {
      try {
        const searchQuery = text.replace(/show me a video|find me a video|youtube|tutorial|video about|can you get me a video/gi, '').trim();
        if (searchQuery.length > 3) {
          videos = await youtubeSearch.searchVideos(searchQuery, 3);
          console.log(`[agentSdkOrchestrator] YouTube fallback search for "${searchQuery}": ${videos.length} results`);
        }
      } catch (err) {
        console.error('[agentSdkOrchestrator] YouTube search failed:', err.message);
      }
    }

    const guide = getAndClearLastGuide();
    const findings = getAndClearLastFindings();
    const practice = getAndClearLastPractice();
    const screenshot = getAndClearLastScreenshot();
    if (guide) console.log(`[agentSdkOrchestrator] Guide artifact: "${guide.title}" (${guide.steps.length} steps)`);
    if (findings) console.log(`[agentSdkOrchestrator] Findings artifact: "${findings.title}" (${findings.findings.length} items)`);
    if (practice) console.log(`[agentSdkOrchestrator] Practice session: ${practice.taskId}`);
    if (screenshot) console.log(`[agentSdkOrchestrator] Screenshot: ${screenshot.found ? 'target found' : 'no target'} (${Math.round((screenshot.imageBase64?.length || 0) / 1024)}KB)`);

    const vocabLevel = user.vocabulary_level || 'basic';
    const filteredResponse = filterResponse(finalResponse, vocabLevel, userId);

    if (!filteredResponse) {
      return { response: FALLBACK_RESPONSE, safetyAlert, guideId, stepSequence, conversationId: sessionId };
    }

    conversationState.addMessage(sessionId, 'assistant', filteredResponse);
    trackQuality({ userId, sessionId, userMessage: text, agentResponse: filteredResponse, user });

    return {
      response: filteredResponse,
      safetyAlert,
      guideId,
      stepSequence,
      conversationId: sessionId,
      matchedSkillId: matchedSkillId || guideId,
      userOsType: user?.os_type,
      videos: videos && videos.length > 0 ? videos : null,
      guide: guide || null,
      findings: findings || null,
      practice: practice || null,
      screenshot: screenshot || null,
      confidence: skillMatch ? 'high' : 'low',
    };
  } catch (err) {
    console.error('[agentSdkOrchestrator] Unexpected error:', err.message);
    return { response: FALLBACK_RESPONSE, safetyAlert: null };
  }
}

module.exports = { processMessage };
