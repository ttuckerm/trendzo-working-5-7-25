'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000 0%, #111 50%, #000 100%)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(255, 20, 147, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(0, 255, 127, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(138, 43, 226, 0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }}></div>

      <motion.div
        style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated loading icon */}
        <motion.div
          style={{
            fontSize: '4rem',
            marginBottom: '2rem',
            display: 'inline-block'
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity }
          }}
        >
          ✨
        </motion.div>

        {/* Loading text */}
        <motion.h2
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FF6B9D, #C147E9, #00D4FF)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            letterSpacing: '-0.02em'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Initializing Viral Intelligence
        </motion.h2>

        {/* Loading description */}
        <motion.p
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.1rem',
            fontWeight: '500',
            margin: '0 0 2rem 0'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Preparing your viral prediction dashboard...
        </motion.p>

        {/* Animated progress dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B9D, #C147E9)'
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}