import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import {
  RiFileList3Line, RiAddCircleLine, RiDeleteBinLine,
  RiLinkM, RiHashtag, RiTimeLine, RiFileTextLine,
  RiDatabase2Line, RiUploadCloud2Line, RiCheckLine,
  RiGroupLine, RiRadioButtonLine, RiCalendarCheckLine,
  RiQuestionAnswerLine, RiBarChartBoxLine, RiUserAddLine,
  RiPuzzle2Line
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminDashboard.css';

// Animated counter hook
function useAnimatedCount(target, duration = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const diff = target - start;
    if (diff === 0) return;
    
    const startTime = performance.now();
    let rafId;
    
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevTarget.current = target;
      }
    };
    
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}

// Individual stat card component
function StatCard({ icon: Icon, value, label, colorClass, delay, isLive }) {
  const animatedValue = useAnimatedCount(value);
  
  return (
    <motion.div
      className={`platform-stat glass-card ${colorClass}`}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className={`platform-stat-icon ${colorClass}`}>
        <Icon size={22} />
        {isLive && <span className="live-pulse" />}
      </div>
      <div className="platform-stat-content">
        <p className="platform-stat-value">{animatedValue.toLocaleString()}</p>
        <p className="platform-stat-label">{label}</p>
      </div>
    </motion.div>
  );
}

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

  // Platform stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  // Fetch platform stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      intervalRef.current = setInterval(fetchStats, 30000);
      return () => clearInterval(intervalRef.current);
    }
  }, [isAdmin, fetchStats]);

  const saveDocuments = (docs) => {
    localStorage.setItem('rams_documents', JSON.stringify(docs));
    setDocuments(docs);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!docLink.trim() || !docId.trim()) return;

    setIsUploading(true);
    
    try {
      await apiClient.post('/document-sources', {
        title: docId.trim(),
        doc_id: docId.trim(),
        url: docLink.trim()
      });

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
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      // Refresh stats after adding a document
      fetchStats();
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document. See console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (docId) => {
    const updated = documents.filter(d => d.id !== docId);
    saveDocuments(updated);
  };

  // Time ago formatter
  const getTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  // Force re-render for "time ago" display
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
      </div>
    );
  }

  const STAT_CARDS = [
    { key: 'total_users', icon: RiGroupLine, label: 'Total Users', colorClass: 'stat-users' },
    { key: 'active_now', icon: RiRadioButtonLine, label: 'Active Now', colorClass: 'stat-active', isLive: true },
    { key: 'logins_today', icon: RiCalendarCheckLine, label: 'Logins Today', colorClass: 'stat-logins' },
    { key: 'questions_today', icon: RiQuestionAnswerLine, label: 'Questions Today', colorClass: 'stat-questions' },
    { key: 'total_questions', icon: RiBarChartBoxLine, label: 'Total Questions', colorClass: 'stat-total-q' },
    { key: 'new_users_week', icon: RiUserAddLine, label: 'New This Week', colorClass: 'stat-new' },
    { key: 'total_documents', icon: RiFileList3Line, label: 'Total Documents', colorClass: 'stat-docs' },
    { key: 'total_chunks', icon: RiPuzzle2Line, label: 'Total Chunks', colorClass: 'stat-chunks' },
  ];

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

        {/* Platform Statistics */}
        <motion.div
          className="platform-stats-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="platform-stats-header">
            <h2 className="platform-stats-title">
              <RiBarChartBoxLine size={20} />
              Platform Statistics
            </h2>
            {lastUpdated && (
              <span className="platform-stats-updated">
                Updated {getTimeAgo(lastUpdated)}
              </span>
            )}
          </div>

          <div className="platform-stats-grid">
            {statsLoading ? (
              // Loading skeletons
              Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  className="platform-stat glass-card skeleton"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="skeleton-icon" />
                  <div className="skeleton-content">
                    <div className="skeleton-value" />
                    <div className="skeleton-label" />
                  </div>
                </motion.div>
              ))
            ) : (
              STAT_CARDS.map((card, i) => (
                <StatCard
                  key={card.key}
                  icon={card.icon}
                  value={stats?.[card.key] ?? 0}
                  label={card.label}
                  colorClass={card.colorClass}
                  delay={0.1 + i * 0.05}
                  isLive={card.isLive}
                />
              ))
            )}
          </div>
        </motion.div>

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
