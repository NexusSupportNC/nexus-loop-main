import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoopDocuments from '../components/LoopDocuments';
import LoopFiles from '../components/LoopFiles';
import LoopTasks from '../components/LoopTasks';
import LoopDetails from '../components/LoopDetails';
import LoopPeople from '../components/LoopPeople';
import { loopAPI, apiUtils } from '../services/api';
import { dateUtils } from '../utils/dateUtils';

const EditLoop = ({ user, addNotification }) => {
  const [loop, setLoop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('documents'); // documents | tasks | people | details | activity | notifications
  const navigate = useNavigate();
  const { id } = useParams();

  const fetchLoop = useCallback(async () => {
    try {
      setFetchLoading(true);
      const response = await loopAPI.getLoop(id);

      if (response.data.success) {
        setLoop(response.data.loop);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');

      // Redirect back if loop not found or access denied
      const dashboardPath = user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent';
      navigate(dashboardPath);
    } finally {
      setFetchLoading(false);
    }
  }, [id, addNotification, user?.role, navigate]);

  useEffect(() => {
    fetchLoop();
  }, [fetchLoop]);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const res = await fetch(`/api/loops/${id}/activity`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (data.success) setActivity(data.logs);
      } catch (e) { /* ignore */ }
    };
    loadActivity();
  }, [id]);

  const handleSubmit = async (formData) => {
    setLoading(true);

    try {
      const response = await loopAPI.updateLoop(id, formData);
      if (response.data.success) {
        addNotification('Transaction loop updated successfully!', 'success');
        fetchLoop();
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this loop? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await loopAPI.deleteLoop(id);
      
      if (response.data.success) {
        addNotification('Loop deleted successfully', 'success');
        
        // Redirect to dashboard
        const dashboardPath = user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent';
        navigate(dashboardPath);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this loop?')) {
      return;
    }

    try {
      const response = await loopAPI.archiveLoop(id);
      
      if (response.data.success) {
        addNotification('Loop archived successfully', 'success');
        
        // Redirect to dashboard
        const dashboardPath = user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent';
        navigate(dashboardPath);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await loopAPI.exportPDF(id);
      apiUtils.downloadFile(response.data, `loop-${id}.pdf`);
      addNotification('PDF exported successfully', 'success');
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'status-badge status-active',
      closing: 'status-badge status-closing',
      closed: 'status-badge status-closed',
      cancelled: 'status-badge status-cancelled'
    };

    return (
      <span className={statusClasses[status] || 'status-badge'}>
        {status}
      </span>
    );
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading loop details...</span>
      </div>
    );
  }

  if (!loop) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loop Not Found</h2>
        <p className="text-gray-600 mb-4">
          The requested loop could not be found or you don't have permission to access it.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline btn-sm flex items-center gap-2"
            aria-label="Back"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <nav className="text-sm text-gray-600">
            <span>Dashboard</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Edit Loop #{id}</span>
          </nav>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Loop #{id}
              </h1>
              {getStatusBadge(loop.status)}
            </div>
            <p className="text-gray-600">
              {loop.property_address}
            </p>
            <p className="text-sm text-gray-500">
              Created {dateUtils.getRelativeTime(loop.created_at)} by {loop.creator_name}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleExportPDF}
              className="btn btn-secondary btn-sm flex items-center gap-1"
            >
              📄 Export PDF
            </button>

            {user?.role === 'admin' && (
              <>
                <button
                  onClick={handleArchive}
                  className="btn btn-secondary btn-sm flex items-center gap-1"
                >
                  📦 Archive
                </button>

                <button
                  onClick={handleDelete}
                  className="btn btn-danger btn-sm flex items-center gap-1"
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs - enhanced UI */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200 shadow-sm mb-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
          <nav className="flex flex-wrap gap-2">
            {[
              { key: 'documents', label: 'Documents', icon: '📄' },
              { key: 'tasks', label: 'Tasks', icon: '✅' },
              { key: 'people', label: 'People', icon: '👥' },
              { key: 'details', label: 'Details', icon: '📝' },
              { key: 'activity', label: 'Activity Log', icon: '📊' },
              { key: 'notifications', label: 'Notifications', icon: '🔔' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`settings-tab-horizontal group ${activeTab===tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab===tab.key ? 'page' : undefined}
              >
                <div className="settings-tab-horizontal-content">
                  <div className="settings-tab-horizontal-icon"><span>{tab.icon}</span></div>
                  <span className="settings-tab-horizontal-title">{tab.label}</span>
                </div>
                {activeTab===tab.key && <div className="settings-tab-horizontal-indicator"></div>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <LoopFiles loopId={id} user={user} addNotification={addNotification} />
          {user?.role === 'admin' && (
            <LoopDocuments loopId={id} addNotification={addNotification} />
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <LoopTasks loopId={id} addNotification={addNotification} />
      )}

      {activeTab === 'people' && (
        <LoopPeople loopId={id} participantsRaw={loop.participants} addNotification={addNotification} />
      )}

      {activeTab === 'details' && (
        <LoopDetails loopId={id} detailsRaw={loop.details} addNotification={addNotification} />
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Activity Log</h3>
          </div>
          <div className="card-body">
            {activity.length === 0 ? (
              <div className="text-gray-500">No recent activity</div>
            ) : (
              <div className="space-y-2">
                {activity.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{log.action_type.replaceAll('_',' ')}</div>
                      <div className="text-xs text-gray-500">{dateUtils.formatDateTime(log.created_at)} • {log.user_name || 'User'} ({log.user_email || ''})</div>
                      <div className="text-xs text-gray-600">{log.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card">
          <div className="card-header"><h3 className="text-lg font-semibold">Notifications</h3></div>
          <div className="card-body text-center text-gray-500">
            You don't have any notifications
          </div>
        </div>
      )}

      {/* Compliance Actions */}
      <div className="mt-8 card">
        <div className="card-header"><h3 className="text-lg font-semibold">Compliance Review</h3></div>
        <div className="card-body flex gap-2 items-center">
          <div className="text-sm">Status: <span className="font-medium capitalize">{loop.compliance_status || 'none'}</span></div>
          {loop.compliance_status === 'pending' && loop.compliance_requested_at && (
            <div className="text-xs text-gray-500">Requested {dateUtils.formatDateTime(loop.compliance_requested_at)}</div>
          )}
          <div className="ml-auto flex gap-2">
            {user?.role !== 'admin' && (
              <button className="btn btn-outline btn-sm" onClick={async ()=>{ try { await loopAPI.requestCompliance(id); addNotification('Compliance review requested','success'); fetchLoop(); } catch(e){ addNotification(apiUtils.getErrorMessage(e),'error'); } }}>Request Review</button>
            )}
            {user?.role === 'admin' && (
              <>
                <button className="btn btn-success btn-sm" onClick={async ()=>{ try { await loopAPI.approveCompliance(id); addNotification('Compliance approved','success'); fetchLoop(); } catch(e){ addNotification(apiUtils.getErrorMessage(e),'error'); } }}>Approve</button>
                <button className="btn btn-danger btn-sm" onClick={async ()=>{ try { await loopAPI.denyCompliance(id); addNotification('Compliance denied','success'); fetchLoop(); } catch(e){ addNotification(apiUtils.getErrorMessage(e),'error'); } }}>Deny</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLoop;
