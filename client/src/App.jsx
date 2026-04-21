import React, { useState, useCallback, useRef } from 'react';
import { useUser } from './hooks/useUser';
import { useAuth } from './hooks/useAuth';
import { useBuddy } from './hooks/useBuddy';
import { useConversations } from './hooks/useConversations';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import AuthScreen from './components/Auth/AuthScreen';
import Header from './components/Layout/Header';
import ChatWindow from './components/Chat/ChatWindow';
import ConversationSidebar from './components/Chat/ConversationSidebar';
import BuddyPanel from './components/Collaboration/BuddyPanel';
import FamilyDashboard from './components/Dashboard/FamilyDashboard';
import AdminFeedback from './components/Admin/AdminFeedback';

/**
 * App — root component for PC Pal.
 *
 * Shows the OnboardingFlow for new users.
 * Once onboarded, shows the Header + Sidebar + ChatWindow + BuddyPanel.
 */
function App() {
  const { user, isOnboarded, isLoading, createUser, completeOnboarding, updateProfile, applyUser } = useUser();
  const { logout } = useAuth({ onUserChanged: applyUser });
  const buddyData = useBuddy(user?.id);
  const [buddyPanelOpen, setBuddyPanelOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'dashboard' | 'admin'
  const [buddySessionTarget, setBuddySessionTarget] = useState(null);
  const [buddySessionActive, setBuddySessionActive] = useState(false);
  // null = viewing live/active conversation, string = viewing a past conversation
  const [viewingConversationId, setViewingConversationId] = useState(null);

  const { conversations, refresh: refreshConversations } = useConversations(user?.id);

  // Ref to ChatWindow's startNewChat so the sidebar can trigger it
  const chatWindowRef = useRef(null);

  const handleNewChat = useCallback(() => {
    setViewingConversationId(null);
    if (chatWindowRef.current) {
      chatWindowRef.current();
    }
    // Refresh sidebar after a brief delay to pick up the new conversation
    setTimeout(refreshConversations, 500);
  }, [refreshConversations]);

  const handleSelectConversation = useCallback((convId) => {
    // null means switch back to the live conversation
    setViewingConversationId(convId);
  }, []);

  const handleConversationChange = useCallback(() => {
    refreshConversations();
  }, [refreshConversations]);

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

  // No session at all — show the auth gate. "Continue without account"
  // creates an anonymous user (session cookie only, conversations won't
  // persist), and register/login populate the user directly.
  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={applyUser}
        onContinueAnonymous={() => createUser({})}
      />
    );
  }

  // User exists but hasn't finished the profile wizard — show onboarding.
  // Anonymous users go through it too so the agent has device/comfort context.
  if (!isOnboarded) {
    return (
      <OnboardingFlow
        createUser={createUser}
        completeOnboarding={completeOnboarding}
        existingUser={user}
      />
    );
  }

  // Count unseen progress shares for badge
  const buddyBadge = buddyData.progressShares.filter(s => !s.seen).length;

  // Find the active conversation id from the list for sidebar highlighting
  const activeConv = conversations.find(c => c.status === 'active');
  const activeConversationId = activeConv ? activeConv.id : null;

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
        onDashboardClick={() => setCurrentView(prev => prev === 'dashboard' ? 'chat' : 'dashboard')}
        showingDashboard={currentView === 'dashboard'}
        onAdminClick={() => setCurrentView(prev => prev === 'admin' ? 'chat' : 'admin')}
        showingAdmin={currentView === 'admin'}
        onSignOut={logout}
      />
      {currentView === 'admin' ? (
        <AdminFeedback onClose={() => setCurrentView('chat')} />
      ) : currentView === 'dashboard' ? (
        <FamilyDashboard
          buddyPairs={buddyData.buddyPair ? [buddyData.buddyPair] : []}
          currentUserId={user?.id}
          onBack={() => setCurrentView('chat')}
        />
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            viewingConversationId={viewingConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          />
          {user && (
            <ChatWindow
              userId={user.id}
              hasBuddy={buddyData.hasBuddy}
              viewingConversationId={viewingConversationId}
              onConversationChange={handleConversationChange}
              startNewChatRef={chatWindowRef}
              buddySessionTarget={buddySessionTarget}
              onBuddySessionChange={setBuddySessionActive}
            />
          )}
        </div>
      )}

      <BuddyPanel
        isOpen={buddyPanelOpen}
        onClose={() => setBuddyPanelOpen(false)}
        buddyData={buddyData}
        currentUserId={user?.id}
        onJoinSession={(targetId) => { setBuddySessionTarget(targetId); setBuddyPanelOpen(false); }}
        onLeaveSession={() => setBuddySessionTarget(null)}
        isInSession={buddySessionActive}
      />
    </div>
  );
}

export default App;
