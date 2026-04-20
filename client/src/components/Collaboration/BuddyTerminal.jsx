import React, { useState, useRef, useEffect } from 'react';
import './BuddyTerminal.css';

function shortenPath(p) {
  if (!p) return '';
  const home = p.match(/^(\/Users\/[^/]+|\/home\/[^/]+|C:\\Users\\[^\\]+)/);
  if (home) return '~' + p.slice(home[0].length);
  return p;
}

function BuddyTerminal({ terminalHistory, onRunCommand, learnerName, disabled, cwd }) {
  const [input, setInput] = useState('');
  const outputRef = useRef(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onRunCommand(input.trim());
    setInput('');
  };

  return (
    <div className="buddy-terminal">
      <div className="buddy-terminal__output" ref={outputRef}>
        {terminalHistory.length === 0 && (
          <div className="buddy-terminal__empty">
            Type a diagnostic command below to run it on {learnerName}'s computer.
            <br />
            Only safe, read-only commands are allowed.
          </div>
        )}
        {terminalHistory.map((entry) => (
          <div key={entry.requestId} className="buddy-terminal__entry">
            <div className="buddy-terminal__prompt">
              <span className="buddy-terminal__dollar">$</span>
              <span className="buddy-terminal__cmd">{entry.command}</span>
            </div>
            {entry.running ? (
              <div className="buddy-terminal__running">Running...</div>
            ) : (
              <pre className={`buddy-terminal__result ${entry.error ? 'buddy-terminal__result--err' : ''}`}>
                {entry.output || '(no output)'}
              </pre>
            )}
          </div>
        ))}
      </div>
      <form className="buddy-terminal__input-bar" onSubmit={handleSubmit}>
        {cwd && <span className="buddy-terminal__cwd">{shortenPath(cwd)}</span>}
        <span className="buddy-terminal__input-dollar">$</span>
        <input
          type="text"
          className="buddy-terminal__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. df -h"
          disabled={disabled}
          autoFocus
        />
        <button
          type="submit"
          className="buddy-terminal__run-btn"
          disabled={disabled || !input.trim()}
        >
          Run
        </button>
      </form>
    </div>
  );
}

export default BuddyTerminal;
