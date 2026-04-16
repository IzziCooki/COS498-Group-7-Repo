const { execSync } = require('child_process');
const conversationState = require('./conversationState');
const userProfileManager = require('./userProfileManager');
const vocabularyFilter = require('./vocabularyFilter');
const { matchSkill, buildSkillPrompt, getSkillsSummary } = require('./skillMatcher');
const systemDiagnostics = require('./systemDiagnostics');

/**
 * CLI-powered responder with automatic skill matching.
 *
 * Every user message is checked against the skills library.
 * If a skill matches, its specialized prompt is injected into the AI context.
 * For diagnostic skills, real system data is gathered and included.
 * The AI always generates all output — skills just guide its expertise.
 */

/**
 * Gather diagnostic data when the matched skill is a diagnostic skill.
 * Returns a string of real system data to inject into the AI prompt,
 * or empty string if the skill is not diagnostic.
 */
function gatherDiagnosticContext(skill) {
  if (!skill || skill.category !== 'diagnostics') return '';

  const sections = [];

  try {
    switch (skill.id) {
      case 'slow_computer':
        sections.push('=== SYSTEM INFO ===\n' + systemDiagnostics.getSystemInfo());
        sections.push('=== RUNNING APPS ===\n' + systemDiagnostics.listRunningApps());
        break;
      case 'network_fix':
        sections.push('=== NETWORK STATUS ===\n' + systemDiagnostics.checkNetwork());
        break;
      case 'diagnose_system':
        sections.push('=== SYSTEM INFO ===\n' + systemDiagnostics.getSystemInfo());
        sections.push('=== RECENT ERRORS ===\n' + systemDiagnostics.readErrorLog('system'));
        break;
      case 'disk_cleanup':
        sections.push('=== DISK HEALTH ===\n' + systemDiagnostics.checkDiskHealth());
        break;
      case 'app_troubleshoot':
        sections.push('=== RUNNING APPS ===\n' + systemDiagnostics.listRunningApps());
        sections.push('=== INSTALLED SOFTWARE ===\n' + systemDiagnostics.checkInstalledSoftware());
        break;
      case 'battery_power':
        sections.push('=== BATTERY STATUS ===\n' + systemDiagnostics.getBatteryStatus());
        sections.push('=== SYSTEM INFO ===\n' + systemDiagnostics.getSystemInfo());
        break;
      case 'system_checkup':
        sections.push('=== SYSTEM INFO ===\n' + systemDiagnostics.getSystemInfo());
        sections.push('=== NETWORK STATUS ===\n' + systemDiagnostics.checkNetwork());
        sections.push('=== DISK HEALTH ===\n' + systemDiagnostics.checkDiskHealth());
        sections.push('=== BATTERY STATUS ===\n' + systemDiagnostics.getBatteryStatus());
        sections.push('=== RUNNING APPS ===\n' + systemDiagnostics.listRunningApps());
        break;
      default:
        // For wifi skill and others that mention check_network in their prompt
        if (skill.prompt && skill.prompt.includes('check_network')) {
          sections.push('=== NETWORK STATUS ===\n' + systemDiagnostics.checkNetwork());
        }
        break;
    }
  } catch (err) {
    console.error('[mockResponder] Diagnostic data gathering failed:', err.message);
    sections.push('(Diagnostic tools unavailable in this environment)');
  }

  if (sections.length === 0) return '';

  return '\n\nREAL DIAGNOSTIC DATA FROM THE USER\'S COMPUTER (translate this into plain, friendly language — NEVER show raw output):\n' +
    sections.join('\n\n');
}

/**
 * Main responder.
 */
