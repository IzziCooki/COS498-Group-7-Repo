const Anthropic = require('@anthropic-ai/sdk');
const { anthropicApiKey } = require('../config');

if (!anthropicApiKey) {
  console.warn('[taskClassifier] ANTHROPIC_API_KEY is not set — classification calls will fail. Running in degraded mode.');
}

const client = new Anthropic({ apiKey: anthropicApiKey });

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const VALID_TASK_TYPES = ['learn_skill', 'troubleshoot', 'follow_up', 'accessibility', 'unknown'];
const VALID_URGENCY = ['low', 'medium', 'high'];

async function classifyMessage(text, userProfile) {
  const profileSummary = userProfile
    ? [
        `Name: ${userProfile.name || 'unknown'}`,
        `OS: ${userProfile.os_type || 'unknown'}`,
        `Vocabulary level: ${userProfile.vocabulary_level || 'basic'}`,
        `Comfort level: ${userProfile.comfort_level !== undefined ? userProfile.comfort_level : 1}/5`,
      ].join(', ')
    : 'No profile available';

  const systemPrompt = `You are a classifier for PC Pal, an AI tutor that helps elderly users with their computers.

Classify the user's message into one of these task types:
- learn_skill: wants to learn something new
- troubleshoot: has a problem to fix
- follow_up: following up on a previous step
- accessibility: requesting accessibility help
- unknown: doesn't fit any category

Respond with ONLY a JSON object, no markdown, no explanation:
{"taskType": "<type>", "topic": "<brief description, max 10 words>", "urgency": "<low|medium|high>"}

Urgency: high = safety/critical failure, medium = frustrating problem, low = general question`;

  const userMessage = `User profile: ${profileSummary}\nUser message: "${text}"\nClassify this message.`;

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText = response.content[0]?.text?.trim() || '';
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('[taskClassifier] Failed to parse Claude response:', rawText);
      return { taskType: 'unknown', topic: 'unclassified', urgency: 'low' };
    }

    const taskType = VALID_TASK_TYPES.includes(parsed.taskType) ? parsed.taskType : 'unknown';
    const topic = typeof parsed.topic === 'string' ? parsed.topic.slice(0, 100) : 'unclassified';
    const urgency = VALID_URGENCY.includes(parsed.urgency) ? parsed.urgency : 'low';

    return { taskType, topic, urgency };
  } catch (err) {
    console.error('[taskClassifier] Claude API error:', err.message);
    return { taskType: 'unknown', topic: 'unclassified', urgency: 'low' };
  }
}

module.exports = { classifyMessage };
