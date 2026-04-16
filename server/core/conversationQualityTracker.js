/**
 * conversationQualityTracker.js
 *
 * Passively analyzes each conversation turn and logs quality events to the database.
 * Runs at the end of processMessage() in agentOrchestrator.js.
 * Never blocks response delivery — all errors are caught and logged.
 *
 * Tracks:
 * - Confusion signals from the user (15 regex patterns)
 * - Jargon slips in agent responses (uses detectJargon from vocabularyFilter)
 * - Device verb mismatches (click on iPhone, tap on Windows)
 * - Response length violations (> 150 words)
 * - Step overload (> 3 steps without user confirmation)
 */

const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const { detectJargon } = require('./vocabularyFilter');

// Confusion signal patterns (user-side)
// Based on gerontology research on how elderly users express confusion

const CONFUSION_SIGNALS = [
  /\bi (?:don'?t|do not) (?:understand|get it|follow|know what you mean)\b/i,
  /\bwhat do you mean\b/i,
  /\bi'?m (?:confused|lost|stuck|not sure|not following)\b/i,
  /\bhuh\b/i,
  /\bi don'?t see (?:it|that|any|anything)\b/i,
  /\bsay that again\b/i,
  /\bcan you (?:explain|say).*(?:again|differently|another way)\b/i,
  /\b(?:this is )?too (?:hard|confusing|difficult|complicated)\b/i,
  /\bi (?:can'?t|cannot) (?:do this|find it|see it|figure this out)\b/i,
  /\bgive up\b/i,
  /\bforget it\b/i,
  /\bmy (?:daughter|son|grandson|granddaughter|family|kid) (?:does|handles|usually does) this\b/i,
  /\bwhere (?:is|do i find|do i see)\b/i,
  /\b(?:nothing|it) (?:happened|changed)\b/i,
  /\bwhat does that mean\b/i,
];

// Step completion signals (user confirmed a step was done)
const STEP_COMPLETION_SIGNALS = [
  /\b(?:done|ok|okay|got it|yes|yep|yeah|i see it|it worked|did it|next)\b/i,
];

// Device verb mismatches — wrong action verbs for the user's device
const DEVICE_VERB_VIOLATIONS = {
  'iPhone': /\b(?:click|right-click|double-click)\b/gi,
  'iPad': /\b(?:click|right-click|double-click)\b/gi,
  'Windows': /\b(?:tap|swipe|pinch)\b/gi,
  'Mac': /\b(?:tap|swipe|pinch)\b/gi,
  'Android': /\b(?:click|right-click|double-click)\b/gi,
};

// In-memory confusion state per conversation (reset on server restart)
const confusionState = new Map();

// Core tracking function — called on every turn

/**
 * Analyze one complete turn (user input + agent response) and log quality events.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.conversationId
 * @param {string} params.userMessage - raw user input
 * @param {string} params.agentResponse - filtered agent response
 * @param {string} params.vocabLevel - 'basic' | 'intermediate' | 'standard'
 * @param {string} params.osType - user's device type
 * @param {number} params.turnNumber - 1-based turn index
 */
function trackTurn({ userId, conversationId, userMessage, agentResponse, vocabLevel, osType, turnNumber }) {
  if (!conversationId || !userId) return;

  // Initialize confusion state for this conversation if needed
  if (!confusionState.has(conversationId)) {
    confusionState.set(conversationId, { consecutiveConfusions: 0, totalConfusions: 0 });
  }
  const state = confusionState.get(conversationId);

  const events = [];

  // 1. Check user message for confusion signals
  if (userMessage) {
    const isConfused = CONFUSION_SIGNALS.some(pattern => pattern.test(userMessage));
    const isCompleted = STEP_COMPLETION_SIGNALS.some(pattern => pattern.test(userMessage));

    if (isConfused) {
      state.consecutiveConfusions += 1;
      state.totalConfusions += 1;
      events.push({
        event_type: 'confusion_signal',
        detail: JSON.stringify({
          message_snippet: userMessage.substring(0, 100),
          consecutive_count: state.consecutiveConfusions,
          total_count: state.totalConfusions,
        }),
      });
    } else if (isCompleted) {
      // Reset consecutive confusion counter on step completion
      state.consecutiveConfusions = 0;
    }
  }

  // 2. Check agent response for jargon slips
  if (agentResponse && vocabLevel !== 'standard') {
    const jargonFound = detectJargon(agentResponse, vocabLevel);
    for (const { term, replacement } of jargonFound) {
      events.push({
        event_type: 'jargon_slip',
        detail: JSON.stringify({ term, expected_replacement: replacement }),
      });
    }
  }

  // 3. Check agent response for device verb mismatches
  if (agentResponse && osType) {
    const pattern = DEVICE_VERB_VIOLATIONS[osType];
    if (pattern) {
      const matches = agentResponse.match(pattern);
      if (matches && matches.length > 0) {
        events.push({
          event_type: 'device_mismatch',
          detail: JSON.stringify({ os_type: osType, wrong_verbs: matches }),
        });
      }
    }
  }

  // 4. Check agent response length
  if (agentResponse) {
    const wordCount = agentResponse.split(/\s+/).length;
    if (wordCount > 150) {
      events.push({
        event_type: 'response_too_long',
        detail: JSON.stringify({ word_count: wordCount }),
      });
    }
  }

  // 5. Check for step overload (> 3 numbered steps in one response)
  if (agentResponse) {
    const stepMatches = agentResponse.match(/(?:^|\n)\s*\*{0,2}\d+\.\*{0,2}\s/gm);
    const stepCount = stepMatches ? stepMatches.length : 0;
    if (stepCount > 3) {
      events.push({
        event_type: 'step_overload',
        detail: JSON.stringify({ step_count: stepCount }),
      });
    }
  }

  // Write events to database
  for (const event of events) {
    try {
      const stmt = db.prepare(`
        INSERT INTO conversation_quality_events (id, conversation_id, user_id, event_type, detail, turn_number, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(uuidv4(), conversationId, userId, event.event_type, event.detail, turnNumber);
    } catch (err) {
      console.error('[qualityTracker] Failed to log event:', err.message);
    }
  }

  // Update summary record
  try {
    updateSummary(conversationId, userId, events, turnNumber);
  } catch (err) {
    console.error('[qualityTracker] Failed to update summary:', err.message);
  }
}

/**
 * Update the per-conversation quality summary (upsert).
 */
function updateSummary(conversationId, userId, newEvents, turnNumber) {
  const existing = db.prepare('SELECT * FROM conversation_quality_summaries WHERE conversation_id = ?').get(conversationId);

  const confusionDelta = newEvents.filter(e => e.event_type === 'confusion_signal').length;
  const jargonDelta = newEvents.filter(e => e.event_type === 'jargon_slip').length;
  const deviceDelta = newEvents.filter(e => e.event_type === 'device_mismatch').length;
  const stepOverloadDelta = newEvents.filter(e => e.event_type === 'step_overload').length;

  if (existing) {
    db.prepare(`
      UPDATE conversation_quality_summaries SET
        confusion_count = confusion_count + ?,
        jargon_slip_count = jargon_slip_count + ?,
        device_mismatch_count = device_mismatch_count + ?,
        step_overload_count = step_overload_count + ?,
        total_turns = ?,
        updated_at = datetime('now')
      WHERE conversation_id = ?
    `).run(confusionDelta, jargonDelta, deviceDelta, stepOverloadDelta, turnNumber, conversationId);
  } else {
    db.prepare(`
      INSERT INTO conversation_quality_summaries (id, conversation_id, user_id, confusion_count, jargon_slip_count, device_mismatch_count, step_overload_count, total_turns, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(uuidv4(), conversationId, userId, confusionDelta, jargonDelta, deviceDelta, stepOverloadDelta, turnNumber);
  }
}

// Query functions for monitoring and evaluation

/**
 * Get the confusion state for a conversation (used to inject into system prompt).
 */
function getConfusionState(conversationId) {
  return confusionState.get(conversationId) || { consecutiveConfusions: 0, totalConfusions: 0 };
}

/**
 * Get the quality report for a single conversation.
 */
function getQualityReport(conversationId) {
  const summary = db.prepare('SELECT * FROM conversation_quality_summaries WHERE conversation_id = ?').get(conversationId);
  const events = db.prepare('SELECT * FROM conversation_quality_events WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId);
  return { summary: summary || null, events };
}

/**
 * Get aggregate quality stats across all conversations (for team monitoring dashboard).
 */
function getAggregateStats() {
  const eventCounts = db.prepare(`
    SELECT event_type, COUNT(*) as count
    FROM conversation_quality_events
    GROUP BY event_type
    ORDER BY count DESC
  `).all();

  const conversationCount = db.prepare('SELECT COUNT(*) as count FROM conversation_quality_summaries').get();

  const avgConfusion = db.prepare(`
    SELECT AVG(confusion_count) as avg_confusion,
           AVG(jargon_slip_count) as avg_jargon,
           AVG(device_mismatch_count) as avg_device_mismatch,
           AVG(step_overload_count) as avg_step_overload
    FROM conversation_quality_summaries
  `).get();

  // Top jargon slips by frequency
  const topJargon = db.prepare(`
    SELECT detail, COUNT(*) as count
    FROM conversation_quality_events
    WHERE event_type = 'jargon_slip'
    GROUP BY detail
    ORDER BY count DESC
    LIMIT 10
  `).all();

  return {
    total_conversations: conversationCount?.count || 0,
    event_counts: eventCounts,
    averages: avgConfusion || {},
    top_jargon_slips: topJargon.map(row => {
      try { return { ...JSON.parse(row.detail), count: row.count }; } catch { return { raw: row.detail, count: row.count }; }
    }),
  };
}

module.exports = { trackTurn, getConfusionState, getQualityReport, getAggregateStats };
