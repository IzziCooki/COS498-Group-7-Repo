import React, { useState } from 'react';
import './ConnectComputer.css';

/**
 * ConnectComputer — Button + modal for pairing with a relay agent.
 */
function ConnectComputer({ isConnected, onPair }) {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null); // null | 'pairing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [copyLabel, setCopyLabel] = useState('Copy');

  // The server URL — use current page origin for deployed version
  const serverWsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/agent-ws`;
  const connectCommand = `curl -sL ${window.location.origin}/api/connect-script | bash`;

  const handlePair = () => {
    if (!code.trim()) return;
    setStatus('pairing');
    onPair(code.trim(), (result) => {
      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          setShowModal(false);
          setStatus(null);
          setCode('');
        }, 2000);
      } else {
        setStatus('error');
        setErrorMsg(result.message || 'Could not connect. Try again.');
      }
    });
  };

  if (isConnected) {
    return (
      <span className="connect-badge connect-badge--connected" title="Your computer is connected">
        Connected
      </span>
    );
  }

  return (
    <>
      <button
        className="connect-btn"
        onClick={() => setShowModal(true)}
        title="Connect your computer for diagnostics"
      >
        Connect Computer
      </button>

      {showModal && (
        <div className="connect-modal-overlay" onClick={() => { setShowModal(false); setStatus(null); }}>
          <div className="connect-modal" onClick={e => e.stopPropagation()}>
            <h2 className="connect-modal__title">Connect Your Computer</h2>

            {status === 'success' ? (
              <div className="connect-modal__success">
                Connected! PC Pal can now help with your computer.
              </div>
            ) : (
              <>
                <div className="connect-modal__steps">
                  <div className="connect-modal__step">
                    <span className="connect-modal__step-num">1</span>
                    <div>
                      <span>Open <strong>Terminal</strong> on your computer:</span>
                      <button
                        className="connect-modal__open-terminal"
                        onClick={() => {
                          // Try to open Terminal on macOS
                          fetch('/api/open-terminal').catch(() => {});
                        }}
                      >
                        Open Terminal for me
                      </button>
                      <span className="connect-modal__download-hint">
                        Or find it in Applications &gt; Utilities &gt; Terminal
                      </span>
                    </div>
                  </div>
                  <div className="connect-modal__step">
                    <span className="connect-modal__step-num">2</span>
                    <div>
                      <span>Copy this command and paste it into Terminal:</span>
                      <div className="connect-modal__command-block">
                        <code className="connect-modal__command">{connectCommand}</code>
                        <button
                          className="connect-modal__copy-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(connectCommand);
                            setCopyLabel('Copied!');
                            setTimeout(() => setCopyLabel('Copy'), 2000);
                          }}
                        >
                          {copyLabel}
                        </button>
                      </div>
                      <span className="connect-modal__download-hint">
                        Press <strong>Enter</strong> after pasting
                      </span>
                    </div>
                  </div>
                  <div className="connect-modal__step">
                    <span className="connect-modal__step-num">3</span>
                    <span>A <strong>code</strong> will appear (like APPLE7) — type it below:</span>
                  </div>
                </div>

                <div className="connect-modal__input-row">
                  <input
                    type="text"
                    className="connect-modal__input"
                    placeholder="Type your code here"
                    value={code}
                    onChange={e => { setCode(e.target.value.toUpperCase()); setStatus(null); }}
                    onKeyDown={e => e.key === 'Enter' && handlePair()}
                    maxLength={10}
                    autoFocus
                  />
                  <button
                    className="connect-modal__pair-btn btn-primary"
                    onClick={handlePair}
                    disabled={!code.trim() || status === 'pairing'}
                  >
                    {status === 'pairing' ? 'Connecting...' : 'Connect'}
                  </button>
                </div>

                {status === 'error' && (
                  <p className="connect-modal__error">{errorMsg}</p>
                )}

                <button className="connect-modal__close" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ConnectComputer;
