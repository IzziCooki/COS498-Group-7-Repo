import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../hooks/useChat';
import ChatTopBar from './ChatTopBar';
import MessageThread from './MessageThread';
import InputArea from './InputArea';
import ChatOptionsSheet from './ChatOptionsSheet';
import MessageContextSheet from './MessageContextSheet';
import FeedbackModal from '../Chat/FeedbackModal';
import ConnectComputer from '../Chat/ConnectComputer';
import ScreenShare from '../Chat/ScreenShare';
import ArtifactOverlay from '../Artifacts/ArtifactOverlay';
import './ChatScreen.css';

/**
 * ChatScreen — The primary chat orchestrator, replacing ChatWindow.
 *
 * Uses the existing useChat hook for all WS communication.
 * Renders the D2-spec chat screen with:
 *   - ChatTopBar (with ⋯ menu button)
 *   - MessageThread (scrollable message list)
 *   - InputArea (textarea + send + Get Help)
 *   - ChatOptionsSheet (bottom sheet)
 *   - MessageContextSheet (long-press menu)
 *   - SafetyBanner (via MessageThread)
 *   - WelcomeBackBanner (via MessageThread)
 *   - EmptyState (via MessageThread)
 *   - FeedbackModal (end-of-chat rating)
 *
 * @param {{
 *   userId: string,
 *   hasBuddy: boolean,
 *   viewingConversationId: string|null,
 *   onConversationChange: () => void,
 *   startNewChatRef: React.MutableRefObject,
 *   buddySessionTarget: string|null,
 *   onBuddySessionChange: (active:boolean) => void,
 * }} props
 */
