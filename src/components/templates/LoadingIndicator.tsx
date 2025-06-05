'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function LoadingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center items-center py-12"
    >
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
            style={{
              boxShadow: '0 4px 20px rgba(123, 97, 255, 0.5)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
} 