/**
 * systemModifyingDetector
 *
 * Heuristic check over assistant response text (and optionally the attached
 * guide JSON) that flags walkthroughs which mutate the user's machine state.
 *
 * Used by both orchestrators to attach `systemModifying: true` to the
 * outgoing assistant message so the client can render a DisclaimerCard
 * next to the step sequence. Closes the ethics review's Priority 1c
 * finding that registry-edit walkthroughs shipped with no inline warning.
 *
 * This is a fast, dependency-free heuristic — it intentionally has a low
 * false-negative rate at the cost of some false positives. A future sprint
 * may replace it with a Claude classifier call; until then, the rule is
 * "when in doubt, show the disclaimer."
 */

// Patterns are checked case-insensitively.
//
// Each entry is { name, pattern } — `name` is what shows up in
// detectSystemModifying().matched so callers (and tests) can see which
// rule fired.
const PATTERNS = [
  // Registry editing — by far the highest-stakes case.
  { name: 'registry', pattern: /\bregistry\b/i },
  { name: 'regedit', pattern: /\bregedit(?:\.exe)?\b/i },
  { name: 'reg_add', pattern: /\breg\s+(?:add|delete|import)\b/i },
  { name: 'hkey', pattern: /\bHKEY_(?:LOCAL_MACHINE|CURRENT_USER|CLASSES_ROOT|USERS|CURRENT_CONFIG)\b/i },

  // Group Policy + Windows admin consoles.
  { name: 'gpedit', pattern: /\bgpedit(?:\.msc)?\b/i },
  { name: 'group_policy', pattern: /\bgroup\s+policy\b/i },
  { name: 'services_msc', pattern: /\bservices\.msc\b/i },
  { name: 'msconfig', pattern: /\bmsconfig\b/i },
  { name: 'control_panel', pattern: /\bcontrol\s+panel\b/i },
  { name: 'system_properties', pattern: /\bsystem\s+properties\b/i },
  { name: 'device_manager', pattern: /\bdevice\s+manager\b/i },

  // Privilege escalation and direct shell mutation prompts.
  { name: 'sudo', pattern: /\bsudo\b/i },
  { name: 'run_as_admin', pattern: /\brun\s+as\s+(?:an\s+)?administrator\b/i },
  { name: 'elevated_prompt', pattern: /\belevated\s+(?:prompt|command|powershell)\b/i },

  // "Run this command" style imperatives in chat text. The agent is
  // supposed to put commands in guide steps via create_guide, but the
  // detector also runs over the raw text so it catches stragglers.
  { name: 'run_command', pattern: /\brun\s+(?:this\s+|the\s+following\s+)?command\b/i },
  { name: 'paste_into_terminal', pattern: /\b(?:paste|type)\s+(?:this|the\s+following)\s+(?:in(?:to)?|at)\s+(?:the\s+)?(?:terminal|command\s+prompt|powershell)\b/i },

  // Toggling a feature/setting/service. Phrased as "enable|disable
  // <thing> (setting|service|feature|option)" so we don't fire on
  // generic "enable subtitles" small-talk.
  { name: 'enable_disable_feature', pattern: /\b(?:enable|disable|turn\s+(?:on|off))\s+\w+(?:\s+\w+){0,3}?\s+(?:setting|service|feature|option|policy)\b/i },

  // Editing hosts, environment, or PATH — classic "this changes the
  // machine in a way that's hard to undo" surfaces.
  { name: 'hosts_file', pattern: /\bhosts\s+file\b/i },
  { name: 'path_env_var', pattern: /\b(?:PATH|environment)\s+variable\b/i },

  // Software lifecycle changes.
  { name: 'install_software', pattern: /\b(?:install|uninstall|reinstall)\s+(?:a\s+|the\s+|this\s+)?(?:program|app|application|driver|package|software)\b/i },
  { name: 'package_manager', pattern: /\b(?:apt(?:-get)?|yum|dnf|brew|choco|winget|pacman)\s+(?:install|remove|upgrade|update)\b/i },
];

/**
 * Detect whether `text` describes a system-modifying action.
 *
 * @param {string} text Assistant response text. Guide step bodies may also
 *   be passed in (concatenated by the caller) since the patterns are
 *   plain-language and work across both.
 * @returns {{ isModifying: boolean, matched: string[] }}
 */
function detectSystemModifying(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { isModifying: false, matched: [] };
  }

  const matched = [];
  for (const { name, pattern } of PATTERNS) {
    if (pattern.test(text)) {
      matched.push(name);
    }
  }

  return { isModifying: matched.length > 0, matched };
}

/**
 * Concatenate a guide's text content for detection purposes.
 * Pulls title, description, step titles, bodies, and commands so the
 * detector doesn't miss a registry-edit guide whose chat text was vague
 * ("Here's a step-by-step guide") but whose steps have the actual risk.
 *
 * @param {object|null} guide
 * @returns {string}
 */
function flattenGuideText(guide) {
  if (!guide || typeof guide !== 'object') return '';
  const parts = [];
  if (guide.title) parts.push(guide.title);
  if (guide.description) parts.push(guide.description);
  const steps = Array.isArray(guide.steps) ? guide.steps : [];
  for (const step of steps) {
    if (!step) continue;
    if (step.title) parts.push(step.title);
    if (step.body) parts.push(step.body);
    if (step.text) parts.push(step.text);
    if (step.caption) parts.push(step.caption);
    if (step.command) parts.push(step.command);
    if (step.note?.text) parts.push(step.note.text);
  }
  return parts.join('\n');
}

module.exports = {
  detectSystemModifying,
  flattenGuideText,
  PATTERNS,
};
