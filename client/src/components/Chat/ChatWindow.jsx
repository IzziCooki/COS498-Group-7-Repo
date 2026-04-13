import React, { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import StepSequencePanel from './StepSequencePanel';
import WelcomeBackBanner from './WelcomeBackBanner';
import FeedbackModal from './FeedbackModal';
import './ChatWindow.css';

/**
 * ChatWindow — main chat container.
 *
 * - Full-height layout with scrollable message list above input
 * - Auto-scrolls to the latest message
 * - Shows "PC Pal is typing..." indicator
 * - Shows WelcomeBackBanner for returning users with skill reviews or buddy replies
 * - "End chat" button opens FeedbackModal so we can learn from the conversation
 */
function ChatWindow({ userId, hasBuddy }) {
  const {
    messages,
    sendMessage,
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

  // Auto-scroll to the newest message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Dismiss welcome back when user sends their first message
  useEffect(() => {
    if (messages.length > 0 && welcomeBack) {
      const hasUserMessage = messages.some(m => m.role === 'user');
      if (hasUserMessage) {
        dismissWelcomeBack();
      }
    }
  }, [messages, welcomeBack, dismissWelcomeBack]);

  const hasUserMessage = messages.some(m => m.role === 'user');

  return (
    <div className="chat-window">
      {/* Chat header — End chat action */}
      <div className="chat-header">
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

      {/* Connection status banner */}
      {!isConnected && (
        <div className="connection-banner" role="status">
          Connecting to PC Pal... please wait.
        </div>
      )}

      {/* Scrollable message list */}
      <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
        {/* Welcome back banner for returning users */}
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
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="typing-indicator" aria-live="polite" role="status">
            <div className="typing-indicator__dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-indicator__label">PC Pal is typing...</span>
          </div>
        )}

        {/* Invisible anchor to scroll to */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Step sequence guidance panel — shown above input when active */}
      <StepSequencePanel activeSequence={activeSequence} onSendMessage={sendMessage} hasBuddy={hasBuddy} />

      {/* Input area */}
      <MessageInput onSend={sendMessage} isTyping={isTyping} />

      {/* End-of-chat feedback modal */}
      {feedbackPrompt && (
        <FeedbackModal onSubmit={submitFeedback} onSkip={skipFeedback} />
      )}
    </div>
  );
}

export default ChatWindow;
