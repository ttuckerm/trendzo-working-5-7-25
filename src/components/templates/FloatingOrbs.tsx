'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function FloatingOrbs() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const orbs = [
    {
      id: 1,
      size: 'w-64 h-64',
      color: 'from-purple-500/20 to-pink-500/20',
      initialX: '10%',
      initialY: '20%',
      duration: 20,
      parallax: 0.1,
    },
    {
      id: 2,
      size: 'w-96 h-96',
      color: 'from-blue-500/15 to-purple-500/15',
      initialX: '70%',
      initialY: '60%',
      duration: 25,
      parallax: 0.15,
    },
    {
      id: 3,
      size: 'w-48 h-48',
      color: 'from-pink-500/25 to-rose-500/25',
      initialX: '80%',
      initialY: '10%',
      duration: 18,
      parallax: 0.08,
    },
    {
      id: 4,
      size: 'w-80 h-80',
      color: 'from-cyan-500/10 to-blue-500/10',
      initialX: '20%',
      initialY: '80%',
      duration: 30,
      parallax: 0.12,
    },
    {
      id: 5,
      size: 'w-56 h-56',
      color: 'from-violet-500/20 to-purple-500/20',
      initialX: '50%',
      initialY: '40%',
      duration: 22,
      parallax: 0.09,
    },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className={`absolute ${orb.size} rounded-full bg-gradient-to-br ${orb.color} blur-xl`}
          style={{
            left: orb.initialX,
            top: orb.initialY,
            transform: `translateY(${scrollY * orb.parallax}px)`,
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.id * 2,
          }}
        />
      ))}
      
      {/* Additional ambient particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 bg-white/10 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.1, 0.6, 0.1],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
} 