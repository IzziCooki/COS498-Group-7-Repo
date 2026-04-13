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

// Patterns that indicate the user is ASKING about a potential scam (not being actively scammed).
// These should pass through to Claude for conversational analysis via the scam-check skill.
const SCAM_QUESTION_PATTERNS = [
  /\bis this a scam\b/i,
  /\bis this (real|legitimate|legit)\b/i,
  /\bam i (being|getting) scammed\b/i,
  /\bshould i trust\b/i,
  /\bcan i trust\b/i,
  /\bis this (person|caller|email|message) (real|safe|legitimate)\b/i,
  /\bdoes this sound (right|real|legitimate|like a scam)\b/i,
  /\bsomeone (called|emailed|texted|messaged) me.*(scam|real|trust|suspicious)/i,
  /\bshould i (give|send|pay|call)\b/i,
  /\bis it safe to\b/i,
];

/**
 * Check a user message for emergency situations or scam patterns.
 * Logs to SafetyEvent if a threat is detected.
 *
 * If the user is ASKING whether something is a scam (vs. describing an active
 * scam targeting them), the message passes through to Claude so the
 * analyze_scam_situation tool can provide a conversational analysis.
 *
 * @param {string} text    The user's message text
 * @param {string} userId  The user's ID (for logging)
 * @returns {{ safe: boolean, type: null|'emergency'|'scam'|'scam_question', response: null|string }}
 */
function checkMessage(text, userId) {
  if (!text) return { safe: true, type: null, response: null };

  // Check for emergency keywords first (highest priority — always intercept)
  for (const { keyword, regex } of compiledEmergencyPatterns) {
    if (regex.test(text)) {
      try {
        SafetyEvent.create({
          user_id: userId,
          event_type: 'emergency',
          trigger_text: text.slice(0, 500),
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

  // Check if the user is ASKING about a scam (should pass through to Claude)
  const isAskingAboutScam = SCAM_QUESTION_PATTERNS.some(p => p.test(text));
  if (isAskingAboutScam) {
    // Log the event but let the message through to Claude for conversational analysis
    try {
      SafetyEvent.create({
        user_id: userId,
        event_type: 'scam_question',
        trigger_text: text.slice(0, 500),
      });
    } catch (dbErr) {
      console.error('[safetyMonitor] Failed to log scam_question event to DB:', dbErr);
    }
    return { safe: true, type: 'scam_question', response: null };
  }

  // Check for active scam patterns (user describing something happening to them)
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
