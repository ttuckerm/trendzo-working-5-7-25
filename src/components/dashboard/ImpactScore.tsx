'use client'

import { motion } from 'framer-motion'

export function ImpactScore() {
  const viralScore = 56
  const currentLevel = 3
  const levelProgress = 65

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <span>⚡</span> Your Impact
      </h2>
      
      <div className="space-y-6">
        {/* Viral Score Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10
                     transition-all duration-300 hover:border-purple-500/50"
        >
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#7b61ff', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ff61a6', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={339.292}
                  initial={{ strokeDashoffset: 339.292 }}
                  animate={{ strokeDashoffset: 339.292 - (339.292 * viralScore) / 100 }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold">{viralScore}</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Viral Score</h3>
            <p className="text-gray-400">You're on the rise! 📈</p>
          </div>
        </motion.div>

        {/* Level Progress Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10
                     transition-all duration-300 hover:border-purple-500/50"
        >
          <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span>🏆</span> Level {currentLevel}
          </h3>
          <p className="text-gray-400 mb-4">Rising Creator</p>
          
          <div className="space-y-4">
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
              />
            </div>
            <p className="text-sm text-gray-400">350 XP to Level 4</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
} 