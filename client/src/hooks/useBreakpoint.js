// useBreakpoint — returns 'phone' | 'tablet' | 'desktop' using matchMedia listeners.
// Breakpoints match globals.css reference:
//   phone:   < 640px
//   tablet:  640px - 1024px
//   desktop: > 1024px
import { useEffect, useState } from 'react';

function detect() {
  if (typeof window === 'undefined') return 'phone';
  if (window.matchMedia('(max-width: 639px)').matches) return 'phone';
  if (window.matchMedia('(min-width: 1025px)').matches) return 'desktop';
  return 'tablet';
}

export function useBreakpoint() {
  const [bp, setBp] = useState(() => detect());

  useEffect(() => {
    const mql1 = window.matchMedia('(max-width: 639px)');
    const mql2 = window.matchMedia('(min-width: 1025px)');
    const handler = () => setBp(detect());
    mql1.addEventListener('change', handler);
    mql2.addEventListener('change', handler);
    return () => {
      mql1.removeEventListener('change', handler);
      mql2.removeEventListener('change', handler);
    };
  }, []);

  return bp;
}
