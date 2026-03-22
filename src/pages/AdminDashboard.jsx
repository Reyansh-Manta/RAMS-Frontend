import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RiFileList3Line, RiAddCircleLine, RiDeleteBinLine,
  RiLinkM, RiHashtag, RiTimeLine, RiFileTextLine,
  RiDatabase2Line, RiUploadCloud2Line, RiCheckLine
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState(() => {
    const stored = localStorage.getItem('rams_documents');
    return stored ? JSON.parse(stored) : [];
  });

  const [docLink, setDocLink] = useState('');
  const [docId, setDocId] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  const saveDocuments = (docs) => {
    localStorage.setItem('rams_documents', JSON.stringify(docs));
    setDocuments(docs);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!docLink.trim() || !docId.trim()) return;

    setIsUploading(true);
    // Simulate upload
    await new Promise(r => setTimeout(r, 1000));

    const newDoc = {
      id: docId.trim(),
      link: docLink.trim(),
      uploadedAt: new Date().toISOString(),
      status: 'active',
    };

    const updated = [newDoc, ...documents];
    saveDocuments(updated);
    setDocLink('');
    setDocId('');
    setIsUploading(false);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleDelete = (docId) => {
    const updated = documents.filter(d => d.id !== docId);
    saveDocuments(updated);
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-inner">
        {/* Header */}
        <motion.div
          className="admin-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="admin-header-title">
              <RiDatabase2Line className="admin-header-icon" />
              Knowledge Base
            </h1>
            <p className="admin-header-desc">Manage documents for the RAMS AI chatbot</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="admin-stats">
          <motion.div
            className="admin-stat glass-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="admin-stat-icon admin-stat-icon-total">
              <RiFileList3Line size={22} />
            </div>
            <div>
              <p className="admin-stat-value">{documents.length}</p>
              <p className="admin-stat-label">Total Documents</p>
            </div>
          </motion.div>
          <motion.div
            className="admin-stat glass-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="admin-stat-icon admin-stat-icon-active">
              <RiCheckLine size={22} />
            </div>
            <div>
              <p className="admin-stat-value">{documents.filter(d => d.status === 'active').length}</p>
              <p className="admin-stat-label">Active</p>
            </div>
          </motion.div>
          <motion.div
            className="admin-stat glass-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="admin-stat-icon admin-stat-icon-recent">
              <RiTimeLine size={22} />
            </div>
            <div>
              <p className="admin-stat-value">
                {documents.length > 0
                  ? new Date(documents[0].uploadedAt).toLocaleDateString()
                  : '—'}
              </p>
              <p className="admin-stat-label">Last Upload</p>
            </div>
          </motion.div>
        </div>

        {/* Upload Form */}
        <motion.div
          className="admin-upload glass-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="admin-upload-header">
            <RiUploadCloud2Line size={22} className="admin-upload-header-icon" />
            <div>
              <h2 className="admin-upload-title">Upload Document</h2>
              <p className="admin-upload-desc">Add a new document to the knowledge base</p>
            </div>
          </div>

          <form className="admin-upload-form" onSubmit={handleUpload}>
            <div className="admin-upload-fields">
              <div className="admin-upload-field">
                <label className="admin-upload-label">
                  <RiHashtag size={14} />
                  Document ID
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. DOC-001"
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="admin-upload-field">
                <label className="admin-upload-label">
                  <RiLinkM size={14} />
                  Document Link
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://example.com/document.pdf"
                  value={docLink}
                  onChange={(e) => setDocLink(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary admin-upload-btn"
              disabled={!docLink.trim() || !docId.trim() || isUploading}
            >
              {isUploading ? (
                <span className="admin-upload-spinner" />
              ) : (
                <>
                  <RiAddCircleLine size={18} />
                  Add Document
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {uploadSuccess && (
              <motion.div
                className="admin-upload-success"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <RiCheckLine size={16} />
                Document added successfully!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Document List */}
        <motion.div
          className="admin-docs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="admin-docs-header">
            <h2 className="admin-docs-title">
              <RiFileList3Line size={20} />
              Documents
            </h2>
            <span className="admin-docs-count">{documents.length} items</span>
          </div>

          {documents.length === 0 ? (
            <div className="admin-docs-empty glass-card">
              <RiFileTextLine size={40} />
              <p>No documents uploaded yet</p>
              <p className="admin-docs-empty-sub">Use the form above to add your first document</p>
            </div>
          ) : (
            <div className="admin-docs-list">
              <AnimatePresence>
                {documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    className="admin-doc-card glass-card"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <div className="admin-doc-info">
                      <div className="admin-doc-id-badge">
                        <RiHashtag size={12} />
                        {doc.id}
                      </div>
                      <a
                        href={doc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-doc-link"
                      >
                        <RiLinkM size={14} />
                        {doc.link}
                      </a>
                      <span className="admin-doc-date">
                        <RiTimeLine size={12} />
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      className="admin-doc-delete"
                      onClick={() => handleDelete(doc.id)}
                      title="Delete document"
                    >
                      <RiDeleteBinLine size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
