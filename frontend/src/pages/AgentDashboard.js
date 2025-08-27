import React from 'react';
import Dashboard from '../components/Dashboard';
import LoopList from '../components/LoopList';

const AgentDashboard = ({ user, addNotification }) => {
  return (
    <div className="space-y-8">
      {/* Dashboard Overview */}
      <Dashboard 
        user={user} 
        addNotification={addNotification} 
        isAdmin={false} 
      />

      {/* Agent's Loops */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Transaction Loops</h2>
            <div className="text-sm text-gray-600">
              Your active and completed transactions
            </div>
          </div>
        </div>
        <div className="card-body">
          <LoopList 
            user={user} 
            addNotification={addNotification}
            filters={{ creator_id: user.id }}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
