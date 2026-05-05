/**
 * Practice content for guided simulation sessions.
 * Each task has device-specific steps with spatial descriptions,
 * visual cues, and alternative explanations for confused users.
 *
 * Steps that include a `screen` field trigger interactive simulation mode:
 *   screen: {
 *     url: '/ui-references/...',        // illustrated screenshot path
 *     hotspot: { xPercent, yPercent }    // where the user should click/tap
 *   }
 * Steps without `screen` use the text-only fallback view.
 */

const practiceRegistry = {
  send_email: {
    title: 'Sending an Email',
    description: 'Practice writing and sending an email to someone.',
    steps: [
      {
        instruction: 'Open your internet browser',
        whereToLook: 'Look at the bottom of your screen for the browser icon',
        whatItLooksLike: 'A colorful circle (Chrome) or blue swirl (Edge) on the laptop screen',
        image: { url: '/ui-references/email/gmail-illustrated-step-1.png', altText: 'A laptop screen showing the Chrome browser icon' },
        screen: {
          url: '/ui-references/email/gmail-illustrated-step-1.png',
          hotspot: { xPercent: 55, yPercent: 40 },
        },
        variants: {
          Windows: 'Look for Google Chrome (colorful circle) or Microsoft Edge (blue swirl) on your taskbar at the bottom of the screen. Double-click to open it.',
          Mac: 'Look for Safari (blue compass) or Chrome (colorful circle) in your dock at the bottom of your screen.',
          iPhone: 'Find Safari on your home screen — a blue compass icon.',
          Android: 'Find Chrome — a colorful circle icon on your home screen.',
        },
        afterThis: 'Your web browser opens with a blank page or your home page.',
        confusedAlt: 'We need to open the internet first before we can get to email. Look for a small colorful circle picture near the bottom of your screen — that is Google Chrome, the internet browser. Double-click it to open.',
      },
      {
        instruction: 'Type gmail.com in the address bar and press Enter',
        whereToLook: 'The long white box at the very top of the browser window',
        whatItLooksLike: 'A text bar at the top that says "Search or type a web address"',
        image: { url: '/ui-references/email/gmail-illustrated-step-2.png', altText: 'Browser address bar with gmail.com typed in' },
        screen: {
          url: '/ui-references/email/gmail-illustrated-step-2.png',
          hotspot: { xPercent: 48, yPercent: 22 },
        },
        variants: {
          Windows: 'Click the address bar at the top of the browser, type gmail.com, and press Enter.',
          Mac: 'Click the address bar at the top of Safari or Chrome, type gmail.com, and press Return.',
          iPhone: 'Tap the address bar at the bottom of Safari, type gmail.com, and tap Go.',
          Android: 'Tap the address bar at the top of Chrome, type gmail.com, and tap Go or press Enter.',
        },
        afterThis: 'The Gmail website loads and you see the Gmail sign-in page or your inbox.',
        confusedAlt: 'The address bar is the long white box at the very top of the browser — it is like typing an address to tell the browser where to go. Click on it, type the letters g-m-a-i-l-.-c-o-m, then press the Enter key on your keyboard.',
      },
      {
        instruction: 'Sign in to your Gmail account',
        whereToLook: 'The middle of the screen where it says "Sign in"',
        whatItLooksLike: 'A blue "Sign in" button and a place to type your email address',
        image: { url: '/ui-references/email/gmail-illustrated-step-3.png', altText: 'Gmail sign-in page with email field and Sign In button' },
        screen: {
          url: '/ui-references/email/gmail-illustrated-step-3.png',
          hotspot: { xPercent: 52, yPercent: 55 },
        },
        variants: {
          Windows: 'Type your Gmail email address, click Next, then type your password and click Next again.',
          Mac: 'Type your Gmail email address, click Next, then type your password and click Next again.',
          iPhone: 'Type your email address and tap Next, then type your password and tap Next.',
          Android: 'Type your email address and tap Next, then type your password and tap Next.',
        },
        afterThis: 'You are signed in and can see your Gmail inbox with a list of emails.',
        confusedAlt: 'This is like showing your ID to get into a building. Type your email address (the one that ends in @gmail.com) and your password. If you do not remember your password, look for a "Forgot password?" link.',
      },
      {
        instruction: 'Click Compose to start a new email',
        whereToLook: 'The top-left area of the Gmail screen',
        whatItLooksLike: 'A button that says "Compose" with a pencil or "+" icon',
        image: { url: '/ui-references/email/gmail-illustrated-step-4.png', altText: 'The Compose button in Gmail' },
        screen: {
          url: '/ui-references/email/gmail-illustrated-step-4.png',
          hotspot: { xPercent: 28, yPercent: 22 },
        },
        variants: {
          Windows: 'Click the "Compose" button in the top-left area of Gmail. It may have a "+" icon next to it.',
          Mac: 'Click the "Compose" button in the top-left area of Gmail.',
          iPhone: 'Tap the pencil icon or "Compose" button in the bottom-right corner.',
          Android: 'Tap the colorful "Compose" button in the bottom-right corner.',
        },
        afterThis: 'A blank email form appears at the bottom-right of the screen with spaces for "To", "Subject", and your message.',
        confusedAlt: 'Think of it like getting a blank piece of paper to write a letter. We need to find the button that gives us that blank paper. It says "Compose" and is usually in the top-left corner of Gmail.',
      },
      {
        instruction: 'Fill in the email address, subject, and message',
        whereToLook: 'The new email form that appeared — look for "To", "Subject", and the big message area',
        whatItLooksLike: 'Text boxes where you type the recipient address, a subject line, and your message',
        image: { url: '/ui-references/email/gmail-illustrated-step-5.png', altText: 'Gmail compose form with To, Subject, and message fields' },
        screen: {
          url: '/ui-references/email/gmail-illustrated-step-5.png',
          hotspot: { xPercent: 45, yPercent: 30 },
        },
        variants: {
          Windows: 'Click "To" and type the email address. Click "Subject" and type what the email is about. Click the big area below and type your message.',
          Mac: 'Click "To" and type the email address. Click "Subject" and type a title. Click the big area below to write your message.',
          iPhone: 'Tap "To" and type the email address. Tap "Subject" for a title. Tap the body area to type your message.',
          Android: 'Tap "To" and type the email address. Tap "Subject" for a title. Tap "Compose email" to write your message.',
        },
        afterThis: 'You can see the recipient, subject, and your message all filled in. Take your time — there is no rush.',
        confusedAlt: 'There are three things to fill in: (1) "To" is where you type the person\'s email address, like tom@gmail.com. (2) "Subject" is a short title for your email. (3) The big white area is where you write your actual message, just like writing on paper.',
      },
      {
        instruction: 'Review your email and click Send',
        whereToLook: 'Look at the bottom-left of the email form',
        whatItLooksLike: 'A blue button that says "Send"',
        image: { url: '/ui-references/email/gmail-illustrated-step-6.png', altText: 'The Send button at the bottom of the compose form' },
        screen: {
          url: '/ui-references/email/gmail-illustrated-step-6.png',
          hotspot: { xPercent: 37, yPercent: 55 },
        },
        variants: {
          Windows: 'Double-check the email address and your message, then click the blue "Send" button at the bottom-left of the form.',
          Mac: 'Double-check everything looks right, then click the blue "Send" button.',
          iPhone: 'Review your email, then tap the blue send arrow in the top-right corner.',
          Android: 'Review your email, then tap the paper airplane icon in the top-right corner.',
        },
        afterThis: 'Your email is sent! The compose form closes and you see a brief "Message sent" confirmation.',
        confusedAlt: 'This is like putting your letter in the mailbox. Once you click the blue "Send" button, your email goes to the other person. Look for a blue button at the bottom of the email form.',
      },
      {
        instruction: 'Your email has been sent!',
        whereToLook: 'You should see a message at the bottom of the screen confirming it was sent',
        whatItLooksLike: 'A small notification that says "Message sent" with an "Undo" option',
        image: { url: '/ui-references/email/gmail-illustrated-step-7.png', altText: 'Confirmation that the email has been sent with an Undo option' },
        screen: {
          url: '/ui-references/email/gmail-illustrated-step-7.png',
          hotspot: { xPercent: 50, yPercent: 48 },
        },
        variants: {
          Windows: 'You will see "Message sent" at the bottom-left. If you made a mistake, quickly click "Undo" to get your email back.',
          Mac: 'You will see "Message sent" at the bottom-left. Click "Undo" quickly if you need to change something.',
          iPhone: 'You will see a confirmation. If you need to undo, shake your phone or look for an Undo option.',
          Android: 'You will see "Sent" confirmation. Look for an "Undo" option at the bottom if you need to take it back.',
        },
        afterThis: 'Congratulations! Your email has been delivered. The other person will see it in their inbox.',
        confusedAlt: 'You did it! Your email has been sent successfully. If you see an "Undo" button at the bottom, you can click it within a few seconds if you made a mistake. Otherwise, your email is on its way to the other person.',
      },
    ],
  },

  wifi: {
    title: 'Connecting to Wi-Fi',
    description: 'Practice finding a Wi-Fi network and connecting to the internet.',
    steps: [
      {
        instruction: 'Click the Wi-Fi icon in the taskbar',
        whereToLook: 'Look at the very bottom-right corner of your screen, near the clock',
        whatItLooksLike: 'A small picture of curved lines (like sound waves) or a small globe icon',
        image: { url: '/ui-references/system-windows/windows-wifi-icon.png', altText: 'The Wi-Fi icon in the taskbar' },
        screen: {
          url: '/ui-references/system-windows/windows-wifi-illustrated-step-1.png',
          hotspot: { xPercent: 85, yPercent: 92 },
        },
        variants: {
          Windows: 'Click the Wi-Fi icon (small curved lines) in the bottom-right corner of your screen, next to the clock.',
          Mac: 'Click the Wi-Fi icon (small curved lines) in the top-right corner of your screen, in the menu bar.',
          iPhone: 'Open the "Settings" app on your home screen — it looks like a gray gear.',
          Android: 'Open the "Settings" app on your home screen — it looks like a small gear. You can also swipe down from the top of your screen.',
        },
        afterThis: 'A menu appears showing your network connection options.',
        confusedAlt: 'Look at the very bottom-right corner of your screen where the clock is. You should see several small icons. One of them looks like curved lines stacked on top of each other (like radio waves). Click on it.',
      },
      {
        instruction: 'See the available Wi-Fi networks',
        whereToLook: 'The panel that appeared — look for a list of network names',
        whatItLooksLike: 'A list of Wi-Fi network names with signal strength bars next to each one',
        image: { url: '/ui-references/system-windows/windows-wifi-illustrated-step-2.png', altText: 'Wi-Fi settings showing available networks' },
        screen: {
          url: '/ui-references/system-windows/windows-wifi-illustrated-step-2.png',
          hotspot: { xPercent: 85, yPercent: 50 },
        },
        variants: {
          Windows: 'In the menu that appeared, make sure Wi-Fi is turned on (the switch should be blue or highlighted). You will see a list of networks below.',
          Mac: 'In the dropdown menu, make sure Wi-Fi is turned on. You will see a list of available networks below.',
          iPhone: 'Tap "Wi-Fi" near the top of the Settings list. Make sure the switch next to Wi-Fi is green (on).',
          Android: 'Tap "Network & internet" or "Connections," then tap "Wi-Fi." Make sure the switch is turned on.',
        },
        afterThis: 'You should see a list of Wi-Fi network names. These are the internet connections near you.',
        confusedAlt: 'Wi-Fi is the invisible signal that gives your device internet, like a radio station your device tunes into. We need to find the list of available signals near you. Make sure the Wi-Fi switch is turned on first.',
      },
      {
        instruction: 'Click your network name',
        whereToLook: 'In the list of network names that appeared',
        whatItLooksLike: 'A list of names — look for your home network name or the one you were told to use',
        image: { url: '/ui-references/system-windows/windows-wifi-illustrated-step-3.png', altText: 'List of Wi-Fi networks to choose from' },
        screen: {
          url: '/ui-references/system-windows/windows-wifi-illustrated-step-3.png',
          hotspot: { xPercent: 85, yPercent: 45 },
        },
        variants: {
          Windows: 'Click on the name of the network you want to join from the list.',
          Mac: 'Click on the name of the network you want to join from the dropdown list.',
          iPhone: 'Tap the name of the network you want to join from the list.',
          Android: 'Tap the name of the network you want to join from the list.',
        },
        afterThis: 'The network expands to show a Connect button and options.',
        confusedAlt: 'The network name is like the name of a radio station. It is usually the name your internet company gave you, or something you chose yourself. It might be on a sticker on your internet box (router) at home.',
      },
      {
        instruction: 'Click Connect',
        whereToLook: 'Right below the network name you just selected',
        whatItLooksLike: 'A button that says "Connect" — you may also see a "Connect automatically" checkbox',
        image: { url: '/ui-references/system-windows/windows-wifi-illustrated-step-4.png', altText: 'The Connect button under the selected network' },
        screen: {
          url: '/ui-references/system-windows/windows-wifi-illustrated-step-4.png',
          hotspot: { xPercent: 85, yPercent: 55 },
        },
        variants: {
          Windows: 'Click the "Connect" button. Check "Connect automatically" if you want your computer to remember this network.',
          Mac: 'Click "Join" or "Connect" next to the network name.',
          iPhone: 'Tap the network name — it will try to connect automatically.',
          Android: 'Tap "Connect" below the network name.',
        },
        afterThis: 'A box appears asking you for the Wi-Fi password.',
        confusedAlt: 'After you click on your network name, a "Connect" button should appear right below it. Click that button. You can also check the little box that says "Connect automatically" so your computer remembers this network for next time.',
      },
      {
        instruction: 'Type the Wi-Fi password',
        whereToLook: 'The password box that appeared on screen',
        whatItLooksLike: 'A text box where you type the password, and a button that says "Next" or "Connect"',
        image: { url: '/ui-references/system-windows/windows-wifi-illustrated-step-5.png', altText: 'Wi-Fi password entry screen' },
        screen: {
          url: '/ui-references/system-windows/windows-wifi-illustrated-step-5.png',
          hotspot: { xPercent: 85, yPercent: 50 },
        },
        variants: {
          Windows: 'Type the Wi-Fi password in the box and click "Next." The password is case-sensitive — capital letters matter.',
          Mac: 'Type the Wi-Fi password in the box and click "Join."',
          iPhone: 'Type the Wi-Fi password and tap "Join" in the top-right corner.',
          Android: 'Type the Wi-Fi password and tap "Connect."',
        },
        afterThis: 'Your device tries to connect to the network using the password you entered.',
        confusedAlt: 'The Wi-Fi password is like a key to a locked door. You need the right password to get in. Check the sticker on the bottom of your internet box (router) at home — the password is usually printed there. Capital and lowercase letters matter, so type carefully.',
      },
      {
        instruction: 'You are connected!',
        whereToLook: 'The Wi-Fi icon in the taskbar and the network status',
        whatItLooksLike: 'The Wi-Fi icon shows full signal bars and the network says "Connected"',
        image: { url: '/ui-references/system-windows/windows-wifi-illustrated-step-6.png', altText: 'Wi-Fi connected confirmation' },
        screen: {
          url: '/ui-references/system-windows/windows-wifi-illustrated-step-6.png',
          hotspot: { xPercent: 85, yPercent: 45 },
        },
        variants: {
          Windows: 'You should see "Connected" under your network name. The Wi-Fi icon in the taskbar now shows full signal bars.',
          Mac: 'The Wi-Fi icon in the top-right menu bar now shows full curved lines, and the network says "Connected."',
          iPhone: 'A blue checkmark appears next to your network name. The Wi-Fi icon shows at the top of your screen.',
          Android: 'You see "Connected" under the network name. The Wi-Fi icon appears at the top of your screen.',
        },
        afterThis: 'Congratulations! Your device is now connected to the internet. You can browse websites, check email, and use online apps.',
        confusedAlt: 'You did it! Your device is now connected to the internet through Wi-Fi. You should see the word "Connected" next to your network name, and the Wi-Fi icon (the curved lines) should look full and strong.',
      },
    ],
  },

  video_call: {
    title: 'Joining a Video Call',
    description: 'Practice opening a video call app and joining a meeting.',
    steps: [
      {
        instruction: 'Open Zoom in your browser',
        whereToLook: 'Look at the bottom of your screen for the browser icon, or the Zoom app',
        whatItLooksLike: 'A colorful circle (Chrome) on the laptop screen, or the blue Zoom camera icon',
        image: { url: '/ui-references/video-call/zoom-illustrated-step-1-chrome.png', altText: 'Opening Zoom in Chrome browser' },
        screen: {
          url: '/ui-references/video-call/zoom-illustrated-step-1-chrome.png',
          hotspot: { xPercent: 50, yPercent: 40 },
        },
        variants: {
          Windows: 'Open Chrome or Edge and go to zoom.us, or look for the Zoom app (blue camera icon) on your taskbar or Start menu.',
          Mac: 'Open Safari or Chrome and go to zoom.us, or find the Zoom app (blue camera icon) in your dock.',
          iPhone: 'Find the Zoom app on your home screen — it has a blue camera icon. Or open Safari and go to zoom.us.',
          Android: 'Find the Zoom app on your home screen or app drawer — it has a blue camera icon.',
        },
        afterThis: 'The Zoom home page or app opens. You should see options to join or start a meeting.',
        confusedAlt: 'Zoom is a video calling app — it lets you see and talk to people on your screen, like a video telephone. You can open it in your web browser by typing zoom.us in the address bar, or by finding the Zoom app on your device.',
      },
      {
        instruction: 'Click "Join a Meeting"',
        whereToLook: 'Look in the middle or top area of the Zoom page',
        whatItLooksLike: 'A button that says "Join a Meeting" or "Join"',
        image: { url: '/ui-references/video-call/zoom-illustrated-step-2.png', altText: 'The Join a Meeting button in Zoom' },
        screen: {
          url: '/ui-references/video-call/zoom-illustrated-step-2.png',
          hotspot: { xPercent: 50, yPercent: 45 },
        },
        variants: {
          Windows: 'Click "Join a Meeting" on the Zoom home page. If someone sent you a link, you can click that link instead.',
          Mac: 'Click "Join a Meeting" or "Join." You can also click a meeting link someone sent you in an email or message.',
          iPhone: 'Tap "Join" or tap the meeting link someone sent you. The link usually starts with "zoom.us."',
          Android: 'Tap "Join a Meeting" or tap the meeting link someone sent you in a message or email.',
        },
        afterThis: 'You see a screen where you can type in a meeting code or meeting ID.',
        confusedAlt: 'Someone probably sent you a meeting link — it looks like a website address in a message or email. If you tap or click that link, it will take you right to the meeting. Otherwise, look for a big button that says "Join a Meeting" on the Zoom page.',
      },
      {
        instruction: 'Enter the meeting ID',
        whereToLook: 'The text box in the center of the screen',
        whatItLooksLike: 'A text box asking for a meeting ID or personal link name',
        image: { url: '/ui-references/video-call/zoom-illustrated-step-3.png', altText: 'Meeting ID entry field' },
        screen: {
          url: '/ui-references/video-call/zoom-illustrated-step-3.png',
          hotspot: { xPercent: 50, yPercent: 45 },
        },
        variants: {
          Windows: 'Type the meeting ID number that was shared with you (it looks like 123 456 7890) and click "Join."',
          Mac: 'Type the meeting ID number in the box and click "Join."',
          iPhone: 'Type the meeting ID and your display name, then tap "Join."',
          Android: 'Type the meeting ID and your name, then tap "Join."',
        },
        afterThis: 'Zoom starts loading the meeting. You may see a preview of your camera.',
        confusedAlt: 'The meeting ID is a number that the person who set up the meeting gave you. It usually looks like three groups of numbers, like 123 456 7890. Type it in the box and click Join.',
      },
      {
        instruction: 'Choose how to join audio',
        whereToLook: 'A popup window in the center of the screen',
        whatItLooksLike: 'A button that says "Join with Computer Audio" or "Call using Internet Audio"',
        image: { url: '/ui-references/video-call/zoom-illustrated-step-4.png', altText: 'Audio join options in Zoom' },
        screen: {
          url: '/ui-references/video-call/zoom-illustrated-step-4.png',
          hotspot: { xPercent: 50, yPercent: 50 },
        },
        variants: {
          Windows: 'Click "Join with Computer Audio" so people can hear you through your computer speakers and microphone.',
          Mac: 'Click "Join with Computer Audio" to use your Mac\'s speakers and microphone.',
          iPhone: 'Tap "Call using Internet Audio" to use your phone\'s speaker and microphone.',
          Android: 'Tap "Call via Device Audio" to use your phone\'s speaker and microphone.',
        },
        afterThis: 'Your audio is now connected. You should be able to hear other people in the meeting.',
        confusedAlt: 'This is asking how you want to hear and speak in the meeting. Just click the big button that says "Join with Computer Audio" — that uses your computer\'s built-in speakers and microphone, which is the easiest option.',
      },
      {
        instruction: 'Check your camera preview',
        whereToLook: 'Look at the video preview showing your face',
        whatItLooksLike: 'A small window showing what your camera sees — you should see yourself',
        image: { url: '/ui-references/video-call/zoom-illustrated-step-5.png', altText: 'Camera and microphone preview before joining' },
        screen: {
          url: '/ui-references/video-call/zoom-illustrated-step-5.png',
          hotspot: { xPercent: 50, yPercent: 40 },
        },
        variants: {
          Windows: 'You should see a preview of yourself. Make sure the camera icon and microphone icon at the bottom do not have a red line through them. Click them to turn on or off.',
          Mac: 'Check the preview of your face. If the camera or microphone icons have a line through them, click them to turn them on.',
          iPhone: 'You should see yourself on screen. Make sure the camera and microphone buttons are not crossed out. Tap them to toggle on or off.',
          Android: 'You should see yourself on screen. Make sure the camera and microphone buttons at the bottom are not crossed out. Tap to turn them on.',
        },
        afterThis: 'You can see your own face on screen and the microphone is on. You are ready to join.',
        confusedAlt: 'Before you walk into the meeting room, check two things: can people see you (camera is on) and can people hear you (microphone is on). If either icon has a line through it, click it to turn it back on. Think of it like making sure the lights and phone are working before a call.',
      },
      {
        instruction: 'Click Join to enter the meeting',
        whereToLook: 'Look for a big green or blue button at the bottom or center of the screen',
        whatItLooksLike: 'A large button that says "Join," "Join Meeting," or "Join with Video"',
        image: { url: '/ui-references/video-call/zoom-illustrated-step-6.png', altText: 'The Join button to enter the meeting' },
        screen: {
          url: '/ui-references/video-call/zoom-illustrated-step-6.png',
          hotspot: { xPercent: 50, yPercent: 55 },
        },
        variants: {
          Windows: 'Click the "Join" or "Join with Video" button. You may need to wait a moment for the host to let you in.',
          Mac: 'Click "Join" or "Join Meeting." The host may need to admit you — you will see a "Waiting for host" message.',
          iPhone: 'Tap "Join" or "Join Meeting." Wait a moment — you may see "Waiting for the host to let you in."',
          Android: 'Tap "Join" or "Join Meeting." The host may need to admit you, so wait patiently.',
        },
        afterThis: 'You enter the meeting, or you see a waiting room message while the host lets you in.',
        confusedAlt: 'This is like knocking on the door and walking into the room. Just press the big Join button. Sometimes the person running the meeting has to "open the door" for you, so if you see a waiting message, just be patient — they will let you in.',
      },
      {
        instruction: 'You are in the meeting!',
        whereToLook: 'The main screen showing other participants',
        whatItLooksLike: 'You can see and hear the other people in the meeting. Your face appears in a small box.',
        image: { url: '/ui-references/video-call/zoom-illustrated-step-7.png', altText: 'Inside the Zoom meeting with participants visible' },
        screen: {
          url: '/ui-references/video-call/zoom-illustrated-step-7.png',
          hotspot: { xPercent: 50, yPercent: 50 },
        },
        variants: {
          Windows: 'You are in the meeting! You can see other people on screen. Use the microphone and camera buttons at the bottom to mute or unmute.',
          Mac: 'You are in the meeting! The controls at the bottom let you mute, turn off your camera, or leave the meeting.',
          iPhone: 'You are in! Tap the screen to see controls. The red phone button ends the call when you are done.',
          Android: 'You are in! Tap the screen to see controls. The red phone button ends the call when you are done.',
        },
        afterThis: 'Congratulations! You are in the video call. When the meeting is over, click the red "Leave" button to exit.',
        confusedAlt: 'You made it! You are now in the video call and can see and hear everyone. If you need to mute yourself (stop others from hearing you), click the microphone icon at the bottom. When the meeting is done, click the red "Leave" button.',
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
        image: { url: '/ui-references/printing/print-document-illustrated-step-1.png', altText: 'A document open on screen' },
        screen: {
          url: '/ui-references/printing/print-document-illustrated-step-1.png',
          hotspot: { xPercent: 50, yPercent: 45 },
        },
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
        instruction: 'Click File, then Print',
        whereToLook: 'Look at the top-left of your screen for the "File" menu',
        whatItLooksLike: 'The word "File" in the menu bar, and then "Print" in the dropdown list',
        image: { url: '/ui-references/printing/print-document-illustrated-step-2.png', altText: 'File menu with Print option highlighted' },
        screen: {
          url: '/ui-references/printing/print-document-illustrated-step-2.png',
          hotspot: { xPercent: 30, yPercent: 15 },
        },
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
        image: { url: '/ui-references/printing/print-document-illustrated-step-3.png', altText: 'Printer selection in print dialog' },
        screen: {
          url: '/ui-references/printing/print-document-illustrated-step-3.png',
          hotspot: { xPercent: 50, yPercent: 40 },
        },
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
        instruction: 'Click the Print button',
        whereToLook: 'Look at the bottom-right of the print window',
        whatItLooksLike: 'A button that says "Print"',
        image: { url: '/ui-references/printing/print-document-illustrated-step-4.png', altText: 'The Print button at the bottom of the dialog' },
        screen: {
          url: '/ui-references/printing/print-document-illustrated-step-4.png',
          hotspot: { xPercent: 55, yPercent: 60 },
        },
        variants: {
          Windows: 'Click the "Print" button at the bottom of the print window. Your printer should start making noise within a few seconds.',
          Mac: 'Click the "Print" button at the bottom-right of the print window.',
          iPhone: 'Tap "Print" in the top-right corner of the screen.',
          Android: 'Tap the round print button (it looks like a small printer picture) or the word "Print."',
        },
        afterThis: 'Your printer wakes up, makes some noise, and starts printing your document.',
        confusedAlt: 'This is the final step — like pressing the big green "Go" button on a photocopier. Once you tap Print, your document travels from your screen to the printer and comes out on paper.',
      },
      {
        instruction: 'Your document is printing!',
        whereToLook: 'Look at your printer — it should be making noise and producing paper',
        whatItLooksLike: 'Your document coming out of the printer on paper',
        image: { url: '/ui-references/printing/print-document-illustrated-step-5.png', altText: 'Confirmation that the document is printing' },
        screen: {
          url: '/ui-references/printing/print-document-illustrated-step-5.png',
          hotspot: { xPercent: 50, yPercent: 50 },
        },
        variants: {
          Windows: 'Your printer is working! Wait for all the pages to come out. If the printer does not start, make sure it is turned on, connected, and has paper.',
          Mac: 'Your printer is working! Wait for the pages. If nothing happens, check that the printer is on and has paper.',
          iPhone: 'Your document is being sent to the printer. Wait a moment for it to start printing.',
          Android: 'Your document is being sent to the printer. Wait a moment for it to start printing.',
        },
        afterThis: 'Congratulations! Your document has been printed on paper. Pick it up from the printer tray.',
        confusedAlt: 'You did it! Your document is now being printed. If the printer does not start, check three things: (1) Is the printer turned on? (2) Is it connected to your computer or Wi-Fi? (3) Does it have paper in the tray?',
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
        image: null,
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
        image: null,
        variants: {
          Windows: 'Hold down Ctrl (bottom-left of keyboard) and press C. Nothing visible happens — that\'s normal!',
          Mac: 'Hold down Cmd (next to spacebar) and press C. Nothing visible happens — that\'s normal!',
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
        image: null,
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
        image: null,
        variants: {
          Windows: 'Hold down Ctrl and press V. Your copied text appears!',
          Mac: 'Hold down Cmd and press V. Your copied text appears!',
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
        image: null,
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
        image: { url: '/ui-references/browser/chrome-address-bar.png', altText: 'The address bar at the top of the browser' },
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
        image: { url: '/ui-references/browser/chrome-address-bar.png', altText: 'Typing a web address in the address bar' },
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

  take_screenshot: {
    title: 'Taking a Screenshot',
    description: 'Practice capturing a picture of what is on your screen right now.',
    steps: [
      {
        instruction: 'Find the right keys or buttons',
        whereToLook: 'Look at the top-right area of your keyboard (or use your phone buttons)',
        whatItLooksLike: 'A key that says "PrtScn" or "Print Screen" — or on a phone, the side buttons',
        image: null,
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
        image: null,
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
        image: null,
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

  change_text_size: {
    title: 'Making Text Bigger',
    description: 'Practice changing your screen so text and images are bigger and easier to read.',
    steps: [
      {
        instruction: 'Open your settings',
        whereToLook: 'Look at the bottom-left of your screen (or your home screen on a phone)',
        whatItLooksLike: 'A gear icon — a small circle with teeth around it',
        image: { url: '/ui-references/system-windows/windows-settings-gear.png', altText: 'The Settings gear icon' },
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
        image: null,
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
        image: null,
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
