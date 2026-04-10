const SafetyEvent = require('../models/SafetyEvent');

const EMERGENCY_KEYWORDS = [
  "fallen",
  "can't breathe",
  "chest pain",
  "someone help me",
  "please help",
  "I need help now",
  "911",
  "emergency",
  "hurt",
  "alone and scared",
];

// Scam-indicator patterns — phrases commonly seen in tech-support scams targeting elderly users
const SCAM_PATTERNS = [
  /\bgive me (your |the )?(password|credit card|social security|bank account|account number)\b/i,
  /\b(microsoft|apple|google|windows|irs|social security)\s+(called?|is calling|says?|told me|warned?)\b/i,
  /\bsend (gift card|itunes card|google play|wire transfer|bitcoin|crypto)\b/i,
  /\b(pay|wire|send)\s+\$?\d+\s+(to fix|for support|to unlock|to remove)\b/i,
  /\byour (computer|pc|device|account) (has been|is) (hacked|compromised|infected|locked)\b/i,
  /\bcall (this number|us now|immediately|right away) to (fix|protect|secure|unlock)\b/i,
  /\bremote (access|control|desktop) (to your|your|on your) (computer|pc|device)\b/i,
  /\bdo not (turn off|close|restart|touch) your (computer|pc|device)\b/i,
];

const EMERGENCY_RESPONSE =
  "I hear you. Please call 911 if you need immediate help: dial 9-1-1. I'm logging this so someone can check on you.";

const SCAM_RESPONSE =
  "This sounds like it could be a scam. Hang up or close any pop-up windows. Do not give anyone your passwords or payment information. Real tech companies do not ask for payment this way.";

/**
 * Build a word-boundary regex for an emergency keyword phrase.
 * Phrases with multiple words use a relaxed boundary only at the start/end.
 */
function buildEmergencyRegex(phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // For multi-word phrases, use word boundaries at the outer edges
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const compiledEmergencyPatterns = EMERGENCY_KEYWORDS.map(kw => ({
  keyword: kw,
  regex: buildEmergencyRegex(kw),
}));

/**
 * Check a user message for emergency situations or scam patterns.
 * Logs to SafetyEvent if a threat is detected.
 *
 * @param {string} text    The user's message text
 * @param {string} userId  The user's ID (for logging)
 * @returns {{ safe: boolean, type: null|'emergency'|'scam', response: null|string }}
 */
function checkMessage(text, userId) {
  if (!text) return { safe: true, type: null, response: null };

  // Check for emergency keywords first (higher priority)
  for (const { keyword, regex } of compiledEmergencyPatterns) {
    if (regex.test(text)) {
      try {
        SafetyEvent.create({
          user_id: userId,
          event_type: 'emergency',
          trigger_text: text.slice(0, 500), // cap stored text
        });
      } catch (dbErr) {
        console.error('[safetyMonitor] Failed to log emergency event to DB:', dbErr);
      }
      return {
        safe: false,
        type: 'emergency',
        response: EMERGENCY_RESPONSE,
      };
    }
  }

  // Check for scam patterns
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(text)) {
      try {
        SafetyEvent.create({
          user_id: userId,
          event_type: 'scam',
          trigger_text: text.slice(0, 500),
        });
      } catch (dbErr) {
        console.error('[safetyMonitor] Failed to log scam event to DB:', dbErr);
      }
      return {
        safe: false,
        type: 'scam',
        response: SCAM_RESPONSE,
      };
    }
  }

  return { safe: true, type: null, response: null };
}

module.exports = { checkMessage };
