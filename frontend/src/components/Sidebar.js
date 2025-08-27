import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const ProfileImage = ({ user, size = 'w-10 h-10' }) => {
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    // Load profile image from localStorage
    const storedProfile = localStorage.getItem('current_user_profile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setProfileImage(profile.profileImage);
    } else if (user?.profileImage) {
      setProfileImage(user.profileImage);
    }
  }, [user]);

  const getInitials = () => {
    const name = user?.name || 'User';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getSizeClasses = () => {
    // Convert size to specific pixel values for better control
    if (size.includes('w-10')) return 'w-10 h-10';
    if (size.includes('w-8')) return 'w-8 h-8';
    if (size.includes('w-12')) return 'w-12 h-12';
    return size;
  };

  const getTextSize = () => {
    if (size.includes('w-8')) return 'text-xs';
    if (size.includes('w-10')) return 'text-sm';
    return 'text-base';
  };

  if (profileImage) {
    return (
      <div className={`${getSizeClasses()} rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0`}>
        <img
          src={profileImage}
          alt="Profile"
          className="w-full h-full object-cover"
          style={{ borderRadius: '50%' }}
        />
      </div>
    );
  }

  return (
    <div className={`${getSizeClasses()} bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold ${getTextSize()} shadow-md border-2 border-white flex-shrink-0`}>
      {getInitials()}
    </div>
  );
};

const Sidebar = ({ user, onLogout, collapsed, onToggle, isMobile, onNavigate }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      path: user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent',
      icon: '📊'
    },
    {
      name: 'Create Loop',
      path: '/loops/new',
      icon: '➕'
    },
    // People section for both Agents and Admins
    {
      name: 'People',
      path: '/people',
      icon: '👥'
    },
    // Admin-only archive
    ...(user?.role === 'admin' ? [{
      name: 'Archive',
      path: '/archive',
      icon: '📦'
    }] : []),
    // Profile for all users
    {
      name: 'Profile',
      path: '/profile',
      icon: '👤'
    },
    // Admin-only settings
    ...(user?.role === 'admin' ? [{
      name: 'Settings',
      path: '/settings',
      icon: '⚙️'
    }] : [])
  ];

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="mobile-sidebar-toggle"
          onClick={onToggle}
          title="Toggle menu"
          aria-label="Toggle navigation menu"
        >
          <span className="toggle-icon">☰</span>
        </button>
      )}

      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        {/* Enhanced Desktop toggle button */}
        {!isMobile && (
          <button
            className="sidebar-toggle-btn-attached"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="toggle-button-inner">
              <span className="toggle-arrow">
                ☰
              </span>
            </div>
          </button>
        )}
      {/* Logo/Brand */}
      <div className="border-b border-gray-200 relative">
        <div className="text-center">
          <h1 className={`text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent sidebar-brand-title ${collapsed && !isMobile ? 'hidden' : ''}`} style={{paddingRight: '1px', marginRight: '-2px'}}>
            NexusRealtyNC
          </h1>
          {collapsed && !isMobile && (
            <div className="text-xl font-bold text-blue-600">NR</div>
          )}
          <p className={`text-xs text-gray-600 font-medium ${collapsed && !isMobile ? 'hidden' : ''}`} style={{marginTop: '4px'}}>
            Loop Manager
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-gray-200">
        <div className={`flex items-center ${collapsed && !isMobile ? 'justify-center' : 'space-x-3'} p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200`}>
          {(!collapsed || isMobile) && (
            <div className="user-info flex-1">
              <p className="text-xs font-bold text-gray-900" style={{marginLeft: '10px'}}>{user?.name}</p>
              <p className="text-xs text-gray-600 capitalize font-medium" style={{marginLeft: '10px'}}>{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tiles */}
      <nav className="flex-shrink-0">
        <div className={`grid gap-2 p-3 ${collapsed && !isMobile ? 'grid-cols-1' : 'grid-cols-1'}`}>
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`nav-tile group ${isActive(item.path) ? 'active' : ''}`}
              title={collapsed && !isMobile ? item.name : ''}
            >
              <div className="nav-tile-content">
                <div className="nav-tile-icon">
                  <span>{item.icon}</span>
                </div>
                {(!collapsed || isMobile) && (
                  <div className="nav-tile-text">
                    <span className="nav-tile-title">{item.name}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </nav>



      {/* Logout */}
      <div className="logout-section border-t border-gray-200 mt-auto" style={{padding: '20px 20px 84px 20px'}}>
        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          className="action-tile action-tile-danger group w-full"
          title={collapsed && !isMobile ? 'Sign Out' : ''}
          style={{padding: '12px'}}
        >
          <div className="action-tile-content">
            <div className="action-tile-icon" style={{width: '32px', height: '32px', fontSize: '16px'}}>
              <span>🚪</span>
            </div>
            {(!collapsed || isMobile) && (
              <div className="action-tile-text">
                <span className="action-tile-title" style={{fontSize: '13px'}}>Sign Out</span>
                <span className="action-tile-subtitle" style={{fontSize: '11px'}}>End session</span>
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
