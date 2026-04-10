'use strict';

const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'generated');
const WIDTH = 600;
const HEIGHT = 400;

// ─── Palette ────────────────────────────────────────────────────────────────
const BG            = '#f8f9fa';
const KEY_NORMAL    = '#e0e0e0';
const KEY_HIGHLIGHT = '#e74c3c';
const TEXT_DARK     = '#1a1a2e';
const TEXT_WHITE    = '#ffffff';
const SCREEN_FRAME  = '#4a4a6a';
const ANNOTATION    = '#e74c3c';
const BLUE_HIGHLIGHT= '#3498db';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawRoundedRect(ctx, x, y, w, h, radius, fillColor, strokeColor) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** Draw a single keyboard key centred at (cx, cy). */
function drawKey(ctx, label, cx, cy, size, highlighted) {
  size = size || 52;
  const x = cx - size / 2;
  const y = cy - size / 2;
  const fill   = highlighted ? KEY_HIGHLIGHT : KEY_NORMAL;
  const stroke = highlighted ? '#c0392b'     : '#bdbdbd';
  const txtCol = highlighted ? TEXT_WHITE     : TEXT_DARK;

  drawRoundedRect(ctx, x, y, size, size, 8, fill, stroke);

  // Bottom shadow strip
  ctx.fillStyle = highlighted ? '#c0392b' : '#bdbdbd';
  ctx.fillRect(x + 4, y + size - 6, size - 8, 4);

  ctx.fillStyle   = txtCol;
  ctx.font        = `bold ${size <= 44 ? 14 : 16}px sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  ctx.fillText(label, cx, cy);
}

/** Draw a key combo (e.g. ['Ctrl','C']) centred at (cx, cy). */
function drawKeyCombo(ctx, keys, cx, cy, highlighted) {
  const keySize = 52;
  const gap     = 12;          // gap between key and "+" sign
  const plusW   = 18;
  const unitW   = keySize + gap + plusW + gap; // per separator
  const totalW  = keys.length * keySize + (keys.length - 1) * (gap * 2 + plusW);
  let startX    = cx - totalW / 2 + keySize / 2;

  keys.forEach((label, i) => {
    drawKey(ctx, label, startX, cy, keySize, highlighted);
    if (i < keys.length - 1) {
      const plusX = startX + keySize / 2 + gap + plusW / 2;
      ctx.fillStyle   = TEXT_DARK;
      ctx.font        = 'bold 22px sans-serif';
      ctx.textAlign   = 'center';
      ctx.textBaseline= 'middle';
      ctx.fillText('+', plusX, cy);
      startX = plusX + plusW / 2 + gap + keySize / 2;
    }
  });
}

/** Red circle annotation. */
function drawCircleAnnotation(ctx, cx, cy, radius) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = ANNOTATION;
  ctx.lineWidth   = 4;
  ctx.stroke();
}

/** Red arrow from (fromX,fromY) to (toX,toY). */
function drawArrow(ctx, fromX, fromY, toX, toY) {
  const headLen = 16;
  const angle   = Math.atan2(toY - fromY, toX - fromX);

  ctx.strokeStyle = ANNOTATION;
  ctx.fillStyle   = ANNOTATION;
  ctx.lineWidth   = 4;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 7), toY - headLen * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 7), toY - headLen * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
}

/** Simple text label. */
function drawLabel(ctx, text, x, y, fontSize, color) {
  ctx.fillStyle   = color || TEXT_DARK;
  ctx.font        = `bold ${fontSize || 22}px sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  ctx.fillText(text, x, y);
}

