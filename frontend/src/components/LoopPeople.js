import React, { useEffect, useState } from 'react';
import { peopleAPI, apiUtils, loopAPI } from '../services/api';

const LoopPeople = ({ loopId, participantsRaw, addNotification }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await peopleAPI.getUsers();
        if (res.data.success) setAllUsers(res.data.users || []);
      } catch (e) { /* ignore */ }
    };
    load();
  }, []);

  useEffect(() => {
    try {
      if (Array.isArray(participantsRaw)) setParticipants(participantsRaw);
      else if (typeof participantsRaw === 'string' && participantsRaw.trim()) setParticipants(JSON.parse(participantsRaw));
      else setParticipants([]);
    } catch { setParticipants([]); }
  }, [participantsRaw]);

  const addParticipant = async () => {
    if (!selected) return;
    const user = allUsers.find(u => String(u.id) === String(selected));
    if (!user) return;
    const next = [...participants.filter(p => p.id !== user.id), { id: user.id, name: user.name, email: user.email }];
    try {
      await loopAPI.updateLoop(loopId, { participants: JSON.stringify(next) });
      setParticipants(next);
      setSelected('');
      addNotification('Participant added', 'success');
    } catch (e) {
      addNotification(apiUtils.getErrorMessage(e), 'error');
    }
  };

  const removeParticipant = async (id) => {
    const next = participants.filter(p => p.id !== id);
    try {
      await loopAPI.updateLoop(loopId, { participants: JSON.stringify(next) });
      setParticipants(next);
      addNotification('Participant removed', 'success');
    } catch (e) {
      addNotification(apiUtils.getErrorMessage(e), 'error');
    }
  };

  return (
    <div className="card">
      <div className="card-header"><h3 className="text-lg font-semibold">People</h3></div>
      <div className="card-body space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-700 mb-1">Add person</label>
            <select className="w-full" value={selected} onChange={(e)=>setSelected(e.target.value)}>
              <option value="">Select a user...</option>
              {allUsers.map(u => (<option key={u.id} value={u.id}>{u.name} ({u.email})</option>))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={addParticipant}>Add</button>
        </div>

        {participants.length === 0 ? (
          <div className="text-gray-500">No participants yet</div>
        ) : (
          <div className="space-y-2">
            {participants.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.email}</div>
                </div>
                <button className="btn btn-sm btn-outline" onClick={()=>removeParticipant(p.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoopPeople;
