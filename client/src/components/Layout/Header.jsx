import React from 'react';
import './Header.css';

/**
 * Header — app-level header bar.
 *
 * Shows the PC Pal title, user info, and buddy button.
 */
function Header({ user, onBuddyClick, buddyBadge }) {
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
          <div className="app-header__user">
            <span className="app-header__user-greeting">
              Hi, <strong>{user.name}</strong>!
            </span>
            {user.os_type && (
              <span className="app-header__user-os">{user.os_type}</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
