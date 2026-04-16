import { useState, useEffect, useCallback } from 'react';

const USER_ID_KEY = 'pcpal_userId';
const USER_PROFILE_KEY = 'pcpal_profile';

/**
 * Save the full profile to localStorage so it survives server DB resets
 * (common on HuggingFace Spaces / container deployments).
 */
function saveProfileLocally(user) {
  if (!user) return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify({
    name: user.name,
    os_type: user.os_type,
    comfort_level: user.comfort_level,
    vocabulary_level: user.vocabulary_level,
    is_onboarded: true,
  }));
}

/**
 * useUser — User profile hook for PC Pal
 *
 * Checks localStorage for an existing userId on mount.
 * If found, loads the profile from the API.
 * If the server lost the profile (container restart), silently re-creates
 * it from the localStorage backup — no re-onboarding needed.
 *
 * @returns {{ user, isOnboarded, isLoading, createUser, completeOnboarding, updateProfile }}
 */
export function useUser() {
  const [user, setUser] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    // Check synchronously during init — if nothing saved, don't load
    const hasSaved = Boolean(localStorage.getItem(USER_ID_KEY) || localStorage.getItem(USER_PROFILE_KEY));
    return hasSaved;
  });

  // On mount: restore user from server or localStorage backup
  useEffect(() => {
    const savedId = localStorage.getItem(USER_ID_KEY);
    const savedProfile = localStorage.getItem(USER_PROFILE_KEY);

    // Nothing saved — isLoading is already false from init
    if (!savedId && !savedProfile) return;

    async function restoreUser() {
      // Try loading from server first
      if (savedId) {
        try {
          const res = await fetch(`/api/users/${savedId}`);
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            setIsOnboarded(Boolean(data.is_onboarded ?? data.isOnboarded));
            saveProfileLocally(data);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('PC Pal: server fetch failed, trying local restore', err);
        }
      }

      // Server doesn't have the user (DB reset) — re-create from local profile
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: profile.name,
              os_type: profile.os_type,
              comfort_level: profile.comfort_level,
            }),
          });
          if (res.ok) {
            const newUser = await res.json();
            localStorage.setItem(USER_ID_KEY, newUser.id);

            // Mark as onboarded
            await fetch(`/api/users/${newUser.id}/onboard`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });

            setUser({ ...newUser, is_onboarded: true });
            setIsOnboarded(true);
            console.log('PC Pal: profile restored from local backup');
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('PC Pal: failed to restore profile', err);
        }
      }

      // All restore attempts failed — clear and start fresh
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(USER_PROFILE_KEY);
      setIsLoading(false);
    }

    restoreUser();
  }, []);

  /**
   * Create a new user account.
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
    saveProfileLocally(newUser);
    setUser(newUser);
    return newUser;
  }, []);

  /**
   * Mark the user as having completed onboarding.
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
    saveProfileLocally(updatedUser);
    return updatedUser;
  }, []);

  /**
   * Update profile fields (name, os_type, comfort_level).
   */
  const updateProfile = useCallback(async (fields) => {
    if (!user?.id) return;
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });

    if (!res.ok) {
      throw new Error('Failed to update profile');
    }

    const updatedUser = await res.json();
    setUser(updatedUser);
    saveProfileLocally(updatedUser);
    return updatedUser;
  }, [user]);

  return { user, isOnboarded, isLoading, createUser, completeOnboarding, updateProfile };
}