/** Window frame with title bar. */
function drawWindowFrame(ctx, x, y, w, h, titleText) {
  // Window border
  drawRoundedRect(ctx, x, y, w, h, 8, '#ffffff', SCREEN_FRAME);
  // Title bar
  drawRoundedRect(ctx, x, y, w, 30, 8, SCREEN_FRAME, null);
  // Square off the bottom of the title bar
  ctx.fillStyle = SCREEN_FRAME;
  ctx.fillRect(x, y + 14, w, 16);

  // Title text
  ctx.fillStyle   = TEXT_WHITE;
  ctx.font        = 'bold 14px sans-serif';
  ctx.textAlign   = 'left';
  ctx.textBaseline= 'middle';
  ctx.fillText(titleText, x + 10, y + 15);

  // Window buttons (close / min / max)
  const bx = x + w - 12;
  ['#e74c3c', '#f1c40f', '#2ecc71'].forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(bx - i * 18, y + 15, 6, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });
}

/** Draw "use your mouse" keyboard placeholder. */
function drawMousePlaceholder(ctx) {
  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Mouse body (oval)
  const mx = WIDTH / 2;
  const my = HEIGHT / 2 - 20;
  ctx.beginPath();
  ctx.ellipse(mx, my, 52, 76, 0, 0, Math.PI * 2);
  ctx.fillStyle   = KEY_NORMAL;
  ctx.fill();
  ctx.strokeStyle = '#bdbdbd';
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Mouse divider line
  ctx.beginPath();
  ctx.moveTo(mx, my - 40);
  ctx.lineTo(mx, my + 20);
  ctx.strokeStyle = '#bdbdbd';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Scroll wheel
  drawRoundedRect(ctx, mx - 7, my - 20, 14, 28, 6, '#bdbdbd', null);

  // Cord
  ctx.beginPath();
  ctx.moveTo(mx, my + 76);
  ctx.quadraticCurveTo(mx + 24, my + 110, mx, my + 140);
  ctx.strokeStyle = '#bdbdbd';
  ctx.lineWidth   = 4;
  ctx.stroke();

  // Label
  drawLabel(ctx, 'Use your mouse for this task', WIDTH / 2, HEIGHT - 44, 22, TEXT_DARK);
}

/** Thin taskbar strip at given y. Returns { y, h } */
function drawTaskbar(ctx, activeIconCx) {
  const tbY = HEIGHT - 44;
  const tbH = 44;
  ctx.fillStyle = '#202030';
  ctx.fillRect(0, tbY, WIDTH, tbH);

  // Start / Windows button
  ctx.fillStyle = '#3a7bd5';
  ctx.fillRect(10, tbY + 8, 28, 28);
  ctx.fillStyle = TEXT_WHITE;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⊞', 24, tbY + 22);

  // Wi-Fi icon placeholder
  ctx.fillStyle = TEXT_WHITE;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('WiFi  5:00 PM', WIDTH - 8, tbY + 22);

  return { y: tbY, h: tbH };
}

// ─── Canvas factory ──────────────────────────────────────────────────────────

function makeCanvas() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  return { canvas, ctx };
}

function saveCanvas(canvas, guideId, type) {
  const outPath = path.join(OUTPUT_DIR, `${guideId}_${type}.png`);
  if (fs.existsSync(outPath)) return;
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
}

// ─── Guide generators ────────────────────────────────────────────────────────

