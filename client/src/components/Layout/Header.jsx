import React from 'react';
import './Header.css';

/**
 * Header — app-level header bar.
 *
 * Shows the PC Pal title and, when available, the logged-in user's name.
 */
function Header({ user }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">PC</span>
        <div>
          <h1 className="app-header__title">PC Pal</h1>
          <p className="app-header__subtitle">Your Friendly Tech Helper</p>
        </div>
      </div>

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
    </header>
  );
}

export default Header;
