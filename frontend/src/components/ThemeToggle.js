import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className={`theme-toggle-container ${className}`}>
      <div className="theme-toggle-wrapper">
        <div className="theme-toggle-label">
          <span className="theme-toggle-icon">🌙</span>
          <span className="theme-toggle-text">Dark Mode</span>
        </div>
        <button
          onClick={toggleTheme}
          className={`theme-toggle-switch ${isDarkMode ? 'active' : ''}`}
          aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        >
          <div className="theme-toggle-slider">
            <div className="theme-toggle-icon-inner">
              {isDarkMode ? '🌙' : '☀️'}
            </div>
          </div>
        </button>
      </div>
      <p className="theme-toggle-description">
        Switch between light and dark themes. Your preference will be saved automatically.
      </p>
    </div>
  );
};

export default ThemeToggle;
