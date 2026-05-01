/**
 * Vocabulary Progression — gradual jargon introduction.
 *
 * Instead of always replacing jargon with simple terms, this module
 * tracks per-user, per-term encounter counts and gradually introduces
 * the real vocabulary over time:
 *
 *   Encounters 1-2:  "internet app (also called a browser)"
 *   Encounters 3-4:  "browser (the internet app)"
 *   Encounters 5+:   "browser"
 *
 * If the user asks "what's a browser?", the count resets to 0.
 */

const path = require('path');
const substitutions = require(path.join(__dirname, '../assets/vocabulary/basicSubstitutions.json'));
const UserVocabulary = require('../models/UserVocabulary');
const vocabularyFilter = require('./vocabularyFilter');
const { INTERMEDIATE_KEYS, buildWordRegex } = require('./sharedConstants');

// Pre-compute the reverse map: simpleTerm → jargonTerm
// e.g. "internet app" → "browser"
const reverseMap = {};
for (const [jargon, simple] of Object.entries(substitutions)) {
  reverseMap[simple] = jargon;
}

/**
 * Get the set of jargon keys to process for a given vocab level.
 */
function keysForLevel(vocabLevel) {
  if (vocabLevel === 'basic') return Object.keys(substitutions);
  if (vocabLevel === 'intermediate') return INTERMEDIATE_KEYS;
  return [];
}

/**
 * Apply vocabulary filtering with gradual progression.
 *
 * For each jargon term that appears in the AI response:
 * - Look up the user's encounter count for that term
 * - Apply the appropriate phase of replacement
 * - Increment the encounter count
 *
 * Falls back to the standard filterResponse if no userId is provided.
 *
 * @param {string} text        The AI response text
 * @param {string} vocabLevel  'basic' | 'intermediate' | 'standard'
 * @param {string} [userId]    User ID for per-user tracking
 * @returns {string}
 */
function filterWithProgression(text, vocabLevel, userId) {
  if (!text || vocabLevel === 'standard') return text;

  // Fallback: no userId means use the original flat filter
  if (!userId) {
    return vocabularyFilter.filterResponse(text, vocabLevel);
  }

  const keys = keysForLevel(vocabLevel);
  if (keys.length === 0) return text;

  // Load all term counts for this user in one query
  const termRows = UserVocabulary.getTerms(userId);
  const countMap = {};
  for (const row of termRows) {
    countMap[row.term] = row.encounter_count;
  }

  let result = text;
  const termsEncountered = [];

  for (const jargon of keys) {
    const simple = substitutions[jargon];
    if (!simple) continue;

    const regex = buildWordRegex(jargon);
    if (!regex.test(result)) continue;

    // Reset regex lastIndex after test()
    regex.lastIndex = 0;

    const count = countMap[jargon] || 0;
    termsEncountered.push(jargon);

    let replacement;
    if (count < 2) {
      // Phase 1: simple term + parenthetical intro
      replacement = `${simple} (also called a ${jargon})`;
    } else if (count < 4) {
      // Phase 2: real term + parenthetical reminder
      replacement = `${jargon} (${simple})`;
    } else {
      // Phase 3: real term only — no replacement needed
      continue;
    }

    result = result.replace(regex, replacement);
  }

  // Increment encounter counts for all terms found
  for (const term of termsEncountered) {
    UserVocabulary.incrementTerm(userId, term);
  }

  return result;
}

/**
 * Check if the user's message is asking about a jargon term
 * (e.g. "what's a browser?", "what does URL mean?").
 * If so, reset that term's encounter count so the progression restarts.
 *
 * @param {string} userMessage  The user's input text
 * @param {string} userId       User ID
 * @returns {string[]}          Array of terms that were reset (for logging)
 */
function checkForTermQuestions(userMessage, userId) {
  if (!userMessage || !userId) return [];

  const lower = userMessage.toLowerCase();
  const resetTerms = [];

  for (const jargon of Object.keys(substitutions)) {
    const jargonLower = jargon.toLowerCase();
    // Match: "what is a browser", "what's a browser", "what are cookies",
    //        "what does browser mean", "what does URL mean"
    const patterns = [
      new RegExp(`what(?:'s|\\s+is|\\s+are)\\s+(?:a\\s+|an\\s+)?${jargonLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
      new RegExp(`what\\s+does\\s+${jargonLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+mean`, 'i'),
    ];

    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        UserVocabulary.resetTerm(userId, jargon);
        resetTerms.push(jargon);
        break;
      }
    }
  }

  if (resetTerms.length > 0) {
    console.log(`[vocabularyProgression] Reset terms for user ${userId}: ${resetTerms.join(', ')}`);
  }

  return resetTerms;
}

module.exports = { filterWithProgression, checkForTermQuestions };
