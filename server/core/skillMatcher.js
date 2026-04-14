const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

/**
 * Load all skill definitions from server/skills/*.json
 */
function loadSkills() {
  const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.json'));
  const skills = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf-8');
      const skill = JSON.parse(raw);
      skills.push(skill);
    } catch (err) {
      console.error(`[skillMatcher] Failed to load skill ${file}:`, err.message);
    }
  }

  console.log(`[skillMatcher] Loaded ${skills.length} skills`);
  return skills;
}

// Load once at startup
const skills = loadSkills();

// Priority weights for difficulty levels — higher difficulty skills win ties
const DIFFICULTY_PRIORITY = {
  critical: 3,
  intermediate: 2,
  beginner: 1,
};

/**
 * Match user input to the best skill.
 * Returns the matched skill object, or null if no match.
 *
 * Scoring: counts how many trigger words appear in the user's message.
 * The skill with the most matches wins. Ties broken by difficulty priority
 * (critical > intermediate > beginner).
 *
 * @param {string} text - the user's message
 * @returns {{ skill: object, score: number } | null}
 */
function matchSkill(text) {
  if (!text) return null;

  const normalized = text.toLowerCase().trim();
  let bestSkill = null;
  let bestScore = 0;
  let bestPriority = 0;

  for (const skill of skills) {
    let score = 0;
    for (const trigger of skill.triggers) {
      if (normalized.includes(trigger.toLowerCase())) {
        score += 1;
      }
    }

    const priority = DIFFICULTY_PRIORITY[skill.difficulty] || 1;

    if (score > bestScore || (score === bestScore && score > 0 && priority > bestPriority)) {
      bestScore = score;
      bestSkill = skill;
      bestPriority = priority;
    }
  }

  if (bestSkill && bestScore > 0) {
    return { skill: bestSkill, score: bestScore };
  }

  return null;
}

/**
 * Build a skill-specific prompt addition for the AI.
 * Injected into the Claude CLI prompt when a skill matches.
 *
 * @param {object} skill - the matched skill object
 * @returns {string}
 */
function buildSkillPrompt(skill) {
  return `\nSKILL ACTIVATED: "${skill.name}" (${skill.category}, ${skill.difficulty})
${skill.prompt}`;
}

/**
 * Get a summary of all available skills (for the AI's context).
 * @returns {string}
 */
function getSkillsSummary() {
  return skills
    .map(s => `- ${s.name}: ${s.description}`)
    .join('\n');
}

/**
 * Get all loaded skills.
 * @returns {Array}
 */
function getAllSkills() {
  return skills;
}

module.exports = { matchSkill, buildSkillPrompt, getSkillsSummary, getAllSkills };
