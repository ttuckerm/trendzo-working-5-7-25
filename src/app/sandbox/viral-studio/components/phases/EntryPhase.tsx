'use client';

import React from 'react';
import { motion } from 'framer-motion';
import PathCard from '../ui/PathCard';

interface EntryPhaseProps {
  onPathSelect: (path: 'ai-templates' | 'from-scratch') => void;
}

export default function EntryPhase({ onPathSelect }: EntryPhaseProps) {
  const handlePathSelection = (path: 'ai-templates' | 'manual') => {
    if (path === 'ai-templates') {
      onPathSelect('ai-templates');
    } else {
      // For manual analysis path (not implemented in this demo)
      console.log('Manual analysis path selected');
      onPathSelect('from-scratch');
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="text-center max-w-4xl w-full">
        {/* Main Title */}
        <motion.h1 
          className="text-7xl font-bold mb-5 bg-gradient-to-br from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent"
          animate={{ 
            opacity: [0.8, 1, 0.8] 
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          How would you like to create viral content?
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p 
          className="text-xl text-white/70 mb-16"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Choose your path to viral success
        </motion.p>
        
        {/* Path Options */}
        <motion.div 
          className="flex gap-8 justify-center items-stretch flex-col lg:flex-row max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <PathCard
            type="manual"
            icon="📊"
            title="Manual Analysis"
            description="Upload videos → instant success prediction"
            features={["Upload & Analyze", "Success Prediction", "Performance Metrics"]}
            onClick={() => handlePathSelection('manual')}
          />
          
          <PathCard
            type="ai-templates"
            icon="🤖"
            title="AI Templates"
            description="Access today's proven viral templates"
            features={["Viral Templates", "Niche-Specific", "Instant Results"]}
            onClick={() => handlePathSelection('ai-templates')}
            isRecommended={true}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}