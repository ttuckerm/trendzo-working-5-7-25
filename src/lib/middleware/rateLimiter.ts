import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitOptions {
  keyGenerator?: (req: NextRequest) => string;
  skip?: (req: NextRequest) => boolean;
  onLimitReached?: (req: NextRequest) => void;
}

// Default configurations for different user types
export const RATE_LIMIT_CONFIGS = {
  LIMITED_USER: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    message: 'Too many requests. Please try again later.'
  },
  LIMITED_USER_ANALYSIS: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 3, // 3 analyses per day (handled separately in user logic)
    message: 'Daily analysis limit reached. Upgrade for unlimited access.'
  },
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Admin rate limit exceeded.'
  },
  ANONYMOUS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
    message: 'Rate limit exceeded. Please sign up for higher limits.'
  }
};

/**
 * Rate limiting middleware using Supabase for persistence
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  try {
    // Allow skipping rate limiting for certain requests
    if (options.skip && options.skip(request)) {
      return null;
    }

    // Generate rate limit key
    const key = options.keyGenerator 
      ? options.keyGenerator(request)
      : generateDefaultKey(request);

    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Clean up old entries first
    await cleanupOldEntries(windowStart);

    // Get current request count for this key
    const { data: existingLimits, error: fetchError } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('endpoint', key)
      .gte('window_start', windowStart.toISOString());

    if (fetchError) {
      console.error('Rate limit fetch error:', fetchError);
      // Allow request on database error (fail open)
      return null;
    }

    const currentCount = existingLimits?.length || 0;

    // Check if limit exceeded
    if (currentCount >= config.maxRequests) {
      // Log security event
      await logSecurityEvent(request, 'rate_limit_exceeded', {
        key,
        current_count: currentCount,
        max_requests: config.maxRequests,
        window_ms: config.windowMs
      });

      // Call limit reached callback
      if (options.onLimitReached) {
        options.onLimitReached(request);
      }

      // Mark as blocked
      await supabaseClient
        .from('rate_limits')
        .insert({
          endpoint: key,
          requests_count: currentCount + 1,
          window_start: now.toISOString(),
          window_end: new Date(now.getTime() + config.windowMs).toISOString(),
          blocked: true,
          ip_address: getClientIp(request)
        });

      return NextResponse.json(
        { 
          success: false, 
          error: config.message || 'Rate limit exceeded',
          retry_after: Math.ceil(config.windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(now.getTime() + config.windowMs).toISOString()
          }
        }
      );
    }

    // Record this request
    await supabaseClient
      .from('rate_limits')
      .insert({
        endpoint: key,
        requests_count: 1,
        window_start: now.toISOString(),
        window_end: new Date(now.getTime() + config.windowMs).toISOString(),
        blocked: false,
        ip_address: getClientIp(request)
      });

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', (config.maxRequests - currentCount - 1).toString());
    response.headers.set('X-RateLimit-Reset', new Date(now.getTime() + config.windowMs).toISOString());

    return null; // Continue with request
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Allow request on error (fail open)
    return null;
  }
}

/**
 * Generate default rate limit key
 */
function generateDefaultKey(request: NextRequest): string {
  const ip = getClientIp(request);
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  
  // Create a unique key combining IP, path, and user agent hash
  const userAgentHash = btoa(userAgent).slice(0, 8);
  return `${ip}:${pathname}:${userAgentHash}`;
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
 * Clean up old rate limit entries
 */
async function cleanupOldEntries(cutoffDate: Date): Promise<void> {
  try {
    await supabaseClient
      .from('rate_limits')
      .delete()
      .lt('window_end', cutoffDate.toISOString());
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
}

/**
 * Log security events
 */
async function logSecurityEvent(
  request: NextRequest, 
  eventType: string, 
  details: any
): Promise<void> {
  try {
    await supabaseClient
      .from('security_events')
      .insert({
        event_type: eventType,
        ip_address: getClientIp(request),
        user_agent: request.headers.get('user-agent'),
        details,
        severity: eventType === 'rate_limit_exceeded' ? 'warning' : 'info',
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Security event logging error:', error);
  }
}

/**
 * Rate limiting for specific user types
 */
export async function rateLimitByUserType(
  request: NextRequest,
  userType: keyof typeof RATE_LIMIT_CONFIGS,
  userId?: string
): Promise<NextResponse | null> {
  const config = RATE_LIMIT_CONFIGS[userType];
  
  return rateLimit(request, config, {
    keyGenerator: (req) => {
      const ip = getClientIp(req);
      const pathname = req.nextUrl.pathname;
      return userId ? `${userType}:${userId}:${pathname}` : `${userType}:${ip}:${pathname}`;
    },
    onLimitReached: (req) => {
      console.warn(`Rate limit exceeded for ${userType}:`, {
        userId,
        ip: getClientIp(req),
        pathname: req.nextUrl.pathname
      });
    }
  });
}

/**
 * Check if IP is suspicious based on recent activity
 */
export async function checkSuspiciousActivity(request: NextRequest): Promise<boolean> {
  try {
    const ip = getClientIp(request);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check for multiple blocked requests from same IP
    const { data: blockedRequests } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('ip_address', ip)
      .eq('blocked', true)
      .gte('window_start', last24Hours.toISOString());

    // Check for security events from this IP
    const { data: securityEvents } = await supabaseClient
      .from('security_events')
      .select('*')
      .eq('ip_address', ip)
      .gte('timestamp', last24Hours.toISOString());

    const blockedCount = blockedRequests?.length || 0;
    const securityEventCount = securityEvents?.length || 0;

    // IP is suspicious if:
    // - More than 10 blocked requests in 24h
    // - More than 5 security events in 24h
    const isSuspicious = blockedCount > 10 || securityEventCount > 5;

    if (isSuspicious) {
      await logSecurityEvent(request, 'suspicious_activity', {
        blocked_requests: blockedCount,
        security_events: securityEventCount,
        analysis_result: 'suspicious'
      });
    }

    return isSuspicious;
  } catch (error) {
    console.error('Suspicious activity check error:', error);
    return false;
  }
}

/**
 * Middleware wrapper for easy integration
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig,
  options?: RateLimitOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit first
    const rateLimitResponse = await rateLimit(request, config, options);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Check for suspicious activity
    const isSuspicious = await checkSuspiciousActivity(request);
    if (isSuspicious) {
      await logSecurityEvent(request, 'suspicious_ip_blocked', {
        reason: 'multiple_violations'
      });

      return NextResponse.json(
        { success: false, error: 'Access temporarily restricted' },
        { status: 403 }
      );
    }

    // Continue with original handler
    return handler(request);
  };
}