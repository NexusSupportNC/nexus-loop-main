import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrganizationModal = ({ organization, user, isOpen, onClose, addNotification }) => {
  const [orgDetails, setOrgDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [removingUser, setRemovingUser] = useState(null);

  useEffect(() => {
    if (isOpen && organization) {
      fetchOrganizationDetails();
    }
  }, [isOpen, organization]);

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/organizations/${organization.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setOrgDetails(response.data.organization);
      }
    } catch (err) {
      console.error('Error fetching organization details:', err);
      addNotification('Error fetching organization details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/organizations/${organization.id}/available-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAvailableUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching available users:', err);
      addNotification('Error fetching available users', 'error');
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserId) {
      addNotification('Please select a user to add', 'error');
      return;
    }

    try {
      setAddingUser(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/organizations/${organization.id}/users`,
        { userId: selectedUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        addNotification('User added to organization successfully', 'success');
        setShowAddUserModal(false);
        setSelectedUserId('');
        fetchOrganizationDetails();
      }
    } catch (err) {
      console.error('Error adding user to organization:', err);
      addNotification('Error adding user to organization', 'error');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this organization?`)) {
      return;
    }

    try {
      setRemovingUser(userId);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `/api/organizations/${organization.id}/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        addNotification('User removed from organization successfully', 'success');
        fetchOrganizationDetails();
      }
    } catch (err) {
      console.error('Error removing user from organization:', err);
      addNotification('Error removing user from organization', 'error');
    } finally {
      setRemovingUser(null);
    }
  };

  const openAddUserModal = () => {
    fetchAvailableUsers();
    setShowAddUserModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="organization-modal">
      <div className="organization-modal-content">
        <div className="organization-modal-header">
          <div className="organization-modal-title">
            <span className="organization-modal-icon">🏢</span>
            <div className="organization-modal-text">
              <h2>{organization.name}</h2>
              <p>{organization.description || 'No description provided'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="organization-modal-close"
            title="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner"></div>
            <span className="ml-2">Loading organization details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Organization Info */}
            <div className="organization-info-section">
              <h3 className="organization-info-title">Organization Information</h3>
              <div className="organization-info-grid">
                <div className="organization-info-item">
                  <span className="organization-info-label">Name:</span>
                  <p className="organization-info-value">{orgDetails?.name}</p>
                </div>
                <div className="organization-info-item">
                  <span className="organization-info-label">Total Members:</span>
                  <p className="organization-info-value">{orgDetails?.users?.length || 0}</p>
                </div>
                <div className="organization-info-item">
                  <span className="organization-info-label">Created:</span>
                  <p className="organization-info-value">
                    {new Date(orgDetails?.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="organization-info-item">
                  <span className="organization-info-label">Created By:</span>
                  <p className="organization-info-value">{orgDetails?.creator_name || 'Unknown'}</p>
                </div>
                <div className="organization-info-item organization-info-full">
                  <span className="organization-info-label">Description:</span>
                  <p className="organization-info-value">
                    {orgDetails?.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Members Section */}
            <div className="organization-members-section">
              <div className="organization-members-header">
                <h3 className="organization-members-title">
                  Members ({orgDetails?.users?.length || 0})
                </h3>
                {user?.role === 'admin' && (
                  <button
                    onClick={openAddUserModal}
                    className="btn btn-primary btn-sm"
                  >
                    <span className="btn-icon">👤</span>
                    Add User
                  </button>
                )}
              </div>

              {orgDetails?.users && orgDetails.users.length > 0 ? (
                <div className="organization-member-list">
                  {orgDetails.users.map(member => (
                    <div key={member.id} className="organization-member-item">
                      <div className="organization-member-info">
                        <div className="organization-member-avatar">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="organization-member-details">
                          <div className="organization-member-name">{member.name}</div>
                          <div className="organization-member-email">{member.email}</div>
                        </div>
                        <div className="organization-member-role">
                          <span className={`status-badge ${member.role === 'admin' ? 'status-closing' : 'status-active'}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      <div className="organization-member-actions">
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleRemoveUser(member.id, member.name)}
                            disabled={removingUser === member.id}
                            className="btn btn-danger btn-sm"
                            title={`Remove ${member.name} from organization`}
                          >
                            {removingUser === member.id ? (
                              <>
                                <div className="spinner"></div>
                                Removing...
                              </>
                            ) : (
                              '🗑️ Remove'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="organization-empty-state">
                  <span className="organization-empty-icon">👥</span>
                  <p>No members in this organization yet</p>
                  {user?.role === 'admin' && (
                    <button
                      onClick={openAddUserModal}
                      className="btn btn-primary"
                    >
                      Add First Member
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="add-user-modal">
            <div className="add-user-modal-content">
              <div className="add-user-modal-header">
                <h3 className="add-user-modal-title">Add User to Organization</h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="add-user-modal-close"
                  title="Close"
                >
                  ×
                </button>
              </div>

              <div className="add-user-form">
                <div className="add-user-field">
                  <label className="add-user-label">
                    Select User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="add-user-select"
                  >
                    <option value="">Choose a user...</option>
                    {availableUsers.map(availableUser => (
                      <option key={availableUser.id} value={availableUser.id}>
                        {availableUser.name} ({availableUser.email})
                      </option>
                    ))}
                  </select>
                </div>

                {availableUsers.length === 0 && (
                  <div className="add-user-empty">
                    <p>No available users to add</p>
                    <p>All users are already members of this organization</p>
                  </div>
                )}
              </div>

              <div className="add-user-actions">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="btn btn-outline"
                  disabled={addingUser}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={addingUser || !selectedUserId}
                  className="btn btn-primary"
                >
                  {addingUser ? (
                    <>
                      <div className="spinner"></div>
                      Adding...
                    </>
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationModal;
