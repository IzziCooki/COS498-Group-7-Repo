import React, { useState, useEffect, useCallback } from 'react';
import ScreenWelcome from './ScreenWelcome';
import ScreenCapabilities from './ScreenCapabilities';
import ScreenNameDevice from './ScreenNameDevice';
import ScreenComfort from './ScreenComfort';
import ScreenGoal from './ScreenGoal';
import ScreenBuddy from './ScreenBuddy';
import './Onboarding.css';

const TOTAL_STEPS = 6;
const STORAGE_KEY = 'pcpal-onboarding-state';
const EXPIRY_DAYS = 7;

/**
 * Load saved onboarding progress from localStorage.
 * Returns null if not found or expired.
 */
function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Check expiry
    if (saved.savedAt) {
      const elapsed = Date.now() - saved.savedAt;
      const maxAge = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (elapsed > maxAge) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }
    return saved;
  } catch {
    return null;
  }
}

/**
 * Save onboarding progress to localStorage.
 */
function saveState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, savedAt: Date.now() })
    );
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

/**
 * Clear onboarding progress from localStorage.
 */
function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

/**
 * Onboarding — orchestrator managing the 6-screen onboarding flow.
 *
 * Props:
 *   createUser         — async fn to create/update user profile
 *   completeOnboarding — async fn(userId) to mark onboarding done
 *   existingUser       — current user object (may be anonymous)
 *   onBuddyCode        — optional callback(code) when buddy code is generated
 */
function Onboarding({ createUser, completeOnboarding, existingUser, onBuddyCode }) {
  // Attempt to restore saved state
  const saved = loadSavedState();

  const [step, setStep] = useState(saved?.step || 1);
  const [direction, setDirection] = useState('forward');
  const [name, setName] = useState(saved?.name || '');
  const [device, setDevice] = useState(saved?.device || '');
  const [comfort, setComfort] = useState(saved?.comfort || '');
  const [goal, setGoal] = useState(saved?.goal || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Persist state on every change
  useEffect(() => {
    saveState({ step, name, device, comfort, goal });
  }, [step, name, device, comfort, goal]);

  const goForward = useCallback(() => {
    setDirection('forward');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setDirection('back');
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  /**
   * Complete onboarding — submit profile data + mark as onboarded.
   * @param {boolean} wantsBuddy
   */
  const handleComplete = useCallback(
    async (wantsBuddy) => {
      setIsSubmitting(true);
      setError(null);
      try {
        // Map comfort string to numeric level for backward compatibility
        const comfortMap = { beginner: 1, learning: 2, comfortable: 3, confident: 4 };
        const comfortLevel = comfortMap[comfort] || 2;

        // Map device to os_type for backward compatibility
        const osMap = { mac: 'Mac', windows: 'Windows', iphone: 'iPhone', android: 'Android', debian: 'Debian', unknown: 'unknown' };
        const osType = osMap[device] || 'unknown';

        // Create or update the user profile
        let user;
        if (existingUser && existingUser.id) {
          const res = await fetch(`/api/users/${existingUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: name.trim(),
              os_type: osType,
              comfort_level: comfortLevel,
              goal_summary: goal.trim() || null,
              collaboration_opt_in: wantsBuddy ? 1 : 0,
            }),
          });
          if (!res.ok) throw new Error('Profile update failed.');
          user = await res.json();
        } else {
          user = await createUser({
            name: name.trim(),
            os_type: osType,
            comfort_level: comfortLevel,
            goal_summary: goal.trim() || null,
            collaboration_opt_in: wantsBuddy ? 1 : 0,
          });
        }

        // If user wants a buddy, generate invite code
        if (wantsBuddy) {
          try {
            const res = await fetch('/api/buddy/invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (data.inviteCode && onBuddyCode) {
              onBuddyCode(data.inviteCode);
            }
          } catch (e) {
            console.error('Failed to generate invite code:', e);
          }
        }

        // Mark onboarding complete
        await completeOnboarding(user.id);

        // Clear saved progress
        clearState();
      } catch (err) {
        setError('Something went wrong. Please try again.');
        console.error('Onboarding error:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, device, comfort, goal, existingUser, createUser, completeOnboarding, onBuddyCode]
  );

  // Screen 6 handlers
  const handleGetCode = useCallback(() => {
    handleComplete(true);
  }, [handleComplete]);

  const handleBuddySkip = useCallback(() => {
    handleComplete(false);
  }, [handleComplete]);

  // Screen 5 skip handler (goal = null)
  const handleGoalSkip = useCallback(() => {
    setGoal('');
    setDirection('forward');
    setStep(6);
  }, []);

  // Show submitting overlay
  if (isSubmitting) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          fontSize: 'var(--font-size-md)',
          color: 'var(--color-text-2)',
          background: 'var(--color-surface)',
        }}
        role="status"
        aria-live="polite"
      >
        Setting things up...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          padding: 'var(--space-6)',
          background: 'var(--color-surface)',
          textAlign: 'center',
        }}
        role="alert"
      >
        <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-danger)' }}>
          {error}
        </p>
        <button
          type="button"
          className="pcp-btn pcp-btn--primary"
          onClick={() => { setError(null); }}
          style={{ minHeight: 'var(--tap-primary)' }}
        >
          Try again
        </button>
      </div>
    );
  }

  switch (step) {
    case 1:
      return (
        <ScreenWelcome
          onNext={goForward}
          direction={direction}
        />
      );
    case 2:
      return (
        <ScreenCapabilities
          onNext={goForward}
          onBack={goBack}
          direction={direction}
        />
      );
    case 3:
      return (
        <ScreenNameDevice
          name={name}
          onNameChange={setName}
          device={device}
          onDeviceChange={setDevice}
          onNext={goForward}
          onBack={goBack}
          direction={direction}
        />
      );
    case 4:
      return (
        <ScreenComfort
          comfort={comfort}
          onComfortChange={setComfort}
          onNext={goForward}
          onBack={goBack}
          direction={direction}
        />
      );
    case 5:
      return (
        <ScreenGoal
          goal={goal}
          onGoalChange={setGoal}
          onNext={goForward}
          onSkip={handleGoalSkip}
          onBack={goBack}
          direction={direction}
        />
      );
    case 6:
      return (
        <ScreenBuddy
          onGetCode={handleGetCode}
          onSkip={handleBuddySkip}
          onBack={goBack}
          direction={direction}
        />
      );
    default:
      return null;
  }
}

export default Onboarding;
