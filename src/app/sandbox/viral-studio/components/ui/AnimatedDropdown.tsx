'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  key: string;
  label: string;
  description?: string;
}

interface AnimatedDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (option: DropdownOption) => void;
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function AnimatedDropdown({
  options,
  selectedValue,
  onSelect,
  placeholder,
  isOpen,
  onToggle,
  variant = 'primary',
  className = ''
}: AnimatedDropdownProps) {
  const selectedOption = options.find(option => option.key === selectedValue);
  
  const colorClasses = {
    primary: {
      selected: 'bg-[#7b61ff]/10 border-[#7b61ff]/50 text-white',
      default: 'bg-white/[0.03] border-white/20 text-white/70 hover:border-white/40',
      dropdown: 'hover:bg-[#7b61ff]/10',
    },
    secondary: {
      selected: 'bg-[#00ff00]/10 border-[#00ff00]/50 text-white',
      default: 'bg-white/[0.03] border-white/20 text-white/70 hover:border-white/40',
      dropdown: 'hover:bg-[#00ff00]/10',
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={onToggle}
        className={`
          w-full max-w-md mx-auto relative flex items-center justify-between
          px-6 py-4 rounded-2xl border-2 transition-all duration-300
          ${selectedValue 
            ? colorClasses[variant].selected
            : colorClasses[variant].default
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-lg">
          {selectedOption?.label || placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-md bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-50 max-h-80 overflow-y-auto"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.key}
                onClick={() => onSelect(option)}
                className={`w-full px-6 py-4 text-left ${colorClasses[variant].dropdown} transition-colors duration-200 border-b border-white/5 last:border-b-0`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ x: 5 }}
              >
                <div className="text-white font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-white/60 text-sm mt-1">{option.description}</div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}