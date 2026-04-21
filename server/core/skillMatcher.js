const fs = require('fs');
const path = require('path');
const uiReferenceLibrary = require('./uiReferenceLibrary');

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

/**
 * Build a prompt fragment listing UI reference image IDs relevant to this skill.
 * Returns empty string when no references apply, so the system prompt stays lean
 * for skills that don't benefit from images.
 *
 * @param {string} skillId - the matched skill's id field (e.g. 'send-email')
 * @returns {string}
 */
function buildSkillImagePrompt(skillId) {
  // Foundational wildcard images apply even when skillId is null, so we still
  // build the prompt. Only bail if the registry returns nothing at all.
  const ids = uiReferenceLibrary.getIdsForSkill(skillId);
  if (ids.length === 0) return '';

  const lines = ids.map(id => {
    const img = uiReferenceLibrary.getById(id);
    return `  - "${id}": ${img.alt}`;
  }).join('\n');

  return `

## AVAILABLE UI REFERENCES (pictures the user can see inside the guide)

CRITICAL: Pictures help elderly users more than any amount of text description. For EVERY guide step that mentions an element listed below, you MUST include "image_id": "<exact-id>" so the user sees a picture of what you're describing. A step that says "click the colorful circle" WITHOUT image_id="chrome-icon" has failed the user — they cannot visualize what you're describing from words alone.

Available image IDs:
${lines}

### Concrete example of what this looks like in practice

BAD create_guide call (no images, user is lost):
{
  "title": "Open Internet App and Go to Zoom",
  "steps": [
    { "text": "Look for a colorful circle or blue-green swirl at the bottom of your screen" },
    { "text": "Click in the long white box at the top and type zoom.us" }
  ]
}

GOOD create_guide call (every recognizable element has image_id):
{
  "title": "Open Internet App and Go to Zoom",
  "steps": [
    {
      "text": "Look at the strip of little pictures at the bottom of your screen — that's your taskbar.",
      "image_id": "windows-taskbar"
    },
    {
      "text": "Find the colorful circle in the taskbar — that's Chrome, your internet app. Click it twice quickly to open it.",
      "image_id": "chrome-icon"
    },
    {
      "text": "Click once in the long white box at the top and type zoom.us, then press Enter.",
      "image_id": "chrome-address-bar"
    }
  ]
}

Notice how the GOOD version uses image_id on EVERY step that mentions a recognizable element. If you mention Chrome, taskbar, the address bar, a Compose button, etc. — add the matching image_id. This is not optional.

### Rules
- Include image_id on every guide step that describes one of the listed elements. If you say "open your internet app", add image_id="chrome-icon" (or edge-icon, firefox-icon, safari-icon — pick whichever the user uses).
- Use the EXACT id string — no variations, no new ids.
- If no id matches the element you're describing, omit image_id (never invent one — unknown IDs are silently dropped).
- A single guide can and should use multiple image_ids across its steps.`;
}

module.exports = { matchSkill, buildSkillPrompt, getSkillsSummary, getAllSkills, buildSkillImagePrompt };
