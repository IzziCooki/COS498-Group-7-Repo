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
const { createPcPalMcpServer } = require('../mcp/pcpalTools');
const safetyMonitor = require('./safetyMonitor');
const conversationState = require('./conversationState');
const vocabularyFilter = require('./vocabularyFilter');
const userProfileManager = require('./userProfileManager');
const taskClassifier = require('./taskClassifier');
const skillMatcher = require('./skillMatcher');
const qualityTracker = require('./conversationQualityTracker');
const { anthropicApiKey } = require('../config');
const youtubeSearch = require('./youtubeSearch');

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const FALLBACK_RESPONSE =
  "I'm having a little trouble right now. Could you try asking me again in a moment?";

// Create the MCP server once at module load
let mcpServer;
try {
  mcpServer = createPcPalMcpServer();
  console.log('[agentSdkOrchestrator] MCP tool server created');
} catch (err) {
  console.error('[agentSdkOrchestrator] Failed to create MCP server:', err.message);
}

function buildComfortGuidelines(comfortLevel) {
  const level = parseInt(comfortLevel) || 1;
  if (level <= 1) {
    return `BRAND NEW to computers. Use analogies. MAXIMUM 2 steps per response. Always use show_visual_guide and start_step_sequence.`;
  } else if (level <= 3) {
    return `Knows basics but needs guidance. 3-5 numbered steps. Use show_visual_guide for new topics.`;
  }
  return `Fairly comfortable. Be concise. Only use visual guides when asked.`;
}

function buildSystemPrompt(profileString, user, classification, confusionCtx, matchedSkillPrompt) {
  const comfortGuidelines = buildComfortGuidelines(user?.comfort_level);
  const classificationContext = classification
    ? `\nCurrent task: ${classification.taskType} — ${classification.topic} (urgency: ${classification.urgency})`
    : '';

  return `You are PC Pal, a warm and patient AI tutor who helps elderly people with their computers.
Think of yourself as a helpful grandchild — kind, encouraging, and never condescending.

You are running as a DESKTOP APPLICATION with real diagnostic tools via MCP.
You can check the user's actual system info, network, disk, apps, errors, and battery.
Always use diagnostic tools BEFORE giving advice about computer problems.

User profile:
${profileString}
${classificationContext}

Comfort level: ${comfortGuidelines}

IMPORTANT CONTEXT: The user_id for this user is "${user?.id || 'unknown'}". The session_id for this conversation is available in the conversation context. Pass these to any tool that requires them.

## Rules
- Use simple, everyday language. No jargon.
- Describe WHERE on screen before WHAT to look for.
- Maximum 3 steps, then wait for confirmation.
- Never say "simply" or "just" or "as I mentioned."
- Always reassure: "You can't break anything by trying this."
- After diagnostic tools, translate results into plain English — NEVER show raw output.
- Celebrate every win with specific, meaningful praise.
${matchedSkillPrompt ? `\n## Active Skill\n${matchedSkillPrompt}` : ''}`;
}

async function processMessage(text, userId) {
  try {
    // Step 1: Safety check — runs before ANYTHING else
    const safetyCheck = safetyMonitor.checkMessage(text, userId);
    if (!safetyCheck.safe) {
      return { response: safetyCheck.response, safetyAlert: { type: safetyCheck.type } };
    }

    // Step 2: Get user profile
    const user = userProfileManager.getOrCreateUser(userId);

    // Step 3: Mock mode fallback
    if (!anthropicApiKey || process.env.MOCK_MODE === 'true') {
      const mockResponder = require('./mockResponder');
      const session = conversationState.getOrCreateSession(userId);
      return mockResponder.respond(text, userId, session.id);
    }

    // Step 4: Session management
    const session = conversationState.getOrCreateSession(userId);
    const sessionId = session.id;
    conversationState.addMessage(sessionId, 'user', text);

    // Step 5: Classify + match skill
    const [profileString, classification] = await Promise.all([
      Promise.resolve(userProfileManager.getProfileForPrompt(userId)),
      taskClassifier.classifyMessage(text, user),
    ]);

    const skillMatch = skillMatcher.matchSkill(text);
    const matchedSkillPrompt = skillMatch ? skillMatcher.buildSkillPrompt(skillMatch.skill) : null;
    if (skillMatch) {
      console.log(`[agentSdkOrchestrator] Skill matched: "${skillMatch.skill.name}" (score: ${skillMatch.score})`);
    }

    const confusionCtx = qualityTracker.getConfusionState(sessionId);
    const systemPrompt = buildSystemPrompt(profileString, user, classification, confusionCtx, matchedSkillPrompt);

    // Step 6: Build conversation history
    const dbMessages = conversationState.getSessionMessages(sessionId, 20);
    const historyContext = dbMessages
      .map(msg => `${msg.role === 'assistant' ? 'PC Pal' : 'User'}: ${msg.body}`)
      .join('\n');

    const fullPrompt = historyContext
      ? `Previous conversation:\n${historyContext}\n\nUser's new message: ${text}\n\nIMPORTANT: user_id="${userId}" session_id="${sessionId}". Pass these to any tool that needs them.`
      : `${text}\n\nIMPORTANT: user_id="${userId}" session_id="${sessionId}". Pass these to any tool that needs them.`;

    // Step 7: Call Agent SDK
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

    // Step 8: Extract structured data from response
    // Check if response contains visual guide markers
    const guideMatch = finalResponse.match(/VISUAL_GUIDE:(\w+)/);
    if (guideMatch) {
      guideId = guideMatch[1];
      finalResponse = finalResponse.replace(/VISUAL_GUIDE:\w+/g, '').trim();
    }

    // Step 8b: If the youtube_help skill matched, search YouTube server-side
    // and pass videos as structured data (don't rely on Claude preserving markers)
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

    // Step 9: Vocabulary filter
    const vocabLevel = user.vocabulary_level || 'basic';
    let filteredResponse = vocabularyFilter.filterResponse(finalResponse, vocabLevel);
    filteredResponse = vocabularyFilter.enforceReadability(filteredResponse);

    if (!filteredResponse) {
      return { response: FALLBACK_RESPONSE, safetyAlert, guideId, stepSequence, conversationId: sessionId };
    }

    // Step 10: Save assistant message
    conversationState.addMessage(sessionId, 'assistant', filteredResponse);

    // Step 11: Quality tracking
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
      matchedSkillId: skillMatch?.skill?.id || guideId,
      userOsType: user?.os_type,
      videos: videos && videos.length > 0 ? videos : null,
    };
  } catch (err) {
    console.error('[agentSdkOrchestrator] Unexpected error:', err.message);
    return { response: FALLBACK_RESPONSE, safetyAlert: null };
  }
}

module.exports = { processMessage };
