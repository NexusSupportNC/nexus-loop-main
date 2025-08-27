import React, { useState, useEffect } from 'react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default", // default, danger, warning, success
  icon = null,
  loading = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsExiting(false);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getModalStyles = () => {
    const baseStyles = 'confirmation-modal';
    const typeStyles = {
      default: 'confirmation-modal-default',
      danger: 'confirmation-modal-danger',
      warning: 'confirmation-modal-warning',
      success: 'confirmation-modal-success'
    };

    const visibilityClass = isVisible && !isExiting ? 'confirmation-modal-visible' : '';
    const exitClass = isExiting ? 'confirmation-modal-exiting' : '';

    return `${baseStyles} ${typeStyles[type]} ${visibilityClass} ${exitClass}`;
  };

  const getDefaultIcon = () => {
    const icons = {
      default: '❓',
      danger: '⚠️',
      warning: '🔔',
      success: '✅'
    };
    return icons[type] || icons.default;
  };

  const getConfirmButtonClass = () => {
    const buttonClasses = {
      default: 'btn-primary',
      danger: 'btn-danger',
      warning: 'btn-warning',
      success: 'btn-success'
    };
    return `btn ${buttonClasses[type]} confirmation-confirm-btn`;
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div 
      className="confirmation-overlay"
      onClick={handleBackdropClick}
    >
      <div className={getModalStyles()}>
        <div className="confirmation-content">
          {/* Icon */}
          <div className="confirmation-icon">
            {icon || getDefaultIcon()}
          </div>

          {/* Title */}
          <div className="confirmation-title">
            {title}
          </div>

          {/* Message */}
          <div className="confirmation-message">
            {message}
          </div>

          {/* Buttons */}
          <div className="confirmation-buttons">
            <button
              onClick={handleClose}
              disabled={loading}
              className="btn btn-outline confirmation-cancel-btn"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={getConfirmButtonClass()}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
