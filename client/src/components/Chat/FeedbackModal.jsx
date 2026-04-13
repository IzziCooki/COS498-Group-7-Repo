import React, { useEffect, useRef, useState } from 'react';
import './FeedbackModal.css';

const MAX_COMMENT_LENGTH = 2000;

/**
 * FeedbackModal — end-of-chat feedback prompt.
 *
 * Shows a 1-5 star rating (required) and an optional "What could be improved?"
 * textarea. Calls onSubmit({ rating, comment }) or onSkip() when the user
 * decides.
 */
function FeedbackModal({ onSubmit, onSkip }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const firstStarRef = useRef(null);

  useEffect(() => {
    // Autofocus the first star for keyboard users
    if (firstStarRef.current) {
      firstStarRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    setError(null);
    const result = await onSubmit({ rating, comment: comment.trim() || null });
    if (result && result.ok === false) {
      setError('Sorry, we could not save your feedback. Please try again.');
      setSubmitting(false);
    }
    // On success the parent unmounts the modal, so no further state work.
  };

  const handleSkip = () => {
    if (submitting) return;
    onSkip();
  };

  const display = hoveredRating || rating;

  return (
    <div
      className="feedback-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div className="feedback-modal">
        <h2 id="feedback-modal-title" className="feedback-modal__title">
          How did I do?
        </h2>
        <p className="feedback-modal__subtitle">
          Your feedback helps PC Pal get better.
        </p>

        <div
          className="feedback-modal__stars"
          role="radiogroup"
          aria-label="Rating out of 5 stars"
          onMouseLeave={() => setHoveredRating(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = value <= display;
            return (
              <button
                key={value}
                type="button"
                ref={value === 1 ? firstStarRef : null}
                className={`feedback-modal__star${filled ? ' feedback-modal__star--filled' : ''}`}
                aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                aria-checked={rating === value}
                role="radio"
                onMouseEnter={() => setHoveredRating(value)}
                onFocus={() => setHoveredRating(value)}
                onClick={() => setRating(value)}
              >
                {filled ? '★' : '☆'}
              </button>
            );
          })}
        </div>

        <label htmlFor="feedback-comment" className="feedback-modal__label">
          What could be improved? (optional)
        </label>
        <textarea
          id="feedback-comment"
          className="feedback-modal__textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          maxLength={MAX_COMMENT_LENGTH}
          rows={4}
          placeholder="Tell us anything that would make PC Pal more helpful."
        />

        {error && (
          <p className="feedback-modal__error" role="alert">{error}</p>
        )}

        <div className="feedback-modal__actions">
          <button
            type="button"
            className="feedback-modal__skip"
            onClick={handleSkip}
            disabled={submitting}
          >
            No thanks
          </button>
          <button
            type="button"
            className="feedback-modal__submit"
            onClick={handleSubmit}
            disabled={rating < 1 || submitting}
          >
            {submitting ? 'Sending…' : 'Send feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackModal;
