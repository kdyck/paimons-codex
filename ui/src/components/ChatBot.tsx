import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatBotOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  animation: ${props => props.$isOpen ? 'fadeIn 0.3s ease' : 'none'};

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ChatBotContainer = styled.div<{ $isOpen: boolean }>`
  width: 90%;
  max-width: 800px;
  height: 80%;
  max-height: 600px;
  background: ${props => props.theme.colors.glass.background};
  backdrop-filter: ${props => props.theme.colors.glass.backdrop};
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.9)'};
  transition: transform 0.3s ease;
`;

const ChatHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme.colors.glass.hover};
`;

const ChatTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  padding: 0.8rem 1rem;
  border-radius: 12px;
  max-width: 80%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  background: ${props => props.$isUser 
    ? 'linear-gradient(135deg, #667eea, #764ba2)' 
    : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$isUser 
    ? 'white' 
    : props.theme.colors.text.primary};
  border: ${props => props.$isUser 
    ? 'none' 
    : '1px solid rgba(255, 255, 255, 0.2)'};
  word-wrap: break-word;
  line-height: 1.4;
`;

const InputContainer = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 0.5rem;
  background: ${props => props.theme.colors.glass.hover};
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const SendButton = styled.button`
  padding: 0.8rem 1.2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #764ba2, #f093fb);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 4px;
  padding: 0.8rem 1rem;
  
  .dot {
    width: 8px;
    height: 8px;
    background: ${props => props.theme.colors.text.secondary};
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
  }
  
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes bounce {
    0%, 80%, 100% { 
      transform: scale(0.8);
      opacity: 0.5;
    } 
    40% { 
      transform: scale(1);
      opacity: 1;
    }
  }
`;

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  console.log('ChatBot rendering, isOpen:', isOpen);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI assistant. I can help you with questions about manhwa or anything else. What would you like to know?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  console.log('ChatBot state:', { inputValue, isLoading, messagesCount: messages.length });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) {
      onClose();
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      console.log('Sending message to API:', userMessage);
      const requestBody = {
        messages: [...messages, { role: 'user', content: userMessage }]
      };
      console.log('Request body:', requestBody);

      const response = await fetch('http://localhost:8000/api/v1/llm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message?.content || 'Sorry, I couldn\'t generate a response.'
        }]);
      } else {
        console.error('API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sorry, I encountered an error (${response.status}). Please try again.`
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I couldn\'t connect to the AI service. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <ChatBotOverlay 
      $isOpen={isOpen} 
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <ChatBotContainer $isOpen={isOpen}>
        <ChatHeader>
          <ChatTitle>AI Assistant</ChatTitle>
          <CloseButton onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </CloseButton>
        </ChatHeader>
        
        <MessagesContainer>
          {messages.map((message, index) => (
            <MessageBubble key={index} $isUser={message.role === 'user'}>
              {message.content}
            </MessageBubble>
          ))}
          {isLoading && (
            <MessageBubble $isUser={false}>
              <LoadingDots>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </LoadingDots>
            </MessageBubble>
          )}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <InputContainer>
          <MessageInput
            value={inputValue}
            onChange={(e) => {
              console.log('Input change:', e.target.value);
              setInputValue(e.target.value);
            }}
            onKeyPress={handleKeyPress}
            onKeyDown={(e) => {
              console.log('Key pressed:', e.key);
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask me anything..."
            disabled={isLoading}
            autoFocus
          />
          <SendButton 
            onClick={() => {
              console.log('Send button clicked');
              sendMessage();
            }} 
            disabled={isLoading || !inputValue.trim()}
          >
            Send
          </SendButton>
        </InputContainer>
      </ChatBotContainer>
    </ChatBotOverlay>
  );
};

export default ChatBot;