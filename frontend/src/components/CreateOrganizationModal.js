import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CreateOrganizationModal = ({ isOpen, onClose, onSuccess, addNotification }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
      // Reset form when modal opens
      setFormData({ name: '', description: '' });
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/people', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAvailableUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification('Error fetching users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addNotification('Organization name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        userIds: selectedUsers
      };

      const response = await axios.post('/api/organizations', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        addNotification('Organization created successfully', 'success');
        onSuccess(response.data.organization);
        onClose();
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      const errorMessage = error.response?.data?.message || 'Error creating organization';
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Organization</h2>
          <button 
            className="modal-close-btn" 
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Organization Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter organization name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Enter organization description (optional)"
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Assign Users (Optional)
            </label>
            
            {loadingUsers ? (
              <div className="user-selection-loading">
                <div className="spinner"></div>
                <span>Loading users...</span>
              </div>
            ) : (
              <div className="user-selection">
                {availableUsers.length === 0 ? (
                  <p className="no-users-message">No users available</p>
                ) : (
                  <div className="user-list">
                    {availableUsers.map(user => (
                      <label key={user.id} className="user-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="user-checkbox"
                          disabled={loading}
                        />
                        <div className="user-info">
                          <div className="user-avatar-small">
                            <span className="avatar-icon">
                              {user.role === 'admin' ? '👑' : '👤'}
                            </span>
                          </div>
                          <div className="user-details">
                            <div className="user-name">{user.name}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                          <div className={`role-badge-small ${user.role}`}>
                            {user.role}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {selectedUsers.length > 0 && (
              <div className="selected-users-summary">
                <span className="summary-text">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganizationModal;
