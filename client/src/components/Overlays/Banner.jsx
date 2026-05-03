import React from 'react';
import './Banner.css';

/**
 * Banner — Polymorphic inline banner for safety, welcome, watch, and info.
 *
 * @param {{
 *   variant: 'safety' | 'welcome' | 'watch' | 'info',
 *   title?: string,
 *   body?: string,
 *   action?: { label: string, onClick: () => void },
 *   dismissible?: boolean,
 *   onDismiss?: () => void,
 *   children?: React.ReactNode,   // alternative to body text
 *   className?: string,
 * }} props
 */
function Banner({
  variant = 'info',
  title,
  body,
  action,
  dismissible = false,
  onDismiss,
  children,
  className = '',
}) {
  // Safety banners are assertive alerts; others are status regions
  const isSafety = variant === 'safety';
  const role = isSafety ? 'alert' : 'status';
  const ariaLive = isSafety ? 'assertive' : 'polite';

  const bannerClass = [
    'pcp-banner',
    `pcp-banner--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={bannerClass} role={role} aria-live={ariaLive}>
      <div className="pcp-banner__content">
        {title && <h3 className="pcp-banner__title">{title}</h3>}
        {body && <p className="pcp-banner__body">{body}</p>}
        {children}
      </div>

      {action && (
        <button
          className="pcp-banner__action"
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      )}

      {dismissible && onDismiss && (
        <button
          className="pcp-banner__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss banner"
          type="button"
        >
          &#x2715;
        </button>
      )}
    </div>
  );
}

export default Banner;
