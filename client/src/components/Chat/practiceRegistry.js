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
};

export default practiceRegistry;
