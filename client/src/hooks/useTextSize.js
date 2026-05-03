import { useEffect, useState } from 'react';

export function useTextSize() {
  const [textSize, setTextSize] = useState(() => {
    return localStorage.getItem('pcpal-text-size') || 'default';
  });

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
    localStorage.setItem('pcpal-text-size', textSize);
  }, [textSize]);

  return [textSize, setTextSize];
}
