import React, { useState, useCallback } from 'react';
import './ReplyComposer.css';

/**
 * ReplyComposer -- Reply to learner's question (D5 section 4).
 *
 * Props:
 *   learnerName   - string
 *   question      - { text, context, askedAgo, skill, device, comfort }
 *   onCancel      - () => void
 *   onSend        - ({ reply, useAiGuide, hasPhoto }) => void
 *   onVoiceInput  - () => void (speech-to-text trigger)
 *   onAddPhoto    - () => void (attach screenshot)
 */
function ReplyComposer({
  learnerName = 'Learner',
  question = {},
  onCancel,
  onSend,
  onVoiceInput,
  onAddPhoto,
}) {
  const [reply, setReply] = useState('');
  const [useAiGuide, setUseAiGuide] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  const handleSend = useCallback(() => {
    if (!reply.trim()) return;
    onSend && onSend({ reply: reply.trim(), useAiGuide, hasPhoto });
  }, [reply, useAiGuide, hasPhoto, onSend]);

  const handlePhotoClick = useCallback(() => {
    setHasPhoto(true);
    onAddPhoto && onAddPhoto();
  }, [onAddPhoto]);

  const contextParts = [question.skill, question.device, question.comfort].filter(Boolean);

  return (
    <div className="pcp-reply-composer" role="region" aria-label="Reply to question">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="pcp-reply-composer__header">
        <button
          className="pcp-reply-composer__cancel"
          onClick={onCancel}
          aria-label="Cancel reply"
        >
          Cancel
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="pcp-reply-composer__body">
        <div className="pcp-reply-composer__title">Reply to {learnerName}</div>

        {/* Question Echo */}
        <div className="pcp-reply-composer__echo">
          <div className="pcp-reply-composer__echo-header">
            {learnerName} asked{question.askedAgo ? `, ${question.askedAgo} ago` : ''}:
          </div>
          <div className="pcp-reply-composer__echo-text">
            &ldquo;{question.text || 'No question text'}&rdquo;
          </div>
          {contextParts.length > 0 && (
            <div className="pcp-reply-composer__echo-context">
              Context: {contextParts.join(' \u00B7 ')}
            </div>
          )}
        </div>

        {/* Reply Textarea */}
        <div>
          <label className="pcp-reply-composer__reply-label" htmlFor="reply-textarea">
            Your reply
          </label>
          <textarea
            id="reply-textarea"
            className="pcp-reply-composer__textarea"
            placeholder="Type your reply here..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
          />
        </div>

        {/* Voice + Photo Buttons */}
        <div className="pcp-reply-composer__actions">
          <button
            className="pcp-reply-composer__action-btn"
            onClick={onVoiceInput}
            aria-label="Use voice input"
          >
            <span aria-hidden="true">M</span> Voice
          </button>
          <button
            className="pcp-reply-composer__action-btn"
            onClick={handlePhotoClick}
            aria-label="Add a photo"
          >
            <span aria-hidden="true">P</span> Add photo
          </button>
        </div>

        {/* AI Guide Toggle */}
        <div className="pcp-reply-composer__toggle-row">
          <span className="pcp-reply-composer__toggle-label">
            Let PC turn this into a guide
          </span>
          <label className="pcp-reply-composer__toggle-switch">
            <input
              className="pcp-reply-composer__toggle-input"
              type="checkbox"
              checked={useAiGuide}
              onChange={(e) => setUseAiGuide(e.target.checked)}
              aria-label="Let PC turn this reply into a formatted guide for the learner"
            />
            <span className="pcp-reply-composer__toggle-track" />
          </label>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="pcp-reply-composer__footer">
        <button
          className="pcp-btn pcp-btn--primary pcp-reply-composer__send-btn"
          onClick={handleSend}
          disabled={!reply.trim()}
          aria-label={`Send reply to ${learnerName}`}
        >
          Send to {learnerName}
        </button>
      </div>
    </div>
  );
}

export default ReplyComposer;
