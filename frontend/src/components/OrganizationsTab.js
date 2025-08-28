import React, { useState } from 'react';

const OrganizationsTab = ({ organizations, user, onOrganizationClick, onCreateOrganization, addNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="organizations-tab">
      {/* Header */}
      <div className="organizations-header">
        <div className="organizations-header-content">
          <div className="organizations-header-text">
            <h2 className="organizations-title">Organizations</h2>
            <p className="organizations-subtitle">Manage and view organizations</p>
          </div>
          <div className="organizations-header-actions">
            {user?.role === 'admin' && (
              <button
                onClick={onCreateOrganization}
                className="btn btn-primary"
                title="Create Organization"
              >
                <span className="btn-icon">🏢</span>
                Create Organization
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="organizations-search">
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="organizations-stats">
        <div className="stat-card">
          <span className="stat-number">{filteredOrganizations.length}</span>
          <span className="stat-label">
            {searchTerm ? 'Search Results' : 'Total Organizations'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {filteredOrganizations.reduce((total, org) => total + (org.userCount || 0), 0)}
          </span>
          <span className="stat-label">Total Members</span>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="organizations-grid">
        {filteredOrganizations.map(organization => (
          <div
            key={organization.id}
            className="organization-card"
            onClick={() => onOrganizationClick(organization)}
          >
            <div className="organization-card-header">
              <div className="organization-icon">
                <span className="org-emoji">🏢</span>
              </div>
              <div className="organization-info">
                <h3 className="organization-name">{organization.name}</h3>
                {organization.description && (
                  <p className="organization-description">{organization.description}</p>
                )}
              </div>
            </div>

            <div className="organization-card-body">
              <div className="organization-stats">
                <div className="org-stat">
                  <span className="org-stat-icon">👥</span>
                  <span className="org-stat-text">
                    {organization.userCount || 0} members
                  </span>
                </div>
                <div className="org-stat">
                  <span className="org-stat-icon">📅</span>
                  <span className="org-stat-text">
                    Created {new Date(organization.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="organization-card-footer">
              <span className="view-details-text">Click to view details</span>
              <span className="view-details-icon">→</span>
            </div>
          </div>
        ))}
      </div>

      {filteredOrganizations.length === 0 && (
        <div className="no-results">
          <span className="no-results-icon">🏢</span>
          <h3>No organizations found</h3>
          <p>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : user?.role === 'admin'
                ? 'Create your first organization to get started'
                : 'No organizations have been created yet'
            }
          </p>
          {!searchTerm && user?.role === 'admin' && (
            <button
              onClick={onCreateOrganization}
              className="btn btn-primary"
            >
              <span className="btn-icon">🏢</span>
              Create First Organization
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationsTab;
