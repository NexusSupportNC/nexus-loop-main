import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { loopAPI, apiUtils } from '../services/api';
import { dateUtils } from '../utils/dateUtils';


const Dashboard = ({ user, addNotification, isAdmin = false }) => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closing: 0,
    closed: 0,
    total_sales: 0,
    closing_soon: 0
  });
  const [closingLoops, setClosingLoops] = useState([]);
  const [recentLoops, setRecentLoops] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsResponse = await loopAPI.getStats();
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch closing loops
      const closingResponse = await loopAPI.getClosingLoops();
      if (closingResponse.data.success) {
        setClosingLoops(closingResponse.data.loops);
      }

      // Fetch recent loops
      const recentResponse = await loopAPI.getLoops({ limit: 5 });
      if (recentResponse.data.success) {
        setRecentLoops(recentResponse.data.loops);
      }

    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleExportCSV = async () => {
    try {
      const response = await loopAPI.exportCSV();
      apiUtils.downloadFile(response.data, 'loops-export.csv');
      addNotification('All transaction loops exported to CSV successfully', 'success');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container space-y-6" style={{marginTop: 0, paddingTop: 0}}>
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dashboard-title">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 dashboard-subtitle">
            {isAdmin ? 'Admin Dashboard' : 'Agent Dashboard'} -
            Take a look at these recent reports.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to="/loops/new" className="btn btn-primary">
            New Loop
          </Link>
          {isAdmin && (
            <button onClick={handleExportCSV} className="btn btn-secondary">
              Export All
            </button>
          )}
        </div>
      </div>



      {/* Closing Soon Alert */}
      {closingLoops.length > 0 && (
        <div className="alert alert-warning">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <div>
              <strong>Attention:</strong> You have {closingLoops.length} loop{closingLoops.length !== 1 ? 's' : ''} closing within the next 3 days.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closing Soon */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Loops Closing Soon</h3>
          </div>
          <div className="card-body">
            {closingLoops.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-600">No loops closing in the next 3 days</p>
              </div>
            ) : (
              <div className="space-y-4">
                {closingLoops.slice(0, 5).map((loop) => (
                  <div key={loop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">#{loop.id}</span>
                        {getStatusBadge(loop.status)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {loop.property_address}
                      </p>
                      <p className="text-xs text-gray-500">
                        Client: {loop.client_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        {dateUtils.getCountdownText(loop.end_date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dateUtils.formatDate(loop.end_date)}
                      </p>
                    </div>
                  </div>
                ))}
                {closingLoops.length > 5 && (
                  <div className="text-center">
                    <Link to={isAdmin ? "/dashboard/admin" : "/dashboard/agent"} className="btn btn-sm btn-outline">
                      View all {closingLoops.length} closing loops
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Recent Loops</h3>
          </div>
          <div className="card-body">
            {recentLoops.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-600 mb-4">No loops yet</p>
                <Link to="/loops/new" className="btn btn-primary btn-sm">
                  Create Your First Loop
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLoops.map((loop) => (
                  <div key={loop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">#{loop.id}</span>
                        {getStatusBadge(loop.status)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {loop.property_address}
                      </p>
                      <p className="text-xs text-gray-500">
                        {loop.type} • {loop.client_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {loop.sale ? `$${parseFloat(loop.sale).toLocaleString()}` : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dateUtils.getRelativeTime(loop.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="text-center">
                  <Link to={isAdmin ? "/dashboard/admin" : "/dashboard/agent"} className="btn btn-sm btn-outline">
                    View all loops
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Performance Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Performance Overview</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-3xl mr-4">📈</div>
              <div>
                <h4 className="font-semibold text-purple-900">Completed This Month</h4>
                <p className="text-2xl font-bold text-purple-600 dashboard-stat">
                  {stats.closed}
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
              <div className="text-3xl mr-4">🎯</div>
              <div>
                <h4 className="font-semibold text-amber-900">Success Rate</h4>
                <p className="text-2xl font-bold text-amber-600 dashboard-stat">
                  {stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
              <div className="text-3xl mr-4">⚡</div>
              <div>
                <h4 className="font-semibold text-emerald-900">Active Deals</h4>
                <p className="text-2xl font-bold text-emerald-600 dashboard-stat">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loop Statistics Overview Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center text-slate-800">
            <div className="bg-blue-100 p-3 rounded-xl mr-4">
              <span className="text-xl">📊</span>
            </div>
            Loop Statistics Overview
          </h2>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full border shadow-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <p className="text-gray-600 mt-2 ml-16">Track your loop performance and key metrics at a glance</p>
      </div>

      {/* Individual Statistics Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Loops Tile */}
        <div className="card group cursor-pointer hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="card-body relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-2 border-blue-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-300 rounded-full opacity-20 -mr-10 -mt-10"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-200 rounded-full mb-4 group-hover:bg-blue-300 transition-colors duration-300">
                <span className="text-2xl">📋</span>
              </div>
              <div className="text-4xl font-black text-blue-700 group-hover:text-blue-800 transition-colors duration-300" style={{margin: '-5px 0 16px'}}>
                {stats.total}
              </div>
              <div className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-1">Total Loops</div>
              <div className="text-xs text-blue-600 font-medium">All time count</div>
            </div>
          </div>
        </div>

        {/* Active Loops Tile */}
        <div className="card group cursor-pointer hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="card-body relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-green-200 border-2 border-green-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-300 rounded-full opacity-20 -mr-10 -mt-10"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-200 rounded-full mb-4 group-hover:bg-green-300 transition-colors duration-300">
                <span className="text-2xl">🟢</span>
              </div>
              <div className="text-4xl font-black text-green-700 group-hover:text-green-800 transition-colors duration-300" style={{margin: '-5px 0 16px'}}>
                {stats.active}
              </div>
              <div className="text-sm font-bold text-green-800 uppercase tracking-wider mb-1">Active</div>
              <div className="text-xs text-green-600 font-medium">Currently open</div>
            </div>
          </div>
        </div>

        {/* Closing Soon Tile */}
        <div className="card group cursor-pointer hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="card-body relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-2 border-amber-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-300 rounded-full opacity-20 -mr-10 -mt-10"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-200 rounded-full mb-4 group-hover:bg-amber-300 transition-colors duration-300">
                <span className="text-2xl" style={{paddingTop: '1px'}}>⏰</span>
              </div>
              <div className="text-4xl font-black text-amber-700 mb-2 group-hover:text-amber-800 transition-colors duration-300">
                {stats.closing_soon}
              </div>
              <div className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-1">Closing Soon</div>
              <div className="text-xs text-amber-600 font-medium">Requires attention</div>
            </div>
          </div>
        </div>

        {/* Total Sales Tile */}
        <div className="card group cursor-pointer hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="card-body relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 border-2 border-purple-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-300 rounded-full opacity-20 -mr-10 -mt-10"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-200 rounded-full mb-4 group-hover:bg-purple-300 transition-colors duration-300">
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-3xl font-black text-purple-700 mb-2 group-hover:text-purple-800 transition-colors duration-300">
                ${stats.total_sales ? parseFloat(stats.total_sales).toLocaleString() : '0'}
              </div>
              <div className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-1">Total Sales</div>
              <div className="text-xs text-purple-600 font-medium">Revenue generated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Success Rate Tile */}
        <div className="card group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="card-body bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">Success Rate</div>
                <div className="text-3xl font-black text-slate-800 group-hover:text-slate-900 transition-colors">
                  {stats.total > 0 ? Math.round(((stats.total - stats.active - stats.closing_soon) / stats.total) * 100) : 0}%
                </div>
                <div className="text-xs text-slate-500 mt-1">Completion ratio</div>
              </div>
              <div className="bg-slate-200 p-3 rounded-xl group-hover:bg-slate-300 transition-colors">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Average Sale Value Tile */}
        <div className="card group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="card-body bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-emerald-600 mb-1">Avg. Sale Value</div>
                <div className="text-3xl font-black text-emerald-800 group-hover:text-emerald-900 transition-colors">
                  ${stats.total > 0 && stats.total_sales ? Math.round(parseFloat(stats.total_sales) / stats.total).toLocaleString() : '0'}
                </div>
                <div className="text-xs text-emerald-500 mt-1">Per transaction</div>
              </div>
              <div className="bg-emerald-200 p-3 rounded-xl group-hover:bg-emerald-300 transition-colors">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Ratio Tile */}
        <div className="card group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="card-body bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-rose-600 mb-1">Active Ratio</div>
                <div className="text-3xl font-black text-rose-800 group-hover:text-rose-900 transition-colors">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                </div>
                <div className="text-xs text-rose-500 mt-1">Currently active</div>
              </div>
              <div className="bg-rose-200 p-3 rounded-xl group-hover:bg-rose-300 transition-colors">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Templates Quick Access - Admin Only */}
      {isAdmin && (
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Document Templates</h3>
              <div className="flex space-x-2">
                <Link to="/settings" className="btn btn-sm btn-primary">
                  📤 Import Templates
                </Link>
                <Link to="/settings" className="btn btn-sm btn-outline">
                  📋 Saved Templates
                </Link>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-purple-900 mb-2">Document Automation</h4>
                  <p className="text-sm text-purple-700">
                    Upload templates and generate contracts, listings, and disclosures with loop data
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-white/50 rounded-lg p-3 text-center">
                  <div className="text-lg mb-1">📋</div>
                  <div className="text-xs text-purple-800 font-medium">Upload Templates</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 text-center">
                  <div className="text-lg mb-1">🔗</div>
                  <div className="text-xs text-purple-800 font-medium">Map Fields</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 text-center">
                  <div className="text-lg mb-1">📝</div>
                  <div className="text-xs text-purple-800 font-medium">Generate Docs</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 text-center">
                  <div className="text-lg mb-1">💾</div>
                  <div className="text-xs text-purple-800 font-medium">Save & Reuse</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
