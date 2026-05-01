/**
 * Model Provider — registry + resolution for all supported AI models.
 *
 * Supports:
 * - Anthropic Claude models (via ANTHROPIC_API_KEY)
 * - Local Ollama models (via Ollama REST API at OLLAMA_BASE_URL)
 *
 * Model IDs:
 *   Claude:  "claude-sonnet-4-20250514", "claude-haiku-4-5-20251001", etc.
 *   Ollama:  "ollama/llama3.2", "ollama/mistral", etc.
 */

const { anthropicApiKey } = require('../config');
const config = require('../config');

const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', provider: 'anthropic' },
];

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

/**
 * List all available models (Claude + any running Ollama models).
 * @returns {Promise<Array<{ id: string, name: string, provider: string }>>}
 */
async function listAvailableModels() {
  const models = [];

  if (anthropicApiKey) {
    models.push(...CLAUDE_MODELS);
  }

  const ollamaUrl = config.ollamaBaseUrl || 'http://localhost:11434';
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      for (const model of data.models || []) {
        models.push({
          id: `ollama/${model.name}`,
          name: `${model.name} (local)`,
          provider: 'ollama',
        });
      }
    }
  } catch (_) {
    // Ollama not running — that's fine
  }

  return models;
}

/**
 * Parse a model preference string into provider + model name.
 * @param {string|null} modelPref  e.g. "claude-sonnet-4-20250514" or "ollama/llama3.2"
 * @returns {{ provider: string, model: string }}
 */
function resolveModel(modelPref) {
  if (!modelPref) {
    return { provider: 'anthropic', model: DEFAULT_MODEL };
  }
  if (modelPref.startsWith('ollama/')) {
    return { provider: 'ollama', model: modelPref.slice(7) };
  }
  // Assume Anthropic for anything else (claude-*)
  return { provider: 'anthropic', model: modelPref };
}

module.exports = { listAvailableModels, resolveModel, DEFAULT_MODEL };
