const path = require('path');
const fs = require('fs');

// Registry of reusable UI reference images the agent can embed in guide steps.
// Each entry maps a stable ID to a file path, alt text, category, and the
// skills where this image is typically useful. The skills array drives the
// conditional prompt injection so the agent only sees relevant IDs.
//
// To add a new reference:
//   1. Drop the PNG into the matching category folder under ui-references/
//   2. Add an entry here keyed by the file stem
//   3. Restart the server (validateLibrary will confirm file presence)

const LIBRARY = {
  // --- Email (5) ---
  'yahoo-compose-button': {
    file: 'email/yahoo-compose-button.png',
    alt: 'Yellow Compose button, upper-left of Yahoo Mail',
    category: 'email',
    skills: ['send-email'],
  },
  'gmail-compose-button': {
    file: 'email/gmail-compose-button.png',
    alt: 'Red Compose button with a pencil icon, upper-left of Gmail',
    category: 'email',
    skills: ['send-email'],
  },
  'email-to-field': {
    file: 'email/email-to-field.png',
    alt: 'The "To" field at the top of a new email — where the recipient address goes',
    category: 'email',
    skills: ['send-email'],
  },
  'email-subject-field': {
    file: 'email/email-subject-field.png',
    alt: 'The "Subject" field in a new email — a short title for the message',
    category: 'email',
    skills: ['send-email'],
  },
  'email-send-button': {
    file: 'email/email-send-button.png',
    alt: 'Blue Send button at the bottom of a new email',
    category: 'email',
    skills: ['send-email'],
  },

  // --- Video call (3) ---
  'zoom-join-meeting': {
    file: 'video-call/zoom-join-meeting.png',
    alt: 'Blue "Join a Meeting" button on the Zoom home screen',
    category: 'video-call',
    skills: ['video-call'],
  },
  'facetime-call-button': {
    file: 'video-call/facetime-call-button.png',
    alt: 'Green FaceTime call button with a video camera icon',
    category: 'video-call',
    skills: ['video-call'],
  },
  'mute-microphone-icon': {
    file: 'video-call/mute-microphone-icon.png',
    alt: 'Microphone icon at the bottom of a call — tap to mute or unmute',
    category: 'video-call',
    skills: ['video-call'],
  },

  // --- Messaging (2) ---
  'imessage-new-message': {
    file: 'messaging/imessage-new-message.png',
    alt: 'Pencil-and-paper icon in the upper-right of Messages to start a new message',
    category: 'messaging',
    skills: ['text-message'],
  },
  'sms-send-arrow': {
    file: 'messaging/sms-send-arrow.png',
    alt: 'Upward-pointing blue arrow next to the message box — tap to send',
    category: 'messaging',
    skills: ['text-message'],
  },

  // --- Browser (3) ---
  'chrome-address-bar': {
    file: 'browser/chrome-address-bar.png',
    alt: 'The long white box at the top of Chrome where you type website names',
    category: 'browser',
    skills: ['browser', 'send-email'],
  },
  'browser-back-button': {
    file: 'browser/browser-back-button.png',
    alt: 'Left-pointing arrow in the upper-left of the browser — goes back one page',
    category: 'browser',
    skills: ['browser'],
  },
  'browser-bookmark-star': {
    file: 'browser/browser-bookmark-star.png',
    alt: 'Star icon on the right side of the address bar — saves the page as a bookmark',
    category: 'browser',
    skills: ['browser'],
  },

  // --- Windows system (4) ---
  'windows-start-button': {
    file: 'system-windows/windows-start-button.png',
    alt: 'Windows logo button in the lower-left of the screen — opens the Start menu',
    category: 'system-windows',
    skills: ['settings', 'restart', 'app-install'],
  },
  'windows-taskbar': {
    file: 'system-windows/windows-taskbar.png',
    alt: 'The strip of little pictures along the bottom of the Windows screen',
    category: 'system-windows',
    skills: ['browser', 'send-email'],
  },
  'windows-wifi-icon': {
    file: 'system-windows/windows-wifi-icon.png',
    alt: 'Wi-Fi signal icon in the lower-right of the screen',
    category: 'system-windows',
    skills: ['wifi', 'network-fix'],
  },
  'windows-settings-gear': {
    file: 'system-windows/windows-settings-gear.png',
    alt: 'Gear-shaped Settings icon in the Start menu',
    category: 'system-windows',
    skills: ['settings'],
  },

  // --- Mac system (3) ---
  'mac-apple-menu': {
    file: 'system-mac/mac-apple-menu.png',
    alt: 'Apple logo in the upper-left corner of the Mac screen',
    category: 'system-mac',
    skills: ['settings', 'restart'],
  },
  'mac-dock': {
    file: 'system-mac/mac-dock.png',
    alt: 'The strip of little pictures along the bottom of the Mac screen',
    category: 'system-mac',
    skills: ['browser', 'send-email'],
  },
  'mac-wifi-menubar': {
    file: 'system-mac/mac-wifi-menubar.png',
    alt: 'Wi-Fi icon in the upper-right menu bar on Mac',
    category: 'system-mac',
    skills: ['wifi', 'network-fix'],
  },
};

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'ui-references');
const URL_PREFIX = '/ui-references';

function getById(id) {
  const entry = LIBRARY[id];
  if (!entry) return null;
  return {
    id,
    url: `${URL_PREFIX}/${entry.file}`,
    alt: entry.alt,
  };
}

function getIdsForSkill(skillId) {
  return Object.keys(LIBRARY).filter(id => LIBRARY[id].skills.includes(skillId));
}

function getAllEntries() {
  return Object.entries(LIBRARY).map(([id, entry]) => ({
    id,
    ...entry,
    url: `${URL_PREFIX}/${entry.file}`,
  }));
}

// Logs a summary at server startup. Missing files are warnings, not errors —
// the graceful fallback on the client handles missing images at render time.
function validateLibrary() {
  const entries = Object.entries(LIBRARY);
  let present = 0;
  let missing = [];
  for (const [id, entry] of entries) {
    const fullPath = path.join(ASSETS_DIR, entry.file);
    if (fs.existsSync(fullPath)) {
      present++;
    } else {
      missing.push(id);
    }
  }
  console.log(`[uiReferenceLibrary] ${present}/${entries.length} references valid`);
  if (missing.length > 0) {
    console.warn(`[uiReferenceLibrary] Missing files for IDs: ${missing.join(', ')}`);
  }
  return { total: entries.length, present, missing };
}

module.exports = {
  LIBRARY,
  ASSETS_DIR,
  URL_PREFIX,
  getById,
  getIdsForSkill,
  getAllEntries,
  validateLibrary,
};
