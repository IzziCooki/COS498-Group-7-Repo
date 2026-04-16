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
  const level = parseInt(comfortLevel) || 1;
  if (level <= 1) {
    return `This user is BRAND NEW to computers.
- Use analogies to everyday objects (a folder is like a filing cabinet drawer, the desktop is like the top of a desk)
- Explain every step in extreme detail; assume they have never done this before
- MAXIMUM 2 steps per response — if a task has more steps, pause and wait for confirmation before continuing
- Always call show_visual_guide when explaining any visual or procedural task
- Use the start_step_sequence tool for any task with 2 or more steps
- After each step, ask "Did that work?" before moving on`;
  } else if (level <= 3) {
    return `This user knows the basics but needs guidance.
- Use plain language; skip analogies unless they seem confused
- Break tasks into 3–5 numbered steps using start_step_sequence
- Call show_visual_guide when starting a new topic they haven't done before
- Ask "Would you like me to walk you through it step by step, or do you want to try it yourself?" before launching into a full guide`;
  } else {
    return `This user is fairly comfortable with computers.
- Be concise; fewer steps, less hand-holding
- Only call show_visual_guide when they explicitly ask to see how
- Skip step sequences for simple tasks; use them only for complex multi-step procedures`;
  }
}

module.exports = {
  VALID_GUIDE_IDS,
  BLOCKED_PATTERNS,
  buildComfortGuidelines,
};
