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