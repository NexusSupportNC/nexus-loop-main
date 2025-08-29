import React, { useEffect, useState } from 'react';
import { loopAPI, apiUtils } from '../services/api';
import { dateUtils } from '../utils/dateUtils';

const LoopTasks = ({ loopId, addNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await loopAPI.listTasks(loopId);
      if (res.data.success) setTasks(res.data.tasks);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [loopId]);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    try {
      await loopAPI.addTask(loopId, { title: newTitle.trim(), due_date: newDue || null });
      setNewTitle('');
      setNewDue('');
      load();
      addNotification('Task added', 'success');
    } catch (e) {
      addNotification(apiUtils.getErrorMessage(e), 'error');
    }
  };

  const toggleComplete = async (task) => {
    try {
      await loopAPI.updateTask(loopId, task.id, { completed: task.completed ? 0 : 1 });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed ? 0 : 1 } : t));
    } catch (e) {
      addNotification(apiUtils.getErrorMessage(e), 'error');
    }
  };

  const removeTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await loopAPI.deleteTask(loopId, taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      addNotification(apiUtils.getErrorMessage(e), 'error');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Checklist</h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            placeholder="Task title (e.g., Inspection)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
          <button className="btn btn-primary" onClick={addTask}>Add Task</button>
        </div>

        {loading ? (
          <div className="flex items-center"><div className="spinner"></div><span className="ml-2">Loading tasks...</span></div>
        ) : tasks.length === 0 ? (
          <div className="text-gray-500">No tasks yet</div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => {
              const status = dateUtils.getDateStatus(task.due_date);
              const badge = status === 'overdue' ? 'due-badge-overdue' : status === 'due-soon' ? 'due-badge-soon' : '';
              return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={!!task.completed} onChange={() => toggleComplete(task)} />
                    <div>
                      <div className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {task.due_date ? (
                          <>
                            <span>Due: {dateUtils.formatDate(task.due_date)}</span>
                            <span className={`due-badge ${badge}`}>{dateUtils.getCountdownText(task.due_date)}</span>
                          </>
                        ) : (
                          <span>No due date</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => removeTask(task.id)}>Delete</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoopTasks;
