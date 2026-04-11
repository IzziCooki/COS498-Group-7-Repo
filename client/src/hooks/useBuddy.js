import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/buddy';

/**
 * useBuddy — manages buddy/collaboration state.
 *
 * @param {string|null} userId
 * @returns {{ buddyPair, progressShares, pendingReplies, generateInvite, acceptInvite, fetchBuddyData, hasBuddy }}
 */
export function useBuddy(userId) {
  const [buddyPair, setBuddyPair] = useState(null);
  const [progressShares, setProgressShares] = useState([]);
  const [pendingReplies, setPendingReplies] = useState([]);
  const [inviteCode, setInviteCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBuddyData = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/${userId}`);
      const data = await res.json();
      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0];
        setBuddyPair(pair);

        // Fetch progress shares
        const progressRes = await fetch(`${API_BASE}/${pair.id}/progress`);
        const progressData = await progressRes.json();
        setProgressShares(progressData.shares || []);

        // Fetch help requests (answered ones for the learner)
        const helpRes = await fetch(`${API_BASE}/${pair.id}/help`);
        const helpData = await helpRes.json();
        setPendingReplies(helpData.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch buddy data:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchBuddyData();
  }, [fetchBuddyData]);

  const generateInvite = useCallback(async () => {
    if (!userId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return null;
      }
      setInviteCode(data.inviteCode);
      return data.inviteCode;
    } catch (err) {
      setError('Failed to generate invite code');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const acceptInvite = useCallback(async (code) => {
    if (!userId || !code) return null;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, inviteCode: code }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return null;
      }
      setBuddyPair(data.pair);
      return data.pair;
    } catch (err) {
      setError('Failed to accept invite');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    buddyPair,
    progressShares,
    pendingReplies,
    inviteCode,
    isLoading,
    error,
    hasBuddy: !!buddyPair,
    generateInvite,
    acceptInvite,
    fetchBuddyData,
  };
}
