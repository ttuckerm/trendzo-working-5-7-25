import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname, searchParams, search } = request.nextUrl;
  
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
  
  // Continue with the request
  return NextResponse.next();
}

// Only run middleware on specified paths
export const config = {
  matcher: ['/editor', '/editor/:path*']
}; 