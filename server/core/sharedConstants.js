/**
 * Shared constants and helpers used by both orchestrators and MCP tools.
 *
 * Single source of truth for:
 * - VALID_GUIDE_IDS (visual guide task IDs)
 * - BLOCKED_PATTERNS (dangerous command patterns)
 * - buildComfortGuidelines (comfort-level text)
 * - VOCAB_LEVELS (vocabulary simplification levels)
 * - VALID_TASK_TYPES (message classification types)
 * - VALID_URGENCY (urgency levels)
 * - MEMORY_TYPES (user memory observation types)
 * - RISK_LEVELS (scam risk assessment levels)
 * - FINDING_STATUSES (diagnostic finding statuses)
 * - INTERMEDIATE_KEYS (jargon terms for intermediate vocab filtering)
 * - buildWordRegex (word-boundary regex builder for vocab matching)
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

// ─── Vocabulary Levels ───────────────────────────────────────────
// Used by vocabularyFilter, vocabularyProgression, agentOrchestrator, pcpalTools

const VOCAB_LEVELS = ['basic', 'intermediate', 'standard'];

// ─── Task Classification ─────────────────────────────────────────
// Used by taskClassifier and agentOrchestrator

const VALID_TASK_TYPES = ['learn_skill', 'troubleshoot', 'follow_up', 'accessibility', 'unknown'];
const VALID_URGENCY = ['low', 'medium', 'high'];

// ─── Memory Types ────────────────────────────────────────────────
// Used by UserMemory model and pcpalTools (save_memory tool)

const MEMORY_TYPES = ['preference', 'struggle', 'breakthrough', 'context', 'pattern'];

// ─── Risk / Status Enums ─────────────────────────────────────────
// Used by pcpalTools (analyze_scam_situation, create_findings) and agentOrchestrator

const RISK_LEVELS = ['high', 'medium', 'low'];
const FINDING_STATUSES = ['good', 'warning', 'bad'];

// ─── Intermediate Vocabulary Keys ────────────────────────────────
// Subset of jargon terms applied at the 'intermediate' level.
// Used by vocabularyFilter and vocabularyProgression.

const INTERMEDIATE_KEYS = [
  'malware',
  'phishing',
  'bandwidth',
  'cache',
  'firewall',
  'cookie',
  'router',
  'Wi-Fi',
  'VPN',
  'two-factor authentication',
  '2FA',
  'encryption',
  'sync',
  'cloud',
  'SSID',
];

// ─── Shared Helpers ──────────────────────────────────────────────

/**
 * Build a regex that matches a term as a whole word (case-insensitive).
 * Handles special regex characters in the term.
 */
function buildWordRegex(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'gi');
}

module.exports = {
  VALID_GUIDE_IDS,
  BLOCKED_PATTERNS,
  buildComfortGuidelines,
  VOCAB_LEVELS,
  VALID_TASK_TYPES,
  VALID_URGENCY,
  MEMORY_TYPES,
  RISK_LEVELS,
  FINDING_STATUSES,
  INTERMEDIATE_KEYS,
  buildWordRegex,
};
