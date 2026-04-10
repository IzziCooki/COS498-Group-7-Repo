const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiApiKey } = require('../config');

if (!geminiApiKey) {
  console.warn('[taskClassifier] GEMINI_API_KEY is not set — classification calls will fail. Running in degraded mode.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const VALID_TASK_TYPES = ['learn_skill', 'troubleshoot', 'follow_up', 'accessibility', 'unknown'];
const VALID_URGENCY = ['low', 'medium', 'high'];

/**
 * Classifies a user message into a task type using Gemini.
 *
 * @param {string} text         The user's message
 * @param {object} userProfile  The user's profile object (from User model)
 * @returns {Promise<{ taskType: string, topic: string, urgency: string }>}
 */
async function classifyMessage(text, userProfile) {
  const profileSummary = userProfile
    ? [
        `Name: ${userProfile.name || 'unknown'}`,
        `OS: ${userProfile.os_type || 'unknown'}`,
        `Vocabulary level: ${userProfile.vocabulary_level || 'basic'}`,
        `Comfort level: ${userProfile.comfort_level !== undefined ? userProfile.comfort_level : 1}/5`,
      ].join(', ')
    : 'No profile available';

  const prompt = `You are a classifier for PC Pal, an AI tutor that helps elderly users with their computers.

Your job is to classify the user's message into one of the following task types:
- learn_skill: The user wants to learn how to do something new (e.g., "How do I send an email?")
- troubleshoot: The user has a problem they need help fixing (e.g., "My computer won't turn on")
- follow_up: The user is following up on a previous conversation or step (e.g., "I did that, now what?")
- accessibility: The user is requesting accessibility help or reporting difficulty (e.g., "The text is too small")
- unknown: The message doesn't clearly fit any of the above categories

You must respond with a valid JSON object and nothing else — no explanation, no markdown, just raw JSON.

Response format:
{
  "taskType": "<one of the task types above>",
  "topic": "<brief description of what the user wants help with, max 10 words>",
  "urgency": "<low|medium|high>"
}

Urgency guidelines:
- high: safety concerns, complete inability to use computer, critical system failures
- medium: frustrating problems, partial functionality loss
- low: general learning questions, minor inconveniences, curiosity

User profile: ${profileSummary}

User message: "${text}"

Classify this message.`;

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Strip markdown code fences if present
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('[taskClassifier] Failed to parse Gemini response:', rawText);
      return { taskType: 'unknown', topic: 'unclassified', urgency: 'low' };
    }

    const taskType = VALID_TASK_TYPES.includes(parsed.taskType) ? parsed.taskType : 'unknown';
    const topic = typeof parsed.topic === 'string' ? parsed.topic.slice(0, 100) : 'unclassified';
    const urgency = VALID_URGENCY.includes(parsed.urgency) ? parsed.urgency : 'low';

    return { taskType, topic, urgency };
  } catch (err) {
    console.error('[taskClassifier] Gemini API error:', err.message);
    return { taskType: 'unknown', topic: 'unclassified', urgency: 'low' };
  }
}

module.exports = { classifyMessage };
