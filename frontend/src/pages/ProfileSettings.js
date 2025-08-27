import React from 'react';
import ProfileManagement from '../components/ProfileManagement';
import { apiUtils } from '../services/api';

const ProfileSettings = ({ user, addNotification, onUserUpdate }) => {
  const handleProfileUpdate = (updatedUser) => {
    // Update the global user state
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }

    // Also update the stored user data
    const token = localStorage.getItem('token');
    if (token) {
      apiUtils.setAuth(token, updatedUser);
    }

    addNotification('Profile updated successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">
          Manage your profile information.
        </p>
      </div>

      {/* Profile Management */}
      <ProfileManagement
        user={user}
        isAdmin={false}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default ProfileSettings;
