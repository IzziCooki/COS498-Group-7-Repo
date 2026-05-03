import React, { useState } from 'react';
import GuideHotspot from './GuideHotspot';
import './GuideStep.css';

/**
 * GuideStep -- Single default step: screenshot + hotspot + caption + text + note.
 *
 * @param {{
 *   step: {
 *     title?: string,
 *     body: string,
 *     caption?: string,
 *     note?: { kind: 'tip'|'warning', text: string },
 *     image?: { url: string, altText: string },
 *     hotspot?: { xPercent: number, yPercent: number },
 *   },
 *   onStuck: () => void,
 * }} props
 */
function GuideStep({ step, onStuck }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasImage = step.image && step.image.url && !imgError;
  const hasCaption = !!step.caption;
  const hasNote = step.note && step.note.text;
  const noteKind = step.note?.kind || 'tip';

  return (
    <div className="pcp-guide-step">
      {/* Screenshot area */}
      {step.image && step.image.url && (
        <div className="pcp-guide-step__image-area">
          {imgError ? (
            <div className="pcp-guide-step__image-fallback">
              <span className="pcp-guide-step__image-fallback-icon" aria-hidden="true">
                &#128247;
              </span>
              <span className="pcp-guide-step__image-fallback-text">
                Picture didn't load. Tap to try again.
              </span>
            </div>
          ) : (
            <div className="pcp-guide-step__image-wrap">
              <img
                src={step.image.url}
                alt={step.image.altText || 'Step screenshot'}
                className="pcp-guide-step__image"
                loading="lazy"
                onError={() => setImgError(true)}
                onLoad={() => setImgLoaded(true)}
                aria-describedby={hasCaption ? 'step-caption' : undefined}
              />
              {step.hotspot && imgLoaded && (
                <GuideHotspot
                  xPercent={step.hotspot.xPercent}
                  yPercent={step.hotspot.yPercent}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Caption below screenshot */}
      {hasCaption && (
        <p id="step-caption" className="pcp-guide-step__caption">
          <span aria-hidden="true">{hasImage ? '\uD83D\uDCCD' : '\uD83D\uDC49'} </span>
          {step.caption}
        </p>
      )}

      {/* Step text */}
      <div className="pcp-guide-step__text">
        {step.title && (
          <h2 className="pcp-guide-step__heading">{step.title}</h2>
        )}
        {step.body && (
          <p className="pcp-guide-step__body">{step.body}</p>
        )}
      </div>

      {/* Note callout */}
      {hasNote && (
        <div
          className={`pcp-guide-step__note pcp-guide-step__note--${noteKind}`}
          role="note"
        >
          <span className="pcp-guide-step__note-icon" aria-hidden="true">
            {noteKind === 'warning' ? '\u26A0\uFE0F' : '\uD83D\uDCA1'}
          </span>
          <span className="pcp-guide-step__note-text">{step.note.text}</span>
        </div>
      )}

      {/* Stuck button */}
      <button
        className="pcp-btn pcp-btn--ghost pcp-guide-step__stuck"
        onClick={onStuck}
        aria-label="Get help with this step"
      >
        &#10067; Stuck? Ask PC for help
      </button>
    </div>
  );
}

export default GuideStep;
