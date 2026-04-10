import React from 'react';
import { useUser } from './hooks/useUser';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Header from './components/Layout/Header';
import ChatWindow from './components/Chat/ChatWindow';

/**
 * App — root component for PC Pal.
 *
 * Shows the OnboardingFlow for new users.
 * Once onboarded, shows the Header + ChatWindow.
 */
function App() {
  const { user, isOnboarded, isLoading, createUser, completeOnboarding } = useUser();

  // While checking localStorage / fetching user, show a loading screen
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          color: 'var(--color-text-light)',
        }}
        role="status"
        aria-live="polite"
      >
        Loading PC Pal...
      </div>
    );
  }

  // Not yet onboarded — show the wizard
  if (!isOnboarded) {
    return (
      <OnboardingFlow
        createUser={createUser}
        completeOnboarding={completeOnboarding}
      />
    );
  }

  // Onboarded — show the main chat UI
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header user={user} />
      {user && <ChatWindow userId={user.id} />}
    </div>
  );
}

export default App;
