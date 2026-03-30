"use client";

import { useState, useRef, useEffect } from 'react';
import styles from './super-admin.module.css';

interface Message {
  type: 'system' | 'admin';
  content: string;
  timestamp: Date;
}

export default function AIBrainInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'system',
      content: 'AI Brain initialized. Ready for conversational framework updates.',
      timestamp: new Date()
    },
    {
      type: 'admin',
      content: 'Analyze the new hook pattern from yesterday\'s viral surge.',
      timestamp: new Date()
    },
    {
      type: 'system',
      content: 'Detected pattern: "3-second buildup + unexpected reveal" achieving 3.2x engagement. Should I update the Hook Framework?',
      timestamp: new Date()
    },
    {
      type: 'admin',
      content: 'Yes, integrate it as a new hook variant for testing.',
      timestamp: new Date()
    },
    {
      type: 'system',
      content: 'Framework updated. New hook variant "Suspense Reveal" added to Content Structure Analysis. Deploying to 10% of Creator tier for A/B testing.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      // Add admin message
      const adminMessage: Message = {
        type: 'admin',
        content: inputValue,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, adminMessage]);

      // Simulate AI response
      setTimeout(() => {
        const systemMessage: Message = {
          type: 'system',
          content: 'Processing your request... Framework analysis complete. Would you like me to implement the changes?',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      }, 1000);

      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.aiBrainInterface}>
      <div className={styles.brainVisualization}>
        <div className={styles.brainCore}></div>
      </div>
      <div className={styles.conversationInterface}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>🧠 Conversational AI Brain</h2>
        <div className={styles.conversationHistory} ref={historyRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.aiMessage} ${styles[message.type]}`}
            >
              {message.type === 'system' ? 'System: ' : 'Admin: '}
              {message.content}
            </div>
          ))}
        </div>
        <div className={styles.conversationInput}>
          <input
            type="text"
            className={styles.brainInput}
            placeholder="Speak to the AI Brain..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className={styles.brainSubmit} onClick={handleSubmit}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}