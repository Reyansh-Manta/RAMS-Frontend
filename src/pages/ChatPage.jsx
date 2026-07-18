import { useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import {
  RiLightbulbLine, RiMagicLine, RiQuestionLine, RiSearch2Line
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatPage.css';

export default function ChatPage() {
  const { messages, isTyping, sendMessage } = useChat();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showWelcome = messages.length === 0;

  // Custom Quillbot use-case items mapped to prompt questions
  const quillbotUseCases = [
    {
      title: 'Brainstorm ideas',
      desc: 'Brainstorm creative ways to organize document pipelines.',
      prompt: 'What are some creative ways to organize our document pipelines in the database?',
      icon: <RiLightbulbLine size={20} style={{ color: '#10b981' }} />,
      colorClass: 'green-theme'
    },
    {
      title: 'Generate descriptions',
      desc: 'Summarize document pipeline ingestion design.',
      prompt: 'Describe how the RAMS ingestion and embedding pipeline works.',
      icon: <RiMagicLine size={20} style={{ color: '#3b82f6' }} />,
      colorClass: 'blue-theme'
    },
    {
      title: 'Create FAQs',
      desc: 'Help me write common database pipeline FAQs.',
      prompt: 'What are some common FAQs about our document processing database?',
      icon: <RiQuestionLine size={20} style={{ color: '#8b5cf6' }} />,
      colorClass: 'purple-theme'
    },
    {
      title: 'Analyze statistics',
      desc: 'Analyze database stats for uploads anomalies.',
      prompt: 'Provide a breakdown of database statistics, including chunks and sources.',
      icon: <RiSearch2Line size={20} style={{ color: '#f59e0b' }} />,
      colorClass: 'orange-theme'
    }
  ];

  return (
    <div className="chat-page-content">
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
              {/* Quillbot Inspired headline block */}
              <h1 className="chat-welcome-title">
                How can I help?
              </h1>
              
              <p className="chat-welcome-subtitle">
                From exploring databases to drafting answers, RAMS AI Chat handles it all.
              </p>

              {/* Get started with a use case */}
              <div className="chat-use-cases">
                <p className="use-case-label">Get started with a use case:</p>
                
                <div className="use-cases-grid">
                  {quillbotUseCases.map((item, idx) => (
                    <motion.button
                      key={idx}
                      className={`use-case-card glass ${item.colorClass}`}
                      onClick={() => sendMessage(item.prompt)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.06, duration: 0.4 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="use-case-card-icon-wrap">
                        {item.icon}
                      </div>
                      <div className="use-case-card-text">
                        <span className="use-case-card-title">{item.title}</span>
                        <span className="use-case-card-desc">{item.desc}</span>
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

      {/* Spacious Input card */}
      <ChatInput onSend={sendMessage} disabled={isTyping} />
    </div>
  );
}
