import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import '../styles/floating-ai-button.scss';

const FloatingAiButton = () => {
  const location = useLocation();

  // Only show on homepage
  if (location.pathname !== '/') return null;

  return (
    <Link to="/recommendations" className="floating-ai-button" aria-label="Open recommendations">
      <img src="../../src/assets/icons/icons8-ai-48.png" alt="AI" />
    </Link>
  );
};

export default FloatingAiButton;
