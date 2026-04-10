const { execSync } = require('child_process');
const conversationState = require('./conversationState');
const userProfileManager = require('./userProfileManager');
const vocabularyFilter = require('./vocabularyFilter');
const skillProgression = require('./skillProgression');
const SkillEvent = require('../models/SkillEvent');
const StepSequence = require('../models/StepSequence');
const UserNote = require('../models/UserNote');

/**
 * Mock responder for demo mode.
 * Pattern-matches user messages and returns pre-written responses
 * that exercise visual guides, step sequences, and skill tracking.
 */

// Guide metadata — no canned text. All text comes from Claude CLI.
const GUIDE_DATA = {
  copy_paste: {
    guideId: 'copy_paste',
    steps: [
      'Click at the start of the text you want to copy, then drag your mouse to the end to highlight it in blue.',
      'Hold down the Ctrl key (bottom-left of your keyboard) and press the C key at the same time. This copies the text.',
      'Click where you want to put the text.',
      'Hold down the Ctrl key and press V at the same time. Your text should appear!',
    ],
    taskName: 'Copy and Paste',
    skillName: 'copy_paste',
  },
  screenshot: {
    guideId: 'take_screenshot',
    steps: [
      'Make sure what you want to capture is showing on your screen.',
      'Press the Windows key + Shift + S at the same time. Your screen will go slightly dim.',
      'Click and drag to draw a box around what you want to capture.',
      'The screenshot is now copied! Open your email or document and press Ctrl + V to paste it.',
    ],
    taskName: 'Take a Screenshot',
    skillName: 'take_screenshot',
  },
  email: {
    guideId: 'send_email',
    steps: [
      'Open your email app (like Gmail or Outlook). Look for an envelope icon.',
      'Click the "Compose" or "New Email" button — it\'s usually at the top.',
      'In the "To" field, type the email address of the person you want to write to.',
      'Type your subject (a short title for your message) and your message in the big text box.',
      'Click "Send" — it\'s usually a blue button. Your email is on its way!',
    ],
    taskName: 'Send an Email',
    skillName: 'send_email',
  },
  settings: {
    guideId: 'open_settings',
    steps: [
      'Click the Start button (the Windows logo) in the bottom-left corner of your screen.',
      'Look for the gear icon labeled "Settings" and click it.',
      'The Settings window will open. You can browse different categories on the left side.',
    ],
    taskName: 'Open Settings',
    skillName: 'open_settings',
  },
  zoom: {
    guideId: 'zoom_text',
    steps: [
      'Hold down the Ctrl key on your keyboard.',
      'While holding Ctrl, press the + (plus) key to make everything bigger.',
      'Keep pressing + until the size feels comfortable for you.',
      'To go back to normal, hold Ctrl and press 0 (zero).',
    ],
    taskName: 'Make Text Bigger',
    skillName: 'zoom_text',
  },
  wifi: {
    guideId: 'find_wifi',
    steps: [
      'Look at the bottom-right corner of your screen for a small globe or signal bars icon.',
      'Click that icon. A list of available Wi-Fi networks will appear.',
      'Find your network name (it might be on your internet box) and click it.',
      'Click "Connect" and type your Wi-Fi password if asked.',
      'Wait a moment — when it says "Connected," you\'re online!',
    ],
    taskName: 'Connect to Wi-Fi',
    skillName: 'find_wifi',
  },
  attach_file: {
    guideId: 'attach_file',
    steps: [
      'Open your email and start a new message (or reply to one).',
      'Look for a paperclip icon — it\'s usually near the top or bottom of the compose window.',
      'Click the paperclip. A window will open showing your files.',
      'Find the file you want to attach and double-click it (or click it and press "Open").',
      'Wait a moment for the file to upload, then click Send!',
    ],
    taskName: 'Attach a File to Email',
    skillName: 'attach_file',
  },
  open_browser: {
    guideId: 'open_browser',
    steps: [
      'Look at the bottom bar of your screen (the taskbar).',
      'Find the icon that looks like a blue circle or a colorful circle — that\'s your internet browser.',
      'Click it once. A new window will open.',
      'Click in the address bar at the top and type a website address (like google.com), then press Enter.',
    ],
    taskName: 'Open a Web Browser',
    skillName: 'open_browser',
  },
  restart_computer: {
    guideId: 'restart_computer',
    steps: [
      'Click the Start button (Windows logo) in the bottom-left corner.',
      'Click the Power icon — it looks like a circle with a line at the top.',
      'Click "Restart" from the menu that appears.',
      'Wait patiently — your computer will turn off and back on by itself. This may take a minute or two.',
    ],
    taskName: 'Restart Your Computer',
    skillName: 'restart_computer',
  },
  use_taskbar: {
    guideId: 'use_taskbar',
    steps: [
      'Look at the very bottom of your screen — that long strip is called the taskbar.',
      'On the left side, you\'ll see the Start button (Windows logo). Click it to open the main menu.',
      'In the middle, you\'ll see icons for your open programs. Click any icon to switch to that program.',
      'On the right side, you\'ll see the clock, Wi-Fi icon, and speaker icon. Click any of them for quick settings.',
    ],
    taskName: 'Use the Taskbar',
    skillName: 'use_taskbar',
  },
};

