"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Menu, Bell, ChevronDown, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton'
// import { db } from '@/lib/firebase/firebase'; // db will be null
// import { collection, query, where, getDocs, Firestore } from 'firebase/firestore';
import { useRouter } from 'next/navigation'

const COMPONENT_DISABLED_MSG = "Header: Firebase backend is removed. Unread notification count will default to 0.";

export default function Header({
  setIsSidebarOpen
}: {
  setIsSidebarOpen?: (isOpen: boolean) => void
}) {
  const { user } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchUnreadCount = async () => {
      console.warn(COMPONENT_DISABLED_MSG);
      const db = null; // Explicitly null for clarity within this function scope that db is not available.
      if (!user?.email || !db) {
        setUnreadCount(0); // Ensure it defaults to 0 if we bail early
        return;
      }

      // try {
      //   // Get unread notifications count
      //   const notificationsQuery = query(
      //     collection(db as Firestore, 'notifications'),
      //     where('userId', '==', user.email),
      //     where('isRead', '==', false)
      //   );

      //   const snapshot = await getDocs(notificationsQuery);
      //   setUnreadCount(snapshot.size);
      // } catch (error) {
      //   console.error('Error fetching unread notifications (Firebase disabled):', error);
      //   setUnreadCount(0); // Default to 0 on error too
      // }
    };

    fetchUnreadCount();
    // Set up real-time listener for new notifications here if needed (would also be a no-op)
  }, [user?.email]);

  // Handler for reliable navigation
  const handleDocumentationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[Navigation] Navigating to documentation');
    
    // Use Next.js router for navigation
    router.push('/documentation');
  };

  return (
    <header className="relative z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      {/* Left side - Mobile menu button and logo */}
      <div className="flex items-center gap-4">
        {setIsSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image 
              src="/images/logos/trendzo-text-logo.svg" 
              alt="Trendzo Logo" 
              width={120} 
              height={30} 
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </div>

      {/* Center - Search */}
      <div className="hidden w-full max-w-xl px-4 lg:block">
        <div className="relative">
          <input
            type="search"
            placeholder="Search templates, assets, analytics..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pl-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right side - Notifications and profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Theme Toggle Button */}
        <ThemeToggleButton />

        {/* Documentation Quick Access */}
        <div className="hidden md:block">
          <a 
            href="/documentation" 
            onClick={handleDocumentationClick}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            <BookOpen size={16} />
            <span>Docs</span>
          </a>
        </div>
        
        {/* Notifications */}
        <div className="relative">
          <Link href="/notifications">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen)
                if (isUserMenuOpen) setIsUserMenuOpen(false)
              }}
              className="relative rounded-full p-1 text-gray-500 hover:bg-gray-100"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </Link>
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen)
              if (isNotificationsOpen) setIsNotificationsOpen(false)
            }}
            className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium hover:bg-gray-100"
          >
            <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-100">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-500 text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <span className="block text-sm font-medium text-gray-900">
                {user?.displayName || user?.email || 'Guest User'}
              </span>
              <span className="block text-xs text-gray-500">
                {user?.email}
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Settings
              </Link>
              <a
                href="/documentation"
                onClick={handleDocumentationClick}
                className="block px-4 py-2 text-sm font-medium text-blue-600 border-t border-b border-gray-100 hover:bg-blue-50"
              >
                <div className="flex items-center">
                  <BookOpen size={16} className="mr-2" />
                  Documentation
                </div>
              </a>
              <button
                onClick={() => {
                  // Handle sign out
                }}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 