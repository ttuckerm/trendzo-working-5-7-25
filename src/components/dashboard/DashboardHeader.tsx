'use client'

import { useNotification } from './NotificationProvider'
import { useConfetti } from '@/lib/hooks/useConfetti'

interface DashboardHeaderProps {
  userName: string
  streak: number
}

export function DashboardHeader({ userName, streak }: DashboardHeaderProps) {
  const { showNotification } = useNotification()
  const { triggerConfetti } = useConfetti()

  const handleStreakClick = () => {
    triggerConfetti()
    showNotification(`Amazing! ${streak} day streak! 🔥`)
  }

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 animate-slide-down">
      <div className="mb-4 sm:mb-0">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          Hi, {userName} 👋
        </h1>
        <p className="text-gray-400">Ready to create something amazing today?</p>
      </div>
      
      <button
        onClick={handleStreakClick}
        className="group flex items-center gap-4 bg-white/5 backdrop-blur-lg px-6 py-4 rounded-2xl border border-white/10 
                   transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 cursor-pointer"
      >
        <span className="text-3xl animate-pulse">🔥</span>
        <div>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {streak}
          </div>
          <div className="text-sm text-gray-400">day streak</div>
        </div>
      </button>
    </header>
  )
} 