/**
 * Normalize user input text for pattern matching.
 */
function normalize(text) {
  return (text || '').toLowerCase().trim();
}

/**
 * Check if text matches any of the given keywords.
 */
function matches(text, keywords) {
  const t = normalize(text);
  return keywords.some(kw => t.includes(kw));
}

/**
 * Handle step advancement for "done", "ok", "next" etc.
 */
function handleStepAdvancement(userId, sessionId) {
  const sequences = StepSequence.findByConversationId(sessionId);
  const activeSeq = sequences.filter(s => !s.completed).pop();

  if (!activeSeq) {
    return {
      response: "It looks like we're not in the middle of any steps right now. What would you like to learn? Just ask me anything!",
      safetyAlert: null,
      guideId: null,
      stepSequence: null,
    };
  }

  const nextIndex = activeSeq.current_index + 1;

  if (nextIndex >= activeSeq.steps.length) {
    // Complete the sequence
    StepSequence.update(activeSeq.id, { completed: 1 });
    try {
      SkillEvent.create({ user_id: userId, skill_name: 'general_skill', status: 'completed' });
    } catch (e) { /* ignore */ }

    const suggestion = skillProgression.getNextSkill(userId);
    const nextSkillText = suggestion.skillId
      ? `\n\nWant to learn something new? I'd suggest: ${suggestion.skillName}. ${suggestion.reason}`
      : '';

    return {
      response: `Wonderful! You've completed all the steps — great job! You should feel proud of yourself.${nextSkillText}`,
      safetyAlert: null,
      guideId: null,
      stepSequence: {
        id: activeSeq.id,
        taskName: null,
        steps: activeSeq.steps,
        currentIndex: nextIndex,
        completed: true,
      },
    };
  }

  // Advance to next step
  const updated = StepSequence.update(activeSeq.id, { current_index: nextIndex });
  const stepText = updated.steps[nextIndex];

  return {
    response: `Great work! You did it! Now let's move on.\n\nStep ${nextIndex + 1} of ${updated.steps.length}: ${stepText}\n\nTake your time, and let me know when you're ready!`,
    safetyAlert: null,
    guideId: null,
    stepSequence: {
      id: updated.id,
      taskName: null,
      steps: updated.steps,
      currentIndex: updated.current_index,
      completed: false,
    },
  };
}

/**
 * Main mock responder.
 * Called instead of Claude API when in mock/demo mode.
 *
 * @param {string} text - user message
 * @param {string} userId
 * @param {string} sessionId
 * @returns {{ response: string, safetyAlert: object|null, guideId: string|null, stepSequence: object|null }}
 */
