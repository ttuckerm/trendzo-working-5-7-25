'use client'

import { useSupabaseAuth } from '@/lib/supabase/auth-context'

export function useAuth() {
  const { user, profile, loading, signOut } = useSupabaseAuth()

  const role = profile?.role ?? null

  return {
    user,
    profile,
    role,
    loading,
    signOut,
    isChairman: role === 'chairman',
    isAgency: role === 'agency',
    isCreator: role === 'creator',
  }
}
