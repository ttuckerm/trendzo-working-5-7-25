'use client'

import { motion } from 'framer-motion'
import { useNotification } from './NotificationProvider'
import { useConfetti } from '@/lib/hooks/useConfetti'
import { useRouter } from 'next/navigation'

export function FloatingActionButton() {
  const { showNotification } = useNotification()
  const { triggerConfetti } = useConfetti()
  const router = useRouter()

  const handleClick = () => {
    showNotification("Let's create something viral! 🚀")
    triggerConfetti()
    
    setTimeout(() => {
      router.push('/editor')
    }, 500)
  }

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 
                 flex items-center justify-center text-white text-2xl font-bold
                 shadow-xl shadow-purple-500/50 cursor-pointer z-50
                 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/70"
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut'
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <span>+</span>
    </motion.button>
  )
} 