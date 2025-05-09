"use client"

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/hooks/useAuth'
import "../globals.css" // Global CSS
import "./global.css" // Dashboard-specific CSS
import { fixStyles } from './fix-styles'
import ErrorBoundary from '@/components/ui/error-boundary'

// Define session types to avoid errors
type SessionStatus = 'authenticated' | 'loading' | 'unauthenticated'
type SessionContextValue = {
  data: Session | null
  status: SessionStatus
}

// Define our own Session type
type Session = {
  user?: {
    name?: string
    email?: string
    image?: string
  }
  expires?: string
}

export default function DashboardViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Apply fixes in an effect, but don't block rendering
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fixStyles()
    }
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header setIsSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
} 