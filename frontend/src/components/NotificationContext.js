import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      title: options.title,
      duration: options.duration !== undefined ? options.duration : 5000, // 5 seconds default
      ...options
    };

    setNotifications(prev => {
      const newNotifications = [...prev, notification];
      // Keep only the last 2 notifications
      return newNotifications.slice(-2);
    });

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification(message, 'success', options);
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification(message, 'error', { duration: 7000, ...options });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification(message, 'warning', options);
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification(message, 'info', options);
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
