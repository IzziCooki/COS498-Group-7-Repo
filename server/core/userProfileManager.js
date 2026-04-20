const User = require('../models/User');
const SkillEvent = require('../models/SkillEvent');

/**
 * Returns a human-readable relative time string for a given ISO date string.
 * e.g. "2 weeks ago", "1 month ago"
 */
function relativeTime(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

const userProfileManager = {
  /**
   * Looks up a user by ID. If not found, creates a new user with that ID and returns it.
   * @param {string} id
   * @returns {object} user record
   */
  getOrCreateUser(id) {
    if (!id) throw new Error('id is required');
    const existing = User.findById(id);
    if (existing) return existing;
    return User.create({ id });
  },

  /**
   * Updates allowed profile fields for a user.
   * Allowed fields: name, os_type, vocabulary_level, comfort_level, accessibility_needs, onboarded
   * @param {string} id
   * @param {object} fields
   * @returns {object} updated user record
   */
  updateProfile(id, fields) {
    const allowed = ['name', 'os_type', 'vocabulary_level', 'comfort_level', 'accessibility_needs', 'onboarded', 'collaboration_opt_in', 'goal_summary', 'invite_code', 'model_preference'];
    const filtered = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        filtered[key] = fields[key];
      }
    }
    return User.update(id, filtered);
  },

  /**
   * Returns a formatted string for injecting into Claude's system prompt,
   * including user profile data and skill history.
   * @param {string} id
   * @returns {string} formatted profile string
   */
  getProfileForPrompt(id) {
    const user = User.findById(id);
    if (!user) return 'User: unknown (no profile found)';

    const skillEvents = SkillEvent.findByUserId(id);

    // Build name/age line
    const namePart = user.name || 'Unknown';
    const nameLine = `User: ${namePart}`;

    // Device line
    const deviceLine = `Device: ${user.os_type || 'unknown'}`;

    // Vocabulary level
    const vocabLine = `Vocabulary level: ${user.vocabulary_level || 'basic'}`;

    // Comfort level
    const comfortLine = `Comfort level: ${user.comfort_level !== null && user.comfort_level !== undefined ? user.comfort_level : 1}/5`;

    // Skills completed — deduplicate by skill_name, keep most recent
    const skillMap = {};
    for (const event of skillEvents) {
      if (event.status === 'completed') {
        if (!skillMap[event.skill_name] || event.practiced_at > skillMap[event.skill_name].practiced_at) {
          skillMap[event.skill_name] = event;
        }
      }
    }
    const skillList = Object.values(skillMap);
    let skillsLine;
    if (skillList.length === 0) {
      skillsLine = 'Skills completed: none yet';
    } else {
      const formatted = skillList.map(e => `${e.skill_name} (${relativeTime(e.practiced_at)})`).join(', ');
      skillsLine = `Skills completed: [${formatted}]`;
    }

    // Accessibility needs
    let accessibilityNeeds = [];
    try {
      accessibilityNeeds = JSON.parse(user.accessibility_needs || '[]');
    } catch (_) {
      accessibilityNeeds = [];
    }
    const accessibilityLine = `Accessibility: ${accessibilityNeeds.length > 0 ? accessibilityNeeds.join(', ') : 'none specified'}`;

    // Learning goal
    const goalLine = user.goal_summary
      ? `Learning goal: "${user.goal_summary}"`
      : 'Learning goal: not yet shared';

    return [nameLine, deviceLine, vocabLine, comfortLine, goalLine, skillsLine, accessibilityLine].join('\n');
  },
};

module.exports = userProfileManager;
