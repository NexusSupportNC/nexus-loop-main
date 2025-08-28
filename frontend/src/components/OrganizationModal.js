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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🏢</span>
            <div>
              <h2 className="text-xl font-semibold">{organization.name}</h2>
              <p className="text-gray-600">{organization.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Organization Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <p className="font-medium">{orgDetails?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created:</span>
                  <p className="font-medium">
                    {new Date(orgDetails?.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-500">Description:</span>
                  <p className="font-medium">
                    {orgDetails?.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Members Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">
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
                <div className="space-y-3">
                  {orgDetails.users.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                        <div className="ml-3">
                          <span className={`status-badge ${member.role === 'admin' ? 'status-closing' : 'status-active'}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl block mb-2">👥</span>
                  <p>No members in this organization yet</p>
                  {user?.role === 'admin' && (
                    <button
                      onClick={openAddUserModal}
                      className="btn btn-primary mt-3"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add User to Organization</h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <div className="text-center py-4 text-gray-500">
                    <p>No available users to add</p>
                    <p className="text-sm">All users are already members of this organization</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
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
