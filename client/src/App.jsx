import React, { useState } from 'react';
import { useUser } from './hooks/useUser';
import { useBuddy } from './hooks/useBuddy';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Header from './components/Layout/Header';
import ChatWindow from './components/Chat/ChatWindow';
import BuddyPanel from './components/Collaboration/BuddyPanel';

/**
 * App — root component for PC Pal.
 *
 * Shows the OnboardingFlow for new users.
 * Once onboarded, shows the Header + ChatWindow + BuddyPanel.
 */
function App() {
  const { user, isOnboarded, isLoading, createUser, completeOnboarding, updateProfile } = useUser();
  const buddyData = useBuddy(user?.id);
  const [buddyPanelOpen, setBuddyPanelOpen] = useState(false);

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

  // Count unseen progress shares for badge
  const buddyBadge = buddyData.progressShares.filter(s => !s.seen).length;

  // Onboarded — show the main chat UI
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Header
        user={user}
        onBuddyClick={() => setBuddyPanelOpen(true)}
        buddyBadge={buddyBadge}
        onUpdateProfile={updateProfile}
      />
      {user && <ChatWindow userId={user.id} hasBuddy={buddyData.hasBuddy} />}

      <BuddyPanel
        isOpen={buddyPanelOpen}
        onClose={() => setBuddyPanelOpen(false)}
        buddyData={buddyData}
      />
    </div>
  );
}

export default App;
