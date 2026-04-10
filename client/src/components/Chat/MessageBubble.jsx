import React from 'react';
import VisualGuide from './VisualGuide';
import './MessageBubble.css';

/**
 * MessageBubble — displays a single chat message.
 *
 * User messages: right-aligned, blue background.
 * Assistant messages: left-aligned, white background.
 * Shows a red safety alert banner when safetyAlert is present.
 */
function MessageBubble({ message, osType = 'Windows' }) {
  const { role, text, timestamp, safetyAlert, guideId, imageUrls } = message;
  const isUser = role === 'user';

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--assistant'}`}>
      {/* Safety alert — prominent banner above the message */}
      {safetyAlert && (
        <div className="safety-alert" role="alert">
          <span className="safety-alert__icon" aria-hidden="true">!</span>
          <span>{safetyAlert}</span>
        </div>
      )}

      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--assistant'}`}>
        <p className="bubble__text">{text}</p>

        {imageUrls && (
          <div className="bubble__images">
            <img src={imageUrls.keyboard} alt="Keyboard guide" className="bubble__guide-image" />
            <img src={imageUrls.screen} alt="Screen guide" className="bubble__guide-image" />
          </div>
        )}

        {guideId && <VisualGuide taskId={guideId} osType={osType} />}
        <time className="bubble__time" dateTime={timestamp}>{formattedTime}</time>
      </div>

      {!isUser && (
        <span className="message-avatar" aria-hidden="true">PC</span>
      )}
    </div>
  );
}

export default MessageBubble;
