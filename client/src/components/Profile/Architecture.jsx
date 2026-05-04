import React, { useState, useCallback } from 'react';
import FullScreenOverlay from '../Overlays/FullScreenOverlay';
import './Architecture.css';

/**
 * Architecture -- Comprehensive interactive view of the PC Pal agent system.
 * Rendered inside a FullScreenOverlay. Each section is collapsible.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 * }} props
 */

/* ========================================================================
   DATA — Pipeline stages
   ======================================================================== */

const PIPELINE_STAGES = [
  { name: 'User Message', desc: 'Incoming text from user' },
  { name: 'Safety Monitor', desc: 'Emergency and scam detection' },
  { name: 'Task Classifier', desc: 'learn_skill / troubleshoot / follow_up' },
  { name: 'Skill Matcher', desc: '38 skills, sticky matching' },
  { name: 'System Prompt Builder', desc: 'Comfort level + memories + coaching notes' },
  { name: 'Claude AI', desc: 'Agent SDK + 25 MCP Tools' },
  { name: 'Vocabulary Filter', desc: '83 jargon terms replaced with plain language' },
  { name: 'Quality Tracker', desc: 'Confusion signals, jargon slips' },
  { name: 'Response to User', desc: 'Final answer delivered' },
];

/* ========================================================================
   DATA — MCP Tools (25 total)
   ======================================================================== */

