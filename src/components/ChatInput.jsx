import { useState, useRef, useEffect } from 'react';
import { RiSendPlaneFill, RiMicLine, RiMicFill, RiAddLine } from 'react-icons/ri';
import { motion } from 'framer-motion';
import './ChatInput.css';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [text]);

  // Setup Web Speech API for voice recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setText((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

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

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Speech-to-text is not supported in this browser. Try Chrome or Safari!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
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
        {/* Plus Button inside input */}
        <button 
          className="chat-input-action-btn"
          onClick={() => alert('Attachments features coming soon!')}
          title="Add attachment"
          type="button"
        >
          <RiAddLine size={20} />
        </button>

        <textarea
          ref={textareaRef}
          className="chat-input-field"
          placeholder={isListening ? "Listening... Speak now!" : "Ask anything..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isListening}
          rows={1}
        />

        {/* Mic Button inside input */}
        <button 
          onClick={handleMicClick}
          className={`chat-input-action-btn mic-btn ${isListening ? 'listening active' : ''}`}
          title={isListening ? "Stop listening" : "Voice typing"}
          type="button"
        >
          {isListening ? (
            <RiMicFill size={20} style={{ color: '#da1b60' }} />
          ) : (
            <RiMicLine size={20} />
          )}
          {isListening && <span className="listening-pulse-ring" />}
        </button>

        {/* Send Button inside input */}
        <button
          className={`chat-send-btn ${text.trim() ? 'chat-send-btn-active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || disabled || isListening}
          aria-label="Send message"
        >
          <RiSendPlaneFill size={18} />
        </button>
      </div>
      <p className="chat-input-hint">
        Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
      </p>
    </motion.div>
  );
}
