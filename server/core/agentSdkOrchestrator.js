/**
 * Agent SDK Orchestrator
 *
 * Replaces the manual tool-use loop with the Claude Agent SDK.
 * Custom tools are exposed via an in-process MCP server.
 * Built-in tools (Bash, Read, WebSearch) are available when needed.
 *
 * Falls back to the original agentOrchestrator.js if the Agent SDK
 * is not available or ANTHROPIC_API_KEY is missing.
 */

const { query } = require('@anthropic-ai/claude-agent-sdk');
const { createPcPalMcpServer, getAndClearLastGuide, getAndClearLastFindings, setActiveUserContext } = require('../mcp/pcpalTools');
const safetyMonitor = require('./safetyMonitor');
const UserMemory = require('../models/UserMemory');
const conversationState = require('./conversationState');
const vocabularyFilter = require('./vocabularyFilter');
const userProfileManager = require('./userProfileManager');
const taskClassifier = require('./taskClassifier');
const skillMatcher = require('./skillMatcher');
const qualityTracker = require('./conversationQualityTracker');
const { anthropicApiKey } = require('../config');
const youtubeSearch = require('./youtubeSearch');
const { buildComfortGuidelines } = require('./sharedConstants');

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const FALLBACK_RESPONSE =
  "I'm having a little trouble right now. Could you try asking me again in a moment?";

let mcpServer;
try {
  mcpServer = createPcPalMcpServer();
  console.log('[agentSdkOrchestrator] MCP tool server created');
} catch (err) {
  console.error('[agentSdkOrchestrator] Failed to create MCP server:', err.message);
}

// buildComfortGuidelines imported from sharedConstants.js — single source of truth

