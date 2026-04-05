// =============================================
// API ROUTE AUTH GUARD
// Reusable helper for protecting API route handlers
// =============================================

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { canAccess, FeatureAction } from './permissions'
import { UserRole } from '@/types/admin'

export interface AuthResult {
  error: NextResponse | null
  user: { id: string; email: string | null } | null
  profile: { id: string; role: UserRole; [key: string]: unknown } | null
}

/**
 * Authenticate the current request and optionally check a feature-level permission.
 *
 * Usage in an API route:
 *   const auth = await requireAuth('view_predictions')
 *   if (auth.error) return auth.error
 *   // auth.user and auth.profile are guaranteed non-null here
 */
export async function requireAuth(requiredAction?: FeatureAction): Promise<AuthResult> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored in API route context
          }
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
      profile: null,
    }
  }

  // Look up profile with service role client (bypasses RLS)
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: NextResponse.json({ error: 'Profile not found' }, { status: 403 }),
      user: { id: user.id, email: user.email ?? null },
      profile: null,
    }
  }

  const role = (profile.role as UserRole) || 'creator'

  if (requiredAction && !canAccess(role, requiredAction)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: { id: user.id, email: user.email ?? null },
      profile: { ...profile, role },
    }
  }

  return {
    error: null,
    user: { id: user.id, email: user.email ?? null },
    profile: { ...profile, role },
  }
}
