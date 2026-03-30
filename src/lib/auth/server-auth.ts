import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { hasPermission, Resource, Action } from '@/lib/permissions'
import { UserRole } from '@/types/admin'

/**
 * Minimal role requirements for route prefixes.
 * Chairman can access everything (checked via ROLE_HIERARCHY).
 */
const ROUTE_ROLE_REQUIREMENTS: Record<string, UserRole[]> = {
  '/chairman': ['chairman'],
  '/admin': ['chairman', 'sub_admin'],
  '/agency': ['chairman', 'sub_admin', 'agency'],
  '/dashboard': ['chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper'],
}

const ROLE_HOME: Record<UserRole, string> = {
  chairman: '/chairman',
  sub_admin: '/admin',
  agency: '/agency',
  developer: '/dashboard',
  creator: '/dashboard',
  clipper: '/dashboard',
}

export interface AuthenticatedUser {
  id: string
  email: string | null
  role: UserRole
}

/**
 * Get the authenticated user and their role from a server-side API route.
 * Uses Supabase service role to look up the user's profile.
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<{ user: AuthenticatedUser | null; error: string | null }> {
  try {
    // Create SSR client to read auth cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll() {
            // API routes don't set cookies
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { user: null, error: 'Not authenticated' }
    }

    // Look up profile with service role client (bypasses RLS)
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        user: { id: user.id, email: user.email ?? null, role: 'creator' },
        error: null,
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        role: (profile.role as UserRole) || 'creator',
      },
      error: null,
    }
  } catch (err) {
    console.error('[server-auth] Error:', err)
    return { user: null, error: 'Auth error' }
  }
}

/**
 * API route guard — returns a 403 response if the user lacks one of the required roles.
 * Returns null if access is granted (same pattern as the old requireTenantAccess).
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<NextResponse | null> {
  const { user, error } = await getAuthenticatedUser(req)

  if (!user) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
  }

  // Chairman can access everything
  if (user.role === 'chairman') return null

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

/**
 * API route guard using the permission matrix.
 */
export async function requirePermission(
  req: NextRequest,
  resource: Resource,
  action: Action
): Promise<NextResponse | null> {
  const { user, error } = await getAuthenticatedUser(req)

  if (!user) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(user.role, resource, action)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

/**
 * Checks if a role is allowed to access a given route prefix.
 */
export function isRoleAllowedForRoute(role: UserRole, pathname: string): boolean {
  // Chairman can access everything
  if (role === 'chairman') return true

  for (const [prefix, allowedRoles] of Object.entries(ROUTE_ROLE_REQUIREMENTS)) {
    if (pathname.startsWith(prefix)) {
      return allowedRoles.includes(role)
    }
  }

  // No specific route requirement = allow
  return true
}

/**
 * Get the home page for a given role.
 */
export function getRoleHome(role: UserRole): string {
  return ROLE_HOME[role] || '/dashboard'
}

export { ROUTE_ROLE_REQUIREMENTS, ROLE_HOME }
