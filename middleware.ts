import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_TIMEOUT_MS = 500

/**
 * Protected route prefixes and the roles allowed to access them.
 * Chairman can access everything (handled explicitly below).
 */
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/chairman': ['chairman'],
  '/admin': ['chairman', 'sub_admin'],
  '/agency': ['chairman', 'sub_admin', 'agency'],
  '/dashboard': ['chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper'],
  '/onboarding': ['chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper'],
}

const ROLE_HOME: Record<string, string> = {
  chairman: '/chairman',
  sub_admin: '/admin',
  agency: '/agency',
  developer: '/dashboard',
  creator: '/dashboard',
  clipper: '/dashboard',
}

/**
 * Check if a pathname matches any protected route prefix.
 */
function getRequiredRoles(pathname: string): string[] | null {
  // Sort by length descending so more specific prefixes match first
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

export async function middleware(request: NextRequest) {
  const reqUrl = request.nextUrl.pathname
  const isRSC = request.headers.get('RSC') === '1'

  // RSC navigation fetches are client-side route transitions where the auth
  // session is already established. Letting them through without an auth
  // round-trip makes navigation instant instead of blocking 5+ seconds.
  if (isRSC) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session
  let authUser: any = null
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), AUTH_TIMEOUT_MS)
      ),
    ]) as any
    authUser = result?.data?.user ?? null
  } catch {
    // Auth timeout or error — user treated as unauthenticated
  }

  // Check if the current path requires role-based access
  const requiredRoles = getRequiredRoles(reqUrl)

  if (requiredRoles) {
    // Not authenticated → redirect to login
    if (!authUser) {
      const loginUrl = new URL('/auth', request.url)
      loginUrl.searchParams.set('next', reqUrl)
      return NextResponse.redirect(loginUrl)
    }

    // Look up user's role from profiles table
    let userRole: string = 'creator'
    try {
      const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_KEY
      if (serviceUrl && serviceKey) {
        const serviceClient = createClient(serviceUrl, serviceKey)
        const { data: profile } = await serviceClient
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single()
        if (profile?.role) {
          userRole = profile.role
        }
      }
    } catch {
      // Fall through with default role
    }

    // Check if role is allowed
    if (!requiredRoles.includes(userRole)) {
      // Redirect to the user's appropriate home page
      const home = ROLE_HOME[userRole] || '/dashboard'
      return NextResponse.redirect(new URL(home, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Only run middleware on page routes, not on API routes or static assets.
     * API routes handle their own auth; this prevents the middleware from
     * blocking internal fetch() calls (Jarvis status polls, etc.).
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
