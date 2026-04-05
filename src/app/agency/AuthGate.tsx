'use client'

import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useSupabaseAuth } from '@/lib/supabase/auth-context'

export default function AgencyAuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useSupabaseAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <ProtectedRoute allowedRoles={['chairman', 'sub_admin', 'agency']}>
      {/* Compact sign-out bar */}
      <div className="fixed top-0 right-0 z-50 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-bl-lg">
        <span className="text-xs text-zinc-400">
          {profile?.display_name || user?.email}
        </span>
        <button
          onClick={handleSignOut}
          className="text-xs text-zinc-500 hover:text-white transition"
        >
          Sign out
        </button>
      </div>
      {children}
    </ProtectedRoute>
  )
}
