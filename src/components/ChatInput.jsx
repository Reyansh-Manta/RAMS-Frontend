import { useState, useRef, useEffect } from 'react';
import {
  RiArrowRightLine, RiMicLine, RiMicFill,
  RiAddLine, RiAttachment2, RiSparkling2Line
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatInput.css';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Pro');
  
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const toolsRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
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

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setText((prev) => (prev ? prev + ' ' + transcript : transcript));
      };
      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  // Close tools dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (toolsRef.current && !toolsRef.current.contains(event.target)) {
        setShowToolsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    setShowToolsDropdown(false);
  };

  return (
    <motion.div
      className="chat-input-wrapper"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="chat-input-spacious-card">
        {/* Input Textarea Area */}
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          placeholder={isListening ? "Listening... Speak now!" : "Ask me anything..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isListening}
          rows={2}
        />

        {/* Toolbar Bottom Row */}
        <div className="chat-input-toolbar">
          <div className="chat-input-toolbar-left">
            {/* Attachment Button */}
            <button
              className="toolbar-btn"
              onClick={() => alert('File attachments module coming soon!')}
              title="Add attachment"
              type="button"
            >
              <RiAddLine size={18} />
            </button>

            {/* Mic Voice Typing Button */}
            <button
              onClick={handleMicClick}
              className={`toolbar-btn mic-btn ${isListening ? 'active' : ''}`}
              title={isListening ? "Stop listening" : "Voice typing"}
              type="button"
            >
              {isListening ? (
                <RiMicFill size={18} style={{ color: 'var(--color-error)' }} />
              ) : (
                <RiMicLine size={18} />
              )}
              {isListening && <span className="mic-listening-pulse" />}
            </button>

            {/* Tools Dropdown selector */}
            <div className="tools-selector-container" ref={toolsRef}>
              <button
                type="button"
                className={`tools-trigger-btn ${showToolsDropdown ? 'active' : ''}`}
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              >
                <RiSparkling2Line size={16} />
                <span>{selectedModel}</span>
              </button>

              <AnimatePresence>
                {showToolsDropdown && (
                  <motion.div
                    className="tools-dropdown glass"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="dropdown-label">Pipeline Model</p>
                    <button type="button" onClick={() => handleSelectModel('Gemini 2.5 Pro')}>Gemini 2.5 Pro</button>
                    <button type="button" onClick={() => handleSelectModel('Gemini 2.5 Flash')}>Gemini 2.5 Flash</button>
                    <button type="button" onClick={() => handleSelectModel('Claude 3.5 Sonnet')}>Claude 3.5 Sonnet</button>
                    <button type="button" onClick={() => handleSelectModel('GPT-4o')}>GPT-4o</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="chat-input-toolbar-right">
            {/* Circular Send Button */}
            <button
              className={`chat-submit-circular-btn ${text.trim() ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!text.trim() || disabled || isListening}
              aria-label="Send query"
            >
              <RiArrowRightLine size={18} />
            </button>
          </div>
        </div>
      </div>
      <p className="chat-input-hint">
        Press <kbd>Enter</kbd> to submit, <kbd>Shift + Enter</kbd> for details.
      </p>
    </motion.div>
  );
}
