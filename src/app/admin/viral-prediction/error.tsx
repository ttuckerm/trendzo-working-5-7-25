'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to your error reporting service
    console.error('Viral Prediction Dashboard Error:', error);
    
    // Filter out @stagewise/toolbar errors that don't affect functionality
    if (error.message?.includes('@stagewise/toolbar') || 
        error.message?.includes('signal is aborted without reason')) {
      // These are development tool errors that don't break the app
      return;
    }
  }, [error]);

  // Don't show error UI for @stagewise/toolbar issues
  if (error.message?.includes('@stagewise/toolbar') || 
      error.message?.includes('signal is aborted without reason')) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000 0%, #111 50%, #000 100%)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <motion.div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '3rem',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '500px'
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          style={{ fontSize: '4rem', marginBottom: '1rem' }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚡
        </motion.div>
        
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: '700',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #FF6B9D, #C147E9)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Oops! Something went wrong
        </h2>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '2rem',
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          Don't worry, our viral intelligence is still working. Let's get you back on track.
        </p>
        
        <motion.button
          onClick={reset}
          style={{
            background: 'linear-gradient(135deg, #FF6B9D, #C147E9)',
            border: 'none',
            borderRadius: '16px',
            padding: '1rem 2rem',
            color: '#fff',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          🚀 Try Again
        </motion.button>
      </motion.div>
    </div>
  );
}