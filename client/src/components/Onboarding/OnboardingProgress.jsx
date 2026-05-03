import React from 'react';

/**
 * OnboardingProgress — dot row: filled dots for completed/current, outline for upcoming.
 * Announced as "Step N of 5" for screen readers.
 */
function OnboardingProgress({ current, total }) {
  return (
    <nav
      className="pcp-onboarding-progress"
      aria-label="Onboarding progress"
    >
      <ol
        style={{ display: 'flex', gap: 'var(--space-2)', listStyle: 'none', margin: 0, padding: 0 }}
      >
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const isCurrent = step === current;
          const isFilled = step <= current;
          let cls = 'pcp-onboarding-progress__dot';
          if (isCurrent) cls += ' pcp-onboarding-progress__dot--current';
          else if (isFilled) cls += ' pcp-onboarding-progress__dot--filled';

          return (
            <li key={step} aria-hidden="true">
              <span className={cls} />
            </li>
          );
        })}
      </ol>
      <span className="sr-only" aria-live="polite">
        Step {current} of {total}
      </span>
    </nav>
  );
}

export default OnboardingProgress;