const TOOL_CATEGORIES = [
  {
    name: 'Teaching',
    count: 10,
    tools: [
      { name: 'log_skill_started', desc: 'Records that a user began learning a skill', params: [{ name: 'skill_id', type: 'string', desc: 'Skill identifier' }, { name: 'user_id', type: 'string', desc: 'User identifier' }] },
      { name: 'suggest_next_skill', desc: 'Recommends the next skill based on progress', params: [{ name: 'user_id', type: 'string', desc: 'User identifier' }] },
      { name: 'schedule_skill_review', desc: 'Schedules a future review session for a skill', params: [{ name: 'skill_id', type: 'string', desc: 'Skill identifier' }, { name: 'user_id', type: 'string', desc: 'User identifier' }, { name: 'review_date', type: 'string', desc: 'ISO date for next review' }] },
      { name: 'start_step_sequence', desc: 'Begins a new step-by-step instruction flow', params: [{ name: 'title', type: 'string', desc: 'Guide title' }, { name: 'total_steps', type: 'number', desc: 'Number of steps' }] },
      { name: 'advance_step', desc: 'Moves to the next step in the current sequence', params: [{ name: 'sequence_id', type: 'string', desc: 'Active sequence identifier' }] },
      { name: 'complete_step_sequence', desc: 'Marks the current step sequence as finished', params: [{ name: 'sequence_id', type: 'string', desc: 'Active sequence identifier' }] },
      { name: 'adjust_vocabulary_level', desc: 'Sets the vocabulary complexity for responses', params: [{ name: 'user_id', type: 'string', desc: 'User identifier' }, { name: 'level', type: 'string', desc: 'basic / intermediate / standard' }] },
      { name: 'save_user_goal', desc: 'Stores a learning goal for the user', params: [{ name: 'user_id', type: 'string', desc: 'User identifier' }, { name: 'goal', type: 'string', desc: 'Goal description' }] },
      { name: 'save_memory', desc: 'Persists a memory about the user for future context', params: [{ name: 'user_id', type: 'string', desc: 'User identifier' }, { name: 'content', type: 'string', desc: 'Memory text' }, { name: 'category', type: 'string', desc: 'Memory category' }] },
      { name: 'recall_memories', desc: 'Retrieves stored memories relevant to current context', params: [{ name: 'user_id', type: 'string', desc: 'User identifier' }, { name: 'query', type: 'string', desc: 'Search query' }] },
    ],
  },
  {
    name: 'Diagnostic',
    count: 9,
    tools: [
      { name: 'get_system_info', desc: 'Retrieves OS, CPU, RAM, and storage details', params: [] },
      { name: 'check_network', desc: 'Tests internet connectivity and DNS resolution', params: [] },
      { name: 'list_running_apps', desc: 'Shows currently running applications', params: [] },
      { name: 'read_error_log', desc: 'Reads recent system or application error logs', params: [{ name: 'log_type', type: 'string', desc: 'system / application' }] },
      { name: 'run_safe_command', desc: 'Executes a sandboxed read-only system command', params: [{ name: 'command', type: 'string', desc: 'Allowlisted command to run' }] },
      { name: 'check_disk_health', desc: 'Reports disk usage and health status', params: [] },
      { name: 'check_installed_software', desc: 'Lists installed applications and versions', params: [] },
      { name: 'get_battery_status', desc: 'Returns battery level and charging state', params: [] },
      { name: 'diagnose_missing_dll', desc: 'Identifies missing DLL files and suggests fixes', params: [{ name: 'dll_name', type: 'string', desc: 'Name of the missing DLL' }] },
    ],
  },
  {
    name: 'Resource',
    count: 6,
    tools: [
      { name: 'show_visual_guide', desc: 'Displays a pre-built visual guide for a topic', params: [{ name: 'guide_id', type: 'string', desc: 'Guide identifier' }] },
      { name: 'create_guide', desc: 'Generates a new step-by-step guide artifact', params: [{ name: 'title', type: 'string', desc: 'Guide title' }, { name: 'steps', type: 'array', desc: 'Array of step objects' }] },
      { name: 'create_findings', desc: 'Creates a diagnostic findings summary artifact', params: [{ name: 'title', type: 'string', desc: 'Findings title' }, { name: 'findings', type: 'array', desc: 'Array of finding objects' }] },
      { name: 'find_youtube_videos', desc: 'Searches for helpful tutorial videos', params: [{ name: 'query', type: 'string', desc: 'Search query' }] },
      { name: 'take_screenshot', desc: 'Captures a screenshot for reference', params: [] },
      { name: 'lookup_support_resources', desc: 'Finds official support articles and URLs', params: [{ name: 'query', type: 'string', desc: 'Support topic query' }] },
    ],
  },
  {
    name: 'Safety',
    count: 2,
    tools: [
      { name: 'flag_emergency', desc: 'Flags a message as an emergency and triggers safety flow', params: [{ name: 'message', type: 'string', desc: 'Emergency message text' }, { name: 'type', type: 'string', desc: 'Emergency type' }] },
      { name: 'analyze_scam_situation', desc: 'Evaluates whether a situation looks like a scam', params: [{ name: 'description', type: 'string', desc: 'Situation description' }] },
    ],
  },
  {
    name: 'Collaboration',
    count: 5,
    tools: [
      { name: 'save_note_for_user', desc: 'Saves a helper note visible to the user', params: [{ name: 'user_id', type: 'string', desc: 'User identifier' }, { name: 'note', type: 'string', desc: 'Note content' }] },
      { name: 'get_user_notes', desc: 'Retrieves notes left for the user by helpers', params: [{ name: 'user_id', type: 'string', desc: 'User identifier' }] },
      { name: 'share_progress_with_buddy', desc: 'Sends a learning progress update to the buddy', params: [{ name: 'user_id', type: 'string', desc: 'User identifier' }, { name: 'summary', type: 'string', desc: 'Progress summary' }] },
      { name: 'ask_buddy_for_help', desc: 'Sends a help request to the paired buddy', params: [{ name: 'user_id', type: 'string', desc: 'User identifier' }, { name: 'question', type: 'string', desc: 'Help question' }] },
      { name: 'restart_conversation', desc: 'Starts a fresh conversation thread', params: [] },
    ],
  },
];

/* ========================================================================
   DATA — Skills Library (38 total)
   ======================================================================== */

