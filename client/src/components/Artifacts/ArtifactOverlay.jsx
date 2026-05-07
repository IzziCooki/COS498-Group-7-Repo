import React, { useEffect, useRef, useCallback, useState } from 'react';
import GuideViewer from './GuideViewer/GuideViewer';
import DiagnosticFindings from './DiagnosticFindings';
import VideoPlayer from './VideoPlayer';
import ResourcesViewer from './ResourcesViewer';
import PracticeMode from './PracticeMode/PracticeMode';
import './ArtifactOverlay.css';

/**
 * ArtifactOverlay -- Full-screen overlay wrapper for artifact detail views.
 * Slides up from the originating ArtifactCard, traps focus, and supports
 * Esc to close (with confirmation if mid-step in a guide).
 *
 * @param {{
 *   type: 'guide'|'diagnostic'|'video'|'resources'|'practice',
 *   data: any,
 *   onClose: () => void,
 *   onSendMessage?: (text: string) => void,
 *   triggerRef?: React.RefObject,
 * }} props
 */
function ArtifactOverlay({ type, data, onClose, onSendMessage, triggerRef }) {
  const overlayRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Track the guide's current step for confirm-on-close logic
  const guideStepRef = useRef(0);
  const handleGuideStepChange = useCallback((step) => {
    guideStepRef.current = step;
  }, []);

  // Save the previously focused element and focus the overlay
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    if (overlayRef.current) {
      overlayRef.current.focus();
    }
    // Hide tab bar
    document.body.classList.add('pcp-overlay-open');

    return () => {
      document.body.classList.remove('pcp-overlay-open');
      // Return focus to the originating card
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      } else if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [triggerRef]);

  const doClose = useCallback(() => {
    setIsClosing(true);
    // Allow closing animation to complete
    const timeout = setTimeout(() => {
      onClose();
    }, 320);
    return () => clearTimeout(timeout);
  }, [onClose]);

  // Attempt close -- may require confirmation for guides mid-step
  const attemptClose = useCallback(() => {
    if (type === 'guide' && guideStepRef.current > 0) {
      setConfirmClose(true);
      return;
    }
    doClose();
  }, [type, doClose]);

  // Esc key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmClose) {
          setConfirmClose(false);
        } else {
          attemptClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [attemptClose, confirmClose]);

  // Focus trap
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  const titleId = 'pcp-overlay-title';

  const renderContent = () => {
    if (!data) return <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--color-text-2)' }}>No content to display.</div>;
    switch (type) {
      case 'guide':
        return (
          <GuideViewer
            guide={data}
            onClose={attemptClose}
            onSendMessage={onSendMessage}
            onStepChange={handleGuideStepChange}
            titleId={titleId}
          />
        );
      case 'diagnostic':
        return (
          <DiagnosticFindings
            findings={data}
            onClose={attemptClose}
            titleId={titleId}
          />
        );
      case 'video':
        return (
          <VideoPlayer
            videos={data}
            onClose={attemptClose}
            titleId={titleId}
          />
        );
      case 'resources':
        return (
          <ResourcesViewer
            resources={data}
            onClose={attemptClose}
            titleId={titleId}
          />
        );
      case 'practice':
        return (
          <PracticeMode
            practice={data}
            onClose={attemptClose}
            onSendMessage={onSendMessage}
            titleId={titleId}
          />
        );
      default:
        return null;
    }
  };

  const overlayClassName = [
    'pcp-overlay',
    isClosing ? 'pcp-overlay--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={overlayRef}
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      {renderContent()}

      {/* Confirm-close modal for guides mid-step */}
      {confirmClose && (
        <div className="pcp-overlay__confirm" role="alertdialog" aria-label="Confirm close">
          <div className="pcp-overlay__confirm-card">
            <p className="pcp-overlay__confirm-text">
              You're partway through this guide. Are you sure you want to leave?
            </p>
            <div className="pcp-overlay__confirm-actions">
              <button
                className="pcp-btn pcp-btn--ghost pcp-overlay__confirm-btn"
                onClick={() => setConfirmClose(false)}
              >
                Stay
              </button>
              <button
                className="pcp-btn pcp-btn--primary pcp-overlay__confirm-btn"
                onClick={doClose}
              >
                Leave guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtifactOverlay;
