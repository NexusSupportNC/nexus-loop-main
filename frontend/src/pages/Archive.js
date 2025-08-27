import React from 'react';
import ArchivedLoopList from '../components/ArchivedLoopList';

const Archive = ({ user, addNotification }) => {
  return (
    <div>
      <ArchivedLoopList user={user} addNotification={addNotification} />
    </div>
  );
};

export default Archive;
