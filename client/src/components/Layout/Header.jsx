import React, { useState, useEffect } from 'react';
import './Header.css';

/**
 * Header — app-level header bar.
 *
 * Shows the PC Pal title, user info (clickable to edit), and buddy button.
 */
function Header({ user, onBuddyClick, buddyBadge, onUpdateProfile, onDashboardClick, showingDashboard, onSignOut, onAdminClick, showingAdmin }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editOs, setEditOs] = useState('');
  const [editComfort, setEditComfort] = useState(1);
  const [editModel, setEditModel] = useState('');
  const [editTrainingOptIn, setEditTrainingOptIn] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showMemories, setShowMemories] = useState(false);
  const [memories, setMemories] = useState([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Fetch available models when edit modal opens
  useEffect(() => {
    if (!editing) return;
    fetch('/api/models')
      .then(r => r.json())
      .then(data => setAvailableModels(data))
      .catch(() => setAvailableModels([]));
  }, [editing]);

  const openEdit = () => {
    if (!user) return;
    setEditName(user.name || '');
    setEditOs(user.os_type || 'Windows');
    setEditComfort(user.comfort_level || 1);
    setEditModel(user.model_preference || '');
    setEditTrainingOptIn(Boolean(user.training_opt_in));
    setSaveError('');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdateProfile) {
      setSaveError('Profile update is unavailable right now.');
      return;
    }
    if (!editName.trim()) {
      setSaveError('Please enter your name.');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      const result = await onUpdateProfile({
        name: editName.trim(),
        os_type: editOs,
        comfort_level: editComfort,
        model_preference: editModel || null,
        training_opt_in: editTrainingOptIn ? 1 : 0,
      });
      if (!result) {
        throw new Error('No profile was returned. Try reloading the page.');
      }
      setEditing(false);
    } catch (e) {
      console.error('Failed to update profile:', e);
      setSaveError(e?.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">PC</span>
        <div>
          <h1 className="app-header__title">PC Pal</h1>
          <p className="app-header__subtitle">Your Friendly Tech Helper</p>
        </div>
      </div>

      <div className="app-header__right">
        {onDashboardClick && (
          <button
            className={`app-header__dash-btn ${showingDashboard ? 'app-header__dash-btn--active' : ''}`}
            onClick={onDashboardClick}
          >
            Dashboard
          </button>
        )}
        {onAdminClick && user && user.is_admin ? (
          <button
            className={`app-header__dash-btn ${showingAdmin ? 'app-header__dash-btn--active' : ''}`}
            onClick={onAdminClick}
          >
            Admin
          </button>
        ) : null}
        {onBuddyClick && (
          <button
            className="app-header__buddy-btn"
            onClick={onBuddyClick}
            aria-label={buddyBadge > 0 ? `Buddy (${buddyBadge} updates)` : 'Buddy'}
          >
            Buddy
            {buddyBadge > 0 && (
              <span className="app-header__buddy-badge" aria-hidden="true">
                {buddyBadge}
              </span>
            )}
          </button>
        )}

        {user && (
          <button className="app-header__user" onClick={openEdit} title="Click to edit your profile">
            <span className="app-header__user-greeting">
              Hi, <strong>{user.name || (user.is_anonymous ? 'guest' : 'friend')}</strong>!
            </span>
            {user.os_type && (
              <span className="app-header__user-os">{user.os_type}</span>
            )}
          </button>
        )}
        {onSignOut && user && !user.is_anonymous && (
          <button
            type="button"
            className="app-header__signout"
            onClick={onSignOut}
            aria-label="Sign out"
          >
            Sign out
          </button>
        )}
      </div>

      {editing && (
        <div className="profile-edit-overlay" onClick={() => setEditing(false)}>
          <div className="profile-edit" onClick={e => e.stopPropagation()}>
            <h2 className="profile-edit__title">Edit Your Profile</h2>

            <label className="profile-edit__label">
              Your name
              <input
                type="text"
                className="profile-edit__input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                autoFocus
              />
            </label>

            <label className="profile-edit__label">
              Your device
              <select className="profile-edit__select" value={editOs} onChange={e => setEditOs(e.target.value)}>
                <option value="Windows">Windows PC</option>
                <option value="Mac">Mac</option>
                <option value="iPhone">iPhone</option>
                <option value="Android">Android</option>
              </select>
            </label>

            <label className="profile-edit__label">
              Comfort level
              <select className="profile-edit__select" value={editComfort} onChange={e => setEditComfort(Number(e.target.value))}>
                <option value={1}>1 — Brand new to computers</option>
                <option value={2}>2 — I know the basics</option>
                <option value={3}>3 — Getting comfortable</option>
                <option value={4}>4 — Fairly confident</option>
                <option value={5}>5 — Very comfortable</option>
              </select>
            </label>

            {availableModels.length > 0 && (
              <label className="profile-edit__label">
                AI Model
                <select className="profile-edit__select" value={editModel} onChange={e => setEditModel(e.target.value)}>
                  <option value="">Default (Claude Sonnet 4)</option>
                  {availableModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </label>
            )}

            {user && !user.is_anonymous && (
              <label className="profile-edit__checkbox">
                <input
                  type="checkbox"
                  checked={editTrainingOptIn}
                  onChange={e => setEditTrainingOptIn(e.target.checked)}
                />
                <span>
                  Share my conversations to help improve PC Pal.
                  <br />
                  <small>Your chats may be used as training examples. You can turn this off at any time.</small>
                </span>
              </label>
            )}

            {saveError && (
              <div className="profile-edit__error" role="alert">{saveError}</div>
            )}

            <div className="profile-edit__actions">
              <button
                type="button"
                className="profile-edit__save btn-primary"
                onClick={handleSave}
                disabled={saving || !editName.trim()}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="profile-edit__memories-btn" onClick={() => {
                setLoadingMemories(true);
                fetch(`/api/users/${user.id}/memories`)
                  .then(r => r.json())
                  .then(data => { setMemories(data); setShowMemories(true); })
                  .catch(() => setMemories([]))
                  .finally(() => setLoadingMemories(false));
              }} disabled={loadingMemories}>
                {loadingMemories ? 'Loading...' : 'View Memories'}
              </button>
              <button type="button" className="profile-edit__cancel" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMemories && (
        <div className="profile-edit-overlay" onClick={() => setShowMemories(false)}>
          <div className="memories-modal" onClick={e => e.stopPropagation()}>
            <div className="memories-modal__header">
              <h2 className="memories-modal__title">Agent Memories</h2>
              <button className="memories-modal__close" onClick={() => setShowMemories(false)}>Close</button>
            </div>
            <div className="memories-modal__body">
              {memories.length === 0 ? (
                <p className="memories-modal__empty">No memories saved yet. The agent will remember things about you as you chat!</p>
              ) : (
                memories.map((m) => (
                  <div key={m.id} className={`memories-modal__item memories-modal__item--${m.type}`}>
                    <div className="memories-modal__item-header">
                      <span className="memories-modal__type">{m.type}</span>
                      <span className="memories-modal__date">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="memories-modal__content">{m.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
