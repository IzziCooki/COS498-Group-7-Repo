import { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * Toast context and provider for the PC Pal app.
 *
 * Usage:
 *   // In App.jsx:
 *   <ToastProvider>
 *     <AppContent />
 *     <ToastHost />
 *   </ToastProvider>
 *
 *   // In any component:
 *   const { toast } = useToast();
 *   toast({ kind: 'success', text: 'Saved!' });
 *   toast({ kind: 'error', text: 'Network error.', action: { label: 'Retry', onClick } });
 */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [current, setCurrent] = useState(null);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrent(null);
  }, []);

  const toast = useCallback(
    ({ kind = 'info', text, duration, action }) => {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const id = Date.now();
      const ms = duration || (kind === 'error' ? 6000 : 4000);

      setCurrent({ kind, text, action, id });

      timerRef.current = setTimeout(() => {
        setCurrent((prev) => (prev?.id === id ? null : prev));
        timerRef.current = null;
      }, ms);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss, current }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
