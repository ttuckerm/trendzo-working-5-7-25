'use client'

import { useEffect, useRef } from 'react'

export function Starfield() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const starCount = 100
    const container = containerRef.current
    container.innerHTML = ''

    // Create style element for star animations with higher specificity
    const styleId = 'starfield-animations'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes starTwinkle {
          0%, 100% { 
            opacity: 0.3 !important; 
            transform: scale(1) !important;
          }
          50% { 
            opacity: 1 !important; 
            transform: scale(1.2) !important;
          }
        }
        .starfield-star {
          position: absolute !important;
          width: 2px !important;
          height: 2px !important;
          background: white !important;
          border-radius: 50% !important;
          animation: starTwinkle 3s infinite ease-in-out !important;
          pointer-events: none !important;
        }
      `
      document.head.appendChild(style)
    }

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div')
      star.className = 'starfield-star'
      
      // Set position
      star.style.left = `${Math.random() * 100}%`
      star.style.top = `${Math.random() * 100}%`
      
      // Set random animation timing
      const animationDelay = Math.random() * 3
      const animationDuration = 2 + Math.random() * 3
      
      star.style.animationDelay = `${animationDelay}s`
      star.style.animationDuration = `${animationDuration}s`
      
      // Force the animation properties with inline styles as backup
      star.style.cssText += `
        animation-name: starTwinkle !important;
        animation-iteration-count: infinite !important;
        animation-timing-function: ease-in-out !important;
      `
      
      container.appendChild(star)
    }

    return () => {
      // Cleanup: remove stars but keep the style for other instances
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  )
} 