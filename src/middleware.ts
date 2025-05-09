import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define paths that should be tracked for newsletter analytics
const TRACKED_PATHS = ['/template-redirect', '/template-preview'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // We need a cleaner way to handle the dashboard route
  // For now, we'll remove the redirection that's causing issues
  // and let the natural page resolution work
  
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
  
  // Continue with the request
  return NextResponse.next();
} 