"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type StateContextType = {
  getState: <T>(key: string) => T | null;
  setState: <T>(key: string, value: T) => void;
  clearState: (key: string) => void;
};

const StateContext = createContext<StateContextType | null>(null);

export const useStateContext = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
};

interface StateProviderProps {
  children: ReactNode;
}

export const StateProvider: React.FC<StateProviderProps> = ({ children }) => {
  // Use a single state object to store all stateful data
  const [state, setState] = useState<Record<string, any>>({});

  // Get state by key
  const getState = useCallback(<T,>(key: string): T | null => {
    return (state[key] as T) || null;
  }, [state]);

  // Set state by key
  const setStateValue = useCallback(<T,>(key: string, value: T): void => {
    setState(prevState => ({
      ...prevState,
      [key]: value
    }));
  }, []);

  // Clear state by key
  const clearState = useCallback((key: string): void => {
    setState(prevState => {
      const newState = { ...prevState };
      delete newState[key];
      return newState;
    });
  }, []);

  return (
    <StateContext.Provider 
      value={{ 
        getState, 
        setState: setStateValue, 
        clearState 
      }}
    >
      {children}
    </StateContext.Provider>
  );
}; 