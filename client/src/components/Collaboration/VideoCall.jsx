import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VideoCall.css';

/**
 * VideoCall -- peer-to-peer video call between buddies via WebRTC.
 * Uses the existing WebSocket for signaling (no extra server needed).
 * Designed with large controls for elderly users.
 *
 * Phase 7: responsive design, full-screen on phone, floating on desktop,
 * self-preview in corner, auto-hide controls, connection states, incoming call screen.
 */

const CONNECTION_STATES = {
  IDLE: 'idle',
  INCOMING: 'incoming',
  CALLING: 'calling',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  BAD_CONNECTION: 'bad_connection',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
  ERROR: 'error',
};

const CONTROL_HIDE_DELAY = 3000;

const SELF_PREVIEW_CORNERS = {
  'bottom-right': { bottom: '16px', right: '16px' },
  'bottom-left': { bottom: '16px', left: '16px' },
  'top-right': { top: '16px', right: '16px' },
  'top-left': { top: '16px', left: '16px' },
};

function VideoCall({
  userId,
  buddyName,
  buddyAvatar,
  buddyRelation,
  onClose,
  incomingCall,
  onAcceptCall,
  onDeclineCall,
}) {
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

  const [status, setStatus] = useState(
    incomingCall ? CONNECTION_STATES.INCOMING : CONNECTION_STATES.IDLE
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [selfPreviewCorner, setSelfPreviewCorner] = useState('bottom-right');
  const [reconnectCountdown] = useState(0);
  const [callTimer, setCallTimer] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const controlTimerRef = useRef(null);
  const callTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const containerRef = useRef(null);

  const displayName = buddyName || 'your buddy';

  // ---- Call timer ----
  useEffect(() => {
    if (status === CONNECTION_STATES.CONNECTED) {
      callTimerRef.current = setInterval(() => {
        setCallTimer((t) => t + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [status]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ---- Auto-hide controls ----
  const resetControlTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlTimerRef.current) clearTimeout(controlTimerRef.current);
    if (
      status === CONNECTION_STATES.CONNECTED ||
      status === CONNECTION_STATES.BAD_CONNECTION
    ) {
      controlTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, CONTROL_HIDE_DELAY);
    }
  }, [status]);

  useEffect(() => {
    if (
      status === CONNECTION_STATES.CONNECTED ||
      status === CONNECTION_STATES.BAD_CONNECTION
    ) {
      resetControlTimer();
    } else {
      setControlsVisible(true);
      if (controlTimerRef.current) clearTimeout(controlTimerRef.current);
    }
    return () => {
      if (controlTimerRef.current) clearTimeout(controlTimerRef.current);
    };
  }, [status, resetControlTimer]);

  const handleScreenTap = useCallback(() => {
    if (
      status === CONNECTION_STATES.CONNECTED ||
      status === CONNECTION_STATES.BAD_CONNECTION
    ) {
      resetControlTimer();
    }
  }, [status, resetControlTimer]);

  // ---- Self-preview corner snap ----
  const cycleSelfPreviewCorner = useCallback(() => {
    const corners = Object.keys(SELF_PREVIEW_CORNERS);
    setSelfPreviewCorner((prev) => {
      const idx = corners.indexOf(prev);
      return corners[(idx + 1) % corners.length];
    });
  }, []);

  // ---- Cleanup ----
  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  // ---- WebRTC signaling ----
  useEffect(() => {
    const ws = wsRef?.current;
    if (!ws) return;

    const handler = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'video_signal') {
        if (!peerRef.current) {
          startCall(false, msg.signal);
        } else {
          peerRef.current.signal(msg.signal);
        }
      } else if (msg.type === 'video_end') {
        setStatus(CONNECTION_STATES.IDLE);
        cleanup();
      }
    };

    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [wsRef, cleanup]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCall = async (initiator, incomingSignal) => {
    try {
      setStatus(CONNECTION_STATES.CONNECTING);
      setErrorMsg('');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

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
        const ws = wsRef?.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'video_signal', signal }));
        }
      });

      peer.on('stream', (remoteStream) => {
        setStatus(CONNECTION_STATES.CONNECTED);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('close', () => {
        setStatus(CONNECTION_STATES.IDLE);
        cleanup();
      });

      peer.on('error', (err) => {
        console.error('[VideoCall] Peer error:', err.message);
        setStatus(CONNECTION_STATES.FAILED);
        setErrorMsg('Could not connect. Please try again.');
        cleanup();
      });

      if (incomingSignal) {
        peer.signal(incomingSignal);
      }

      peerRef.current = peer;
    } catch (err) {
      console.error('[VideoCall] Setup error:', err);
      setStatus(CONNECTION_STATES.ERROR);
      if (err.name === 'NotAllowedError') {
        setErrorMsg(
          'Camera/microphone permission denied. Check your browser settings.'
        );
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
    setStatus(CONNECTION_STATES.IDLE);
    cleanup();
    if (onClose) onClose();
  };

  const handleAccept = () => {
    if (onAcceptCall) onAcceptCall();
    startCall(false);
  };

  const handleDecline = () => {
    if (onDeclineCall) onDeclineCall();
    if (onClose) onClose();
  };

  const handleRetry = () => startCall(true);

  const handleSendMessage = () => {
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

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
      setIsSpeakerOff(!isSpeakerOff);
    }
  };

  const toggleChat = () => setShowChat(!showChat);

  // ---- Incoming Call Screen ----
  if (status === CONNECTION_STATES.INCOMING) {
    return (
      <div
        className="pcp-video-call pcp-video-call--fullscreen"
        role="dialog"
        aria-label={`Incoming call from ${displayName}`}
        aria-modal="true"
      >
        <div className="pcp-video-call__incoming">
          <div className="pcp-video-call__incoming-avatar" aria-hidden="true">
            {buddyAvatar ? (
              <img
                src={buddyAvatar}
                alt=""
                className="pcp-video-call__incoming-avatar-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="pcp-video-call__incoming-avatar-initials">
                {(buddyName || 'B').charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="pcp-video-call__incoming-name">
            {displayName} is calling
          </h1>

          {buddyRelation && (
            <p className="pcp-video-call__incoming-relation">{buddyRelation}</p>
          )}

          <div className="pcp-video-call__incoming-actions">
            <button
              className="pcp-video-call__incoming-btn pcp-video-call__incoming-btn--answer"
              onClick={handleAccept}
              aria-label={`Answer call from ${displayName}`}
            >
              <span className="pcp-video-call__incoming-btn-icon" aria-hidden="true">
                T
              </span>
              <span className="pcp-video-call__incoming-btn-label">Answer</span>
            </button>
            <button
              className="pcp-video-call__incoming-btn pcp-video-call__incoming-btn--decline"
              onClick={handleDecline}
              aria-label={`Decline call from ${displayName}`}
            >
              <span className="pcp-video-call__incoming-btn-icon" aria-hidden="true">
                X
              </span>
              <span className="pcp-video-call__incoming-btn-label">Decline</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Failed State ----
  if (status === CONNECTION_STATES.FAILED) {
    return (
      <div
        className="pcp-video-call pcp-video-call--fullscreen"
        role="dialog"
        aria-label="Call failed"
        aria-modal="true"
      >
        <div className="pcp-video-call__failed">
          <div className="pcp-video-call__failed-icon" aria-hidden="true">!</div>
          <h1 className="pcp-video-call__failed-title">
            Couldn&apos;t connect
          </h1>
          <p className="pcp-video-call__failed-text">
            {errorMsg || 'Something went wrong. Please try again.'}
          </p>
          <div className="pcp-video-call__failed-actions">
            <button
              className="pcp-btn pcp-btn--primary pcp-btn--hero"
              onClick={handleRetry}
              aria-label="Try calling again"
            >
              Try again
            </button>
            <button
              className="pcp-btn pcp-btn--ghost"
              onClick={handleSendMessage}
              aria-label="Send a message instead"
            >
              Send a message instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Idle / Error (pre-call) ----
  if (status === CONNECTION_STATES.IDLE || status === CONNECTION_STATES.ERROR) {
    return (
      <div
        className="pcp-video-call pcp-video-call--fullscreen"
        role="dialog"
        aria-label={`Call ${displayName}`}
        aria-modal="true"
      >
        <div className="pcp-video-call__precall">
          <div className="pcp-video-call__precall-avatar" aria-hidden="true">
            {buddyAvatar ? (
              <img
                src={buddyAvatar}
                alt=""
                className="pcp-video-call__precall-avatar-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="pcp-video-call__precall-avatar-initials">
                {(buddyName || 'B').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="pcp-video-call__precall-name">
            Call {displayName}
          </h1>

          {status === CONNECTION_STATES.ERROR && errorMsg && (
            <div
              className="pcp-video-call__error-banner"
              role="alert"
            >
              {errorMsg}
            </div>
          )}

          <button
            className="pcp-video-call__start-btn"
            onClick={handleCall}
            aria-label={`Start video call with ${displayName}`}
          >
            Start Call
          </button>
          <button
            className="pcp-video-call__close-precall"
            onClick={() => onClose && onClose()}
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ---- Active Call (connecting / connected / bad_connection / reconnecting) ----
  const isActive =
    status === CONNECTION_STATES.CONNECTING ||
    status === CONNECTION_STATES.CONNECTED ||
    status === CONNECTION_STATES.BAD_CONNECTION ||
    status === CONNECTION_STATES.RECONNECTING ||
    status === CONNECTION_STATES.CALLING;

  return (
    <div
      className="pcp-video-call pcp-video-call--fullscreen pcp-video-call--active"
      role="dialog"
      aria-label={`Video call with ${displayName}`}
      aria-modal="true"
      onClick={handleScreenTap}
      ref={containerRef}
    >
      {/* ---- Top Bar ---- */}
      <div
        className={`pcp-video-call__top-bar ${
          controlsVisible ? '' : 'pcp-video-call__top-bar--hidden'
        }`}
      >
        <span className="pcp-video-call__top-name">{displayName}</span>
        <span className="pcp-video-call__top-timer" aria-live="off">
          {status === CONNECTION_STATES.CONNECTED
            ? formatTime(callTimer)
            : status === CONNECTION_STATES.CONNECTING || status === CONNECTION_STATES.CALLING
            ? 'Connecting...'
            : ''}
        </span>
      </div>

      {/* ---- Connection Banners ---- */}
      {status === CONNECTION_STATES.BAD_CONNECTION && (
        <div className="pcp-video-call__banner pcp-video-call__banner--warning" role="alert">
          Connection is poor -- your video may freeze.
          <button
            className="pcp-video-call__banner-action"
            onClick={toggleVideo}
            aria-label="Switch to audio only"
          >
            Switch to audio only
          </button>
        </div>
      )}

      {status === CONNECTION_STATES.RECONNECTING && (
        <div className="pcp-video-call__banner pcp-video-call__banner--info" role="alert">
          Trying to reconnect...
          {reconnectCountdown > 0 && ` (${reconnectCountdown}s)`}
        </div>
      )}

      {(status === CONNECTION_STATES.CONNECTING || status === CONNECTION_STATES.CALLING) && (
        <div className="pcp-video-call__connecting-overlay">
          <div className="pcp-video-call__spinner" aria-hidden="true" />
          <span className="pcp-video-call__connecting-text">
            Connecting...
          </span>
        </div>
      )}

      {/* ---- Remote Video ---- */}
      <div className="pcp-video-call__remote-feed">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="pcp-video-call__video"
          aria-label={`${displayName}'s video`}
        />
      </div>

      {/* ---- Self Preview ---- */}
      {isActive && (
        <button
          className="pcp-video-call__self-preview"
          style={SELF_PREVIEW_CORNERS[selfPreviewCorner]}
          onClick={(e) => {
            e.stopPropagation();
            cycleSelfPreviewCorner();
          }}
          aria-label="Your camera preview. Tap to move to a different corner."
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="pcp-video-call__self-video"
          />
        </button>
      )}

      {/* ---- Control Bar ---- */}
      <div
        className={`pcp-video-call__controls ${
          controlsVisible ? '' : 'pcp-video-call__controls--hidden'
        }`}
      >
        <div className="pcp-video-call__controls-inner">
          <button
            className={`pcp-video-call__ctrl-btn ${
              isMuted ? 'pcp-video-call__ctrl-btn--active' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={isMuted}
          >
            <span className="pcp-video-call__ctrl-icon" aria-hidden="true">
              {isMuted ? 'MX' : 'MIC'}
            </span>
            <span className="pcp-video-call__ctrl-label">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          <button
            className={`pcp-video-call__ctrl-btn ${
              isVideoOff ? 'pcp-video-call__ctrl-btn--active' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleVideo();
            }}
            aria-label={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
            aria-pressed={isVideoOff}
          >
            <span className="pcp-video-call__ctrl-icon" aria-hidden="true">
              {isVideoOff ? 'CX' : 'CAM'}
            </span>
            <span className="pcp-video-call__ctrl-label">
              {isVideoOff ? 'Camera On' : 'Camera'}
            </span>
          </button>

          <button
            className={`pcp-video-call__ctrl-btn ${
              isSpeakerOff ? 'pcp-video-call__ctrl-btn--active' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleSpeaker();
            }}
            aria-label={isSpeakerOff ? 'Turn speaker on' : 'Turn speaker off'}
            aria-pressed={isSpeakerOff}
          >
            <span className="pcp-video-call__ctrl-icon" aria-hidden="true">
              {isSpeakerOff ? 'SX' : 'SPK'}
            </span>
            <span className="pcp-video-call__ctrl-label">
              {isSpeakerOff ? 'Speaker On' : 'Speaker'}
            </span>
          </button>

          <button
            className={`pcp-video-call__ctrl-btn ${
              showChat ? 'pcp-video-call__ctrl-btn--active' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleChat();
            }}
            aria-label={showChat ? 'Close chat' : 'Open chat'}
            aria-pressed={showChat}
          >
            <span className="pcp-video-call__ctrl-icon" aria-hidden="true">
              CHT
            </span>
            <span className="pcp-video-call__ctrl-label">Chat</span>
          </button>

          <button
            className="pcp-video-call__ctrl-btn pcp-video-call__ctrl-btn--end"
            onClick={(e) => {
              e.stopPropagation();
              handleHangUp();
            }}
            aria-label="End call"
          >
            <span className="pcp-video-call__ctrl-icon" aria-hidden="true">
              END
            </span>
            <span className="pcp-video-call__ctrl-label">End</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;
