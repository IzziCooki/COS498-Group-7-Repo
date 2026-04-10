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

const MOCK_RESPONSES = {
  copy_paste: {
    text: "Great question! Let me show you how to copy and paste. It's one of the most useful things you can do on a computer — it lets you move text from one place to another without retyping it.\n\nI've pulled up a visual guide for you below. Let's go through it step by step!",
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
    text: "Taking a screenshot is like taking a photo of what's on your screen right now. It's super useful when you need to show someone what you see! Let me show you how.",
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
    text: "Sending an email is a wonderful way to stay in touch! Think of it like writing a letter, but it arrives instantly. Let me walk you through it.",
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
    text: "Let me show you how to open your computer's Settings. This is where you can change things like your wallpaper, sounds, and display options.",
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
    text: "Making text bigger is really easy and makes everything so much more comfortable to read! Here's how to do it.",
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
    text: "Connecting to Wi-Fi is how your computer gets on the internet without any wires. Think of it like a radio signal that carries the internet to your device!",
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
  help: {
    text: "Hello! I'm PC Pal, your friendly tech helper. Here are some things I can help you with:\n\n• Copy and paste text\n• Take a screenshot\n• Send an email\n• Open your computer settings\n• Make text bigger on your screen\n• Connect to Wi-Fi\n• Attach a file to an email\n• Open a web browser\n• Restart your computer\n• Use the taskbar\n\nJust ask me about any of these, or ask me anything else about your computer! I'm here to help, and there's no such thing as a silly question.",
    guideId: null,
    steps: null,
    taskName: null,
    skillName: null,
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

  // Pattern match to a topic
  let mockData = null;
  if (matches(text, ['copy', 'paste', 'ctrl+c', 'ctrl+v'])) {
    mockData = MOCK_RESPONSES.copy_paste;
  } else if (matches(text, ['screenshot', 'screen shot', 'capture screen', 'print screen'])) {
    mockData = MOCK_RESPONSES.screenshot;
  } else if (matches(text, ['email', 'mail', 'send a message', 'write a letter'])) {
    mockData = MOCK_RESPONSES.email;
  } else if (matches(text, ['setting', 'preference', 'control panel', 'configure'])) {
    mockData = MOCK_RESPONSES.settings;
  } else if (matches(text, ['bigger', 'zoom', 'larger', 'text size', 'can\'t read', 'too small'])) {
    mockData = MOCK_RESPONSES.zoom;
  } else if (matches(text, ['wifi', 'wi-fi', 'internet', 'connect', 'online'])) {
    mockData = MOCK_RESPONSES.wifi;
  } else if (matches(text, ['help', 'hello', 'hi', 'what can you do', 'hey'])) {
    mockData = MOCK_RESPONSES.help;
  }

  if (mockData) {
    // Log skill if applicable
    if (mockData.skillName) {
      try {
        SkillEvent.create({ user_id: userId, skill_name: mockData.skillName, status: 'started' });
      } catch (e) { /* ignore duplicates */ }
    }

    // Create step sequence if applicable
    let stepSequence = null;
    if (mockData.steps) {
      try {
        const seq = StepSequence.create({
          conversation_id: sessionId,
          steps: mockData.steps,
          current_index: 0,
        });
        stepSequence = {
          id: seq.id,
          taskName: mockData.taskName,
          steps: seq.steps,
          currentIndex: 0,
          completed: false,
        };
      } catch (e) {
        console.error('[mockResponder] Failed to create step sequence:', e.message);
      }
    }

    // Save a note
    if (mockData.skillName && mockData.taskName) {
      try {
        UserNote.create({
          user_id: userId,
          title: mockData.taskName,
          content: `You started learning ${mockData.taskName}. Remember to practice!`,
        });
      } catch (e) { /* ignore */ }
    }

    const filtered = vocabularyFilter.filterResponse(mockData.text, vocabLevel);
    conversationState.addMessage(sessionId, 'assistant', filtered);

    return {
      response: filtered,
      safetyAlert: null,
      guideId: mockData.guideId,
      stepSequence,
    };
  }

  // Default fallback
  const defaultResponse = "That's a great question! I'm running in demo mode right now, so I can help you with these topics:\n\n• Copy and paste\n• Take a screenshot\n• Send an email\n• Open settings\n• Make text bigger\n• Connect to Wi-Fi\n\nJust ask about any of those, or type 'help' to see everything I can do!";
  const filtered = vocabularyFilter.filterResponse(defaultResponse, vocabLevel);
  conversationState.addMessage(sessionId, 'assistant', filtered);
  return { response: filtered, safetyAlert: null, guideId: null, stepSequence: null };
}

module.exports = { respond };
