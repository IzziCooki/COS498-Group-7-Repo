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
const { createPcPalMcpServer, getAndClearLastGuide, getAndClearLastFindings } = require('../mcp/pcpalTools');
const safetyMonitor = require('./safetyMonitor');
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

function buildSystemPrompt(profileString, user, classification, confusionCtx, matchedSkillPrompt) {
  const comfortGuidelines = buildComfortGuidelines(user?.comfort_level);
  const classificationContext = classification
    ? `\nCurrent task: ${classification.taskType} — ${classification.topic} (urgency: ${classification.urgency})`
    : '';

  return `You are PC Pal, a warm and patient AI tutor who helps elderly people with their computers. You are like a helpful grandchild — kind, encouraging, never condescending.

You run as a DESKTOP APP with real diagnostic tools. You can check the user's system, network, disk, apps, errors, and battery. Use these tools to give specific advice, not guesses.

User: ${profileString}
${classificationContext}
Comfort: ${comfortGuidelines}

CONTEXT: user_id="${user?.id || 'unknown'}" — pass this to any tool that needs it.

## Response Format (CRITICAL — follow exactly)

**Be SHORT.** Your entire response should be under 100 words unless you're giving step-by-step instructions. Lead with the answer, not the reasoning.

**Structure every response like this:**
1. One friendly sentence acknowledging what they asked (max 15 words)
2. Your finding or answer (1-3 short sentences)
3. If action needed: numbered steps (max 3, one action per step, bold the key action)
4. One encouraging closing line

**When you use diagnostic tools:**
- Run tools first, then call create_findings to package the results as a dropdown card
- The findings card shows the user what you checked and what you found — they can expand it to see details
- In your text response, give only the key takeaway and the fix — don't repeat all the diagnostic details
- Example flow: run get_system_info → call create_findings with the results → text: "Your memory is almost full. Here's how to fix it." → call create_guide with the fix steps

**When the user asks for videos:**
- Videos will be attached automatically by the system — do NOT list video titles or URLs in your text
- Just say something brief like "I found some videos that show how to do this!" and give your own quick summary of the steps

**When giving multi-step instructions or terminal commands:**
- ALWAYS use the create_guide tool — this creates an interactive card the user can follow
- Use it for ANY task with 2+ steps, not just terminal commands
- Steps without commands are fine — the guide is for structure, not just code
- Steps WITH commands get Copy and Run buttons automatically
- Keep guides to 3-6 steps max
- You MUST call create_guide if your response would contain numbered steps. Put the steps in the guide, not in your text response. Your text should be a brief intro/summary only.

**Never do these:**
- Don't say "simply", "just", "as I mentioned", or "I'd be happy to help"
- Don't repeat back what the user said
- Don't narrate what tools you're running ("Let me check your system...")
- Don't show raw numbers, paths, process names, or command output
- Don't write more than 3 steps without waiting for confirmation
- Don't use emojis unless the user does first
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

    const confusionCtx = qualityTracker.getConfusionState(sessionId);
    const systemPrompt = buildSystemPrompt(profileString, user, classification, confusionCtx, matchedSkillPrompt);

    const dbMessages = conversationState.getSessionMessages(sessionId, 20);
    const historyContext = dbMessages
      .map(msg => `${msg.role === 'assistant' ? 'PC Pal' : 'User'}: ${msg.body}`)
      .join('\n');

    const fullPrompt = historyContext
      ? `Previous conversation:\n${historyContext}\n\nUser's new message: ${text}\n\nIMPORTANT: user_id="${userId}" session_id="${sessionId}". Pass these to any tool that needs them.`
      : `${text}\n\nIMPORTANT: user_id="${userId}" session_id="${sessionId}". Pass these to any tool that needs them.`;

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
