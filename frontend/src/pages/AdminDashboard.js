import React from 'react';
import Dashboard from '../components/Dashboard';

const AdminDashboard = ({ user, addNotification }) => {
  return (
    <div className="space-y-8">
      <Dashboard
        user={user}
        addNotification={addNotification}
        isAdmin={true}
      />
    </div>
  );
};

export default AdminDashboard;