function buildSystemPrompt(profileString, user, classification, confusionCtx, matchedSkillPrompt, conversationLength, memorySummary) {
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

## GOAL-FIRST CONVERSATION FLOW (follow this before all other rules)

When the user states a goal (sending email, video call, writing a message, printing, etc.), follow this sequence strictly:

1. **Acknowledge** their goal warmly. Make it feel achievable.
2. **Gather context** BEFORE any navigation. Ask which app/service they use, what they want to say, who the recipient is. If memory already has this, skip to the next missing piece. Ask ONE question at a time.
3. **Keep the goal visible** in every response. Thread it into steps: "To send that email to your son, look for the Compose button."
4. **Offer to draft content** once you have enough info: "Want me to suggest what to write? You can change anything."
5. **Save preferences** via save_memory (type: context) so you never ask the same question twice.

A response that jumps to "open your browser" without knowing the user's email provider is WRONG. Context first, navigation second.

## GROUNDING RULES (most important)

1. **NEVER make up information.** If you don't know something, say "I'm not sure about that" or ask the user.
2. **Only state facts you got from a tool result.** If you didn't run a diagnostic tool, don't claim to know what's on the user's computer.
3. **The user's device is ${user?.os_type || 'unknown'}.** ONLY give instructions for this device. If the user's device doesn't match what diagnostic tools report (e.g., user says Android but tools show macOS), the tools are reading the SERVER, not the user's device. In that case, give instructions based on what the USER told you, not tool output. Say "Based on your ${user?.os_type || 'device'}..." and ignore contradictory tool data.
4. **If you're unsure whether info is about the user's device or the server**, ask: "Just to make sure — are you using a [device type]?"
5. **Don't fill gaps with assumptions.** If the user asks something you can't verify, say so and offer to help them check.

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

## Artifacts

- **create_guide** — multi-step tasks (text just introduces: "Here's how")
- **create_findings** — after diagnostics (text just states the takeaway)
- **find_youtube_videos** — videos appear automatically, don't list in text

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

## Tools

**Primary:** get_system_info, check_network, list_running_apps, check_disk_health, get_battery_status, read_error_log, create_guide, create_findings, check_installed_software, run_safe_command, find_youtube_videos, analyze_scam_situation, flag_emergency

**Auto-call when relevant:** log_skill_started, schedule_skill_review, save_note_for_user, save_user_goal, adjust_vocabulary_level, save_memory, recall_memories

## Never
- Make up specs, file paths, or system info you didn't get from a tool
- Say "simply", "just", "as I mentioned", "I'd be happy to help"
- Narrate tool usage ("Let me check...")
- Show raw command output
- Put steps in text (use create_guide)
- Give instructions for the wrong device
${matchedSkillPrompt ? `\n## Active Skill\n${matchedSkillPrompt}` : ''}`;
}

async function processMessage(text, userId) {
  try {
    const safetyCheck = safetyMonitor.checkMessage(text, userId);
    if (!safetyCheck.safe) {
      return { response: safetyCheck.response, safetyAlert: { type: safetyCheck.type } };
    }

    const user = userProfileManager.getOrCreateUser(userId);

    if (!anthropicApiKey || process.env.MOCK_MODE === 'true') {
      const mockResponder = require('./mockResponder');
      const session = conversationState.getOrCreateSession(userId);
      return mockResponder.respond(text, userId, session.id);
    }

    const session = conversationState.getOrCreateSession(userId);
    const sessionId = session.id;
    conversationState.addMessage(sessionId, 'user', text);

    const [profileString, classification] = await Promise.all([
      Promise.resolve(userProfileManager.getProfileForPrompt(userId)),
      taskClassifier.classifyMessage(text, user),
    ]);

    const skillMatch = skillMatcher.matchSkill(text);
    const matchedSkillPrompt = skillMatch ? skillMatcher.buildSkillPrompt(skillMatch.skill) : null;
    const matchedSkillId = skillMatch ? skillMatch.skill.id : null;
    if (skillMatch) {
      console.log(`[agentSdkOrchestrator] Skill matched: "${skillMatch.skill.name}" (score: ${skillMatch.score})`);
    }

    const dbMessages = conversationState.getSessionMessages(sessionId, 20);
    const conversationLength = dbMessages.filter(m => m.role === 'user').length;
    const confusionCtx = qualityTracker.getConfusionState(sessionId);

    // Load persistent memories for this user
    const memorySummary = UserMemory.buildMemorySummary(userId);
    const systemPrompt = buildSystemPrompt(profileString, user, classification, confusionCtx, matchedSkillPrompt, conversationLength, memorySummary);

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
          model: CLAUDE_MODEL,
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
        return original.processMessage(text, userId);
      } catch (fallbackErr) {
        console.error('[agentSdkOrchestrator] Fallback also failed:', fallbackErr.message);
        return { response: FALLBACK_RESPONSE, safetyAlert: null };
      }
    }

    // Extract structured data from response
    const guideMatch = finalResponse.match(/VISUAL_GUIDE:(\w+)/);
    if (guideMatch) {
      guideId = guideMatch[1];
      finalResponse = finalResponse.replace(/VISUAL_GUIDE:\w+/g, '').trim();
    }

    // Search YouTube server-side when video skill matches (structured data, not markers)
    let videos = null;
    if (matchedSkillId === 'youtube_help' || (finalResponse.toLowerCase().includes('video') && finalResponse.toLowerCase().includes('youtube'))) {
      try {
        // Extract what the user actually asked about for the search query
        const searchQuery = text.replace(/show me a video|find me a video|youtube|tutorial|video about|can you get me a video/gi, '').trim();
        if (searchQuery.length > 3) {
          videos = await youtubeSearch.searchVideos(searchQuery, 3);
          console.log(`[agentSdkOrchestrator] YouTube search for "${searchQuery}": ${videos.length} results`);
        }
      } catch (err) {
        console.error('[agentSdkOrchestrator] YouTube search failed:', err.message);
      }
    }

    // Check if artifacts were created during the tool loop
    const guide = getAndClearLastGuide();
    const findings = getAndClearLastFindings();
    if (guide) {
      console.log(`[agentSdkOrchestrator] Guide artifact: "${guide.title}" (${guide.steps.length} steps)`);
    }
    if (findings) {
      console.log(`[agentSdkOrchestrator] Findings artifact: "${findings.title}" (${findings.findings.length} items)`);
    }

    const vocabLevel = user.vocabulary_level || 'basic';
    let filteredResponse = vocabularyFilter.filterResponse(finalResponse, vocabLevel);
    filteredResponse = vocabularyFilter.enforceReadability(filteredResponse);

    if (!filteredResponse) {
      return { response: FALLBACK_RESPONSE, safetyAlert, guideId, stepSequence, conversationId: sessionId };
    }

    conversationState.addMessage(sessionId, 'assistant', filteredResponse);

    try {
      const allMessages = conversationState.getSessionMessages(sessionId, 50);
      const turnNumber = allMessages.filter(m => m.role === 'assistant').length;
      qualityTracker.trackTurn({
        userId,
        conversationId: sessionId,
        userMessage: text,
        agentResponse: filteredResponse,
        vocabLevel: user.vocabulary_level || 'basic',
        osType: user.os_type || '',
        turnNumber,
      });
    } catch (trackErr) {
      console.error('[agentSdkOrchestrator] Quality tracking error:', trackErr.message);
    }

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
    };
  } catch (err) {
    console.error('[agentSdkOrchestrator] Unexpected error:', err.message);
    return { response: FALLBACK_RESPONSE, safetyAlert: null };
  }
}

module.exports = { processMessage };
