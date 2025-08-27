import React, { useState, useEffect } from 'react';
import { settingsAPI, adminAPI, loopAPI, apiUtils } from '../services/api';
import { useConfirmation } from '../components/ConfirmationContext';
import ProfileManagement from '../components/ProfileManagement';
import LoopList from '../components/LoopList';
import ThemeToggle from '../components/ThemeToggle';

const UserProfileImage = ({ user, size = 'w-8 h-8' }) => {
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const storedProfile = localStorage.getItem(`user_${user.id}_profile`);
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setProfileImage(profile.profileImage);
    }
  }, [user.id]);

  const getInitials = () => {
    const name = user?.name || 'User';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (profileImage) {
    return (
      <div className={`${size} rounded-full overflow-hidden border border-gray-300 flex-shrink-0`}>
        <img
          src={profileImage}
          alt="Profile"
          className="w-full h-full object-cover"
          style={{ borderRadius: '50%' }}
        />
      </div>
    );
  }

  return (
    <div className={`${size} bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs border border-gray-300 flex-shrink-0`}>
      {getInitials()}
    </div>
  );
};

const AdminSettingsNew = ({ user, addNotification }) => {
  const [activeTab, setActiveTab] = useState('system');

  // Tab configuration
  const tabs = [
    { id: 'system', name: 'System Information', icon: '⚙️' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'notifications', name: 'Email Notifications', icon: '📧' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'activity', name: 'Activity Logs', icon: '📊' },
    { id: 'loops', name: 'All Transaction Loops', icon: '📋' },
    { id: 'templates', name: 'Document Templates', icon: '📄' },
    { id: 'apikeys', name: 'API Keys', icon: '🔑' },
    { id: 'password', name: 'Password Management', icon: '🔐' },
    { id: 'exports', name: 'Data Export', icon: '📤' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationSettings user={user} addNotification={addNotification} />;
      case 'appearance':
        return <AppearanceSettings addNotification={addNotification} />;
      case 'system':
        return <SystemInformation addNotification={addNotification} />;
      case 'users':
        return <UserManagement addNotification={addNotification} />;
      case 'templates':
        return <DocumentTemplates addNotification={addNotification} />;
      case 'apikeys':
        return <APIKeysManagement addNotification={addNotification} />;
      case 'activity':
        return <ActivityLogs addNotification={addNotification} />;
      case 'password':
        return <PasswordManagement user={user} addNotification={addNotification} />;
      case 'exports':
        return <DataExport addNotification={addNotification} />;
      case 'loops':
        return <AllTransactionLoops addNotification={addNotification} />;
      default:
        return <SystemInformation addNotification={addNotification} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600">
          Manage system settings, users, and monitor activity.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Settings Categories</h3>
          <p className="text-sm text-slate-600">Choose a section to configure</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 settings-nav-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-tab-horizontal group ${
                  activeTab === tab.id ? 'active' : ''
                }`}
              >
                <div className="settings-tab-horizontal-content">
                  <div className="settings-tab-horizontal-icon">
                    <span>{tab.icon}</span>
                  </div>
                  <span className="settings-tab-horizontal-title">{tab.name}</span>
                </div>
                {activeTab === tab.id && (
                  <div className="settings-tab-horizontal-indicator"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Notification Settings Component (existing functionality)
const NotificationSettings = ({ user, addNotification }) => {
  const [settings, setSettings] = useState({
    notify_on_new_loops: true,
    notify_on_updated_loops: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optionalEmail, setOptionalEmail] = useState('');
  const [showOptionalEmailForm, setShowOptionalEmailForm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [optionalEmailVerified, setOptionalEmailVerified] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (settingName, value) => {
    setSettings(prev => ({
      ...prev,
      [settingName]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const settingsToSave = {
        ...settings,
        optionalEmail: optionalEmailVerified ? optionalEmail : null
      };
      const response = await settingsAPI.updateNotificationPreferences(settingsToSave);

      if (response.data.success) {
        addNotification('Notification preferences saved successfully', 'success');
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendOtpToMainEmail = async () => {
    if (!optionalEmail.trim()) {
      addNotification('Please enter an email address', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(optionalEmail.trim())) {
      addNotification('Please enter a valid email address', 'error');
      return;
    }

    try {
      setSendingOtp(true);
      // Mock OTP sending - in real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      setShowOtpForm(true);
      addNotification(`OTP sent to ${user?.email}`, 'success');
    } catch (error) {
      addNotification('Failed to send OTP', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtpCode = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      addNotification('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    try {
      setVerifyingOtp(true);
      // Mock OTP verification - in real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // For demo purposes, accept any 6-digit code
      if (otpCode.length === 6) {
        setOptionalEmailVerified(true);
        setShowOtpForm(false);
        setShowOptionalEmailForm(false);
        setOtpCode('');
        addNotification('Email verified successfully!', 'success');
      } else {
        addNotification('Invalid OTP code', 'error');
      }
    } catch (error) {
      addNotification('Failed to verify OTP', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const cancelOtpVerification = () => {
    setShowOtpForm(false);
    setOtpCode('');
    setOptionalEmail('');
    setShowOptionalEmailForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Email Notification Preferences</h3>
      </div>
      <div className="card-body space-y-6">
        {/* New Loops Notification */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h4 className="settings-item-title">New Loop Created</h4>
            <p className="settings-item-description">
              Get notified when a new transaction loop is created by any agent.
            </p>
          </div>
          <label className="notification-toggle">
            <input
              type="checkbox"
              checked={settings.notify_on_new_loops}
              onChange={(e) => handleSettingChange('notify_on_new_loops', e.target.checked)}
              className="notification-checkbox"
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Updated Loops Notification */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h4 className="settings-item-title">Loop Updated</h4>
            <p className="settings-item-description">
              Get notified when an existing transaction loop is modified.
            </p>
          </div>
          <label className="notification-toggle">
            <input
              type="checkbox"
              checked={settings.notify_on_updated_loops}
              onChange={(e) => handleSettingChange('notify_on_updated_loops', e.target.checked)}
              className="notification-checkbox"
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Optional Email Address Section */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h4 className="settings-item-title">Additional Email for Notifications</h4>
            <p className="settings-item-description">
              Optionally add another email address to receive notifications. An OTP will be sent to your primary email for verification.
            </p>
            {optionalEmailVerified && optionalEmail && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Verified: {optionalEmail}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowOptionalEmailForm(!showOptionalEmailForm)}
            className="btn btn-secondary"
          >
            {optionalEmailVerified && optionalEmail ? 'Update Email' : 'Add Email'}
          </button>
        </div>

        {/* Optional Email Form */}
        {showOptionalEmailForm && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Email Address
              </label>
              <div className="flex space-x-3">
                <input
                  type="email"
                  value={optionalEmail}
                  onChange={(e) => setOptionalEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter additional email address"
                  disabled={showOtpForm}
                />
                <button
                  onClick={sendOtpToMainEmail}
                  disabled={!optionalEmail.trim() || sendingOtp || showOtpForm}
                  className="btn btn-primary"
                >
                  {sendingOtp ? (
                    <>
                      <div className="spinner"></div>
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </div>
            </div>

            {/* OTP Verification Form */}
            {showOtpForm && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start mb-3">
                  <span className="text-blue-500 text-lg mr-2">📧</span>
                  <div>
                    <h4 className="font-medium text-blue-900">OTP Verification</h4>
                    <p className="text-sm text-blue-700">
                      An OTP has been sent to <strong>{user?.email}</strong>. Please enter it below to verify the additional email address.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                  />
                  <button
                    onClick={verifyOtpCode}
                    disabled={!otpCode.trim() || verifyingOtp}
                    className="btn btn-success"
                  >
                    {verifyingOtp ? (
                      <>
                        <div className="spinner"></div>
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>
                  <button
                    onClick={cancelOtpVerification}
                    disabled={verifyingOtp}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start">
            <span className="text-2xl mr-2">ℹ️</span>
            <div>
              <h4 className="font-medium text-blue-900">Email Configuration</h4>
              <p className="text-sm text-blue-700 mt-1">
                Primary email: <strong>{user?.email}</strong>
              </p>
              {optionalEmailVerified && optionalEmail && (
                <p className="text-sm text-blue-700 mt-1">
                  Additional email: <strong>{optionalEmail}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer">
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = ({ addNotification }) => {
  const [users, setUsers] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passwordModal, setPasswordModal] = useState({ show: false, user: null });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordVisibility, setPasswordVisibility] = useState({ newPassword: false, confirmPassword: false });
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileModal, setProfileModal] = useState({ show: false, user: null });
  const [suspendingUsers, setSuspendingUsers] = useState(new Set());
  const [deletingUsers, setDeletingUsers] = useState(new Set());
  const [csvImportModal, setCsvImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const { confirmAction } = useConfirmation();

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersResponse, activityResponse] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getUserActivitySummary()
      ]);
      
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.users);
      }
      
      if (activityResponse.data.success) {
        setUserActivity(activityResponse.data.userActivity);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openPasswordModal = (user) => {
    setPasswordModal({ show: true, user });
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordVisibility({ newPassword: false, confirmPassword: false });
  };

  const closePasswordModal = () => {
    setPasswordModal({ show: false, user: null });
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordVisibility({ newPassword: false, confirmPassword: false });
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const openProfileModal = (user) => {
    setProfileModal({ show: true, user });
  };

  const closeProfileModal = () => {
    setProfileModal({ show: false, user: null });
  };

  const handleProfileUpdate = (updatedUser) => {
    // Update the user in the users list
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addNotification(`Profile updated for ${updatedUser.name}`, 'success');
  };

  const changeUserPassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addNotification('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      setChangingPassword(true);
      const response = await adminAPI.changePassword({
        userId: passwordModal.user.id,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        addNotification(`Password changed successfully for ${passwordModal.user.name}`, 'success');
        closePasswordModal();
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const suspendUser = async (user) => {
    const confirmed = await confirmAction({
      title: 'Suspend User',
      message: `Are you sure you want to suspend ${user.name}? They will not be able to log in until unsuspended.`,
      confirmText: 'Suspend User',
      cancelText: 'Cancel',
      type: 'warning',
      icon: '⚠️',
      onConfirm: async () => {
        setSuspendingUsers(prev => new Set([...prev, user.id]));
        try {
          const response = await adminAPI.suspendUser(user.id);
          if (response.data.success) {
            addNotification(response.data.message, 'success');
            fetchUsers(); // Refresh the user list
          }
        } catch (error) {
          const errorMessage = apiUtils.getErrorMessage(error);
          addNotification(errorMessage, 'error');
        } finally {
          setSuspendingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(user.id);
            return newSet;
          });
        }
      }
    });
  };

  const unsuspendUser = async (user) => {
    const confirmed = await confirmAction({
      title: 'Unsuspend User',
      message: `Are you sure you want to unsuspend ${user.name}? They will be able to log in again.`,
      confirmText: 'Unsuspend User',
      cancelText: 'Cancel',
      type: 'success',
      icon: '✅',
      onConfirm: async () => {
        setSuspendingUsers(prev => new Set([...prev, user.id]));
        try {
          const response = await adminAPI.unsuspendUser(user.id);
          if (response.data.success) {
            addNotification(response.data.message, 'success');
            fetchUsers(); // Refresh the user list
          }
        } catch (error) {
          const errorMessage = apiUtils.getErrorMessage(error);
          addNotification(errorMessage, 'error');
        } finally {
          setSuspendingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(user.id);
            return newSet;
          });
        }
      }
    });
  };

  const promoteToAdmin = async (user) => {
    const confirmed = await confirmAction({
      title: 'Promote to Admin',
      message: `Are you sure you want to promote ${user.name} to admin role? This will grant them full administrative privileges.`,
      confirmText: 'Promote to Admin',
      cancelText: 'Cancel',
      type: 'warning',
      icon: '👑',
      onConfirm: async () => {
        try {
          const response = await adminAPI.promoteToAdmin(user.id);
          if (response.data.success) {
            addNotification(`${user.name} has been promoted to admin successfully`, 'success');
            fetchUsers(); // Refresh the user list
          }
        } catch (error) {
          const errorMessage = apiUtils.getErrorMessage(error);
          addNotification(errorMessage, 'error');
        }
      }
    });
  };

  const deleteUser = async (user) => {
    const confirmed = await confirmAction({
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${user.name}? This action cannot be undone and will remove all their data from the system.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      type: 'danger',
      icon: '🗑️',
      onConfirm: async () => {
        setDeletingUsers(prev => new Set([...prev, user.id]));
        try {
          const response = await adminAPI.deleteUser(user.id);
          if (response.data.success) {
            addNotification(response.data.message, 'success');
            fetchUsers(); // Refresh the user list
          }
        } catch (error) {
          const errorMessage = apiUtils.getErrorMessage(error);
          addNotification(errorMessage, 'error');
        } finally {
          setDeletingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(user.id);
            return newSet;
          });
        }
      }
    });
  };

  const openCsvImportModal = () => {
    setCsvImportModal(true);
    setCsvFile(null);
    setCsvPreview([]);
    setImportResults(null);
  };

  const closeCsvImportModal = () => {
    setCsvImportModal(false);
    setCsvFile(null);
    setCsvPreview([]);
    setImportResults(null);
  };

  const handleCsvFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvPreview(file);
    } else {
      addNotification('Please select a valid CSV file', 'error');
      setCsvFile(null);
      setCsvPreview([]);
    }
  };

  const parseCsvPreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      const lines = csvText.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        addNotification('CSV file is empty', 'error');
        return;
      }

      // Parse header
      const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));

      // Validate header
      if (!header.includes('username') || !header.includes('email')) {
        addNotification('CSV must contain "username" and "email" columns', 'error');
        setCsvPreview([]);
        return;
      }

      // Parse data rows (limit preview to first 10 rows)
      const preview = lines.slice(1, 11).map((line, index) => {
        const values = line.split(',').map(val => val.trim().replace(/"/g, ''));
        const row = {};
        header.forEach((col, i) => {
          row[col] = values[i] || '';
        });
        row.lineNumber = index + 2; // +2 because index starts at 0 and we skipped header
        return row;
      });

      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const importUsers = async () => {
    if (!csvFile) {
      addNotification('Please select a CSV file first', 'error');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const response = await adminAPI.importUsers(formData);

      if (response.data.success) {
        setImportResults(response.data);
        addNotification(`Successfully imported ${response.data.successful} users`, 'success');
        fetchUsers(); // Refresh the user list
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSV Import Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">📥</span>
            Import Users from CSV
          </h3>
        </div>
        <div className="card-body">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">ℹ️</span>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Your CSV file must contain the following columns (column names are case-sensitive):
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li><code className="bg-blue-100 px-2 py-1 rounded">username</code> - User's display name</li>
                  <li><code className="bg-blue-100 px-2 py-1 rounded">email</code> - User's email address (must be unique)</li>
                </ul>
                <p className="text-sm text-blue-700 mt-2">
                  <strong>Note:</strong> Random passwords will be generated automatically for each user.
                  You can change passwords later using the "Change Password" button for each user.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Upload a CSV file to bulk import users into the system
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const csvContent = 'username,email\nJohn Smith,john.smith@example.com\nSarah Johnson,sarah.johnson@example.com';
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'user-import-template.csv');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                  addNotification('CSV template downloaded successfully', 'success');
                }}
                className="btn btn-outline flex items-center gap-2"
              >
                <span>📄</span>
                Download Template
              </button>
              <button
                onClick={openCsvImportModal}
                className="btn btn-primary flex items-center gap-2"
              >
                <span>📥</span>
                Import Users
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Registered Users ({users.length})</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Activity Summary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const activity = userActivity.find(a => a.id === user.id);
                  return (
                    <tr key={user.id}>
                      <td className="font-medium">#{user.id}</td>
                      <td>
                        <UserProfileImage user={user} />
                      </td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`status-badge ${user.role === 'admin' ? 'status-closing' : 'status-active'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.suspended ? 'status-cancelled' : 'status-active'}`}>
                          {user.suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="text-sm">
                          <div>Total: {activity?.total_activities || 0} actions</div>
                          <div>Logins: {activity?.login_count || 0}</div>
                          <div>Last: {activity?.last_activity ? new Date(activity.last_activity).toLocaleDateString() : 'Never'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="flex space-x-2 flex-wrap gap-2">
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="btn btn-sm btn-secondary"
                            title={`Change password for ${user.name}`}
                          >
                            🔐 Change Password
                          </button>
                          <button
                            onClick={() => openProfileModal(user)}
                            className="btn btn-sm btn-outline"
                            title={`Manage ${user.name}'s profile`}
                          >
                            👤 Manage Profile
                          </button>

                          {user.role === 'agent' && (
                            <button
                              onClick={() => promoteToAdmin(user)}
                              className="btn btn-sm btn-success"
                              title={`Promote ${user.name} to admin`}
                            >
                              👑 Add as Admin
                            </button>
                          )}

                          {user.role !== 'admin' && (
                            user.suspended ? (
                              <button
                                onClick={() => unsuspendUser(user)}
                                disabled={suspendingUsers.has(user.id)}
                                className="btn btn-sm btn-success"
                                title={`Unsuspend ${user.name}`}
                              >
                                {suspendingUsers.has(user.id) ? (
                                  <>
                                    <div className="spinner"></div>
                                    Unsuspending...
                                  </>
                                ) : (
                                  '✅ Unsuspend'
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => suspendUser(user)}
                                disabled={suspendingUsers.has(user.id)}
                                className="btn btn-sm btn-danger"
                                title={`Suspend ${user.name}`}
                              >
                                {suspendingUsers.has(user.id) ? (
                                  <>
                                    <div className="spinner"></div>
                                    Suspending...
                                  </>
                                ) : (
                                  '❌ Suspend'
                                )}
                              </button>
                            )
                          )}

                          {user.role !== 'admin' && (
                            <button
                              onClick={() => deleteUser(user)}
                              disabled={deletingUsers.has(user.id)}
                              className="btn btn-sm btn-danger"
                              title={`Delete ${user.name}`}
                              style={{backgroundColor: '#dc3545', borderColor: '#dc3545'}}
                            >
                              {deletingUsers.has(user.id) ? (
                                <>
                                  <div className="spinner"></div>
                                  Deleting...
                                </>
                              ) : (
                                '🗑️ Delete'
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {passwordModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Change Password for {passwordModal.user?.name}
              </h3>
              <button
                onClick={closePasswordModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={passwordVisibility.newPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {passwordVisibility.newPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={passwordVisibility.confirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {passwordVisibility.confirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Changing this user's password will require them to use the new password on their next login.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closePasswordModal}
                className="btn btn-outline"
                disabled={changingPassword}
              >
                Cancel
              </button>
              <button
                onClick={changeUserPassword}
                disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="btn btn-primary"
              >
                {changingPassword ? (
                  <>
                    <div className="spinner"></div>
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Management Modal */}
      {profileModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Manage Profile for {profileModal.user?.name}
              </h3>
              <button
                onClick={closeProfileModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <ProfileManagement
              user={profileModal.user}
              targetUser={profileModal.user}
              isAdmin={true}
              onProfileUpdate={handleProfileUpdate}
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={closeProfileModal}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {csvImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Import Users from CSV</h3>
              <button
                onClick={closeCsvImportModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {!importResults ? (
              <>
                {/* File Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {csvPreview.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Preview (First 10 rows)</h4>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Line
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Username
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Email
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {csvPreview.map((row, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-3 py-2 text-sm text-gray-500">{row.lineNumber}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900">{row.username || '❌ Missing'}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900">{row.email || '❌ Missing'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-start">
                          <span className="text-green-500 text-lg mr-2">✅</span>
                          <div>
                            <h4 className="font-medium text-green-900">Ready to Import</h4>
                            <p className="text-sm text-green-700 mt-1">
                              {csvPreview.length} users will be imported. Random passwords will be generated for each user.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeCsvImportModal}
                    className="btn btn-outline"
                    disabled={importing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={importUsers}
                    disabled={importing || !csvFile || csvPreview.length === 0}
                    className="btn btn-primary"
                  >
                    {importing ? (
                      <>
                        <div className="spinner"></div>
                        Importing...
                      </>
                    ) : (
                      'Import Users'
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Import Results */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {importResults.successful > 0 ? '✅' : '❌'}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Import Complete</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
                    <div className="text-sm text-blue-700">Total Processed</div>
                  </div>
                </div>

                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Import Errors:</h5>
                    <div className="bg-red-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          Line {error.line}: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResults.successfulUsers && importResults.successfulUsers.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Successfully Imported Users:</h5>
                    <div className="bg-green-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      {importResults.successfulUsers.map((user, index) => (
                        <div key={index} className="text-sm text-green-700 mb-1">
                          {user.username} ({user.email}) - Password: <code className="bg-green-100 px-1 rounded">{user.password}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={closeCsvImportModal}
                    className="btn btn-primary"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Logs Component
const ActivityLogs = ({ addNotification }) => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actionType: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getActivityLogs({
        ...filters,
        limit: 100
      });
      
      if (response.data.success) {
        setLogs(response.data.logs);
        setStats(response.data.stats);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const exportLogs = async () => {
    try {
      const response = await adminAPI.exportActivityLogs(filters);
      apiUtils.downloadFile(response.data, 'activity-logs.csv');
      addNotification('Activity logs exported successfully', 'success');
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const clearLogs = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to clear ALL activity logs? This action cannot be undone.');
      if (!confirmed) return;

      const response = await adminAPI.clearActivityLogs();
      if (response.data && response.data.success) {
        setLogs([]); // Clear the local state immediately
        setStats({}); // Clear stats as well
        await fetchLogs(); // Refresh the logs
        addNotification('All activity logs cleared successfully', 'success');
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.today_activities || 0}</div>
              <div className="text-sm text-gray-600">Today</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.week_activities || 0}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total_logins || 0}</div>
              <div className="text-sm text-gray-600">Total Logins</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.total_activities || 0}</div>
              <div className="text-sm text-gray-600">All Activities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <select
                value={filters.actionType}
                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOOP_CREATED">Loop Created</option>
                <option value="LOOP_UPDATED">Loop Updated</option>
                <option value="PASSWORD_CHANGED">Password Changed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={exportLogs} className="btn btn-secondary">
              📤 Export Logs (CSV)
            </button>
            <button onClick={clearLogs} className="btn btn-danger" style={{marginLeft: '50px'}}>
              🗑️ Clear Logs
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Activity Logs ({logs.length})</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="spinner"></div>
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-sm">{new Date(log.created_at).toLocaleString()}</td>
                      <td>
                        <div>
                          <div className="font-medium">{log.user_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{log.user_email}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          log.action_type === 'LOGIN' ? 'status-active' :
                          log.action_type.includes('LOOP') ? 'status-closing' :
                          'status-closed'
                        }`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="max-w-xs truncate">{log.description}</td>
                      <td className="text-sm text-gray-500">{log.ip_address || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Password Management Component
const PasswordManagement = ({ user, addNotification }) => {
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({ newPassword: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (key, value) => {
    setPasswordData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addNotification('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.changePassword({
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        addNotification('Password changed successfully', 'success');
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setPasswordVisibility({ newPassword: false, confirmPassword: false });
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Change Your Password</h3>
      </div>
      <div className="card-body space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div className="relative">
            <input
              type={passwordVisibility.newPassword ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('newPassword')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            >
              {passwordVisibility.newPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={passwordVisibility.confirmPassword ? "text" : "password"}
              value={passwordData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirmPassword')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            >
              {passwordVisibility.confirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Security Note:</strong> Your password must be at least 6 characters long. 
            Choose a strong password that you haven't used elsewhere.
          </p>
        </div>
      </div>
      <div className="card-footer">
        <div className="flex justify-end">
          <button
            onClick={changePassword}
            disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Changing...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Data Export Component
const DataExport = ({ addNotification }) => {
  const [loading, setLoading] = useState({});

  const exportData = async (type) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      let response;
      let filename;

      switch (type) {
        case 'users':
          response = await adminAPI.exportUserList();
          filename = 'user-list.csv';
          break;
        case 'logs':
          response = await adminAPI.exportActivityLogs();
          filename = 'activity-logs.csv';
          break;
        case 'templates':
          response = await adminAPI.exportTemplates();
          filename = 'document-templates.csv';
          break;
        case 'loops':
          response = await loopAPI.exportCSV();
          filename = 'transaction-loops.csv';
          break;
        default:
          throw new Error('Unknown export type');
      }

      apiUtils.downloadFile(response.data, filename);
      addNotification(`${type} exported successfully`, 'success');
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const exportOptions = [
    {
      id: 'users',
      title: 'User List Export',
      description: 'Export complete list of registered users with their details',
      icon: '👥',
      filename: 'user-list.csv'
    },
    {
      id: 'logs',
      title: 'Activity Logs Export',
      description: 'Export all system activity logs including logins and actions',
      icon: '📊',
      filename: 'activity-logs.csv'
    },
    {
      id: 'templates',
      title: 'Document Templates Export',
      description: 'Export all document templates with their metadata and field mappings',
      icon: '📄',
      filename: 'document-templates.csv'
    },
    {
      id: 'loops',
      title: 'Transaction Loops Export',
      description: 'Export all transaction loops including active, closed, and archived ones',
      icon: '📋',
      filename: 'transaction-loops.csv'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Data Export Options</h3>
        </div>
        <div className="card-body space-y-4">
          {exportOptions.map((option) => (
            <div key={option.id} className="settings-item">
              <div className="settings-item-content">
                <h4 className="settings-item-title flex items-center">
                  <span className="mr-2">{option.icon}</span>
                  {option.title}
                </h4>
                <p className="settings-item-description">{option.description}</p>
                <p className="text-xs text-gray-500 mt-1">File: {option.filename}</p>
              </div>
              <button
                onClick={() => exportData(option.id)}
                disabled={loading[option.id]}
                className="btn btn-secondary"
              >
                {loading[option.id] ? (
                  <>
                    <div className="spinner"></div>
                    Exporting...
                  </>
                ) : (
                  '📤 Export'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Document Templates Component
const DocumentTemplates = ({ addNotification }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: 'contract',
    fields: []
  });
  const [uploading, setUploading] = useState(false);
  const [fieldMappingModal, setFieldMappingModal] = useState({ show: false, template: null });
  const { confirmDelete } = useConfirmation();

  useEffect(() => {
    fetchTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDocumentTemplates();

      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = () => {
    setUploadModal(true);
    setSelectedFile(null);
    setTemplateData({
      name: '',
      description: '',
      category: 'contract',
      fields: []
    });
  };

  const closeUploadModal = () => {
    setUploadModal(false);
    setSelectedFile(null);
    setTemplateData({
      name: '',
      description: '',
      category: 'contract',
      fields: []
    });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        // Auto-fill template name from filename
        if (!templateData.name) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          setTemplateData(prev => ({ ...prev, name: nameWithoutExt }));
        }
      } else {
        addNotification('Please select a PDF or Word document', 'error');
        setSelectedFile(null);
      }
    }
  };

  const uploadTemplate = async () => {
    if (!selectedFile || !templateData.name.trim()) {
      addNotification('Please select a file and provide a template name', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('templateFile', selectedFile);
      formData.append('name', templateData.name);
      formData.append('description', templateData.description);
      formData.append('category', templateData.category);

      const response = await adminAPI.uploadDocumentTemplate(formData);

      if (response.data.success) {
        addNotification('Document template uploaded successfully', 'success');
        closeUploadModal();
        fetchTemplates();
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setUploading(false);
    }
  };

  const deleteTemplate = async (template) => {
    const confirmed = await confirmDelete({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      confirmText: 'Delete Template',
      onConfirm: async () => {
        const response = await adminAPI.deleteDocumentTemplate(template.id);
        if (response.data.success) {
          addNotification('Template deleted successfully', 'success');
          fetchTemplates();
        }
      }
    });

    if (!confirmed) {
      // User cancelled or action failed
      const errorMessage = 'Failed to delete template';
      addNotification(errorMessage, 'error');
    }
  };

  const openFieldMappingModal = (template) => {
    setFieldMappingModal({ show: true, template });
  };

  const closeFieldMappingModal = () => {
    setFieldMappingModal({ show: false, template: null });
  };

  const categories = [
    { value: 'contract', label: 'Contract' },
    { value: 'listing', label: 'Listing Agreement' },
    { value: 'disclosure', label: 'Disclosure' },
    { value: 'addendum', label: 'Addendum' },
    { value: 'notice', label: 'Notice' },
    { value: 'other', label: 'Other' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <span className="mr-2">📄</span>
                Document Templates
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload and manage document templates for automatic loop generation
              </p>
            </div>
            <button
              onClick={openUploadModal}
              className="btn btn-primary flex items-center gap-2"
            >
              <span>📤</span>
              Upload Template
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">ℹ️</span>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">How Document Templates Work</h4>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Upload PDF or Word documents as templates</li>
                  <li>Map template fields to loop data for automatic population</li>
                  <li>Generate documents with pre-filled information from loops</li>
                  <li>Templates can be reused for multiple transactions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Uploaded Templates ({templates.length})</h3>
        </div>
        <div className="card-body">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates uploaded</h3>
              <p className="text-gray-600 mb-4">
                Upload your first document template to get started
              </p>
              <button
                onClick={openUploadModal}
                className="btn btn-primary"
              >
                Upload Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">
                        {template.file_type === 'pdf' ? '📕' : '📘'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <p className="text-xs text-gray-500 capitalize">{template.category}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${
                      template.fields_mapped ? 'status-active' : 'status-closing'
                    }`}>
                      {template.fields_mapped ? 'Mapped' : 'Unmapped'}
                    </span>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  )}

                  <div className="text-xs text-gray-500 mb-3">
                    <div>Uploaded: {new Date(template.created_at).toLocaleDateString()}</div>
                    <div>Size: {(template.file_size / 1024).toFixed(1)} KB</div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openFieldMappingModal(template)}
                      className="btn btn-sm btn-outline flex items-center gap-1 flex-1"
                    >
                      🔗 Map Fields
                    </button>
                    <button
                      onClick={() => deleteTemplate(template)}
                      className="btn btn-sm btn-danger flex items-center gap-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Document Template</h3>
              <button
                onClick={closeUploadModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document File *
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX (Max size: 10MB)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateData.name}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={templateData.category}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={templateData.description}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Brief description of this template"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeUploadModal}
                className="btn btn-outline"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={uploadTemplate}
                disabled={uploading || !selectedFile || !templateData.name.trim()}
                className="btn btn-primary"
              >
                {uploading ? (
                  <>
                    <div className="spinner"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload Template'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Mapping Modal - Will be implemented next */}
      {fieldMappingModal.show && (
        <FieldMappingModal
          template={fieldMappingModal.template}
          onClose={closeFieldMappingModal}
          onSave={() => {
            closeFieldMappingModal();
            fetchTemplates();
          }}
          addNotification={addNotification}
        />
      )}
    </div>
  );
};

// Field Mapping Modal Component
const FieldMappingModal = ({ template, onClose, onSave, addNotification }) => {
  const [fieldMappings, setFieldMappings] = useState([]);
  const [newField, setNewField] = useState({ name: '', loopField: '', type: 'text' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load existing field mappings if available
    if (template.field_mappings) {
      setFieldMappings(template.field_mappings);
    }
  }, [template]);

  // Available loop fields that can be mapped
  const availableLoopFields = [
    { value: 'property_address', label: 'Property Address' },
    { value: 'client_name', label: 'Client Name' },
    { value: 'client_email', label: 'Client Email' },
    { value: 'client_phone', label: 'Client Phone' },
    { value: 'sale', label: 'Sale Amount' },
    { value: 'status', label: 'Status' },
    { value: 'type', label: 'Transaction Type' },
    { value: 'start_date', label: 'Start Date' },
    { value: 'end_date', label: 'End Date' },
    { value: 'tags', label: 'Tags' },
    { value: 'notes', label: 'Notes' },
    { value: 'creator_name', label: 'Agent Name' }
  ];

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'currency', label: 'Currency' }
  ];

  const addFieldMapping = () => {
    if (!newField.name.trim() || !newField.loopField) {
      addNotification('Please provide field name and select a loop field', 'error');
      return;
    }

    // Check if field name already exists
    if (fieldMappings.some(field => field.name === newField.name.trim())) {
      addNotification('Field name already exists', 'error');
      return;
    }

    setFieldMappings(prev => [...prev, {
      id: Date.now(),
      name: newField.name.trim(),
      loopField: newField.loopField,
      type: newField.type
    }]);

    setNewField({ name: '', loopField: '', type: 'text' });
  };

  const removeFieldMapping = (fieldId) => {
    setFieldMappings(prev => prev.filter(field => field.id !== fieldId));
  };

  const saveFieldMappings = async () => {
    try {
      setSaving(true);
      const response = await adminAPI.updateTemplateFields(template.id, fieldMappings);

      if (response.data.success) {
        addNotification('Field mappings saved successfully', 'success');
        onSave();
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Map Template Fields</h3>
            <p className="text-sm text-gray-600">{template.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <span className="text-blue-500 text-lg mr-2">ℹ️</span>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">How Field Mapping Works</h4>
              <p className="text-sm text-blue-700">
                Define template fields that will be automatically populated with loop data.
                Use placeholder names like "client_name" in your document template,
                then map them to actual loop fields here.
              </p>
            </div>
          </div>
        </div>

        {/* Add New Field Mapping */}
        <div className="card mb-6">
          <div className="card-header">
            <h4 className="font-semibold">Add Field Mapping</h4>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name in Template
                </label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., client_name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loop Field
                </label>
                <select
                  value={newField.loopField}
                  onChange={(e) => setNewField(prev => ({ ...prev, loopField: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select loop field</option>
                  {availableLoopFields.map(field => (
                    <option key={field.value} value={field.value}>{field.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={newField.type}
                  onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {fieldTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={addFieldMapping}
                  className="btn btn-primary w-full"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Field Mappings */}
        <div className="card mb-6">
          <div className="card-header">
            <h4 className="font-semibold">Current Field Mappings ({fieldMappings.length})</h4>
          </div>
          <div className="card-body">
            {fieldMappings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2">🔗</div>
                <p>No field mappings defined yet</p>
                <p className="text-sm">Add field mappings above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fieldMappings.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Template Field</div>
                        <div className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                          {field.name}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Maps to Loop Field</div>
                        <div className="text-sm font-medium">
                          {availableLoopFields.find(f => f.value === field.loopField)?.label}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Type</div>
                        <div className="text-sm capitalize">{field.type}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFieldMapping(field.id)}
                      className="btn btn-sm btn-danger ml-4"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template Usage Instructions */}
        {fieldMappings.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-green-900 mb-2">Template Usage</h4>
            <p className="text-sm text-green-700 mb-2">
              Use these placeholders in your document template:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {fieldMappings.map((field) => (
                <code key={field.id} className="text-xs bg-green-100 px-2 py-1 rounded">
                  {field.name}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn btn-outline"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={saveFieldMappings}
            disabled={saving || fieldMappings.length === 0}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              'Save Field Mappings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// API Keys Management Component
const APIKeysManagement = ({ addNotification }) => {
  const [apiKeys, setApiKeys] = useState({
    apiKey: '',
    secretKey: '',
    webhookUrl: '',
    environment: 'sandbox'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [integrations, setIntegrations] = useState([
    { name: 'Zapier', enabled: false, description: 'Connect with Zapier for workflow automation' },
    { name: 'Slack', enabled: false, description: 'Send notifications to Slack channels' },
    { name: 'Google Sheets', enabled: false, description: 'Sync data with Google Sheets' },
    { name: 'DocuSign', enabled: false, description: 'Electronic signature integration' },
    { name: 'Stripe', enabled: false, description: 'Payment processing integration' }
  ]);

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      // This would fetch from backend API
      // const response = await adminAPI.getAPIKeys();
      // For now, using local storage as mock
      const storedKeys = localStorage.getItem('nexus_api_keys');
      if (storedKeys) {
        setApiKeys(JSON.parse(storedKeys));
      }
    } catch (error) {
      addNotification('Failed to load API keys', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setApiKeys(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAPIKey = () => {
    const newApiKey = 'nxr_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKeys(prev => ({
      ...prev,
      apiKey: newApiKey
    }));
    addNotification('New API key generated', 'success');
  };

  const generateSecretKey = () => {
    const newSecretKey = 'nxs_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKeys(prev => ({
      ...prev,
      secretKey: newSecretKey
    }));
    addNotification('New secret key generated', 'success');
  };

  const saveAPIKeys = async () => {
    try {
      setSaving(true);
      // This would save to backend API
      // const response = await adminAPI.saveAPIKeys(apiKeys);
      // For now, using local storage as mock
      localStorage.setItem('nexus_api_keys', JSON.stringify(apiKeys));
      addNotification('API keys saved successfully', 'success');
    } catch (error) {
      addNotification('Failed to save API keys', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleIntegration = (index) => {
    setIntegrations(prev => prev.map((integration, i) =>
      i === index ? { ...integration, enabled: !integration.enabled } : integration
    ));
  };

  const copyToClipboard = async (text, keyType) => {
    if (!text) {
      addNotification('No key to copy', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      addNotification(`${keyType} copied to clipboard`, 'success');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        addNotification(`${keyType} copied to clipboard`, 'success');
      } catch (fallbackError) {
        addNotification('Failed to copy to clipboard', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading API keys...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Keys Configuration */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">🔑</span>
            API Keys Configuration
          </h3>
        </div>
        <div className="card-body space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">���️</span>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">API Keys for Future Integrations</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Configure your API keys here for future integrations with third-party services.
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>API Key: Used for public identification of your application</li>
                  <li>Secret Key: Used for secure authentication (keep this private)</li>
                  <li>Webhook URL: Endpoint for receiving integration callbacks</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Environment Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
            <select
              value={apiKeys.environment}
              onChange={(e) => handleInputChange('environment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production (Live)</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={apiKeys.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm pr-10"
                  placeholder="Enter your API key or generate a new one"
                  readOnly={!!apiKeys.apiKey}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(apiKeys.apiKey, 'API Key');
                    return false;
                  }}
                  disabled={!apiKeys.apiKey}
                  className="btn btn-outline flex items-center gap-1 whitespace-nowrap"
                  title="Copy API Key"
                  type="button"
                >
                  📋 Copy
                </button>
                <button
                  onClick={generateAPIKey}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type={showSecretKey ? "text" : "password"}
                  value={apiKeys.secretKey}
                  onChange={(e) => handleInputChange('secretKey', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm pr-10"
                  placeholder="Enter your secret key or generate a new one"
                  readOnly={!!apiKeys.secretKey}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  title={showSecretKey ? 'Hide secret key' : 'Show secret key'}
                >
                  {showSecretKey ? '🚫' : '👁'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(apiKeys.secretKey, 'Secret Key');
                    return false;
                  }}
                  disabled={!apiKeys.secretKey}
                  className="btn btn-outline flex items-center gap-1 whitespace-nowrap"
                  title="Copy Secret Key"
                  type="button"
                >
                  📋 Copy
                </button>
                <button
                  onClick={generateSecretKey}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
            </div>
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Keep your secret key private and secure. Do not share it publicly.
            </p>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL (Optional)</label>
            <input
              type="url"
              value={apiKeys.webhookUrl}
              onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://your-domain.com/webhooks/nexus"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL where integration callbacks will be sent
            </p>
          </div>
        </div>
        <div className="card-footer">
          <div className="flex justify-end">
            <button
              onClick={saveAPIKeys}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <div className="spinner"></div>
                  Saving...
                </>
              ) : (
                'Save API Keys'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Available Integrations */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">🔌</span>
            Available Integrations
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration, index) => (
              <div key={integration.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                      integration.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {integration.enabled ? 'Enabled' : 'Available'}
                    </span>
                  </div>
                  <label className="notification-toggle ml-4">
                    <input
                      type="checkbox"
                      checked={integration.enabled}
                      onChange={() => toggleIntegration(index)}
                      className="notification-checkbox"
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> These integrations are planned for future releases.
              Enabling them now will prepare your system for when they become available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// All Transaction Loops Component
const AllTransactionLoops = ({ addNotification }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">All Transaction Loops</h3>
        <p className="text-gray-600 text-sm">
          View and manage all transaction loops in the system.
        </p>
      </div>

      <LoopList
        user={{ role: 'admin' }}
        addNotification={addNotification}
        filters={{}}
      />
    </div>
  );
};

// Appearance Settings Component
const AppearanceSettings = ({ addNotification }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Appearance Settings</h2>
        <p className="text-gray-600">
          Customize the look and feel of your application interface.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Theme Preferences</h3>
            <p className="text-sm text-gray-600">
              Choose between light and dark themes to match your preference.
            </p>
          </div>

          <ThemeToggle />
        </div>

        {/* Additional Appearance Options (for future expansion) */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interface Options</h3>
            <p className="text-sm text-gray-600">
              Additional appearance customizations will be available here in future updates.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">
                🚧 More customization options coming soon:
              </p>
              <ul className="text-sm text-gray-500 mt-2 space-y-1">
                <li>Font size preferences</li>
                <li>Color scheme variants</li>
                <li>Sidebar layout options</li>
                <li>Dashboard widget arrangements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemInformation = ({ addNotification }) => {
  const [systemStatus, setSystemStatus] = useState('Online');
  const [systemVersion] = useState('v1.0.0');
  const [uptime, setUptime] = useState('0d 0h 0m');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Calculate uptime (simple simulation)
    const startTime = Date.now();
    const updateUptime = () => {
      const now = Date.now();
      const diffMs = now - startTime;
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setUptime(`${days}d ${hours}h ${minutes}m`);
      setLastUpdated(new Date());
    };

    updateUptime();
    const interval = setInterval(updateUptime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header with Real-time Status */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">System Information</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">Live</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</p>
        </div>

        {/* Status Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* System Status */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">ACTIVE</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">System Status</h3>
              <p className="text-2xl font-bold text-emerald-700">{systemStatus}</p>
              <p className="text-xs text-gray-500 mt-1">All services operational</p>
            </div>

            {/* Version Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M7 8h10M7 8l-2-2m12 2l2-2" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">STABLE</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Version</h3>
              <p className="text-2xl font-bold text-blue-700">{systemVersion}</p>
              <p className="text-xs text-gray-500 mt-1">Current release</p>
            </div>

            {/* Uptime */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">RUNNING</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Session Uptime</h3>
              <p className="text-2xl font-bold text-purple-700">{uptime}</p>
              <p className="text-xs text-gray-500 mt-1">Since last restart</p>
            </div>

            {/* System Health */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-lg p-5" style={{marginBottom: '47px'}}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">OPTIMAL</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">System Health</h3>
              <p className="text-2xl font-bold text-amber-700">Excellent</p>
              <p className="text-xs text-gray-500 mt-1">All components healthy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed System Information */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Environment Details</h3>
          <p className="text-sm text-gray-500">Technical specifications and configuration</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Server Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                Server Configuration
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Environment</span>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">Development</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Platform</span>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">Linux/Docker</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Architecture</span>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">x64</span>
                </div>
              </div>
            </div>

            {/* Application Stack */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                Technology Stack
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Runtime</span>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">Node.js v18+</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Database</span>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">SQLite</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Frontend</span>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">React 18</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
          <p className="text-sm text-gray-500">Real-time system performance indicators</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col">
            <div className="flex flex-col justify-center items-start">
              <div className="flex items-center justify-center mb-6"></div>
              <div className="flex flex-col">
                <div className="flex gap-5 md:gap-5 md:flex-row flex-col">
                  <div className="flex flex-col line-height-normal w-full md:w-1/2">
                    <p className="text-sm text-gray-500">Uptime</p>
                  </div>
                  <div className="flex flex-col line-height-normal w-full md:w-1/2 md:ml-5">
                    <p className="text-2xl font-bold text-gray-900 md:mx-auto">99.9%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-start">
              <div className="flex items-center justify-center mb-6"></div>
              <div>
                <div className="flex gap-5 md:gap-5 md:flex-row flex-col">
                  <div className="flex flex-col line-height-normal w-full md:w-1/2">
                    <p className="text-sm text-gray-500">Response Time</p>
                  </div>
                  <div className="flex flex-col line-height-normal w-full md:w-1/2 md:ml-5">
                    <p className="text-2xl font-bold text-gray-900">&lt;50ms</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center items-start pb-18">
              <div className="flex items-center justify-center mb-6"></div>
              <div>
                <div className="flex gap-5 md:gap-5 md:flex-row flex-col">
                  <div className="flex flex-col line-height-normal w-full md:w-1/2">
                    <p className="text-sm text-gray-500">Memory Usage</p>
                  </div>
                  <div className="flex flex-col line-height-normal w-full md:w-1/2 md:ml-5">
                    <p className="text-2xl font-bold text-gray-900">Stable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsNew;