function respond(text, userId, sessionId) {
  const user = userProfileManager.getOrCreateUser(userId);
  const vocabLevel = user.vocabulary_level || 'basic';

  // Save user message to conversation
  conversationState.addMessage(sessionId, 'user', text);

  // Check for step advancement
  if (matches(text, ['done', 'ok', 'next', 'got it', 'i did it', 'finished', 'yes', "i'm finished", 'done — next'])) {
    const result = handleStepAdvancement(userId, sessionId);
    const filtered = vocabularyFilter.filterResponse(result.response, vocabLevel);
    conversationState.addMessage(sessionId, 'assistant', filtered);
    return { ...result, response: filtered };
  }

  // Check for "what should I learn" / skill suggestions
  if (matches(text, ['what should i learn', 'what next', 'suggest', 'recommend', 'what can you teach'])) {
    const suggestion = skillProgression.getNextSkill(userId);
    const response = suggestion.skillId
      ? `I'd love to help you learn something new! Based on what you've done so far, I'd recommend: **${suggestion.skillName}**.\n\n${suggestion.reason}\n\nWould you like to start?`
      : "You've completed all the skills I have guides for — that's amazing! You can still ask me any computer question and I'll do my best to help.";
    const filtered = vocabularyFilter.filterResponse(response, vocabLevel);
    conversationState.addMessage(sessionId, 'assistant', filtered);
    return { response: filtered, safetyAlert: null, guideId: null, stepSequence: null };
  }

  // Check for "my notes" / "what have I learned"
  if (matches(text, ['my notes', 'what have i learned', 'show notes', 'my tips', 'what did i learn'])) {
    const notes = UserNote.findByUserId(userId);
    const response = notes.length === 0
      ? "You don't have any saved notes yet. As we learn things together, I'll save helpful tips for you to look back on!"
      : `Here are your saved tips:\n\n${notes.map((n, i) => `${i + 1}. **${n.title}**: ${n.content}`).join('\n')}`;
    const filtered = vocabularyFilter.filterResponse(response, vocabLevel);
    conversationState.addMessage(sessionId, 'assistant', filtered);
    return { response: filtered, safetyAlert: null, guideId: null, stepSequence: null };
  }

  // Check for "start over" / restart
  if (matches(text, ['start over', 'new question', 'restart', 'begin again', 'fresh start'])) {
    conversationState.closeSession(sessionId);
    const response = "No problem at all! Let's start fresh. What would you like help with?";
    return { response, safetyAlert: null, guideId: null, stepSequence: null };
  }

  // Check for "repeat" / "say that again"
  if (matches(text, ['repeat', 'say that again', 'what was that', 'say again', "didn't understand", 'one more time'])) {
    const sequences = StepSequence.findByConversationId(sessionId);
    const activeSeq = sequences.filter(s => !s.completed).pop();
    if (activeSeq && activeSeq.steps[activeSeq.current_index]) {
      const stepText = activeSeq.steps[activeSeq.current_index];
      const response = `No problem! Here it is again:\n\nStep ${activeSeq.current_index + 1} of ${activeSeq.steps.length}: ${stepText}\n\nTake your time — there's no rush!`;
      const filtered = vocabularyFilter.filterResponse(response, vocabLevel);
      conversationState.addMessage(sessionId, 'assistant', filtered);
      return {
        response: filtered,
        safetyAlert: null,
        guideId: null,
        stepSequence: {
          id: activeSeq.id,
          taskName: null,
          steps: activeSeq.steps,
          currentIndex: activeSeq.current_index,
          completed: false,
        },
      };
    }
    const msgs = conversationState.getSessionMessages(sessionId, 5);
    const lastBot = msgs.filter(m => m.role === 'assistant').pop();
    const response = lastBot
      ? `Sure! Here's what I said:\n\n${lastBot.body}`
      : "I haven't said anything yet! What would you like help with?";
    conversationState.addMessage(sessionId, 'assistant', response);
    return { response, safetyAlert: null, guideId: null, stepSequence: null };
  }

  // Pattern match to a guide topic (sets guide metadata, text comes from CLI)
  let guideData = null;
  if (matches(text, ['copy', 'paste', 'ctrl+c', 'ctrl+v'])) {
    guideData = GUIDE_DATA.copy_paste;
  } else if (matches(text, ['screenshot', 'screen shot', 'capture screen', 'print screen'])) {
    guideData = GUIDE_DATA.screenshot;
  } else if (matches(text, ['email', 'mail', 'send a message', 'write a letter'])) {
    guideData = GUIDE_DATA.email;
  } else if (matches(text, ['setting', 'preference', 'control panel', 'configure'])) {
    guideData = GUIDE_DATA.settings;
  } else if (matches(text, ['bigger', 'zoom', 'larger', 'text size', 'can\'t read', 'too small'])) {
    guideData = GUIDE_DATA.zoom;
  } else if (matches(text, ['wifi', 'wi-fi', 'internet', 'connect', 'online'])) {
    guideData = GUIDE_DATA.wifi;
  } else if (matches(text, ['attach', 'attachment', 'file to email', 'paperclip'])) {
    guideData = GUIDE_DATA.attach_file;
  } else if (matches(text, ['browser', 'chrome', 'edge', 'firefox', 'safari', 'web browser'])) {
    guideData = GUIDE_DATA.open_browser;
  } else if (matches(text, ['restart', 'reboot', 'shut down', 'turn off'])) {
    guideData = GUIDE_DATA.restart_computer;
  } else if (matches(text, ['taskbar', 'task bar', 'bottom bar', 'start button'])) {
    guideData = GUIDE_DATA.use_taskbar;
  }

  // Get text response from Claude CLI (for ALL messages, with or without a guide)
  const cliResponse = askClaudeCli(text, user);
  const filtered = vocabularyFilter.filterResponse(cliResponse, vocabLevel);

  if (guideData) {
    // Log skill
    if (guideData.skillName) {
      try {
        SkillEvent.create({ user_id: userId, skill_name: guideData.skillName, status: 'started' });
      } catch (e) { /* ignore */ }
    }

    // Create step sequence
    let stepSequence = null;
    if (guideData.steps) {
      try {
        const seq = StepSequence.create({
          conversation_id: sessionId,
          steps: guideData.steps,
          current_index: 0,
        });
        stepSequence = {
          id: seq.id,
          taskName: guideData.taskName,
          steps: seq.steps,
          currentIndex: 0,
          completed: false,
        };
      } catch (e) {
        console.error('[mockResponder] Failed to create step sequence:', e.message);
      }
    }

    // Save a note
    if (guideData.skillName && guideData.taskName) {
      try {
        UserNote.create({
          user_id: userId,
          title: guideData.taskName,
          content: `You started learning ${guideData.taskName}. Remember to practice!`,
        });
      } catch (e) { /* ignore */ }
    }

    conversationState.addMessage(sessionId, 'assistant', filtered);
    return {
      response: filtered,
      safetyAlert: null,
      guideId: guideData.guideId,
      stepSequence,
    };
  }

  // No guide matched — just return the CLI response
  conversationState.addMessage(sessionId, 'assistant', filtered);
  return { response: filtered, safetyAlert: null, guideId: null, stepSequence: null };
}

