// src/components/StrategyScreen.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGlobalState } from '@/context/GlobalState';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const StrategyScreen = () => {
  const { dispatch } = useGlobalState();
  const [niche, setNiche] = useState('');
  const [goal, setGoal] = useState('');

  const handleProceed = () => {
    if (niche && goal) {
      dispatch({ type: 'SET_STRATEGY', payload: { niche, goal } });
      dispatch({ type: 'NEXT_PHASE' });
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-screen p-8 text-white"
    >
      <motion.h1 variants={itemVariants} className="text-5xl font-bold mb-4 text-center">Let’s customise your viral strategy</motion.h1>
      <motion.p variants={itemVariants} className="text-xl text-gray-400 mb-12 text-center">A few quick questions to personalize your experience</motion.p>

      <motion.div variants={itemVariants} className="w-full max-w-md space-y-8">
        {/* Niche Selection */}
        <div className="relative">
          <label className="block text-lg font-semibold mb-2 text-center">What's your niche?</label>
          <select 
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="w-full p-4 bg-gray-800/60 border-2 border-gray-700 rounded-lg appearance-none focus:outline-none focus:border-purple-500"
          >
            <option value="" disabled>Select your niche</option>
            <option value="personal-finance">Personal Finance/Investing</option>
            <option value="fitness">Fitness/Weight Loss</option>
            <option value="business">Business/Entrepreneurship</option>
            <option value="food">Food/Nutrition Comparisons</option>
          </select>
        </div>

        {/* Goal Selection */}
        {niche && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
            <label className="block text-lg font-semibold mb-2 text-center">What's your main goal?</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full p-4 bg-gray-800/60 border-2 border-gray-700 rounded-lg appearance-none focus:outline-none focus:border-purple-500"
            >
              <option value="" disabled>Select your goal</option>
              <option value="sales">Drive Sales</option>
              <option value="brand">Build Brand Awareness</option>
              <option value="followers">Grow Followers</option>
            </select>
          </motion.div>
        )}
        
        {/* Continue Button */}
        {niche && goal && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProceed}
            className="w-full p-4 bg-green-600 rounded-lg text-xl font-bold uppercase tracking-wider"
          >
            View Viral Templates
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};
