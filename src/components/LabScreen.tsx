// src/components/LabScreen.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGlobalState } from '@/context/GlobalState';

export const LabScreen = () => {
  const { state, dispatch } = useGlobalState();

  const handleStartOver = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen text-white p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1 className="text-4xl font-bold mb-4">The Lab</h1>
      <p className="text-xl mb-8">This is where the 3-phase creation UI will be built.</p>
      <p className="text-lg mb-8">Niche: {state.userNiche} | Goal: {state.userGoal} | Template: {state.selectedTemplate}</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStartOver}
        className="px-8 py-3 bg-red-600 rounded-lg text-lg font-bold"
      >
        Start Over
      </motion.button>
    </motion.div>
  );
};
