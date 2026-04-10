const path = require('path');
const substitutions = require(path.join(__dirname, '../assets/vocabulary/basicSubstitutions.json'));

// Keys that are considered "intermediate" complexity — a subset of all substitutions.
// These are the most confusing tech terms even for intermediate users.
const INTERMEDIATE_KEYS = [
  'malware',
  'phishing',
  'bandwidth',
  'cache',
  'firewall',
  'cookie',
  'router',
  'Wi-Fi',
];

/**
 * Build a regex that matches a term as a whole word (case-insensitive).
 * Handles special regex characters in the term.
 */
function buildWordRegex(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'gi');
}

/**
 * Apply vocabulary substitutions to text.
 * @param {string} text
 * @param {string} vocabLevel  'basic' | 'intermediate' | 'standard'
 * @returns {string}
 */
function filterResponse(text, vocabLevel) {
  if (!text || vocabLevel === 'standard') return text;

  let result = text;
  const keysToApply = vocabLevel === 'basic'
    ? Object.keys(substitutions)
    : INTERMEDIATE_KEYS;

  for (const term of keysToApply) {
    const replacement = substitutions[term];
    if (!replacement) continue;
    result = result.replace(buildWordRegex(term), replacement);
  }

  return result;
}

/**
 * Split sentences longer than 20 words at natural break points before
 * conjunctions: "and", "but", "or", "so", "because".
 * @param {string} text
 * @returns {string}
 */
function enforceReadability(text) {
  if (!text) return text;

  // Split on sentence-ending punctuation, preserving the delimiter
  const sentences = text.split(/(?<=[.!?])\s+/);

  const processed = sentences.map(sentence => {
    const words = sentence.trim().split(/\s+/);
    if (words.length <= 20) return sentence;

    // Split at conjunctions if sentence is too long
    const breakPattern = /\s+(and|but|or|so|because)\s+/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = breakPattern.exec(sentence)) !== null) {
      const upToBreak = sentence.slice(lastIndex, match.index).trim();
      if (upToBreak) parts.push(upToBreak);
      // The conjunction starts the next segment
      lastIndex = match.index + match[0].length - match[1].length - 1; // keep one space + conjunction
      // Actually start the next segment with the conjunction
      lastIndex = match.index + 1; // skip the leading space
    }
    // Push the remaining text
    const tail = sentence.slice(lastIndex).trim();
    if (tail) parts.push(tail);

    if (parts.length <= 1) return sentence; // no breaks found or nothing split

    // Capitalize first letter of each new segment after punctuating previous one
    const joined = parts.map((part, i) => {
      if (i === 0) return part;
      // Capitalize first word
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('. ');

    // Ensure the joined string ends with a period if it doesn't already have terminal punctuation
    return joined.match(/[.!?]$/) ? joined : joined + '.';
  });

  return processed.join(' ');
}

module.exports = { filterResponse, enforceReadability };
