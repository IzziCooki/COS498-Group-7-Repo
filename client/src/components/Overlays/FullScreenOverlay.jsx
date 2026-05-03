import React, { useEffect, useRef, useCallback, useState } from 'react';
import './FullScreenOverlay.css';

/**
 * FullScreenOverlay — Reusable full-screen panel for guide, video, profile, etc.
 * Provides a top bar (back button + title + optional actions), focus trap, Esc to close.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   backLabel?: string,          // label shown next to back arrow (default "Back")
 *   actions?: React.ReactNode,   // rendered in top-right slot
 *   children: React.ReactNode,
 *   labelledBy?: string,
 *   hideTopBar?: boolean,        // for content that renders its own top bar
 * }} props
 */
function FullScreenOverlay({
  open,
  onClose,
  title,
  backLabel = 'Back',
  actions,
  children,
  labelledBy,
  hideTopBar = false,
}) {
  const overlayRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const titleId = labelledBy || 'pcp-fullscreen-overlay-title';

  // ── Animate close ──
  const startClose = useCallback(() => {
    setIsClosing(true);
    const timer = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 320);
    return () => clearTimeout(timer);
  }, [onClose]);

  // ── Save & restore focus, hide tab bar ──
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;

    requestAnimationFrame(() => {
      if (overlayRef.current) {
        overlayRef.current.focus();
      }
    });

    document.body.classList.add('pcp-overlay-open');

    return () => {
      document.body.classList.remove('pcp-overlay-open');
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [open]);

  // ── Esc key ──
  useEffect(() => {
    if (!open || isClosing) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        startClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, isClosing, startClose]);

  // ── Focus trap ──
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
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
  }, [open]);

  if (!open && !isClosing) return null;

  const overlayClass = [
    'pcp-fullscreen-overlay',
    isClosing ? 'pcp-fullscreen-overlay--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={overlayRef}
      className={overlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      tabIndex={-1}
    >
      {!hideTopBar && (
        <div className="pcp-fullscreen-overlay__topbar">
          <button
            className="pcp-fullscreen-overlay__back"
            onClick={startClose}
            aria-label={backLabel}
            type="button"
          >
            <span aria-hidden="true">&larr;</span>
            <span>{backLabel}</span>
          </button>

          {title && (
            <h2 id={titleId} className="pcp-fullscreen-overlay__title">
              {title}
            </h2>
          )}

          <div className="pcp-fullscreen-overlay__actions">
            {actions || null}
          </div>
        </div>
      )}

      <div className="pcp-fullscreen-overlay__body">{children}</div>
    </div>
  );
}

export default FullScreenOverlay;
