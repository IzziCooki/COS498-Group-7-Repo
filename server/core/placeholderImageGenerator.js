const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const uiReferenceLibrary = require('./uiReferenceLibrary');

// Generates simple labeled placeholder PNGs for UI reference entries that
// have no corresponding file on disk yet. These are not real screenshots —
// they are stand-in illustrations (labeled boxes with the alt text) so the
// image flow can be tested end-to-end before real assets are added.
//
// Run at server startup: only missing files are generated. Real screenshots
// placed on disk will NOT be overwritten.

const WIDTH = 400;
const HEIGHT = 200;

// Palette chosen to loosely suggest the category at a glance.
const CATEGORY_COLORS = {
  email: { bg: '#fff8e1', accent: '#f9a825', label: '#5d4037' },
  'video-call': { bg: '#e3f2fd', accent: '#1976d2', label: '#0d47a1' },
  messaging: { bg: '#e8f5e9', accent: '#388e3c', label: '#1b5e20' },
  browser: { bg: '#f3e5f5', accent: '#7b1fa2', label: '#4a148c' },
  'system-windows': { bg: '#e8eaf6', accent: '#3f51b5', label: '#1a237e' },
  'system-mac': { bg: '#eceff1', accent: '#546e7a', label: '#263238' },
};

const DEFAULT_PALETTE = { bg: '#f5f5f5', accent: '#616161', label: '#212121' };

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function generatePlaceholder(id, entry, outputPath) {
  const palette = CATEGORY_COLORS[entry.category] || DEFAULT_PALETTE;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Accent border
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);

  // "PLACEHOLDER" small caps header
  ctx.fillStyle = palette.accent;
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText('PLACEHOLDER', 16, 24);

  // ID in monospace
  ctx.fillStyle = palette.label;
  ctx.font = 'bold 14px Consolas, monospace';
  ctx.fillText(id, 16, 48);

  // Alt text wrapped
  ctx.font = '16px Arial, sans-serif';
  ctx.fillStyle = palette.label;
  const lines = wrapText(ctx, entry.alt, WIDTH - 32);
  const startY = 80;
  lines.forEach((line, i) => {
    ctx.fillText(line, 16, startY + i * 22);
  });

  // Category footer
  ctx.font = 'italic 11px Arial, sans-serif';
  ctx.fillStyle = palette.accent;
  ctx.fillText(`category: ${entry.category}`, 16, HEIGHT - 16);

  // Ensure parent directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

// Iterates the registry and creates a placeholder for any entry whose file
// is missing on disk. Existing files are left untouched so real screenshots
// are never overwritten.
function generateMissing() {
  const entries = Object.entries(uiReferenceLibrary.LIBRARY);
  let generated = 0;
  let skipped = 0;

  for (const [id, entry] of entries) {
    const outputPath = path.join(uiReferenceLibrary.ASSETS_DIR, entry.file);
    if (fs.existsSync(outputPath)) {
      skipped++;
      continue;
    }
    try {
      generatePlaceholder(id, entry, outputPath);
      generated++;
    } catch (err) {
      console.error(`[placeholderImageGenerator] Failed to generate ${id}:`, err.message);
    }
  }

  if (generated > 0) {
    console.log(`[placeholderImageGenerator] Generated ${generated} placeholder(s); kept ${skipped} existing file(s).`);
  } else {
    console.log(`[placeholderImageGenerator] All ${skipped} reference files already present on disk.`);
  }
  return { generated, skipped };
}

module.exports = { generateMissing, generatePlaceholder };
