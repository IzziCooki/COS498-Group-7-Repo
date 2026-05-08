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
    count: 11,
    tools: [
      { name: 'log_skill_started', desc: 'Log that the user started learning a new skill. Called when the agent begins teaching a new topic.', params: [{ name: 'skill_name', type: 'string', desc: 'Name of the skill being taught' }] },
      { name: 'suggest_next_skill', desc: 'Recommend what to learn next based on completion history. Called when user asks "what should I learn next?" or after completing a skill.', params: [] },
      { name: 'schedule_skill_review', desc: 'Schedule a spaced repetition review for a completed skill. Always called after complete_step_sequence. Reviews help users retain what they learned.', params: [{ name: 'skill_name', type: 'string', desc: 'Name of the skill to review later' }, { name: 'days_until_review', type: 'number', desc: 'Days until review (default 7, use 3 for comfort level 1-2 users)' }] },
      { name: 'start_step_sequence', desc: 'Start a numbered step-by-step walkthrough for a multi-step task. Steps appear in the chat with a progress indicator and quick-reply buttons.', params: [{ name: 'task_name', type: 'string', desc: 'Short name for the task (e.g. "Send an Email")' }, { name: 'steps', type: 'array of strings', desc: 'Array of step descriptions in plain English, one sentence each' }] },
      { name: 'advance_step', desc: 'Move to the next step when the user confirms they completed the current step (says "done", "ok", "got it", "next", etc.)', params: [] },
      { name: 'complete_step_sequence', desc: 'Mark the current step sequence as fully completed. Called when the user has finished all steps successfully. Logs the skill as completed.', params: [{ name: 'skill_name', type: 'string', desc: 'Name of the skill that was completed' }] },
      { name: 'adjust_vocabulary_level', desc: 'Change the vocabulary simplification level. Called if the user seems confused (lower to basic) or uses technical terms confidently (raise to standard).', params: [{ name: 'new_level', type: 'enum', desc: 'basic / standard / technical' }, { name: 'reason', type: 'string', desc: 'Why you are adjusting the level' }] },
      { name: 'save_user_goal', desc: 'Save the user\'s learning goal when they mention WHY they want to learn something. Examples: "I want to email my grandkids", "I need to video call my doctor".', params: [{ name: 'goal_text', type: 'string', desc: 'The user\'s goal in their own words' }, { name: 'related_skills', type: 'array of strings', desc: 'Skill IDs this goal connects to (e.g. ["send_email", "attach_file"])' }] },
      { name: 'save_memory', desc: 'Save an observation about the user for future sessions. Use to remember preferences, struggles, breakthroughs, personal context, or patterns. Called at least once per conversation.', params: [{ name: 'type', type: 'enum', desc: 'preference / struggle / breakthrough / context / pattern' }, { name: 'content', type: 'string', desc: 'The observation -- one specific sentence' }, { name: 'relevance', type: 'number', desc: '1-10 importance for future interactions (default 5)' }] },
      { name: 'recall_memories', desc: 'Retrieve what you know about the user from past sessions. Called at the start of a conversation to personalize responses. Returns preferences, struggles, breakthroughs, and patterns.', params: [] },
      { name: 'start_practice', desc: 'Start an interactive practice session. Built-in tasks: send_email, copy_paste, open_browser. For ANY other task, set task_id to "custom" and provide custom_steps. Use when user says "practice", "let me try first", "I\'m scared", or seems nervous.', params: [{ name: 'task_id', type: 'string', desc: 'Built-in task ID (send_email, copy_paste, open_browser) or "custom"' }, { name: 'custom_title', type: 'string', desc: 'Title for custom practice (required when task_id is "custom")' }, { name: 'custom_steps', type: 'array', desc: 'Array of step objects with instruction, whereToLook, whatItLooksLike, deviceInstructions, afterThis' }] },
    ],
  },
  {
    name: 'Diagnostic',
    count: 9,
    tools: [
      { name: 'get_system_info', desc: 'Get detailed info about the user\'s computer: OS version, CPU, RAM usage, disk space, uptime. Use to diagnose performance issues or understand the user\'s hardware.', params: [] },
      { name: 'check_network', desc: 'Check internet connection, Wi-Fi status, DNS resolution, and network latency. Use when user reports internet or Wi-Fi problems, slow browsing, or pages not loading.', params: [] },
      { name: 'list_running_apps', desc: 'List running applications and their resource usage (CPU/memory). Use to find apps slowing down the computer or to verify an app is running.', params: [] },
      { name: 'read_error_log', desc: 'Read recent system error logs to diagnose crashes, freezes, or other problems. Use when user reports something "stopped working" or their computer crashed.', params: [{ name: 'source', type: 'enum', desc: '"system" for OS errors, "application" for app errors, "crash" for crash reports' }] },
      { name: 'run_safe_command', desc: 'Run a safe, read-only diagnostic command on the user\'s computer. Only allowlisted commands work (network diagnostics, file listing, system info). NEVER use for destructive operations -- they will be blocked.', params: [{ name: 'command', type: 'string', desc: 'The diagnostic command to run (must be in the allowlist)' }, { name: 'reason', type: 'string', desc: 'Why you are running this command -- explain what you are looking for' }] },
      { name: 'check_disk_health', desc: 'Check disk space usage, large folders, and temporary files that could be cleaned up. Use when the user says their computer is "full", "slow", or "running out of space".', params: [] },
      { name: 'check_installed_software', desc: 'List installed applications or search for a specific program. Use to verify if software is installed, find the right app for a task, or check software versions.', params: [{ name: 'search_term', type: 'string (optional)', desc: 'Search for a specific application by name (e.g. "Chrome", "Zoom")' }] },
      { name: 'get_battery_status', desc: 'Check the laptop\'s battery level and whether it is charging. Use when the user asks about battery life or their computer keeps shutting off unexpectedly.', params: [] },
      { name: 'diagnose_missing_dll', desc: 'Diagnose a missing DLL error on Windows. Returns the exact official fix -- which Microsoft installer to download, step-by-step instructions, and safety warnings. NEVER suggests downloading DLL files from third-party websites.', params: [{ name: 'dll_name', type: 'string', desc: 'The DLL filename from the error (e.g. "MSVCP140.dll", "VCRUNTIME140.dll")' }, { name: 'error_text', type: 'string (optional)', desc: 'The full error message text if available' }, { name: 'program_name', type: 'string (optional)', desc: 'The program that showed the error' }] },
    ],
  },
  {
    name: 'Resource',
    count: 6,
    tools: [
      { name: 'show_visual_guide', desc: 'Display a visual step-by-step guide card for a common task. Called BEFORE giving text instructions for visual or procedural tasks so the user sees a helpful diagram.', params: [{ name: 'task_id', type: 'enum', desc: 'copy_paste, take_screenshot, send_email, open_settings, zoom_text, find_wifi, attach_file, open_browser, restart_computer, use_taskbar' }] },
      { name: 'create_guide', desc: 'Create an interactive guide artifact that appears as a collapsible card with numbered steps, copy-paste terminal commands, and "Run" buttons. Use for ANY multi-step procedure. Each step can have a description, an optional terminal command, an optional note, and an optional screenshot image_id.', params: [{ name: 'title', type: 'string', desc: 'Short title (e.g. "How to Send an Email in Gmail")' }, { name: 'description', type: 'string (optional)', desc: 'One-sentence summary of what this guide accomplishes' }, { name: 'source', type: 'string (optional)', desc: 'Attribution when based on official docs (e.g. "Based on Apple Support")' }, { name: 'steps', type: 'array', desc: 'Ordered list of steps, each with text, optional command, optional note, optional image_id' }] },
      { name: 'create_findings', desc: 'Create a diagnostic findings artifact -- a collapsible dropdown showing what was discovered about the user\'s computer. Use after running diagnostic tools to show HOW the agent reached its conclusions. Each finding has a label, value, and status (good/warning/bad).', params: [{ name: 'title', type: 'string', desc: 'Title (e.g. "System Check Results")' }, { name: 'findings', type: 'array', desc: 'List of { label: string, value: string, status: "good"|"warning"|"bad" }' }] },
      { name: 'find_youtube_videos', desc: 'Search YouTube for helpful tutorial videos. PROACTIVELY called when teaching a new skill -- elderly users strongly prefer watching someone do it. Results are displayed as playable videos in the chat.', params: [{ name: 'query', type: 'string', desc: 'Search query -- describe the task simply (e.g. "how to copy and paste on Mac")' }, { name: 'max_results', type: 'number (optional)', desc: 'Number of videos to return (default 3, max 5)' }] },
      { name: 'take_screenshot', desc: 'Capture and analyze the user\'s screen to find a button, icon, or menu item they can\'t locate. Returns an annotated screenshot with the target highlighted. Only works when screen sharing is active. Use when user says "I can\'t find it", "where is that button", "I don\'t see it".', params: [{ name: 'looking_for', type: 'string', desc: 'What the user is trying to find (e.g. "Settings icon", "Wi-Fi toggle", "Share button")' }] },
      { name: 'lookup_support_resources', desc: 'Look up verified official support links for a topic. Returns curated resources from Apple Support, Microsoft Support, Google Support, Zoom Support, and other trusted sources. ALWAYS called instead of generating URLs from memory -- prevents broken links and hallucinated sources.', params: [{ name: 'topic', type: 'string', desc: 'The topic to find resources for (e.g. "copy and paste", "connect to wifi")' }, { name: 'os_type', type: 'string (optional)', desc: 'User\'s OS if known: Windows, macOS, iPhone, Android' }, { name: 'service', type: 'string (optional)', desc: 'Specific service if known: gmail, outlook, yahoo, zoom, facetime' }] },
    ],
  },
  {
    name: 'Safety',
    count: 2,
    tools: [
      { name: 'flag_emergency', desc: 'Flag a potential emergency. Use when user mentions falling, injury, chest pain, or medical concerns. Triggers immediate safety response with 911 guidance.', params: [{ name: 'reason', type: 'string', desc: 'Why this is flagged as an emergency' }] },
      { name: 'analyze_scam_situation', desc: 'Analyze whether a situation is a scam. Use when user asks "is this a scam?", describes a suspicious call/email/text, or asks if they should trust someone. Provides structured analysis with red flags, risk level, and official verification contacts. NEVER says "it\'s safe" -- always recommends verifying.', params: [{ name: 'situation_summary', type: 'string', desc: 'Brief summary of what the user described' }, { name: 'claimed_organization', type: 'string (optional)', desc: 'Company/agency the caller claims to be from' }, { name: 'red_flags_found', type: 'array of strings', desc: 'Specific red flags detected (e.g. "They created urgency by saying your account would be locked")' }, { name: 'risk_level', type: 'enum', desc: 'high (2+ red flags or known pattern), medium, low (normal interaction)' }, { name: 'recommended_action', type: 'string', desc: 'Clear, specific action the user should take right now' }, { name: 'verification_contact', type: 'string (optional)', desc: 'Official phone number or website to verify' }] },
    ],
  },
  {
    name: 'Collaboration',
    count: 5,
    tools: [
      { name: 'save_note_for_user', desc: 'Save a helpful tip or note for the user to reference later. Called after teaching something important so the user can look it up again.', params: [{ name: 'title', type: 'string', desc: 'Short title (e.g. "How to Copy Text")' }, { name: 'content', type: 'string', desc: 'The note content -- 1-2 sentences, simple language' }] },
      { name: 'get_user_notes', desc: 'Retrieve the user\'s saved notes and tips. Called when the user asks "what have I learned?", "show my notes", or "what tips did you save?".', params: [] },
      { name: 'share_progress_with_buddy', desc: 'Share a skill completion with the user\'s learning buddy. Only called if the user has an active buddy pair. Called after complete_step_sequence.', params: [{ name: 'skill_name', type: 'string', desc: 'Name of the skill completed' }, { name: 'celebration_message', type: 'string', desc: 'A warm celebration message (e.g. "Margaret just learned to send an email!")' }] },
      { name: 'ask_buddy_for_help', desc: 'Send a help request to the user\'s buddy when stuck. Used when user says "can my daughter help?", "I need a real person", or after 3+ failed attempts at the same step.', params: [{ name: 'question', type: 'string', desc: 'What the user needs help with' }, { name: 'context_summary', type: 'string (optional)', desc: 'Brief description of what the user was trying to do' }] },
      { name: 'restart_conversation', desc: 'End the current conversation and start fresh. Called when user says "start over", "new question", or seems completely lost and wants to begin again.', params: [{ name: 'reason', type: 'string', desc: 'Why restarting the conversation' }] },
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
      { name: 'Copy & Paste', id: 'copy-paste', desc: 'Help user copy and paste text, images, or files between applications', difficulty: 'beginner', triggers: ['copy', 'paste', 'ctrl+c', 'ctrl+v', 'cmd+c', 'cmd+v', 'duplicate text', 'move text'] },
      { name: 'Open a Web Browser', id: 'browser', desc: 'Help open web browser and visit websites, navigate tabs and bookmarks', difficulty: 'beginner', triggers: ['browser', 'chrome', 'edge', 'firefox', 'safari', 'web browser', 'visit website', 'go to website', 'open internet', 'search the web', 'google'] },
      { name: 'Take a Screenshot', id: 'screenshot', desc: 'Help user capture what is on their screen using keyboard shortcuts or built-in tools', difficulty: 'beginner', triggers: ['screenshot', 'screen shot', 'capture screen', 'print screen', 'snip', 'picture of screen', 'save my screen'] },
      { name: 'Open Settings', id: 'settings', desc: 'Help find and navigate device settings, system preferences, and control panel', difficulty: 'beginner', triggers: ['settings', 'preferences', 'control panel', 'configure', 'change settings', 'system settings', 'options'] },
      { name: 'Restart Device', id: 'restart', desc: 'Help restart or turn off device safely, especially when frozen or stuck', difficulty: 'beginner', triggers: ['restart', 'reboot', 'shut down', 'turn off', 'turn it off', 'power off', 'frozen', 'stuck', 'not responding'] },
      { name: 'Print a Document', id: 'print', desc: 'Help user print documents, letters, photos, recipes from their computer', difficulty: 'beginner', triggers: ['print', 'printing', 'print a document', 'print a letter', 'print a photo', 'send to printer', 'printer not working', 'ctrl p'] },
    ],
  },
  {
    name: 'Communication',
    count: 8,
    skills: [
      { name: 'Send an Email', id: 'send-email', desc: 'Help compose and send email in Gmail, Outlook, Yahoo, or other email apps', difficulty: 'beginner', triggers: ['email', 'send email', 'write email', 'mail', 'send a message', 'write a letter', 'compose email', 'gmail', 'outlook'] },
      { name: 'Read an Email', id: 'read-email', desc: 'Help user open inbox, find new messages, and read them', difficulty: 'intermediate', triggers: ['check inbox', 'open inbox', 'see new emails', 'any new emails', 'read my mail', 'check my mail', 'unread emails', 'read email', 'open email', 'check my email'] },
      { name: 'Reply to or Forward Email', id: 'reply-forward', desc: 'Help user reply to or forward emails to other people', difficulty: 'intermediate', triggers: ['reply', 'reply to', 'reply to email', 'respond to email', 'answer email', 'write back', 'forward', 'forward this', 'forward email', 'send this email to'] },
      { name: 'Search Your Email', id: 'search-email', desc: 'Help find old email by searching for name, word, or subject', difficulty: 'intermediate', triggers: ['search email', 'find email', 'look for email', 'where is that email', 'lost email', 'missing email', 'old email'] },
      { name: 'Save and Resume Email Draft', id: 'email-drafts', desc: 'Help user save email draft and resume it later from the drafts folder', difficulty: 'intermediate', triggers: ['save draft', 'email draft', 'drafts folder', 'drafts', 'finish email later', 'resume draft', 'unfinished email', 'continue email'] },
      { name: 'Organize Your Inbox', id: 'email-organize', desc: 'Help star, label, archive, or delete emails to keep inbox clean', difficulty: 'intermediate', triggers: ['star email', 'label email', 'archive email', 'delete email', 'organize inbox', 'clean up inbox', 'important email', 'move email', 'move to folder'] },
      { name: 'Send a Text Message', id: 'text-message', desc: 'Help send text message or iMessage from phone or computer', difficulty: 'beginner', triggers: ['text message', 'text someone', 'send text', 'sms', 'imessage', 'message someone', 'how to text'] },
      { name: 'Make a Video Call', id: 'video-call', desc: 'Help make video call using Zoom, FaceTime, Skype, Teams, or Google Meet', difficulty: 'intermediate', triggers: ['video call', 'facetime', 'zoom', 'video chat', 'see someone', 'call with camera', 'teams', 'skype', 'google meet'] },
    ],
  },
  {
    name: 'Diagnostics',
    count: 10,
    skills: [
      { name: 'Fix a Slow Computer', id: 'slow_computer', desc: 'Diagnose and fix slow/laggy/unresponsive computer by checking RAM, CPU, apps, disk', difficulty: 'beginner', triggers: ['computer is slow', 'so slow', 'very slow', 'takes forever', 'laggy', 'running slow', 'sluggish', 'won\'t respond', 'hanging', 'fan is loud', 'overheating'] },
      { name: 'Fix Internet & Network', id: 'network_fix', desc: 'Diagnose and fix connectivity, Wi-Fi, DNS, and network problems', difficulty: 'intermediate', triggers: ['no internet', 'internet not working', 'can\'t get online', 'wifi not working', 'wifi problem', 'pages won\'t load', 'connection dropped', 'keeps disconnecting', 'slow internet'] },
      { name: 'Diagnose Computer Problems', id: 'diagnose_system', desc: 'Investigate crashes, freezes, errors via real diagnostic tools on the user\'s machine', difficulty: 'intermediate', triggers: ['computer crashed', 'blue screen', 'keeps freezing', 'something is wrong', 'not working right', 'computer broke', 'stopped working', 'got an error', 'keeps crashing', 'acting weird'] },
      { name: 'Free Up Storage Space', id: 'disk_cleanup', desc: 'Help free up disk space by checking usage and finding large folders that can be cleaned', difficulty: 'beginner', triggers: ['no space', 'storage full', 'out of space', 'running out of space', 'disk full', 'can\'t save', 'can\'t download', 'not enough space', 'hard drive full', 'need more space'] },
      { name: 'Battery & Power Help', id: 'battery_power', desc: 'Help with battery life, charging issues, unexpected shutdowns, and power management', difficulty: 'beginner', triggers: ['battery', 'charging', 'not charging', 'battery low', 'keeps dying', 'shuts off', 'turns off by itself', 'power', 'won\'t turn on', 'battery drain'] },
      { name: 'Fix App Problems', id: 'app_troubleshoot', desc: 'Troubleshoot specific app issues by checking installation, running status, resource usage', difficulty: 'intermediate', triggers: ['app not working', 'app crashed', 'app won\'t open', 'can\'t open', 'program not working', 'zoom not working', 'browser not working', 'keeps closing', 'force quit', 'frozen app'] },
      { name: 'Computer Health Checkup', id: 'system_checkup', desc: 'Run comprehensive health check (system info, disk, network, battery, running apps)', difficulty: 'beginner', triggers: ['check my computer', 'is my computer ok', 'health check', 'checkup', 'how is my computer', 'computer health', 'any problems', 'what\'s wrong with my computer'] },
      { name: 'Find Something on Screen', id: 'find_on_screen', desc: 'Help user find button/icon/menu item by taking screenshot and highlighting it', difficulty: 'beginner', triggers: ['can\'t find', 'where is', 'don\'t see it', 'where do I click', 'which button', 'show me where', 'can you see my screen', 'look at my screen', 'I\'m looking for'] },
      { name: 'Missing DLL / Program Won\'t Start', id: 'missing_dll', desc: 'Help fix missing DLL errors and programs that won\'t start on Windows with official Microsoft fixes', difficulty: 'intermediate', triggers: ['dll', 'dll is missing', 'dll was not found', 'program can\'t start', 'msvcp', 'vcruntime', 'visual c++', 'redistributable', 'directx'] },
      { name: 'Universal Troubleshooter', id: 'universal-troubleshooter', desc: 'Adaptive problem solver for when user knows something is wrong but can\'t articulate what exactly', difficulty: 'intermediate', triggers: ['i don\'t know what\'s wrong', 'please help me', 'i\'m stuck', 'i give up', 'walk me through', 'guide me through', 'trouble with my computer', 'can you help'] },
    ],
  },
  {
    name: 'Security',
    count: 3,
    skills: [
      { name: 'Password Help', id: 'password', desc: 'Help create, remember, or reset passwords for accounts and services', difficulty: 'intermediate', triggers: ['password', 'forgot password', 'reset password', 'change password', 'login', 'log in', 'can\'t sign in', 'locked out', 'account'] },
      { name: 'Am I Getting Scammed?', id: 'scam-check', desc: 'Help evaluate whether a call/email/text/situation is a scam with red flag analysis and verification contacts', difficulty: 'critical', triggers: ['scam', 'is this a scam', 'is this real', 'should I trust', 'someone asked me for money', 'someone called me', 'they want my password', 'seems suspicious', 'gift cards'] },
      { name: 'Avoid Scams', id: 'scam-protection', desc: 'Help recognize and avoid online scams, phishing, and fraud with general education', difficulty: 'critical', triggers: ['scam', 'fraud', 'phishing', 'suspicious', 'virus', 'hacked', 'someone called', 'pop up', 'warning on screen', 'you\'ve been infected', 'call this number'] },
    ],
  },
  {
    name: 'Media',
    count: 4,
    skills: [
      { name: 'View and Share Photos', id: 'photos', desc: 'Help find, view, and share photos on device using gallery or photo apps', difficulty: 'beginner', triggers: ['photo', 'photos', 'picture', 'pictures', 'gallery', 'camera roll', 'share photo', 'find photo', 'send photo', 'where are my photos'] },
      { name: 'Gather Learning Resources', id: 'gather_resources', desc: 'Curate beginner-friendly videos, articles, and guides on any topic the user wants to learn', difficulty: 'beginner', triggers: ['resources', 'find resources', 'learn more', 'more about this', 'where can I learn', 'articles', 'links', 'tutorials', 'guides', 'helpful links'] },
      { name: 'Find Tutorial Videos', id: 'youtube_help', desc: 'Search YouTube for helpful tutorial videos on any topic', difficulty: 'beginner', triggers: ['show me a video', 'video tutorial', 'watch a video', 'youtube', 'can I watch', 'show me how', 'see a video', 'tutorial video', 'is there a video', 'prefer to watch'] },
      { name: 'Video Learning Companion', id: 'video_companion', desc: 'Help understand and follow along with a video tutorial the user is watching', difficulty: 'beginner', triggers: ['what did they just do', 'I don\'t understand this part', 'confused about', 'I\'m lost', 'they went too fast', 'what did I miss', 'what are they clicking'] },
    ],
  },
  {
    name: 'Other',
    count: 7,
    skills: [
      { name: 'Connect to Wi-Fi', id: 'wifi', desc: 'Help user connect to wireless internet network, find network name, enter password', difficulty: 'beginner', triggers: ['wifi', 'wi-fi', 'internet', 'connect to internet', 'no internet', 'get online', 'wireless', 'network', 'can\'t connect'] },
      { name: 'Make Text Bigger', id: 'text-size', desc: 'Help increase text and display size for easier reading on any device', difficulty: 'beginner', triggers: ['bigger', 'zoom', 'larger', 'text size', 'can\'t read', 'too small', 'enlarge', 'magnify', 'font size', 'hard to read', 'make bigger'] },
      { name: 'Attach a File to Email', id: 'attach-file', desc: 'Help attach photos, documents, or files to an email before sending', difficulty: 'intermediate', triggers: ['attach', 'attachment', 'attach file', 'attach photo', 'send photo', 'send file', 'send picture', 'paperclip', 'add file to email'] },
      { name: 'Connect Your Computer', id: 'connect_computer', desc: 'Guide user through connecting their computer to PC Pal for remote diagnostics via pairing code', difficulty: 'beginner', triggers: ['connect my computer', 'pair my computer', 'link my computer', 'how do I connect', 'pairing code', 'enter code', 'computer helper'] },
      { name: 'Practice Mode', id: 'practice_mode', desc: 'Start safe practice session for learning before doing it on real computer -- nothing can go wrong', difficulty: 'beginner', triggers: ['practice', 'let me practice', 'can I practice', 'I want to practice', 'let me try first', 'I\'m scared', 'I\'m nervous', 'don\'t want to mess up', 'simulate', 'dry run'] },
      { name: 'Update Your Device', id: 'update-device', desc: 'Help check for and install software updates on computer, phone, or tablet', difficulty: 'intermediate', triggers: ['update', 'software update', 'system update', 'upgrade', 'out of date', 'new version', 'update my phone', 'update my computer'] },
      { name: 'Install an App', id: 'app-install', desc: 'Help download and install apps from the app store or website safely', difficulty: 'beginner', triggers: ['install', 'download app', 'get app', 'app store', 'play store', 'new app', 'add app', 'download'] },
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
