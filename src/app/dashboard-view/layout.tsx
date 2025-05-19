"use client"

import { useState, useEffect, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
// import Sidebar from '@/components/layout/Sidebar' // Old sidebar
import { NewAppSidebar } from '@/components/layout/NewAppSidebar' // New sidebar
import { useAuth } from '@/lib/hooks/useAuth'
import { redirect } from 'next/navigation'
import { TooltipProvider } from "@/components/ui/tooltip";
import { fixStyles } from '@/lib/utils/style-fixer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { SubscriptionProvider } from '@/lib/contexts/SubscriptionContext';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import "../globals.css" // Global CSS
import "./global.css" // Dashboard-specific CSS

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

const DefaultErrorFallback = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-white dark:bg-neutral-900">
    <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Oops! Something Went Wrong</h1>
    <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-6">
      We encountered an unexpected issue. Please try refreshing the page.
    </p>
    <button 
      onClick={() => window.location.reload()}
      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150"
    >
      Refresh Page
    </button>
    <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
      If the problem persists, please contact support.
    </p>
  </div>
);

export default function DashboardViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  // The NewAppSidebar manages its own open/close state internally via useSidebar context and useState
  // So, we don't need sidebarOpen and setSidebarOpen here for NewAppSidebar itself.
  // However, the Header might still need a way to toggle a mobile-only overlay or trigger the sidebar.
  // For now, let's assume the new sidebar handles its state, and Header will adapt or be adapted later.
  const [isMobileNavActuallyOpen, setIsMobileNavActuallyOpen] = useState(false); // For header to control mobile overlay if needed

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fixStyles()
    }
  }, [])

  // Close mobile nav when path changes
  useEffect(() => {
    setIsMobileNavActuallyOpen(false);
  }, [pathname]);

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center"><GlobalSpinner /></div>
  }

  // This redirect might need to be re-evaluated based on your auth flow for /dashboard-view
  // if (!user && !authLoading && pathname !== '/auth/signin' && pathname !== '/auth/signup') {
  //   return redirect('/auth/signin?redirect_to=' + pathname);
  // }

  return (
    <ErrorBoundary fallback={<DefaultErrorFallback />}>
      <SubscriptionProvider>
        <TooltipProvider>
          <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-neutral-950">
            {/* Replace old Sidebar with NewAppSidebar */}
            <NewAppSidebar /> 
            
            {/* The Header might need a way to toggle the sidebar for mobile if the new sidebar doesn't include a visible toggle for smallest screens */}
            {/* Or, the NewAppSidebar itself could expose a toggle that the Header uses. */}
            {/* For now, passing a handler for the Header to manage a mobile overlay state */}
            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              <Header setIsSidebarOpen={setIsMobileNavActuallyOpen} /> {/* This prop might need to change based on NewAppSidebar's behavior */}
              <main className="grow">
                <Suspense fallback={<GlobalSpinner />}>
                  <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-full mx-auto">
                    {children}
                  </div>
                </Suspense>
              </main>
            </div>
          </div>
        </TooltipProvider>
      </SubscriptionProvider>
    </ErrorBoundary>
  )
} 