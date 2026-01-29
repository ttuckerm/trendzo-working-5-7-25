'use client'

import { Starfield } from '@/components/dashboard/Starfield'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickStartVideo } from '@/components/dashboard/QuickStartVideo'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { ImpactScore } from '@/components/dashboard/ImpactScore'
import { ProgressJourney } from '@/components/dashboard/ProgressJourney'
import { Achievements } from '@/components/dashboard/Achievements'
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton'
import { NotificationProvider } from '@/components/dashboard/NotificationProvider'

export default function DashboardViewPage() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
        <Starfield />
        
        <div className="relative z-10 px-4 py-8 max-w-7xl mx-auto">
          <DashboardHeader userName="Dev User" streak={7} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-8">
              <QuickStartVideo />
              <QuickActions />
              <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Ship something now</h3>
                    <p className="text-sm text-gray-300">Start the 10‑minute Quick Win workflow.</p>
                  </div>
                  <a href="/dashboard-view/quick-win" className="inline-flex items-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400">Start Your Quick Win</a>
                </div>
              </div>
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