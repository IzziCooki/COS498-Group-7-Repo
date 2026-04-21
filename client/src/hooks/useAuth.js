import { useCallback } from 'react';

/**
 * Authentication actions backed by server-side sessions.
 *
 * The session lives in an HTTP-only cookie; nothing is stored in
 * localStorage on purpose (so tokens can't be lifted by XSS). Every call
 * here uses `credentials: 'include'` so the cookie rides along on
 * cross-origin dev setups.
 */
export function useAuth({ onUserChanged } = {}) {
  const register = useCallback(async ({ email, password, anonymousUserId, name, os_type, comfort_level }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, anonymousUserId, name, os_type, comfort_level }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    if (onUserChanged) onUserChanged(data.user);
    return data.user;
  }, [onUserChanged]);

  const login = useCallback(async ({ email, password }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    if (onUserChanged) onUserChanged(data.user);
    return data.user;
  }, [onUserChanged]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (onUserChanged) onUserChanged(null);
  }, [onUserChanged]);

  return { register, login, logout };
}
