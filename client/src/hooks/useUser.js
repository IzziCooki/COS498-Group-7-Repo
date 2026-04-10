import { useState, useEffect, useCallback } from 'react';

const USER_ID_KEY = 'pcpal_userId';

/**
 * useUser — User profile hook for PC Pal
 *
 * Checks localStorage for an existing userId on mount.
 * If found, loads the profile from the API.
 * Exposes helpers to create a user and complete onboarding.
 *
 * @returns {{ user, isOnboarded, isLoading, createUser, completeOnboarding }}
 */
export function useUser() {
  const [user, setUser] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check localStorage for a saved userId
  useEffect(() => {
    const savedId = localStorage.getItem(USER_ID_KEY);

    if (!savedId) {
      setIsLoading(false);
      return;
    }

    // Fetch the user profile
    fetch(`/api/users/${savedId}`)
      .then((res) => {
        if (!res.ok) {
          // User not found on server — clear stale localStorage entry
          localStorage.removeItem(USER_ID_KEY);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          setIsOnboarded(Boolean(data.is_onboarded ?? data.isOnboarded));
        }
      })
      .catch((err) => {
        console.error('PC Pal: failed to load user profile', err);
        localStorage.removeItem(USER_ID_KEY);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  /**
   * Create a new user account.
   * @param {{ name: string, os_type: string, comfort_level: number }} data
   * @returns {Promise<object>} the created user
   */
  const createUser = useCallback(async (data) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create user: ${err}`);
    }

    const newUser = await res.json();
    localStorage.setItem(USER_ID_KEY, newUser.id);
    setUser(newUser);
    return newUser;
  }, []);

  /**
   * Mark the user as having completed onboarding.
   * @param {string|number} userId
   * @returns {Promise<object>} the updated user
   */
  const completeOnboarding = useCallback(async (userId) => {
    const res = await fetch(`/api/users/${userId}/onboard`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to complete onboarding: ${err}`);
    }

    const updatedUser = await res.json();
    setUser(updatedUser);
    setIsOnboarded(true);
    return updatedUser;
  }, []);

  return { user, isOnboarded, isLoading, createUser, completeOnboarding };
}
