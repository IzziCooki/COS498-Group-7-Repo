const path = require('path');
const fs = require('fs');

// Registry of reusable UI reference images the agent can embed in guide steps.
// Each entry maps a stable ID to a file path, alt text, category, and the
// skills where this image is typically useful. The skills array drives the
// conditional prompt injection so the agent only sees relevant IDs.
//
// Use skills: ['*'] for foundational images (browser icons, taskbar, dock,
// start button) that apply to virtually every guided task. These are always
// included alongside whatever skill-specific images match.
//
// To add a new reference:
//   1. Drop the PNG into the matching category folder under ui-references/
//      (a placeholder is auto-generated at server startup if the file is missing)
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
    // Animated hotspot prototype. A pulsing ring is drawn on top of the
    // image at these coordinates (% of width/height). Pure visual — does
    // not change what the agent says, only how the image renders.
    hotspots: [
      { x: 18, y: 22, label: 'Click here' },
    ],
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
  'outlook-app-icon': {
    file: 'email/outlook-app-icon.png',
    alt: 'Outlook desktop app icon — blue square with a white envelope and "O"',
    category: 'email',
    skills: ['send-email'],
  },
  'paperclip-attach-icon': {
    file: 'email/paperclip-attach-icon.png',
    alt: 'Paperclip icon in the email toolbar — click to attach a file to your message',
    category: 'email',
    skills: ['send-email', 'attach-file'],
  },
  // Animated demos. Short looping clips showing the full send-email flow
  // end-to-end for each provider. Use as a "watch this first" overview
  // step before the click-by-click static images. The img tag plays GIFs
  // natively so no extra rendering code is needed.
  'gmail-send-email-demo': {
    file: 'email/gmail-send-email-demo.gif',
    alt: 'Short demo: opening Gmail and sending an email step by step',
    category: 'email',
    skills: ['send-email'],
  },
  'yahoo-send-email-demo': {
    file: 'email/yahoo-send-email-demo.gif',
    alt: 'Short demo: opening Yahoo Mail and sending an email step by step',
    category: 'email',
    skills: ['send-email'],
  },
  'outlook-send-email-demo': {
    file: 'email/outlook-send-email-demo.gif',
    alt: 'Short demo: opening Outlook and sending an email step by step',
    category: 'email',
    skills: ['send-email'],
  },

  // Illustrated step-by-step images (warm cartoon style, friendlier on the
  // eye for elderly users than raw screenshots). One per step of the
  // standard 7-step send-email flow, available for each provider. Use in
  // create_guide steps when walking through the click-by-click portion.
  // The matching GIF demo (gmail/yahoo/outlook-send-email-demo) is the
  // animated overview; these stills let users follow at their own pace.
  // Note: alt text below describes what each illustration ACTUALLY depicts
  // (verified from rendered output). The agent is told via the send-email
  // skill prompt to match its step text to these alts so the picture and
  // the words always agree.
  'gmail-illustrated-step-1': {
    file: 'email/gmail-illustrated-step-1.png',
    alt: 'Step 1 — opening your internet browser to start using Gmail',
    category: 'email',
    skills: ['send-email'],
  },
  'gmail-illustrated-step-2': {
    file: 'email/gmail-illustrated-step-2.png',
    alt: 'Step 2 — typing gmail.com in the address bar and pressing Enter',
    category: 'email',
    skills: ['send-email'],
  },
  'gmail-illustrated-step-3': {
    file: 'email/gmail-illustrated-step-3.png',
    alt: 'Step 3 — signing in to your Gmail account with your email and password',
    category: 'email',
    skills: ['send-email'],
  },
  'gmail-illustrated-step-4': {
    file: 'email/gmail-illustrated-step-4.png',
    alt: 'Step 4 — clicking the Compose button to start a new email',
    category: 'email',
    skills: ['send-email'],
  },
  'gmail-illustrated-step-5': {
    file: 'email/gmail-illustrated-step-5.png',
    alt: 'Step 5 — filling in the email: type the recipient address in To, a subject line, and your message',
    category: 'email',
    skills: ['send-email'],
  },
  'gmail-illustrated-step-6': {
    file: 'email/gmail-illustrated-step-6.png',
    alt: 'Step 6 — reviewing your email and clicking the Send button',
    category: 'email',
    skills: ['send-email'],
  },
  'gmail-illustrated-step-7': {
    file: 'email/gmail-illustrated-step-7.png',
    alt: 'Step 7 — your email has been sent successfully (a confirmation appears on screen)',
    category: 'email',
    skills: ['send-email'],
  },

  'yahoo-illustrated-step-1': {
    file: 'email/yahoo-illustrated-step-1.png',
    alt: 'Step 1 — opening your internet browser to start using Yahoo Mail',
    category: 'email',
    skills: ['send-email'],
  },
  'yahoo-illustrated-step-2': {
    file: 'email/yahoo-illustrated-step-2.png',
    alt: 'Step 2 — typing yahoo.com (or mail.yahoo.com) in the address bar and pressing Enter',
    category: 'email',
    skills: ['send-email'],
  },
  'yahoo-illustrated-step-3': {
    file: 'email/yahoo-illustrated-step-3.png',
    alt: 'Step 3 — signing in to your Yahoo Mail account with your email and password',
    category: 'email',
    skills: ['send-email'],
  },
  'yahoo-illustrated-step-4': {
    file: 'email/yahoo-illustrated-step-4.png',
    alt: 'Step 4 — clicking the Compose button to start a new email',
    category: 'email',
    skills: ['send-email'],
  },
  'yahoo-illustrated-step-5': {
    file: 'email/yahoo-illustrated-step-5.png',
    alt: 'Step 5 — filling in the email: type the recipient address in To, a subject line, and your message',
    category: 'email',
    skills: ['send-email'],
  },
  'yahoo-illustrated-step-6': {
    file: 'email/yahoo-illustrated-step-6.png',
    alt: 'Step 6 — reviewing your email and clicking the Send button',
    category: 'email',
    skills: ['send-email'],
  },
  'yahoo-illustrated-step-7': {
    file: 'email/yahoo-illustrated-step-7.png',
    alt: 'Step 7 — your email has been sent successfully (a confirmation appears on screen)',
    category: 'email',
    skills: ['send-email'],
  },

  'outlook-illustrated-step-1': {
    file: 'email/outlook-illustrated-step-1.png',
    alt: 'Step 1 — opening your internet browser to start using Outlook',
    category: 'email',
    skills: ['send-email'],
  },
  'outlook-illustrated-step-2': {
    file: 'email/outlook-illustrated-step-2.png',
    alt: 'Step 2 — typing outlook.com in the address bar and pressing Enter',
    category: 'email',
    skills: ['send-email'],
  },
  'outlook-illustrated-step-3': {
    file: 'email/outlook-illustrated-step-3.png',
    alt: 'Step 3 — signing in to your Outlook account with your email and password',
    category: 'email',
    skills: ['send-email'],
  },
  'outlook-illustrated-step-4': {
    file: 'email/outlook-illustrated-step-4.png',
    alt: 'Step 4 — clicking the New Mail button to start a new email',
    category: 'email',
    skills: ['send-email'],
  },
  'outlook-illustrated-step-5': {
    file: 'email/outlook-illustrated-step-5.png',
    alt: 'Step 5 — filling in the email: type the recipient address in To, a subject line, and your message',
    category: 'email',
    skills: ['send-email'],
  },
  'outlook-illustrated-step-6': {
    file: 'email/outlook-illustrated-step-6.png',
    alt: 'Step 6 — reviewing your email and clicking the Send button',
    category: 'email',
    skills: ['send-email'],
  },
  'outlook-illustrated-step-7': {
    file: 'email/outlook-illustrated-step-7.png',
    alt: 'Step 7 — your email has been sent successfully (a confirmation appears on screen)',
    category: 'email',
    skills: ['send-email'],
  },

  // --- Video call (6) ---
  'zoom-join-meeting': {
    file: 'video-call/zoom-join-meeting.png',
    alt: 'Blue "Join a Meeting" button on the Zoom home screen',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-download-button': {
    file: 'video-call/zoom-download-button.png',
    alt: 'Blue "Download" button on the zoom.us website',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-homepage': {
    file: 'video-call/zoom-homepage.png',
    alt: 'The zoom.us homepage showing the Download button at the top',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-app-icon': {
    file: 'video-call/zoom-app-icon.png',
    alt: 'Zoom desktop app icon — blue square with a white video camera',
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
  'end-call-red-button': {
    file: 'video-call/end-call-red-button.png',
    alt: 'Red circle button with a phone icon at the bottom of a video call — tap to end the call',
    category: 'video-call',
    skills: ['video-call'],
  },
  'teams-app-icon': {
    file: 'video-call/teams-app-icon.png',
    alt: 'Microsoft Teams app icon — purple with a white "T"',
    category: 'video-call',
    skills: ['video-call'],
  },

  // Zoom join-a-meeting illustrated walkthrough. Step 1 has 4 browser
  // variants (chrome / edge / firefox / safari) — the agent picks the
  // right one based on the user's stated browser. Steps 2-7 are the
  // shared in-Zoom flow regardless of browser. The matching GIF demo
  // is `zoom-video-call-demo`.
  'zoom-video-call-demo': {
    file: 'video-call/zoom-video-call-demo.gif',
    alt: 'Short demo: opening your browser and joining a Zoom meeting step by step',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-1-chrome': {
    file: 'video-call/zoom-illustrated-step-1-chrome.png',
    alt: 'Step 1 — opening Chrome (the colorful circle on your taskbar) to start joining a Zoom meeting',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-1-edge': {
    file: 'video-call/zoom-illustrated-step-1-edge.png',
    alt: 'Step 1 — opening Microsoft Edge (the blue and green wave) to start joining a Zoom meeting',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-1-firefox': {
    file: 'video-call/zoom-illustrated-step-1-firefox.png',
    alt: 'Step 1 — opening Firefox (the orange fox around a blue globe) to start joining a Zoom meeting',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-1-safari': {
    file: 'video-call/zoom-illustrated-step-1-safari.png',
    alt: 'Step 1 — opening Safari (the blue compass) to start joining a Zoom meeting',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-2': {
    file: 'video-call/zoom-illustrated-step-2.png',
    alt: 'Step 2 — typing zoom.us in the address bar and pressing Enter',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-3': {
    file: 'video-call/zoom-illustrated-step-3.png',
    alt: 'Step 3 — clicking the blue "Join a Meeting" button on the Zoom homepage',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-4': {
    file: 'video-call/zoom-illustrated-step-4.png',
    alt: 'Step 4 — typing the meeting ID number that your doctor or family member sent you',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-5': {
    file: 'video-call/zoom-illustrated-step-5.png',
    alt: 'Step 5 — clicking the blue Join button to enter the meeting',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-6': {
    file: 'video-call/zoom-illustrated-step-6.png',
    alt: 'Step 6 — clicking Allow when your browser asks to use the camera and microphone',
    category: 'video-call',
    skills: ['video-call'],
  },
  'zoom-illustrated-step-7': {
    file: 'video-call/zoom-illustrated-step-7.png',
    alt: 'Step 7 — you are in the call! Wave hello and start chatting',
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
  'whatsapp-app-icon': {
    file: 'messaging/whatsapp-app-icon.png',
    alt: 'WhatsApp app icon — green circle with a white phone and speech bubble',
    category: 'messaging',
    skills: ['text-message'],
  },

  // --- Browser (7) ---
  'chrome-icon': {
    file: 'browser/chrome-icon.png',
    alt: 'Chrome browser icon — a colorful circle (red, yellow, green, blue) with a blue dot in the middle',
    category: 'browser',
    skills: ['*'],
  },
  'edge-icon': {
    file: 'browser/edge-icon.png',
    alt: 'Microsoft Edge browser icon — a blue and green swirl that looks like a wave',
    category: 'browser',
    skills: ['*'],
  },
  'firefox-icon': {
    file: 'browser/firefox-icon.png',
    alt: 'Firefox browser icon — an orange fox wrapped around a blue globe',
    category: 'browser',
    skills: ['*'],
  },
  'safari-icon': {
    file: 'browser/safari-icon.png',
    alt: 'Safari browser icon — a blue compass with a red needle',
    category: 'browser',
    skills: ['*'],
  },
  'chrome-address-bar': {
    file: 'browser/chrome-address-bar.png',
    alt: 'The long white box at the top of the browser where you type website names',
    category: 'browser',
    skills: ['*'],
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
    skills: ['*'],
  },
  'windows-taskbar': {
    file: 'system-windows/windows-taskbar.png',
    alt: 'The strip of little pictures along the bottom of the Windows screen',
    category: 'system-windows',
    skills: ['*'],
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
  'windows-file-explorer': {
    file: 'system-windows/windows-file-explorer.png',
    alt: 'File Explorer app icon — yellow folder, used to browse files and folders',
    category: 'system-windows',
    skills: ['*'],
  },
  'windows-search-bar': {
    file: 'system-windows/windows-search-bar.png',
    alt: 'Search box next to the Start button at the bottom of the screen — type here to find apps or files',
    category: 'system-windows',
    skills: ['*'],
  },

  // --- Mac system (3) ---
  'mac-apple-menu': {
    file: 'system-mac/mac-apple-menu.png',
    alt: 'Apple logo in the upper-left corner of the Mac screen',
    category: 'system-mac',
    skills: ['*'],
  },
  'mac-dock': {
    file: 'system-mac/mac-dock.png',
    alt: 'The strip of little pictures along the bottom of the Mac screen',
    category: 'system-mac',
    skills: ['*'],
  },
  'mac-wifi-menubar': {
    file: 'system-mac/mac-wifi-menubar.png',
    alt: 'Wi-Fi icon in the upper-right menu bar on Mac',
    category: 'system-mac',
    skills: ['wifi', 'network-fix'],
  },
  'mac-finder-icon': {
    file: 'system-mac/mac-finder-icon.png',
    alt: 'Finder app icon in the Dock — blue and white smiling face. Used to browse files and folders on Mac.',
    category: 'system-mac',
    skills: ['*'],
  },
  'mac-spotlight': {
    file: 'system-mac/mac-spotlight.png',
    alt: 'Spotlight search icon — magnifying glass in the upper-right corner of the Mac screen',
    category: 'system-mac',
    skills: ['*'],
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
    // Optional pulsing-ring overlays drawn on top of the image. Empty
    // array when an entry has no annotations — keeps the client side
    // safe to spread/iterate without an existence check.
    hotspots: Array.isArray(entry.hotspots) ? entry.hotspots : [],
  };
}

// Returns all IDs whose `skills` array contains the target skillId OR the
// wildcard '*' (foundational images that apply to every task). Skill-specific
// results are returned first, followed by wildcards — this ordering surfaces
// the most relevant images at the top of the prompt section.
function getIdsForSkill(skillId) {
  const specific = [];
  const wildcard = [];
  for (const [id, entry] of Object.entries(LIBRARY)) {
    if (skillId && entry.skills.includes(skillId)) {
      specific.push(id);
    } else if (entry.skills.includes('*')) {
      wildcard.push(id);
    }
  }
  return [...specific, ...wildcard];
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
