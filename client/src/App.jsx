import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from './router';
import { RoleProvider, useRole } from './contexts/RoleContext';
import { useUser } from './hooks/useUser';
import { useAuth } from './hooks/useAuth';
import { useBuddy } from './hooks/useBuddy';
import { useConversations } from './hooks/useConversations';
import ShellLayout from './components/ShellLayout/ShellLayout';
import Onboarding from './components/Onboarding/Onboarding';
import AuthScreen from './components/Auth/AuthScreen';
// ChatWindow import retained for backward compatibility (not rendered)
// import ChatWindow from './components/Chat/ChatWindow';
import ChatScreen from './components/ChatScreen/ChatScreen';
import ConversationSidebar from './components/Chat/ConversationSidebar';
import BuddyPanel from './components/Collaboration/BuddyPanel';
import FamilyDashboard from './components/Dashboard/FamilyDashboard';
import AdminFeedback from './components/Admin/AdminFeedback';
import { ToastProvider } from './hooks/useToast';
import ToastHost from './components/Overlays/ToastHost';

/* ── Helper components (Phase 6) ─────────────────────────────────── */
import HelperHome from './components/Helper/HelperHome';
import HelperSessions from './components/Helper/HelperSessions';
import HelperTools from './components/Helper/HelperTools';
import HelperMe from './components/Helper/HelperMe';
import ReplyComposer from './components/Helper/ReplyComposer';
import WatchView from './components/Helper/WatchView';
import PairingFlow from './components/Helper/PairingFlow';

/* ── Me tab (Phase 9) ──────────────────────────────────────────── */
import MeScreen from './components/Profile/MeScreen';

/* ── Placeholder components for views not yet built ────────────── */

function HistoryPlaceholder() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--space-6)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)', color: 'var(--color-text-1)' }}>
          My Conversations
        </h2>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-2)' }}>
          Your conversation history will appear here.
        </p>
      </div>
    </div>
  );
}

function HelperPlaceholder() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--space-6)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)', color: 'var(--color-text-1)' }}>
          My Helper
        </h2>
        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-2)' }}>
          Connect with a helper who can assist you when you get stuck.
        </p>
      </div>
    </div>
  );
}

/* ── View title mapping ────────────────────────────────────────── */

const VIEW_TITLES = {
  chat: 'Chat with PC Pal',
  history: 'My Conversations',
  helper: 'My Helper',
  me: 'Me',
  admin: 'Admin Feedback',
  'helper-home': 'Home',
  'helper-sessions': 'Sessions',
  'helper-tools': 'Tools',
  'helper-me': 'Me',
  pair: 'Pair',
  'reply-composer': 'Reply',
  'watch-view': 'Watch',
};

/* ── Inner content component (needs router + role context) ───── */

