'use client'

import { useCallback } from 'react'

export function useConfetti() {
  const triggerConfetti = useCallback(() => {
    const colors = ['#7b61ff', '#ff61a6', '#00ff00', '#ffeb3b', '#00bcd4']
    const confettiCount = 50
    
    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div')
        confetti.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}%;
          top: -10px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          animation: confettiFall 3s linear forwards;
        `
        document.body.appendChild(confetti)
        
        setTimeout(() => confetti.remove(), 3000)
      }, i * 20)
    }
    
    // Add the animation if it doesn't exist
    if (!document.querySelector('#confetti-animation')) {
      const style = document.createElement('style')
      style.id = 'confetti-animation'
      style.textContent = `
        @keyframes confettiFall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return { triggerConfetti }
} 