// 1. copy_paste
function genCopyPaste() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();

    // Left: Ctrl+C (COPY)
    ctx.fillStyle = TEXT_DARK;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('COPY', 150, 120);
    drawKeyCombo(ctx, ['Ctrl', 'C'], 150, 210, true);

    // Divider
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 80);
    ctx.lineTo(WIDTH / 2, 320);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right: Ctrl+V (PASTE)
    ctx.fillStyle = TEXT_DARK;
    ctx.fillText('PASTE', 450, 120);
    drawKeyCombo(ctx, ['Ctrl', 'V'], 450, 210, true);

    drawLabel(ctx, 'Keyboard Shortcuts', WIDTH / 2, 360, 18, '#666666');

    saveCanvas(canvas, 'copy_paste', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    drawWindowFrame(ctx, 60, 40, 480, 300, 'Document - Notepad');

    // Text lines
    const lineY = [100, 125, 150, 175, 200];
    lineY.forEach(y => {
      ctx.fillStyle = '#dddddd';
      ctx.fillRect(90, y, 380, 16);
    });

    // Highlighted selection
    ctx.fillStyle = BLUE_HIGHLIGHT;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(90, 100, 380, 92);
    ctx.globalAlpha = 1.0;

    // Step 1 label
    drawLabel(ctx, '1. Select text (highlighted in blue)', WIDTH / 2, 230, 18, TEXT_DARK);

    // Circle around the selection
    drawCircleAnnotation(ctx, WIDTH / 2, 145, 110);

    // Arrow from label to circle
    drawArrow(ctx, WIDTH / 2, 218, WIDTH / 2, 256);

    drawLabel(ctx, 'Then press Ctrl+C to copy, Ctrl+V to paste', WIDTH / 2, 372, 16, '#555555');

    saveCanvas(canvas, 'copy_paste', 'screen');
  }
}

// 2. take_screenshot
function genTakeScreenshot() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();

    drawLabel(ctx, 'Press these keys together:', WIDTH / 2, 100, 22, TEXT_DARK);
    drawKeyCombo(ctx, ['Win', 'Shift', 'S'], WIDTH / 2, 210, true);
    drawLabel(ctx, 'Snip & Sketch will open', WIDTH / 2, 330, 20, '#555555');

    saveCanvas(canvas, 'take_screenshot', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    // Dimmed overlay
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Dashed selection rectangle
    ctx.strokeStyle = TEXT_WHITE;
    ctx.lineWidth   = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(150, 100, 300, 180);
    ctx.setLineDash([]);

    // Corner handles
    [[150,100],[450,100],[150,280],[450,280]].forEach(([hx,hy]) => {
      ctx.fillStyle = TEXT_WHITE;
      ctx.fillRect(hx - 6, hy - 6, 12, 12);
    });

    drawLabel(ctx, 'Drag to select area', WIDTH / 2, 210, 24, TEXT_WHITE);
    drawLabel(ctx, 'Release to capture screenshot', WIDTH / 2, 340, 18, '#eeeeee');

    saveCanvas(canvas, 'take_screenshot', 'screen');
  }
}

// 3. send_email
function genSendEmail() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();
    drawMousePlaceholder(ctx);
    saveCanvas(canvas, 'send_email', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    drawWindowFrame(ctx, 40, 20, 520, 340, 'New Message - Mail');

    // Field labels + boxes
    const fields = [
      { label: 'To:', placeholder: 'recipient@email.com', y: 70 },
      { label: 'Subject:', placeholder: 'Enter subject here', y: 115 },
    ];
    fields.forEach(f => {
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.label, 55, f.y + 16);
      drawRoundedRect(ctx, 130, f.y, 390, 32, 4, '#ffffff', '#cccccc');
      ctx.fillStyle = '#999999';
      ctx.font = '14px sans-serif';
      ctx.fillText(f.placeholder, 140, f.y + 16);
    });

    // Body area
    drawRoundedRect(ctx, 55, 160, 465, 100, 4, '#ffffff', '#cccccc');
    ctx.fillStyle = '#999999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Type your message here...', 65, 172);

    // Send button
    drawRoundedRect(ctx, 200, 288, 200, 44, 8, BLUE_HIGHLIGHT, null);
    ctx.fillStyle = TEXT_WHITE;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Send', 300, 310);

    // Circle + arrow on Send
    drawCircleAnnotation(ctx, 300, 310, 36);
    drawArrow(ctx, 300, 274, 300, 252);
    drawLabel(ctx, 'Click Send when ready', WIDTH / 2, 368, 18, TEXT_DARK);

    saveCanvas(canvas, 'send_email', 'screen');
  }
}

