import React, { useState, useCallback } from 'react';
import FullScreenOverlay from '../Overlays/FullScreenOverlay';
import ConfirmDialog from '../Overlays/ConfirmDialog';
import SettingsRow from './SettingsRow';
import TextSizePicker from './TextSizePicker';
import ThemePicker from './ThemePicker';
import { useToast } from '../../hooks/useToast';
import './Settings.css';

/**
 * Settings — Full-screen settings list with categorized rows.
 * Wraps TextSizePicker, ThemePicker, and other controls.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   theme: string,
 *   onChangeTheme: (t: string) => void,
 *   textSize: string,
 *   onChangeTextSize: (s: string) => void,
 *   readAloud: boolean,
 *   onToggleReadAloud: (v: boolean) => void,
 *   onOpenMemories: () => void,
 *   onOpenEditProfile: () => void,
 *   onOpenHowToUse: () => void,
 *   onLogout?: () => void,
 * }} props
 */

const THEME_LABELS = { light: 'Light', dark: 'Dark', system: 'System' };
const SIZE_LABELS = { default: 'Default', larger: 'Larger', largest: 'Largest' };

function Settings({
  open,
  onClose,
  theme,
  onChangeTheme,
  textSize,
  onChangeTextSize,
  readAloud,
  onToggleReadAloud,
  onOpenMemories,
  onOpenEditProfile,
  onOpenHowToUse,
  onLogout,
}) {
  const [showTextSize, setShowTextSize] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { toast } = useToast() || {};

  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    onLogout?.();
    toast?.({ kind: 'info', text: 'Logged out.' });
  }, [onLogout, toast]);

  return (
    <>
      <FullScreenOverlay
        open={open}
        onClose={onClose}
        title="All settings"
        backLabel="Back"
        labelledBy="pcp-settings-title"
      >
        <div className="pcp-settings" role="region" aria-label="All settings">
          {/* ── Profile ── */}
          <section className="pcp-settings__section" aria-label="Profile">
            <h3 className="pcp-settings__section-title">Profile</h3>
            <div className="pcp-settings__section-rows">
              <SettingsRow
                icon={'\uD83D\uDC64'}
                label="Edit my details"
                onClick={onOpenEditProfile}
              />
            </div>
          </section>

          {/* ── Appearance ── */}
          <section className="pcp-settings__section" aria-label="Appearance">
            <h3 className="pcp-settings__section-title">Appearance</h3>
            <div className="pcp-settings__section-rows">
              <SettingsRow
                icon={'\uD83D\uDD24'}
                label="Text size"
                trailing={
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-3)' }}>
                    {SIZE_LABELS[textSize] || 'Default'}
                  </span>
                }
                onClick={() => setShowTextSize(true)}
              />
              <SettingsRow
                icon={'\uD83C\uDFA8'}
                label="Theme"
                trailing={
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-3)' }}>
                    {THEME_LABELS[theme] || 'System'}
                  </span>
                }
                onClick={() => setShowTheme(true)}
              />
            </div>
          </section>

          {/* ── Accessibility ── */}
          <section className="pcp-settings__section" aria-label="Accessibility">
            <h3 className="pcp-settings__section-title">Accessibility</h3>
            <div className="pcp-settings__section-rows">
              <SettingsRow
                icon={'\uD83D\uDD0A'}
                label="Read messages aloud"
                toggle={readAloud}
                onToggle={onToggleReadAloud}
              />
            </div>
          </section>

          {/* ── Data & Privacy ── */}
          <section className="pcp-settings__section" aria-label="Data and privacy">
            <h3 className="pcp-settings__section-title">Data &amp; Privacy</h3>
            <div className="pcp-settings__section-rows">
              <SettingsRow
                icon={'\uD83E\uDDE0'}
                label="What PC Pal remembers"
                onClick={onOpenMemories}
              />
            </div>
          </section>

          {/* ── Help ── */}
          <section className="pcp-settings__section" aria-label="Help">
            <h3 className="pcp-settings__section-title">Help</h3>
            <div className="pcp-settings__section-rows">
              <SettingsRow
                icon={'\u2753'}
                label="How to use PC Pal"
                onClick={onOpenHowToUse}
              />
            </div>
          </section>

          {/* ── Sign out ── */}
          {onLogout && (
            <div className="pcp-settings__danger-section">
              <button
                className="pcp-settings__danger-btn"
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                aria-label="Sign out"
              >
                Sign out
              </button>
            </div>
          )}

          {/* ── Version ── */}
          <div className="pcp-settings__footer">
            <p className="pcp-settings__version">PC Pal v1.0.0</p>
          </div>
        </div>
      </FullScreenOverlay>

      {/* Sub-pickers */}
      <TextSizePicker
        open={showTextSize}
        onClose={() => setShowTextSize(false)}
        textSize={textSize}
        onChangeSize={onChangeTextSize}
      />
      <ThemePicker
        open={showTheme}
        onClose={() => setShowTheme(false)}
        theme={theme}
        onChangeTheme={onChangeTheme}
      />

      {/* Logout confirmation */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign out?"
        body="You will need to sign in again to access your conversations."
        cancelLabel="Stay signed in"
        confirmLabel="Sign out"
        destructive
      />
    </>
  );
}

export default Settings;
