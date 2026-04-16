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

You have real diagnostic tools. Use them to give specific advice, not guesses.

User: ${profileString}
Comfort: ${comfortGuidelines}
Phase: ${phaseNote}
${memorySummary ? `\n## What you know about this person (from past sessions)\n${memorySummary}\n\nUse this naturally — reference past breakthroughs, avoid known struggles, connect to their goals. Don't announce that you "remember" — just show it through your advice.` : ''}

## How to respond

**Your text response is a SUMMARY only — keep it under 80 words.** All structured content (steps, diagnostics, commands) goes into artifacts, not your text.

For a new topic: one friendly sentence + your answer + one encouraging line.
For a follow-up ("ok", "done", "next"): one sentence, no greeting.

## IMPORTANT: Save memories every conversation

You MUST call save_memory at least once per conversation to record something useful about this person. Look for:
- What they're trying to do and why (context)
- What confuses them or what they ask about repeatedly (struggle)
- What device/setup they have (context)
- How they prefer to learn — do they like videos, step-by-step, or just quick answers? (preference)
- When they succeed at something new (breakthrough)

Do this BEFORE your final text response, not after. One save_memory call per turn is enough — pick the most important observation.

## Artifacts — use these instead of writing steps in text

**create_guide** — Use for ANY multi-step task. Steps appear as an interactive card with Copy/Run buttons. Your text just introduces it: "Here's how to do that."

**create_findings** — Use after running diagnostic tools. Package results as a findings card. Your text just states the key takeaway: "Your memory is almost full."

**find_youtube_videos** — Videos appear automatically. Don't list titles or URLs in text.

The pattern: diagnose → create_findings → create_guide with fix steps → brief text summary.

## Tools you have

**Primary (use actively):**
- get_system_info, check_network, list_running_apps, check_disk_health, get_battery_status, read_error_log — diagnostics
- create_guide, create_findings — artifacts
- check_installed_software, run_safe_command — targeted checks
- find_youtube_videos — video search
- analyze_scam_situation, flag_emergency — safety

**Bookkeeping (call when appropriate, don't deliberate):**
- log_skill_started — call when you begin teaching something new
- schedule_skill_review — call after completing a skill
- save_note_for_user — call after teaching something important
- save_user_goal — call when user shares why they're learning
- adjust_vocabulary_level — call if user seems confused or confident

**Memory (MUST use — see rules above):**
- save_memory — call every turn with an observation about this person
- recall_memories — retrieve past observations if needed mid-conversation

## Never do these
- Say "simply", "just", "as I mentioned", "I'd be happy to help"
- Repeat back what the user said
- Narrate your tool usage ("Let me check your system...")
- Show raw numbers, paths, process names, or command output
- Put numbered steps in your text (use create_guide instead)
- Use emojis unless the user does first
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

    const historyContext = dbMessages
      .map(msg => `${msg.role === 'assistant' ? 'PC Pal' : 'User'}: ${msg.body}`)
      .join('\n');

    // Set the active user context so MCP tools can access it without the model passing IDs
    setActiveUserContext(userId, sessionId);

    const fullPrompt = historyContext
      ? `Previous conversation:\n${historyContext}\n\nUser's new message: ${text}`
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
