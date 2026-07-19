import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RiRobot2Fill, RiUser3Fill, RiFileCopyLine,
  RiVolumeUpLine, RiThumbUpLine, RiThumbUpFill,
  RiRefreshLine
} from 'react-icons/ri';
import './ChatBubble.css';

export default function ChatBubble({ message }) {
  const isBot = message.role === 'bot';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Action states for premium UX
  const [liked, setLiked] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  // Clean text by stripping markdown symbols so Speech API index aligns
  const cleanText = message.content
    .replace(/[#*`_-]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingSpeech) {
        window.speechSynthesis.cancel();
        setIsPlayingSpeech(false);
        setCurrentCharIndex(0);
      } else {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            setCurrentCharIndex(event.charIndex);
          }
        };

        utterance.onend = () => {
          setIsPlayingSpeech(false);
          setCurrentCharIndex(0);
        };

        utterance.onerror = () => {
          setIsPlayingSpeech(false);
          setCurrentCharIndex(0);
        };
        
        setIsPlayingSpeech(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert('Speech synthesis not supported in this browser.');
    }
  };

  // Render the text, highlighting up to the currently spoken word
  const renderBubbleText = () => {
    if (!isPlayingSpeech) {
      return message.content;
    }

    // Find the end of the current word
    let nextSpace = cleanText.indexOf(' ', currentCharIndex);
    if (nextSpace === -1) nextSpace = cleanText.length;

    const spoken = cleanText.substring(0, currentCharIndex);
    const current = cleanText.substring(currentCharIndex, nextSpace);
    const unspoken = cleanText.substring(nextSpace);

    return (
      <span className="karaoke-speech-container">
        <span className="speech-spoken">{spoken}</span>
        <span className="speech-current">{current}</span>
        <span className="speech-unspoken">{unspoken}</span>
      </span>
    );
  };

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
        <div className="chat-bubble-text-wrapper">
          <div className="chat-bubble-text">
            {renderBubbleText()}
          </div>
          
          {isBot && (
            <div className="chat-bubble-actions">
              <button 
                onClick={handleCopy} 
                className={`bubble-action-btn ${copied ? 'active' : ''}`}
                title={copied ? "Copied!" : "Copy message"}
              >
                <RiFileCopyLine size={14} />
                {copied && <span className="action-tooltip">Copied!</span>}
              </button>
              <button 
                onClick={handleSpeech} 
                className={`bubble-action-btn ${isPlayingSpeech ? 'active speech-playing' : ''}`}
                title={isPlayingSpeech ? "Stop speaking" : "Speak response"}
              >
                <RiVolumeUpLine size={14} />
              </button>
              <button 
                onClick={() => setLiked(!liked)} 
                className={`bubble-action-btn ${liked ? 'active' : ''}`}
                title="Like response"
              >
                {liked ? <RiThumbUpFill size={14} style={{color: '#f59e0b'}} /> : <RiThumbUpLine size={14} />}
              </button>
              <button 
                onClick={() => {
                  alert('Regenerating response simulation...');
                }} 
                className="bubble-action-btn"
                title="Regenerate"
              >
                <RiRefreshLine size={14} />
              </button>
            </div>
          )}
        </div>
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
