/**
 * CRITICAL FILE: Dashboard Layout
 * 
 * PURPOSE: Main layout for the dashboard system
 * 
 * WARNING:
 * - This file controls the entire dashboard system
 * - Changes here affect ALL dashboard pages
 * - Do NOT modify this file when working on other features
 * - Must maintain compatibility with dashboard components
 */

"use client"

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/hooks/useAuth'
import { redirect } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [devBypass, setDevBypass] = useState(false)
  const pathname = usePathname()
  const { user, loading } = useAuth()
  
  // Check for development bypass mode
  useEffect(() => {
    // Only runs client-side
    if (typeof window !== 'undefined') {
      try {
        // Default to true for easier development
        const bypass = localStorage.getItem('trendzo_dev_bypass') === 'true' || true;
        setDevBypass(true); // Always set to true for development
        
        // Keep the dev bypass flag alive across page refreshes
        if (bypass) {
          // Refresh the localStorage entry to ensure it doesn't expire
          localStorage.setItem('trendzo_dev_bypass', 'true');
        }
      } catch (error) {
        console.error('Error checking dev bypass mode:', error);
        // Default to true if there's an error
        setDevBypass(true);
      }
    }
  }, []);

  // Close sidebar when path changes (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])
  
  // Check if user is authenticated
  useEffect(() => {
    // Skip auth check if in development bypass mode
    if (devBypass) return;
    
    if (!loading && !user) {
      redirect('/auth')
    }
  }, [user, loading, devBypass])
  
  // Show loading state
  if (loading && !devBypass) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Dev bypass mode indicator
  const DevModeIndicator = () => {
    if (!devBypass) return null;
    return (
      <div className="fixed top-2 right-2 z-50 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
        DEV MODE
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Dev mode indicator */}
      <DevModeIndicator />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header setIsSidebarOpen={setSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 