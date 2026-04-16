import React, { useState } from 'react';
import './Header.css';

/**
 * Header — app-level header bar.
 *
 * Shows the PC Pal title, user info (clickable to edit), and buddy button.
 */
function Header({ user, onBuddyClick, buddyBadge, onUpdateProfile }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editOs, setEditOs] = useState('');
  const [editComfort, setEditComfort] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const openEdit = () => {
    if (!user) return;
    setEditName(user.name || '');
    setEditOs(user.os_type || 'Windows');
    setEditComfort(user.comfort_level || 1);
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
              Hi, <strong>{user.name}</strong>!
            </span>
            {user.os_type && (
              <span className="app-header__user-os">{user.os_type}</span>
            )}
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
              <button type="button" className="profile-edit__cancel" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
