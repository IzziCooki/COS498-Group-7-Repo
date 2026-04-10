const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'assets', 'software-images');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'annotated');

// Annotation colors
const RED = '#e74c3c';
const RED_ALPHA = 'rgba(231, 76, 60, 0.25)';
const WHITE = '#ffffff';
const LABEL_BG = 'rgba(231, 76, 60, 0.9)';

/**
 * Draw a red circle annotation on the canvas.
 */
function drawCircle(ctx, cx, cy, radius) {
  ctx.strokeStyle = RED;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Draw a red arrow from (x1,y1) to (x2,y2).
 */
function drawArrow(ctx, x1, y1, x2, y2) {
  const headLen = 14;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.strokeStyle = RED;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a label with background.
 */
function drawLabel(ctx, text, x, y, fontSize = 18) {
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const padding = 8;
  const boxW = metrics.width + padding * 2;
  const boxH = fontSize + padding * 2;

  // Background
  ctx.fillStyle = LABEL_BG;
  const cornerRadius = 6;
  ctx.beginPath();
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + boxW - cornerRadius, y);
  ctx.quadraticCurveTo(x + boxW, y, x + boxW, y + cornerRadius);
  ctx.lineTo(x + boxW, y + boxH - cornerRadius);
  ctx.quadraticCurveTo(x + boxW, y + boxH, x + boxW - cornerRadius, y + boxH);
  ctx.lineTo(x + cornerRadius, y + boxH);
  ctx.quadraticCurveTo(x, y + boxH, x, y + boxH - cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.fillStyle = WHITE;
  ctx.fillText(text, x + padding, y + fontSize + padding / 2);
}

/**
 * Draw a step number circle.
 */
function drawStepNumber(ctx, num, cx, cy, radius = 16) {
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = WHITE;
  ctx.font = `bold ${radius}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), cx, cy);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

/**
 * Annotate a source image with circles, arrows, labels.
 *
 * @param {string} sourceFile - filename in source dir (e.g., 'IOS-Settings.png')
 * @param {string} outputFile - filename in output dir (e.g., 'iphone-settings-wifi-annotated.png')
 * @param {Array} annotations - array of annotation objects:
 *   { type: 'circle', x, y, radius }
 *   { type: 'arrow', x1, y1, x2, y2 }
 *   { type: 'label', text, x, y, fontSize? }
 *   { type: 'step', num, x, y, radius? }
 * @returns {Promise<string>} path to the output file
 */
async function annotateImage(sourceFile, outputFile, annotations) {
  const sourcePath = path.join(SOURCE_DIR, sourceFile);
  const outputPath = path.join(OUTPUT_DIR, outputFile);

  // Skip if already generated
  if (fs.existsSync(outputPath)) return outputPath;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const img = await loadImage(sourcePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  // Draw the original screenshot
  ctx.drawImage(img, 0, 0);

  // Apply annotations
  for (const a of annotations) {
    switch (a.type) {
      case 'circle':
        drawCircle(ctx, a.x, a.y, a.radius);
        break;
      case 'arrow':
        drawArrow(ctx, a.x1, a.y1, a.x2, a.y2);
        break;
      case 'label':
        drawLabel(ctx, a.text, a.x, a.y, a.fontSize || 18);
        break;
      case 'step':
        drawStepNumber(ctx, a.num, a.x, a.y, a.radius || 16);
        break;
    }
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`[imageAnnotator] Created: ${outputFile}`);
  return outputPath;
}

/**
 * Generate all annotated images for iOS guides.
 */
async function generateAllAnnotations() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Get image dimensions for accurate annotation placement
  const settingsImg = await loadImage(path.join(SOURCE_DIR, 'IOS-Settings.png'));
  const wifiImg = await loadImage(path.join(SOURCE_DIR, 'IOS-Settings-WiFi.png'));

  const sw = settingsImg.width;
  const sh = settingsImg.height;
  const ww = wifiImg.width;
  const wh = wifiImg.height;

  // Settings image is 490x1008
  // Wi-Fi row is roughly at y=430 (43% down), centered at x=245

  // iOS Settings — circle around Wi-Fi row with "Tap here" label
  await annotateImage('IOS-Settings.png', 'iphone-settings-tap-wifi.png', [
    { type: 'step', num: 1, x: 30, y: 430, radius: 18 },
    { type: 'circle', x: 245, y: 430, radius: 80 },
    { type: 'label', text: 'Tap Wi-Fi', x: 300, y: 395, fontSize: 22 },
  ]);

  // iOS Settings — overview label at top
  await annotateImage('IOS-Settings.png', 'iphone-settings-overview.png', [
    { type: 'label', text: 'This is your Settings app', x: 80, y: 140, fontSize: 20 },
    { type: 'arrow', x1: 245, y1: 170, x2: 245, y2: 210 },
  ]);

  // Wi-Fi image is 760x940
  // Wi-Fi toggle is at roughly y=415, right side x=680
  // Network name "Home Wi-Fi" is at roughly y=530, centered x=380

  // iOS Wi-Fi page — circle the Wi-Fi toggle
  await annotateImage('IOS-Settings-WiFi.png', 'iphone-wifi-toggle.png', [
    { type: 'step', num: 2, x: 50, y: 415, radius: 22 },
    { type: 'circle', x: 680, y: 415, radius: 45 },
    { type: 'label', text: 'Make sure this is ON (green)', x: 150, y: 360, fontSize: 24 },
    { type: 'arrow', x1: 520, y1: 380, x2: 630, y2: 410 },
  ]);

  // iOS Wi-Fi page — circle the network name
  await annotateImage('IOS-Settings-WiFi.png', 'iphone-wifi-select-network.png', [
    { type: 'step', num: 3, x: 50, y: 530, radius: 22 },
    { type: 'circle', x: 380, y: 530, radius: 120 },
    { type: 'label', text: 'Tap your Wi-Fi network name', x: 130, y: 470, fontSize: 24 },
  ]);

  console.log('[imageAnnotator] All annotations generated');
}

module.exports = { annotateImage, generateAllAnnotations };
