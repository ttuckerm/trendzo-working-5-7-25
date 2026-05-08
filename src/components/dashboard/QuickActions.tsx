'use client'

import { motion } from 'framer-motion'
import { useNotification } from './NotificationProvider'
import { useRouter } from 'next/navigation'

interface ActionCard {
  id: string
  icon: string
  title: string
  subtitle: string
  route?: string
}

const actionCards: ActionCard[] = [
  {
    id: 'template',
    icon: '📱',
    title: 'Browse Templates',
    subtitle: '2 new trending',
    route: '/templates-browse'
  },
  {
    id: 'create',
    icon: '✨',
    title: 'Create Video',
    subtitle: 'AI-powered',
    route: '/editor'
  },
  {
    id: 'remix',
    icon: '🎨',
    title: 'Remix Studio',
    subtitle: 'Premium',
    route: '/remix'
  },
  {
    id: 'analytics',
    icon: '📊',
    title: 'Analytics',
    subtitle: 'Track growth',
    route: '/analytics'
  }
]

export function QuickActions() {
  const { showNotification } = useNotification()
  const router = useRouter()

  const handleAction = (action: ActionCard) => {
    const messages: Record<string, string> = {
      template: "Loading trending templates... 🚀",
      create: "Starting AI creator... ✨",
      remix: "Opening Remix Studio... 🎨",
      analytics: "Analyzing your growth... 📊"
    }
    
    showNotification(messages[action.id])
    
    if (action.route) {
      setTimeout(() => {
        router.push(action.route)
      }, 500)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10"
    >
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <span>🚀</span> Quick Start
      </h2>
      
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {actionCards.map((card) => (
          <motion.button
            key={card.id}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction(card)}
            className="relative bg-white/5 border border-white/10 rounded-2xl p-6 text-center
                       transition-all duration-300 hover:border-purple-500/50 group overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 
                            group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
            
            <div className="relative z-10">
              <div className="text-5xl mb-2 filter drop-shadow-[0_0_20px_currentColor] 
                              group-hover:drop-shadow-[0_0_30px_currentColor] transition-all duration-300">
                {card.icon}
              </div>
              <h3 className="font-semibold mb-1">{card.title}</h3>
              <p className="text-sm text-gray-400">{card.subtitle}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </motion.section>
  )
} 