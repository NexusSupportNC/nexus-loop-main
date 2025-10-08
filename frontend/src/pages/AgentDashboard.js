import React from 'react';
import Dashboard from '../components/Dashboard';

const AgentDashboard = ({ user, addNotification }) => {
  return (
    <div className="space-y-8">
      {/* Dashboard Overview */}
      <Dashboard
        user={user}
        addNotification={addNotification}
        isAdmin={false}
      />
    </div>
  );
};

export default AgentDashboard;
