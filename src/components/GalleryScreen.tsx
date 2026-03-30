// src/components/GalleryScreen.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGlobalState } from '@/context/GlobalState';

const dummyTemplates = [
  { id: '1', title: 'Transformation Reveal', score: '96%' },
  { id: '2', title: '30-Day Challenge', score: '92%' },
  { id: '3', title: 'Quick Workout', score: '94%' },
  { id: '4', title: 'Before/After Journey', score: '98%' },
  { id: '5', title: 'Day in My Business', score: '91%' },
  { id: '6', title: 'Revenue Reveal', score: '97%' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export const GalleryScreen = () => {
  const { dispatch } = useGlobalState();

  const handleSelectTemplate = (templateId: string) => {
    dispatch({ type: 'SELECT_TEMPLATE', payload: templateId });
    dispatch({ type: 'NEXT_PHASE' });
  };

  return (
    <motion.div 
      className="p-8 min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className="text-4xl font-bold text-white text-center mb-12">Choose Your Template</h1>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
      >
        {dummyTemplates.map((template) => (
          <motion.div
            key={template.id}
            className="bg-gray-800/70 border border-purple-500/50 rounded-xl p-6 cursor-pointer"
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5, boxShadow: '0 10px 20px rgba(139, 92, 246, 0.3)' }}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <h2 className="text-2xl font-bold text-white mb-2">{template.title}</h2>
            <p className="text-lg text-green-400 font-semibold">Viral Score: {template.score}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};
