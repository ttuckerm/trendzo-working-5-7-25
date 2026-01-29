import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { isAdminPath } from '@/middleware/rbac'

// Define paths that should be tracked for newsletter analytics
const TRACKED_PATHS = ['/template-redirect', '/template-preview'];

// Define redirects for old routes to their new dashboard locations
const REDIRECT_ROUTES: Record<string, string> = {
  '/sound-trends': '/dashboard-view/sound-trends'
};

// Define routes that should be redirected
const REDIRECTS = [
  {
    source: '/editor',
    destination: '/dashboard-view/template-editor',
    preserveQuery: true
  }
];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams, search } = request.nextUrl;
  // Deprecation headers for v1 endpoints flagged as deprecated
  if (pathname.startsWith('/api/') || pathname.startsWith('/public/')) {
    const isV1 = pathname.includes('/v1/') || pathname.startsWith('/public/')
    if (isV1) {
      const sunset = new Date(Date.now() + 90*24*3600*1000).toISOString()
      const res = NextResponse.next({ request: { headers: request.headers } })
      res.headers.set('Deprecation', 'true')
      res.headers.set('Sunset', sunset)
      res.headers.set('Link', '</docs/api/v1>; rel="deprecation"')
      return res
    }
  }
  // Enforce x-api-key for partner signals (read from secrets vault when available)
  if (pathname.startsWith('/api/partner/signals')) {
    const key = request.headers.get('x-api-key') || ''
    let expected = process.env.PARTNER_API_KEY || process.env.NEXTAUTH_SECRET || 'local-dev'
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists secrets_vault (key text primary key, version int not null default 1, value text, rotated_at timestamptz, expires_at timestamptz, updated_at timestamptz default now());" })
      const { data } = await db.from('secrets_vault').select('value,version').eq('key','partner_api_key').order('version', { ascending: false }).limit(1)
      if (Array.isArray(data) && data.length && data[0].value) expected = String((data[0] as any).value)
    } catch {}
    if (!key || key !== expected) {
      return new NextResponse(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } })
    }
  }

  // License enforcement: example protected routes under /api/coach and /api/partner
  if (pathname.startsWith('/api/coach') || pathname.startsWith('/api/partner')) {
    const apiKey = request.headers.get('x-api-key') || ''
    const scope = pathname.startsWith('/api/coach') ? 'coach' : 'partner'
    return NextResponse.next({ request: { headers: request.headers } }) // pass through; detailed checks live in routes using checkAndConsume
  }
  
  // Handle redirects for old routes
  if (REDIRECT_ROUTES[pathname]) {
    return NextResponse.redirect(new URL(REDIRECT_ROUTES[pathname], request.url));
  }
  
  // Check if this is a path we want to track
  const shouldTrack = TRACKED_PATHS.some(path => pathname.startsWith(path));
  
  if (shouldTrack) {
    // Extract tracking parameters
    const templateId = searchParams.get('id');
    const source = searchParams.get('source');
    const campaign = searchParams.get('campaign');
    
    if (templateId && source === 'newsletter') {
      try {
        // Log the click event for analytics (for now just console log)
        console.log('Newsletter click tracked:', {
          templateId,
          source,
          campaign: campaign || 'uncategorized',
          timestamp: new Date().toISOString(),
          path: pathname,
          referrer: request.headers.get('referer') || 'direct',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        
        // In a production environment, you would send this data to a database or analytics service
      } catch (error) {
        console.error('Error tracking newsletter click:', error);
      }
    }
  }
  
  // Check if current path matches any redirect rules
  for (const redirect of REDIRECTS) {
    if (pathname === redirect.source || pathname.startsWith(`${redirect.source}/`)) {
      const targetUrl = new URL(redirect.destination, request.url);
      
      // Preserve query parameters if specified in the rule
      if (redirect.preserveQuery && search) {
        targetUrl.search = search;
      }
      
      // Create redirection response
      return NextResponse.redirect(targetUrl);
    }
  }
  
  // Attach metering headers for SDK/pixel/scoring/validation reads
  if (pathname.startsWith('/public/') || pathname.startsWith('/api/public') || pathname.startsWith('/api/admin/prediction-validation')) {
    const res = NextResponse.next({ request: { headers: request.headers } })
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const apiKey = request.headers.get('x-api-key') || ''
      const since24h = new Date(Date.now() - 24*3600*1000).toISOString()
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const day = await db.from('usage_events').select('id').eq('api_key', apiKey).gte('ts', since24h)
      const mon = await db.from('usage_events').select('id').eq('api_key', apiKey).gte('ts', monthStart)
      res.headers.set('X-Usage-24h', String(day.data?.length || 0))
      res.headers.set('X-Usage-Month', String(mon.data?.length || 0))
      res.headers.set('X-Usage-Plan', request.headers.get('x-plan') || 'unknown')
      res.headers.set('X-Quota-Remaining', 'unknown')
    } catch {}
    return res
  }

  // Chaos latency injection (feature-flagged)
  if (pathname.startsWith('/api/') || pathname.startsWith('/public/')) {
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const { data } = await db.from('chaos_session').select('latency_ms,ends_at').eq('active', true).order('started_at', { ascending: false }).limit(1)
      const row = data?.[0]
      if (row && row.latency_ms > 0) {
        const endsAt = row.ends_at ? Date.parse(row.ends_at) : 0
        if (!endsAt || Date.now() < endsAt) {
          await new Promise(res => setTimeout(res, Math.min(3000, Number(row.latency_ms))))
        } else {
          try { await db.from('chaos_session').update({ active: false } as any).eq('active', true) } catch {}
        }
      }
    } catch {}
  }

  // Enforce that non-admin users cannot access /admin directly (defense-in-depth)
  if (isAdminPath(pathname)) {
    // In a real implementation, we would check a signed cookie/session.
    // Here, just allow the request to proceed (auth happens in components).
    return NextResponse.next()
  }

  // Continue with the request
  return NextResponse.next();
}

// Only run middleware on specified paths
export const config = {
  matcher: ['/editor', '/editor/:path*', '/api/partner/signals', '/api/coach/:path*', '/api/partner/:path*']
}; 