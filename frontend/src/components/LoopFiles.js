import React, { useEffect, useState } from 'react';
import { loopAPI, apiUtils } from '../services/api';

const LoopFiles = ({ loopId, user, addNotification }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await loopAPI.listDocuments(loopId);
      if (res.data.success) setFiles(res.data.documents);
    } catch (e) {
      console.error('Failed to load documents', e);
    }
  };

  useEffect(() => { fetchFiles(); }, [loopId]);

  const handleUpload = async (e) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    const form = new FormData();
    for (const f of selected) form.append('files', f);
    try {
      setUploading(true);
      const res = await loopAPI.uploadDocuments(loopId, form);
      if (res.data.success) {
        addNotification('Documents uploaded successfully', 'success');
        fetchFiles();
      }
    } catch (error) {
      addNotification(apiUtils.getErrorMessage(error), 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const res = await loopAPI.deleteDocument(loopId, docId);
      if (res.data.success) {
        addNotification('Document deleted', 'success');
        setFiles(prev => prev.filter(f => f.id !== docId));
      }
    } catch (error) {
      addNotification(apiUtils.getErrorMessage(error), 'error');
    }
  };

  const docUrl = (filename) => `/api/loops/docs/${filename}`;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Attached Documents</h3>
          <label className="btn btn-primary btn-sm">
            {uploading ? (
              <>
                <div className="spinner"></div>
                Uploading...
              </>
            ) : (
              'Upload Files'
            )}
            <input type="file" multiple onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" />
          </label>
        </div>
      </div>
      <div className="card-body">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No documents uploaded yet</div>
        ) : (
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{(f.mimetype || '').includes('pdf') ? '📕' : '📎'}</span>
                  <div>
                    <div className="font-medium text-sm">{f.original_name}</div>
                    <div className="text-xs text-gray-500">{new Date(f.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={docUrl(f.filename)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">View</a>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoopFiles;
