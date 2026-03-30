'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PathCardProps {
  type: 'manual' | 'ai-templates';
  icon: string;
  title: string;
  description: string;
  features: string[];
  onClick: () => void;
  isRecommended?: boolean;
}

export default function PathCard({ 
  type, 
  icon, 
  title, 
  description, 
  features, 
  onClick,
  isRecommended = false 
}: PathCardProps) {
  return (
    <motion.div
      className={cn(
        "path-card relative overflow-hidden w-full lg:w-96 text-left cursor-pointer",
        "bg-white/[0.03] backdrop-blur-[20px] border-2 border-white/10 rounded-3xl p-8 lg:p-10",
        "transition-all duration-400 ease-out flex-1 lg:flex-none",
        type === 'manual' 
          ? "hover:bg-[#7b61ff]/10 hover:border-[#7b61ff]/50" 
          : "hover:bg-[#00ff00]/10 hover:border-[#00ff00]/50"
      )}
      onClick={onClick}
      animate={
        type === 'manual' 
          ? {
              x: [0, -8, 8, 0]
            }
          : {
              scale: [1, 1.02, 1],
              boxShadow: [
                "0 0 20px rgba(0, 255, 0, 0.3)",
                "0 0 40px rgba(0, 255, 0, 0.6)",
                "0 0 20px rgba(0, 255, 0, 0.3)"
              ]
            }
      }
      transition={
        type === 'manual'
          ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
          : { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
      whileHover={{
        y: -10,
        boxShadow: "0 20px 60px rgba(123, 97, 255, 0.4)"
      }}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute top-5 right-5 bg-gradient-to-r from-[#ff6b6b] to-[#f06292] px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider">
          Recommended
        </div>
      )}
      
      {/* Icon */}
      <div 
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-8",
          type === 'manual' 
            ? "bg-gradient-to-br from-[#7b61ff] to-[#ff61a6]"
            : "bg-gradient-to-br from-[#00ff00] to-[#00cc00]"
        )}
      >
        {icon}
      </div>
      
      {/* Title */}
      <h3 className="text-2xl lg:text-3xl font-bold mb-4">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-white/70 mb-6 leading-relaxed">
        {description}
      </p>
      
      {/* Features */}
      <div className="flex flex-wrap gap-2">
        {features.map((feature, index) => (
          <span
            key={index}
            className={cn(
              "px-3 py-1.5 rounded-2xl text-xs font-semibold uppercase tracking-wide",
              type === 'ai-templates'
                ? "bg-[#00ff00]/20 text-[#00ff00]"
                : "bg-white/10 text-white"
            )}
          >
            {feature}
          </span>
        ))}
      </div>
    </motion.div>
  );
}