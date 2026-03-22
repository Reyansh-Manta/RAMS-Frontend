import { useState, useRef, useEffect } from 'react';
import { RiSendPlaneFill } from 'react-icons/ri';
import { motion } from 'framer-motion';
import './ChatInput.css';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [text]);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="chat-input-wrapper glass"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input-field"
          placeholder="Ask anything..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <button
          className={`chat-send-btn ${text.trim() ? 'chat-send-btn-active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          aria-label="Send message"
        >
          <RiSendPlaneFill size={20} />
        </button>
      </div>
      <p className="chat-input-hint">
        Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
      </p>
    </motion.div>
  );
}
