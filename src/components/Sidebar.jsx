import { useChat } from '../context/ChatContext';
import { RiAddLine, RiChat3Line, RiDeleteBinLine, RiCloseLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { conversations, activeConversationId, newChat, loadConversation, deleteConversation } = useChat();

  const handleNewChat = () => {
    newChat();
    onClose?.();
  };

  const handleSelect = (id) => {
    loadConversation(id);
    onClose?.();
  };

  return (
    <>
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
        className={`sidebar glass ${isOpen ? 'sidebar-open' : ''}`}
        initial={false}
      >
        <div className="sidebar-header">
          <button className="btn-primary sidebar-new-btn" onClick={handleNewChat}>
            <RiAddLine size={18} />
            New Chat
          </button>
          <button className="btn-icon sidebar-close-btn" onClick={onClose}>
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className="sidebar-conversations">
          <p className="sidebar-label">Recent Conversations</p>
          <AnimatePresence>
            {conversations.length === 0 ? (
              <motion.p
                className="sidebar-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No conversations yet. Start a new chat!
              </motion.p>
            ) : (
              conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  className={`sidebar-item ${activeConversationId === conv.id ? 'sidebar-item-active' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  layout
                >
                  <button
                    className="sidebar-item-btn"
                    onClick={() => handleSelect(conv.id)}
                  >
                    <RiChat3Line size={16} />
                    <span className="sidebar-item-title">{conv.title}</span>
                  </button>
                  <button
                    className="sidebar-item-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <RiDeleteBinLine size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">RAMS AI Assistant v1.0</p>
        </div>
      </motion.aside>
    </>
  );
}