const SKILL_CATEGORIES = [
  {
    name: 'Basics',
    count: 6,
    skills: [
      { name: 'Copy & Paste', id: 'copy-paste', desc: 'Select, copy, and paste text or files', difficulty: 'beginner', triggers: ['copy', 'paste', 'clipboard', 'cut'] },
      { name: 'Browser', id: 'browser', desc: 'Navigate the web, tabs, and bookmarks', difficulty: 'beginner', triggers: ['browser', 'internet', 'website', 'tab', 'bookmark'] },
      { name: 'Screenshot', id: 'screenshot', desc: 'Capture what is on screen', difficulty: 'beginner', triggers: ['screenshot', 'screen capture', 'snip'] },
      { name: 'Settings', id: 'settings', desc: 'Find and change system settings', difficulty: 'beginner', triggers: ['settings', 'preferences', 'control panel'] },
      { name: 'Restart', id: 'restart', desc: 'Restart or shut down the computer safely', difficulty: 'beginner', triggers: ['restart', 'reboot', 'shut down', 'turn off'] },
      { name: 'Print', id: 'print', desc: 'Print documents and manage printers', difficulty: 'beginner', triggers: ['print', 'printer', 'printing'] },
    ],
  },
  {
    name: 'Communication',
    count: 8,
    skills: [
      { name: 'Send Email', id: 'send-email', desc: 'Compose and send a new email', difficulty: 'beginner', triggers: ['send email', 'compose', 'new email', 'write email'] },
      { name: 'Read Email', id: 'read-email', desc: 'Open and read emails in the inbox', difficulty: 'beginner', triggers: ['read email', 'inbox', 'check email'] },
      { name: 'Reply & Forward', id: 'reply-forward', desc: 'Reply to or forward an email', difficulty: 'beginner', triggers: ['reply', 'forward', 'respond'] },
      { name: 'Search Email', id: 'search-email', desc: 'Find specific emails by keyword', difficulty: 'intermediate', triggers: ['search email', 'find email', 'look for email'] },
      { name: 'Email Drafts', id: 'email-drafts', desc: 'Save and manage email drafts', difficulty: 'intermediate', triggers: ['draft', 'save email', 'finish later'] },
      { name: 'Email Organization', id: 'email-organize', desc: 'Folders, labels, and cleanup', difficulty: 'intermediate', triggers: ['organize email', 'folders', 'labels', 'archive'] },
      { name: 'Text Message', id: 'text-message', desc: 'Send and receive text messages from the computer', difficulty: 'beginner', triggers: ['text', 'message', 'SMS', 'iMessage'] },
      { name: 'Video Call', id: 'video-call', desc: 'Join or start a video call', difficulty: 'intermediate', triggers: ['video call', 'Zoom', 'FaceTime', 'Teams'] },
    ],
  },
  {
    name: 'Diagnostics',
    count: 10,
    skills: [
      { name: 'Slow Computer', id: 'slow_computer', desc: 'Diagnose and fix slow performance', difficulty: 'intermediate', triggers: ['slow', 'laggy', 'frozen', 'not responding'] },
      { name: 'Network Fix', id: 'network_fix', desc: 'Troubleshoot internet and Wi-Fi issues', difficulty: 'intermediate', triggers: ['no internet', 'wifi not working', 'connection lost'] },
      { name: 'System Diagnosis', id: 'diagnose_system', desc: 'Full system health check', difficulty: 'intermediate', triggers: ['diagnose', 'health check', 'system check'] },
      { name: 'Disk Cleanup', id: 'disk_cleanup', desc: 'Free up storage space', difficulty: 'intermediate', triggers: ['disk full', 'storage', 'cleanup', 'space'] },
      { name: 'Battery & Power', id: 'battery_power', desc: 'Check battery health and power settings', difficulty: 'beginner', triggers: ['battery', 'power', 'charging', 'dies fast'] },
      { name: 'App Troubleshoot', id: 'app_troubleshoot', desc: 'Fix crashes and app problems', difficulty: 'intermediate', triggers: ['app crash', 'not opening', 'force quit', 'stuck'] },
      { name: 'System Checkup', id: 'system_checkup', desc: 'Routine maintenance and update check', difficulty: 'beginner', triggers: ['checkup', 'maintenance', 'updates'] },
      { name: 'Find on Screen', id: 'find_on_screen', desc: 'Locate buttons, menus, and features', difficulty: 'beginner', triggers: ['where is', 'find button', 'cannot find', 'locate'] },
      { name: 'Missing DLL', id: 'missing_dll', desc: 'Fix missing DLL file errors on Windows', difficulty: 'critical', triggers: ['DLL', 'missing file', 'dll not found'] },
      { name: 'Universal Troubleshooter', id: 'universal-troubleshooter', desc: 'General-purpose problem solver', difficulty: 'intermediate', triggers: ['problem', 'error', 'broken', 'help'] },
    ],
  },
  {
    name: 'Security',
    count: 3,
    skills: [
      { name: 'Password Help', id: 'password', desc: 'Create, change, or recover passwords', difficulty: 'critical', triggers: ['password', 'forgot password', 'reset password', 'locked out'] },
      { name: 'Scam Check', id: 'scam-check', desc: 'Evaluate if something looks like a scam', difficulty: 'critical', triggers: ['scam', 'suspicious', 'phishing', 'fake'] },
      { name: 'Scam Protection', id: 'scam-protection', desc: 'Learn to recognize and avoid scams', difficulty: 'critical', triggers: ['protect', 'avoid scams', 'safety tips'] },
    ],
  },
  {
    name: 'Media',
    count: 4,
    skills: [
      { name: 'Photos', id: 'photos', desc: 'View, organize, and share photos', difficulty: 'beginner', triggers: ['photo', 'picture', 'image', 'gallery'] },
      { name: 'Gather Resources', id: 'gather_resources', desc: 'Collect helpful links and references', difficulty: 'beginner', triggers: ['resources', 'links', 'references'] },
      { name: 'YouTube Help', id: 'youtube_help', desc: 'Find and watch tutorial videos', difficulty: 'beginner', triggers: ['YouTube', 'video tutorial', 'how to video'] },
      { name: 'Video Companion', id: 'video_companion', desc: 'Follow along with a video step by step', difficulty: 'intermediate', triggers: ['follow video', 'watch together', 'video guide'] },
    ],
  },
  {
    name: 'Other',
    count: 7,
    skills: [
      { name: 'Wi-Fi Setup', id: 'wifi', desc: 'Connect to or change Wi-Fi networks', difficulty: 'beginner', triggers: ['wifi', 'wi-fi', 'wireless', 'connect internet'] },
      { name: 'Text Size', id: 'text-size', desc: 'Make text bigger or smaller on screen', difficulty: 'beginner', triggers: ['text size', 'font size', 'bigger text', 'zoom'] },
      { name: 'Attach File', id: 'attach-file', desc: 'Attach files to emails or messages', difficulty: 'beginner', triggers: ['attach', 'attachment', 'add file', 'send file'] },
      { name: 'Connect Computer', id: 'connect_computer', desc: 'Connect peripherals and external devices', difficulty: 'intermediate', triggers: ['connect', 'USB', 'Bluetooth', 'monitor', 'printer setup'] },
      { name: 'Practice Mode', id: 'practice_mode', desc: 'Practice skills in a safe sandbox', difficulty: 'beginner', triggers: ['practice', 'try it', 'sandbox', 'test'] },
      { name: 'Update Device', id: 'update-device', desc: 'Install system and software updates', difficulty: 'intermediate', triggers: ['update', 'upgrade', 'new version'] },
      { name: 'App Install', id: 'app-install', desc: 'Download and install new applications', difficulty: 'intermediate', triggers: ['install', 'download app', 'get app', 'app store'] },
    ],
  },
];

