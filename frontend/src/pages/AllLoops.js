import React from 'react';
import LoopList from '../components/LoopList';

const AllLoops = ({ user, addNotification }) => {
  const isAdmin = user?.role === 'admin';
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">All Transaction Loops</h1>
            <div className="text-sm text-gray-600">{isAdmin ? 'Admin View - All loops from all agents' : 'Agent View - Your transaction loops'}</div>
          </div>
        </div>
        <div className="card-body">
          <LoopList user={user} addNotification={addNotification} filters={isAdmin ? {} : { creator_id: user.id }} />
        </div>
      </div>
    </div>
  );
};

export default AllLoops;
