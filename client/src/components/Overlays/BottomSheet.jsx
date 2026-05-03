import React, { useEffect, useRef, useCallback, useState } from 'react';
import './BottomSheet.css';

/**
 * BottomSheet — Mobile-style slide-up panel with drag handle & swipe-to-dismiss.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   height?: string,            // CSS height for the panel (e.g. '75%', '50vh')
 *   children: React.ReactNode,
 *   labelledBy?: string,
 *   className?: string,
 * }} props
 */
function BottomSheet({
  open,
  onClose,
  title,
  height,
  children,
  labelledBy,
  className = '',
}) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  // Swipe tracking
  const touchStartY = useRef(null);
  const currentTranslateY = useRef(0);

  const titleId = labelledBy || 'pcp-bottom-sheet-title';

  // ── Animate close ──
  const startClose = useCallback(() => {
    setIsClosing(true);
    const timer = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 320);
    return () => clearTimeout(timer);
  }, [onClose]);

  // ── Save & restore focus, lock scroll ──
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;

    requestAnimationFrame(() => {
      if (panelRef.current) {
        panelRef.current.focus();
      }
    });

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
      if (e.target === backdropRef.current) {
        startClose();
      }
    },
    [startClose]
  );

  // ── Swipe-to-dismiss (touch) ──
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    // Only allow dragging down (positive delta)
    if (deltaY > 0 && panelRef.current) {
      currentTranslateY.current = deltaY;
      panelRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current === null) return;
    const panel = panelRef.current;

    if (currentTranslateY.current > 100) {
      // Dragged far enough: dismiss
      startClose();
    } else if (panel) {
      // Snap back
      panel.style.transform = '';
    }

    touchStartY.current = null;
    currentTranslateY.current = 0;
  }, [startClose]);

  if (!open && !isClosing) return null;

  const backdropClass = [
    'pcp-bottom-sheet__backdrop',
    isClosing ? 'pcp-bottom-sheet__backdrop--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const panelClass = ['pcp-bottom-sheet__panel', className].filter(Boolean).join(' ');

  const panelStyle = height ? { height } : {};

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
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="pcp-bottom-sheet__handle" aria-hidden="true">
          <div className="pcp-bottom-sheet__handle-bar" />
        </div>

        {/* Header */}
        {title && (
          <div className="pcp-bottom-sheet__header">
            <h2 id={titleId} className="pcp-bottom-sheet__title">
              {title}
            </h2>
            <button
              className="pcp-bottom-sheet__close"
              onClick={startClose}
              aria-label="Close"
              type="button"
            >
              &#x2715;
            </button>
          </div>
        )}

        {/* Body */}
        <div className="pcp-bottom-sheet__body">{children}</div>
      </div>
    </div>
  );
}

export default BottomSheet;
