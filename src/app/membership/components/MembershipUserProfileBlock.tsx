'use client'

import Link from 'next/link'
import { Bell, ChevronDown, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton'
import { useRouter } from 'next/navigation'

// Extracted from the existing membership Header right-side block,
// so functionality remains identical while fitting the dark admin-style header.
export default function MembershipUserProfileBlock() {
  const { user } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Backend is disabled in local; default to 0
    setUnreadCount(0)
  }, [user?.email])

  const handleDocumentationClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/documentation')
  }

  return (
    <div className="flex items-center gap-3 md:gap-4">
      <ThemeToggleButton />

      <div className="hidden md:block">
        <a
          href="/documentation"
          onClick={handleDocumentationClick}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-blue-300 hover:bg-white/10"
        >
          <BookOpen size={16} />
          <span>Docs</span>
        </a>
      </div>

      <div className="relative">
        <Link href="/notifications">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen)
              if (isUserMenuOpen) setIsUserMenuOpen(false)
            }}
            className="relative rounded-full p-1 text-zinc-300 hover:bg-white/10"
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

      <div className="relative">
        <button
          onClick={() => {
            setIsUserMenuOpen(!isUserMenuOpen)
            if (isNotificationsOpen) setIsNotificationsOpen(false)
          }}
          className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium hover:bg-white/10"
        >
          <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-100">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="User avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-500 text-white">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-sm font-medium text-white">
              {user?.displayName || user?.email || 'Guest User'}
            </span>
            <span className="block text-xs text-zinc-400">
              {user?.email}
            </span>
          </div>
          <ChevronDown size={16} className="text-zinc-400" />
        </button>

        {isUserMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md border border-white/10 bg-zinc-900 py-1 shadow-lg">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Your Profile
            </Link>
            <Link
              href="/settings"
              className="block px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Settings
            </Link>
            <a
              href="/documentation"
              onClick={handleDocumentationClick}
              className="block px-4 py-2 text-sm font-medium text-blue-300 border-t border-b border-white/10 hover:bg-white/10"
            >
              <div className="flex items-center">
                <BookOpen size={16} className="mr-2" />
                Documentation
              </div>
            </a>
            <button
              onClick={() => {}}
              className="block w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}





