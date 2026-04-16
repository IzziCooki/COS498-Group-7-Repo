/**
 * In-memory store for client-provided browser system info.
 * Keyed by userId — one entry per connected web user.
 */

const store = new Map();

function set(userId, info) {
  if (userId && info && typeof info === 'object') {
    store.set(userId, info);
  }
}

function get(userId) {
  return store.get(userId) || null;
}

function remove(userId) {
  store.delete(userId);
}

/**
 * Format browser system info into a human-readable string
 * matching the style of systemDiagnostics.getSystemInfo().
 */
function formatBrowserSystemInfo(info) {
  const lines = [];

  if (info.os) lines.push(`Operating System: ${info.os}`);
  if (info.browser) lines.push(`Browser: ${info.browser}`);
  if (info.cpuCores) lines.push(`Processor Cores: ${info.cpuCores}`);
  if (info.deviceMemoryGb) lines.push(`Approximate Memory: ${info.deviceMemoryGb} GB`);
  if (info.gpu) lines.push(`Graphics: ${info.gpu}`);
  if (info.screenResolution) lines.push(`Screen Resolution: ${info.screenResolution}`);
  if (info.devicePixelRatio) lines.push(`Display Scale: ${info.devicePixelRatio}x`);
  if (info.touchScreen !== undefined && info.touchScreen !== null) {
    lines.push(`Touch Screen: ${info.touchScreen ? 'Yes' : 'No'}`);
  }
  if (info.language) lines.push(`Language: ${info.language}`);

  lines.push('');
  lines.push(
    'Note: This information was collected from the web browser. ' +
    'Some details (exact CPU model, disk space, installed apps) are not available ' +
    'through a browser.'
  );

  return lines.join('\n');
}

module.exports = { set, get, remove, formatBrowserSystemInfo };