function respond(text, userId, sessionId) {
  const user = userProfileManager.getOrCreateUser(userId);
  const vocabLevel = user.vocabulary_level || 'basic';

  conversationState.addMessage(sessionId, 'user', text);

  const match = matchSkill(text);
  if (match) {
    console.log(`[skillMatcher] Matched skill: "${match.skill.name}" (score: ${match.score})`);
  }

  const diagnosticContext = gatherDiagnosticContext(match?.skill || null);
  if (diagnosticContext) {
    console.log(`[mockResponder] Gathered diagnostic data for skill: ${match.skill.id}`);
  }

  const recentMessages = conversationState.getSessionMessages(sessionId, 10);
  const historyText = recentMessages
    .slice(0, -1)
    .map(m => `${m.role === 'user' ? 'User' : 'PC Pal'}: ${m.body}`)
    .join('\n');

  const rawResponse = askClaudeCli(text, user, historyText, match?.skill || null, diagnosticContext);

  const filtered = vocabularyFilter.filterResponse(rawResponse, vocabLevel);

  if (!filtered) {
    const fallback = "I'm having a little trouble right now. Could you try asking me again?";
    conversationState.addMessage(sessionId, 'assistant', fallback);
    return { response: fallback, safetyAlert: null, guideId: null, stepSequence: null };
  }

  conversationState.addMessage(sessionId, 'assistant', filtered);
  return {
    response: filtered,
    safetyAlert: null,
    guideId: null,
    stepSequence: null,
    matchedSkillId: match?.skill?.id || null,
    userOsType: user.os_type || null,
  };
}

/**
 * Call the claude CLI with automatic skill injection.
 */
function askClaudeCli(text, user, history, skill, diagnosticContext) {
  const name = user?.name || 'friend';
  const os = user?.os_type || 'a computer';
  const comfort = user?.comfort_level ?? 1;

  const historyBlock = history
    ? `\nRecent conversation:\n${history}\n`
    : '';

  const skillBlock = skill
    ? buildSkillPrompt(skill)
    : '';

  const skillsList = getSkillsSummary();

  const diagBlock = diagnosticContext || '';

  const prompt = `You are PC Pal, a warm and patient tech tutor for elderly users. You are helping ${name}, who uses a ${os} device and has a comfort level of ${comfort}/5 (1=brand new, 5=comfortable).

You are running as a DESKTOP APPLICATION on the user's actual computer. You have real diagnostic tools and can see their system info, network status, disk usage, running apps, and error logs. Use this data to give SPECIFIC, ACCURATE help instead of generic advice.

CRITICAL: The user's device is ${os}. ALL instructions MUST be specific to ${os}. Do NOT give instructions for other devices.
${skillBlock}
${diagBlock}

You are an expert in these topics:
${skillsList}

Rules:
- Use simple, everyday language. No jargon.
- Be warm, patient, and encouraging — like a helpful grandchild.
- Keep your answer concise (under 200 words).
- Never be condescending.
- If you have diagnostic data, reference it naturally: "I can see that your computer..." not "The diagnostic output shows..."
- NEVER show raw command output, log lines, or technical data to the user.
- If the user says "done", "ok", "next", "got it" — acknowledge their progress warmly and tell them what to do next.
- If the user says "start over" or "new question" — cheerfully ask what they'd like help with.
- If the user asks "what should I learn" — suggest a useful skill for their ${os} device from your expertise list.

Formatting (VERY IMPORTANT — follow this exactly):
- Start with a short friendly sentence, then a blank line.
- For tasks, use numbered steps. Each step on its own line with a blank line between.
- Put the key action in each step in **bold** using **double asterisks**.
- Keep each step to ONE short sentence.
- End with a blank line and a short encouraging closing line.
- For keyboard shortcuts, write them like: **Ctrl + C**
- Never write long paragraphs. Short, separated lines only.
${historyBlock}
User's message: ${text}

Respond directly to the user:`;

  try {
    const result = execSync(
      `claude -p ${escapeShellArg(prompt)} --max-turns 1`,
      { encoding: 'utf-8', timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result.trim() || "I'm sorry, I couldn't come up with an answer right now. Could you try asking in a different way?";
  } catch (err) {
    console.error('[mockResponder] Claude CLI error:', err.message);
    return "I'm having a little trouble thinking right now. Could you try asking me again?";
  }
}

function escapeShellArg(arg) {
  return '"' + arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

module.exports = { respond, gatherDiagnosticContext };
