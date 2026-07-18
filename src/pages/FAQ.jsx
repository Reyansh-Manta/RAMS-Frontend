import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiQuestionAnswerLine, 
  RiAddLine, 
  RiMagicLine, 
  RiDeleteBinLine, 
  RiArrowDownSLine,
  RiCloseLine
} from 'react-icons/ri';
import './FAQ.css';

export default function FAQ() {
  const { isSuperAdmin } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/faq');
      setFaqs(res.data);
    } catch (error) {
      console.error('Failed to fetch FAQs', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const toggleAccordion = (id) => {
    setOpenId(openId === id ? null : id);
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.post('/admin/faq', {
        question: newQuestion,
        answer: newAnswer
      });
      setNewQuestion('');
      setNewAnswer('');
      setShowAddModal(false);
      fetchFaqs();
    } catch (error) {
      console.error('Failed to add FAQ', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      await apiClient.delete(`/admin/faq/${id}`);
      fetchFaqs();
    } catch (error) {
      console.error('Failed to delete FAQ', error);
    }
  };

  const handleGenerateFaqs = async () => {
    if (!window.confirm('This will analyze recent user questions and auto-generate FAQs using AI. Proceed?')) return;
    
    setIsGenerating(true);
    try {
      const res = await apiClient.post('/admin/faq/generate');
      alert(res.data.message || 'FAQs generated successfully');
      fetchFaqs();
    } catch (error) {
      console.error('Failed to generate FAQs', error);
      alert(error.response?.data?.detail || 'Failed to generate FAQs');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="faq-page-container">
      <div className="faq-header">
        <h1 className="faq-title">
          <RiQuestionAnswerLine /> Frequently Asked Questions
        </h1>
        
        {isSuperAdmin && (
          <div className="faq-admin-controls">
            <button 
              className="btn-secondary" 
              onClick={handleGenerateFaqs}
              disabled={isGenerating}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              {isGenerating ? <span className="login-spinner" style={{width: '16px', height: '16px'}}/> : <RiMagicLine />}
              {isGenerating ? 'Generating...' : 'Auto-Generate'}
            </button>
            <button 
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <RiAddLine /> Add Manual
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No FAQs available at the moment.
        </div>
      ) : (
        <div className="faq-list">
          {faqs.map(faq => (
            <div key={faq._id} className="faq-item">
              <div 
                className="faq-item-header" 
                onClick={() => toggleAccordion(faq._id)}
              >
                <span className="faq-question-text">{faq.question}</span>
                <div className="faq-item-actions">
                  {isSuperAdmin && (
                    <button 
                      className="faq-delete-btn" 
                      onClick={(e) => handleDeleteFaq(e, faq._id)}
                      title="Delete FAQ"
                    >
                      <RiDeleteBinLine size={18} />
                    </button>
                  )}
                  <RiArrowDownSLine 
                    size={24} 
                    className={`faq-icon-rotate ${openId === faq._id ? 'open' : ''}`} 
                  />
                </div>
              </div>
              
              <AnimatePresence>
                {openId === faq._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="faq-answer">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Add FAQ Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className="faq-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="faq-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <button 
                className="faq-modal-close" 
                onClick={() => setShowAddModal(false)}
              >
                <RiCloseLine size={24} />
              </button>
              
              <h3>Add New FAQ</h3>
              
              <form onSubmit={handleAddFaq}>
                <div className="faq-form-group">
                  <label>Question</label>
                  <input
                    type="text"
                    required
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    placeholder="Enter the question"
                  />
                </div>
                
                <div className="faq-form-group">
                  <label>Answer</label>
                  <textarea
                    required
                    value={newAnswer}
                    onChange={e => setNewAnswer(e.target.value)}
                    placeholder="Enter the answer"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="faq-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save FAQ'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
