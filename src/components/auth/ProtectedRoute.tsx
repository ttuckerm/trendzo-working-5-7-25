'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/lib/supabase/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useSupabaseAuth()
  const router = useRouter()
  const redirected = useRef(false)

  useEffect(() => {
    if (loading) return
    if (redirected.current) return

    if (!user) {
      redirected.current = true
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    const role = profile?.role
    if (role && !allowedRoles.includes(role)) {
      redirected.current = true
      // Don't redirect — show access denied inline
    }
  }, [user, profile, loading, allowedRoles, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#dc143c]" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const role = profile?.role
  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white px-4">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display), serif' }}>
          Access Denied
        </h1>
        <p className="text-zinc-400 text-sm mb-6">
          Your role ({role}) does not have access to this area.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:brightness-110"
          style={{ backgroundColor: '#dc143c' }}
        >
          Sign in with a different account
        </button>
      </div>
    )
  }

  return <>{children}</>
}
