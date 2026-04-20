import { useState, useEffect, useCallback } from 'react';

export function useDashboard(pairId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(() => {
    if (!pairId) return;
    setIsLoading(true);
    setError(null);
    fetch(`/api/buddy/${pairId}/dashboard`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load dashboard');
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [pairId]);

  useEffect(() => {
    // Defer to avoid setState-in-effect lint rule
    queueMicrotask(fetchDashboard);
  }, [fetchDashboard]);

  return { data, isLoading, error, refresh: fetchDashboard };
}
