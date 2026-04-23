import React, { useState, useRef, useCallback, useEffect } from 'react';
import './ScreenShare.css';

/**
 * Capture a frame from a MediaStream track.
 *
 * Strategy 1: ImageCapture API (Chrome/Edge) — grabs directly from the
 *   track's decoder, no video element needed.
 * Strategy 2: video + OffscreenCanvas — draws from a video element.
 * Strategy 3: video + regular canvas — legacy fallback.
 *
 * Returns a base64 JPEG string, or null if the frame is black/empty.
 */
async function grabFrame(stream, videoEl) {
  const track = stream.getVideoTracks()[0];
  if (!track || track.readyState !== 'live') return null;

  let bitmap = null;

  // Strategy 1: ImageCapture (most reliable — no video element rendering needed)
  if (typeof ImageCapture !== 'undefined') {
    try {
      const capture = new ImageCapture(track);
      bitmap = await capture.grabFrame();
    } catch {
      // ImageCapture can fail on some tracks — fall through
    }
  }

  // Strategy 2 & 3: draw from video element
  if (!bitmap && videoEl && videoEl.videoWidth > 0) {
    bitmap = await createImageBitmap(videoEl);
  }

  if (!bitmap || bitmap.width === 0 || bitmap.height === 0) return null;

  // Draw bitmap to a canvas to extract base64
  const w = Math.min(bitmap.width, 1280);
  const h = Math.round(w * (bitmap.height / bitmap.width));

  let canvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(w, h);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // Black-frame detection: sample pixels across the image
  const imgData = ctx.getImageData(0, 0, w, h).data;
  let nonBlack = 0;
  const step = Math.max(1, Math.floor(imgData.length / 400)); // sample ~100 pixels
  for (let i = 0; i < imgData.length; i += step * 4) {
    if (imgData[i] > 5 || imgData[i + 1] > 5 || imgData[i + 2] > 5) {
      nonBlack++;
      if (nonBlack > 3) break; // enough — it's not black
    }
  }
  if (nonBlack <= 3) {
    console.warn('[ScreenShare] Black frame detected, skipping');
    return null;
  }

  // Convert to base64 JPEG
  if (canvas instanceof OffscreenCanvas) {
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }
  return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
}

/**
 * ScreenShare — lets the user share their screen so the agent
 * can see what they see and guide them in real-time.
 *
 * Uses the browser's getDisplayMedia API — no relay agent needed.
 * Captures frames periodically and sends them to the server for
 * Claude Vision analysis.
 */
function ScreenShare({ onScreenFrame, onStop }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // Stable ref for onStop so we never re-create stopSharing
  const onStopRef = useRef(onStop);
  useEffect(() => { onStopRef.current = onStop; }, [onStop]);

  // Stable ref for onScreenFrame
  const onFrameRef = useRef(onScreenFrame);
  useEffect(() => { onFrameRef.current = onScreenFrame; }, [onScreenFrame]);

  const stopSharing = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setSharing(false);
    if (onStopRef.current) onStopRef.current();
  }, []);

  // Clean up on unmount only
  useEffect(() => () => stopSharing(), [stopSharing]);

  const captureAndSend = useCallback(async () => {
    if (!streamRef.current) return;
    try {
      const base64 = await grabFrame(streamRef.current, videoRef.current);
      if (base64 && onFrameRef.current) {
        onFrameRef.current(base64);
      }
    } catch (err) {
      console.error('[ScreenShare] Frame capture error:', err);
    }
  }, []);

  const startSharing = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      streamRef.current = stream;

      // If user stops sharing via browser controls
      stream.getVideoTracks()[0].addEventListener('ended', stopSharing);

      // Attach to video element as fallback for grabFrame
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setSharing(true);

      // Wait for the stream to produce actual frames before first capture
      setTimeout(captureAndSend, 1500);

      // Then capture every 5 seconds
      intervalRef.current = setInterval(captureAndSend, 5000);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing was cancelled. Click the button to try again.');
      } else {
        setError('Could not share your screen. Your browser may not support this feature.');
        console.error('[ScreenShare] Error:', err);
      }
    }
  }, [stopSharing, captureAndSend]);

  // Auto-start when component mounts
  const didAutoStart = useRef(false);
  useEffect(() => {
    if (!didAutoStart.current) {
      didAutoStart.current = true;
      queueMicrotask(startSharing);
    }
  }, [startSharing]);

  return (
    <div className="screen-share">
      {!sharing ? (
        <div className="screen-share__prompt">
          {error ? (
            <>
              <p className="screen-share__error">{error}</p>
              <button className="screen-share__start-btn" onClick={startSharing}>
                Try Again
              </button>
            </>
          ) : (
            <p className="screen-share__hint">Starting screen share...</p>
          )}
        </div>
      ) : (
        <div className="screen-share__active">
          <div className="screen-share__status">
            <span className="screen-share__live-dot" />
            <span>PC Pal can see your screen</span>
            <button className="screen-share__stop-btn" onClick={stopSharing}>
              Stop
            </button>
          </div>
        </div>
      )}
      {/* Fallback video element for browsers without ImageCapture.
          Positioned off-screen at full size — no clip, no tiny dimensions.
          Browsers must decode frames for drawImage/createImageBitmap. */}
      <video ref={videoRef} autoPlay playsInline muted className="screen-share__offscreen-video" />
    </div>
  );
}

export default ScreenShare;
