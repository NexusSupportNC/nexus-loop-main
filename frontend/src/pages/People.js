import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getRelativeTime, getActivityStatus } from '../utils/timeUtils';

const People = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('tiles'); // 'tiles' or 'list'

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

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
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'tiles' ? 'active' : ''}`}
              onClick={() => setViewMode('tiles')}
              title="Tiles view"
            >
              <span className="view-toggle-icon">⊞</span>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <span className="view-toggle-icon">☰</span>
            </button>
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

      {viewMode === 'tiles' ? (
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
                <div className="list-column activity-column">
                  {getRelativeTime(user.last_active)}
                </div>
                <div className="list-column joined-column">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="list-column status-column">
                  {user.suspended ? (
                    <div className="user-status suspended">
                      <span className="status-icon">⚠️</span>
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
    </div>
  );
};

export default People;
