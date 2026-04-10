/**
 * guideRegistry.js — Visual guide data for PC Pal
 *
 * Maps task IDs to guide data with OS-specific step variants.
 * Supports: Windows, Mac, iPhone, Android
 * Steps use very simple language written for someone who has never used a device.
 */

export const guideRegistry = {
  copy_paste: {
    title: 'How to Copy and Paste',
    variants: {
      Windows: [
        { num: 1, text: 'Click at the very start of the words you want. Hold your mouse button down and drag across to the end. The words will turn blue — that means they are selected.', keys: null },
        { num: 2, text: 'Hold down the Ctrl key (bottom-left of keyboard) and press the C key. This copies the words.', keys: ['Ctrl', 'C'] },
        { num: 3, text: 'Click once in the spot where you want the words to appear.', keys: null },
        { num: 4, text: 'Hold down the Ctrl key again and press the V key. The words will appear!', keys: ['Ctrl', 'V'] },
      ],
      Mac: [
        { num: 1, text: 'Click at the very start of the words you want. Hold your mouse button down and drag across to the end. The words will turn blue — that means they are selected.', keys: null },
        { num: 2, text: 'Hold down the Command key (looks like ⌘, near the space bar) and press the C key. This copies the words.', keys: ['Cmd', 'C'] },
        { num: 3, text: 'Click once in the spot where you want the words to appear.', keys: null },
        { num: 4, text: 'Hold down the Command key again and press the V key. The words will appear!', keys: ['Cmd', 'V'] },
      ],
      iPhone: [
        { num: 1, text: 'Press and hold your finger on a word for about 2 seconds. A small menu will pop up and the word will be highlighted.', keys: null },
        { num: 2, text: 'Drag the blue dots to select more words if you need to.', keys: null },
        { num: 3, text: 'Tap "Copy" from the little menu that appeared above the text.', keys: null },
        { num: 4, text: 'Go to where you want to paste. Press and hold on the empty spot, then tap "Paste" from the menu.', keys: null },
      ],
      Android: [
        { num: 1, text: 'Press and hold your finger on a word for about 2 seconds. The word will be highlighted and two small handles will appear.', keys: null },
        { num: 2, text: 'Drag the handles to select more words if you need to.', keys: null },
        { num: 3, text: 'Tap "Copy" from the toolbar that appeared at the top of the screen.', keys: null },
        { num: 4, text: 'Go to where you want to paste. Press and hold on the empty spot, then tap "Paste".', keys: null },
      ],
    },
  },

  take_screenshot: {
    title: 'How to Take a Screenshot',
    variants: {
      Windows: [
        { num: 1, text: 'Look at your keyboard. Find the Windows key (it has a little Windows logo on it, near the bottom-left).', keys: null },
        { num: 2, text: 'Press and hold the Windows key, then also press Shift and S at the same time.', keys: ['Win', 'Shift', 'S'] },
        { num: 3, text: 'Your screen will go a little dim. Your mouse pointer will change to a cross shape.', keys: null },
        { num: 4, text: 'Click and drag to draw a box around the part of the screen you want to save. Let go of the mouse when done.', keys: null },
        { num: 5, text: 'A small message will pop up in the corner. Click it to save or edit your screenshot.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'Look at your keyboard. Find the Command key (it has ⌘ on it, near the space bar) and the Shift key.', keys: null },
        { num: 2, text: 'Press Command, Shift, and 3 all at the same time. This takes a picture of your whole screen.', keys: ['Cmd', 'Shift', '3'] },
        { num: 3, text: 'You will hear a camera click sound. A small preview will appear in the corner of your screen.', keys: null },
        { num: 4, text: 'Click the preview to see and save your screenshot. It is also saved to your Desktop automatically.', keys: null },
      ],
      iPhone: [
        { num: 1, text: 'Make sure the screen shows what you want to capture.', keys: null },
        { num: 2, text: 'Press the Side button (right side of phone) and the Volume Up button at the exact same time.', keys: ['Side', 'Vol Up'] },
        { num: 3, text: 'Your screen will flash white and you will hear a click sound.', keys: null },
        { num: 4, text: 'A small picture will appear in the bottom-left corner. Tap it to edit, or wait and it will save to your Photos automatically.', keys: null },
      ],
      Android: [
        { num: 1, text: 'Make sure the screen shows what you want to capture.', keys: null },
        { num: 2, text: 'Press the Power button and the Volume Down button at the exact same time.', keys: ['Power', 'Vol Down'] },
        { num: 3, text: 'Your screen will flash and you may hear a click sound. That means it worked!', keys: null },
        { num: 4, text: 'A small preview will appear at the bottom. Tap it to edit, or find it later in your Photos or Gallery app.', keys: null },
      ],
    },
  },

  send_email: {
    title: 'How to Send an Email',
    variants: {
      Windows: [
        { num: 1, text: 'Open your email program. It might be called Mail, Outlook, or Gmail (in your web browser).', keys: null },
        { num: 2, text: 'Look for a button that says "New", "Compose", or has a pencil icon. Click it.', keys: null },
        { num: 3, text: 'A new blank email will open. Click the box next to "To:" and type the email address of the person you are writing to.', keys: null },
        { num: 4, text: 'Click the box next to "Subject:" and type a short title for your email (like "Hello" or "Question").', keys: null },
        { num: 5, text: 'Click in the big white area below. Type your message here.', keys: null },
        { num: 6, text: 'When you are ready, click the "Send" button. It usually looks like an arrow or an airplane. Your email is sent!', keys: null },
      ],
      Mac: [
        { num: 1, text: 'Open your email program. It might be called Mail, Outlook, or Gmail (in your web browser).', keys: null },
        { num: 2, text: 'Look for a button that says "New Message", "Compose", or has a pencil icon. Click it.', keys: null },
        { num: 3, text: 'A new blank email will open. Click the box next to "To:" and type the email address of the person you are writing to.', keys: null },
        { num: 4, text: 'Click the box next to "Subject:" and type a short title for your email.', keys: null },
        { num: 5, text: 'Click in the big white area below. Type your message here.', keys: null },
        { num: 6, text: 'When you are ready, click the "Send" button. Your email is sent!', keys: null },
      ],
      iPhone: [
        { num: 1, text: 'Open the Mail app (it looks like a white envelope on a blue background). You can also use Gmail if you have it.', keys: null },
        { num: 2, text: 'Tap the little pencil-and-paper icon in the bottom-right corner. This starts a new email.', keys: null },
        { num: 3, text: 'Tap the "To:" line and type the email address of the person you want to write to.', keys: null },
        { num: 4, text: 'Tap the "Subject:" line and type a short title for your email.', keys: null },
        { num: 5, text: 'Tap in the big white area below and type your message.', keys: null },
        { num: 6, text: 'When you are done, tap the blue arrow button (top-right corner) to send your email!', keys: null },
      ],
      Android: [
        { num: 1, text: 'Open the Gmail app (it looks like a colorful envelope). You can find it on your home screen or in your app list.', keys: null },
        { num: 2, text: 'Tap the pencil icon or "Compose" button in the bottom-right corner.', keys: null },
        { num: 3, text: 'Tap the "To" line and type the email address of the person you want to write to.', keys: null },
        { num: 4, text: 'Tap the "Subject" line and type a short title for your email.', keys: null },
        { num: 5, text: 'Tap in the big area below and type your message.', keys: null },
        { num: 6, text: 'When you are done, tap the arrow button (top-right) to send your email!', keys: null },
      ],
    },
  },

  open_settings: {
    title: 'How to Open Settings',
    variants: {
      Windows: [
        { num: 1, text: 'Look at the bottom-left corner of your screen. You will see a button with a Windows logo. Click it.', keys: null },
        { num: 2, text: 'A menu will pop up. Look for a gear icon — that is the Settings button. Click it.', keys: null },
        { num: 3, text: 'The Settings window will open. Here you can change many things about how your computer looks and works.', keys: null },
        { num: 4, text: 'To find something specific, click the search box at the top of Settings and type what you are looking for.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'Look at the top-left corner of your screen. You will see a small Apple logo. Click it.', keys: null },
        { num: 2, text: 'A small menu will drop down. Click "System Settings" (or "System Preferences" on older Macs).', keys: null },
        { num: 3, text: 'The Settings window will open. Here you can change many things about how your computer looks and works.', keys: null },
        { num: 4, text: 'To find something specific, click the search box at the top and type what you are looking for.', keys: null },
      ],
      iPhone: [
        { num: 1, text: 'Find the Settings app on your home screen. It looks like a grey gear icon.', keys: null },
        { num: 2, text: 'Tap the Settings icon to open it.', keys: null },
        { num: 3, text: 'You will see a list of options. Scroll up and down by swiping your finger.', keys: null },
        { num: 4, text: 'To find something specific, pull down on the list to reveal a search bar at the top. Type what you need.', keys: null },
      ],
      Android: [
        { num: 1, text: 'Swipe down from the very top of your screen. A panel with small icons will appear.', keys: null },
        { num: 2, text: 'Tap the gear icon in the top-right corner. This opens Settings.', keys: null },
        { num: 3, text: 'You will see a list of options. Scroll up and down by swiping your finger.', keys: null },
        { num: 4, text: 'To find something specific, tap the magnifying glass icon at the top and type what you need.', keys: null },
      ],
    },
  },

  zoom_text: {
    title: 'How to Make Text Bigger',
    variants: {
      Windows: [
        { num: 1, text: 'If you are on a web page, hold down the Ctrl key and press the + (plus) key to make it bigger.', keys: ['Ctrl', '+'] },
        { num: 2, text: 'To make it smaller again, hold Ctrl and press the - (minus) key.', keys: ['Ctrl', '-'] },
        { num: 3, text: 'To make ALL text on your computer bigger, open Settings (gear icon in the Start Menu).', keys: null },
        { num: 4, text: 'In Settings, click "System", then "Display". Look for "Scale" and choose a bigger number like 125% or 150%.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'If you are on a web page, hold down the Command key and press the + (plus) key to make it bigger.', keys: ['Cmd', '+'] },
        { num: 2, text: 'To make it smaller again, hold Command and press the - (minus) key.', keys: ['Cmd', '-'] },
        { num: 3, text: 'To make ALL text bigger, click the Apple logo, then "System Settings".', keys: null },
        { num: 4, text: 'Click "Displays". Look for a setting labeled "Larger Text".', keys: null },
      ],
      iPhone: [
        { num: 1, text: 'Open the Settings app (grey gear icon).', keys: null },
        { num: 2, text: 'Tap "Display & Brightness".', keys: null },
        { num: 3, text: 'Tap "Text Size". You will see a slider at the bottom.', keys: null },
        { num: 4, text: 'Drag the slider to the right to make text bigger. You will see the change right away!', keys: null },
      ],
      Android: [
        { num: 1, text: 'Open the Settings app (gear icon).', keys: null },
        { num: 2, text: 'Tap "Display" (or "Display & Brightness").', keys: null },
        { num: 3, text: 'Tap "Font size" or "Display size".', keys: null },
        { num: 4, text: 'Drag the slider to the right to make everything bigger. You will see the change right away!', keys: null },
      ],
    },
  },

  find_wifi: {
    title: 'How to Connect to Wi-Fi',
    variants: {
      Windows: [
        { num: 1, text: 'Look at the bottom-right corner of your screen. You should see a small Wi-Fi symbol (it looks like a fan shape). Click it.', keys: null },
        { num: 2, text: 'A list of nearby Wi-Fi networks will appear. Find the name of your home Wi-Fi network in the list.', keys: null },
        { num: 3, text: 'Click on your network name. A button that says "Connect" will appear. Click "Connect".', keys: null },
        { num: 4, text: 'If asked for a password, type your Wi-Fi password carefully. Then click "Next" or press Enter.', keys: null },
        { num: 5, text: 'You are now connected! The Wi-Fi symbol will become solid and filled in.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'Look at the top-right corner of your screen. You should see a small Wi-Fi symbol (it looks like a fan shape). Click it.', keys: null },
        { num: 2, text: 'A list of nearby Wi-Fi networks will appear. Find the name of your home Wi-Fi network in the list.', keys: null },
        { num: 3, text: 'Click on your network name. A box will appear asking for your password.', keys: null },
        { num: 4, text: 'Type your Wi-Fi password carefully. Then click "Join".', keys: null },
        { num: 5, text: 'You are now connected! The Wi-Fi symbol at the top will become solid and filled in.', keys: null },
      ],
      iPhone: [
        { num: 1, text: 'Open the Settings app (grey gear icon on your home screen).', keys: null },
        { num: 2, text: 'Tap "Wi-Fi" near the top of the list.', keys: null },
        { num: 3, text: 'Make sure Wi-Fi is turned on (the switch should be green). You will see a list of networks.', keys: null },
        { num: 4, text: 'Tap the name of your home Wi-Fi network.', keys: null },
        { num: 5, text: 'Type your Wi-Fi password and tap "Join". A blue checkmark will appear next to the name when you are connected!', keys: null },
      ],
      Android: [
        { num: 1, text: 'Open the Settings app (gear icon).', keys: null },
        { num: 2, text: 'Tap "Network & Internet" or "Connections" (it may look slightly different on your phone).', keys: null },
        { num: 3, text: 'Tap "Wi-Fi" and make sure it is turned on.', keys: null },
        { num: 4, text: 'You will see a list of networks. Tap the name of your home Wi-Fi network.', keys: null },
        { num: 5, text: 'Type your Wi-Fi password and tap "Connect". The word "Connected" will appear under the network name!', keys: null },
      ],
    },
  },

  attach_file: {
    title: 'How to Attach a File to an Email',
    variants: {
      Windows: [
        { num: 1, text: 'Open your email program and start writing a new email.', keys: null },
        { num: 2, text: 'Look for a small paperclip icon in the email toolbar. Click on it.', keys: null },
        { num: 3, text: 'A window will open showing your files and folders. Find the file you want to send.', keys: null },
        { num: 4, text: 'Click once on the file to select it, then click "Open" or "Attach".', keys: null },
        { num: 5, text: 'The file will be added to your email. You will see its name appear. Click Send when ready!', keys: null },
      ],
      Mac: [
        { num: 1, text: 'Open your email program and start writing a new email.', keys: null },
        { num: 2, text: 'Look for a small paperclip icon in the email toolbar. Click on it.', keys: null },
        { num: 3, text: 'A window will open showing your files. Find the file you want to send.', keys: null },
        { num: 4, text: 'Click once on the file, then click "Choose File" or "Attach".', keys: null },
        { num: 5, text: 'The file will be added to your email. Click Send when ready!', keys: null },
      ],
      iPhone: [
        { num: 1, text: 'Start writing a new email in the Mail or Gmail app.', keys: null },
        { num: 2, text: 'Tap inside the email body, then tap the arrow or paperclip icon above the keyboard.', keys: null },
        { num: 3, text: 'Choose "Attach File" or "Add Attachment". You will see your files.', keys: null },
        { num: 4, text: 'Find and tap the file you want to attach. It will be added to your email.', keys: null },
        { num: 5, text: 'Tap the blue send arrow when you are ready!', keys: null },
      ],
      Android: [
        { num: 1, text: 'Start writing a new email in the Gmail app.', keys: null },
        { num: 2, text: 'Tap the paperclip icon at the top of the screen.', keys: null },
        { num: 3, text: 'Choose "Attach file". You will see your files and photos.', keys: null },
        { num: 4, text: 'Find and tap the file you want to attach. It will be added to your email.', keys: null },
        { num: 5, text: 'Tap the send arrow when you are ready!', keys: null },
      ],
    },
  },

  open_browser: {
    title: 'How to Open a Web Browser',
    variants: {
      Windows: [
        { num: 1, text: 'A web browser lets you visit websites. Common ones are Microsoft Edge (blue wave), Google Chrome (colorful circle), or Firefox (fox).', keys: null },
        { num: 2, text: 'Look at the Taskbar at the very bottom of your screen. Find your browser icon and double-click it.', keys: null },
        { num: 3, text: 'If you do not see it, click the Start button (Windows logo, bottom-left), type the browser name, and press Enter.', keys: null },
        { num: 4, text: 'The browser will open. Click the long bar at the top (address bar), type a website, and press Enter.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'A web browser lets you visit websites. Safari (blue compass) comes with your Mac. You can also use Chrome or Firefox.', keys: null },
        { num: 2, text: 'Look at the Dock at the bottom of your screen. Find the Safari or Chrome icon and click it.', keys: null },
        { num: 3, text: 'If you do not see it, click the magnifying glass at the top-right, type the browser name, and press Enter.', keys: null },
        { num: 4, text: 'The browser will open. Click the bar at the top, type a website, and press Enter.', keys: null },
      ],
      iPhone: [
        { num: 1, text: 'Safari is the web browser that comes with your iPhone. It looks like a blue compass icon.', keys: null },
        { num: 2, text: 'Find Safari on your home screen and tap it.', keys: null },
        { num: 3, text: 'Tap the bar at the bottom of the screen (or top on some iPhones). Type a website address like "google.com".', keys: null },
        { num: 4, text: 'Tap "Go" on your keyboard. The website will load!', keys: null },
      ],
      Android: [
        { num: 1, text: 'Chrome is the web browser that comes with most Android phones. It looks like a colorful circle icon.', keys: null },
        { num: 2, text: 'Find Chrome on your home screen or app list and tap it.', keys: null },
        { num: 3, text: 'Tap the bar at the top of the screen. Type a website address like "google.com".', keys: null },
        { num: 4, text: 'Tap the Go or Enter button on your keyboard. The website will load!', keys: null },
      ],
    },
  },

  restart_computer: {
    title: 'How to Restart Your Device',
    variants: {
      Windows: [
        { num: 1, text: 'Save any work you have open first!', keys: null },
        { num: 2, text: 'Click the Windows logo button at the bottom-left corner of your screen.', keys: null },
        { num: 3, text: 'Look for a Power button icon (a circle with a line at the top). Click it.', keys: null },
        { num: 4, text: 'Click "Restart". Your computer will close everything and turn itself off and back on. This takes about 1-2 minutes.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'Save any work you have open first!', keys: null },
        { num: 2, text: 'Click the Apple logo in the very top-left corner of your screen.', keys: null },
        { num: 3, text: 'Click "Restart..." from the menu that drops down.', keys: null },
        { num: 4, text: 'Click "Restart" to confirm. Your computer will turn off and back on. This takes about 1-2 minutes.', keys: null },
      ],
      iPhone: [
        { num: 1, text: 'Press and hold the Side button and either Volume button at the same time.', keys: ['Side', 'Volume'] },
        { num: 2, text: 'A slider will appear that says "slide to power off". Slide it to the right.', keys: null },
        { num: 3, text: 'Wait about 10 seconds for the screen to go completely dark.', keys: null },
        { num: 4, text: 'Press and hold the Side button again until you see the Apple logo. Your phone is restarting!', keys: null },
      ],
      Android: [
        { num: 1, text: 'Press and hold the Power button on the side of your phone for a few seconds.', keys: null },
        { num: 2, text: 'A menu will appear on screen. Tap "Restart" or "Reboot".', keys: null },
        { num: 3, text: 'Your phone will turn off and back on by itself. This takes about 30 seconds to a minute.', keys: null },
      ],
    },
  },

  use_taskbar: {
    title: 'How to Use the Taskbar / Dock',
    variants: {
      Windows: [
        { num: 1, text: 'The Taskbar is the long bar at the very bottom of your screen. It is always there.', keys: null },
        { num: 2, text: 'The icons on the Taskbar are shortcuts to your programs. Click any icon once to open it.', keys: null },
        { num: 3, text: 'When a program is open, its icon will have a small line underneath it. Click it to switch to that program.', keys: null },
        { num: 4, text: 'On the right side you will see the time, date, and small icons for Wi-Fi, sound, and battery.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'The Dock is the row of colorful icons at the very bottom of your screen.', keys: null },
        { num: 2, text: 'Click any icon once to open that program.', keys: null },
        { num: 3, text: 'When a program is open, there will be a small dot below its icon.', keys: null },
        { num: 4, text: 'At the top of your screen is the Menu Bar with the time, Wi-Fi, battery, and menus.', keys: null },
      ],
      iPhone: [
        { num: 1, text: 'Your home screen shows all your apps as small icons. Tap any icon to open it.', keys: null },
        { num: 2, text: 'At the very bottom of the home screen is a row of your most-used apps. This is called the Dock.', keys: null },
        { num: 3, text: 'Swipe up from the bottom of the screen to go back to the home screen from any app.', keys: null },
        { num: 4, text: 'Swipe down from the top-right corner to see Wi-Fi, brightness, and other quick settings.', keys: null },
      ],
      Android: [
        { num: 1, text: 'Your home screen shows your apps as small icons. Tap any icon to open it.', keys: null },
        { num: 2, text: 'At the bottom of the home screen is a row of your most-used apps.', keys: null },
        { num: 3, text: 'Tap the circle or square button at the bottom of the screen to go back to the home screen.', keys: null },
        { num: 4, text: 'Swipe down from the top of the screen to see Wi-Fi, brightness, and other quick settings.', keys: null },
      ],
    },
  },
};
