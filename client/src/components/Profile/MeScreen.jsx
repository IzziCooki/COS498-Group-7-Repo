import React, { useState, useMemo, useCallback } from 'react';
import SettingsRow from './SettingsRow';
import EditProfile from './EditProfile';
import MemoryViewer from './MemoryViewer';
import SkillProgress from './SkillProgress';
import AuditTimeline from './AuditTimeline';
import Settings from './Settings';
import TextSizePicker from './TextSizePicker';
import ThemePicker from './ThemePicker';
import HowToUseGuide from './HowToUseGuide';
import Architecture from './Architecture';
import FullScreenOverlay from '../Overlays/FullScreenOverlay';
import { useTheme } from '../../hooks/useTheme';
import { useTextSize } from '../../hooks/useTextSize';
import './MeScreen.css';

/**
 * MeScreen — Me tab landing page: profile card + settings rows.
 * Opens sub-screens as full-screen overlays or bottom sheets.
 *
 * @param {{
 *   user: object,
 *   updateProfile: (fields: object) => Promise<object>,
 *   hasBuddy?: boolean,
 *   helperName?: string,
 *   onLogout?: () => void,
 * }} props
 */

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const DEVICE_LABELS = {
  mac: 'Mac',
  windows: 'Windows',
};

const COMFORT_LABELS = {
  'just-learning': 'Just learning',
  'some-basics': 'Some basics',
  comfortable: 'Comfortable',
  confident: 'Confident',
};

