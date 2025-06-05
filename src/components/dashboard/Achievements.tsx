'use client'

import { motion } from 'framer-motion'

interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
}

const achievements: Achievement[] = [
  {
    id: 'first-video',
    icon: '🎬',
    title: 'First Video',
    description: 'Created your first video',
    unlocked: true
  },
  {
    id: 'on-fire',
    icon: '🔥',
    title: 'On Fire!',
    description: '7 day streak',
    unlocked: true
  },
  {
    id: 'viral-vision',
    icon: '👁️',
    title: 'Viral Vision',
    description: 'Get 10K+ views',
    unlocked: false
  },
  {
    id: 'rocket-launch',
    icon: '🚀',
    title: 'Rocket Launch',
    description: 'Reach 100 followers',
    unlocked: false
  }
]

export function Achievements() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <span>🏅</span> Recent Achievements
      </h2>
      
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`relative bg-white/5 backdrop-blur-lg rounded-2xl p-6 text-center
                       transition-all duration-300 overflow-hidden group
                       ${achievement.unlocked 
                         ? 'border border-green-500/30 bg-green-500/5' 
                         : 'border border-white/10'}`}
          >
            {/* Hover effect gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 
                            group-hover:from-purple-500/10 group-hover:to-pink-500/10 
                            transition-all duration-300 pointer-events-none" />
            
            <motion.div 
              className={`text-5xl mb-3 relative z-10 ${
                achievement.unlocked 
                  ? 'filter-none opacity-100' 
                  : 'filter grayscale opacity-30'
              }`}
              animate={achievement.unlocked ? { rotate: [0, 360] } : {}}
              transition={{ duration: 0.6 }}
            >
              {achievement.icon}
            </motion.div>
            
            <h3 className="font-semibold mb-1 relative z-10">{achievement.title}</h3>
            <p className="text-sm text-gray-400 relative z-10">{achievement.description}</p>
            
            {achievement.unlocked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full 
                           flex items-center justify-center text-black text-xs font-bold"
              >
                ✓
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  )
} 