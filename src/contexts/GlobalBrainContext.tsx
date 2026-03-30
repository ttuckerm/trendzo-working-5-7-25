"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useBrain } from '@/features/Brain/useBrain'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
}

interface ScreenContext {
  route: string
  pageName: string
  visibleData: any
  activeElements: string[]
  timestamp: Date
}

interface GlobalBrainContextType {
  // Chat state
  messages: Message[]
  isLoading: boolean
  error: string | null
  isOpen: boolean
  
  // Screen context
  currentContext: ScreenContext | null
  
  // Actions
  sendMessage: (message: string) => Promise<void>
  clearMessages: () => void
  toggleChat: () => void
  openChat: () => void
  closeChat: () => void
  updateScreenContext: (context: Partial<ScreenContext>) => void
}

const GlobalBrainContext = createContext<GlobalBrainContextType | undefined>(undefined)

interface GlobalBrainProviderProps {
  children: React.ReactNode
}

export function GlobalBrainProvider({ children }: GlobalBrainProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentContext, setCurrentContext] = useState<ScreenContext | null>(null)
  
  // Use the existing brain hook
  const { messages, isLoading, error, sendMessage: originalSendMessage, clearMessages } = useBrain()

  // Enhanced send message with screen context
  const sendMessage = useCallback(async (message: string) => {
    await originalSendMessage(message, currentContext)
  }, [currentContext, originalSendMessage])

  // Chat controls
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const openChat = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Screen context management
  const updateScreenContext = useCallback((context: Partial<ScreenContext>) => {
    setCurrentContext(prev => ({
      route: context.route || prev?.route || window.location.pathname,
      pageName: context.pageName || prev?.pageName || 'Unknown Page',
      visibleData: context.visibleData || prev?.visibleData || {},
      activeElements: context.activeElements || prev?.activeElements || [],
      timestamp: new Date()
    }))
  }, [])

  // Auto-update route context on route changes
  useEffect(() => {
    const updateRoute = () => {
      const path = window.location.pathname
      const pageName = getPageNameFromRoute(path)
      updateScreenContext({ route: path, pageName })
    }

    updateRoute()
    window.addEventListener('popstate', updateRoute)
    
    return () => window.removeEventListener('popstate', updateRoute)
  }, [updateScreenContext])

  // Persist chat state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('globalBrainState')
    if (savedState) {
      try {
        const { isOpen: savedIsOpen } = JSON.parse(savedState)
        setIsOpen(savedIsOpen)
      } catch (error) {
        console.warn('Failed to restore brain state:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('globalBrainState', JSON.stringify({ isOpen }))
  }, [isOpen])

  const value: GlobalBrainContextType = {
    // Chat state
    messages: messages as Message[],
    isLoading,
    error,
    isOpen,
    
    // Screen context
    currentContext,
    
    // Actions
    sendMessage,
    clearMessages,
    toggleChat,
    openChat,
    closeChat,
    updateScreenContext
  }

  return (
    <GlobalBrainContext.Provider value={value}>
      {children}
    </GlobalBrainContext.Provider>
  )
}

export function useGlobalBrain() {
  const context = useContext(GlobalBrainContext)
  if (context === undefined) {
    throw new Error('useGlobalBrain must be used within a GlobalBrainProvider')
  }
  return context
}

// Helper function to extract page name from route
function getPageNameFromRoute(route: string): string {
  const routeMap: Record<string, string> = {
    '/admin': 'Admin Dashboard',
    '/admin/ai-brain': 'AI Brain Interface',
    '/admin/pipeline-dashboard': 'Pipeline Dashboard',
    '/admin/templates': 'Template Management',
    '/admin/analytics': 'Analytics',
    '/admin/system-settings': 'System Settings',
    '/admin/users': 'User Management',
  }

  // Check exact matches first
  if (routeMap[route]) {
    return routeMap[route]
  }

  // Check partial matches
  for (const [routePattern, name] of Object.entries(routeMap)) {
    if (route.startsWith(routePattern)) {
      return name
    }
  }

  // Fallback: convert route to readable name
  return route
    .split('/')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
    .join(' > ')
}