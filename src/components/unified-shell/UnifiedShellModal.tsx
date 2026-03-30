'use client';

import React, { useState, useEffect } from 'react';
import { X, Focus, Layers, Presentation } from 'lucide-react';

// Mode components (will be created next)
import { FocusMode } from './modes/FocusMode';
import { DeepDiveMode } from './modes/DeepDiveMode';
import { DemoMode } from './modes/DemoMode';

export type UnifiedShellMode = 'focus' | 'deepdive' | 'demo';

interface UnifiedShellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Main unified shell modal component
 * Implements progressive disclosure with three modes:
 * - Focus: Daily workflow essentials
 * - Deep Dive: Full system access
 * - Demo: Presentation mode
 */
export const UnifiedShellModal: React.FC<UnifiedShellModalProps> = ({
  isOpen,
  onClose
}) => {
  const [currentMode, setCurrentMode] = useState<UnifiedShellMode>('focus');
  const [isVisible, setIsVisible] = useState(false);

  // Handle modal open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  const modeConfigs = {
    focus: {
      icon: Focus,
      title: 'Focus Mode',
      description: 'Essential workflows & quick actions',
      color: 'from-green-500 to-emerald-500'
    },
    deepdive: {
      icon: Layers,
      title: 'Deep Dive',
      description: 'Full system access & analytics',
      color: 'from-blue-500 to-cyan-500'
    },
    demo: {
      icon: Presentation,
      title: 'Demo Mode',
      description: 'Presentation & stakeholder view',
      color: 'from-purple-500 to-pink-500'
    }
  };

  const renderModeContent = () => {
    switch (currentMode) {
      case 'focus':
        return <FocusMode />;
      case 'deepdive':
        return <DeepDiveMode />;
      case 'demo':
        return <DemoMode />;
      default:
        return <FocusMode />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-50
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={`
          fixed inset-4 z-50
          bg-gray-900/95 backdrop-blur-xl
          rounded-2xl border border-gray-700/50
          shadow-2xl
          transform transition-all duration-300 ease-out
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
          }
          flex flex-col
          max-w-7xl mx-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">US</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Unified Shell</h1>
              <p className="text-sm text-gray-400">Smart Progressive Disclosure Interface</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Close Unified Shell"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 py-4 border-b border-gray-700/50">
          <div className="flex space-x-2">
            {Object.entries(modeConfigs).map(([mode, config]) => {
              const Icon = config.icon;
              const isActive = currentMode === mode;
              
              return (
                <button
                  key={mode}
                  onClick={() => setCurrentMode(mode as UnifiedShellMode)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive 
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg scale-105` 
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <div className="text-left">
                    <div className="font-medium text-sm">{config.title}</div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                      {config.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            {renderModeContent()}
          </div>
        </div>
      </div>
    </>
  );
};