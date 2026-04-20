/**
 * Shared constants and helpers used by both orchestrators and MCP tools.
 *
 * Single source of truth for:
 * - VALID_GUIDE_IDS (visual guide task IDs)
 * - BLOCKED_PATTERNS (dangerous command patterns)
 * - buildComfortGuidelines (comfort-level text)
 */

// ─── Visual Guide IDs ─────────────────────────────────────────────
// Used by agentOrchestrator, agentSdkOrchestrator, and pcpalTools

const VALID_GUIDE_IDS = [
  'copy_paste', 'take_screenshot', 'send_email', 'open_settings',
  'zoom_text', 'find_wifi', 'attach_file', 'open_browser',
  'restart_computer', 'use_taskbar'
];

// ─── Blocked Command Patterns ─────────────────────────────────────
// Dangerous patterns that should NEVER be allowed regardless of allowlist.
// Used by systemDiagnostics.js and agent/pcpal-agent.js

const BLOCKED_PATTERNS = [
  /[;&|`$]/,           // command chaining / injection
  /\brm\b/i,           // remove files
  /\bdel\b/i,          // delete (windows)
  /\bformat\b/i,       // format disk
  /\bmkfs\b/i,         // make filesystem
  /\bdd\b/i,           // disk dump
  /\bsudo\b/i,         // privilege escalation
  /\brunas\b/i,        // windows privilege escalation
  /\bchmod\b/i,        // change permissions
  /\bchown\b/i,        // change ownership
  /\bkill\b/i,         // kill process
  /\btaskkill\b/i,     // windows kill process
  /\bshutdown\b/i,     // shutdown
  /\breboot\b/i,       // reboot
  /\bcurl\b/i,         // download from internet
  /\bwget\b/i,         // download from internet
  /\bnpm\b/i,          // package manager
  /\bpip\b/i,          // package manager
  /\bapt\b/i,          // package manager
  /\bbrew\b/i,         // package manager
  /\breg\b/i,          // windows registry
  />\s*/,              // output redirection
  /\bpowershell\b.*\b(Remove|Set|New|Stop|Restart)/i, // destructive PS commands
];

// ─── Comfort-Level Guidelines ─────────────────────────────────────
// Used by both orchestrators to set the teaching style

function buildComfortGuidelines(comfortLevel) {
  const level = parseInt(comfortLevel, 10) || 1;
  if (level <= 1) {
    return `BRAND NEW to computers.
- Use everyday analogies (folder = filing cabinet drawer)
- Maximum 2 steps per guide, then wait for "done" before continuing
- Use create_guide for any multi-step task
- After each step, ask "Did that work?"
- For goal tasks (email, call, message): ask what app they use and what they want to say BEFORE giving steps
- Inside guide steps: NEVER say "double-click", "browser", "address bar", "taskbar", "desktop", "icon" without explaining. Say "click twice quickly", "internet app", "the long white box at the top", "the strip of little pictures at the bottom", "the main screen", "the little picture"`;
  } else if (level <= 3) {
    return `Knows basics, needs guidance.
- Plain language, skip analogies unless confused
- 3-5 steps per guide is fine
- Ask "Step by step, or try yourself?" before full guides`;
  } else {
    return `Fairly comfortable.
- Be concise, skip hand-holding
- Use guides only for complex procedures`;
  }
}

module.exports = {
  VALID_GUIDE_IDS,
  BLOCKED_PATTERNS,
  buildComfortGuidelines,
};