/**
 * Call the claude CLI to answer a question.
 * Uses the user's Claude Code session — no API key needed.
 *
 * @param {string} text - the user's question
 * @param {object} user - user profile object
 * @returns {string} the AI response text
 */
function askClaudeCli(text, user) {
  const name = user?.name || 'friend';
  const os = user?.os_type || 'a computer';
  const comfort = user?.comfort_level || 1;

  const prompt = `You are PC Pal, a warm and patient tech tutor for elderly computer users. You are helping ${name}, who uses ${os} and has a comfort level of ${comfort}/5 (1=brand new, 5=comfortable).

Rules:
- Use simple, everyday language. No jargon.
- Be warm, patient, and encouraging — like a helpful grandchild.
- Keep your answer concise (under 150 words).
- If the question is about a computer task, give numbered steps.
- Never be condescending.

User's question: ${text}

Respond directly to the user:`;

  try {
    const result = execSync(
      `claude -p ${escapeShellArg(prompt)} --max-turns 1`,
      { encoding: 'utf-8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result.trim() || "I'm sorry, I couldn't come up with an answer right now. Could you try asking in a different way?";
  } catch (err) {
    console.error('[mockResponder] Claude CLI error:', err.message);
    return "I'm having a little trouble thinking right now. Could you try asking me again?";
  }
}

/**
 * Escape a string for safe use as a shell argument.
 */
function escapeShellArg(arg) {
  // Wrap in double quotes and escape internal double quotes and backslashes
  return '"' + arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

module.exports = { respond };
