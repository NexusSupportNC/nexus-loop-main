import React, { useState, useEffect } from 'react';
import { settingsAPI, apiUtils } from '../services/api';

const AdminSettings = ({ user, addNotification }) => {
  const [settings, setSettings] = useState({
    notify_on_new_loops: true,
    notify_on_updated_loops: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

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
      const response = await settingsAPI.updateNotificationPreferences(settings);
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600">
          Configure your notification preferences and system settings.
        </p>
      </div>

      {/* Email Notifications Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="text-2xl mr-2">📧</span>
            Email Notifications
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            <p className="text-gray-600">
              Configure when you want to receive email notifications about loop activities.
            </p>

            {/* New Loops Notification */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">New Loop Created</h4>
                <p className="text-sm text-gray-600">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Loop Updated</h4>
                <p className="text-sm text-gray-600">
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

            {/* Email Configuration Note */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <span className="text-2xl mr-2">ℹ️</span>
                <div>
                  <h4 className="font-medium text-blue-900">Email Configuration</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Notifications will be sent to your registered email address: <strong>{user?.email}</strong>
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Make sure your email server is properly configured in the system settings.
                  </p>
                </div>
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

      {/* System Information Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="text-2xl mr-2">⚙️</span>
            System Information
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">User Role</h4>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">Email Address</h4>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">Account Name</h4>
              <p className="text-sm text-gray-600">{user?.name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">Notification Status</h4>
              <p className="text-sm text-gray-600">
                {settings.notify_on_new_loops || settings.notify_on_updated_loops 
                  ? 'Enabled' 
                  : 'Disabled'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
