import { motion } from 'framer-motion';
import { RiRobot2Fill, RiUser3Fill } from 'react-icons/ri';
import './ChatBubble.css';

export default function ChatBubble({ message }) {
  const isBot = message.role === 'bot';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      className={`chat-bubble ${isBot ? 'chat-bubble-bot' : 'chat-bubble-user'}`}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="chat-bubble-avatar">
        {isBot ? <RiRobot2Fill size={18} /> : <RiUser3Fill size={18} />}
      </div>
      <div className="chat-bubble-content">
        <div className="chat-bubble-header">
          <span className="chat-bubble-name">{isBot ? 'RAMS AI' : 'You'}</span>
          <span className="chat-bubble-time">{time}</span>
        </div>
        <p className="chat-bubble-text">{message.content}</p>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      className="chat-bubble chat-bubble-bot"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <div className="chat-bubble-avatar">
        <RiRobot2Fill size={18} />
      </div>
      <div className="chat-bubble-content">
        <div className="typing-indicator">
          <span className="typing-dot" style={{ animationDelay: '0ms' }}></span>
          <span className="typing-dot" style={{ animationDelay: '150ms' }}></span>
          <span className="typing-dot" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </motion.div>
  );
}
