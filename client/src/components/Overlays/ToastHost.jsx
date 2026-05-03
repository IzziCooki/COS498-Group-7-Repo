import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '../../hooks/useToast';
import './ToastHost.css';

const ICONS = {
  success: '\u2714',  // checkmark
  error: '\u26A0',    // warning
  info: '\u2139',     // info circle
};

/**
 * ToastHost — Singleton component that renders the current toast.
 * Mount once at the top of the React tree (outside ShellLayout).
 */
function ToastHost() {
  const ctx = useToast();
  const toast = ctx?.current;
  const dismiss = ctx?.dismiss;

  const [exiting, setExiting] = useState(false);
  const toastRef = useRef(null);

  // Swipe-to-dismiss tracking
  const touchStartX = useRef(null);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    const timer = setTimeout(() => {
      setExiting(false);
      if (dismiss) dismiss();
    }, 200);
    return () => clearTimeout(timer);
  }, [dismiss]);

  // Reset exiting state when a new toast arrives
  useEffect(() => {
    setExiting(false);
  }, [toast?.id]);

  // Swipe right to dismiss
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX > 80) {
        handleDismiss();
      }
      touchStartX.current = null;
    },
    [handleDismiss]
  );

  if (!toast) return null;

  const kind = toast.kind || 'info';
  const ariaLive = kind === 'error' ? 'assertive' : 'polite';

  const toastClass = [
    'pcp-toast',
    `pcp-toast--${kind}`,
    exiting ? 'pcp-toast--exiting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="pcp-toast-host" aria-live={ariaLive} aria-atomic="true" role="status">
      <div
        ref={toastRef}
        className={toastClass}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span className="pcp-toast__icon" aria-hidden="true">
          {ICONS[kind]}
        </span>

        <span className="pcp-toast__text">{toast.text}</span>

        {toast.action && (
          <button
            className="pcp-toast__action"
            onClick={() => {
              toast.action.onClick();
              handleDismiss();
            }}
            type="button"
          >
            {toast.action.label}
          </button>
        )}

        <button
          className="pcp-toast__dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
          type="button"
        >
          &#x2715;
        </button>
      </div>
    </div>
  );
}

export default ToastHost;
