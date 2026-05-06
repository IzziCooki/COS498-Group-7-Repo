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
- Maximum 1 step per guide, then wait for "done" before continuing
- Use create_guide for any multi-step task
- Restate the user's goal before starting steps: "To [goal], here's what we'll do."
- After each step, ask "Did that work?"
- For goal tasks (email, call, message): ask what app they use and what they want to say BEFORE giving steps
- Inside guide steps: NEVER say "double-click", "browser", "address bar", "taskbar", "desktop", "icon" without explaining. Say "click twice quickly", "internet app", "the long white box at the top", "the strip of little pictures at the bottom", "the main screen", "the little picture"
- PROACTIVELY OFFER PRACTICE: Before any new task, offer "Would you like to practice this first? Nothing will happen to your computer." Call start_practice if they accept.`;
  } else if (level <= 2) {
    return `Learning the basics, needs patient guidance.
- Plain language, use analogies when introducing new concepts
- Maximum 1 step per guide, then wait for confirmation before continuing
- Restate the user's goal before starting steps: "To [goal], here's what we'll do."
- After each step, ask "Did that work?"
- Ask "Step by step, or try yourself?" before full guides
- OFFER PRACTICE when the user seems hesitant or nervous: "Would you like to practice this first?" Call start_practice if they accept.`;
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

// ─── Auto-Fix Sandbox: Killable Process Allowlist ────────────────
// Per-OS allowlist of process names that fix_kill_process_by_name may target.
// The agent picks a name, but it MUST appear in this list before being passed
// to taskkill/pkill. Anything else is rejected. Hardcoded to prevent the
// agent from killing critical system processes.

const KILLABLE_PROCESS_ALLOWLIST = {
  windows: [
    'chrome', 'firefox', 'msedge', 'opera', 'brave',
    'spotify', 'discord', 'slack', 'teams', 'zoom',
    'notepad', 'mspaint', 'calc', 'wordpad',
    'winword', 'excel', 'powerpnt', 'outlook',
    'vlc', 'iTunes', 'AcroRd32',
  ],
  mac: [
    'Google Chrome', 'firefox', 'Safari', 'Microsoft Edge', 'Opera',
    'Spotify', 'Discord', 'Slack', 'Microsoft Teams', 'zoom.us',
    'TextEdit', 'Preview', 'Calculator',
    'Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Outlook',
    'VLC', 'iTunes', 'Music',
  ],
  linux: [
    'chrome', 'chromium', 'firefox', 'opera', 'brave',
    'spotify', 'discord', 'slack', 'zoom',
    'gedit', 'libreoffice', 'thunderbird', 'evince', 'vlc',
  ],
};

// ─── Auto-Fix Sandbox: Installable Package Allowlist (Debian) ────
// Hardcoded list of well-known, user-facing, vetted-by-Debian packages
// that fix_install_safe_package may install via `apt-get install -y`.
// The agent picks one of these by name; anything else is rejected before
// reaching the shell. Adding an entry is a code-reviewed PR — never
// build this list from agent input.

const INSTALLABLE_PACKAGE_ALLOWLIST = [
  'firefox-esr',       // browser (long-term-support build)
  'chromium',
  'thunderbird',       // email
  'libreoffice',       // office suite
  'vlc',               // media player
  'gimp',              // image editor
  'inkscape',          // vector graphics
  'audacity',          // audio editor
  'evince',            // PDF viewer
  'gnome-calculator',
  'gedit',             // text editor
  'transmission-gtk',  // torrent client
  'rhythmbox',         // music player
  'gthumb',            // photo viewer
];

// ─── Auto-Fix Sandbox: Fix-Mode Block List ───────────────────────
// A narrower block list than BLOCKED_PATTERNS, applied by runFixCommand.
// Still rejects shell-injection vectors and irrecoverable disk ops, but
// permits the specific fix verbs (rm, del, taskkill, sudo) that the curated
// fix_* tool wrappers need. Safe because every fix_* command string is
// hardcoded in the wrapper; no agent input is interpolated except the
// per-OS-allowlisted process name in fix_kill_process_by_name.

const FIX_BLOCKED_PATTERNS = [
  /[;&|`$]/,              // shell chaining / injection — never allowed even in fix mode
  /\bformat\b/i,          // disk format
  /\bmkfs\b/i,             // make filesystem
  /\bdd\b/i,               // disk dump
  />\s*/,                  // output redirection
  /\bcurl\b/i,             // download
  /\bwget\b/i,             // download
  /\bnpm\b/i,              // package manager
  /\bpip\b/i,              // package manager
  // NOTE: \bapt\b is INTENTIONALLY NOT blocked here. The Debian fix tools
  //       (fix_apt_update, fix_apt_safe_upgrade, fix_clear_apt_cache,
  //       fix_apt_autoremove, fix_install_safe_package) all wrap hardcoded
  //       'apt-get ...' strings, with the only variable input being a package
  //       name validated against INSTALLABLE_PACKAGE_ALLOWLIST. The
  //       hardcoded-string + per-tool-allowlist invariants are tested in
  //       autofixSandbox.test.js.
  /\bbrew\b/i,             // package manager
  /\byum\b/i,              // package manager
  /\bdnf\b/i,              // package manager
  /\bshutdown\b/i,         // shutdown
  /\breboot\b/i,           // reboot
  /\bhalt\b/i,             // halt
  /\binit\s+0\b/i,         // halt
  /\binit\s+6\b/i,         // reboot
  /\brunas\b/i,            // win privesc
];

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
  FIX_BLOCKED_PATTERNS,
  KILLABLE_PROCESS_ALLOWLIST,
  INSTALLABLE_PACKAGE_ALLOWLIST,
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
