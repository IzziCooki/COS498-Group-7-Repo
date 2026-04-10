/**
 * guideRegistry.js — Visual guide data for PC Pal
 *
 * Maps task IDs to guide data with OS-specific step variants.
 * Steps use very simple language written for someone who has never used a computer.
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
        { num: 4, text: 'Click the box next to "Subject:" and type a short title for your email (like "Hello" or "Question").', keys: null },
        { num: 5, text: 'Click in the big white area below. Type your message here.', keys: null },
        { num: 6, text: 'When you are ready, click the "Send" button. It usually looks like an arrow or an airplane. Your email is sent!', keys: null },
      ],
    },
  },

  open_settings: {
    title: 'How to Open Settings',
    variants: {
      Windows: [
        { num: 1, text: 'Look at the bottom-left corner of your screen. You will see a button with a Windows logo. Click it. This is called the Start Menu.', keys: null },
        { num: 2, text: 'A menu will pop up. Look for a gear icon — that is the Settings button. Click it.', keys: null },
        { num: 3, text: 'The Settings window will open. Here you can change many things about how your computer looks and works.', keys: null },
        { num: 4, text: 'To find something specific, click the search box at the top of Settings and type what you are looking for.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'Look at the top-left corner of your screen. You will see a small Apple logo (). Click it.', keys: null },
        { num: 2, text: 'A small menu will drop down. Click "System Settings" (or "System Preferences" on older Macs).', keys: null },
        { num: 3, text: 'The Settings window will open. Here you can change many things about how your computer looks and works.', keys: null },
        { num: 4, text: 'To find something specific, click the search box at the top and type what you are looking for.', keys: null },
      ],
    },
  },

  zoom_text: {
    title: 'How to Make Text Bigger',
    variants: {
      Windows: [
        { num: 1, text: 'If you are on a web page, you can make just that page bigger. Hold down the Ctrl key and press the + (plus) key. Do it more than once to get bigger.', keys: ['Ctrl', '+'] },
        { num: 2, text: 'To make it smaller again, hold Ctrl and press the - (minus) key.', keys: ['Ctrl', '-'] },
        { num: 3, text: 'To make ALL text on your computer bigger, open the Start Menu and go to Settings (the gear icon).', keys: null },
        { num: 4, text: 'In Settings, click "System", then click "Display". Look for "Scale" and choose a bigger number like 125% or 150%.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'If you are on a web page, you can make just that page bigger. Hold down the Command key and press the + (plus) key. Do it more than once to get bigger.', keys: ['Cmd', '+'] },
        { num: 2, text: 'To make it smaller again, hold Command and press the - (minus) key.', keys: ['Cmd', '-'] },
        { num: 3, text: 'To make ALL text on your computer bigger, click the Apple logo () in the top-left corner, then click "System Settings".', keys: null },
        { num: 4, text: 'In System Settings, click "Displays". Look for "Resolution" and pick a setting labeled "Larger Text".', keys: null },
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
    },
  },

  attach_file: {
    title: 'How to Attach a File to an Email',
    variants: {
      Windows: [
        { num: 1, text: 'Open your email program and start writing a new email. Fill in the "To:" address and the "Subject:" line.', keys: null },
        { num: 2, text: 'Look for a small paperclip icon in the email toolbar. Click on it. This is the "Attach" button.', keys: null },
        { num: 3, text: 'A window will open showing your files and folders. Find the file you want to send.', keys: null },
        { num: 4, text: 'Click once on the file to select it. It will be highlighted.', keys: null },
        { num: 5, text: 'Click the "Open" or "Attach" button. The file will be added to your email. You will see its name appear.', keys: null },
        { num: 6, text: 'Finish writing your message and click Send when ready.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'Open your email program and start writing a new email. Fill in the "To:" address and the "Subject:" line.', keys: null },
        { num: 2, text: 'Look for a small paperclip icon in the email toolbar. Click on it. This is the "Attach" button.', keys: null },
        { num: 3, text: 'A window will open showing your files and folders. Find the file you want to send.', keys: null },
        { num: 4, text: 'Click once on the file to select it. It will be highlighted in blue.', keys: null },
        { num: 5, text: 'Click the "Choose File" or "Attach" button. The file will be added to your email. You will see its name appear.', keys: null },
        { num: 6, text: 'Finish writing your message and click Send when ready.', keys: null },
      ],
    },
  },

  open_browser: {
    title: 'How to Open a Web Browser',
    variants: {
      Windows: [
        { num: 1, text: 'A web browser lets you visit websites. Common browsers are Microsoft Edge (blue wave icon), Google Chrome (colorful circle icon), or Firefox (fox icon).', keys: null },
        { num: 2, text: 'Look at the bar at the very bottom of your screen. This is called the Taskbar. Look for your browser icon there. Double-click it.', keys: null },
        { num: 3, text: 'If you do not see it there, click the Start button (Windows logo, bottom-left). Type the name of your browser and press Enter.', keys: null },
        { num: 4, text: 'The browser will open. Click the long white bar at the top (the address bar) and type the website address you want to visit. Press Enter.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'A web browser lets you visit websites. Common browsers are Safari (blue compass icon), Google Chrome (colorful circle icon), or Firefox (fox icon).', keys: null },
        { num: 2, text: 'Look at the bar at the very bottom of your screen. This is called the Dock. Look for your browser icon there. Click it once.', keys: null },
        { num: 3, text: 'If you do not see it there, click the magnifying glass icon at the top-right of your screen. Type the browser name and press Enter.', keys: null },
        { num: 4, text: 'The browser will open. Click the long white bar at the top (the address bar) and type the website address you want to visit. Press Enter.', keys: null },
      ],
    },
  },

  restart_computer: {
    title: 'How to Restart Your Computer',
    variants: {
      Windows: [
        { num: 1, text: 'Save any work you have open first! Make sure your documents and emails are saved before you restart.', keys: null },
        { num: 2, text: 'Click the Windows logo button at the bottom-left corner of your screen. This opens the Start Menu.', keys: null },
        { num: 3, text: 'Look for a Power button icon (a circle with a line at the top). Click it.', keys: null },
        { num: 4, text: 'A small menu will appear with options. Click "Restart".', keys: null },
        { num: 5, text: 'Your computer will close everything and turn itself off and back on again. This usually takes about 1-2 minutes.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'Save any work you have open first! Make sure your documents and emails are saved before you restart.', keys: null },
        { num: 2, text: 'Click the Apple logo () in the very top-left corner of your screen.', keys: null },
        { num: 3, text: 'A menu will drop down. Click "Restart..." near the middle of the menu.', keys: null },
        { num: 4, text: 'A message will ask if you are sure. Click the "Restart" button to confirm.', keys: null },
        { num: 5, text: 'Your computer will close everything and turn itself off and back on again. This usually takes about 1-2 minutes.', keys: null },
      ],
    },
  },

  use_taskbar: {
    title: 'How to Use the Taskbar',
    variants: {
      Windows: [
        { num: 1, text: 'The Taskbar is the long bar that runs across the very bottom of your screen. It is always there, even when you have programs open.', keys: null },
        { num: 2, text: 'The icons on the Taskbar are shortcuts to your favorite programs. Click any icon once to open that program.', keys: null },
        { num: 3, text: 'When a program is open, its icon on the Taskbar will have a small line underneath it. Click it to switch to that program.', keys: null },
        { num: 4, text: 'To add a program to the Taskbar, open it first. Then right-click its icon on the Taskbar and choose "Pin to Taskbar".', keys: null },
        { num: 5, text: 'On the right side of the Taskbar you will see the time, date, and small icons for Wi-Fi, sound, and battery.', keys: null },
      ],
      Mac: [
        { num: 1, text: 'The Dock is the row of colorful icons at the very bottom of your screen. It is always there, even when you have programs open.', keys: null },
        { num: 2, text: 'The icons on the Dock are shortcuts to your favorite programs. Click any icon once to open that program.', keys: null },
        { num: 3, text: 'When a program is open, there will be a small dot below its icon in the Dock. Click the icon to switch to that program.', keys: null },
        { num: 4, text: 'To add a program to the Dock, open it first. Then hold Control and click its icon in the Dock. Choose "Options" then "Keep in Dock".', keys: null },
        { num: 5, text: 'At the top of your screen is the Menu Bar. It shows the time, Wi-Fi, battery, and menus for the program you are using.', keys: null },
      ],
    },
  },
};