// 4. open_settings
function genOpenSettings() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();

    drawLabel(ctx, 'Press the Windows key:', WIDTH / 2, 110, 22, TEXT_DARK);
    drawKey(ctx, 'Win', WIDTH / 2, 220, 72, true);
    drawLabel(ctx, 'Press this key', WIDTH / 2, 310, 20, ANNOTATION);
    drawArrow(ctx, WIDTH / 2, 298, WIDTH / 2, 262);

    saveCanvas(canvas, 'open_settings', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    // Start menu mockup
    drawRoundedRect(ctx, 100, 40, 400, 300, 10, '#2d2d44', null);

    // Search bar inside start menu
    drawRoundedRect(ctx, 125, 60, 350, 36, 18, '#3a3a55', null);
    ctx.fillStyle = '#888888';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔍  Search', 148, 78);

    // Gear icon (Settings)
    const gx = 300, gy = 210;
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = TEXT_WHITE;
    ctx.fillText('⚙', gx, gy);

    ctx.fillStyle = '#cccccc';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Settings', gx, gy + 38);

    // Circle annotation
    drawCircleAnnotation(ctx, gx, gy + 10, 50);
    drawLabel(ctx, 'Click Settings', WIDTH / 2, 358, 20, ANNOTATION);
    drawArrow(ctx, WIDTH / 2, 346, WIDTH / 2, 276);

    saveCanvas(canvas, 'open_settings', 'screen');
  }
}

// 5. zoom_text
function genZoomText() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();

    drawLabel(ctx, 'Hold Ctrl, press  +  to zoom in', WIDTH / 2, 110, 22, TEXT_DARK);
    drawKeyCombo(ctx, ['Ctrl', '+'], WIDTH / 2, 210, true);
    drawLabel(ctx, 'Hold Ctrl, press  −  to zoom out', WIDTH / 2, 310, 20, '#555555');
    drawKeyCombo(ctx, ['Ctrl', '−'], WIDTH / 2, 360, false);

    saveCanvas(canvas, 'zoom_text', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    drawWindowFrame(ctx, 40, 20, 520, 320, 'Browser — Zoom Example');

    // Address bar
    drawRoundedRect(ctx, 55, 60, 460, 30, 15, '#f0f0f0', '#cccccc');
    ctx.fillStyle = '#555555';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('  https://www.example.com', 65, 75);

    // Page content (big text block)
    ctx.fillStyle = TEXT_DARK;
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Hello! This text is zoomed in.', 65, 115);
    ctx.font = '20px sans-serif';
    ctx.fillText('Zoom makes text larger and easier to read.', 65, 155);

    // Zoom indicator badge (top-right corner of browser)
    const badgeX = 470, badgeY = 60;
    drawRoundedRect(ctx, badgeX - 30, badgeY, 60, 30, 6, BLUE_HIGHLIGHT, null);
    ctx.fillStyle = TEXT_WHITE;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('125%', badgeX, badgeY + 15);

    // Circle + label
    drawCircleAnnotation(ctx, badgeX, badgeY + 15, 36);
    drawArrow(ctx, badgeX, badgeY - 22, badgeX, badgeY + 24);
    drawLabel(ctx, 'Zoom level shown here', WIDTH / 2, 368, 18, TEXT_DARK);

    saveCanvas(canvas, 'zoom_text', 'screen');
  }
}

// 6. find_wifi
function genFindWifi() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();
    drawMousePlaceholder(ctx);
    saveCanvas(canvas, 'find_wifi', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    // Desktop background
    ctx.fillStyle = '#1a6bb5';
    ctx.fillRect(0, 0, WIDTH, HEIGHT - 44);

    // Desktop label
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Desktop', WIDTH / 2, HEIGHT / 2 - 40);

    // Taskbar
    const { y: tbY } = drawTaskbar(ctx);

    // Wi-Fi icon area on taskbar (right side)
    const wifiX = WIDTH - 90;
    const wifiY = tbY + 22;

    // Simple wi-fi arc icon
    ctx.strokeStyle = TEXT_WHITE;
    ctx.lineWidth   = 3;
    [20, 14, 8].forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(wifiX, wifiY + 4, r, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    });

    // Circle annotation
    drawCircleAnnotation(ctx, wifiX, wifiY, 30);
    drawArrow(ctx, wifiX, tbY - 20, wifiX, tbY - 2);
    drawLabel(ctx, 'Click here to manage Wi-Fi', WIDTH / 2, tbY - 36, 18, TEXT_WHITE);

    saveCanvas(canvas, 'find_wifi', 'screen');
  }
}

