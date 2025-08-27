import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import CreateLoop from './pages/CreateLoop';
import EditLoop from './pages/EditLoop';
import AdminSettings from './pages/AdminSettingsNew';
import Archive from './pages/Archive';
import ProfileSettings from './pages/ProfileSettings';
import People from './pages/People';
import ScrollToTop from './components/ScrollToTop';
import NotificationToast from './components/NotificationToast';
import { NotificationProvider, useNotifications } from './components/NotificationContext';
import { ConfirmationProvider } from './components/ConfirmationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { apiUtils } from './services/api';

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { notifications, removeNotification, addNotification } = useNotifications();

  useEffect(() => {
    // Check authentication status on app load
    const checkAuth = () => {
      const isAuth = apiUtils.isAuthenticated();
      const currentUser = apiUtils.getCurrentUser();

      setIsAuthenticated(isAuth);
      setUser(currentUser);
      setLoading(false);
    };

    // Check screen size and set mobile state
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkAuth();
    checkScreenSize();

    // Listen for window resize
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogin = (token, userData) => {
    apiUtils.setAuth(token, userData);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    apiUtils.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }



  if (!isAuthenticated) {
    return (
      <>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route
                path="/login"
                element={
                  <Login
                    onLogin={handleLogin}
                    addNotification={addNotification}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
        <NotificationToast
          notifications={notifications}
          removeNotification={removeNotification}
        />
        <ScrollToTop />
      </>
    );
  }

  return (
    <>
      <Router>
        <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
          <Sidebar
            user={user}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            isMobile={isMobile}
            onNavigate={closeSidebarOnMobile}
          />

          <div className="content">
            {/* Mobile overlay */}
            {isMobile && !sidebarCollapsed && (
              <div
                className="sidebar-overlay"
                onClick={() => setSidebarCollapsed(true)}
                style={{zIndex: 1000}}
              />
            )}


            <Routes>
              <Route
                path="/"
                element={
                  <Navigate
                    to={user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent'}
                    replace
                  />
                }
              />

              <Route
                path="/dashboard/admin"
                element={
                  user?.role === 'admin' ? (
                    <AdminDashboard
                      user={user}
                      addNotification={addNotification}
                    />
                  ) : (
                    <Navigate to="/dashboard/agent" replace />
                  )
                }
              />

              <Route
                path="/dashboard/agent"
                element={
                  <AgentDashboard
                    user={user}
                    addNotification={addNotification}
                  />
                }
              />

              <Route
                path="/loops/new"
                element={
                  <CreateLoop
                    user={user}
                    addNotification={addNotification}
                  />
                }
              />

              <Route
                path="/loops/edit/:id"
                element={
                  <EditLoop
                    user={user}
                    addNotification={addNotification}
                  />
                }
              />

              <Route
                path="/profile"
                element={
                  <ProfileSettings
                    user={user}
                    addNotification={addNotification}
                    onUserUpdate={handleUserUpdate}
                  />
                }
              />

              <Route
                path="/people"
                element={
                  <People
                    user={user}
                    addNotification={addNotification}
                  />
                }
              />

              <Route
                path="/archive"
                element={
                  user?.role === 'admin' ? (
                    <Archive
                      user={user}
                      addNotification={addNotification}
                    />
                  ) : (
                    <Navigate to="/dashboard/agent" replace />
                  )
                }
              />

              <Route
                path="/settings"
                element={
                  user?.role === 'admin' ? (
                    <AdminSettings
                      user={user}
                      addNotification={addNotification}
                    />
                  ) : (
                    <Navigate to="/dashboard/agent" replace />
                  )
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Footer with Privacy Policy */}
            <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400 mb-2">
                © 2025 Nexus Realty NC. All rights reserved.
              </p>
              <p className="text-xs text-gray-400">
                <a
                  href="https://www.nexusrealtync.com/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline transition-colors duration-200"
                >
                  Privacy Policy
                </a>
              </p>
            </footer>
          </div>
        </div>
      </Router>
      <NotificationToast
        notifications={notifications}
        removeNotification={removeNotification}
      />
      <ScrollToTop />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ConfirmationProvider>
          <AppContent />
        </ConfirmationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
