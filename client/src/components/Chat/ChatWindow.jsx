import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import StepSequencePanel from './StepSequencePanel';
import WelcomeBackBanner from './WelcomeBackBanner';
import FeedbackModal from './FeedbackModal';
import ConnectComputer from './ConnectComputer';
import SidePanel from './SidePanel';
import BuddyTerminal from '../Collaboration/BuddyTerminal';
import './ChatWindow.css';

/**
 * Extract artifacts from messages — one artifact per message (not per type).
 * A message with both findings + guide becomes one combined artifact.
 */
function collectArtifacts(messages) {
  const artifacts = [];
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    const hasAny = msg.guide || msg.resources || msg.findings || msg.videos || msg.practice;
    if (!hasAny) continue;

    artifacts.push({
      msgId: msg.id,
      guide: msg.guide || null,
      findings: msg.findings || null,
      resources: msg.resources || null,
      videos: msg.videos || null,
      practice: msg.practice || null,
    });
  }
  return artifacts;
}

function ChatWindow({ userId, hasBuddy, viewingConversationId, onConversationChange, startNewChatRef, buddySessionTarget, onBuddySessionChange }) {
  const {
    messages: liveMessages,
    sendMessage,
    gatherResources,
    pairAgent,
    agentConnected,
    runCommand,
    isConnected,
    isTyping,
    activeSequence,
    welcomeBack,
    dismissWelcomeBack,
    conversationId,
    feedbackPrompt,
    startNewChat,
    endChat,
    submitFeedback,
    skipFeedback,
    terminalHistory,
    terminalCwd,
    sendTerminalCommand,
    buddySession,
    buddyObserving,
    joinBuddySession,
    leaveBuddySession,
    sendBuddyCommand,
  } = useChat(userId);
  const bottomRef = useRef(null);

  // Expose startNewChat to parent via ref
  useEffect(() => {
    if (startNewChatRef) startNewChatRef.current = startNewChat;
  }, [startNewChat, startNewChatRef]);

  // React to buddy session target from App
  const prevBuddyTargetRef = useRef(null);
  useEffect(() => {
    if (buddySessionTarget && buddySessionTarget !== prevBuddyTargetRef.current) {
      joinBuddySession(buddySessionTarget);
    } else if (!buddySessionTarget && prevBuddyTargetRef.current) {
      leaveBuddySession(prevBuddyTargetRef.current);
    }
    prevBuddyTargetRef.current = buddySessionTarget;
  }, [buddySessionTarget, joinBuddySession, leaveBuddySession]);

  // Report buddy session state to parent
  useEffect(() => {
    if (onBuddySessionChange) onBuddySessionChange(!!buddySession);
  }, [buddySession, onBuddySessionChange]);

  // Viewing a past conversation: fetch its messages
  const [pastMessages, setPastMessages] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const isViewingPast = !!(viewingConversationId && viewingConversationId !== conversationId);

  useEffect(() => {
    if (!isViewingPast || !viewingConversationId) {
      setPastMessages([]);
      return;
    }
    setLoadingPast(true);
    fetch(`/api/conversations/${viewingConversationId}/messages`)
      .then(r => r.json())
      .then(data => {
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

  // Notify parent when the live conversation changes (for sidebar refresh)
  const prevConvIdRef = useRef(conversationId);
  useEffect(() => {
    if (conversationId && conversationId !== prevConvIdRef.current) {
      prevConvIdRef.current = conversationId;
      if (onConversationChange) onConversationChange();
    }
  }, [conversationId, onConversationChange]);

  const messages = isViewingPast ? pastMessages : liveMessages;

  // Collect all artifacts from messages
  const artifacts = useMemo(() => collectArtifacts(messages), [messages]);

  // Track which message IDs have been set to inline mode
  const [inlineMsgIds, setInlineMsgIds] = useState(new Set());
  // Track which message IDs have been dismissed (closed) from the side panel
  const [dismissedMsgIds, setDismissedMsgIds] = useState(new Set());
  // User-selected artifact index (-1 = auto/latest, or explicit index)
  const [userSelectedIdx, setUserSelectedIdx] = useState(-1);
  // Standalone terminal panel open/close
  const [terminalOpen, setTerminalOpen] = useState(false);

  // Visible artifacts = all artifacts minus dismissed ones
  const visibleArtifacts = useMemo(
    () => artifacts.filter(a => !dismissedMsgIds.has(a.msgId)),
    [artifacts, dismissedMsgIds]
  );

  // Derive active artifact: show user's selection, or default to latest non-inline visible artifact
  const activeArtifactIdx = useMemo(() => {
    if (userSelectedIdx >= 0 && userSelectedIdx < visibleArtifacts.length) return userSelectedIdx;
    // Default: last visible artifact that isn't inline
    for (let i = visibleArtifacts.length - 1; i >= 0; i--) {
      if (!inlineMsgIds.has(visibleArtifacts[i].msgId)) return i;
    }
    return -1;
  }, [visibleArtifacts, inlineMsgIds, userSelectedIdx]);

  const setActiveArtifactIdx = setUserSelectedIdx;

  // Auto-scroll to the newest message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Dismiss welcome back when user sends their first message
  useEffect(() => {
    if (messages.length > 0 && welcomeBack) {
      const hasUserMsg = messages.some(m => m.role === 'user');
      if (hasUserMsg) dismissWelcomeBack();
    }
  }, [messages, welcomeBack, dismissWelcomeBack]);

  const hasUserMessage = messages.some(m => m.role === 'user');
  const currentArtifact = activeArtifactIdx >= 0 && activeArtifactIdx < visibleArtifacts.length
    ? visibleArtifacts[activeArtifactIdx] : null;
  const showBuddyTerminal = !!buddySession;
  const showLocalTerminal = terminalOpen && !showBuddyTerminal;
  const showArtifactPanel = currentArtifact && !inlineMsgIds.has(currentArtifact.msgId);
  const showSidePanel = showBuddyTerminal || showLocalTerminal || showArtifactPanel;
  const showTerminal = showBuddyTerminal || showLocalTerminal;

  // Move artifact to inline mode
  const handleMoveToInline = (msgId) => {
    setInlineMsgIds(prev => new Set([...prev, msgId]));
    // If this was the active artifact, close the panel
    if (currentArtifact && currentArtifact.msgId === msgId) {
      setActiveArtifactIdx(-1);
    }
  };

  // Dismiss artifact from the side panel slider
  const handleDismiss = (msgId) => {
    setDismissedMsgIds(prev => new Set([...prev, msgId]));
    setActiveArtifactIdx(-1);
  };

  // Navigate to a specific artifact by message ID (when clicking tag in chat)
  const navigateToArtifact = (msgId) => {
    // Un-dismiss if it was dismissed
    setDismissedMsgIds(prev => {
      const next = new Set(prev);
      next.delete(msgId);
      return next;
    });
    // Remove from inline if it was inline
    setInlineMsgIds(prev => {
      const next = new Set(prev);
      next.delete(msgId);
      return next;
    });
    // Find index in the visible list (after un-dismissing, need to search full artifacts)
    const idx = artifacts.findIndex(a => a.msgId === msgId);
    if (idx >= 0) {
      // Compute what the visible index will be after un-dismissing
      const visibleIdx = artifacts
        .filter(a => !dismissedMsgIds.has(a.msgId) || a.msgId === msgId)
        .findIndex(a => a.msgId === msgId);
      setActiveArtifactIdx(visibleIdx >= 0 ? visibleIdx : 0);
    }
  };

  // Move artifact back to side panel
  const handleMoveToSide = (msgId) => {
    // Un-dismiss if it was dismissed
    setDismissedMsgIds(prev => {
      const next = new Set(prev);
      next.delete(msgId);
      return next;
    });
    setInlineMsgIds(prev => {
      const next = new Set(prev);
      next.delete(msgId);
      return next;
    });
    // Find this artifact's index in visible list
    const visibleIdx = artifacts
      .filter(a => !dismissedMsgIds.has(a.msgId) || a.msgId === msgId)
      .findIndex(a => a.msgId === msgId);
    if (visibleIdx >= 0) setActiveArtifactIdx(visibleIdx);
  };

  return (
    <div className={`chat-layout ${showSidePanel ? 'chat-layout--split' : ''} ${showTerminal ? 'chat-layout--terminal' : ''}`}>
    <div className="chat-window">
      <div className="chat-header">
        {buddyObserving && (
          <div className="buddy-observing-badge">
            {buddyObserving.buddyName} is helping you
          </div>
        )}
        <ConnectComputer isConnected={agentConnected} onPair={pairAgent} />
        {!isViewingPast && (
          <button
            type="button"
            className={`chat-header__terminal-btn ${terminalOpen ? 'chat-header__terminal-btn--active' : ''}`}
            onClick={() => setTerminalOpen(prev => !prev)}
            aria-label={terminalOpen ? 'Close terminal' : 'Open terminal'}
          >
            Terminal
          </button>
        )}
        <button
          type="button"
          className="chat-header__end-btn"
          onClick={endChat}
          disabled={!hasUserMessage || !!feedbackPrompt}
          aria-label="End chat and leave feedback"
        >
          End chat
        </button>
      </div>

      {!isConnected && (
        <div className="connection-banner" role="status">
          Connecting to PC Pal... please wait.
        </div>
      )}

      <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
        {!isViewingPast && (
          <WelcomeBackBanner
            welcomeData={welcomeBack}
            onSendMessage={sendMessage}
            onDismiss={dismissWelcomeBack}
          />
        )}

        {loadingPast && (
          <div className="chat-empty">
            <p className="chat-empty__text">Loading conversation...</p>
          </div>
        )}

        {!loadingPast && messages.length === 0 && !welcomeBack && (
          <div className="chat-empty">
            <p className="chat-empty__text">
              {isViewingPast
                ? 'This conversation has no messages.'
                : <>Hello! I&apos;m PC Pal, your friendly tech helper.<br />Ask me anything about your computer!</>
              }
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRunCommand={runCommand}
            inlineMode={inlineMsgIds.has(msg.id)}
            onMoveToSide={() => handleMoveToSide(msg.id)}
            onClickArtifact={() => navigateToArtifact(msg.id)}
          />
        ))}

        {!isViewingPast && isTyping && (
          <div className="typing-indicator" aria-live="polite" role="status">
            <div className="typing-indicator__dots">
              <span></span><span></span><span></span>
            </div>
            <span className="typing-indicator__label">PC Pal is typing...</span>
          </div>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {isViewingPast ? (
        <div className="chat-readonly-banner">
          This is a past conversation.
        </div>
      ) : (
        <>
          <StepSequencePanel activeSequence={activeSequence} onSendMessage={sendMessage} hasBuddy={hasBuddy} />
          <MessageInput onSend={sendMessage} onGatherResources={gatherResources} isTyping={isTyping} />
        </>
      )}

      {!isViewingPast && feedbackPrompt && (
        <FeedbackModal onSubmit={submitFeedback} onSkip={skipFeedback} />
      )}
    </div>

    {showSidePanel && (
      showBuddyTerminal ? (
        <div className="side-panel side-panel--terminal">
          <div className="side-panel__header">
            <span className="side-panel__title">Terminal &mdash; {buddySession.learnerName}'s Computer</span>
            <button className="side-panel__close" onClick={() => leaveBuddySession(buddySession.learnerId)}>Leave</button>
          </div>
          <div className="buddy-session-chat">
            <div className="buddy-session-chat__label">Live Chat</div>
            <div className="buddy-session-chat__messages">
              {buddySession.messages.map((m) => (
                <div key={m.id} className={`buddy-session-chat__msg buddy-session-chat__msg--${m.role}`}>
                  <span className="buddy-session-chat__role">{m.role === 'user' ? buddySession.learnerName : 'PC Pal'}</span>
                  <span className="buddy-session-chat__text">{m.text}</span>
                </div>
              ))}
              {buddySession.messages.length === 0 && (
                <div className="buddy-session-chat__empty">No messages yet.</div>
              )}
            </div>
          </div>
          <BuddyTerminal
            terminalHistory={buddySession.terminalHistory}
            onRunCommand={(cmd) => sendBuddyCommand(buddySession.learnerId, cmd)}
            learnerName={buddySession.learnerName}
            cwd={buddySession.cwd}
          />
        </div>
      ) : showLocalTerminal ? (
        <div className="side-panel side-panel--terminal">
          <div className="side-panel__header">
            <span className="side-panel__title">Terminal</span>
            <button className="side-panel__close" onClick={() => setTerminalOpen(false)}>Close</button>
          </div>
          <BuddyTerminal
            terminalHistory={terminalHistory}
            onRunCommand={sendTerminalCommand}
            learnerName="This Computer"
            cwd={terminalCwd}
          />
        </div>
      ) : (
        <SidePanel
          artifact={currentArtifact}
          artifacts={visibleArtifacts}
          activeIndex={activeArtifactIdx}
          onNavigate={setActiveArtifactIdx}
          onClose={() => handleDismiss(currentArtifact.msgId)}
          onMoveToInline={() => handleMoveToInline(currentArtifact.msgId)}
          onRunCommand={runCommand}
        />
      )
    )}
    </div>
  );
}

export default ChatWindow;
