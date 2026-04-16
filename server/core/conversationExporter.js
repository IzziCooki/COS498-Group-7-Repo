const fs = require('fs');
const path = require('path');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const SkillEvent = require('../models/SkillEvent');
const SafetyEvent = require('../models/SafetyEvent');
const ConversationFeedback = require('../models/ConversationFeedback');

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'data', 'conversations');

/**
 * Export a conversation to JSON file in data/conversations/.
 * Follows the ai-network-admin format: name, turns, metadata.
 *
 * @param {string} conversationId
 * @returns {string|null} path to the exported file, or null if skipped
 */
function exportConversation(conversationId) {
  const conversation = Conversation.findById(conversationId);
  if (!conversation) {
    console.warn(`[exporter] Conversation ${conversationId} not found`);
    return null;
  }

  // Load all messages (no limit)
  const messages = Message.findByConversationId(conversationId);
  if (messages.length < 2) {
    // Skip very short conversations (just a greeting or empty)
    return null;
  }

  // Load user profile
  const user = User.findById(conversation.user_id);

  // Load skill events during this conversation's timeframe
  const allSkills = SkillEvent.findByUserId(conversation.user_id);
  const skills = allSkills.filter(s =>
    s.practiced_at >= conversation.started_at &&
    (!conversation.ended_at || s.practiced_at <= conversation.ended_at)
  );

  // Load safety events during this conversation
  const allSafety = SafetyEvent.findByUserId(conversation.user_id);
  const safetyEvents = allSafety.filter(s =>
    s.created_at >= conversation.started_at &&
    (!conversation.ended_at || s.created_at <= conversation.ended_at)
  );

  // Load user-submitted feedback (may be null)
  const feedback = ConversationFeedback.findByConversationId(conversationId);

  // Build the export object
  const userName = user?.name || 'Unknown';
  const osType = user?.os_type || 'Unknown';
  const topicHint = conversation.task_type || 'general';

  const exported = {
    conversation_id: conversationId,
    name: `${topicHint} — ${userName} (${osType})`,
    user: {
      name: userName,
      os_type: osType,
      comfort_level: user?.comfort_level ?? 1,
      vocabulary_level: user?.vocabulary_level || 'basic',
    },
    skills_activated: [...new Set(skills.map(s => s.skill_name))],
    safety_events: safetyEvents.map(s => ({
      type: s.event_type,
      trigger: s.trigger_text,
      timestamp: s.created_at,
    })),
    status: conversation.status,
    started_at: conversation.started_at,
    ended_at: conversation.ended_at,
    feedback: feedback
      ? {
          rating: feedback.rating,
          comment: feedback.comment,
          created_at: feedback.created_at,
        }
      : null,
    turns: messages.map(m => ({
      role: m.role === 'assistant' ? 'agent' : 'user',
      content: m.body,
      timestamp: m.created_at,
    })),
  };

  // Write to file
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `conv-${conversationId}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(exported, null, 2));
  console.log(`[exporter] Exported: ${filename} (${messages.length} turns)`);
  return filepath;
}

/**
 * Export all completed/closed/abandoned conversations that haven't been exported yet.
 * @returns {string[]} array of exported file paths
 */
function exportAll() {
  const allConversations = require('../db/database')
    .prepare("SELECT id FROM conversations WHERE status IN ('completed', 'closed', 'abandoned')")
    .all();

  const exported = [];
  for (const row of allConversations) {
    const filepath = path.join(OUTPUT_DIR, `conv-${row.id}.json`);
    if (!fs.existsSync(filepath)) {
      const result = exportConversation(row.id);
      if (result) exported.push(result);
    }
  }

  console.log(`[exporter] Exported ${exported.length} new conversations`);
  return exported;
}

module.exports = { exportConversation, exportAll };