function MeScreen({ user, updateProfile, hasBuddy, helperName, onLogout, onSendMessage }) {
  // Sub-screen visibility state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTextSize, setShowTextSize] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [readAloud, setReadAloud] = useState(() => {
    return localStorage.getItem('pcpal-read-aloud') === 'true';
  });

  const [theme, setTheme] = useTheme();
  const [textSize, setTextSize] = useTextSize();

  const initials = useMemo(() => getInitials(user?.name || user?.display_name), [user]);
  const displayName = user?.name || user?.display_name || 'User';
  const deviceLabel = DEVICE_LABELS[user?.device || user?.platform] || '';
  const comfortLabel = COMFORT_LABELS[user?.comfort_level || user?.comfort] || '';
  const detailParts = [deviceLabel, comfortLabel].filter(Boolean);

  const handleToggleReadAloud = useCallback((value) => {
    setReadAloud(value);
    localStorage.setItem('pcpal-read-aloud', String(value));
  }, []);

  return (
    <div className="pcp-me-screen" role="region" aria-label="Me tab">
      {/* ── Profile card ── */}
      <section className="pcp-me-screen__profile" aria-label="Your profile">
        <div className="pcp-me-screen__avatar" aria-hidden="true">
          {initials}
        </div>
        <h2 className="pcp-me-screen__name">{displayName}</h2>
        {detailParts.length > 0 && (
          <p className="pcp-me-screen__details">
            {detailParts.join(' \u00B7 ')}
          </p>
        )}
        <button
          className="pcp-me-screen__edit-btn"
          type="button"
          onClick={() => setShowEditProfile(true)}
          aria-label="Change my details"
        >
          Change my details
        </button>
      </section>

      {/* ── Settings rows ── */}
      <div className="pcp-me-screen__rows">
        <SettingsRow
          icon={'\uD83E\uDDE0'}
          label="What PC Pal remembers"
          onClick={() => setShowMemories(true)}
        />
        <SettingsRow
          icon={'\uD83D\uDCDA'}
          label="My learning progress"
          onClick={() => setShowSkills(true)}
        />
        <SettingsRow
          icon={'\uD83D\uDD24'}
          label="Make text bigger"
          onClick={() => setShowTextSize(true)}
        />
        <SettingsRow
          icon={'\uD83C\uDFA8'}
          label="Light or dark"
          onClick={() => setShowTheme(true)}
        />
        <SettingsRow
          icon={'\uD83D\uDD0A'}
          label="Read messages aloud"
          toggle={readAloud}
          onToggle={handleToggleReadAloud}
        />
        <SettingsRow
          icon={'\u2699\uFE0F'}
          label="All settings"
          onClick={() => setShowSettings(true)}
        />
        <SettingsRow
          icon={'\u2753'}
          label="How to use PC Pal"
          onClick={() => setShowHowToUse(true)}
        />
        <SettingsRow
          icon={'\uD83D\uDD27'}
          label="Architecture"
          onClick={() => setShowArchitecture(true)}
        />
        <SettingsRow
          icon={'\uD83D\uDCCB'}
          label="About PC Pal"
          onClick={() => setShowAbout(true)}
        />

        {/* Audit row: only if helper is paired */}
        {hasBuddy && (
          <SettingsRow
            icon={'\uD83D\uDC41\uFE0F'}
            label={`What ${helperName || 'your helper'} has done`}
            onClick={() => setShowAudit(true)}
          />
        )}
      </div>

      {/* Sign out button — always visible */}
      {onLogout && (
        <div className="pcp-me-screen__signout">
          <button
            type="button"
            className="pcp-me-screen__signout-btn"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      )}

      {/* ── Sub-screens (overlays) ── */}
      <EditProfile
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
        updateProfile={updateProfile}
      />

      <MemoryViewer
        open={showMemories}
        onClose={() => setShowMemories(false)}
        userId={user?.id}
      />

      <SkillProgress
        open={showSkills}
        onClose={() => setShowSkills(false)}
        userId={user?.id}
        onSendMessage={onSendMessage}
      />

      {hasBuddy && (
        <AuditTimeline
          open={showAudit}
          onClose={() => setShowAudit(false)}
          userId={user?.id}
          helperName={helperName || 'your helper'}
        />
      )}

      <Settings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        onChangeTheme={setTheme}
        textSize={textSize}
        onChangeTextSize={setTextSize}
        readAloud={readAloud}
        onToggleReadAloud={handleToggleReadAloud}
        onOpenMemories={() => { setShowSettings(false); setShowMemories(true); }}
        onOpenEditProfile={() => { setShowSettings(false); setShowEditProfile(true); }}
        onOpenHowToUse={() => { setShowSettings(false); setShowHowToUse(true); }}
        onLogout={onLogout}
      />

      <TextSizePicker
        open={showTextSize}
        onClose={() => setShowTextSize(false)}
        textSize={textSize}
        onChangeSize={setTextSize}
      />

      <ThemePicker
        open={showTheme}
        onClose={() => setShowTheme(false)}
        theme={theme}
        onChangeTheme={setTheme}
      />

      <HowToUseGuide
        open={showHowToUse}
        onClose={() => setShowHowToUse(false)}
      />

      <Architecture
        open={showArchitecture}
        onClose={() => setShowArchitecture(false)}
      />

      {/* About screen (simple full-screen overlay) */}
      <FullScreenOverlay
        open={showAbout}
        onClose={() => setShowAbout(false)}
        title="About PC Pal"
        backLabel="Back"
        labelledBy="pcp-about-title"
      >
        <div className="pcp-me-screen__about" role="article" aria-label="About PC Pal">
          <h3 className="pcp-me-screen__about-title">About PC Pal</h3>
          <p className="pcp-me-screen__about-text">
            PC Pal is your friendly AI computer helper. It is designed to help people
            who are learning to use computers feel confident and supported.
          </p>
          <p className="pcp-me-screen__about-text">
            PC Pal can answer your questions, create step-by-step guides, check your
            computer for problems, and connect you with a human helper when you need
            extra support.
          </p>
          <p className="pcp-me-screen__about-text">
            Your privacy matters. PC Pal only remembers what helps it assist you
            better, and you can ask it to forget anything at any time.
          </p>
          <p className="pcp-me-screen__about-version">
            Version 1.0.0
          </p>
        </div>
      </FullScreenOverlay>
    </div>
  );
}

export default MeScreen;
