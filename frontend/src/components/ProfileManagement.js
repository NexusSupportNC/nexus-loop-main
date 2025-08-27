import React, { useState, useEffect } from 'react';
import { useNotifications } from './NotificationContext';

const ProfileManagement = ({ user, onProfileUpdate, isAdmin = false, targetUser = null }) => {
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    bio: ''
  });
  const { addNotification } = useNotifications();

  const currentUser = targetUser || user;

  // Load profile data on mount and when user changes
  useEffect(() => {
    const loadProfileData = () => {
      // First try to load from localStorage
      const storageKey = targetUser ? `user_${targetUser.id}_profile` : 'current_user_profile';
      const storedProfile = localStorage.getItem(storageKey);

      let userData;
      if (storedProfile) {
        userData = JSON.parse(storedProfile);
      } else {
        userData = currentUser;
      }

      setProfileData({
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        title: userData?.title || '',
        bio: userData?.bio || ''
      });
    };

    if (currentUser) {
      loadProfileData();
    }
  }, [currentUser, targetUser]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      // Mock API call - in real implementation, this would call the backend
      // const response = await fetch('/api/user/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ ...profileData, targetUserId: targetUser?.id })
      // });

      setTimeout(() => {
        // Get existing profile data
        const storageKey = targetUser ? `user_${targetUser.id}_profile` : 'current_user_profile';
        const existingProfile = JSON.parse(localStorage.getItem(storageKey) || '{}');

        const updatedUser = {
          ...currentUser,
          ...existingProfile,
          ...profileData,
          id: currentUser?.id || existingProfile.id
        };

        // Store in localStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedUser));

        // Also update the main user profile if this is the current user
        if (!targetUser) {
          localStorage.setItem('current_user_profile', JSON.stringify(updatedUser));
        }

        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        }

        addNotification('Profile updated successfully', 'success');
        setSaving(false);
      }, 500);

    } catch (error) {
      addNotification('Failed to update profile', 'error');
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="mr-2">👤</span>
          {isAdmin && targetUser ? `Manage ${targetUser.name}'s Profile` : 'Profile Management'}
        </h3>
      </div>
      <div className="card-body">
        {/* Profile Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 border-b pb-2">Profile Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter email address"
                disabled={!isAdmin}
              />
              {!isAdmin && (
                <p className="text-xs text-gray-500 mt-1">
                  Contact an administrator to change your email address
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                value={profileData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Senior Real Estate Agent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
      </div>
      
      <div className="card-footer">
        <div className="flex justify-end">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
