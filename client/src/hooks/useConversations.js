import { useState, useEffect, useCallback } from 'react';

/**
 * useConversations — fetches the conversation list for a user.
 *
 * @param {string|null} userId
 * @returns {{ conversations: object[], refresh: () => void, isLoading: boolean }}
 */
export function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { conversations, refresh, isLoading };
}
