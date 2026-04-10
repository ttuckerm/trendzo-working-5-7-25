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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'31a8a3'},body:JSON.stringify({sessionId:'31a8a3',location:'auth-context.tsx:fetchProfile-entry',message:'fetchProfile called',data:{userId},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'31a8a3'},body:JSON.stringify({sessionId:'31a8a3',location:'auth-context.tsx:fetchProfile-exit',message:'fetchProfile completed',data:{hasData:!!data,errorCode:error?.code,errorMsg:error?.message},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (error && error.code !== 'PGRST116') {
      console.error('[auth-context] Profile fetch error:', error)
    }
    setProfile(data || null)
  }, [supabase])

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'31a8a3'},body:JSON.stringify({sessionId:'31a8a3',location:'auth-context.tsx:useEffect-entry',message:'SupabaseAuthProvider useEffect fired',data:{},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'31a8a3'},body:JSON.stringify({sessionId:'31a8a3',location:'auth-context.tsx:getSession-resolved',message:'getSession resolved',data:{hasSession:!!session,hasUser:!!session?.user,userEmail:session?.user?.email},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchProfile(u.id).finally(() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'31a8a3'},body:JSON.stringify({sessionId:'31a8a3',location:'auth-context.tsx:setLoading-false-after-profile',message:'setLoading(false) after fetchProfile',data:{},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
          setLoading(false)
        })
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'31a8a3'},body:JSON.stringify({sessionId:'31a8a3',location:'auth-context.tsx:setLoading-false-no-user',message:'setLoading(false) - no user',data:{},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        setLoading(false)
      }
    }).catch((err: unknown) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'31a8a3'},body:JSON.stringify({sessionId:'31a8a3',location:'auth-context.tsx:getSession-REJECTED',message:'getSession REJECTED - this is the bug',data:{error:String(err)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
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