/* ========================================================================
   DATA — Safety Layers
   ======================================================================== */

const SAFETY_LAYERS = [
  {
    label: 'Layer 1 -- Pre-processing',
    name: 'Safety Monitor',
    desc: 'Runs FIRST on every message. Detects emergencies (fallen, chest pain, 911) and active scams (gift cards, credential theft). Blocks dangerous messages before AI sees them.',
  },
  {
    label: 'Layer 2 -- Post-processing',
    name: 'Vocabulary Filter',
    desc: 'Runs AFTER AI response. Replaces 83 jargon terms with plain language. Enforces sentence length (under 20 words). Adapts to the user\'s vocabulary level (basic / intermediate / standard).',
  },
  {
    label: 'Layer 3 -- Passive monitoring',
    name: 'Quality Tracker',
    desc: 'Runs PASSIVELY on every turn. Logs confusion signals, jargon slips, device mismatches, and response length violations. Never blocks -- only monitors for coaching.',
  },
];

/* ========================================================================
   DATA — Database Tables (17 total)
   ======================================================================== */

const DB_GROUPS = [
  {
    name: 'Users & Sessions',
    count: 3,
    tables: [
      { name: 'users', purpose: 'Core user profiles, device type, comfort level' },
      { name: 'user_sessions', purpose: 'Login sessions with timestamps and duration' },
      { name: 'user_vocabulary', purpose: 'Per-user vocabulary level and history' },
    ],
  },
  {
    name: 'Conversations',
    count: 3,
    tables: [
      { name: 'conversations', purpose: 'Conversation threads with metadata' },
      { name: 'messages', purpose: 'Individual messages within conversations' },
      { name: 'step_sequences', purpose: 'Active step-by-step instruction flows' },
    ],
  },
  {
    name: 'Learning',
    count: 4,
    tables: [
      { name: 'skill_events', purpose: 'Skill start, progress, and completion events' },
      { name: 'skill_reviews', purpose: 'Scheduled and completed review sessions' },
      { name: 'user_goals', purpose: 'Learning goals set by or for the user' },
      { name: 'user_memories', purpose: 'Persistent memories about user preferences' },
    ],
  },
  {
    name: 'Safety',
    count: 2,
    tables: [
      { name: 'safety_events', purpose: 'Emergency detection events and actions taken' },
      { name: 'scam_check_events', purpose: 'Scam analysis requests and outcomes' },
    ],
  },
  {
    name: 'Collaboration',
    count: 3,
    tables: [
      { name: 'buddy_pairs', purpose: 'Helper-learner pairings and pairing codes' },
      { name: 'help_requests', purpose: 'Help requests sent to buddies' },
      { name: 'progress_shares', purpose: 'Learning progress updates shared with buddies' },
    ],
  },
  {
    name: 'Feedback & Quality',
    count: 2,
    tables: [
      { name: 'conversation_feedback', purpose: 'User feedback ratings per conversation' },
      { name: 'conversation_quality_events', purpose: 'Automated quality tracking signals per turn' },
    ],
  },
];

