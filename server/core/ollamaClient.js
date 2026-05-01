/**
 * Ollama Client — calls Ollama's OpenAI-compatible chat completions API.
 *
 * Ollama exposes an OpenAI-compatible endpoint at /v1/chat/completions.
 * This client wraps that API for use by agentOrchestrator.js (Ollama path).
 */

const config = require('../config');

/**
 * Send a chat completion request to Ollama.
 *
 * @param {string} model       Ollama model name (e.g. "llama3.2", "mistral")
 * @param {string} systemPrompt
 * @param {Array<{ role: string, content: string|object }>} messages  Array of chat messages
 * @returns {Promise<string>}  The assistant's text response
 */
async function chat(model, systemPrompt, messages) {
  const baseUrl = config.ollamaBaseUrl || 'http://localhost:11434';

  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    })),
  ];

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Ollama API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Ollama returned empty response');
  }
  return content;
}

module.exports = { chat };
