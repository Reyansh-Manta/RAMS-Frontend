import { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext(null);

const BOT_RESPONSES = [
  "That's a great question! Based on the documents in our knowledge base, I can help you with that. Let me provide you with the relevant information.",
  "I found some relevant information in our database. Here's what I can tell you about your query.",
  "Thanks for asking! Let me search through our document repository to find the best answer for you.",
  "Based on the uploaded documents, here's what I've found that relates to your question.",
  "Great question! I've analyzed the available documents and here's a comprehensive answer for you.",
  "Let me look into that for you. According to our knowledge base, here's the information you're looking for.",
  "I appreciate your question! After reviewing the relevant documents, here's what I can share with you.",
];

const WELCOME_SUGGESTIONS = [
  "What documents are available?",
  "How can you help me?",
  "Tell me about the knowledge base",
  "What topics can I ask about?",
];

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(() => {
    const stored = localStorage.getItem('rams_conversations');
    return stored ? JSON.parse(stored) : [];
  });

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const saveConversations = (convs) => {
    localStorage.setItem('rams_conversations', JSON.stringify(convs));
  };

  const newChat = useCallback(() => {
    const id = Date.now().toString();
    const conv = { id, title: 'New Chat', createdAt: new Date().toISOString(), messages: [] };
    const updated = [conv, ...conversations];
    setConversations(updated);
    setActiveConversationId(id);
    setMessages([]);
    saveConversations(updated);
    return id;
  }, [conversations]);

  const loadConversation = useCallback((id) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setActiveConversationId(id);
      setMessages(conv.messages || []);
    }
  }, [conversations]);

  const deleteConversation = useCallback((id) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    saveConversations(updated);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [conversations, activeConversationId]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    let convId = activeConversationId;
    let currentConvs = conversations;

    if (!convId) {
      convId = Date.now().toString();
      const conv = { id: convId, title: text.slice(0, 40), createdAt: new Date().toISOString(), messages: [] };
      currentConvs = [conv, ...conversations];
      setConversations(currentConvs);
      setActiveConversationId(convId);
    }

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Update conversation title if first message
    const conv = currentConvs.find(c => c.id === convId);
    if (conv && conv.messages.length === 0) {
      conv.title = text.slice(0, 40) + (text.length > 40 ? '...' : '');
    }
    conv.messages = newMessages;
    saveConversations(currentConvs);

    // Simulate bot typing
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1500));

    const botMsg = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      content: BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)],
      timestamp: new Date().toISOString(),
    };

    const finalMessages = [...newMessages, botMsg];
    setMessages(finalMessages);
    setIsTyping(false);

    conv.messages = finalMessages;
    saveConversations(currentConvs);
  }, [activeConversationId, conversations, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
  }, []);

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversationId,
      messages,
      isTyping,
      newChat,
      loadConversation,
      deleteConversation,
      sendMessage,
      clearChat,
      welcomeSuggestions: WELCOME_SUGGESTIONS,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
