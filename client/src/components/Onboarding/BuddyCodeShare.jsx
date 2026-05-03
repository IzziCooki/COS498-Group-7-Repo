import React from 'react';

/**
 * BuddyCodeShare — post-onboarding code display in the chat welcome banner.
 *
 * Shows the buddy invite code with a friendly message and optional "Show me how"
 * action button.
 */
function BuddyCodeShare({ code, userName }) {
  if (!code) return null;

  const displayName = userName || 'there';

  return (
    <div className="pcp-buddy-code" role="region" aria-label="Helper code">
      <p className="pcp-buddy-code__greeting">
        &#x1F44B; You&apos;re all set, {displayName}!
      </p>
      <div className="pcp-buddy-code__code" aria-label={`Your helper code is ${code.split('').join(' ')}`}>
        {code}
      </div>
      <p className="pcp-buddy-code__instruction">
        Share it with someone you trust.
      </p>
    </div>
  );
}

export default BuddyCodeShare;
