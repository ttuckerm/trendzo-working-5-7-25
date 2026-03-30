'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ContentStrategy, ContentStrategyInsert, ContentStrategyUpdate } from '@/types/database';

interface UseStrategyReturn {
  strategies: ContentStrategy[];
  activeStrategy: ContentStrategy | null;
  isLoading: boolean;
  error: string | null;
  fetchStrategies: () => Promise<void>;
  createStrategy: (data: Omit<ContentStrategyInsert, 'user_id'>) => Promise<ContentStrategy>;
  updateStrategy: (id: string, data: ContentStrategyUpdate) => Promise<ContentStrategy>;
  deleteStrategy: (id: string) => Promise<void>;
  selectStrategy: (strategy: ContentStrategy | null) => void;
}

export function useStrategy(): UseStrategyReturn {
  const [strategies, setStrategies] = useState<ContentStrategy[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<ContentStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/strategies');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch strategies');
      }

      setStrategies(data.strategies);

      // If we have strategies but no active one, select the most recent
      if (data.strategies.length > 0 && !activeStrategy) {
        setActiveStrategy(data.strategies[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching strategies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStrategy]);

  const createStrategy = useCallback(async (data: Omit<ContentStrategyInsert, 'user_id'>): Promise<ContentStrategy> => {
    setError(null);

    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create strategy');
      }

      const newStrategy = result.strategy;
      setStrategies(prev => [newStrategy, ...prev]);
      setActiveStrategy(newStrategy);

      return newStrategy;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create strategy';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateStrategy = useCallback(async (id: string, data: ContentStrategyUpdate): Promise<ContentStrategy> => {
    setError(null);

    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update strategy');
      }

      const updatedStrategy = result.strategy;
      setStrategies(prev =>
        prev.map(s => (s.id === id ? updatedStrategy : s))
      );

      if (activeStrategy?.id === id) {
        setActiveStrategy(updatedStrategy);
      }

      return updatedStrategy;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update strategy';
      setError(message);
      throw new Error(message);
    }
  }, [activeStrategy]);

  const deleteStrategy = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete strategy');
      }

      setStrategies(prev => prev.filter(s => s.id !== id));

      if (activeStrategy?.id === id) {
        setActiveStrategy(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete strategy';
      setError(message);
      throw new Error(message);
    }
  }, [activeStrategy]);

  const selectStrategy = useCallback((strategy: ContentStrategy | null) => {
    setActiveStrategy(strategy);
  }, []);

  // Load strategies on mount
  useEffect(() => {
    fetchStrategies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    strategies,
    activeStrategy,
    isLoading,
    error,
    fetchStrategies,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    selectStrategy,
  };
}

export default useStrategy;
