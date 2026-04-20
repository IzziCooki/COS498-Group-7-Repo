import React from 'react';
import './ConversationSidebar.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const oneDay = 86400000;

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 2 * oneDay) return 'Yesterday';
  if (diff < 7 * oneDay) {
    return d.toLocaleDateString([], { weekday: 'long' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function truncate(text, maxLen) {
  if (!text) return 'New conversation';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}

/**
 * ConversationSidebar — left panel listing past and active conversations.
 */
function ConversationSidebar({
  conversations,
  activeConversationId,
  viewingConversationId,
  onSelectConversation,
  onNewChat,
  isCollapsed,
  onToggleCollapse,
}) {
  const selected = viewingConversationId || activeConversationId;

  return (
    <aside className={`conv-sidebar ${isCollapsed ? 'conv-sidebar--collapsed' : ''}`}>
      <div className="conv-sidebar__header">
        {!isCollapsed && (
          <button
            className="conv-sidebar__new-btn btn-primary"
            onClick={onNewChat}
            aria-label="Start a new chat"
          >
            + New Chat
          </button>
        )}
        <button
          className="conv-sidebar__toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '\u25B6' : '\u25C0'}
        </button>
      </div>

      {!isCollapsed && (
        <nav className="conv-sidebar__list" aria-label="Conversation history">
          {conversations.length === 0 && (
            <p className="conv-sidebar__empty">No conversations yet.</p>
          )}
          {conversations.map((conv) => {
            const isActive = conv.status === 'active';
            const isSelected = conv.id === selected;
            return (
              <button
                key={conv.id}
                className={`conv-sidebar__item ${isSelected ? 'conv-sidebar__item--selected' : ''} ${isActive ? 'conv-sidebar__item--active' : ''}`}
                onClick={() => onSelectConversation(isActive ? null : conv.id)}
                aria-current={isSelected ? 'true' : undefined}
              >
                <span className="conv-sidebar__preview">
                  {isActive && <span className="conv-sidebar__live-dot" aria-label="Active" />}
                  {truncate(conv.preview || conv.context_summary, 50)}
                </span>
                <span className="conv-sidebar__date">{formatDate(conv.started_at)}</span>
              </button>
            );
          })}
        </nav>
      )}
    </aside>
  );
}

export default ConversationSidebar;
