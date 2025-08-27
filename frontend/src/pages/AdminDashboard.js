import React from 'react';
import Dashboard from '../components/Dashboard';
import LoopList from '../components/LoopList';

const AdminDashboard = ({ user, addNotification }) => {
  return (
    <div className="space-y-8">
      {/* Dashboard Overview */}
      <Dashboard 
        user={user} 
        addNotification={addNotification} 
        isAdmin={true} 
      />

      {/* All Loops Management */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Transaction Loops</h2>
            <div className="text-sm text-gray-600">
              Admin View - All loops from all agents
            </div>
          </div>
        </div>
        <div className="card-body">
          <LoopList 
            user={user} 
            addNotification={addNotification}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
