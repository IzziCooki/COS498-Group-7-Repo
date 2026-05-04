import React from 'react';

/**
 * ChatTopBar -- Contextual top bar override for the chat screen (D2 S2).
 * Renders inside the ShellLayout's TopBar area via composition.
 *
 * Title: "Chat with PC" (20px medium), right-side ⋯ button (48x48).
 * The shell TopBar already renders; this component is currently a stub
 * that provides the ⋯ button and buddy-observing indicator.
 * In Phase 3 we wire the ⋯ button to ChatOptionsSheet.
 *
 * @param {{ onOpenOptions: () => void, buddyObserving: object|null }} props
 */
function ChatTopBar({ onOpenOptions, buddyObserving, onEndChatAndRate, hasMessages }) {
  return (
    <div className="pcp-chat-topbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 'var(--space-3)',
      padding: '0 var(--space-2)',
      height: '100%',
    }}>
      {buddyObserving && (
        <div style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-primary)',
          marginRight: 'auto',
          paddingLeft: 'var(--space-2)',
        }}>
          {buddyObserving.buddyName} is helping you
        </div>
      )}
      {hasMessages && onEndChatAndRate && (
        <button
          type="button"
          onClick={onEndChatAndRate}
          aria-label="End chat and leave feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '0 var(--space-3)',
            minHeight: 'var(--tap-comfort)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
          }}
        >
          End &amp; Rate
        </button>
      )}
      <button
        type="button"
        onClick={onOpenOptions}
        aria-label="More options"
        aria-haspopup="menu"
        style={{
          width: 'var(--tap-comfort)',
          height: 'var(--tap-comfort)',
          minHeight: 'var(--tap-comfort)',
          minWidth: 'var(--tap-comfort)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-1)',
          cursor: 'pointer',
        }}
      >
        &#x22EF;
      </button>
    </div>
  );
}

export default ChatTopBar;
