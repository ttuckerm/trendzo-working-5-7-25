// src/components/EntryScreen.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGlobalState } from '@/context/GlobalState';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.2,
      duration: 0.5,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const EntryScreen = () => {
  const { dispatch } = useGlobalState();

  const handleNextPhase = () => {
    dispatch({ type: 'NEXT_PHASE' });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-screen p-8 text-white"
    >
      <motion.h1 
        variants={itemVariants} 
        className="text-5xl font-bold mb-4 text-center"
      >
        How would you like to create viral content?
      </motion.h1>
      <motion.p 
        variants={itemVariants} 
        className="text-xl text-gray-400 mb-12 text-center"
      >
        Select your starting point to begin.
      </motion.p>
      
      <motion.div
        variants={itemVariants}
        className="grid md:grid-cols-2 gap-8 w-full max-w-4xl"
      >
        <motion.div
          whileHover={{ y: -10, boxShadow: '0 20px 30px -10px rgba(76, 175, 80, 0.3)' }}
          className="bg-gray-800/50 border border-green-500/50 rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center"
          onClick={handleNextPhase}
        >
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-3xl font-bold mb-2">AI Templates</h2>
          <p className="text-gray-400">
            Start with proven, data-driven templates.
          </p>
        </motion.div>
        
        <motion.div
          whileHover={{ y: -10, boxShadow: '0 20px 30px -10px rgba(96, 125, 139, 0.3)' }}
          className="bg-gray-800/50 border border-gray-600/50 rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center"
        >
          <div className="text-5xl mb-4">✍️</div>
          <h2 className="text-3xl font-bold mb-2">Start from Scratch</h2>
          <p className="text-gray-400">
            Begin with a blank canvas and build your own.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
