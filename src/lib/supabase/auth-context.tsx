'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getSupabaseClient } from './client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface Profile {
  id: string
  role: string
  email: string | null
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  agency_id: string | null
  onboarded: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

export interface AuthState {
  user: SupabaseUser | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const SupabaseAuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[auth-context] Profile fetch error:', error)
    }
    setProfile(data || null)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchProfile(u.id).finally(() => {
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }).catch((err: unknown) => {
      console.error('[auth-context] getSession failed:', err)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          await fetchProfile(u.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [supabase])

  return (
    <SupabaseAuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  return useContext(SupabaseAuthContext)
}
