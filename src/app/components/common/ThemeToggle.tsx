'use client';

import React from 'react';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'button' | 'dropdown';
}

/**
 * ThemeToggle - A component to toggle between light, dark, and system themes
 */
export function ThemeToggle({
  className,
  variant = 'icon'
}: ThemeToggleProps) {
  const { theme, isDarkMode, setTheme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  
  // Get icon based on current theme
  const getIcon = () => {
    if (theme === 'system') {
      return <Laptop className="h-5 w-5" />;
    } else if (isDarkMode) {
      return <Moon className="h-5 w-5" />;
    } else {
      return <Sun className="h-5 w-5" />;
    }
  };
  
  // Simple icon-only toggle (light/dark)
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "rounded-md p-2 transition-colors",
          isDarkMode 
            ? "text-gray-100 hover:bg-gray-800" 
            : "text-gray-700 hover:bg-gray-200",
          className
        )}
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    );
  }
  
  // Button with text
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "rounded-md px-3 py-2 flex items-center space-x-2 transition-colors",
          isDarkMode 
            ? "bg-gray-800 text-gray-100 hover:bg-gray-700" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          className
        )}
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isDarkMode ? 'Light' : 'Dark'} mode
        </span>
      </button>
    );
  }
  
  // Dropdown with all options
  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={cn(
          "rounded-md px-3 py-2 flex items-center justify-between transition-colors",
          isDarkMode 
            ? "bg-gray-800 text-gray-100 hover:bg-gray-700" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          className,
          "min-w-[8rem]"
        )}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="text-sm font-medium capitalize">
            {theme === 'system' ? 'System' : theme}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 ml-2" />
      </button>
      
      {isDropdownOpen && (
        <div 
          className={cn(
            "absolute right-0 mt-1 w-36 rounded-md shadow-lg z-10 overflow-hidden",
            isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          )}
        >
          <div className="py-1">
            <button
              onClick={() => {
                setTheme('light');
                setIsDropdownOpen(false);
              }}
              className={cn(
                "flex items-center px-4 py-2 text-sm w-full text-left",
                theme === 'light'
                  ? isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  : isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
                isDarkMode ? "text-gray-100" : "text-gray-700"
              )}
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </button>
            <button
              onClick={() => {
                setTheme('dark');
                setIsDropdownOpen(false);
              }}
              className={cn(
                "flex items-center px-4 py-2 text-sm w-full text-left",
                theme === 'dark'
                  ? isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  : isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
                isDarkMode ? "text-gray-100" : "text-gray-700"
              )}
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </button>
            <button
              onClick={() => {
                setTheme('system');
                setIsDropdownOpen(false);
              }}
              className={cn(
                "flex items-center px-4 py-2 text-sm w-full text-left",
                theme === 'system'
                  ? isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  : isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
                isDarkMode ? "text-gray-100" : "text-gray-700"
              )}
            >
              <Laptop className="h-4 w-4 mr-2" />
              System
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 