// 7. attach_file
function genAttachFile() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();
    drawMousePlaceholder(ctx);
    saveCanvas(canvas, 'attach_file', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    drawWindowFrame(ctx, 40, 20, 520, 340, 'New Message - Mail');

    // Toolbar strip (paperclip lives here)
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(40, 50, 520, 40);

    // Paperclip button
    const ppX = 80, ppY = 70;
    drawRoundedRect(ctx, ppX - 24, ppY - 16, 48, 32, 6, '#dddddd', '#bbbbbb');
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = TEXT_DARK;
    ctx.fillText('📎', ppX, ppY);

    // Circle annotation
    drawCircleAnnotation(ctx, ppX, ppY, 28);

    // Field placeholders
    const fieldY = [108, 148, 188];
    ['To:', 'Subject:', 'Body:'].forEach((lbl, i) => {
      ctx.fillStyle = TEXT_DARK;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(lbl, 55, fieldY[i] + 14);
      drawRoundedRect(ctx, 120, fieldY[i], 400, 28, 4, '#ffffff', '#cccccc');
    });

    // Body box
    drawRoundedRect(ctx, 55, 230, 465, 100, 4, '#ffffff', '#cccccc');

    drawArrow(ctx, ppX + 28, ppY - 30, ppX + 28, ppY - 56);
    drawLabel(ctx, 'Click paperclip to attach a file', WIDTH / 2, 368, 18, TEXT_DARK);

    saveCanvas(canvas, 'attach_file', 'screen');
  }
}

// 8. open_browser
function genOpenBrowser() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();
    drawMousePlaceholder(ctx);
    saveCanvas(canvas, 'open_browser', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    // Desktop
    ctx.fillStyle = '#1a6bb5';
    ctx.fillRect(0, 0, WIDTH, HEIGHT - 44);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Desktop', WIDTH / 2, HEIGHT / 2 - 60);

    drawTaskbar(ctx);

    // Browser icon on taskbar (simple coloured circle)
    const bx = 70, by = HEIGHT - 44 + 22;
    ctx.beginPath();
    ctx.arc(bx, by, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#4285F4';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx, by, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#4285F4';
    ctx.fill();

    drawCircleAnnotation(ctx, bx, by, 26);
    drawArrow(ctx, bx, HEIGHT - 44 - 16, bx, HEIGHT - 44 - 2);
    drawLabel(ctx, 'Click to open your browser', WIDTH / 2, HEIGHT - 44 - 32, 18, TEXT_WHITE);

    saveCanvas(canvas, 'open_browser', 'screen');
  }
}

// 9. restart_computer
function genRestartComputer() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();
    drawMousePlaceholder(ctx);
    saveCanvas(canvas, 'restart_computer', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    // Start menu mockup
    drawRoundedRect(ctx, 100, 30, 400, 320, 10, '#2d2d44', null);

    ctx.fillStyle = TEXT_WHITE;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Start Menu', 300, 60);

    // App tiles (dummy)
    [[140, 100],[240,100],[340,100],[440,100],
     [140, 180],[240,180],[340,180],[440,180]].forEach(([tx, ty]) => {
      drawRoundedRect(ctx, tx - 36, ty - 28, 72, 56, 8, '#3a3a5a', null);
    });

    // Power icon area
    const px = 300, py = 280;
    drawRoundedRect(ctx, px - 44, py - 22, 88, 44, 8, '#c0392b', null);
    ctx.fillStyle = TEXT_WHITE;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏻  Power', px, py);

    drawCircleAnnotation(ctx, px, py, 52);
    drawArrow(ctx, px, py + 56, px, py + 90);
    drawLabel(ctx, 'Click Power, then Restart', WIDTH / 2, 372, 20, ANNOTATION);

    saveCanvas(canvas, 'restart_computer', 'screen');
  }
}