/* ========================================================================
   DATA — Section definitions
   ======================================================================== */

const SECTION_KEYS = ['pipeline', 'tools', 'skills', 'safety', 'database'];

const SECTION_META = {
  pipeline: { title: 'How PC Pal Works', count: null },
  tools: { title: 'Tools', count: '25 MCP Tools' },
  skills: { title: 'Skills Library', count: '38 Skills' },
  safety: { title: 'Safety Layers', count: '3 Layers' },
  database: { title: 'Database', count: '17 Tables' },
};

/* ========================================================================
   SUB-COMPONENTS
   ======================================================================== */

function PipelineDiagram() {
  return (
    <div className="pcp-arch__pipeline" role="list" aria-label="Message processing pipeline">
      {PIPELINE_STAGES.map((stage, i) => (
        <React.Fragment key={stage.name}>
          <div className="pcp-arch__pipeline-box" role="listitem">
            <div className="pcp-arch__pipeline-name">{stage.name}</div>
            <p className="pcp-arch__pipeline-desc">{stage.desc}</p>
          </div>
          {i < PIPELINE_STAGES.length - 1 && (
            <div className="pcp-arch__pipeline-arrow" aria-hidden="true">
              {'\u2193'}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function ToolList() {
  return (
    <div>
      {TOOL_CATEGORIES.map((cat) => (
        <div key={cat.name} className="pcp-arch__category">
          <h4 className="pcp-arch__category-header">
            {cat.name}{' '}
            <span className="pcp-arch__category-count">({cat.count})</span>
          </h4>
          {cat.tools.map((tool) => (
            <div key={tool.name} className="pcp-arch__tool">
              <div className="pcp-arch__tool-name">{tool.name}</div>
              <p className="pcp-arch__tool-desc">{tool.desc}</p>
              {tool.params.length > 0 && (
                <ul className="pcp-arch__tool-params">
                  {tool.params.map((p) => (
                    <li key={p.name} className="pcp-arch__tool-param">
                      <span className="pcp-arch__tool-param-name">{p.name}</span>
                      {': '}
                      <span className="pcp-arch__tool-param-type">{p.type}</span>
                      {' -- '}
                      {p.desc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SkillList() {
  return (
    <div>
      {SKILL_CATEGORIES.map((cat) => (
        <div key={cat.name} className="pcp-arch__category">
          <h4 className="pcp-arch__category-header">
            {cat.name}{' '}
            <span className="pcp-arch__category-count">({cat.count})</span>
          </h4>
          {cat.skills.map((skill) => (
            <div key={skill.id} className="pcp-arch__skill">
              <div className="pcp-arch__skill-top">
                <span className="pcp-arch__skill-name">{skill.name}</span>
                <span className={`pcp-arch__badge pcp-arch__badge--${skill.difficulty}`}>
                  {skill.difficulty}
                </span>
              </div>
              <p className="pcp-arch__skill-desc">{skill.desc}</p>
              <div className="pcp-arch__triggers">
                {skill.triggers.map((t) => (
                  <span key={t} className="pcp-arch__trigger-tag">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SafetyLayers() {
  return (
    <div>
      {SAFETY_LAYERS.map((layer) => (
        <div key={layer.name} className="pcp-arch__safety-card">
          <div className="pcp-arch__safety-label">{layer.label}</div>
          <div className="pcp-arch__safety-name">{layer.name}</div>
          <p className="pcp-arch__safety-desc">{layer.desc}</p>
        </div>
      ))}
    </div>
  );
}

function DatabaseTables() {
  return (
    <div>
      {DB_GROUPS.map((group) => (
        <div key={group.name} className="pcp-arch__db-group">
          <h4 className="pcp-arch__db-group-title">
            {group.name}{' '}
            <span className="pcp-arch__db-group-count">({group.count})</span>
          </h4>
          {group.tables.map((table) => (
            <div key={table.name} className="pcp-arch__db-table">
              <span className="pcp-arch__db-table-name">{table.name}</span>
              <span className="pcp-arch__db-table-purpose">{table.purpose}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ========================================================================
   SECTION CONTENT MAP
   ======================================================================== */

const SECTION_CONTENT = {
  pipeline: PipelineDiagram,
  tools: ToolList,
  skills: SkillList,
  safety: SafetyLayers,
  database: DatabaseTables,
};

/* ========================================================================
   MAIN COMPONENT
   ======================================================================== */

function Architecture({ open, onClose }) {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = useCallback((key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <FullScreenOverlay
      open={open}
      onClose={onClose}
      title="Architecture"
      backLabel="Back"
      labelledBy="pcp-architecture-title"
    >
      <div className="pcp-arch" role="article" aria-label="PC Pal system architecture">
        <p className="pcp-arch__intro">
          An interactive overview of how PC Pal processes messages, the tools it
          can use, the skills it teaches, and how it keeps users safe.
        </p>

        {SECTION_KEYS.map((key) => {
          const meta = SECTION_META[key];
          const isOpen = !!openSections[key];
          const ContentComponent = SECTION_CONTENT[key];

          return (
            <section
              key={key}
              className="pcp-arch__section"
              aria-label={meta.title}
            >
              <button
                className="pcp-arch__section-header"
                type="button"
                onClick={() => toggleSection(key)}
                aria-expanded={isOpen}
              >
                <span
                  className={
                    'pcp-arch__section-chevron' +
                    (isOpen ? ' pcp-arch__section-chevron--open' : '')
                  }
                  aria-hidden="true"
                >
                  {'\u25B8'}
                </span>
                <span className="pcp-arch__section-title">{meta.title}</span>
                {meta.count && (
                  <span className="pcp-arch__section-count">{meta.count}</span>
                )}
              </button>

              {isOpen && (
                <div className="pcp-arch__section-body">
                  <ContentComponent />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </FullScreenOverlay>
  );
}

export default Architecture;
