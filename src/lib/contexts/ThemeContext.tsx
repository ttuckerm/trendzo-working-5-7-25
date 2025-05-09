'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDarkMode: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Get system preference for dark mode
  const getSystemPreference = (): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };
  
  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
    
    if (storedTheme) {
      setThemeState(storedTheme);
    } else {
      // Default to system
      setThemeState('system');
    }
  }, []);
  
  // Update isDarkMode when theme changes
  useEffect(() => {
    const updateDarkMode = () => {
      if (theme === 'system') {
        setIsDarkMode(getSystemPreference());
      } else {
        setIsDarkMode(theme === 'dark');
      }
    };
    
    updateDarkMode();
    
    // Listen for system preference changes if using 'system' theme
    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateDarkMode();
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);
  
  // Update document class when dark mode changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);
  
  // Set theme and store preference
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  const value = {
    theme,
    isDarkMode,
    setTheme,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 