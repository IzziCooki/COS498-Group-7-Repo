import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VideoCall.css';

/**
 * VideoCall — peer-to-peer video call between buddies via WebRTC.
 * Uses the existing WebSocket for signaling (no extra server needed).
 * Designed with large controls for elderly users.
 */
function VideoCall({ userId, buddyName, onClose }) {
  // Create a dedicated WebSocket for video signaling
  const wsRef = useRef(null);
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(url);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'init', userId }));
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [userId]);
  const [status, setStatus] = useState('idle'); // idle | calling | connected | error
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => cleanup, [cleanup]);

  // Listen for incoming WebRTC signals
  useEffect(() => {
    const ws = wsRef?.current;
    if (!ws) return;

    const handler = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      if (msg.type === 'video_signal') {
        // Incoming signal — either an offer/answer or ICE candidate
        if (!peerRef.current) {
          // We're receiving a call — set up as non-initiator
          startCall(false, msg.signal);
        } else {
          peerRef.current.signal(msg.signal);
        }
      } else if (msg.type === 'video_end') {
        setStatus('idle');
        cleanup();
      }
    };

    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [wsRef, cleanup]);

  const startCall = async (initiator, incomingSignal) => {
    try {
      setStatus('calling');
      setErrorMsg('');

      // Get camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Dynamic import for simple-peer (browser-only)
      const SimplePeer = (await import('simple-peer')).default;

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      peer.on('signal', (signal) => {
        // Send signal to buddy via WebSocket
        const ws = wsRef?.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'video_signal', signal }));
        }
      });

      peer.on('stream', (remoteStream) => {
        setStatus('connected');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('close', () => {
        setStatus('idle');
        cleanup();
      });

      peer.on('error', (err) => {
        console.error('[VideoCall] Peer error:', err.message);
        setStatus('error');
        setErrorMsg('Connection failed. Make sure your buddy is online.');
        cleanup();
      });

      // If we received an incoming signal, process it
      if (incomingSignal) {
        peer.signal(incomingSignal);
      }

      peerRef.current = peer;
    } catch (err) {
      console.error('[VideoCall] Setup error:', err);
      setStatus('error');
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera/microphone permission denied. Check your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera or microphone found on this device.');
      } else {
        setErrorMsg('Could not start the video call. Please try again.');
      }
    }
  };

  const handleCall = () => startCall(true);

  const handleHangUp = () => {
    const ws = wsRef?.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'video_end' }));
    }
    setStatus('idle');
    cleanup();
    if (onClose) onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="video-call">
      <div className="video-call__header">
        <span className="video-call__title">
          {status === 'connected' ? `Talking with ${buddyName || 'your buddy'}` :
           status === 'calling' ? 'Connecting...' :
           `Call ${buddyName || 'your buddy'}`}
        </span>
        <button className="video-call__close" onClick={handleHangUp}>X</button>
      </div>

      <div className="video-call__screens">
        {/* Remote video (buddy) — large */}
        <div className="video-call__remote">
          {status === 'connected' ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="video-call__video" />
          ) : status === 'calling' ? (
            <div className="video-call__placeholder">Waiting for {buddyName || 'buddy'} to answer...</div>
          ) : status === 'error' ? (
            <div className="video-call__placeholder video-call__placeholder--error">{errorMsg}</div>
          ) : (
            <div className="video-call__placeholder">Click "Start Call" to connect with {buddyName || 'your buddy'}</div>
          )}
        </div>

        {/* Local video (you) — small overlay */}
        {(status === 'calling' || status === 'connected') && (
          <div className="video-call__local">
            <video ref={localVideoRef} autoPlay playsInline muted className="video-call__video video-call__video--local" />
          </div>
        )}
      </div>

      <div className="video-call__controls">
        {status === 'idle' || status === 'error' ? (
          <button className="video-call__call-btn" onClick={handleCall}>
            Start Call
          </button>
        ) : (
          <>
            <button
              className={`video-call__ctrl-btn ${isMuted ? 'video-call__ctrl-btn--off' : ''}`}
              onClick={toggleMute}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button className="video-call__hangup-btn" onClick={handleHangUp}>
              End Call
            </button>
            <button
              className={`video-call__ctrl-btn ${isVideoOff ? 'video-call__ctrl-btn--off' : ''}`}
              onClick={toggleVideo}
            >
              {isVideoOff ? 'Camera On' : 'Camera Off'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VideoCall;
