import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getRelativeTime, getActivityStatus } from '../utils/timeUtils';
import CreateOrganizationModal from '../components/CreateOrganizationModal';
import OrganizationsTab from '../components/OrganizationsTab';
import OrganizationModal from '../components/OrganizationModal';

const People = ({ user, addNotification }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usersViewMode, setUsersViewMode] = useState('tiles'); // 'tiles' or 'list' for users tab
  const [organizationsViewMode, setOrganizationsViewMode] = useState('tiles'); // 'tiles' or 'list' for organizations tab
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'organizations'
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [deletingOrganization, setDeletingOrganization] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  useEffect(() => {
    let filtered = users.filter(user =>
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === '' || user.role === roleFilter) &&
      (statusFilter === '' ||
        (statusFilter === 'active' && !user.suspended) ||
        (statusFilter === 'suspended' && user.suspended)) &&
      (organizationFilter === '' ||
        (user.organizationList && user.organizationList.some(org => org.id.toString() === organizationFilter)))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, statusFilter, organizationFilter, users]);

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/organizations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrganizations(response.data.organizations);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/people', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    return role === 'admin' ? '👑' : '👤';
  };

  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'role-badge admin' : 'role-badge agent';
  };

  const handleCreateOrganization = () => {
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
  };

  const handleOrganizationCreated = (organization) => {
    addNotification(`Organization "${organization.name}" created successfully!`, 'success');
    // Refresh the users list to show updated organization info
    fetchUsers();
    fetchOrganizations();
  };

  const handleOrganizationClick = (organization) => {
    setSelectedOrganization(organization);
    setShowOrganizationModal(true);
  };

  const handleOrganizationModalClose = () => {
    setShowOrganizationModal(false);
    setSelectedOrganization(null);
    fetchUsers();
    fetchOrganizations();
  };

  const handleDeleteOrganization = async (organization) => {
    if (!window.confirm(`Are you sure you want to delete "${organization.name}"? This will remove all user assignments and cannot be undone.`)) {
      return;
    }

    try {
      setDeletingOrganization(organization.id);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/organizations/${organization.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        addNotification(`Organization "${organization.name}" deleted successfully`, 'success');
        fetchOrganizations();
        fetchUsers();
      }
    } catch (err) {
      console.error('Error deleting organization:', err);
      addNotification('Error deleting organization', 'error');
    } finally {
      setDeletingOrganization(null);
    }
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="people-container">
      <div className="people-header">
        <div className="people-header-content">
          <div className="people-header-text">
            <h1 className="people-title">People</h1>
            <p className="people-subtitle">View and search registered users</p>
          </div>
          <div className="people-header-actions">
            {user?.role === 'admin' && (
              <button
                onClick={handleCreateOrganization}
                className="btn btn-primary create-org-btn"
                title="Create Organization"
              >
                <span className="btn-icon">🏢</span>
                Create Organization
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="people-search">
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="people-filters">
        <div className="filter-group">
          <label className="filter-label">Filter by Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Filter by Organization:</label>
          <select
            value={organizationFilter}
            onChange={(e) => setOrganizationFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Organizations</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id.toString()}>{org.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-summary">
          <span className="filter-result-count">
            {filteredUsers.length} of {users.length} users
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="people-tabs">
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="tab-icon">👥</span>
            Users
            <span className="tab-count">({filteredUsers.length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            <span className="tab-icon">🏢</span>
            Organizations
            <span className="tab-count">({organizations.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
      <>
      <div className="users-view-controls">
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${usersViewMode === 'tiles' ? 'active' : ''}`}
            onClick={() => setUsersViewMode('tiles')}
            title="Tiles view"
          >
            <span className="view-toggle-icon">⊞</span>
          </button>
          <button
            className={`view-toggle-btn ${usersViewMode === 'list' ? 'active' : ''}`}
            onClick={() => setUsersViewMode('list')}
            title="List view"
          >
            <span className="view-toggle-icon">☰</span>
          </button>
        </div>
      </div>

      <div className="people-stats">
        <div className="stat-card">
          <span className="stat-number">{filteredUsers.length}</span>
          <span className="stat-label">
            {searchTerm ? 'Search Results' : 'Total Users'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {filteredUsers.filter(user => user.role === 'admin').length}
          </span>
          <span className="stat-label">Admins</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {filteredUsers.filter(user => user.role === 'agent').length}
          </span>
          <span className="stat-label">Agents</span>
        </div>
      </div>

      {usersViewMode === 'tiles' ? (
        <div className="people-grid">
          {filteredUsers.map(user => {
            const activityStatus = getActivityStatus(user.last_active);
            return (
              <div key={user.id} className="people-card">
                <div className="people-card-header">
                  <div className="user-avatar">
                    <span className="avatar-icon">{getRoleIcon(user.role)}</span>
                    <div
                      className="activity-indicator"
                      style={{ backgroundColor: activityStatus.color }}
                      title={getRelativeTime(user.last_active)}
                    ></div>
                  </div>
                  <div className="user-info">
                    <h3 className="user-name">{user.name}</h3>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <div className={getRoleBadgeClass(user.role)}>
                    {user.role}
                  </div>
                </div>

                <div className="people-card-body">
                  <div className="activity-info">
                    <span className="activity-label">Last Activity:</span>
                    <span className="activity-time">{getRelativeTime(user.last_active)}</span>
                  </div>

                  <div className="user-details">
                    <div className="user-detail">
                      <span className="detail-label">Joined:</span>
                      <span className="detail-value">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="user-detail">
                      <span className="detail-label">Organizations:</span>
                      <div className="organization-list">
                        {user.organizationList && user.organizationList.length > 0 ? (
                          user.organizationList.map((org, index) => (
                            <span key={org.id} className="organization-tag">
                              {org.name}
                            </span>
                          ))
                        ) : (
                          <span className="no-organizations">No organizations</span>
                        )}
                      </div>
                    </div>
                    {user.suspended && (
                      <div className="user-status suspended">
                        <span className="status-icon">⚠️</span>
                        <span>Suspended</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="people-list">
          <div className="people-list-header">
            <div className="list-column">User</div>
            <div className="list-column">Role</div>
            <div className="list-column">Organizations</div>
            <div className="list-column">Last Activity</div>
            <div className="list-column">Joined</div>
            <div className="list-column">Status</div>
          </div>
          {filteredUsers.map(user => {
            const activityStatus = getActivityStatus(user.last_active);
            return (
              <div key={user.id} className="people-list-item">
                <div className="list-column user-column">
                  <div className="list-user-avatar">
                    <span className="avatar-icon">{getRoleIcon(user.role)}</span>
                    <div
                      className="activity-indicator"
                      style={{ backgroundColor: activityStatus.color }}
                      title={getRelativeTime(user.last_active)}
                    ></div>
                  </div>
                  <div className="list-user-info">
                    <div className="list-user-name">{user.name}</div>
                    <div className="list-user-email">{user.email}</div>
                  </div>
                </div>
                <div className="list-column role-column">
                  <div className={getRoleBadgeClass(user.role)}>
                    {user.role}
                  </div>
                </div>
                <div className="list-column organizations-column">
                  <div className="organization-list-inline">
                    {user.organizationList && user.organizationList.length > 0 ? (
                      user.organizationList.map((org, index) => (
                        <span key={org.id} className="organization-tag-small">
                          {org.name}
                        </span>
                      ))
                    ) : (
                      <span className="no-organizations-small">None</span>
                    )}
                  </div>
                </div>
                <div className="list-column activity-column">
                  {getRelativeTime(user.last_active)}
                </div>
                <div className="list-column joined-column">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="list-column status-column">
                  {user.suspended ? (
                    <div className="user-status suspended">
                      <span className="status-icon">⚠���</span>
                      <span>Suspended</span>
                    </div>
                  ) : (
                    <span className="status-active">Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredUsers.length === 0 && searchTerm && (
        <div className="no-results">
          <span className="no-results-icon">🔍</span>
          <h3>No users found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      )}

      </>
      )}

      {activeTab === 'organizations' && (
        <OrganizationsTab
          organizations={organizations}
          user={user}
          onOrganizationClick={handleOrganizationClick}
          onCreateOrganization={handleCreateOrganization}
          addNotification={addNotification}
        />
      )}

      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleOrganizationCreated}
        addNotification={addNotification}
      />

      {showOrganizationModal && selectedOrganization && (
        <OrganizationModal
          organization={selectedOrganization}
          user={user}
          isOpen={showOrganizationModal}
          onClose={handleOrganizationModalClose}
          addNotification={addNotification}
        />
      )}
    </div>
  );
};

export default People;
