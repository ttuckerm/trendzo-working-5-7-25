'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/lib/supabase/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'

  if (authDisabled) {
    return <>{children}</>
  }

  return <ProtectedRouteInner allowedRoles={allowedRoles}>{children}</ProtectedRouteInner>
}

function ProtectedRouteInner({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useSupabaseAuth()
  const router = useRouter()
  const redirected = useRef(false)
  const [timedOut, setTimedOut] = useState(false)
  const [secondsWaiting, setSecondsWaiting] = useState(0)

  useEffect(() => {
    if (!loading) {
      setTimedOut(false)
      setSecondsWaiting(0)
      return
    }
    const counter = setInterval(() => {
      setSecondsWaiting(s => s + 1)
    }, 1000)
    const timeout = setTimeout(() => {
      if (loading) {
        setTimedOut(true)
      }
    }, 8000)
    return () => {
      clearTimeout(timeout)
      clearInterval(counter)
    }
  }, [loading])

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
    }
  }, [user, profile, loading, allowedRoles, router])

  if (loading) {
    if (timedOut) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white px-4 gap-4">
          <p className="text-zinc-400 text-sm">Authentication is not responding.</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:brightness-110"
              style={{ backgroundColor: '#dc143c' }}
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white border border-zinc-700 transition hover:bg-zinc-800"
            >
              Go to Login
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#dc143c]" />
        {secondsWaiting > 2 && (
          <p className="mt-4 text-zinc-500 text-xs">Checking authentication... ({secondsWaiting}s)</p>
        )}
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
