'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNotification } from './NotificationProvider'
import { useConfetti } from '@/lib/hooks/useConfetti'

interface JourneyStep {
  id: number
  title: string
  description: string
  icon: string
  completed: boolean
}

export function ProgressJourney() {
  const { showNotification } = useNotification()
  const { triggerConfetti } = useConfetti()
  
  const [steps, setSteps] = useState<JourneyStep[]>([
    {
      id: 0,
      title: 'Pick your first template',
      description: 'Choose from trending options',
      icon: '✓',
      completed: true
    },
    {
      id: 1,
      title: 'Customize your brand',
      description: 'Add your unique style',
      icon: '✓',
      completed: true
    },
    {
      id: 2,
      title: 'Create your first video',
      description: 'Use AI to generate content',
      icon: '3',
      completed: false
    },
    {
      id: 3,
      title: 'Share your creation',
      description: 'Post and track performance',
      icon: '🎉',
      completed: false
    }
  ])

  const handleStepClick = (stepId: number) => {
    const step = steps[stepId]
    if (!step.completed) {
      setSteps(prevSteps => 
        prevSteps.map(s => 
          s.id === stepId ? { ...s, completed: true, icon: '✓' } : s
        )
      )
      
      triggerConfetti()
      
      const messages = [
        "Great choice! 🎉",
        "Your brand looks amazing! 💜",
        "First video created! You're crushing it! 🚀",
        "You're officially a creator! 🎉"
      ]
      
      showNotification(messages[stepId])
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const stepVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
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
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10"
    >
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <span>🎯</span> Your Journey
      </h2>
      
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step) => (
          <motion.div
            key={step.id}
            variants={stepVariants}
            whileHover={{ x: 5 }}
            onClick={() => handleStepClick(step.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 
                       transition-all duration-300 cursor-pointer hover:bg-white/10
                       ${step.completed ? 'border border-green-500/30' : ''}`}
          >
            <motion.div 
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                         ${step.completed 
                           ? 'bg-green-500 text-black' 
                           : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}
              animate={step.completed ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {step.icon}
            </motion.div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.description}</p>
            </div>
            
            {step.completed && (
              <motion.span 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-green-500"
              >
                ✓
              </motion.span>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  )
} 