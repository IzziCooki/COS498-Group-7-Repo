import React, { useState, useRef, useCallback, useEffect } from 'react';
import './ScreenShare.css';

/**
 * ScreenShare — lets the user share their screen so the agent
 * can see what they see and guide them in real-time.
 *
 * Uses the browser's getDisplayMedia API — no relay agent needed.
 * Captures frames periodically and sends them to the server for
 * Claude Vision analysis. Also shows the screen to the buddy.
 */
function ScreenShare({ onScreenFrame, onStop }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Stable ref for onStop so we never re-create stopSharing
  const onStopRef = useRef(onStop);
  useEffect(() => { onStopRef.current = onStop; }, [onStop]);

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

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = Math.min(video.videoWidth, 1280);
    canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 JPEG (smaller than PNG)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const base64 = dataUrl.split(',')[1];

    if (onScreenFrame && base64) {
      onScreenFrame(base64);
    }
  }, [onScreenFrame]);

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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setSharing(true);

      // Capture a frame every 5 seconds for the agent
      intervalRef.current = setInterval(captureFrame, 5000);

      // Capture first frame immediately after video loads
      if (videoRef.current) {
        videoRef.current.onloadeddata = () => {
          setTimeout(captureFrame, 500);
        };
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing was cancelled. Click the button to try again.');
      } else {
        setError('Could not share your screen. Your browser may not support this feature.');
        console.error('[ScreenShare] Error:', err);
      }
    }
  }, [stopSharing, captureFrame]);

  // Auto-start when component mounts — user already clicked "Share Screen" in the header
  const didAutoStart = useRef(false);
  useEffect(() => {
    if (!didAutoStart.current) {
      didAutoStart.current = true;
      // Defer to avoid setState-in-effect lint rule
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
      {/* Hidden video + canvas for frame capture */}
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default ScreenShare;
