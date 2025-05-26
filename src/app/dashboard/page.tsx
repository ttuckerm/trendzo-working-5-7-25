'use client';

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { Starfield } from '@/components/dashboard/Starfield'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickStartVideo } from '@/components/dashboard/QuickStartVideo'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { ImpactScore } from '@/components/dashboard/ImpactScore'
import { ProgressJourney } from '@/components/dashboard/ProgressJourney'
import { Achievements } from '@/components/dashboard/Achievements'
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton'
import { NotificationProvider } from '@/components/dashboard/NotificationProvider'

/**
 * This page redirects users from /dashboard to /dashboard-view
 * to consolidate all dashboard functionality in one place
 */
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white">Loading your dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Please sign in to view your dashboard</div>
      </div>
    )
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
        <Starfield />
        
        <div className="relative z-10 px-4 py-8 max-w-7xl mx-auto">
          <DashboardHeader userName={user.user_metadata?.name || 'Creator'} streak={7} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-8">
              <QuickStartVideo />
              <QuickActions />
              <ProgressJourney />
            </div>
            
            {/* Right Column - Takes up 1 column on large screens */}
            <div className="lg:col-span-1">
              <ImpactScore />
            </div>
          </div>
          
          <Achievements />
        </div>
        
        <FloatingActionButton />
      </div>
    </NotificationProvider>
  )
} 