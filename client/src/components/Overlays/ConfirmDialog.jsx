import React, { useEffect, useRef, useCallback, useState } from 'react';
import './ConfirmDialog.css';

/**
 * ConfirmDialog — Simple title + body + two-button confirmation.
 * Always centered (even on phone). Focus-trapped.
 *
 * @param {{
 *   open: boolean,
 *   onCancel: () => void,
 *   onConfirm: () => void,
 *   title: string,
 *   body?: string,
 *   cancelLabel?: string,
 *   confirmLabel?: string,
 *   destructive?: boolean,       // if true, confirm button uses danger color
 *   labelledBy?: string,
 * }} props
 */
function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  body,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  destructive = false,
  labelledBy,
}) {
  const cardRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const titleId = labelledBy || 'pcp-confirm-title';
  const bodyId = body ? 'pcp-confirm-body' : undefined;

  // ── Animate close (shared by both cancel and confirm) ──
  const animateClose = useCallback(
    (callback) => {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsClosing(false);
        callback();
      }, 200);
      return () => clearTimeout(timer);
    },
    []
  );

  const handleCancel = useCallback(() => {
    animateClose(onCancel);
  }, [animateClose, onCancel]);

  const handleConfirm = useCallback(() => {
    animateClose(onConfirm);
  }, [animateClose, onConfirm]);

  // ── Save & restore focus ──
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;

    requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.focus();
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

  // ── Esc key → cancel ──
  useEffect(() => {
    if (!open || isClosing) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleCancel();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, isClosing, handleCancel]);

  // ── Focus trap ──
  useEffect(() => {
    if (!open) return;
    const card = cardRef.current;
    if (!card) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = card.querySelectorAll(
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

  const backdropClass = [
    'pcp-confirm__backdrop',
    isClosing ? 'pcp-confirm__backdrop--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const confirmBtnClass = [
    'pcp-confirm__btn',
    destructive ? 'pcp-confirm__btn--destructive' : 'pcp-confirm__btn--confirm',
  ].join(' ');

  return (
    <div className={backdropClass} aria-hidden="true">
      <div
        ref={cardRef}
        className="pcp-confirm__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
      >
        <h2 id={titleId} className="pcp-confirm__title">
          {title}
        </h2>

        {body && (
          <p id={bodyId} className="pcp-confirm__body">
            {body}
          </p>
        )}

        <div className="pcp-confirm__actions">
          <button
            className="pcp-confirm__btn pcp-confirm__btn--cancel"
            onClick={handleCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={confirmBtnClass}
            onClick={handleConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