// 10. use_taskbar
function genUseTaskbar() {
  // --- keyboard ---
  {
    const { canvas, ctx } = makeCanvas();
    drawMousePlaceholder(ctx);
    saveCanvas(canvas, 'use_taskbar', 'keyboard');
  }

  // --- screen ---
  {
    const { canvas, ctx } = makeCanvas();

    // Desktop
    ctx.fillStyle = '#1a6bb5';
    ctx.fillRect(0, 0, WIDTH, HEIGHT - 44);

    // Full taskbar
    const tbY = HEIGHT - 44;
    ctx.fillStyle = '#202030';
    ctx.fillRect(0, tbY, WIDTH, 44);

    // START button
    ctx.fillStyle = '#3a7bd5';
    ctx.fillRect(10, tbY + 8, 28, 28);
    ctx.fillStyle = TEXT_WHITE;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⊞', 24, tbY + 22);

    // App icons (middle section)
    [110, 155, 200, 245].forEach(ix => {
      drawRoundedRect(ctx, ix - 18, tbY + 8, 36, 28, 4, '#3a3a55', null);
    });

    // Clock + wifi (right)
    ctx.fillStyle = TEXT_WHITE;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('WiFi  5:00 PM', WIDTH - 8, tbY + 22);

    // Section labels above taskbar with arrows
    const sections = [
      { label: 'Start', cx: 24 },
      { label: 'Your Apps', cx: 177 },
      { label: 'Clock & Wi-Fi', cx: WIDTH - 70 },
    ];
    sections.forEach(s => {
      ctx.fillStyle = TEXT_WHITE;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(s.label, s.cx, tbY - 34);
      drawArrow(ctx, s.cx, tbY - 30, s.cx, tbY - 4);
    });

    // Bracket lines
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    // Start bracket
    ctx.beginPath(); ctx.moveTo(10, tbY - 30); ctx.lineTo(38, tbY - 30); ctx.stroke();
    // Apps bracket
    ctx.beginPath(); ctx.moveTo(90, tbY - 30); ctx.lineTo(264, tbY - 30); ctx.stroke();
    ctx.setLineDash([]);

    drawLabel(ctx, 'The taskbar sits at the bottom of your screen', WIDTH / 2, HEIGHT / 2 - 20, 18, 'rgba(255,255,255,0.85)');

    saveCanvas(canvas, 'use_taskbar', 'screen');
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

function generateGuide(guideId) {
  switch (guideId) {
    case 'copy_paste':       return genCopyPaste();
    case 'take_screenshot':  return genTakeScreenshot();
    case 'send_email':       return genSendEmail();
    case 'open_settings':    return genOpenSettings();
    case 'zoom_text':        return genZoomText();
    case 'find_wifi':        return genFindWifi();
    case 'attach_file':      return genAttachFile();
    case 'open_browser':     return genOpenBrowser();
    case 'restart_computer': return genRestartComputer();
    case 'use_taskbar':      return genUseTaskbar();
    default:
      console.warn(`[imageGenerator] Unknown guide: ${guideId}`);
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

async function generateAllGuideImages() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const guides = [
    'copy_paste', 'take_screenshot', 'send_email', 'open_settings',
    'zoom_text', 'find_wifi', 'attach_file', 'open_browser',
    'restart_computer', 'use_taskbar',
  ];

  for (const guideId of guides) {
    generateGuide(guideId);
  }
}

module.exports = { generateAllGuideImages, generateGuide };
