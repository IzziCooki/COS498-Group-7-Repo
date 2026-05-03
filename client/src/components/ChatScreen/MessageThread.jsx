import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import SafetyBanner from './SafetyBanner';
import WelcomeBackBanner from './WelcomeBackBanner';
import EmptyState from './EmptyState';
import './MessageThread.css';

/**
 * MessageThread -- Scrollable message list with auto-scroll.
 * Handles empty state, welcome-back banners, safety banners, and typing indicator.
 *
 * @param {{
 *   messages: Array,
 *   isTyping: boolean,
 *   isConnected: boolean,
 *   welcomeBack: object|null,
 *   dismissWelcomeBack: () => void,
 *   onSendMessage: (text:string) => void,
 *   onArtifactTap: (type:string, data:any) => void,
 *   onLongPress: (message:object) => void,
 *   activeSafetyAlert: object|null,
 *   onSafetyAction: () => void,
 *   onSafetyDismiss: () => void,
 *   isViewingPast: boolean,
 * }} props
 */
function MessageThread({
  messages,
  isTyping,
  isConnected,
  welcomeBack,
  dismissWelcomeBack,
  onSendMessage,
  onArtifactTap,
  onLongPress,
  activeSafetyAlert,
  onSafetyAction,
  onSafetyDismiss,
  isViewingPast,
}) {
  const bottomRef = useRef(null);
  const [slowResponse, setSlowResponse] = useState(false);
  const slowTimerRef = useRef(null);

  // Auto-scroll to bottom on new messages or typing changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // AI response timeout: show "taking longer than usual" after 30s of typing
  useEffect(() => {
    if (isTyping) {
      slowTimerRef.current = setTimeout(() => {
        setSlowResponse(true);
      }, 30000);
    } else {
      queueMicrotask(() => setSlowResponse(false));
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
    }
    return () => {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
      }
    };
  }, [isTyping]);

  // Dismiss welcome-back when user sends first message
  useEffect(() => {
    if (messages.length > 0 && welcomeBack) {
      const hasUserMsg = messages.some((m) => m.role === 'user');
      if (hasUserMsg) dismissWelcomeBack();
    }
  }, [messages, welcomeBack, dismissWelcomeBack]);

  const isEmpty = messages.length === 0 && !welcomeBack;

  return (
    <div className="pcp-thread" role="log" aria-live="polite" aria-label="Chat messages">
      {/* Safety banner: sticky at top of thread */}
      {activeSafetyAlert && (
        <SafetyBanner
          alert={activeSafetyAlert}
          onAction={onSafetyAction}
          onDismiss={onSafetyDismiss}
        />
      )}

      <div className="pcp-thread__inner">
        {/* Connection banner */}
        {!isConnected && !isViewingPast && (
          <div className="pcp-thread__connection" role="alert" aria-live="assertive">
            Connection lost. Trying to reconnect...
          </div>
        )}

        {/* Welcome-back banner: scrolls with thread, not sticky */}
        {!isViewingPast && (
          <WelcomeBackBanner
            welcomeData={welcomeBack}
            onSendMessage={onSendMessage}
            onDismiss={dismissWelcomeBack}
          />
        )}

        {/* Empty state */}
        {isEmpty && !isViewingPast && (
          <EmptyState onSendMessage={onSendMessage} />
        )}

        {isEmpty && isViewingPast && (
          <div className="pcp-thread__readonly">
            This conversation has no messages.
          </div>
        )}

        {/* Spacer to push messages to bottom when thread is short */}
        {!isEmpty && <div className="pcp-thread__spacer" />}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onArtifactTap={onArtifactTap}
            onLongPress={onLongPress}
            onSendMessage={onSendMessage}
          />
        ))}

        {/* Typing indicator */}
        {!isViewingPast && isTyping && <TypingIndicator />}

        {/* Slow response warning (>30s) */}
        {!isViewingPast && slowResponse && (
          <div className="pcp-thread__slow-response" role="status" aria-live="polite">
            PC Pal is taking longer than usual. Please wait...
          </div>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  );
}

export default MessageThread;
