import React from 'react'
import MasterNavigation from './components/MasterNavigation'
import GlobalHeader from './components/GlobalHeader'
import AICommandPalette from './components/AICommandPalette'
import JarvisInterface from './super-admin-components/JarvisInterface'
import JarvisOverlay from './super-admin-components/JarvisOverlay'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

const QaOverlay = dynamic(() => import('@/components/qa/QaOverlay'), { ssr: false })

// Set to true to use the new role-based navigation
const USE_NEW_NAVIGATION = false

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // New role-based navigation layout
  if (USE_NEW_NAVIGATION) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex">
        {/* Role-Based Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Impersonation Banner (if active) */}
          <ImpersonationBanner />
          
          {/* Header */}
          <AdminHeader />

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>

        {/* AI Command Palette */}
        <AICommandPalette />
        
        {/* JARVIS Voice Interface */}
        <JarvisInterface />

        {/* JARVIS Global Overlay */}
        <JarvisOverlay />

        {/* QA Overlay (enabled via ?qa=1) */}
        <QaOverlay />
      </div>
    )
  }

  // Original layout (default)
  return (
    <div className="app-container flex h-screen bg-black text-white overflow-hidden relative">
      {/* Master Navigation - The Three Pillars */}
      <MasterNavigation />
      
      {/* Global Header */}
      <GlobalHeader />
      
      {/* Main Content Area */}
      <main className="main-content ml-[70px] w-[calc(100%-70px)] mt-16 h-[calc(100vh-64px)] overflow-y-auto relative">
        {children}
      </main>
      
      {/* AI Command Palette */}
      <AICommandPalette />
      
      {/* JARVIS Voice Interface */}
      <JarvisInterface />

      {/* JARVIS Global Overlay */}
      <JarvisOverlay />

      {/* QA Overlay (enabled via ?qa=1) */}
      <QaOverlay />
    </div>
  )
}