import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoopForm from '../components/LoopForm';
import LoopDocuments from '../components/LoopDocuments';
import { loopAPI, apiUtils } from '../services/api';
import { dateUtils } from '../utils/dateUtils';

const EditLoop = ({ user, addNotification }) => {
  const [loop, setLoop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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

  const handleSubmit = async (formData) => {
    setLoading(true);

    try {
      const response = await loopAPI.updateLoop(id, formData);
      
      if (response.data.success) {
        addNotification('Transaction loop updated successfully!', 'success');
        
        // Redirect to appropriate dashboard
        const dashboardPath = user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent';
        navigate(dashboardPath);
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
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
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

      {/* Loop Info Card */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Transaction Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{loop.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sale Amount:</span>
                  <span className="font-medium">
                    {loop.sale ? `$${parseFloat(loop.sale).toLocaleString()}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">{dateUtils.formatDate(loop.start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium">{dateUtils.formatDate(loop.end_date)}</span>
                </div>
                {loop.end_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Left:</span>
                    <span className="font-medium text-blue-600">
                      {dateUtils.getCountdownText(loop.end_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Client Info</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{loop.client_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{loop.client_email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{loop.client_phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <LoopForm
        initialData={loop}
        onSubmit={handleSubmit}
        loading={loading}
        isEdit={true}
      />

      {/* Documents Section */}
      {user?.role === 'admin' && (
        <div className="mt-8">
          <LoopDocuments loopId={id} addNotification={addNotification} />
        </div>
      )}

      {/* Activity Log Placeholder */}
      <div className="mt-8 card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Activity Log</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Loop created</p>
                <p className="text-xs text-gray-500">
                  {dateUtils.formatDateTime(loop.created_at)} by {loop.creator_name}
                </p>
              </div>
            </div>
            
            {loop.updated_at !== loop.created_at && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Loop updated</p>
                  <p className="text-xs text-gray-500">
                    {dateUtils.formatDateTime(loop.updated_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLoop;
