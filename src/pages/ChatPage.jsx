import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import {
  RiMenuLine, RiSparkling2Fill, RiArrowRightUpLine
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatPage.css';

export default function ChatPage() {
  const { messages, isTyping, sendMessage, welcomeSuggestions } = useChat();
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
                {/* Title inspired by Image 1 mockup */}
                <h1 className="chat-welcome-title">
                  Create, explore, <br />
                  <span className="gradient-text">be inspired.</span>
                </h1>
                
                <p className="chat-welcome-subtitle">
                  Your intelligent RAMS document assistant. Ask anything about the knowledge base.
                </p>

                {/* Categories / Suggestions Cards */}
                <div className="chat-suggestions">
                  <p className="chat-suggestions-label">
                    <RiSparkling2Fill size={14} />
                    Suggested Prompts
                  </p>
                  <div className="chat-suggestions-grid">
                    {welcomeSuggestions.slice(0, 4).map((s, i) => (
                      <motion.button
                        key={i}
                        className="chat-suggestion-card glass-card"
                        onClick={() => sendMessage(s)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="suggestion-card-content">
                          <span className="suggestion-card-category">Explore RAMS</span>
                          <span className="suggestion-card-title">{s}</span>
                        </div>
                        <div className="suggestion-card-arrow-wrap">
                          <RiArrowRightUpLine size={18} className="chat-suggestion-arrow" />
                        </div>
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
