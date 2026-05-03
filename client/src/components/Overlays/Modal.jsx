import React, { useEffect, useRef, useCallback, useState } from 'react';
import './Modal.css';

/**
 * Modal — centered dialog on tablet/desktop, full-screen sheet on phone.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   persistent?: boolean,       // if true, backdrop click does NOT close
 *   children: React.ReactNode,
 *   labelledBy?: string,        // custom aria-labelledby (overrides default)
 *   describedBy?: string,       // aria-describedby
 *   className?: string,         // extra class on the panel
 * }} props
 */
function Modal({
  open,
  onClose,
  title,
  persistent = false,
  children,
  labelledBy,
  describedBy,
  className = '',
}) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const titleId = labelledBy || 'pcp-modal-title';

  // ── Animate close ──
  const startClose = useCallback(() => {
    setIsClosing(true);
    // Wait for the exit animation before actually unmounting
    const timer = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 320); // match longest animation (phone slide: 320ms)
    return () => clearTimeout(timer);
  }, [onClose]);

  // ── Save & restore focus, lock body scroll ──
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;

    // Focus the panel after a tick so it's mounted
    requestAnimationFrame(() => {
      if (panelRef.current) {
        panelRef.current.focus();
      }
    });

    // Prevent body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prev;
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
    const panel = panelRef.current;
    if (!panel) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = panel.querySelectorAll(
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

  // ── Backdrop click ──
  const handleBackdropClick = useCallback(
    (e) => {
      if (!persistent && e.target === backdropRef.current) {
        startClose();
      }
    },
    [persistent, startClose]
  );

  if (!open && !isClosing) return null;

  const backdropClass = [
    'pcp-modal__backdrop',
    isClosing ? 'pcp-modal__backdrop--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const panelClass = ['pcp-modal__panel', className].filter(Boolean).join(' ');

  return (
    <div
      ref={backdropRef}
      className={backdropClass}
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          className="pcp-modal__close"
          onClick={startClose}
          aria-label="Close"
          type="button"
        >
          &#x2715;
        </button>

        {title && (
          <div className="pcp-modal__header">
            <h2 id={titleId} className="pcp-modal__title">
              {title}
            </h2>
          </div>
        )}

        <div className="pcp-modal__body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
