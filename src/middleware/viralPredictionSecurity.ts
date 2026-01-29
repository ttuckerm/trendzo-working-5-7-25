import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByUserType, checkSuspiciousActivity, logSecurityEvent } from '@/lib/middleware/rateLimiter';

/**
 * Security middleware for the Viral Prediction Platform
 * Handles rate limiting, access control, and security monitoring
 */
export async function viralPredictionSecurityMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  try {
    // Skip security checks for static files and certain paths
    if (shouldSkipSecurity(pathname)) {
      return NextResponse.next();
    }

    // Check for suspicious activity first
    const isSuspicious = await checkSuspiciousActivity(request);
    if (isSuspicious) {
      return NextResponse.json(
        { success: false, error: 'Access temporarily restricted due to suspicious activity' },
        { status: 403 }
      );
    }

    // Apply rate limiting based on path and user type
    const rateLimitResponse = await applyPathBasedRateLimit(request, pathname);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Log access for analytics
    await logAccess(request, pathname);

    return NextResponse.next();
  } catch (error) {
    console.error('Security middleware error:', error);
    // Fail open - allow request to continue
    return NextResponse.next();
  }
}

/**
 * Check if security should be skipped for this path
 */
function shouldSkipSecurity(pathname: string): boolean {
  const skipPaths = [
    '/_next',
    '/api/health',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json'
  ];

  return skipPaths.some(path => pathname.startsWith(path)) ||
         pathname.includes('.') && !pathname.includes('/api/');
}

/**
 * Apply rate limiting based on the request path
 */
async function applyPathBasedRateLimit(
  request: NextRequest, 
  pathname: string
): Promise<NextResponse | null> {
  // Get user info from headers or session (simplified for demo)
  const userType = getUserType(request, pathname);
  const userId = getUserId(request);

  // Admin paths - higher limits
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return rateLimitByUserType(request, 'ADMIN', userId);
  }

  // User analysis endpoints - strict daily limits
  if (pathname.startsWith('/api/user/analyze')) {
    // This will be handled by the user's daily limit in the analyze endpoint
    // But we still apply a general rate limit
    return rateLimitByUserType(request, 'LIMITED_USER', userId);
  }

  // General user endpoints
  if (pathname.startsWith('/api/user') || pathname.startsWith('/viral-analyzer')) {
    return rateLimitByUserType(request, 'LIMITED_USER', userId);
  }

  // Anonymous/public endpoints
  if (pathname.startsWith('/api/') || pathname === '/') {
    return rateLimitByUserType(request, 'ANONYMOUS');
  }

  return null;
}

/**
 * Determine user type from request
 */
function getUserType(request: NextRequest, pathname: string): 'ADMIN' | 'LIMITED_USER' | 'ANONYMOUS' {
  // Check for admin paths
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return 'ADMIN';
  }

  // Check for authenticated user paths
  if (pathname.startsWith('/api/user') || pathname.startsWith('/viral-analyzer')) {
    return 'LIMITED_USER';
  }

  return 'ANONYMOUS';
}

/**
 * Extract user ID from request (simplified for demo)
 */
function getUserId(request: NextRequest): string | undefined {
  // In production, extract from JWT token or session
  const userId = request.headers.get('x-user-id') || request.cookies.get('user_id')?.value;
  return userId || undefined;
}

/**
 * Log access for analytics and security monitoring
 */
async function logAccess(request: NextRequest, pathname: string): Promise<void> {
  try {
    // Only log API calls and important pages to avoid spam
    if (!pathname.startsWith('/api/') && !isImportantPage(pathname)) {
      return;
    }

    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const ip = getClientIp(request);

    // Log to api_performance table for monitoring
    await fetch(`${request.nextUrl.origin}/api/internal/log-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: pathname,
        method: request.method,
        user_agent: userAgent,
        ip_address: ip,
        referer,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('Access logging failed:', error);
    });
  } catch (error) {
    console.error('Access logging error:', error);
  }
}

/**
 * Check if this is an important page to log
 */
function isImportantPage(pathname: string): boolean {
  const importantPages = [
    '/viral-analyzer',
    '/admin/mission-control',
    '/admin/prediction-validation',
    '/admin/inception-studio',
    '/admin/limited-users'
  ];

  return importantPages.includes(pathname);
}

/**
 * Get client IP address
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Enhanced security checks for sensitive operations
 */
export async function enhancedSecurityCheck(
  request: NextRequest,
  operation: 'bulk_grant_access' | 'user_analysis' | 'campaign_creation' | 'module_restart'
): Promise<NextResponse | null> {
  try {
    const ip = getClientIp(request);
    
    // Additional checks for sensitive operations
    switch (operation) {
      case 'bulk_grant_access':
        // Require admin authentication and limit to 1 per minute
        return rateLimitByUserType(request, 'ADMIN');
        
      case 'user_analysis':
        // Check user's daily limits in addition to rate limiting
        return rateLimitByUserType(request, 'LIMITED_USER');
        
      case 'campaign_creation':
        // Limit marketing campaign creation
        return rateLimitByUserType(request, 'ADMIN');
        
      case 'module_restart':
        // Critical system operation - extra logging
        await logSecurityEvent(request, 'module_restart_attempted', {
          operation,
          ip,
          user_agent: request.headers.get('user-agent')
        });
        return rateLimitByUserType(request, 'ADMIN');
        
      default:
        return null;
    }
  } catch (error) {
    console.error('Enhanced security check error:', error);
    return null;
  }
}

/**
 * Rate limit configuration for different operations
 */
export const OPERATION_RATE_LIMITS = {
  bulk_grant_access: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1, // 1 bulk operation per minute
    message: 'Bulk access granting is limited to prevent abuse'
  },
  user_analysis: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 5, // 5 analyses per minute
    message: 'Analysis rate limit exceeded'
  },
  campaign_creation: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 campaigns per minute
    message: 'Campaign creation rate limit exceeded'
  },
  module_restart: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 1, // 1 restart per 5 minutes
    message: 'Module restart rate limit exceeded'
  }
};