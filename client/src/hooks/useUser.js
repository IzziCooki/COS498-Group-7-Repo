import { useState, useEffect, useCallback } from 'react';

/**
 * useUser — user profile + auth state for PC Pal.
 *
 * On mount:
 *   1. Try GET /api/auth/me to see if a session cookie is already valid.
 *   2. Otherwise land in the unauthenticated state and let the caller
 *      (App.jsx) show the AuthScreen.
 *
 * There are three kinds of users:
 *   - Logged-in (email + password, is_anonymous=0): conversations persist
 *   - Anonymous (session cookie but no email): chat works, nothing saves
 *   - Not yet present: auth screen
 */
export function useUser() {
  const [user, setUser] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const applyUser = useCallback((data) => {
    setUser(data);
    setIsOnboarded(Boolean(data && (data.onboarded ?? data.is_onboarded ?? data.isOnboarded)));
  }, []);

  // On mount: ask the server who we are. The session cookie is the
  // authoritative source of identity.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) applyUser(data.user);
        } else {
          if (!cancelled) applyUser(null);
        }
      } catch (err) {
        console.warn('PC Pal: /api/auth/me failed', err);
        if (!cancelled) applyUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, [applyUser]);

  /**
   * Create a new *anonymous* user — no email, no password. The server
   * issues a session cookie so subsequent requests are authenticated.
   * Conversations from this session are ephemeral and wiped on disconnect.
   */
  const createUser = useCallback(async (data) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create user: ${err}`);
    }
    const newUser = await res.json();
    applyUser(newUser);
    return newUser;
  }, [applyUser]);

  const completeOnboarding = useCallback(async (userId) => {
    const res = await fetch(`/api/users/${userId}/onboard`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to complete onboarding: ${err}`);
    }
    const updated = await res.json();
    applyUser(updated);
    return updated;
  }, [applyUser]);

  const updateProfile = useCallback(async (fields) => {
    if (!user?.id) {
      throw new Error('No user loaded — please reload the page.');
    }
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Failed to update profile (${res.status}): ${body || 'unknown error'}`);
    }
    const updated = await res.json();
    applyUser(updated);
    return updated;
  }, [user, applyUser]);

  return {
    user,
    isOnboarded,
    isLoading,
    isAuthenticated: Boolean(user && !user.is_anonymous && user.email),
    isAnonymous: Boolean(user && user.is_anonymous),
    applyUser,
    createUser,
    completeOnboarding,
    updateProfile,
  };
}
