"use client";

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext'; // Assuming ThemeContext is in src/contexts
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { Moon, Sun } from 'lucide-react';

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === 'light' ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
}; 