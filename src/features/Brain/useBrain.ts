import { useState, useCallback, useEffect } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionApplied?: boolean;
}

interface BrainResponse {
  text: string;
  actionApplied?: boolean;
}

interface UseBrainReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (prompt: string, context?: any) => Promise<void>;
  clearMessages: () => void;
}

export function useBrain(): UseBrainReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (prompt: string, context?: any) => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      let response = await fetch('/api/brain-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, context }),
      });

      // If we get a rate limit error, try the fallback API
      if (!response.ok && response.status === 429) {
        console.log('Rate limited, using fallback brain API');
        response = await fetch('/api/brain-fallback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, context }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BrainResponse = await response.json();
      
      // Check if we got a rate limit error in the response
      if (data.error === 'rate_limit') {
        console.log('Rate limit detected, using fallback brain API');
        response = await fetch('/api/brain-fallback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, context }),
        });
        const fallbackData = await response.json();
        data.text = fallbackData.text;
        data.actionApplied = fallbackData.actionApplied;
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.text,
        timestamp: new Date().toISOString(),
        actionApplied: data.actionApplied,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      console.error('Brain chat error:', err);
      
      // Add error message with actual error
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: `Error: ${errorMsg}`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}

export function useChatHistory(since?: string) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const url = since 
        ? `/api/brain/history?since=${encodeURIComponent(since)}`
        : '/api/brain/history';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      setHistory(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [since]);

  useEffect(() => {
    fetchHistory();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    mutate: fetchHistory,
  };
}