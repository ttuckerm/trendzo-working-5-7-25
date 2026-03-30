"use client"

import { ReactNode } from 'react'
import Link from 'next/link'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { Sparkles, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PremiumFeatureGateProps {
  children: ReactNode
  featureName: string
  description?: string
  requiredTier?: 'premium' | 'business'
}

export default function PremiumFeatureGate({
  children,
  featureName,
  description,
  requiredTier = 'premium'
}: PremiumFeatureGateProps) {
  const { canAccess, isLoading, tier, upgradeSubscription } = useSubscription()
  
  const hasAccess = canAccess(requiredTier)
  
  // If loading, show a loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">
        <div className="h-8 w-40 bg-gray-200 rounded mx-auto mb-4"></div>
        <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
      </div>
    )
  }
  
  // If user has access, render the children
  if (hasAccess) {
    return <>{children}</>
  }
  
  // Otherwise show the upgrade prompt
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 text-center space-y-6">
      <div className="p-3 bg-blue-100 rounded-full">
        <Lock className="w-6 h-6 text-blue-600" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-900">Premium Feature: {featureName}</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {description || `This feature is only available on the ${requiredTier} plan. Upgrade now to unlock it!`}
        </p>
      </div>
      
      <div className="grid gap-3 w-full max-w-xs">
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
          onClick={() => upgradeSubscription(requiredTier)}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
        </Button>
        <Link 
          href="/pricing"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
        >
          See pricing details <ArrowRight className="w-3 h-3 ml-1" />
        </Link>
      </div>
      
      <div className="text-xs text-gray-500 border-t border-gray-200 pt-4 w-full max-w-md">
        {requiredTier === 'premium' ? (
          <>
            Premium includes unlimited template remixes, custom branding, and advanced analytics.
          </>
        ) : (
          <>
            Business includes everything in Premium plus team collaboration, priority support, and custom integrations.
          </>
        )}
      </div>
    </div>
  )
} 