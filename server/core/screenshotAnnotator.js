/**
 * Screenshot Annotator
 *
 * Takes a screenshot (base64 PNG), target coordinates, and a label,
 * then draws a spotlight circle, arrow, and label text on the image.
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');

/**
 * Annotate a screenshot with a spotlight on the target location.
 *
 * @param {string} imageBase64 - Base64-encoded PNG screenshot
 * @param {Array<{x: number, y: number, label: string}>} targets - Points to highlight
 * @returns {Promise<string>} Base64-encoded annotated PNG
 */
async function annotateScreenshot(imageBase64, targets) {
  const imgBuffer = Buffer.from(imageBase64, 'base64');
  const img = await loadImage(imgBuffer);
  const { width, height } = img;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Draw the original screenshot
  ctx.drawImage(img, 0, 0);

  // Dim overlay — makes the highlighted areas pop
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, width, height);

  // Cut out bright circles at each target
  ctx.globalCompositeOperation = 'destination-out';
  for (const target of targets) {
    const radius = Math.max(50, Math.min(width, height) * 0.04);
    ctx.beginPath();
    ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw annotations on top
  ctx.globalCompositeOperation = 'source-over';

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const radius = Math.max(50, Math.min(width, height) * 0.04);

    // Red ring around the target
    ctx.strokeStyle = '#FF3333';
    ctx.lineWidth = Math.max(4, width * 0.003);
    ctx.beginPath();
    ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Second ring for visibility
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(2, width * 0.0015);
    ctx.beginPath();
    ctx.arc(target.x, target.y, radius + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Label with background
    if (target.label) {
      const fontSize = Math.max(18, Math.min(width * 0.018, 32));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;

      // Position label — prefer to the right, fall back to left if near edge
      const labelMetrics = ctx.measureText(target.label);
      const labelPadding = 10;
      const labelWidth = labelMetrics.width + labelPadding * 2;
      const labelHeight = fontSize + labelPadding * 2;

      let labelX = target.x + radius + 15;
      let labelY = target.y - labelHeight / 2;

      // Avoid going off-screen
      if (labelX + labelWidth > width - 10) labelX = target.x - radius - labelWidth - 15;
      if (labelY < 10) labelY = 10;
      if (labelY + labelHeight > height - 10) labelY = height - labelHeight - 10;

      // Step number circle (if multiple targets)
      if (targets.length > 1) {
        const numRadius = fontSize * 0.7;
        ctx.fillStyle = '#FF3333';
        ctx.beginPath();
        ctx.arc(labelX - numRadius - 5, labelY + labelHeight / 2, numRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${fontSize * 0.8}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), labelX - numRadius - 5, labelY + labelHeight / 2);
      }

      // Label background
      ctx.fillStyle = 'rgba(255, 51, 51, 0.9)';
      const bgRadius = 8;
      ctx.beginPath();
      ctx.moveTo(labelX + bgRadius, labelY);
      ctx.lineTo(labelX + labelWidth - bgRadius, labelY);
      ctx.quadraticCurveTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + bgRadius);
      ctx.lineTo(labelX + labelWidth, labelY + labelHeight - bgRadius);
      ctx.quadraticCurveTo(labelX + labelWidth, labelY + labelHeight, labelX + labelWidth - bgRadius, labelY + labelHeight);
      ctx.lineTo(labelX + bgRadius, labelY + labelHeight);
      ctx.quadraticCurveTo(labelX, labelY + labelHeight, labelX, labelY + labelHeight - bgRadius);
      ctx.lineTo(labelX, labelY + bgRadius);
      ctx.quadraticCurveTo(labelX, labelY, labelX + bgRadius, labelY);
      ctx.fill();

      // Label text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(target.label, labelX + labelPadding, labelY + labelPadding);
    }
  }

  // Return as base64 PNG
  const annotatedBuffer = canvas.toBuffer('image/png');
  return annotatedBuffer.toString('base64');
}

module.exports = { annotateScreenshot };
