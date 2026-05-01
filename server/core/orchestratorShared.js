const ConversationFeedback = require('../models/ConversationFeedback');
const vocabularyFilter = require('./vocabularyFilter');
const vocabularyProgression = require('./vocabularyProgression');
const qualityTracker = require('./conversationQualityTracker');
const conversationState = require('./conversationState');

function loadCoachingNotes(userId) {
  const recentFeedback = userId ? ConversationFeedback.getRecentWithSuggestions(userId, 3) : [];
  if (recentFeedback.length === 0) return '';
  return recentFeedback.map(f => `- (${f.rating}★) ${f.ai_suggestion}`).join('\n');
}

function buildScreenContext(context) {
  if (context.screenShareActive) {
    return `\n## SCREEN SHARING IS ACTIVE\nThe user is sharing their screen with you right now. You can see their screen — call take_screenshot to capture and analyze what's on their screen. When they ask "can you see my screen?" or want help finding something, call take_screenshot FIRST before responding — do NOT guess or give generic instructions.\n`;
  }
  if (context.relayAgentConnected) {
    return `\n## COMPUTER CONNECTED\nThe user's computer is connected via the relay agent. You can capture their screen by calling take_screenshot if they need help finding something on screen.\n`;
  }
  return '';
}

function filterResponse(text, vocabLevel, userId) {
  let filtered = vocabularyProgression.filterWithProgression(text, vocabLevel, userId);
  filtered = vocabularyFilter.enforceReadability(filtered);
  return filtered;
}

function cleanResponseMarkers(text) {
  let cleaned = text;
  let videos = null;

  const ytMatch = cleaned.match(/YOUTUBE_VIDEOS:(\[[\s\S]*?\])/);
  if (ytMatch) {
    try { videos = JSON.parse(ytMatch[1]); } catch (e) { /* ignore */ }
    cleaned = cleaned.replace(/YOUTUBE_VIDEOS:\[[\s\S]*?\]/g, '').trim();
  }

  cleaned = cleaned.replace(/VERIFIED_RESOURCES:\n[\s\S]*?(?=\n\n|$)/g, '').trim();
  cleaned = cleaned.replace(/NO_CURATED_RESOURCES:[\s\S]*?(?=\n\n|$)/g, '').trim();

  return { text: cleaned, videos: videos && videos.length > 0 ? videos : null };
}

function trackQuality({ userId, sessionId, userMessage, agentResponse, user }) {
  try {
    const allMessages = conversationState.getSessionMessages(sessionId, 50);
    const turnNumber = allMessages.filter(m => m.role === 'assistant').length;
    qualityTracker.trackTurn({
      userId,
      conversationId: sessionId,
      userMessage,
      agentResponse,
      vocabLevel: user.vocabulary_level || 'basic',
      osType: user.os_type || '',
      turnNumber,
    });
  } catch (err) {
    console.error('[orchestrator] Quality tracking error (non-fatal):', err.message);
  }
}

module.exports = {
  loadCoachingNotes,
  buildScreenContext,
  filterResponse,
  cleanResponseMarkers,
  trackQuality,
};
