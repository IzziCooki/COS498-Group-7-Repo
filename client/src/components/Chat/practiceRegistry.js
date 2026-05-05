/**
 * Practice content for guided simulation sessions.
 * Each task has device-specific steps with spatial descriptions,
 * visual cues, and alternative explanations for confused users.
 */

const practiceRegistry = {
  send_email: {
    title: 'Sending an Email',
    description: 'Practice writing and sending an email to someone.',
    steps: [
      {
        instruction: 'Find and open your email app',
        whereToLook: 'Look at the bottom of your screen',
        whatItLooksLike: 'A small picture of an envelope',
        variants: {
          Windows: 'Look for "Mail" or "Outlook" in your Start menu, or the envelope icon on your taskbar at the bottom.',
          Mac: 'Look for the "Mail" app in your dock — it\'s a blue stamp-shaped icon at the bottom of your screen.',
          iPhone: 'Find the "Mail" app on your home screen — it looks like a white envelope on a blue background.',
          Android: 'Find "Gmail" — it looks like a colorful "M" shape. Check your home screen or app drawer.',
        },
        afterThis: 'You should see your inbox — a list of emails people have sent you.',
        confusedAlt: 'Imagine your email app is like a mailbox. We need to walk to the mailbox first. Look at ALL the small pictures at the bottom of your screen — do you see anything that looks like a letter or envelope?',
      },
      {
        instruction: 'Start a new email',
        whereToLook: 'Look in the top-left area of your email app',
        whatItLooksLike: 'A button that says "New", "Compose", or shows a pencil icon',
        variants: {
          Windows: 'Click the "+ New mail" button in the top-left corner.',
          Mac: 'Click the pencil-and-paper icon in the toolbar, or press Cmd+N.',
          iPhone: 'Tap the pencil icon in the bottom-right corner of your screen.',
          Android: 'Tap the colorful "+" or "Compose" button in the bottom-right corner.',
        },
        afterThis: 'A blank email form appears with spaces for "To", "Subject", and your message.',
        confusedAlt: 'Think of it like getting a blank piece of paper to write a letter. We need to find the button that gives us that blank paper. It usually has a pencil picture or says "New."',
      },
      {
        instruction: 'Type who you want to send it to',
        whereToLook: 'The very first line at the top, labeled "To"',
        whatItLooksLike: 'A text box where you type an email address',
        variants: {
          Windows: 'Click in the "To" field and type the email address (like tom@email.com).',
          Mac: 'Click in the "To" field and type the email address.',
          iPhone: 'Tap the "To" field and type the email address. Your phone may suggest contacts.',
          Android: 'Tap the "To" field and type the email address. Gmail may suggest people you know.',
        },
        afterThis: 'The email address appears in the "To" field. You might see the person\'s name pop up if they\'re in your contacts.',
        confusedAlt: 'This is like writing the address on an envelope. You need to type the exact email address of the person — it always has an @ sign in the middle, like name@gmail.com.',
      },
      {
        instruction: 'Write a subject and your message',
        whereToLook: 'Below the "To" line, you\'ll see "Subject", and below that a big empty area',
        whatItLooksLike: 'Two text areas — a short one for the subject and a big one for your message',
        variants: {
          Windows: 'Click "Subject" and type what your email is about (like "Hello!"). Then click the big area below and type your message.',
          Mac: 'Click the "Subject" field, type a short title. Then click the big white area below and write your message.',
          iPhone: 'Tap "Subject" and type a short title. Tap the big area below to type your message.',
          Android: 'Tap "Subject" for a title, then tap "Compose email" area below to write your message.',
        },
        afterThis: 'You can see your subject line and message text. Take your time — there\'s no rush.',
        confusedAlt: 'The subject is like the title of your letter — just a few words about what it\'s about ("Hi from Margaret" is perfect). The big area below is where you write your actual message, just like writing on paper.',
      },
      {
        instruction: 'Send your email',
        whereToLook: 'Look for a Send button — usually at the top',
        whatItLooksLike: 'A button with an arrow pointing right, or the word "Send"',
        variants: {
          Windows: 'Click the "Send" button at the top of your email. It might have an arrow icon.',
          Mac: 'Click the paper airplane icon in the top-left of the email window, or press Cmd+Shift+D.',
          iPhone: 'Tap the blue arrow pointing up in the top-right corner.',
          Android: 'Tap the paper airplane icon in the top-right corner.',
        },
        afterThis: 'Your email is sent! It disappears from your screen and goes to the other person. You can\'t unsend it, but that\'s OK.',
        confusedAlt: 'This is like putting your letter in the mailbox and raising the flag. Once you find the Send button (it usually looks like an arrow or paper airplane) and tap it, your email flies to the other person instantly!',
      },
    ],
  },

  copy_paste: {
    title: 'Copy and Paste',
    description: 'Practice copying text from one place and pasting it somewhere else.',
    steps: [
      {
        instruction: 'Select the text you want to copy',
        whereToLook: 'The text you want to copy — it could be anywhere on screen',
        whatItLooksLike: 'Text that turns blue/highlighted when selected',
        variants: {
          Windows: 'Click at the start of the text, hold the mouse button, drag to the end, then let go. The text turns blue.',
          Mac: 'Click at the start of the text, hold the mouse button, drag to the end, then let go. The text turns blue.',
          iPhone: 'Press and hold on a word. Blue handles appear — drag them to select more text.',
          Android: 'Press and hold on a word. Blue handles appear — drag them to select the text you want.',
        },
        afterThis: 'The text you want is highlighted in blue. This means it\'s selected and ready to copy.',
        confusedAlt: 'Imagine you\'re using a highlighter pen on paper. You\'re "painting" over the words you want to copy. Click where you want to start, hold the button down, and drag across the words.',
      },
      {
        instruction: 'Copy the selected text',
        whereToLook: 'Your keyboard',
        whatItLooksLike: 'You\'ll press two keys at the same time',
        variants: {
          Windows: 'Hold down Ctrl (bottom-left of keyboard) and press C. Nothing visible happens — that\'s normal!',
          Mac: 'Hold down Cmd (⌘, next to spacebar) and press C. Nothing visible happens — that\'s normal!',
          iPhone: 'Tap "Copy" in the menu that appeared above your selected text.',
          Android: 'Tap "Copy" in the menu that appeared at the top of your screen.',
        },
        afterThis: 'The text is now copied to your clipboard — an invisible notepad that holds it until you paste. Nothing changes on screen, and that\'s OK!',
        confusedAlt: 'Think of it like a photocopier for words. You pressed the copy button, and now your computer has a copy of those words saved in its memory. You can\'t see it, but it\'s there, ready to paste.',
      },
      {
        instruction: 'Go to where you want to paste',
        whereToLook: 'The place where you want to put the copied text',
        whatItLooksLike: 'Any text area — an email, a document, a search box',
        variants: {
          Windows: 'Click in the place where you want the text to go. You should see a blinking cursor (a thin line).',
          Mac: 'Click where you want the text to go. Look for the blinking cursor.',
          iPhone: 'Tap in the text field where you want to paste.',
          Android: 'Tap in the text field where you want to paste.',
        },
        afterThis: 'You see a blinking line (cursor) where your text will appear.',
        confusedAlt: 'You need to tell your computer WHERE to put the copied text. Click in the spot — like putting your finger on the page where you want to paste a sticker.',
      },
      {
        instruction: 'Paste the text',
        whereToLook: 'Your keyboard again',
        whatItLooksLike: 'Press two keys at the same time',
        variants: {
          Windows: 'Hold down Ctrl and press V. Your copied text appears!',
          Mac: 'Hold down Cmd (⌘) and press V. Your copied text appears!',
          iPhone: 'Tap and hold, then tap "Paste" from the menu.',
          Android: 'Tap and hold in the text field, then tap "Paste."',
        },
        afterThis: 'The text you copied earlier now appears where your cursor was. You did it!',
        confusedAlt: 'Remember the photocopier? Now you\'re taking that copy and placing it down. Ctrl+V (or Cmd+V on Mac) is the "paste" command — it puts down whatever you copied earlier.',
      },
    ],
  },

  open_browser: {
    title: 'Opening a Web Browser',
    description: 'Practice finding and opening a web browser to visit websites.',
    steps: [
      {
        instruction: 'Find your web browser',
        whereToLook: 'Look at the bottom of your screen (taskbar/dock)',
        whatItLooksLike: 'A colorful circle or compass icon',
        variants: {
          Windows: 'Look for Microsoft Edge (blue swirl) or Google Chrome (colorful circle) on your taskbar at the bottom.',
          Mac: 'Look for Safari (blue compass) in your dock at the bottom, or Chrome (colorful circle).',
          iPhone: 'Find Safari on your home screen — a blue compass icon.',
          Android: 'Find Chrome — a colorful circle icon. It might be on your home screen or in your app drawer.',
        },
        afterThis: 'The browser opens and shows either a blank page or your home page.',
        confusedAlt: 'A web browser is the app that lets you visit websites — it\'s like a door to the internet. It\'s one of the most common apps on your device. Look for a colorful circle or compass shape.',
      },
      {
        instruction: 'Find the address bar',
        whereToLook: 'The very top of the browser window',
        whatItLooksLike: 'A long white box that might say "Search or type a web address"',
        variants: {
          Windows: 'Click the long white bar at the top. It might show a web address or say "Search."',
          Mac: 'Click the long bar at the top of the Safari/Chrome window.',
          iPhone: 'Tap the bar at the bottom of the screen (Safari) or top (Chrome).',
          Android: 'Tap the bar at the top of Chrome.',
        },
        afterThis: 'The address bar is highlighted and ready for you to type.',
        confusedAlt: 'The address bar is like the address line on a letter — you type WHERE you want to go. It\'s always at the very top (or bottom on iPhone) of the browser.',
      },
      {
        instruction: 'Type a website address and go',
        whereToLook: 'The address bar you just clicked',
        whatItLooksLike: 'Type a web address like google.com',
        variants: {
          Windows: 'Type google.com and press Enter on your keyboard.',
          Mac: 'Type google.com and press Return on your keyboard.',
          iPhone: 'Type google.com and tap "Go" on your keyboard.',
          Android: 'Type google.com and tap the arrow or "Go" button.',
        },
        afterThis: 'The Google search page appears! You can now search for anything.',
        confusedAlt: 'Just type the website name — you don\'t need to type "www" or "https." Just google.com is enough. Then press the big Enter/Return key on your keyboard to go there.',
      },
    ],
  },

  wifi: {
    title: 'Connecting to Wi-Fi',
    description: 'Practice finding a Wi-Fi network and connecting to the internet.',
    steps: [
      {
        instruction: 'Open your settings',
        whereToLook: 'Look at the bottom-right of your screen (or your home screen on a phone)',
        whatItLooksLike: 'A gear icon or a small set of sliders',
        variants: {
          Windows: 'Click the Wi-Fi icon (small curved lines) in the bottom-right corner of your screen, next to the clock.',
          Mac: 'Click the Wi-Fi icon (small curved lines) in the top-right corner of your screen, in the menu bar.',
          iPhone: 'Open the "Settings" app on your home screen — it looks like a gray gear.',
          Android: 'Open the "Settings" app on your home screen — it looks like a small gear. You can also swipe down from the top of your screen.',
        },
        afterThis: 'You should see a menu or a list of settings. We are looking for the Wi-Fi section.',
        confusedAlt: 'Think of settings like the control panel on a washing machine — it is where you change how your device works. Look for a small picture of a gear (the round thing with teeth around it).',
      },
      {
        instruction: 'Find the Wi-Fi section',
        whereToLook: 'Near the top of your settings list or in the menu that appeared',
        whatItLooksLike: 'The word "Wi-Fi" or "Network" next to a small picture of curved lines',
        variants: {
          Windows: 'In the menu that appeared, make sure Wi-Fi is turned on (the switch should be blue or highlighted). You will see a list of networks below.',
          Mac: 'In the dropdown menu, make sure Wi-Fi is turned on. You will see a list of available networks below.',
          iPhone: 'Tap "Wi-Fi" near the top of the Settings list. Make sure the switch next to Wi-Fi is green (on).',
          Android: 'Tap "Network & internet" or "Connections," then tap "Wi-Fi." Make sure the switch is turned on.',
        },
        afterThis: 'You should see a list of Wi-Fi network names. These are the internet connections near you.',
        confusedAlt: 'Wi-Fi is the invisible signal that gives your device internet, like a radio station your device tunes into. We need to find the list of available signals near you.',
      },
      {
        instruction: 'Pick your Wi-Fi network from the list',
        whereToLook: 'In the list of network names that appeared',
        whatItLooksLike: 'A list of names — look for your home network name or the one you were told to use',
        variants: {
          Windows: 'Click on the name of the network you want to join. Then click "Connect." Check "Connect automatically" if you want it to remember this network.',
          Mac: 'Click on the name of the network you want to join from the dropdown list.',
          iPhone: 'Tap the name of the network you want to join from the list.',
          Android: 'Tap the name of the network you want to join from the list.',
        },
        afterThis: 'A box appears asking you for the Wi-Fi password.',
        confusedAlt: 'The network name is like the name of a radio station. It is usually the name your internet company gave you, or something you chose yourself. It might be on a sticker on your internet box (router) at home.',
      },
      {
        instruction: 'Type the Wi-Fi password and connect',
        whereToLook: 'The password box that appeared on screen',
        whatItLooksLike: 'A text box where you type the password, and a button that says "Connect" or "Join"',
        variants: {
          Windows: 'Type the Wi-Fi password in the box and click "Next." The password is case-sensitive — capital letters matter.',
          Mac: 'Type the Wi-Fi password in the box and click "Join."',
          iPhone: 'Type the Wi-Fi password and tap "Join" in the top-right corner.',
          Android: 'Type the Wi-Fi password and tap "Connect."',
        },
        afterThis: 'Your device connects to the internet! You should see the Wi-Fi icon (curved lines) appear at the top of your screen. The network name will show "Connected."',
        confusedAlt: 'The Wi-Fi password is like a key to a locked door. You need the right password to get in. Check the sticker on the bottom of your internet box (router) at home — the password is usually printed there. Capital and lowercase letters matter, so type carefully.',
      },
    ],
  },

  video_call: {
    title: 'Joining a Video Call',
    description: 'Practice opening a video call app and joining a meeting.',
    steps: [
      {
        instruction: 'Open your video call app',
        whereToLook: 'Look on your home screen, taskbar, or dock at the bottom of your screen',
        whatItLooksLike: 'A small picture of a video camera — it might be blue (Zoom), purple (Teams), or green (FaceTime)',
        variants: {
          Windows: 'Look for Zoom (blue camera icon) or Microsoft Teams (purple icon) on your taskbar at the bottom, or search for it in the Start menu.',
          Mac: 'Look for Zoom (blue camera icon), FaceTime (green camera icon), or Teams in your dock at the bottom of your screen.',
          iPhone: 'Find FaceTime (green camera icon) or Zoom (blue camera icon) on your home screen.',
          Android: 'Find Google Meet (colorful camera icon) or Zoom (blue camera icon) on your home screen or in your app drawer.',
        },
        afterThis: 'The video call app opens. You should see options to start or join a meeting.',
        confusedAlt: 'A video call app is like a video telephone — it lets you see and talk to people on your screen. Look for a small picture that looks like a video camera.',
      },
      {
        instruction: 'Find the button to join a meeting',
        whereToLook: 'Look in the middle or top area of the app',
        whatItLooksLike: 'A button that says "Join" or "Join a Meeting," or a place to type a meeting link or code',
        variants: {
          Windows: 'Click "Join a Meeting" or "Join." If someone sent you a link, you can click that link instead — it will open the app for you.',
          Mac: 'Click "Join a Meeting" or "Join." You can also click a meeting link someone sent you in an email or message.',
          iPhone: 'Tap "Join" or tap the meeting link someone sent you. The link usually starts with "zoom.us" or "meet.google.com."',
          Android: 'Tap "Join a Meeting" or tap the meeting link someone sent you in a message or email.',
        },
        afterThis: 'You see a screen where you can type in a meeting code, or the meeting starts loading if you used a link.',
        confusedAlt: 'Someone probably sent you a meeting link — it looks like a website address in a message or email. If you tap or click that link, it will take you right to the meeting, like clicking a doorbell to enter someone\'s house.',
      },
      {
        instruction: 'Check your camera and microphone',
        whereToLook: 'Look at the bottom of the video call screen',
        whatItLooksLike: 'Small pictures of a camera and a microphone — they should not have a line through them',
        variants: {
          Windows: 'Before joining, you should see a preview of yourself. Make sure the camera icon and microphone icon at the bottom do not have a red line through them. Click them to turn on or off.',
          Mac: 'Check the preview of your face. If the camera or microphone icons at the bottom have a line through them, click them to turn them on.',
          iPhone: 'You should see yourself on screen. Make sure the camera and microphone buttons are not crossed out. Tap them to toggle on or off.',
          Android: 'You should see yourself on screen. Make sure the camera and microphone buttons at the bottom are not crossed out. Tap to turn them on.',
        },
        afterThis: 'You can see your own face on screen and the microphone is on. You are ready to join.',
        confusedAlt: 'Before you walk into the meeting room, check two things: can people see you (camera is on) and can people hear you (microphone is on). If either icon has a line through it, tap it to turn it back on. Think of it like making sure the lights and phone are working before a call.',
      },
      {
        instruction: 'Join the call',
        whereToLook: 'Look for a big green or blue button at the bottom or center of the screen',
        whatItLooksLike: 'A large button that says "Join," "Join Meeting," or "Join with Video"',
        variants: {
          Windows: 'Click the "Join" or "Join with Video" button. You may need to wait a moment for the host to let you in.',
          Mac: 'Click "Join" or "Join Meeting." The host may need to admit you — you will see a "Waiting for host" message.',
          iPhone: 'Tap "Join" or "Join Meeting." Wait a moment — you may see "Waiting for the host to let you in."',
          Android: 'Tap "Join" or "Join Meeting." The host may need to admit you, so wait patiently.',
        },
        afterThis: 'You are in the meeting! You can see and hear the other people. Your face appears in a small box on screen.',
        confusedAlt: 'This is like knocking on the door and walking into the room. Just press the big Join button. Sometimes the person running the meeting has to "open the door" for you, so if you see a waiting message, just be patient — they will let you in.',
      },
    ],
  },

  take_screenshot: {
    title: 'Taking a Screenshot',
    description: 'Practice capturing a picture of what is on your screen right now.',
    steps: [
      {
        instruction: 'Find the right keys or buttons',
        whereToLook: 'Look at the top-right area of your keyboard (or use your phone buttons)',
        whatItLooksLike: 'A key that says "PrtScn" or "Print Screen" — or on a phone, the side buttons',
        variants: {
          Windows: 'Find the "PrtScn" (Print Screen) key on the top-right area of your keyboard. On some keyboards it says "PrtSc" or "Print."',
          Mac: 'You will press three keys at the same time: Shift, Command, and the number 3. Find them first — Shift is the big arrow key on the left, Command has a clover shape, and 3 is on the top row.',
          iPhone: 'Find the side button (on the right side of your phone) and the volume up button (on the left side).',
          Android: 'Find the power button (usually on the right side of your phone) and the volume down button (on the left side or same side).',
        },
        afterThis: 'You know where the right buttons are. Now we will press them.',
        confusedAlt: 'A screenshot is like taking a photograph of your screen — whatever you see right now gets saved as a picture. First, we need to find the right buttons, like finding the shutter button on a camera before you take a photo.',
      },
      {
        instruction: 'Press the buttons to take the screenshot',
        whereToLook: 'Your keyboard or phone buttons',
        whatItLooksLike: 'The screen may flash or you may hear a camera sound',
        variants: {
          Windows: 'Hold the Windows key (bottom-left of keyboard, has the Windows logo) and press PrtScn at the same time. Your screen will flash briefly.',
          Mac: 'Press Shift + Command + 3 all at the same time. You will see a small thumbnail appear in the bottom-right corner of your screen.',
          iPhone: 'Press the side button and the volume up button at the same time, then quickly let go. The screen will flash white.',
          Android: 'Press the power button and volume down button at the same time for about one second, then let go. The screen will flash.',
        },
        afterThis: 'The screen flashes or you hear a sound. A small preview of your screenshot may appear briefly in the corner. Your picture has been saved!',
        confusedAlt: 'Press both buttons at the exact same time, just for a moment, then let go. It is like pressing the button on a camera — quick and done. If the screen flashes, it worked! If nothing happens, try again and make sure you press both buttons at the very same moment.',
      },
      {
        instruction: 'Find where your screenshot was saved',
        whereToLook: 'Look in your Pictures folder or your Photos app',
        whatItLooksLike: 'A folder called "Screenshots" or a new picture at the top of your photo list',
        variants: {
          Windows: 'Open your "Pictures" folder (in File Explorer), then open the "Screenshots" folder inside it. Your picture is there.',
          Mac: 'Look on your Desktop — the screenshot is saved there as a file. It has the date and time in its name.',
          iPhone: 'Open the "Photos" app. Your screenshot is the most recent picture. You can also check the "Screenshots" album.',
          Android: 'Open the "Photos" or "Gallery" app. Your screenshot is at the top of your recent photos, or in a "Screenshots" folder.',
        },
        afterThis: 'You can see the screenshot you just took! It is a picture of exactly what was on your screen.',
        confusedAlt: 'Your device saved the picture of your screen automatically — like a camera that puts photos into an album for you. We just need to find that album. On a computer, it goes to your Pictures folder. On a phone, it goes to your Photos app.',
      },
    ],
  },

  print_document: {
    title: 'Printing a Document',
    description: 'Practice sending a document from your screen to a printer on paper.',
    steps: [
      {
        instruction: 'Open the document you want to print',
        whereToLook: 'Look in your files, email, or wherever the document is',
        whatItLooksLike: 'The document open on your screen — you should see the text or picture you want to print',
        variants: {
          Windows: 'Find the file on your computer and double-click it to open it. It might be on your Desktop, in Documents, or in an email attachment.',
          Mac: 'Find the file and double-click it to open it. Check your Desktop, Documents folder, or Downloads.',
          iPhone: 'Open the document in whatever app it is in — it might be in Mail, Files, or a message someone sent you.',
          Android: 'Open the document from your email, Files app, or Google Drive — wherever it was sent or saved.',
        },
        afterThis: 'The document is open on your screen and you can see what you want to print.',
        confusedAlt: 'Before we can print, we need to see the document on screen first — like laying a piece of paper on a photocopier before pressing the copy button. Find your document and open it so you can see it.',
      },
      {
        instruction: 'Find the print option',
        whereToLook: 'Look at the top-left of your screen or in the menu',
        whatItLooksLike: 'The word "Print" or a small picture of a printer',
        variants: {
          Windows: 'Click "File" in the top-left corner of the window, then click "Print" from the list. Or press Ctrl and P at the same time.',
          Mac: 'Click "File" in the top-left corner of the screen, then click "Print." Or press Command and P at the same time.',
          iPhone: 'Tap the share button (a small box with an arrow pointing up), then scroll down and tap "Print."',
          Android: 'Tap the three dots in the top-right corner of the app, then tap "Print" or "Share" and then "Print."',
        },
        afterThis: 'A print window appears with options for choosing your printer and how many copies you want.',
        confusedAlt: 'Every app has a way to print, but it is usually hidden in the "File" menu. Think of the File menu like a filing cabinet drawer — Print is one of the things inside. Click the word "File" at the very top-left of your screen and look for "Print" in the list that drops down.',
      },
      {
        instruction: 'Choose your printer',
        whereToLook: 'Near the top of the print window that just appeared',
        whatItLooksLike: 'A dropdown box showing a printer name, or a list of available printers',
        variants: {
          Windows: 'Click the dropdown under "Printer" and select your printer from the list. If your printer is on and connected, it should appear here.',
          Mac: 'Click the dropdown next to "Printer" and select your printer. If you do not see it, make sure the printer is turned on.',
          iPhone: 'Tap "Printer" or "Select Printer" and choose your printer from the list. Your phone finds printers on the same Wi-Fi network.',
          Android: 'Tap the dropdown at the top of the print screen and select your printer. Make sure the printer is turned on and connected to Wi-Fi.',
        },
        afterThis: 'Your printer name is now selected and shown in the print window. You can also see a preview of what will be printed.',
        confusedAlt: 'If you have more than one printer, you need to tell your device which one to send the paper to — like choosing which mailbox to drop a letter in. Pick the name you recognize. If you only have one printer, it might already be selected for you.',
      },
      {
        instruction: 'Press the Print button',
        whereToLook: 'Look at the bottom-right of the print window',
        whatItLooksLike: 'A button that says "Print"',
        variants: {
          Windows: 'Click the "Print" button at the bottom of the print window. Your printer should start making noise within a few seconds.',
          Mac: 'Click the "Print" button at the bottom-right of the print window.',
          iPhone: 'Tap "Print" in the top-right corner of the screen.',
          Android: 'Tap the round print button (it looks like a small printer picture) or the word "Print."',
        },
        afterThis: 'Your printer wakes up, makes some noise, and prints your document on paper! It might take a few seconds to start.',
        confusedAlt: 'This is the final step — like pressing the big green "Go" button on a photocopier. Once you tap Print, your document travels from your screen to the printer and comes out on paper. If the printer does not start, make sure it is turned on and has paper in it.',
      },
    ],
  },

  change_text_size: {
    title: 'Making Text Bigger',
    description: 'Practice changing your screen so text and images are bigger and easier to read.',
    steps: [
      {
        instruction: 'Open your settings',
        whereToLook: 'Look at the bottom-left of your screen (or your home screen on a phone)',
        whatItLooksLike: 'A gear icon — a small circle with teeth around it',
        variants: {
          Windows: 'Click the Start button (Windows logo) in the bottom-left corner, then click the gear icon to open Settings.',
          Mac: 'Click the Apple logo in the very top-left corner of your screen, then click "System Settings."',
          iPhone: 'Find the "Settings" app on your home screen — it looks like a gray gear.',
          Android: 'Find the "Settings" app on your home screen or app drawer — it looks like a gear.',
        },
        afterThis: 'The Settings window or app opens. You see a list of things you can change about your device.',
        confusedAlt: 'Settings is like the control room for your device — it is where you go to change how things look and work. The gear picture (a circle with little teeth sticking out, like a wheel inside a clock) is the door to that control room.',
      },
      {
        instruction: 'Find the Display or Accessibility section',
        whereToLook: 'Look through the list in your settings — it is usually near the top',
        whatItLooksLike: 'The word "Display," "Accessibility," or a small picture of a screen or a person',
        variants: {
          Windows: 'Click "Accessibility" on the left side of the Settings window, then click "Text size."',
          Mac: 'Click "Accessibility" in the left sidebar, then click "Display" on the right side.',
          iPhone: 'Scroll down and tap "Display & Brightness." For even more options, go back and tap "Accessibility" then "Display & Text Size."',
          Android: 'Tap "Display" to find text size. Or tap "Accessibility" for more options.',
        },
        afterThis: 'You see options for changing how your screen looks, including text size.',
        confusedAlt: 'We are looking for the section that controls how things LOOK on your screen. It is like finding the brightness knob on a TV. Look for the word "Display" (that means screen) or "Accessibility" (that means making things easier to use).',
      },
      {
        instruction: 'Move the text size slider to make text bigger',
        whereToLook: 'Look for a slider bar in the middle of the screen',
        whatItLooksLike: 'A bar with a small dot or handle you can drag — sliding it to the right makes text bigger',
        variants: {
          Windows: 'Drag the "Text size" slider to the right to make text bigger. You will see a preview that changes as you drag. Click "Apply" when you are happy with the size.',
          Mac: 'Look for "Text size" or "Text" and use the dropdown or slider to choose a larger size. Changes may apply right away.',
          iPhone: 'Drag the slider at the bottom of the screen to the right. The preview text above gets bigger so you can see the change. The word "Larger" is on the right side.',
          Android: 'Tap "Font size" or "Display size" and drag the slider to the right to make everything bigger. A preview shows you how it will look.',
        },
        afterThis: 'Text on your screen is now bigger and easier to read! Everything adjusts to the new size. If it is too big or too small, come back here and move the slider again.',
        confusedAlt: 'A slider is like a dimmer switch for a light — you slide it one way or the other to change something. Slide it to the RIGHT to make text bigger, or to the LEFT to make it smaller. You can try different positions until the text feels comfortable to read, like adjusting a magnifying glass.',
      },
    ],
  },
};

export default practiceRegistry;