function AppContent() {
  const { view, navigate, back } = useRouter();
  const { user, isOnboarded, isLoading, createUser, completeOnboarding, updateProfile, applyUser } = useUser();
  const { logout } = useAuth({ onUserChanged: applyUser });
  const buddyData = useBuddy(user?.id);
  const { role, activeLearner, detectAndApplyRole } = useRole();
  const [buddyPanelOpen, setBuddyPanelOpen] = useState(false);
  const [buddySessionTarget, setBuddySessionTarget] = useState(null);
  const [buddySessionActive, setBuddySessionActive] = useState(false);
  const [viewingConversationId, setViewingConversationId] = useState(null);

  // ── Helper-specific state ──
  const [replyQuestion, setReplyQuestion] = useState(null);
  const [watchActive, setWatchActive] = useState(false);
  const [watchMessages, setWatchMessages] = useState([]);
  const [toolsHistory, setToolsHistory] = useState([]);

  const { conversations, refresh: refreshConversations } = useConversations(user?.id);

  const chatWindowRef = useRef(null);

  // ── Role detection: run when buddy data or user changes ──
  useEffect(() => {
    if (user?.id && buddyData.buddyPair) {
      detectAndApplyRole(buddyData.buddyPair, user.id);
    }
  }, [user?.id, buddyData.buddyPair, detectAndApplyRole]);

  // ── Auto-redirect helper to helper-home when on learner routes ──
  useEffect(() => {
    if (role === 'helper' && (view === 'chat' || view === 'history' || view === 'helper')) {
      navigate('/helper/home', { replace: true });
    }
  }, [role, view, navigate]);

  const handleNewChat = useCallback(() => {
    setViewingConversationId(null);
    if (chatWindowRef.current) {
      chatWindowRef.current();
    }
    setTimeout(refreshConversations, 500);
  }, [refreshConversations]);

  const handleSelectConversation = useCallback((convId) => {
    setViewingConversationId(convId);
  }, []);

  const handleConversationChange = useCallback(() => {
    refreshConversations();
  }, [refreshConversations]);

  // ── Helper action handlers ──
  const handleHelperCall = useCallback(() => {
    // Placeholder: would initiate a call to the learner
    console.log('Call learner:', activeLearner?.name);
  }, [activeLearner]);

  const handleHelperWatch = useCallback(() => {
    setWatchActive(true);
    // Placeholder: would request watch permission from the learner
    setWatchMessages([
      { id: '1', sender: 'ai', text: 'Hello! What can I help you with today?', timestamp: Date.now() - 60000 },
      { id: '2', sender: 'learner', text: 'How do I send an attachment?', timestamp: Date.now() - 30000 },
    ]);
  }, []);

  const handleStopWatch = useCallback(() => {
    setWatchActive(false);
    setWatchMessages([]);
  }, []);

  const handleNudge = useCallback((text) => {
    console.log('Nudge sent:', text);
  }, []);

  const handleRunCommand = useCallback(async (cmd) => {
    // Placeholder: would send command to server
    const result = {
      id: `cmd-${Date.now()}`,
      command: cmd,
      success: true,
      summary: 'Command executed successfully',
      details: `$ ${cmd}\n[simulated output]`,
    };
    setToolsHistory((prev) => [result, ...prev]);
    return result;
  }, []);

  const handleReply = useCallback((questionId) => {
    const q = buddyData.pendingReplies?.find((r) => r.id === questionId);
    setReplyQuestion(q || { id: questionId, text: 'Question', askedAgo: 'recently' });
  }, [buddyData.pendingReplies]);

  const handleSendReply = useCallback(({ reply, useAiGuide }) => {
    console.log('Send reply:', reply, 'AI guide:', useAiGuide);
    setReplyQuestion(null);
  }, []);

  const handlePairConnect = useCallback(async (code) => {
    const result = await buddyData.acceptInvite(code);
    if (result) {
      navigate('/helper/home');
    }
  }, [buddyData, navigate]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          color: 'var(--color-text-2)',
        }}
        role="status"
        aria-live="polite"
      >
        Loading PC Pal...
      </div>
    );
  }

  // ── Auth gate ──
  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={applyUser}
        onContinueAnonymous={() => createUser({})}
      />
    );
  }

  // ── Onboarding gate ──
  if (!isOnboarded) {
    return (
      <Onboarding
        createUser={createUser}
        completeOnboarding={completeOnboarding}
        existingUser={user}
      />
    );
  }

  // ── Derived state ──
  const activeConv = conversations.find(c => c.status === 'active');
  const activeConversationId = activeConv ? activeConv.id : null;

  // ── Determine a back handler for drilled-in views ──
  const isSubView = view === 'guide' || view === 'me-sub';
  const onBack = isSubView ? back : undefined;

  // ── Derive helper data for display ──
  const learnerName = activeLearner?.name || 'Learner';
  const helperAlerts = buddyData.pendingReplies?.filter((r) => r.type === 'alert') || [];
  const helperQuestions = buddyData.pendingReplies?.filter((r) => r.type !== 'alert') || buddyData.pendingReplies || [];

  // ── Full-screen overlays (not in shell) ──
  if (replyQuestion) {
    return (
      <ReplyComposer
        learnerName={learnerName}
        question={replyQuestion}
        onCancel={() => setReplyQuestion(null)}
        onSend={handleSendReply}
        onVoiceInput={() => {}}
        onAddPhoto={() => {}}
      />
    );
  }

  if (watchActive && role === 'helper') {
    return (
      <WatchView
        learnerName={learnerName}
        messages={watchMessages}
        isThinking={false}
        onStop={handleStopWatch}
        onNudge={handleNudge}
        onCall={handleHelperCall}
        onTakeOver={() => {}}
      />
    );
  }

  // ── Main app with shell ──
  return (
    <>
      <ShellLayout
        title={VIEW_TITLES[view] || 'PC Pal'}
        onBack={onBack}
        navigate={navigate}
        currentView={view}
      >
        {view === 'chat' && (
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative', height: '100%' }}>
            <ConversationSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              viewingConversationId={viewingConversationId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              isCollapsed={true}
              onToggleCollapse={() => {}}
            />
            {user && (
              <ChatScreen
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

        {view === 'history' && <HistoryPlaceholder />}
        {view === 'helper' && <HelperPlaceholder />}
        {(view === 'me' || view === 'me-sub') && (
          <MeScreen
            user={user}
            updateProfile={updateProfile}
            hasBuddy={buddyData.hasBuddy}
            helperName={activeLearner?.name || buddyData.buddyPair?.helper_name || 'your helper'}
            onLogout={logout}
          />
        )}

        {view === 'admin' && (
          <AdminFeedback onClose={() => navigate('/')} />
        )}

        {/* ── Helper Role Views ───────────────────────────────────── */}
        {view === 'helper-home' && (
          <HelperHome
            learner={{
              id: activeLearner?.id,
              name: learnerName,
              status: activeLearner?.status || 'offline',
              lastChatAgo: '8 min',
            }}
            alerts={helperAlerts.map((a) => ({
              id: a.id,
              title: a.title || 'Alert',
              preview: a.text || a.preview || '',
              severity: 'danger',
              timestamp: a.timestamp || a.created_at,
            }))}
            questions={helperQuestions.map((q) => ({
              id: q.id,
              text: q.text || q.message || 'Question',
              timestamp: q.timestamp || q.created_at,
            }))}
            progress={{
              completed: 3,
              total: 5,
              completions: [
                { name: 'Video calling', done: true },
                { name: 'Sending email', done: true },
                { name: 'Photo sharing', done: false },
              ],
            }}
            onCall={handleHelperCall}
            onWatch={handleHelperWatch}
            onAlertTap={() => navigate('/helper/sessions')}
            onQuestionTap={(qId) => handleReply(qId)}
            onSeeAll={() => navigate('/helper/sessions')}
            isLearnerInChat={!!activeConversationId}
          />
        )}

        {view === 'helper-sessions' && (
          <HelperSessions
            learnerName={learnerName}
            conversations={conversations.map((c) => ({
              id: c.id,
              title: c.title || c.topic || 'Chat session',
              preview: c.last_message || '',
              timestamp: c.updated_at || c.created_at,
              starred: false,
            }))}
            questions={helperQuestions.map((q) => ({
              id: q.id,
              text: q.text || q.message || 'Question',
              timestamp: q.timestamp || q.created_at,
              status: q.status || 'waiting',
            }))}
            alerts={helperAlerts.map((a) => ({
              id: a.id,
              title: a.title || 'Alert',
              preview: a.text || a.preview || '',
              timestamp: a.timestamp || a.created_at,
              resolved: a.resolved || false,
            }))}
            onConversationTap={() => {}}
            onQuestionTap={(qId) => handleReply(qId)}
            onAlertTap={() => {}}
            onReply={handleReply}
          />
        )}

        {view === 'helper-tools' && (
          <HelperTools
            learnerName={learnerName}
            hasActiveSession={buddySessionActive || watchActive}
            onCall={handleHelperCall}
            onWatch={handleHelperWatch}
            onRunCommand={handleRunCommand}
            history={toolsHistory}
          />
        )}

        {view === 'helper-me' && (
          <HelperMe
            helperName={user?.name || user?.display_name || 'Helper'}
            learners={activeLearner ? [{
              id: activeLearner.id,
              name: activeLearner.name,
              relation: '',
              since: '',
              status: activeLearner.status || 'offline',
            }] : []}
            onEditProfile={() => {}}
            onManageLearner={() => {}}
            onAddLearner={() => navigate('/pair')}
            onNavigateSetting={() => {}}
          />
        )}

        {view === 'pair' && (
          <PairingFlow
            learnerName={null}
            onConnect={handlePairConnect}
            onBack={back}
            onNoCode={() => {}}
            isLoading={buddyData.isLoading}
            error={buddyData.error}
          />
        )}
      </ShellLayout>

      {/* BuddyPanel overlay -- sits above the shell */}
      <BuddyPanel
        isOpen={buddyPanelOpen}
        onClose={() => setBuddyPanelOpen(false)}
        buddyData={buddyData}
        currentUserId={user?.id}
        onJoinSession={(targetId) => { setBuddySessionTarget(targetId); setBuddyPanelOpen(false); }}
        onLeaveSession={() => setBuddySessionTarget(null)}
        isInSession={buddySessionActive}
      />
    </>
  );
}

/* ── Root App: wraps everything in RoleProvider ──────────────── */

function App() {
  return (
    <RoleProvider>
      <ToastProvider>
        <AppContent />
        <ToastHost />
      </ToastProvider>
    </RoleProvider>
  );
}

export default App;
