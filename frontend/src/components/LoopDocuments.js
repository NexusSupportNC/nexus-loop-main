import React, { useState, useEffect } from 'react';
import { adminAPI, apiUtils } from '../services/api';

const LoopDocuments = ({ loopId, addNotification }) => {
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (loopId) {
      fetchDocuments();
      fetchTemplates();
    }
  }, [loopId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDocuments = async () => {
    try {
      const response = await adminAPI.getGeneratedDocuments(loopId);
      if (response.data.success) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await adminAPI.getDocumentTemplates();
      if (response.data.success) {
        // Only show templates that have field mappings
        setTemplates(response.data.templates.filter(t => t.fields_mapped));
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = async (templateId) => {
    try {
      setGenerating(templateId);
      const response = await adminAPI.generateDocument(templateId, loopId);
      
      if (response.data.success) {
        addNotification('Document generated successfully', 'success');
        fetchDocuments(); // Refresh the documents list
        setShowGenerator(false);
      }
    } catch (error) {
      const errorMessage = apiUtils.getErrorMessage(error);
      addNotification(errorMessage, 'error');
    } finally {
      setGenerating(null);
    }
  };

  const downloadDocument = (fileName) => {
    window.open(`/api/admin/templates/generated/${fileName}`, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner"></div>
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header (as per provided DOM changes) */}
      <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
        <h3 style={{ display: 'flex', alignItems: 'flex-start', fontSize: 0, fontWeight: 600, lineHeight: '33px', justifyContent: 'center', maxWidth: 0, height: '40px' }}>
          <div style={{ position: 'relative', marginLeft: '20px', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', marginLeft: '20px', minHeight: '100px', padding: '20px' }}>
              <section style={{ display: 'flex', flexDirection: 'column', position: 'relative', marginLeft: 'auto', minHeight: '100px', padding: '20px', width: '100%', alignSelf: 'stretch', flexGrow: 1, maxWidth: '1200px', marginRight: 'auto' }} />
            </div>
          </div>
        </h3>
      </div>

      {/* Document Generator */}
      {showGenerator && (
        <div className="card">
          <div className="card-header">
            <h4 className="font-semibold">Generate Document from Template</h4>
          </div>
          <div className="card-body">
            {templates.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No mapped templates available</p>
                <p className="text-sm">Templates need field mappings before they can generate documents</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">
                        {template.file_type === 'pdf' ? '📕' : '📘'}
                      </span>
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{template.name}</h5>
                        <p className="text-xs text-gray-500 capitalize">{template.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => generateDocument(template.id)}
                      disabled={generating === template.id}
                      className="btn btn-sm btn-primary w-full"
                    >
                      {generating === template.id ? (
                        <>
                          <div className="spinner"></div>
                          Generating...
                        </>
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Documents List */}
      <div className="card" style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid rgb(226, 232, 240)' }}>
        <div className="card-header" style={{ backgroundColor: 'rgb(250, 251, 252)', borderBottomStyle: 'solid', borderBottomWidth: 1, borderColor: 'rgb(30, 41, 59) rgb(30, 41, 59) rgb(226, 232, 240)', padding: '20px 24px' }}>
          <h4 className="font-semibold">Generated Documents ({documents.length})</h4>
        </div>
        <div className="card-body">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📄</div>
              <p>No documents generated yet</p>
              <p className="text-sm">Generate documents from templates above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {doc.fileName.endsWith('.pdf') ? '📕' : '📘'}
                    </span>
                    <div>
                      <h5 className="font-medium text-sm">{doc.fileName}</h5>
                      <div className="text-xs text-gray-500">
                        <span>{formatFileSize(doc.size)}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadDocument(doc.fileName)}
                      className="btn btn-sm btn-outline flex items-center gap-1"
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoopDocuments;
