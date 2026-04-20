import React from 'react';
import './MessageBubble.css';
import YouTubeEmbed from './YouTubeEmbed';
import CommandGuide from './CommandGuide';
import DiagnosticFindings from './DiagnosticFindings';
import ResourceReport from './ResourceReport';

function formatMessage(text) {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
    const stepMatch = trimmed.match(/^(\d+)\.\s*(.*)/s);
    if (stepMatch) {
      return (
        <div key={i} className="bubble__step">
          <span className="bubble__step-num">{stepMatch[1]}</span>
          <span className="bubble__step-text">{renderInline(stepMatch[2])}</span>
        </div>
      );
    }
    return <p key={i} className="bubble__paragraph">{renderInline(trimmed)}</p>;
  });
}

function renderInline(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="bubble__bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Get a short label for an artifact type */
function artifactLabel(msg) {
  if (msg.practice) return 'Practice Mode';
  if (msg.guide) return msg.guide.title || 'Guide';
  if (msg.resources) return msg.resources.topic ? `Resources: ${msg.resources.topic}` : 'Resources';
  if (msg.findings) return msg.findings.title || 'Diagnostic Details';
  if (msg.videos) return 'Video Tutorials';
  return null;
}

/**
 * MessageBubble — displays a single chat message.
 *
 * Artifacts are shown in the side panel by default.
 * In the chat, only a small reference tag appears.
 * If inlineMode is true, the full artifact renders in the chat.
 */
function MessageBubble({ message, onRunCommand, inlineMode, onMoveToSide, onClickArtifact }) {
  const { role, text, timestamp, safetyAlert, images, videos, guide, commandResults, findings, resources, practice, buddyTerminal } = message;
  const isUser = role === 'user';
  const hasArtifact = !isUser && (guide || resources || findings || videos || practice);
  const label = hasArtifact ? artifactLabel(message) : null;

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--assistant'}`}>
      {safetyAlert && (
        <div className="safety-alert" role="alert">
          <span className="safety-alert__icon" aria-hidden="true">!</span>
          <span>{safetyAlert}</span>
        </div>
      )}

      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--assistant'}`}>
        {isUser ? (
          <p className="bubble__text">{text}</p>
        ) : (
          <div className="bubble__formatted">{formatMessage(text)}</div>
        )}

        {/* Artifact rendering: inline mode shows full artifact, otherwise just a reference tag */}
        {hasArtifact && inlineMode && (
          <>
            {findings && <DiagnosticFindings findings={findings} />}
            {guide && <CommandGuide guide={guide} onRunCommand={onRunCommand} commandResults={commandResults || {}} />}
            {resources && <ResourceReport resources={resources} />}
            {videos && <YouTubeEmbed videos={videos} />}
            <button className="bubble__side-btn" onClick={onMoveToSide}>
              Open beside chat
            </button>
          </>
        )}

        {hasArtifact && !inlineMode && (
          <button className="bubble__artifact-tag" onClick={onClickArtifact} type="button">
            <span className="bubble__artifact-tag-icon">&#9776;</span>
            <span className="bubble__artifact-tag-label">{label}</span>
            <span className="bubble__artifact-tag-hint">Click to view</span>
          </button>
        )}

        {/* Buddy terminal command result (inline always) */}
        {buddyTerminal && (
          <div className="bubble__buddy-terminal">
            <div className="bubble__buddy-terminal-header">
              {buddyTerminal.buddyName} ran a command
            </div>
            <div className="bubble__buddy-terminal-cmd">$ {buddyTerminal.command}</div>
            {buddyTerminal.running ? (
              <div className="bubble__buddy-terminal-running">Running...</div>
            ) : (
              <pre className={`bubble__buddy-terminal-output ${buddyTerminal.error ? 'bubble__buddy-terminal-output--err' : ''}`}>
                {buddyTerminal.output || '(no output)'}
              </pre>
            )}
          </div>
        )}

        {/* Annotated device screenshots (always inline) */}
        {images && images.length > 0 && (
          <div className="bubble__screenshots">
            {images.map((img, i) => (
              <div key={i} className="bubble__screenshot-card">
                <img src={img.url} alt={img.alt} className="bubble__screenshot-img" loading="lazy" />
                <p className="bubble__screenshot-caption">{img.alt}</p>
              </div>
            ))}
          </div>
        )}

        <time className="bubble__time" dateTime={timestamp}>{formattedTime}</time>
      </div>

      {!isUser && (
        <span className="message-avatar" aria-hidden="true">PC</span>
      )}
    </div>
  );
}

export default MessageBubble;