function ChatScreen({
  userId,
  hasBuddy,
  viewingConversationId,
  onConversationChange,
  startNewChatRef,
  buddySessionTarget,
  onBuddySessionChange,
  navigate,
  onLogout,
}) {
  const {
    messages: liveMessages,
    sendMessage,
    gatherResources,
    isConnected,
    isTyping,
    welcomeBack,
    dismissWelcomeBack,
    conversationId,
    feedbackPrompt,
    startNewChat,
    endChat,
    submitFeedback,
    skipFeedback,
    buddySession,
    buddyObserving,
    joinBuddySession,
    leaveBuddySession,
    pairAgent,
    agentConnected,
    sendScreenFrame,
  } = useChat(userId);

  // ── Sheet state ──
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [contextMessage, setContextMessage] = useState(null);

  // ── ConnectComputer / ScreenShare overlay state ──
  const [showConnect, setShowConnect] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);

  // ── Artifact overlay state (Phase 4) ──
  const [openArtifact, setOpenArtifact] = useState(null);

  // ── Safety alert state (dismiss locally) ──
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Expose startNewChat to parent via ref
  useEffect(() => {
    if (startNewChatRef) startNewChatRef.current = startNewChat;
  }, [startNewChat, startNewChatRef]);

  // ── Buddy session wiring (same as old ChatWindow) ──
  const prevBuddyTargetRef = useRef(null);
  useEffect(() => {
    if (buddySessionTarget && buddySessionTarget !== prevBuddyTargetRef.current) {
      joinBuddySession(buddySessionTarget);
    } else if (!buddySessionTarget && prevBuddyTargetRef.current) {
      leaveBuddySession(prevBuddyTargetRef.current);
    }
    prevBuddyTargetRef.current = buddySessionTarget;
  }, [buddySessionTarget, joinBuddySession, leaveBuddySession]);

  useEffect(() => {
    if (onBuddySessionChange) onBuddySessionChange(!!buddySession);
  }, [buddySession, onBuddySessionChange]);

  // ── Past conversation viewing ──
  const [pastMessages, setPastMessages] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const isViewingPast = !!(viewingConversationId && viewingConversationId !== conversationId);

  useEffect(() => {
    if (!isViewingPast || !viewingConversationId) {
      queueMicrotask(() => setPastMessages([]));
      return;
    }
    queueMicrotask(() => setLoadingPast(true));
    fetch(`/api/conversations/${viewingConversationId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        const formatted = data.map((m, i) => ({
          id: i + 1,
          role: m.role,
          text: m.body,
          timestamp: m.created_at,
        }));
        setPastMessages(formatted);
      })
      .catch(() => setPastMessages([]))
      .finally(() => setLoadingPast(false));
  }, [viewingConversationId, isViewingPast]);

  // ── Notify parent when live conversation changes ──
  const prevConvIdRef = useRef(conversationId);
  useEffect(() => {
    if (conversationId && conversationId !== prevConvIdRef.current) {
      prevConvIdRef.current = conversationId;
      if (onConversationChange) onConversationChange();
    }
  }, [conversationId, onConversationChange]);

  const messages = isViewingPast ? pastMessages : liveMessages;
  const hasUserMessage = messages.some((m) => m.role === 'user');

  // ── Find the most recent active safety alert ──
  const activeSafetyAlert = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].safetyAlert && !dismissedAlerts.has(messages[i].id)) {
        return messages[i].safetyAlert;
      }
    }
    return null;
  })();

  const handleSafetyAction = useCallback(() => {
    sendMessage('Tell me what to do about this safety concern.');
    // Dismiss the alert after action
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].safetyAlert && !dismissedAlerts.has(messages[i].id)) {
        setDismissedAlerts((prev) => new Set([...prev, messages[i].id]));
        break;
      }
    }
  }, [sendMessage, messages, dismissedAlerts]);

  const handleSafetyDismiss = useCallback(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].safetyAlert && !dismissedAlerts.has(messages[i].id)) {
        setDismissedAlerts((prev) => new Set([...prev, messages[i].id]));
        break;
      }
    }
  }, [messages, dismissedAlerts]);

  // ── Artifact tap handler (Phase 4: full overlay) ──
  const handleArtifactTap = useCallback((type, data) => {
    setOpenArtifact({ type, data });
  }, []);

  const handleArtifactClose = useCallback(() => {
    setOpenArtifact(null);
  }, []);

  // ── Long-press handler ──
  const handleLongPress = useCallback((message) => {
    setContextMessage(message);
  }, []);

  return (
    <div className="pcp-chat-screen">
      {/* Top bar area with ⋯ button */}
      <div className="pcp-chat-screen__topbar">
        <ChatTopBar
          onOpenOptions={() => setOptionsOpen(true)}
          buddyObserving={buddyObserving}
        />
      </div>

      {/* Loading past conversation */}
      {loadingPast && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-2)',
        }} role="status">
          Loading conversation...
        </div>
      )}

      {/* Message thread */}
      {!loadingPast && (
        <MessageThread
          messages={messages}
          isTyping={isTyping}
          isConnected={isConnected}
          welcomeBack={welcomeBack}
          dismissWelcomeBack={dismissWelcomeBack}
          onSendMessage={sendMessage}
          onArtifactTap={handleArtifactTap}
          onLongPress={handleLongPress}
          activeSafetyAlert={activeSafetyAlert}
          onSafetyAction={handleSafetyAction}
          onSafetyDismiss={handleSafetyDismiss}
          isViewingPast={isViewingPast}
        />
      )}

      {/* Input area or read-only banner */}
      {isViewingPast ? (
        <div className="pcp-chat-screen__readonly">
          This is a past conversation.
        </div>
      ) : (
        <InputArea
          onSend={sendMessage}
          onGatherResources={gatherResources}
          isTyping={isTyping}
          onConnectComputer={() => setShowConnect(true)}
          onScreenShare={() => setShowScreenShare(true)}
          agentConnected={agentConnected}
        />
      )}

      {/* Feedback modal */}
      {!isViewingPast && feedbackPrompt && (
        <FeedbackModal onSubmit={submitFeedback} onSkip={skipFeedback} />
      )}

      {/* Chat options bottom sheet */}
      <ChatOptionsSheet
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        onEndChat={endChat}
        hasMessages={hasUserMessage}
        onConnectComputer={() => { setOptionsOpen(false); setShowConnect(true); }}
        onScreenShare={() => { setOptionsOpen(false); setShowScreenShare(true); }}
        agentConnected={agentConnected}
        navigate={navigate}
        onLogout={onLogout}
      />

      {/* Long-press context sheet */}
      <MessageContextSheet
        message={contextMessage}
        onClose={() => setContextMessage(null)}
        hasBuddy={hasBuddy}
        onSendMessage={sendMessage}
      />

      {/* Artifact overlay (Phase 4) */}
      {openArtifact && (
        <ArtifactOverlay
          type={openArtifact.type}
          data={openArtifact.data}
          onClose={handleArtifactClose}
          onSendMessage={sendMessage}
        />
      )}

      {/* ConnectComputer overlay */}
      {showConnect && (
        <div className="pcp-chat-screen__overlay">
          <ConnectComputer
            isConnected={agentConnected}
            onPair={pairAgent}
          />
          <button
            type="button"
            className="pcp-chat-screen__overlay-close"
            onClick={() => setShowConnect(false)}
            aria-label="Close connect computer"
          >
            &#10005;
          </button>
        </div>
      )}

      {/* ScreenShare overlay */}
      {showScreenShare && (
        <div className="pcp-chat-screen__overlay">
          <ScreenShare
            onScreenFrame={sendScreenFrame}
            onStop={() => setShowScreenShare(false)}
          />
          <button
            type="button"
            className="pcp-chat-screen__overlay-close"
            onClick={() => setShowScreenShare(false)}
            aria-label="Close screen share"
          >
            &#10005;
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatScreen;
