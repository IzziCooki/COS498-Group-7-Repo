import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pcpal:a11y-prefs';

const DEFAULTS = {
  textSize: 'normal',     // 'normal' | 'large' | 'xlarge'
  highContrast: false,
  readAloud: false,
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function applyToRoot(prefs) {
  const root = document.documentElement;
  root.dataset.textSize = prefs.textSize;
  root.dataset.contrast = prefs.highContrast ? 'high' : 'normal';
}

export function useAccessibilityPrefs() {
  const [prefs, setPrefs] = useState(loadPrefs);

  useEffect(() => {
    applyToRoot(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage errors (quota/private mode)
    }
  }, [prefs]);

  const setTextSize = useCallback((textSize) => {
    setPrefs((p) => ({ ...p, textSize }));
  }, []);

  const cycleTextSize = useCallback((direction) => {
    setPrefs((p) => {
      const order = ['normal', 'large', 'xlarge'];
      const idx = order.indexOf(p.textSize);
      const nextIdx = direction === 'up'
        ? Math.min(order.length - 1, idx + 1)
        : Math.max(0, idx - 1);
      return { ...p, textSize: order[nextIdx] };
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setPrefs((p) => ({ ...p, highContrast: !p.highContrast }));
  }, []);

  const toggleReadAloud = useCallback(() => {
    setPrefs((p) => ({ ...p, readAloud: !p.readAloud }));
  }, []);

  return {
    prefs,
    setTextSize,
    cycleTextSize,
    toggleHighContrast,
    toggleReadAloud,
  };
}
