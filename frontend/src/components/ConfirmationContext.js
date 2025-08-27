import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationModal from './ConfirmationModal';

const ConfirmationContext = createContext();

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider = ({ children }) => {
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);

  const showConfirmation = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmation({
        ...options,
        onConfirm: async () => {
          setLoading(true);
          try {
            if (options.onConfirm) {
              await options.onConfirm();
            }
            resolve(true);
          } catch (error) {
            console.error('Confirmation action failed:', error);
            resolve(false);
          } finally {
            setLoading(false);
            setConfirmation(null);
          }
        },
        onClose: () => {
          setConfirmation(null);
          resolve(false);
        }
      });
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(null);
    setLoading(false);
  }, []);

  // Convenience methods for different confirmation types
  const confirmDelete = useCallback((options = {}) => {
    return showConfirmation({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: '🗑️',
      ...options
    });
  }, [showConfirmation]);

  const confirmAction = useCallback((options = {}) => {
    return showConfirmation({
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'default',
      ...options
    });
  }, [showConfirmation]);

  const confirmWarning = useCallback((options = {}) => {
    return showConfirmation({
      title: 'Warning',
      message: 'This action requires your attention. Do you want to continue?',
      confirmText: 'Continue',
      cancelText: 'Cancel',
      type: 'warning',
      ...options
    });
  }, [showConfirmation]);

  const value = {
    showConfirmation,
    hideConfirmation,
    confirmDelete,
    confirmAction,
    confirmWarning
  };

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      {confirmation && (
        <ConfirmationModal
          isOpen={Boolean(confirmation)}
          loading={loading}
          {...confirmation}
        />
      )}
    </ConfirmationContext.Provider>
  );
};
