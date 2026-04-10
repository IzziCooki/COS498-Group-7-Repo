import React from 'react';
import { guideRegistry } from './guideRegistry';
import './VisualGuide.css';

/**
 * VisualGuide — displays a visual step-by-step guide card for a given task.
 *
 * @param {string} taskId   - Key into guideRegistry (e.g. "copy_paste")
 * @param {string} osType   - "Windows" or "Mac" (defaults to "Windows")
 */
function VisualGuide({ taskId, osType = 'Windows' }) {
  const guide = guideRegistry[taskId];

  if (!guide) {
    return (
      <div className="visual-guide visual-guide--empty">
        <p>No visual guide available for this topic.</p>
      </div>
    );
  }

  const steps = guide.variants[osType] ?? guide.variants['Windows'] ?? [];

  return (
    <div className="visual-guide" role="complementary" aria-label={`Visual guide: ${guide.title}`}>
      {/* Header */}
      <div className="visual-guide__header">
        <span className="visual-guide__header-icon" aria-hidden="true">📋</span>
        <h3 className="visual-guide__title">{guide.title}</h3>
        <span className="visual-guide__os-badge">{osType}</span>
      </div>

      {/* Steps list */}
      <ol className="visual-guide__steps" aria-label="Guide steps">
        {steps.map((step) => (
          <li key={step.num} className="visual-guide__step">
            {/* Circle number */}
            <span className="visual-guide__step-num" aria-label={`Step ${step.num}`}>
              {step.num}
            </span>

            {/* Step content */}
            <div className="visual-guide__step-content">
              <p className="visual-guide__step-text">{step.text}</p>

              {/* Keyboard key badges */}
              {step.keys && step.keys.length > 0 && (
                <div className="visual-guide__keys" aria-label={`Keys: ${step.keys.join(' + ')}`}>
                  {step.keys.map((key, index) => (
                    <React.Fragment key={key}>
                      {index > 0 && (
                        <span className="visual-guide__key-plus" aria-hidden="true">+</span>
                      )}
                      <kbd className="visual-guide__key">{key}</kbd>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default VisualGuide;
