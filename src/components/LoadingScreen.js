import React, { useEffect } from 'react';
import '../styles/loadingscreen.scss';

const LoadingScreen = () => {
  useEffect(() => {
    const letters = document.querySelectorAll('.letter');
    letters.forEach((letter, index) => {
      letter.style.animationDelay = `${index * 0.1}s`;
    });
  }, []);

  return (
    <div className="loading-screen">
      <div className="glassmorphic-container">
        <div className="loading-content">
          <div className="dynamic-text">
            <span className="letter">S</span>
            <span className="letter">t</span>
            <span className="letter">r</span>
            <span className="letter">e</span>
            <span className="letter">a</span>
            <span className="letter">m</span>
            <span className="letter">v</span>
            <span className="letter">e</span>
            <span className="letter">r</span>
            <span className="letter">s</span>
            <span className="letter">e</span>
          </div>
          <div className="loading-effect">
            <div className="loading-bar"></div>
          </div>
          <div className="loading-status">Loading experience...</div>
        </div>
      </div>
      <div className="particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;