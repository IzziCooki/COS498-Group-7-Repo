import React, { useState } from 'react';
import GuideHotspot from '../GuideViewer/GuideHotspot';

/**
 * PracticeStep -- Single practice step with instruction details.
 *
 * Two rendering modes:
 * - Simulation mode (step.screen exists): interactive screenshot with hotspot
 * - Text mode (no screen): current card-based layout
 *
 * @param {{
 *   step: {
 *     instruction: string,
 *     whereToLook: string,
 *     whatItLooksLike: string,
 *     deviceInstructions: string,
 *     afterThis: string,
 *     confusedAlt: string|null,
 *     image?: { url: string, altText?: string },
 *     screen?: { url: string, hotspot: { xPercent: number, yPercent: number } },
 *   },
 *   stepNumber: number,
 *   showAlt: boolean,
 *   onHotspotTap?: (result?: string) => void,
 *   wrongTap?: boolean,
 * }} props
 */
function PracticeStep({ step, stepNumber, showAlt, onHotspotTap, wrongTap }) {
  const [hintOpen, setHintOpen] = useState(false);
  const isSimulation = step.screen && step.screen.url;

  if (isSimulation) {
    return (
      <div className="pcp-practice-step pcp-practice-step--sim">
        {/* Full-width screenshot with hotspot overlay */}
        <div
          className={`pcp-practice-step__screen ${wrongTap ? 'pcp-practice-step__screen--shake' : ''}`}
          onClick={(e) => {
            // Check if click is near the hotspot (within 12% radius)
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * 100;
            const clickY = ((e.clientY - rect.top) / rect.height) * 100;
            const dx = clickX - step.screen.hotspot.xPercent;
            const dy = clickY - step.screen.hotspot.yPercent;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 12) {
              onHotspotTap();
            } else {
              // wrong tap -- parent handles feedback
              if (onHotspotTap) onHotspotTap('wrong');
            }
          }}
          role="img"
          aria-label={step.instruction}
        >
          <img
            src={step.screen.url}
            alt={step.instruction}
            className="pcp-practice-step__screen-img"
            draggable="false"
          />
          <GuideHotspot
            xPercent={step.screen.hotspot.xPercent}
            yPercent={step.screen.hotspot.yPercent}
          />
          {/* Instruction tooltip floating at bottom of image */}
          <div className="pcp-practice-step__tooltip">
            <span className="pcp-practice-step__tooltip-num">{stepNumber}</span>
            {step.instruction}
          </div>
        </div>

        {/* Wrong tap feedback */}
        {wrongTap && (
          <div className="pcp-practice-step__wrong-tap" role="alert">
            Not quite -- tap the glowing circle!
          </div>
        )}

        {/* Collapsible hint */}
        <button
          type="button"
          className="pcp-practice-step__hint-toggle"
          onClick={() => setHintOpen(!hintOpen)}
          aria-expanded={hintOpen}
        >
          {hintOpen ? 'Hide hint' : 'Need a hint?'}
        </button>
        {hintOpen && (
          <div className="pcp-practice-step__hint">
            <p><strong>Where to look:</strong> {step.whereToLook}</p>
            <p><strong>What it looks like:</strong> {step.whatItLooksLike}</p>
            {step.deviceInstructions && (
              <p><strong>On your device:</strong> {step.deviceInstructions}</p>
            )}
          </div>
        )}

        {/* Alt explanation */}
        {showAlt && step.confusedAlt && (
          <div className="pcp-practice-step__alt" role="note">
            <strong>Another way to think about it:</strong>
            <p className="pcp-practice-step__alt-text">{step.confusedAlt}</p>
          </div>
        )}
      </div>
    );
  }

  // Text mode -- current layout
  return (
    <div className="pcp-practice-step">
      {step.image && step.image.url && (
        <div className="pcp-practice-step__image-area">
          <img src={step.image.url} alt={step.image.altText || 'Step illustration'} className="pcp-practice-step__image" loading="lazy" onError={(e) => { e.target.parentElement.style.display = 'none'; }} />
        </div>
      )}
      <div className="pcp-practice-step__header">
        <span className="pcp-practice-step__number" aria-hidden="true">{stepNumber}</span>
        <h2 className="pcp-practice-step__instruction">{step.instruction}</h2>
      </div>
      <div className="pcp-practice-step__details">
        <div className="pcp-practice-step__detail"><strong className="pcp-practice-step__label">Where to look:</strong><span>{step.whereToLook}</span></div>
        <div className="pcp-practice-step__detail"><strong className="pcp-practice-step__label">What it looks like:</strong><span>{step.whatItLooksLike}</span></div>
        {step.deviceInstructions && (<div className="pcp-practice-step__detail"><strong className="pcp-practice-step__label">On your device:</strong><span>{step.deviceInstructions}</span></div>)}
        <div className="pcp-practice-step__detail"><strong className="pcp-practice-step__label">After this step:</strong><span>{step.afterThis}</span></div>
      </div>
      {showAlt && step.confusedAlt && (
        <div className="pcp-practice-step__alt" role="note">
          <strong className="pcp-practice-step__label">Another way to think about it:</strong>
          <p className="pcp-practice-step__alt-text">{step.confusedAlt}</p>
        </div>
      )}
    </div>
  );
}

export default PracticeStep;
