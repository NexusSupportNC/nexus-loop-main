import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loopAPI, apiUtils } from '../services/api';
import { dateUtils } from '../utils/dateUtils';
import ImageGallery from './ImageGallery';

const ArchivedLoopList = ({ user, addNotification }) => {
  const [archivedLoops, setArchivedLoops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchArchivedLoops = async () => {
      try {
        setLoading(true);
        const params = {
          search: searchTerm || '',
          status: statusFilter || '',
          type: typeFilter || '',
          sort: sortBy || 'updated_at',
          order: sortOrder || 'desc',
          archived: true // Add this flag to get archived loops
        };

        const response = await loopAPI.getLoops(params);

        if (response.data.success) {
          setArchivedLoops(response.data.loops);
        }
      } catch (error) {
        const errorMessage = apiUtils.getErrorMessage(error);
        addNotification(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedLoops();
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder, addNotification]);

  const refreshArchivedLoops = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || '',
        status: statusFilter || '',
        type: typeFilter || '',
        sort: sortBy || 'updated_at',
        order: sortOrder || 'desc',
        archived: true
      };

      const response = await loopAPI.getLoops(params);

      if (response.data.success) {
        setArchivedLoops(response.data.loops);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (loopId) => {
    if (!window.confirm('Are you sure you want to restore this loop from archive?')) {
      return;
    }

    try {
      const response = await loopAPI.unarchiveLoop(loopId);
      
      if (response.data.success) {
        addNotification('Loop restored from archive successfully', 'success');
        refreshArchivedLoops(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const handleDelete = async (loopId) => {
    if (!window.confirm('Are you sure you want to permanently delete this archived loop? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await loopAPI.deleteLoop(loopId);
      
      if (response.data.success) {
        addNotification('Archived loop deleted permanently', 'success');
        refreshArchivedLoops(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const handleExportPDF = async (loopId) => {
    try {
      const response = await loopAPI.exportPDF(loopId);
      apiUtils.downloadFile(response.data, `archived-loop-${loopId}.pdf`);
      addNotification('PDF exported successfully', 'success');
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pre-offer': 'status-badge status-active',
      'under-contract': 'status-badge status-closing',
      'withdrawn': 'status-badge status-cancelled',
      'sold': 'status-badge status-closed',
      'terminated': 'status-badge status-cancelled',
      // Legacy statuses
      active: 'status-badge status-active',
      closing: 'status-badge status-closing',
      closed: 'status-badge status-closed',
      cancelled: 'status-badge status-cancelled'
    };

    return (
      <span className={statusClasses[status] || 'status-badge'}>
        {status?.replace('-', ' ') || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner"></div>
        <span className="ml-2">Loading archived loops...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Archived Loops
          </h1>
          <p className="text-gray-600">
            View and manage archived transaction loops
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to={user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent'} className="btn btn-outline">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search archived loops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pre-offer">Pre-offer</option>
                <option value="under-contract">Under Contract</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="sold">Sold</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="listing-for-sale">Listing for Sale</option>
                <option value="listing-for-lease">Listing for Lease</option>
                <option value="purchase">Purchase</option>
                <option value="lease">Lease</option>
                <option value="real-estate-other">Real Estate Other</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="updated_at-desc">Recently Archived</option>
                <option value="updated_at-asc">Oldest Archived</option>
                <option value="created_at-desc">Created (Newest)</option>
                <option value="created_at-asc">Created (Oldest)</option>
                <option value="end_date-asc">End Date (Earliest)</option>
                <option value="end_date-desc">End Date (Latest)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Archive Information Alert */}
      <div className="alert alert-info">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📦</span>
          <div>
            <strong>Archive Information:</strong> Archived loops are removed from active views but preserved for record keeping. You can restore them back to active status or permanently delete them.
          </div>
        </div>
      </div>

      {/* Archived Loops List */}
      {archivedLoops.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-6xl mb-4">�����</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No archived loops found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || typeFilter
                ? 'Try adjusting your filters to see more results.'
                : 'No loops have been archived yet.'}
            </p>
            <Link to={user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/agent'} className="btn btn-primary">
              Go to Active Loops
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Property Address</th>
                  <th>Client</th>
                  <th>Sale Amount</th>
                  <th>Status</th>
                  <th>Archived Date</th>
                  <th>Created by</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedLoops.map((loop) => (
                  <tr key={loop.id} className="bg-gray-50 opacity-80">
                    <td className="font-medium">#{loop.id}</td>
                    <td>{loop.type?.replace('-', ' ') || 'N/A'}</td>
                    <td className="max-w-xs" title={loop.property_address}>
                      <div className="truncate">{loop.property_address || 'N/A'}</div>
                      <ImageGallery images={loop.imageList || []} maxThumbnails={2} />
                    </td>
                    <td>{loop.client_name || 'N/A'}</td>
                    <td>
                      {loop.sale ? `$${parseFloat(loop.sale).toLocaleString()}` : 'N/A'}
                    </td>
                    <td>{getStatusBadge(loop.status)}</td>
                    <td>
                      <div className="text-sm text-gray-700">
                        {dateUtils.formatDate(loop.updated_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dateUtils.getRelativeTime(loop.updated_at)}
                      </div>
                    </td>
                    <td>{loop.creator_name}</td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleExportPDF(loop.id)}
                          className="btn btn-sm btn-outline flex items-center gap-1"
                          title="Export PDF"
                        >
                          📄 PDF
                        </button>

                        {user?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleUnarchive(loop.id)}
                              className="btn btn-sm btn-success flex items-center gap-1"
                              title="Restore from Archive"
                            >
                              📤 Restore
                            </button>

                            <button
                              onClick={() => handleDelete(loop.id)}
                              className="btn btn-sm btn-danger flex items-center gap-1"
                              title="Delete Permanently"
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-gray-600 text-center">
        Showing {archivedLoops.length} archived loop{archivedLoops.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ArchivedLoopList;
