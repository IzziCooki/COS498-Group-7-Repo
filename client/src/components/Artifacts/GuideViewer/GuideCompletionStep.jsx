import React from 'react';
import './GuideCompletionStep.css';

/**
 * GuideCompletionStep -- Celebration screen shown after the last guide step.
 * Shows a celebration emoji, congratulations, review checklist, practice offer,
 * and a "Done - Back to chat" button.
 *
 * @param {{
 *   guide: { title: string },
 *   steps: Array<{ title?: string, body: string }>,
 *   onDone: () => void,
 *   onSendMessage?: (text: string) => void,
 * }} props
 */
function GuideCompletionStep({ guide, steps, onDone, onSendMessage }) {
  const handlePracticeOffer = () => {
    if (onSendMessage) {
      onSendMessage(`I'd like to practice "${guide.title}" in a safe simulation.`);
    }
    onDone();
  };

  return (
    <div className="pcp-completion">
      {/* Celebration illustration */}
      <div className="pcp-completion__celebration" aria-hidden="true">
        <div className="pcp-completion__emoji">&#127881;</div>
      </div>

      {/* Heading */}
      <h2 className="pcp-completion__heading">You did it!</h2>

      {/* Body text */}
      <p className="pcp-completion__body">
        You now know how to {guide.title.toLowerCase()}. Great job learning something new today!
      </p>

      {/* Review checklist */}
      <div className="pcp-completion__checklist">
        <h3 className="pcp-completion__checklist-title">What you learned today:</h3>
        <ul className="pcp-completion__checklist-items">
          {steps.map((step, i) => (
            <li key={i} className="pcp-completion__checklist-item">
              <span className="pcp-completion__check" aria-hidden="true">&#10003;</span>
              <span>{step.title || step.body}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Practice offer */}
      <button
        className="pcp-completion__practice-btn"
        onClick={handlePracticeOffer}
      >
        &#127919; Want to try it safely first?
        <span className="pcp-completion__practice-sub">(no real changes will happen)</span>
      </button>

      {/* Done button */}
      <div className="pcp-completion__done-area">
        <button
          className="pcp-btn pcp-btn--primary pcp-completion__done-btn"
          onClick={onDone}
        >
          Done &middot; Back to chat &#10003;
        </button>
      </div>
    </div>
  );
}

export default GuideCompletionStep;
