"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

// Define subscription tiers
export type SubscriptionTier = 'free' | 'premium' | 'business'

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development'

// Context interface
interface SubscriptionContextType {
  tier: SubscriptionTier
  isLoading: boolean
  hasPremium: boolean
  hasBusiness: boolean
  canAccess: (requiredTier: SubscriptionTier) => boolean
  upgradeSubscription: (newTier: SubscriptionTier) => Promise<boolean>
  isUpgrading: boolean
  setMockSubscriptionStatus: (newTier: SubscriptionTier) => void
}

// Create the context with default values
const SubscriptionContext = createContext<SubscriptionContextType>({
  tier: isDev ? 'business' : 'free',
  isLoading: true,
  hasPremium: isDev,
  hasBusiness: isDev,
  canAccess: () => isDev,
  upgradeSubscription: async () => false,
  isUpgrading: false,
  setMockSubscriptionStatus: () => {}
})

// Provider component
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tier, setTier] = useState<SubscriptionTier>(isDev ? 'business' : 'free')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)

  // For testing purposes in development
  const setMockSubscriptionStatus = (newTier: SubscriptionTier) => {
    if (isDev) {
      console.log('Setting mock subscription status:', newTier)
      setTier(newTier)
    } else {
      console.warn('Mock subscription status can only be set in development mode')
    }
  }

  // Check if user has premium access
  const hasPremium = tier === 'premium' || tier === 'business'

  // Check if user has business access
  const hasBusiness = tier === 'business'

  // Check if user can access a specific tier
  const canAccess = (requiredTier: SubscriptionTier): boolean => {
    if (isDev) return true
    
    switch (requiredTier) {
      case 'free':
        return true
      case 'premium':
        return hasPremium
      case 'business':
        return hasBusiness
      default:
        return false
    }
  }

  // Upgrade subscription
  const upgradeSubscription = async (newTier: SubscriptionTier): Promise<boolean> => {
    if (isDev) {
      setTier(newTier)
      return true
    }

    if (!user) return false

    try {
      setIsUpgrading(true)
      // Implement your subscription upgrade logic here
      // This is just a placeholder
      setTier(newTier)
      return true
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      return false
    } finally {
      setIsUpgrading(false)
    }
  }

  // Load subscription data
  useEffect(() => {
    if (isDev) {
      setIsLoading(false)
      return
    }

    if (!user) {
      setTier('free')
      setIsLoading(false)
      return
    }

    // Implement your subscription data loading logic here
    // This is just a placeholder
    const loadSubscription = async () => {
      try {
        // Add your subscription loading logic here
        setTier('free') // Default to free tier
      } catch (error) {
        console.error('Error loading subscription:', error)
        setTier('free')
      } finally {
        setIsLoading(false)
      }
    }

    loadSubscription()
  }, [user])

  const value = {
    tier,
    isLoading,
    hasPremium,
    hasBusiness,
    canAccess,
    upgradeSubscription,
    isUpgrading,
    setMockSubscriptionStatus
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

// Export the hook for accessing the context
export function useSubscription() {
  return useContext(SubscriptionContext)
} 