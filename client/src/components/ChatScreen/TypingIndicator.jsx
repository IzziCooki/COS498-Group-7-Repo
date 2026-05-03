import React from 'react';
import './TypingIndicator.css';

/**
 * TypingIndicator -- AI thinking state.
 * Bouncing dots for default motion, text for reduced-motion.
 * Always announces via aria-live="polite".
 */
function TypingIndicator() {
  return (
    <div className="pcp-typing" aria-live="polite" role="status">
      <div className="pcp-typing__avatar" aria-hidden="true">PC</div>
      <div className="pcp-typing__dots" aria-hidden="true">
        <span className="pcp-typing__dot" />
        <span className="pcp-typing__dot" />
        <span className="pcp-typing__dot" />
      </div>
      <div className="pcp-typing__text">PC Pal is thinking...</div>
      <span className="sr-only">PC Pal is thinking</span>
    </div>
  );
}

export default TypingIndicator;
