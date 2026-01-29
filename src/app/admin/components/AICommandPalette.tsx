'use client'

import React, { useState, useEffect } from 'react'

interface CommandItem {
  id: string
  icon: string
  title: string
  description: string
  shortcut: string
}

const commandSuggestions: CommandItem[] = [
  {
    id: 'top-predictions',
    icon: '📊',
    title: "Show me today's top predictions",
    description: 'View videos with highest viral probability',
    shortcut: '⌘1'
  },
  {
    id: 'analyze-video',
    icon: '🔍',
    title: 'Analyze a video URL',
    description: 'Get instant viral prediction for any video',
    shortcut: '⌘A'
  },
  {
    id: 'performance-report',
    icon: '📈',
    title: 'Generate performance report',
    description: 'Weekly analytics and insights summary',
    shortcut: '⌘R'
  },
  {
    id: 'trending-templates',
    icon: '🎯',
    title: 'Find trending templates',
    description: "Discover what's working right now",
    shortcut: '⌘T'
  }
]

export default function AICommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchValue('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOverlayClick = () => {
    setIsOpen(false)
    setSearchValue('')
  }

  const handleCommandClick = (command: CommandItem) => {
    // TODO: Implement command execution
    console.log(`Executing command: ${command.id}`)
    setIsOpen(false)
    setSearchValue('')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="overlay fixed inset-0 bg-black/60 opacity-100 visible transition-all duration-300 z-[999]"
        onClick={handleOverlayClick}
      />
      
      {/* Command Palette */}
      <div className="ai-command-palette fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[400px] bg-black/95 backdrop-blur-[20px] border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] opacity-100 visible scale-100 transition-all duration-300 z-[1000]">
        {/* Command Input */}
        <input
          type="text"
          className="command-input w-full p-5 bg-transparent border-none border-b border-white/10 text-white text-lg outline-none placeholder-[#666]"
          placeholder="Ask me anything or type a command..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          autoFocus
        />
        
        {/* Command Suggestions */}
        <div className="command-suggestions py-4 max-h-[300px] overflow-y-auto">
          {commandSuggestions.map((command) => (
            <div
              key={command.id}
              onClick={() => handleCommandClick(command)}
              className="command-item px-6 py-3 cursor-pointer transition-colors duration-200 flex items-center gap-4 hover:bg-white/5"
            >
              <div className="command-icon w-8 h-8 bg-[rgba(229,9,20,0.2)] rounded-lg flex items-center justify-center text-sm">
                {command.icon}
              </div>
              <div className="command-text flex-1">
                <div className="command-title text-sm font-medium mb-0.5">
                  {command.title}
                </div>
                <div className="command-description text-xs text-[#666]">
                  {command.description}
                </div>
              </div>
              <span className="command-shortcut px-2 py-1 bg-white/10 rounded text-[11px] font-mono">
                {command.shortcut}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
} 