"use client"

import React, { useState } from 'react'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { SubscriptionTier } from '@/lib/contexts/SubscriptionContext'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function SubscriptionDebugPage() {
  const { tier, hasPremium, hasBusiness, upgradeSubscription } = useSubscription()
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(tier)
  const [isChanging, setIsChanging] = useState(false)

  const handleChangeTier = async (newTier: SubscriptionTier) => {
    setIsChanging(true)
    try {
      const success = await upgradeSubscription(newTier)
      if (success) {
        setCurrentTier(newTier)
        toast.success(`Changed to ${newTier} tier`)
      } else {
        toast.error("Failed to change subscription tier")
      }
    } catch (error) {
      console.error("Error changing tier:", error)
      toast.error("An error occurred while changing the subscription tier")
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription Debug Tools</h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Subscription Status</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-gray-600">Tier:</span>
            <span className="ml-2 font-medium">{tier || 'Not set'}</span>
          </div>
          <div>
            <span className="text-gray-600">Has Premium:</span>
            <span className={`ml-2 font-medium ${hasPremium ? 'text-green-600' : 'text-red-600'}`}>
              {hasPremium ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        
        <h3 className="text-md font-medium mb-2">Change Subscription</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleChangeTier('free')}
            className={`px-3 py-1.5 rounded-md border ${currentTier === 'free' 
              ? 'bg-blue-50 border-blue-400 text-blue-700' 
              : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Free Tier
          </button>
          <button
            onClick={() => handleChangeTier('premium')}
            className={`px-3 py-1.5 rounded-md border ${currentTier === 'premium' 
              ? 'bg-blue-50 border-blue-400 text-blue-700' 
              : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Premium Tier
          </button>
          <button
            onClick={() => handleChangeTier('business')}
            className={`px-3 py-1.5 rounded-md border ${currentTier === 'business' 
              ? 'bg-blue-50 border-blue-400 text-blue-700' 
              : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Business Tier
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Premium Pages</h2>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/analytics" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Analytics Dashboard
          </Link>
          <Link 
            href="/api/debug/analytics" 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            target="_blank"
          >
            View Raw Analytics Data
          </Link>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-md font-medium text-yellow-800 mb-2">Testing Instructions</h3>
          <ol className="list-decimal pl-5 text-sm text-yellow-700">
            <li className="mb-1">First, set your desired subscription tier using the buttons above</li>
            <li className="mb-1">Then visit the Analytics Dashboard to test tier-gating</li>
            <li className="mb-1">If you're in "Free" tier, you should see an upgrade prompt</li>
            <li className="mb-1">If you're in "Premium" or "Business" tier, you should see the full dashboard</li>
            <li className="mb-1">Use the "View Raw Analytics Data" to verify the data directly</li>
          </ol>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Debug Features</h2>
        <p className="text-gray-600 mb-4">
          If you don't see the premium content restrictions working, you need to uncomment the premium restriction code in:
        </p>
        <div className="bg-gray-100 p-2 rounded font-mono text-sm mb-4">
          src/app/(dashboard)/analytics/page.tsx
        </div>
        <p className="text-gray-600">
          Specifically, uncomment the section that checks <code>if (!hasPremium) {'{'} ... {'}'}</code>
        </p>
      </div>
    </div>
  );
} 