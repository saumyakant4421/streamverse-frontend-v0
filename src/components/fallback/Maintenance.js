import React from 'react';
import '../../styles/homepage.scss';

const Maintenance = () => {
  const boxStyle = {
    maxWidth: '720px',
    width: '90%',
    padding: '2rem',
    background: 'rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#ffffff',
    textAlign: 'center',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
  };

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };

  return (
    <div className="homepage">
      <div style={overlayStyle}>
        <div style={boxStyle}>
          <h1 style={{ marginBottom: '0.5rem' }}>WEBSITE UNDER MAINTENANCE</h1>
          <p style={{ marginBottom: '1rem' }}>
            Check after some time or visit my other project —
            <a
              href="https://catalyst4change.live/"
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: '#9fc8ff', marginLeft: '0.35rem' }}
            >
              Catalyst
            </a>
          </p>
          <p style={{ fontSize: '0.9rem', opacity: 1 }}>
            We're making major updates. Thanks for your patience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
