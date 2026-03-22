import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import { RiMenuLine, RiRobot2Fill, RiSparkling2Fill, RiArrowRightLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatPage.css';

export default function ChatPage() {
  const { messages, isTyping, sendMessage, welcomeSuggestions, activeConversationId } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showWelcome = messages.length === 0;

  return (
    <div className="chat-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="chat-main">
        {/* Mobile menu trigger */}
        <button
          className="chat-menu-btn btn-icon"
          onClick={() => setSidebarOpen(true)}
        >
          <RiMenuLine size={22} />
        </button>

        {/* Messages area */}
        <div className="chat-messages">
          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div
                className="chat-welcome"
                key="welcome"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="chat-welcome-icon animate-float">
                  <RiRobot2Fill size={48} />
                </div>
                <h1 className="chat-welcome-title">
                  Welcome to <span className="gradient-text">RAMS AI</span>
                </h1>
                <p className="chat-welcome-subtitle">
                  Your intelligent document assistant. Ask me anything about the knowledge base — no login required.
                </p>

                <div className="chat-suggestions">
                  <p className="chat-suggestions-label">
                    <RiSparkling2Fill size={14} />
                    Try asking
                  </p>
                  <div className="chat-suggestions-grid">
                    {welcomeSuggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        className="chat-suggestion-btn glass-card"
                        onClick={() => sendMessage(s)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>{s}</span>
                        <RiArrowRightLine size={14} className="chat-suggestion-arrow" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="chat-messages-list"
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
                <AnimatePresence>
                  {isTyping && <TypingIndicator />}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isTyping} />
      </div>
    </div>
  );
}
