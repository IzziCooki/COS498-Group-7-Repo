const SkillEvent = require('../models/SkillEvent');

// Skill learning chains — each chain builds on previous skills
const SKILL_CHAINS = [
  ['copy_paste', 'send_email', 'attach_file'],
  ['open_browser', 'find_wifi', 'open_settings'],
  ['take_screenshot', 'zoom_text', 'use_taskbar', 'restart_computer'],
];

// Human-readable names for skill IDs
const SKILL_NAMES = {
  copy_paste: 'Copy and Paste',
  take_screenshot: 'Take a Screenshot',
  send_email: 'Send an Email',
  open_settings: 'Open Settings',
  zoom_text: 'Make Text Bigger',
  find_wifi: 'Connect to Wi-Fi',
  attach_file: 'Attach a File to Email',
  open_browser: 'Open a Web Browser',
  restart_computer: 'Restart Your Computer',
  use_taskbar: 'Use the Taskbar',
};

/**
 * Get the next recommended skill for a user based on their completion history.
 * Walks each skill chain and finds the first uncompleted skill.
 *
 * @param {string} userId
 * @returns {{ skillId: string, skillName: string, reason: string } | null}
 */
function getNextSkill(userId) {
  const events = SkillEvent.findByUserId(userId);
  const completedSkills = new Set(
    events
      .filter(e => e.status === 'completed')
      .map(e => e.skill_name)
  );

  for (const chain of SKILL_CHAINS) {
    for (let i = 0; i < chain.length; i++) {
      const skillId = chain[i];
      if (!completedSkills.has(skillId)) {
        const prevSkill = i > 0 ? chain[i - 1] : null;
        const reason = prevSkill && completedSkills.has(prevSkill)
          ? `You already learned ${SKILL_NAMES[prevSkill]}, and ${SKILL_NAMES[skillId]} builds on that!`
          : `${SKILL_NAMES[skillId]} is a great place to start!`;
        return { skillId, skillName: SKILL_NAMES[skillId], reason };
      }
    }
  }

  return { skillId: null, skillName: null, reason: "You've completed all available skills! Amazing work!" };
}

/**
 * Get all skills with their completion status for a user.
 * @param {string} userId
 * @returns {Array<{ skillId: string, skillName: string, completed: boolean, lastPracticed: string|null }>}
 */
function getSkillStatus(userId) {
  const events = SkillEvent.findByUserId(userId);
  const skillMap = {};
  for (const e of events) {
    if (!skillMap[e.skill_name] || e.status === 'completed') {
      skillMap[e.skill_name] = e;
    }
  }

  return Object.keys(SKILL_NAMES).map(skillId => ({
    skillId,
    skillName: SKILL_NAMES[skillId],
    completed: skillMap[skillId]?.status === 'completed',
    lastPracticed: skillMap[skillId]?.practiced_at || null,
  }));
}

/**
 * Get skills that are due for spaced repetition review.
 * @param {string} userId
 * @returns {Array<{ skillName: string, scheduledAt: string }>}
 */
function getSkillsForReview(userId) {
  const SkillReview = require('../models/SkillReview');
  try {
    const dueReviews = SkillReview.findDueForUser(userId);
    return dueReviews.map(r => ({
      skillName: SKILL_NAMES[r.skill_name] || r.skill_name,
      skillId: r.skill_name,
      reviewId: r.id,
    }));
  } catch (e) {
    // skill_reviews table may not exist yet
    return [];
  }
}

module.exports = { getNextSkill, getSkillStatus, getSkillsForReview, SKILL_CHAINS, SKILL_NAMES };
