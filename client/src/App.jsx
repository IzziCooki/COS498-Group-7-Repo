import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from './router';
import { RoleProvider, useRole } from './contexts/RoleContext';
import { useUser } from './hooks/useUser';
import { useAuth } from './hooks/useAuth';
import { useBuddy } from './hooks/useBuddy';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import ShellLayout from './components/ShellLayout/ShellLayout';
import AccessibilityBar from './components/Layout/AccessibilityBar';
import { useAccessibilityPrefs } from './hooks/useAccessibilityPrefs';
import { useSpeech } from './hooks/useSpeech';
import Onboarding from './components/Onboarding/Onboarding';
import AuthScreen from './components/Auth/AuthScreen';
import ChatScreen from './components/ChatScreen/ChatScreen';
import AdminFeedback from './components/Admin/AdminFeedback';
import { ToastProvider, useToast } from './hooks/useToast';
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

/* ── Sandbox tab ───────────────────────────────────────────────── */
import SandboxPanel from './components/Sandbox/SandboxPanel';

/* ── Placeholder components for views not yet built ────────────── */

function HistoryScreen({ conversations, onSelect, onNewChat, navigate, onCopyConversation, onRefresh }) {
  const formatDateTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 86400000) return `Today at ${time}`;
    if (diff < 172800000) return `Yesterday at ${time}`;
    if (diff < 604800000) return `${date.toLocaleDateString([], { weekday: 'long' })} at ${time}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`;
  };

  // Sort by most recent first
  const sorted = [...conversations].sort((a, b) => {
    const da = new Date(a.started_at || a.created_at || 0);
    const db = new Date(b.started_at || b.created_at || 0);
    return db - da;
  });

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--color-surface-2)' }}>
      <div style={{ padding: 'var(--space-4)' }}>
        <button
          type="button"
          className="pcp-btn pcp-btn--primary"
          style={{ width: '100%', marginBottom: 'var(--space-4)' }}
          onClick={() => { onNewChat(); navigate('/'); }}
        >
          + Start a new chat
        </button>
        {onRefresh && (
          <button
            type="button"
            className="pcp-btn pcp-btn--ghost"
            style={{ width: '100%' }}
            onClick={onRefresh}
          >
            Refresh
          </button>
        )}
      </div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-2)' }}>
          <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>No conversations yet</p>
          <p style={{ fontSize: 'var(--font-size-base)' }}>Start chatting and your history will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: '0 var(--space-4)' }}>
          {sorted.map((c) => (
            <div
              key={c.id}
              className="pcp-card pcp-card--interactive"
              style={{ textAlign: 'left', width: '100%' }}
            >
              <button
                type="button"
                style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}
                onClick={() => onSelect(c.id, c)}
              >
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-1)', marginBottom: 'var(--space-1)' }}>
                  {c.context_summary || c.preview || c.task_type || 'Chat session'}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-2)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatDateTime(c.started_at || c.created_at)}</span>
                  <span style={{ color: c.status === 'active' ? 'var(--color-success)' : 'var(--color-text-3)' }}>
                    {c.status === 'active' ? '\u25CF Active' : 'Ended'}
                  </span>
                </div>
              </button>
              <button
                type="button"
                className="pcp-btn pcp-btn--ghost"
                style={{
                  marginTop: 'var(--space-2)',
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--space-1) var(--space-2)',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onClick={(e) => { e.stopPropagation(); onCopyConversation(c.id); }}
                aria-label={`Copy conversation: ${c.context_summary || c.preview || 'Chat session'}`}
              >
                Copy conversation
              </button>
            </div>
          ))}
        </div>
      )}
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
  sandbox: 'Auto-Fix Sandbox',
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
  const a11y = useAccessibilityPrefs();
  const { user, isOnboarded, isLoading, createUser, completeOnboarding, updateProfile, applyUser } = useUser();
  const { logout } = useAuth({ onUserChanged: applyUser });
  const buddyData = useBuddy(user?.id);
  const { role, activeLearner, detectAndApplyRole } = useRole();
  const speech = useSpeech();
  // Chat hook lifted to App level so WebSocket stays alive across tab switches
  const chatData = useChat(user?.id, {
    onAssistantResponse: useCallback((text) => {
      if (a11y.prefs.readAloud && speech.synthSupported) {
        speech.speak(text);
      }
    }, [a11y.prefs.readAloud, speech]),
  });
  const { toast } = useToast() || {};

  // ── Copy conversation to clipboard ──
  const handleCopyConversation = useCallback(async (convId) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load messages');
      const messages = await res.json();
      const text = messages
        .map((m) => `${m.role === 'user' ? 'You' : 'PC Pal'}: ${m.body}`)
        .join('\n\n');
      await navigator.clipboard.writeText(text);
      toast?.({ kind: 'success', text: 'Conversation copied!' });
    } catch (err) {
      console.error('Copy failed:', err);
      toast?.({ kind: 'error', text: 'Could not copy conversation.' });
    }
  }, [toast]);

  const buddySessionTarget = null;
  const [buddySessionActive, setBuddySessionActive] = useState(false);
  const [viewingConversationId, setViewingConversationId] = useState(null);

  // ── Lifted artifact state (shared between ChatScreen + ArtifactPanel) ──
  const [activeArtifact, setActiveArtifact] = useState(null);
  const handleArtifactClose = useCallback(() => setActiveArtifact(null), []);

  // ── Helper-specific state ──
  const [replyQuestion, setReplyQuestion] = useState(null);
  const [watchActive, setWatchActive] = useState(false);
  const [watchMessages, setWatchMessages] = useState([]);
  const [toolsHistory, setToolsHistory] = useState([]);

  const { conversations, refresh: refreshConversations } = useConversations(user?.id);

  // Auto-refresh conversations when switching to history tab
  const prevViewRef = useRef(view);
  useEffect(() => {
    if (view === 'history' && prevViewRef.current !== 'history') {
      refreshConversations();
    }
    prevViewRef.current = view;
  }, [view, refreshConversations]);

  // Refresh when chat gets a new conversation ID
  useEffect(() => {
    if (chatData.conversationId) refreshConversations();
  }, [chatData.conversationId, refreshConversations]);

  // Refresh after each message exchange (user sends → AI responds)
  const prevMsgCount = useRef(0);
  useEffect(() => {
    const count = chatData.messages?.length || 0;
    if (count > prevMsgCount.current && count > 0) {
      // Debounce: only refresh if the count actually grew
      const timer = setTimeout(refreshConversations, 1000);
      prevMsgCount.current = count;
      return () => clearTimeout(timer);
    }
  }, [chatData.messages?.length, refreshConversations]);

  const chatWindowRef = useRef(null);

  // ── Role detection: run when buddy data or user changes ──
  useEffect(() => {
    if (user?.id && buddyData.buddyPair) {
      detectAndApplyRole(buddyData.buddyPair, user.id);
    }
  }, [user?.id, buddyData.buddyPair, detectAndApplyRole]);

  // ── Auto-redirect helper to helper-home when on learner routes ──
  useEffect(() => {
    if (role === 'helper' && (view === 'chat' || view === 'history' || view === 'helper' || view === 'sandbox')) {
      navigate('/helper/home', { replace: true });
    }
  }, [role, view, navigate]);

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
      <AccessibilityBar
        prefs={a11y.prefs}
        onCycleTextSize={a11y.cycleTextSize}
        onToggleHighContrast={a11y.toggleHighContrast}
        onToggleReadAloud={a11y.toggleReadAloud}
        speechSupported={typeof window !== 'undefined' && 'speechSynthesis' in window}
      />
      <ShellLayout
        title={VIEW_TITLES[view] || 'PC Pal'}
        onBack={onBack}
        navigate={navigate}
        currentView={view}
        artifact={activeArtifact}
        onArtifactClose={handleArtifactClose}
        onSendMessage={chatData.sendMessage}
        onMoveArtifactInline={handleArtifactClose}
      >
        {view === 'chat' && user && (
          <ChatScreen
            userId={user.id}
            hasBuddy={buddyData.hasBuddy}
            viewingConversationId={viewingConversationId}
            onConversationChange={handleConversationChange}
            startNewChatRef={chatWindowRef}
            buddySessionTarget={buddySessionTarget}
            onBuddySessionChange={setBuddySessionActive}
            navigate={navigate}
            onLogout={logout}
            chatData={chatData}
            onArtifactOpen={setActiveArtifact}
            onContinueConversation={(convId) => {
              // Reopen the conversation on the server and switch to live mode
              fetch(`/api/conversations/${convId}/reopen`, {
                method: 'POST',
                credentials: 'include',
              }).then(() => {
                setViewingConversationId(null);
                refreshConversations();
              }).catch(() => {
                // Even if reopen fails, let them type (server will create new session)
                setViewingConversationId(null);
              });
            }}
          />
        )}

        {view === 'sandbox' && (
          <SandboxPanel chatData={chatData} />
        )}

        {view === 'history' && (
          <HistoryScreen
            conversations={conversations}
            onSelect={(convId, conv) => {
              if (conv && conv.status === 'active') {
                // Active conversation — just switch to it
                setViewingConversationId(null);
              } else {
                // Past conversation — view it (read-only with option to continue)
                setViewingConversationId(convId);
              }
              navigate('/');
            }}
            onNewChat={() => {
              setViewingConversationId(null);
              if (chatData.startNewChat) chatData.startNewChat();
              refreshConversations();
            }}
            navigate={navigate}
            onCopyConversation={handleCopyConversation}
            onRefresh={refreshConversations}
          />
        )}
        {view === 'helper' && <HelperPlaceholder />}
        {(view === 'me' || view === 'me-sub') && (
          <MeScreen
            user={user}
            updateProfile={updateProfile}
            hasBuddy={buddyData.hasBuddy}
            helperName={activeLearner?.name || buddyData.buddyPair?.helper_name || 'your helper'}
            onLogout={logout}
            onSendMessage={chatData.sendMessage}
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
            conversations={sorted.map((c) => ({
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
