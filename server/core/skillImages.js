/**
 * Maps skill IDs + device types to annotated image filenames.
 *
 * When a skill is matched and the user's device has images available,
 * the relevant annotated screenshots are included in the response.
 *
 * Image files live in server/assets/annotated/
 * Add new entries as more screenshots are uploaded.
 */

const SKILL_IMAGES = {};

/**
 * Get annotated images for a skill + device combination.
 *
 * @param {string} skillId - the matched skill ID (e.g., 'wifi')
 * @param {string} osType - the user's device (e.g., 'iPhone')
 * @returns {Array<{ url: string, alt: string }>|null}
 */
function getImagesForSkill(skillId, osType) {
  const skillEntry = SKILL_IMAGES[skillId];
  if (!skillEntry) return null;

  const deviceImages = skillEntry[osType];
  if (!deviceImages || deviceImages.length === 0) return null;

  return deviceImages.map(img => ({
    url: `/images/${img.file}`,
    alt: img.alt,
  }));
}

/**
 * Check if images exist for a skill + device combination.
 */
function hasImages(skillId, osType) {
  return !!(SKILL_IMAGES[skillId]?.[osType]?.length);
}

module.exports = { getImagesForSkill, hasImages, SKILL_IMAGES };
