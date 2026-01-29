// src/components/AnalysisScreen.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGlobalState } from '@/context/GlobalState';

export const AnalysisScreen = () => {
  const { state, dispatch } = useGlobalState();

  const handleProceed = () => {
    dispatch({ type: 'NEXT_PHASE' });
  };
  
  const handleGoBack = () => {
    dispatch({ type: 'PREVIOUS_PHASE' });
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen text-white p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1 className="text-4xl font-bold mb-4">Analysis Phase</h1>
      <p className="text-xl mb-8">Selected Template ID: {state.selectedTemplate || 'None'}</p>
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoBack}
          className="px-8 py-3 bg-gray-600 rounded-lg text-lg font-bold"
        >
          Back to Gallery
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleProceed}
          className="px-8 py-3 bg-green-600 rounded-lg text-lg font-bold"
        >
          PROCEED TO CREATION PHASE →
        </motion.button>
      </div>
    </motion.div>
  );
};
