import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './AuthScreen.css';

/**
 * AuthScreen — the gate in front of the app.
 *
 * Shows Sign in / Create account / Continue without account. Emits
 * `onAuthenticated(user)` once any path succeeds; the parent wires the
 * rest of the app from there.
 */
function AuthScreen({ onAuthenticated, onContinueAnonymous }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const { register, login } = useAuth({ onUserChanged: onAuthenticated });

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function handleContinueAnonymous() {
    setError(null);
    setBusy(true);
    try {
      await onContinueAnonymous();
    } catch (err) {
      setError(err.message || 'Could not continue without an account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">PC Pal</h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to pick up where you left off.'
            : 'Create an account so your conversations are saved.'}
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(null); }}
            type="button"
          >
            Sign in
          </button>
          <button
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('register'); setError(null); }}
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={busy}
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 8 : undefined}
              required
              disabled={busy}
            />
            {mode === 'register' && (
              <small className="auth-hint">At least 8 characters.</small>
            )}
          </label>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button
          type="button"
          className="auth-anon"
          onClick={handleContinueAnonymous}
          disabled={busy}
        >
          Continue without an account
        </button>
        <p className="auth-anon-note">
          You can chat, but nothing will be saved when you close the tab.
        </p>
      </div>
    </div>
  );
}

export default AuthScreen;
