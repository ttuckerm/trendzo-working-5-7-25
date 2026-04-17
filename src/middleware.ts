import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware — runs in the Edge Runtime.
 *
 * NO @supabase/* imports here. supabase-js pulls in @supabase/realtime-js
 * which uses native Node modules that crash the Edge sandbox. Instead we use
 * the Supabase Auth REST API directly via fetch().
 */

const AUTH_TIMEOUT_MS = 800

/**
 * Routes that NEVER require authentication.
 */
const PUBLIC_PREFIXES = [
  '/free',
  '/login',
  '/signup',
  '/auth',
  '/api/free',
  '/api/freedom-agent',
  '/api/funnel',
  '/api/auth',
  '/api/health',
  '/api/ping',
  '/api/cron',
]

/**
 * Protected route prefixes and the roles allowed to access them.
 */
const PROTECTED_ROUTES: Record<string, string[]> = {
  // Page routes
  '/chairman': ['chairman'],
  '/admin': ['chairman', 'sub_admin'],
  '/agency': ['chairman', 'sub_admin', 'agency'],
  '/creator': ['chairman', 'sub_admin', 'agency', 'creator'],
  '/dashboard': ['chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper'],
  '/onboarding': ['chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper'],
  // API routes — chairman/sub_admin only for admin endpoints
  '/api/admin': ['chairman', 'sub_admin'],
  '/api/agency-chat': ['chairman', 'sub_admin', 'agency'],
  '/api/chairman-chat': ['chairman', 'sub_admin'],
}

const ROLE_HOME: Record<string, string> = {
  chairman: '/chairman',
  sub_admin: '/admin',
  agency: '/agency',
  developer: '/dashboard',
  creator: '/dashboard',
  clipper: '/dashboard',
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

function getRequiredRoles(pathname: string): string[] | null {
  const sorted = Object.entries(PROTECTED_ROUTES).sort(
    (a, b) => b[0].length - a[0].length
  )
  for (const [prefix, roles] of sorted) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return roles
    }
  }
  return null
}

/**
 * Get the authenticated user from Supabase auth cookies.
 * Calls the GoTrue /auth/v1/user endpoint directly (Edge-safe).
 */
async function getAuthUser(request: NextRequest): Promise<{ id: string; email?: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  // Supabase stores the access token in a cookie like sb-<ref>-auth-token
  // The cookie value is a JSON array: [access_token, refresh_token, ...]
  // Or in newer versions, split across sb-<ref>-auth-token.0, .1, etc.
  const ref = url.replace('https://', '').split('.')[0]
  const cookiePrefix = `sb-${ref}-auth-token`

  let accessToken: string | null = null

  // Try the single-cookie format first
  const singleCookie = request.cookies.get(cookiePrefix)
  if (singleCookie?.value) {
    try {
      const parsed = JSON.parse(singleCookie.value)
      accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token || null
    } catch {
      // Not JSON — might be the raw token
      accessToken = singleCookie.value
    }
  }

  // Try chunked cookie format: sb-<ref>-auth-token.0, .1, etc.
  if (!accessToken) {
    let combined = ''
    for (let i = 0; i < 10; i++) {
      const chunk = request.cookies.get(`${cookiePrefix}.${i}`)
      if (!chunk?.value) break
      combined += chunk.value
    }
    if (combined) {
      try {
        const parsed = JSON.parse(combined)
        accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token || null
      } catch {
        accessToken = combined
      }
    }
  }

  if (!accessToken) return null

  // Validate the token by calling Supabase Auth
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
    })
    if (!res.ok) return null
    const user = await res.json()
    return user?.id ? { id: user.id, email: user.email } : null
  } catch {
    return null
  }
}

/**
 * Look up a user's role and onboarded status via the Supabase REST API (Edge-compatible).
 */
async function fetchUserProfile(userId: string): Promise<{ role: string; onboarded: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) return { role: 'creator', onboarded: true }

  try {
    const res = await fetch(
      `${url}/rest/v1/profiles?select=role,onboarded&id=eq.${userId}&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    )
    if (!res.ok) return { role: 'creator', onboarded: true }
    const rows = await res.json()
    return {
      role: rows?.[0]?.role || 'creator',
      onboarded: rows?.[0]?.onboarded !== false,
    }
  } catch {
    return { role: 'creator', onboarded: true }
  }
}

export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return NextResponse.next()
  }

  const reqUrl = request.nextUrl.pathname
  const isRSC = request.headers.get('RSC') === '1'

  // RSC navigation fetches — the auth session is already established client-side.
  if (isRSC) {
    return NextResponse.next({ request })
  }

  // Public routes — never block
  if (isPublicRoute(reqUrl)) {
    return NextResponse.next({ request })
  }

  // Check if the current path requires role-based access
  const requiredRoles = getRequiredRoles(reqUrl)
  if (!requiredRoles) {
    return NextResponse.next({ request })
  }

  const isApiRoute = reqUrl.startsWith('/api/')

  // Protected route — check auth with timeout
  let authUser: { id: string; email?: string } | null = null
  try {
    authUser = await Promise.race([
      getAuthUser(request),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), AUTH_TIMEOUT_MS)
      ),
    ])
  } catch {
    // Treat as unauthenticated
  }

  // Not authenticated
  if (!authUser) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', reqUrl)
    return NextResponse.redirect(loginUrl)
  }

  // Look up user's role and onboarded status
  const { role: userRole, onboarded } = await fetchUserProfile(authUser.id)

  // Redirect un-onboarded users to /onboarding (unless already there or hitting API)
  if (!onboarded && !isApiRoute && !reqUrl.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (!requiredRoles.includes(userRole)) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const home = ROLE_HOME[userRole] || '/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    // Page routes (exclude static assets)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
