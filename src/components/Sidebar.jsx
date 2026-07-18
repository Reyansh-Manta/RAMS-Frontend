import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import {
  RiAddLine, RiChat3Line, RiDeleteBinLine,
  RiCloseLine, RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { conversations, activeConversationId, newChat, loadConversation, deleteConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewChat = () => {
    newChat();
    onClose?.();
  };

  const handleSelect = (id) => {
    loadConversation(id);
    onClose?.();
  };

  // Search Filter
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar glass ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        initial={false}
      >
        {/* Toggle Collapse Button on Desktop */}
        <button 
          className="sidebar-collapse-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isCollapsed ? <RiArrowRightSLine size={16} /> : <RiArrowLeftSLine size={16} />}
        </button>

        {!isCollapsed && (
          <>
            <div className="sidebar-header">
              <button className="btn-primary sidebar-new-btn" onClick={handleNewChat}>
                <RiAddLine size={16} />
                New Chat
              </button>
              <button className="btn-icon sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Interactive Search Box */}
            <div className="sidebar-search">
              <RiSearchLine size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                  <RiCloseLine size={14} />
                </button>
              )}
            </div>

            <div className="sidebar-conversations">
              <p className="sidebar-label">Conversations</p>
              <div className="sidebar-scrollable">
                <AnimatePresence initial={false}>
                  {filteredConversations.length === 0 ? (
                    <motion.p
                      className="sidebar-empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {searchQuery ? "No matches found." : "No chats yet. Start a new one!"}
                    </motion.p>
                  ) : (
                    filteredConversations.map((conv) => (
                      <motion.div
                        key={conv.id}
                        className={`sidebar-item ${activeConversationId === conv.id ? 'sidebar-item-active' : ''}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        layout
                      >
                        <button
                          className="sidebar-item-btn"
                          onClick={() => handleSelect(conv.id)}
                        >
                          <RiChat3Line size={15} />
                          <span className="sidebar-item-title">{conv.title}</span>
                        </button>
                        <button
                          className="sidebar-item-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          title="Delete conversation"
                        >
                          <RiDeleteBinLine size={13} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="sidebar-footer">
              <p className="sidebar-footer-text">RAMS AI Pipeline</p>
            </div>
          </>
        )}
      </motion.aside>
    </>
  );
}
