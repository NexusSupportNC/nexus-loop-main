import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loopAPI, apiUtils } from '../services/api';
import { dateUtils } from '../utils/dateUtils';
import ImageGallery from './ImageGallery';

const LoopList = ({ user, addNotification, filters = {} }) => {
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchLoops = async () => {
      try {
        setLoading(true);
        const params = {
          search: searchTerm || '',
          status: statusFilter || '',
          type: typeFilter || '',
          sort: sortBy || 'created_at',
          order: sortOrder || 'desc'
        };

        const response = await loopAPI.getLoops(params);

        if (response.data.success) {
          setLoops(response.data.loops);
        }
      } catch (error) {
        const errorMessage = apiUtils.getErrorMessage(error);
        addNotification(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLoops();
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder, addNotification]);

  const refreshLoops = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || '',
        status: statusFilter || '',
        type: typeFilter || '',
        sort: sortBy || 'created_at',
        order: sortOrder || 'desc'
      };

      const response = await loopAPI.getLoops(params);

      if (response.data.success) {
        setLoops(response.data.loops);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (loopId) => {
    if (!window.confirm('Are you sure you want to delete this loop? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await loopAPI.deleteLoop(loopId);
      
      if (response.data.success) {
        addNotification('Transaction loop deleted successfully', 'success');
        refreshLoops(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const handleArchive = async (loopId) => {
    if (!window.confirm('Are you sure you want to archive this loop?')) {
      return;
    }

    try {
      const response = await loopAPI.archiveLoop(loopId);
      
      if (response.data.success) {
        addNotification('Transaction loop archived successfully', 'success');
        refreshLoops(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    }
  };

  const handleExportPDF = async (loopId) => {
    try {
      const response = await loopAPI.exportPDF(loopId);
      apiUtils.downloadFile(response.data, `loop-${loopId}.pdf`);
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
      // Legacy status support
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

  const getCountdownInfo = (endDate, status) => {
    if (!endDate || status === 'closed' || status === 'cancelled') {
      return null;
    }

    const countdownText = dateUtils.getCountdownText(endDate);
    const dateStatus = dateUtils.getDateStatus(endDate);

    let textColor = 'text-gray-600';
    if (dateStatus === 'overdue') textColor = 'text-red-600';
    else if (dateStatus === 'due-today') textColor = 'text-orange-600';
    else if (dateStatus === 'due-soon') textColor = 'text-yellow-600';

    return (
      <div className={`text-sm ${textColor}`}>
        {countdownText}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner"></div>
        <span className="ml-2">Loading loops...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                placeholder="Search loops..."
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
                <option value="Listing for Sale">Listing for Sale</option>
                <option value="Listing for Lease">Listing for Lease</option>
                <option value="Purchase">Purchase</option>
                <option value="Lease">Lease</option>
                <option value="Real Estate Other">Real Estate Other</option>
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
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="end_date-asc">End Date (Earliest)</option>
                <option value="end_date-desc">End Date (Latest)</option>
                <option value="sale-desc">Sale Amount (High to Low)</option>
                <option value="sale-asc">Sale Amount (Low to High)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loops List */}
      {loops.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loops found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || typeFilter
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first transaction loop.'}
            </p>
            <Link to="/loops/new" className="btn btn-primary">
              Create New Loop
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container loop-table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Property Address</th>
                  <th>Client</th>
                  <th>Sale Amount</th>
                  <th>Status</th>
                  <th>End Date</th>
                  <th>Created by</th>
                  <th className="actions-header" style={{textAlign: 'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loops.map((loop) => (
                  <tr key={loop.id}>
                    <td className="font-medium">#{loop.id}</td>
                    <td>{loop.type}</td>
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
                      <div>
                        <div className="text-sm text-gray-900">
                          {dateUtils.formatDate(loop.end_date)}
                        </div>
                        {getCountdownInfo(loop.end_date, loop.status)}
                      </div>
                    </td>
                    <td className="creator-cell">{loop.creator_name}</td>
                    <td className="actions-cell">
                      <div className="flex space-x-2">
                        <Link
                          to={`/loops/edit/${loop.id}`}
                          className="btn btn-sm btn-outline flex items-center gap-1"
                        >
                          ✏️ Edit
                        </Link>

                        <button
                          onClick={() => handleExportPDF(loop.id)}
                          className="btn btn-sm btn-secondary flex items-center gap-1"
                          title="Export PDF"
                        >
                          📄 PDF
                        </button>

                        {user?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleArchive(loop.id)}
                              className="btn btn-sm btn-secondary flex items-center gap-1"
                              title="Archive Loop"
                            >
                              📦 Archive
                            </button>

                            <button
                              onClick={() => handleDelete(loop.id)}
                              className="btn btn-sm btn-danger flex items-center gap-1"
                              title="Delete Loop"
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
        Showing {loops.length} loop{loops.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default LoopList;
