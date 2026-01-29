'use client';

import React, { useState } from 'react';
import { Settings, Zap } from 'lucide-react';

interface UnifiedShellButtonProps {
  onToggle: () => void;
  isOpen: boolean;
}

/**
 * Floating button that triggers the unified shell modal
 * Designed to be non-intrusive and easily accessible
 */
export const UnifiedShellButton: React.FC<UnifiedShellButtonProps> = ({
  onToggle,
  isOpen
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-gradient-to-r from-blue-600 to-purple-600
        hover:from-blue-700 hover:to-purple-700
        shadow-lg hover:shadow-xl
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'rotate-180 scale-110' : 'hover:scale-110'}
        flex items-center justify-center
        text-white
        border-2 border-white/20
        backdrop-blur-sm
      `}
      aria-label={isOpen ? "Close Unified Shell" : "Open Unified Shell"}
    >
      {isOpen ? (
        <Settings 
          size={20} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} 
        />
      ) : (
        <Zap 
          size={20} 
          className={`transition-all duration-300 ${isHovered ? 'scale-110' : ''}`} 
        />
      )}
      
      {/* Pulse animation when closed */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
      )}
      
      {/* Tooltip */}
      {isHovered && !isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
          Unified Shell
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </button>
  );
};