'use client'

import { useState } from 'react'
import { useNotification } from './NotificationProvider'
import { useConfetti } from '@/lib/hooks/useConfetti'
import { motion } from 'framer-motion'

interface TeamMember {
  initials: string
  gradient: string
}

const teamMembers: TeamMember[] = [
  { initials: 'JD', gradient: 'from-indigo-500 to-purple-600' },
  { initials: 'MK', gradient: 'from-pink-500 to-rose-600' },
  { initials: 'SL', gradient: 'from-blue-500 to-cyan-500' },
]

export function QuickStartVideo() {
  const { showNotification } = useNotification()
  const { triggerConfetti } = useConfetti()
  const [completedSteps, setCompletedSteps] = useState([true, false, false])
  const [currentStep, setCurrentStep] = useState(1)

  const handlePlayVideo = () => {
    showNotification('Starting your viral journey... 🎬')
    triggerConfetti()
  }

  const handleGetStarted = () => {
    showNotification("Welcome to TTT! Let's make you go viral! 🚀")
    triggerConfetti()
    
    if (currentStep === 1) {
      setCompletedSteps([true, true, false])
      setCurrentStep(2)
    }
  }

  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-purple-500/30 to-purple-600/60 pointer-events-none" />
        
        <div className="relative p-8 lg:p-12 z-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <h2 className="text-5xl lg:text-6xl font-bold leading-tight mb-4 lg:mb-0">
              <span className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                Kickstart<br />Your Viral Journey
              </span>
            </h2>
            
            <button
              onClick={handlePlayVideo}
              className="group relative transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]"
            >
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="39" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                <polygon points="32,25 32,55 52,40" fill="white"/>
              </svg>
            </button>
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <MetricCircle value={56} label="Quick Start" gradient="greenGradient" />
            <MetricCircle value={56} label={["Impact", "Score"]} gradient="purpleGradient" />
          </div>
          
          {/* Quick Steps */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🚀</span> Quick start
            </h3>
            <div className="space-y-3">
              {['Pick your video', 'Edit your video', 'Share your creation'].map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                    completedSteps[index] 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : currentStep === index 
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-white/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    completedSteps[index] ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {completedSteps[index] ? '✓' : index + 1}
                  </div>
                  <span className="flex-1">{step}</span>
                  <span className="text-gray-400">
                    {completedSteps[index] ? '✓' : '•'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Get Started Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-green-400 to-green-600 text-black px-8 py-4 rounded-full font-bold text-lg
                         transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/50"
            >
              Get Started
            </button>
          </div>
          
          {/* Teammates Section */}
          <div className="flex items-center justify-center gap-8 p-6 bg-white/5 rounded-2xl">
            <div className="flex -space-x-3">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.gradient} 
                              flex items-center justify-center text-white font-bold text-sm
                              border-2 border-black`}
                >
                  {member.initials}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center 
                              border-2 border-black text-sm">
                +9
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-400">teammates</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                12
              </p>
              <p className="text-sm text-gray-400">worldwide</p>
            </div>
          </div>
          
          {/* Bottom Metrics */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10
                             transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5">
              <span>📅</span>
              <span className="text-gray-300">Start your free trial</span>
              <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">7</span>
            </button>
            
            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10
                             transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5">
              <span>💜</span>
              <span className="text-gray-300">Share your progress</span>
            </button>
          </div>
          
          {/* Impact Score Footer */}
          <div className="text-center mt-8 pt-8 border-t border-white/10">
            <h3 className="text-xl text-gray-400">Your Impact Score</h3>
          </div>
        </div>
      </div>
      
      {/* SVG Gradients */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#00ff88', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#00cc66', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#7b61ff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#ff61a6', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
    </motion.section>
  )
}

interface MetricCircleProps {
  value: number
  label: string | string[]
  gradient: string
}

function MetricCircle({ value, label, gradient }: MetricCircleProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24">
        <svg width="100" height="100" className="absolute inset-0">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke={`url(#${gradient})`} 
            strokeWidth="6" 
            strokeDasharray="283" 
            strokeDashoffset="125" 
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">
          {value}
        </div>
      </div>
      <div className="flex flex-col">
        {Array.isArray(label) ? (
          label.map((line, index) => (
            <p key={index} className="text-sm text-gray-400">{line}</p>
          ))
        ) : (
          <p className="text-sm text-gray-400">{label}</p>
        )}
      </div>
    </div>
  )
} 