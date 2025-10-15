import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUser, FaRobot, FaHome, FaFilm, FaTools, FaMoon, FaSun, FaBell } from "react-icons/fa";
import { MdSunny } from "react-icons/md";

import { useAuth } from "../context/AuthContext";
import "../styles/navbar.scss";
import NotificationPanel from "../components/NotificationPanel";

const Navbar = () => {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="logo">Streamverse</Link>

      {/* Hidden checkbox that controls the CSS-only mobile menu */}
      <input type="checkbox" id="nav-toggle" aria-hidden="true" />

      {/* Hamburger button wrapper (visible on small screens via CSS) */}
      <div className="nav-toggle-wrapper">
        <label className="nav-toggle" htmlFor="nav-toggle" aria-label="Toggle navigation">
          <span className="bar" />
        </label>
      </div>

      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <FaHome />
          <span>Home</span>
        </Link>
        <Link 
          to="/franchises" 
          className={`nav-link ${location.pathname === '/franchises' ? 'active' : ''}`}
        >
          <FaFilm />
          <span>Explore Franchises</span>
        </Link>
        <Link 
          to="/tools" 
          className={`nav-link ${location.pathname === '/tools' ? 'active' : ''}`}
        >
          <FaTools />
          <span>Tools</span>
        </Link>
        <Link 
          to="/recommendations" 
          className={`nav-link tool-button ${location.pathname === '/recommendations' ? 'active' : ''}`}
        >
          <FaRobot />
          <span>Movie AI</span>
        </Link>
      </div>

      {/* Mobile menu: duplicated links and a compact action area for small screens
          Visible when #nav-toggle is checked (pure CSS). */}
      <div className="mobile-menu" aria-hidden="true">
        <nav className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <FaHome />
            <span>Home</span>
          </Link>
          <Link to="/franchises" className={`nav-link ${location.pathname === '/franchises' ? 'active' : ''}`}>
            <FaFilm />
            <span>Explore Franchises</span>
          </Link>
          <Link to="/tools" className={`nav-link ${location.pathname === '/tools' ? 'active' : ''}`}>
            <FaTools />
            <span>Tools</span>
          </Link>
          <Link to="/recommendations" className={`nav-link tool-button ${location.pathname === '/recommendations' ? 'active' : ''}`}>
            <FaRobot />
            <span>Movie AI</span>
          </Link>
        </nav>
        <div className="mobile-actions" style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggleDarkMode} className="dark-mode-toggle" type="button" aria-hidden="true">
            {isDarkMode ? <MdSunny /> : <FaMoon />}
          </button>
          <button
            className="notification-bell"
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications((prev) => !prev)}
            style={{ marginRight: '8px' }}
          >
            <FaBell />
          </button>
          <Link to="/user" className="profile-icon" aria-hidden="true">
            {user && user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="profile-avatar" />
            ) : (
              <FaUser />
            )}
          </Link>
        </div>
      </div>
      <div className="nav-right">
        <button onClick={toggleDarkMode} className="dark-mode-toggle" type="button">
          {isDarkMode ? <MdSunny /> : <FaMoon />}
        </button>
        <button
          className="notification-bell"
          type="button"
          aria-label="Notifications"
          onClick={() => setShowNotifications((prev) => !prev)}
          style={{ marginRight: '8px' }}
        >
          <FaBell />
        </button>

        <Link to="/user" className="profile-icon">
          {user && user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="profile-avatar" />
          ) : (
            <FaUser />
          )}
        </Link>
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      </div>
    </nav>
  );
};

export default Navbar;