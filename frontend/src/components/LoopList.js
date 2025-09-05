import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { loopAPI, apiUtils } from '../services/api';
import { dateUtils } from '../utils/dateUtils';
import ImageGallery from './ImageGallery';
import { uiStatusOptions, uiStatusToApi } from '../constants/loopStatus';

const LoopList = ({ user, addNotification, filters = {} }) => {
  const [loops, setLoops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toolbar state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // stores UI key
  const [typeFilter, setTypeFilter] = useState('');
  const [closingThisMonth, setClosingThisMonth] = useState(false);

  // View and sort state
  const [viewMode, setViewMode] = useState('grid'); // list | grid | compact
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Archived filter: hide (default), only, all
  const [archivedMode, setArchivedMode] = useState('hide');

  // Additional review/compliance filters (client-side)
  const [reviewFilters, setReviewFilters] = useState({
    reviewStage: '',
    listingContract: [],
    buyingContract: []
  });

  // UI state for collapsible sections
  const [showListingReview, setShowListingReview] = useState(false);
  const [showBuyingReview, setShowBuyingReview] = useState(false);

  // Fields that API supports for sorting
  const apiSortableFields = new Set(['created_at', 'updated_at', 'end_date', 'sale', 'status', 'type']);

  const appliedStatusApi = uiStatusToApi[statusFilter] ?? '';
  const appliedTypeApi = (typeFilter === 'No Transaction Type') ? '' : typeFilter;

  const fetchLoops = async () => {
    try {
      setLoading(true);

      // Determine API params
      const baseParams = {
        search: searchTerm || '',
        status: appliedStatusApi || '',
        type: appliedTypeApi || '',
        sort: apiSortableFields.has(sortBy) ? sortBy : 'created_at',
        order: apiSortableFields.has(sortBy) ? (sortOrder || 'desc') : 'desc',
        end_month: closingThisMonth ? 'current' : undefined
      };

      let results = [];

      if (archivedMode === 'all') {
        const [activeRes, archivedRes] = await Promise.all([
          loopAPI.getLoops({ ...baseParams, archived: 'false' }),
          loopAPI.getLoops({ ...baseParams, archived: 'true' })
        ]);
        if (activeRes.data.success) results = results.concat(activeRes.data.loops);
        if (archivedRes.data.success) results = results.concat(archivedRes.data.loops);
        const map = new Map();
        for (const l of results) map.set(l.id, l);
        results = Array.from(map.values());
      } else {
        const res = await loopAPI.getLoops({ ...baseParams, archived: archivedMode === 'only' ? 'true' : 'false' });
        if (res.data.success) results = res.data.loops;
      }

      // Client-side extra sorting when needed
      if (!apiSortableFields.has(sortBy)) {
        results.sort((a, b) => {
          const dir = sortOrder === 'asc' ? 1 : -1;
          const get = (obj, key) => {
            switch (key) {
              case 'start_date': return obj.start_date || '';
              case 'compliance_requested_at': return obj.compliance_requested_at || '';
              case 'creator_name': return (obj.creator_name || '').toLowerCase();
              default: return obj[key];
            }
          };
          const av = get(a, sortBy);
          const bv = get(b, sortBy);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (!isNaN(Date.parse(av)) && !isNaN(Date.parse(bv))) {
            return (new Date(av) - new Date(bv)) * dir;
          }
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
          return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
        });
      }

      // Client-side compliance/review filters
      const filtered = results.filter((loop) => {
        if (reviewFilters.reviewStage === 'unsubmitted') {
          if (loop.compliance_status && loop.compliance_status !== 'none') return false;
        }
        const lc = new Set(reviewFilters.listingContract);
        const bc = new Set(reviewFilters.buyingContract);
        const byCompliance = (tagSet) => {
          if (tagSet.has('need_review')) return loop.compliance_status === 'pending';
          if (tagSet.has('approved_for_commission') || tagSet.has('listing_approved')) return loop.compliance_status === 'approved';
          if (tagSet.has('returned_to_agent') || tagSet.has('terminated')) return loop.compliance_status === 'denied' || loop.status === 'terminated';
          if (tagSet.has('closed')) return loop.status === 'closed';
          if (tagSet.has('listing_documents') || tagSet.has('contract_documents')) return true;
          return true;
        };
        if (reviewFilters.listingContract.length > 0 && !byCompliance(lc)) return false;
        if (reviewFilters.buyingContract.length > 0 && !byCompliance(bc)) return false;
        return true;
      });

      setLoops(filtered);
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoops();
  }, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder, closingThisMonth, archivedMode, reviewFilters]);

  const refreshLoops = async () => {
    await fetchLoops();
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

  const toTitle = (txt) => {
    if (!txt) return 'Unknown';
    return txt.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
        {toTitle(status)}
      </span>
    );
  };

  const getDueBadge = (endDate, status) => {
    if (!endDate || status === 'closed' || status === 'cancelled') return null;
    const days = dateUtils.getDaysUntil(endDate);
    if (days === null) return null;

    if (days < 0) {
      const d = Math.abs(days);
      return (
        <span className="due-badge due-badge-overdue">OVERDUE: {d} {d === 1 ? 'DAY' : 'DAYS'}</span>
      );
    }
    if (days === 0) {
      return (
        <span className="due-badge due-badge-today">DUE TODAY</span>
      );
    }
    if (days <= 3) {
      return (
        <span className="due-badge due-badge-soon">CLOSING SOON: {days} {days === 1 ? 'DAY' : 'DAYS'} LEFT</span>
      );
    }
    return null;
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

  const renderToolbar = () => (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-[220px]">
        <label htmlFor="ll-search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
        <input id="ll-search" type="text" placeholder="Search loops..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
      </div>

      <div className="min-w-[180px]">
        <label htmlFor="ll-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select id="ll-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">All Statuses</option>
          {uiStatusOptions.filter(o=>o.key).map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
          <option value="active">Active</option>
          <option value="closing">Closing</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="min-w-[200px]">
        <label htmlFor="ll-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select id="ll-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">All Types</option>
          <option value="No Transaction Type">No Transaction Type</option>
          <option value="Listing for Sale">Listing for Sale</option>
          <option value="Listing for Lease">Listing for Lease</option>
          <option value="Purchase">Purchase</option>
          <option value="Lease">Lease</option>
          <option value="Real Estate Other">Real Estate Other</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="min-w-[220px]">
        <label htmlFor="ll-sort" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
        <select id="ll-sort" value={`${sortBy}-${sortOrder}`} onChange={(e) => { const [field, order] = e.target.value.split('-'); setSortBy(field); setSortOrder(order); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="created_at-desc">Creation date (newest)</option>
          <option value="created_at-asc">Creation date (oldest)</option>
          <option value="updated_at-desc">Last updated (newest)</option>
          <option value="updated_at-asc">Last updated (oldest)</option>
          <option value="sale-desc">Transaction price (high to low)</option>
          <option value="sale-asc">Transaction price (low to high)</option>
          <option value="start_date-asc">Listed date (earliest)</option>
          <option value="start_date-desc">Listed date (latest)</option>
          <option value="end_date-asc">Exp./Closing date (earliest)</option>
          <option value="end_date-desc">Exp./Closing date (latest)</option>
          <option value="compliance_requested_at-desc">Submitted for review (newest)</option>
          <option value="compliance_requested_at-asc">Submitted for review (oldest)</option>
          <option value="creator_name-asc">Agent Name (A–Z)</option>
          <option value="creator_name-desc">Agent Name (Z–A)</option>
        </select>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <input id="closing_month" type="checkbox" className="h-4 w-4" checked={closingThisMonth} onChange={(e)=>setClosingThisMonth(e.target.checked)} />
        <label htmlFor="closing_month" className="text-sm">Closing this month</label>
      </div>

      <div className="ml-auto flex items-center gap-2 mt-6">
        <button onClick={() => setViewMode('list')} className={`btn btn-sm ${viewMode==='list' ? 'btn-primary' : 'btn-outline'}`}>List</button>
        <button onClick={() => setViewMode('grid')} className={`btn btn-sm ${viewMode==='grid' ? 'btn-primary' : 'btn-outline'}`}>Grid</button>
        <button onClick={() => setViewMode('compact')} className={`btn btn-sm ${viewMode==='compact' ? 'btn-primary' : 'btn-outline'}`}>Compact</button>
      </div>

      {Boolean(
        searchTerm ||
        statusFilter ||
        typeFilter ||
        closingThisMonth ||
        archivedMode !== 'hide' ||
        reviewFilters.reviewStage ||
        reviewFilters.listingContract.length > 0 ||
        reviewFilters.buyingContract.length > 0
      ) && (
        <div className="w-full mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Active filters:</span>
          {searchTerm && (
            <button className="filter-chip" onClick={()=>setSearchTerm('')}>Search: {searchTerm}<span className="filter-chip-close">×</span></button>
          )}
          {statusFilter && (
            <button className="filter-chip" onClick={()=>setStatusFilter('')}>Status: {uiStatusOptions.find(o=>o.key===statusFilter)?.label || statusFilter}<span className="filter-chip-close">×</span></button>
          )}
          {typeFilter && (
            <button className="filter-chip" onClick={()=>setTypeFilter('')}>Type: {typeFilter}<span className="filter-chip-close">×</span></button>
          )}
          {closingThisMonth && (
            <button className="filter-chip" onClick={()=>setClosingThisMonth(false)}>Closing this month<span className="filter-chip-close">×</span></button>
          )}
          {archivedMode!=='hide' && (
            <button className="filter-chip" onClick={()=>setArchivedMode('hide')}>Archived: {archivedMode}<span className="filter-chip-close">×</span></button>
          )}
          {reviewFilters.reviewStage==='unsubmitted' && (
            <button className="filter-chip" onClick={()=>setReviewFilters(prev=>({...prev, reviewStage: ''}))}>Review: Unsubmitted<span className="filter-chip-close">×</span></button>
          )}
          {reviewFilters.listingContract.length>0 && (
            <button className="filter-chip" onClick={()=>setReviewFilters(prev=>({...prev, listingContract: []}))}>Listing/Contract: {reviewFilters.listingContract.length} selected<span className="filter-chip-close">×</span></button>
          )}
          {reviewFilters.buyingContract.length>0 && (
            <button className="filter-chip" onClick={()=>setReviewFilters(prev=>({...prev, buyingContract: []}))}>Buying/Contract: {reviewFilters.buyingContract.length} selected<span className="filter-chip-close">×</span></button>
          )}
          <button className="btn btn-sm btn-outline ml-auto" onClick={()=>{setSearchTerm('');setStatusFilter('');setTypeFilter('');setClosingThisMonth(false);setArchivedMode('hide');setReviewFilters({reviewStage:'',listingContract:[],buyingContract:[]});}}>Clear all</button>
        </div>
      )}
    </div>
  );

  const renderListTable = () => (
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
            <th className="actions-header text-center">Actions</th>
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
                <div className="end-date-row">
                  <span className="text-sm text-gray-900">{dateUtils.formatDate(loop.end_date)}</span>
                  {getDueBadge(loop.end_date, loop.status)}
                </div>
              </td>
              <td className="creator-cell">{loop.creator_name}</td>
              <td className="actions-cell">
                <div className="flex space-x-2">
                  <Link to={`/loops/edit/${loop.id}`} className="btn btn-sm btn-outline flex items-center gap-1">✏️ Edit</Link>
                  <button onClick={() => handleExportPDF(loop.id)} className="btn btn-sm btn-secondary flex items-center gap-1" title="Export PDF">📄 PDF</button>
                  {user?.role === 'admin' && (
                    <>
                      <button onClick={() => handleArchive(loop.id)} className="btn btn-sm btn-secondary flex items-center gap-1" title="Archive Loop">📦 Archive</button>
                      <button onClick={() => handleDelete(loop.id)} className="btn btn-sm btn-danger flex items-center gap-1" title="Delete Loop">🗑️ Delete</button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGridCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {loops.map((loop) => {
        const cover = (loop.imageList && loop.imageList.length > 0) ? `/api/loops/images/${loop.imageList[0].filename}` : null;
        const isNew = (() => { try { const d = new Date(loop.created_at); return (Date.now() - d.getTime()) < 7*24*60*60*1000; } catch { return false; } })();
        const showBell = loop.compliance_status === 'pending';
        return (
          <div key={loop.id} className="loop-card card">
            {cover && (
              <div className="loop-card-cover">
                <img src={cover} alt="Property" />
                {isNew && <span className="loop-badge">New</span>}
              </div>
            )}
            <div className="card-body loop-card-body">
              <div className="loop-card-title-row">
                <h4 className="loop-card-title" title={loop.property_address}>{loop.property_address || 'N/A'}</h4>
                {showBell && <span className="loop-card-bell" title="Requires attention">🔔</span>}
              </div>
              <div className="loop-meta">
                <div className="loop-meta-row"><span className="loop-meta-label">Type:</span><span className="loop-meta-value">{loop.type || 'N/A'}</span></div>
                <div className="loop-meta-row"><span className="loop-meta-label">Status:</span><span className="loop-meta-value">{toTitle(loop.status || 'none')}</span></div>
                <div className="loop-meta-row"><span className="loop-meta-label">Sale:</span><span className="loop-meta-value">{loop.sale ? `$${parseFloat(loop.sale).toLocaleString()}` : 'N/A'}</span></div>
                <div className="loop-meta-row"><span className="loop-meta-label">Client:</span><span className="loop-meta-value">{loop.client_name || 'N/A'}</span></div>
                <div className="loop-meta-row"><span className="loop-meta-label">End:</span><span className="loop-meta-value">{dateUtils.formatDate(loop.end_date)}</span> {getDueBadge(loop.end_date, loop.status)}</div>
                <div className="loop-meta-row"><span className="loop-meta-label">Creator:</span><span className="loop-meta-value">{loop.creator_name || 'N/A'}</span></div>
                <div className="loop-meta-row"><span className="loop-meta-label">Created:</span><span className="loop-meta-value">{dateUtils.formatDateTime(loop.created_at)}</span></div>
              </div>
              <div className="loop-actions">
                <Link to={`/loops/edit/${loop.id}`} className="btn btn-sm btn-outline">✏️ Edit</Link>
                {user?.role === 'admin' && (
                  <>
                    <button onClick={() => handleArchive(loop.id)} className="btn btn-sm btn-secondary">📦 Archive</button>
                    <button onClick={() => handleDelete(loop.id)} className="btn btn-sm btn-danger">🗑️ Delete</button>
                  </>
                )}
                <button onClick={() => handleExportPDF(loop.id)} className="btn btn-sm btn-secondary">📄 PDF</button>
              </div>
              <Link to={`/loops/edit/${loop.id}`} className="loop-fab" title="Enter Closing">
                <span>Enter
                  Closing</span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCompactTable = () => (
    <div className="table-container loop-table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Address</th>
            <th>Status</th>
            <th>End</th>
            <th className="actions-header text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loops.map((loop) => (
            <tr key={loop.id}>
              <td className="font-medium">#{loop.id}</td>
              <td className="max-w-xs" title={loop.property_address}><div className="truncate">{loop.property_address || 'N/A'}</div></td>
              <td>{getStatusBadge(loop.status)}</td>
              <td>{dateUtils.formatDate(loop.end_date)}</td>
              <td className="actions-cell">
                <div className="flex space-x-2 justify-center">
                  <Link to={`/loops/edit/${loop.id}`} className="btn btn-sm btn-outline">✏️</Link>
                  <button onClick={() => handleExportPDF(loop.id)} className="btn btn-sm btn-secondary">📄</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <aside className="card lg:col-span-1 filters-sticky filters-compact">
          <div className="card-header"><h3 className="text-lg font-semibold">Filters</h3></div>
          <div className="card-body space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Refine your results</span>
              <button className="btn btn-sm btn-outline" onClick={()=>{setSearchTerm('');setStatusFilter('');setTypeFilter('');setClosingThisMonth(false);setArchivedMode('hide');setReviewFilters({reviewStage:'',listingContract:[],buyingContract:[]});}}>Clear all</button>
            </div>

            {/* Archived */}
            <div className="filter-section">
              <div className="filter-section-title">Archived</div>
              <div className="segmented-control">
                <button type="button" className={`segmented-option ${archivedMode==='hide' ? 'active' : ''}`} onClick={()=>setArchivedMode('hide')}>Hide</button>
                <button type="button" className={`segmented-option ${archivedMode==='only' ? 'active' : ''}`} onClick={()=>setArchivedMode('only')}>Only</button>
                <button type="button" className={`segmented-option ${archivedMode==='all' ? 'active' : ''}`} onClick={()=>setArchivedMode('all')}>All</button>
              </div>
            </div>

            {/* Loop Type */}
            <div className="filter-section">
              <div className="filter-section-title">Loop Type</div>
              <div className="filter-pills-grid">
                {['No Transaction Type','Listing for Sale','Listing for Lease','Purchase','Lease','Real Estate Other','Other'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`filter-pill ${typeFilter===t ? 'active' : ''}`}
                    onClick={()=> setTypeFilter(prev => prev===t ? '' : t)}
                  >{t}</button>
                ))}
              </div>
              <button className="filter-clear" onClick={()=>setTypeFilter('')}>Clear</button>
            </div>

            {/* Loop Status */}
            <div className="filter-section">
              <div className="filter-section-title">Loop Status</div>
              <div className="filter-pills-grid">
                {uiStatusOptions.map((opt) => (
                  <button
                    key={opt.key || 'none'}
                    type="button"
                    className={`filter-pill ${statusFilter===opt.key ? 'active' : ''}`}
                    onClick={()=> setStatusFilter(prev => prev===opt.key ? '' : opt.key)}
                  >{opt.label}</button>
                ))}
              </div>
              <button className="filter-clear" onClick={()=>setStatusFilter('')}>Clear</button>
            </div>

            {/* Review Stage */}
            <div className="filter-section">
              <div className="filter-section-title">Review Stage</div>
              <label className="filter-check-row">
                <input type="checkbox" className="control-xs" checked={reviewFilters.reviewStage==='unsubmitted'} onChange={(e)=>setReviewFilters(prev=>({...prev, reviewStage: e.target.checked ? 'unsubmitted' : ''}))} />
                <span>Unsubmitted</span>
              </label>
            </div>

            {/* Listing/Contract Review */}
            <div className="accordion-section">
              <button type="button" className="accordion-header" onClick={()=>setShowListingReview(v=>!v)}>
                <span>LISTING/CONTRACT REVIEW</span>
                <span className={`accordion-chevron ${showListingReview ? 'open' : ''}`}>▾</span>
              </button>
              {showListingReview && (
                <div className="accordion-content">
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      ['returned_to_agent','Returned to agent'],
                      ['listing_documents','Listing Documents'],
                      ['need_review','Need Review'],
                      ['closed','Closed'],
                      ['approved_for_commission','Approved for Commission'],
                      ['listing_approved','Listing Approved'],
                      ['terminated','Terminated']
                    ].map(([key, label]) => (
                      <label key={key} className="filter-check-row">
                        <input type="checkbox" className="control-xs" checked={reviewFilters.listingContract.includes(key)} onChange={(e)=>setReviewFilters(prev=>({
                          ...prev,
                          listingContract: e.target.checked ? [...prev.listingContract, key] : prev.listingContract.filter(k=>k!==key)
                        }))} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Buying/Contract Review */}
            <div className="accordion-section">
              <button type="button" className="accordion-header" onClick={()=>setShowBuyingReview(v=>!v)}>
                <span>Buying/Contract Review</span>
                <span className={`accordion-chevron ${showBuyingReview ? 'open' : ''}`}>▾</span>
              </button>
              {showBuyingReview && (
                <div className="accordion-content">
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      ['returned_to_agent','Returned to Agent'],
                      ['contract_documents','Contract Documents'],
                      ['need_review','Need Review'],
                      ['closed','Closed'],
                      ['approved_for_commission','Approved for Commission'],
                      ['listing_approved','Listing Approved'],
                      ['terminated','Terminated']
                    ].map(([key, label]) => (
                      <label key={key} className="filter-check-row">
                        <input type="checkbox" className="control-xs" checked={reviewFilters.buyingContract.includes(key)} onChange={(e)=>setReviewFilters(prev=>({
                          ...prev,
                          buyingContract: e.target.checked ? [...prev.buyingContract, key] : prev.buyingContract.filter(k=>k!==key)
                        }))} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-3 space-y-4">
          <div className="card">
            <div className="card-body">
              {renderToolbar()}
            </div>
          </div>

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
                <Link to="/loops/new" className="btn btn-primary">Create New Loop</Link>
              </div>
            </div>
          ) : (
            <div className="card">
              {viewMode === 'list' && renderListTable()}
              {viewMode === 'grid' && (
                <div className="card-body">{renderGridCards()}</div>
              )}
              {viewMode === 'compact' && renderCompactTable()}
            </div>
          )}

          <div className="text-sm text-gray-600 text-center">
            Showing {loops.length} loop{loops.length !== 1 ? 's' : ''}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoopList;
