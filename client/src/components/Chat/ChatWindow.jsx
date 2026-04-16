import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import StepSequencePanel from './StepSequencePanel';
import WelcomeBackBanner from './WelcomeBackBanner';
import FeedbackModal from './FeedbackModal';
import ConnectComputer from './ConnectComputer';
import SidePanel from './SidePanel';
import './ChatWindow.css';

/**
 * Extract artifacts from messages — one artifact per message (not per type).
 * A message with both findings + guide becomes one combined artifact.
 */
function collectArtifacts(messages) {
  const artifacts = [];
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    const hasAny = msg.guide || msg.resources || msg.findings || msg.videos;
    if (!hasAny) continue;

    // One artifact per message — bundle all types together
    artifacts.push({
      msgId: msg.id,
      guide: msg.guide || null,
      findings: msg.findings || null,
      resources: msg.resources || null,
      videos: msg.videos || null,
    });
  }
  return artifacts;
}

function ChatWindow({ userId, hasBuddy }) {
  const {
    messages,
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
    feedbackPrompt,
    endChat,
    submitFeedback,
    skipFeedback,
  } = useChat(userId);
  const bottomRef = useRef(null);

  // Collect all artifacts from messages
  const artifacts = useMemo(() => collectArtifacts(messages), [messages]);

  // Track which message IDs have been set to inline mode
  const [inlineMsgIds, setInlineMsgIds] = useState(new Set());
  // User-selected artifact index (-1 = auto/latest, or explicit index)
  const [userSelectedIdx, setUserSelectedIdx] = useState(-1);

  // Derive active artifact: show user's selection, or default to latest non-inline artifact
  const activeArtifactIdx = useMemo(() => {
    if (userSelectedIdx >= 0 && userSelectedIdx < artifacts.length) return userSelectedIdx;
    // Default: last artifact that isn't inline
    for (let i = artifacts.length - 1; i >= 0; i--) {
      if (!inlineMsgIds.has(artifacts[i].msgId)) return i;
    }
    return -1;
  }, [artifacts, inlineMsgIds, userSelectedIdx]);

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
  const currentArtifact = activeArtifactIdx >= 0 && activeArtifactIdx < artifacts.length
    ? artifacts[activeArtifactIdx] : null;
  const showSidePanel = currentArtifact && !inlineMsgIds.has(currentArtifact.msgId);

  // Move artifact to inline mode
  const handleMoveToInline = (msgId) => {
    setInlineMsgIds(prev => new Set([...prev, msgId]));
    // If this was the active artifact, close the panel
    if (currentArtifact && currentArtifact.msgId === msgId) {
      setActiveArtifactIdx(-1);
    }
  };

  // Navigate to a specific artifact by message ID (when clicking tag in chat)
  const navigateToArtifact = (msgId) => {
    // Remove from inline if it was inline
    setInlineMsgIds(prev => {
      const next = new Set(prev);
      next.delete(msgId);
      return next;
    });
    const idx = artifacts.findIndex(a => a.msgId === msgId);
    if (idx >= 0) setActiveArtifactIdx(idx);
  };

  // Move artifact back to side panel
  const handleMoveToSide = (msgId) => {
    setInlineMsgIds(prev => {
      const next = new Set(prev);
      next.delete(msgId);
      return next;
    });
    // Find this artifact's index and show it
    const idx = artifacts.findIndex(a => a.msgId === msgId);
    if (idx >= 0) setActiveArtifactIdx(idx);
  };

  return (
    <div className={`chat-layout ${showSidePanel ? 'chat-layout--split' : ''}`}>
    <div className="chat-window">
      <div className="chat-header">
        <ConnectComputer isConnected={agentConnected} onPair={pairAgent} />
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
        <WelcomeBackBanner
          welcomeData={welcomeBack}
          onSendMessage={sendMessage}
          onDismiss={dismissWelcomeBack}
        />

        {messages.length === 0 && !welcomeBack && (
          <div className="chat-empty">
            <p className="chat-empty__text">
              Hello! I'm PC Pal, your friendly tech helper.
              <br />
              Ask me anything about your computer!
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

        {isTyping && (
          <div className="typing-indicator" aria-live="polite" role="status">
            <div className="typing-indicator__dots">
              <span></span><span></span><span></span>
            </div>
            <span className="typing-indicator__label">PC Pal is typing...</span>
          </div>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      <StepSequencePanel activeSequence={activeSequence} onSendMessage={sendMessage} hasBuddy={hasBuddy} />
      <MessageInput onSend={sendMessage} onGatherResources={gatherResources} isTyping={isTyping} />

      {feedbackPrompt && (
        <FeedbackModal onSubmit={submitFeedback} onSkip={skipFeedback} />
      )}
    </div>

    {showSidePanel && (
      <SidePanel
        artifact={currentArtifact}
        artifacts={artifacts}
        activeIndex={activeArtifactIdx}
        onNavigate={setActiveArtifactIdx}
        onClose={() => setActiveArtifactIdx(-1)}
        onMoveToInline={() => handleMoveToInline(currentArtifact.msgId)}
        onRunCommand={runCommand}
      />
    )}
    </div>
  );
}

export default ChatWindow;
