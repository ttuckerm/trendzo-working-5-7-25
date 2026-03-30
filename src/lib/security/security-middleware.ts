/**
 * Comprehensive Security Middleware
 * Integrates all security components into a unified protection system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, commonRateLimiters, createMultiTierRateLimiter } from './rate-limiter';
import { requireAuth, Permission, getAuthService } from './auth-middleware';
import { createValidationMiddleware } from './validation-middleware';
import { createCORSMiddleware, corsMiddleware } from './cors-middleware';
import { createSecurityHeadersMiddleware, securityHeaders } from './security-headers';
import { securityMonitor, SecurityEventType, SecuritySeverity } from './security-monitor';

export interface SecurityConfig {
  rateLimiting: {
    enabled: boolean;
    tiers: string[];
    bypassForTrustedIPs?: string[];
  };
  authentication: {
    required: boolean;
    permissions?: Permission[];
    allowApiKeys: boolean;
    allowJWT: boolean;
  };
  validation: {
    enabled: boolean;
    sanitizeInput: boolean;
    blockSuspiciousContent: boolean;
  };
  cors: {
    enabled: boolean;
    mode: 'strict' | 'moderate' | 'permissive' | 'environment';
  };
  headers: {
    enabled: boolean;
    preset: 'production' | 'development' | 'environment';
  };
  monitoring: {
    enabled: boolean;
    logAllRequests: boolean;
    alertOnThreats: boolean;
    autoBlock: boolean;
  };
  routes: {
    public: string[];
    protected: string[];
    admin: string[];
  };
}

/**
 * Default security configurations for different environments
 */
export const SecurityConfigs = {
  PRODUCTION: {
    rateLimiting: {
      enabled: true,
      tiers: ['strict', 'moderate'],
      bypassForTrustedIPs: []
    },
    authentication: {
      required: true,
      allowApiKeys: true,
      allowJWT: true
    },
    validation: {
      enabled: true,
      sanitizeInput: true,
      blockSuspiciousContent: true
    },
    cors: {
      enabled: true,
      mode: 'strict' as const
    },
    headers: {
      enabled: true,
      preset: 'production' as const
    },
    monitoring: {
      enabled: true,
      logAllRequests: true,
      alertOnThreats: true,
      autoBlock: true
    },
    routes: {
      public: ['/api/health', '/api/public'],
      protected: ['/api/viral-prediction', '/api/user'],
      admin: ['/api/admin']
    }
  },

  DEVELOPMENT: {
    rateLimiting: {
      enabled: true,
      tiers: ['moderate'],
      bypassForTrustedIPs: ['127.0.0.1', '::1']
    },
    authentication: {
      required: false,
      allowApiKeys: true,
      allowJWT: true
    },
    validation: {
      enabled: true,
      sanitizeInput: true,
      blockSuspiciousContent: false
    },
    cors: {
      enabled: true,
      mode: 'moderate' as const
    },
    headers: {
      enabled: true,
      preset: 'development' as const
    },
    monitoring: {
      enabled: true,
      logAllRequests: false,
      alertOnThreats: false,
      autoBlock: false
    },
    routes: {
      public: ['/api/health', '/api/public', '/api/dev'],
      protected: ['/api/viral-prediction', '/api/user'],
      admin: ['/api/admin']
    }
  }
};

/**
 * Main Security Middleware Class
 */
export class SecurityMiddleware {
  private config: SecurityConfig;
  private rateLimiters: Map<string, Function>;
  private corsMiddleware: Function;
  private headersMiddleware: Function;

  constructor(config: SecurityConfig) {
    this.config = config;
    this.initializeMiddlewares();
  }

  private initializeMiddlewares() {
    // Initialize rate limiters
    this.rateLimiters = new Map();
    if (this.config.rateLimiting.enabled) {
      this.config.rateLimiting.tiers.forEach(tier => {
        this.rateLimiters.set(tier, commonRateLimiters[tier as keyof typeof commonRateLimiters]);
      });
    }

    // Initialize CORS middleware
    this.corsMiddleware = this.config.cors.enabled ? 
      corsMiddleware[this.config.cors.mode] : 
      null;

    // Initialize security headers middleware
    this.headersMiddleware = this.config.headers.enabled ?
      securityHeaders[this.config.headers.preset] :
      null;
  }

  /**
   * Main middleware handler
   */
  async handle(req: NextRequest): Promise<NextResponse | null> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    try {
      // Security monitoring and threat analysis
      if (this.config.monitoring.enabled) {
        const threats = await securityMonitor.analyzeRequest(req);
        
        for (const threat of threats) {
          await securityMonitor.logEvent(threat);
          
          // Auto-block if enabled and threat is severe
          if (this.config.monitoring.autoBlock && 
              (threat.severity === SecuritySeverity.CRITICAL || threat.severity === SecuritySeverity.HIGH)) {
            return NextResponse.json({
              error: 'Security violation detected',
              message: 'Request blocked due to security policy'
            }, { status: 403 });
          }
        }
      }

      // Rate limiting
      if (this.config.rateLimiting.enabled && !this.isTrustedIP(req)) {
        const rateLimitResult = await this.applyRateLimiting(req, pathname);
        if (rateLimitResult) return rateLimitResult;
      }

      // Authentication and authorization
      if (this.requiresAuth(pathname)) {
        const authResult = await this.applyAuthentication(req, pathname);
        if (authResult) return authResult;
      }

      // CORS handling
      if (this.config.cors.enabled && this.corsMiddleware) {
        const corsResult = await this.corsMiddleware(req);
        if (corsResult.response) return corsResult.response;
      }

      // Continue to next middleware or route handler
      return null;

    } catch (error) {
      console.error('Security middleware error:', error);
      
      // Log security error
      if (this.config.monitoring.enabled) {
        await securityMonitor.logEvent({
          type: SecurityEventType.SYSTEM_OVERLOAD,
          severity: SecuritySeverity.HIGH,
          title: 'Security Middleware Error',
          description: `Security middleware failed: ${error}`,
          source: this.getClientIP(req),
          ipAddress: this.getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          endpoint: pathname,
          method: req.method,
          metadata: { error: String(error) }
        });
      }

      // Fail secure - return error
      return NextResponse.json({
        error: 'Security check failed',
        message: 'Unable to process request due to security error'
      }, { status: 500 });
    }
  }

  /**
   * Apply appropriate rate limiting based on route
   */
  private async applyRateLimiting(req: NextRequest, pathname: string): Promise<NextResponse | null> {
    // Determine rate limiting tier based on route
    let tier = 'moderate';
    
    if (this.config.routes.admin.some(route => pathname.startsWith(route))) {
      tier = 'admin';
    } else if (pathname.includes('/api/viral-prediction')) {
      tier = 'viralPrediction';
    } else if (pathname.includes('/auth/')) {
      tier = 'auth';
    } else if (this.config.rateLimiting.tiers.includes('strict')) {
      tier = 'strict';
    }

    const rateLimiter = this.rateLimiters.get(tier) || commonRateLimiters.moderate;
    return await rateLimiter(req);
  }

  /**
   * Apply authentication and authorization
   */
  private async applyAuthentication(req: NextRequest, pathname: string): Promise<NextResponse | null> {
    // Determine required permissions based on route
    let requiredPermissions: Permission[] = [];

    if (this.config.routes.admin.some(route => pathname.startsWith(route))) {
      requiredPermissions = [Permission.ADMIN_USERS];
    } else if (pathname.includes('/api/viral-prediction')) {
      requiredPermissions = [Permission.VIRAL_PREDICTION_BASIC];
    }

    const authHandler = requireAuth(requiredPermissions);
    const { authContext, response } = await authHandler(req);

    if (response) {
      // Log failed authentication
      if (this.config.monitoring.enabled) {
        await securityMonitor.logEvent({
          type: SecurityEventType.UNAUTHORIZED_ACCESS,
          severity: SecuritySeverity.MEDIUM,
          title: 'Unauthorized Access Attempt',
          description: `Unauthorized access to ${pathname}`,
          source: this.getClientIP(req),
          ipAddress: this.getClientIP(req),
          userAgent: req.headers.get('user-agent') || '',
          endpoint: pathname,
          method: req.method,
          statusCode: response.status
        });
      }
    }

    return response;
  }

  /**
   * Check if request is from trusted IP
   */
  private isTrustedIP(req: NextRequest): boolean {
    if (!this.config.rateLimiting.bypassForTrustedIPs) return false;
    
    const clientIP = this.getClientIP(req);
    return this.config.rateLimiting.bypassForTrustedIPs.includes(clientIP);
  }

  /**
   * Check if route requires authentication
   */
  private requiresAuth(pathname: string): boolean {
    // Check if it's a public route
    if (this.config.routes.public.some(route => pathname.startsWith(route))) {
      return false;
    }

    // Check if authentication is required globally
    if (this.config.authentication.required) {
      return true;
    }

    // Check if it's a protected route
    return this.config.routes.protected.some(route => pathname.startsWith(route)) ||
           this.config.routes.admin.some(route => pathname.startsWith(route));
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
           req.headers.get('x-real-ip') ||
           req.ip ||
           'unknown';
  }

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    if (!this.config.headers.enabled || !this.headersMiddleware) {
      return response;
    }

    const headers = this.headersMiddleware(null);
    
    // Apply headers to response
    for (const [key, value] of headers.entries()) {
      if (value) {
        response.headers.set(key, value);
      }
    }

    return response;
  }
}

/**
 * Create environment-specific security middleware
 */
export function createSecurityMiddleware(environment?: 'production' | 'development', customConfig?: Partial<SecurityConfig>) {
  const env = environment || (process.env.NODE_ENV as 'production' | 'development') || 'development';
  const baseConfig = env === 'production' ? SecurityConfigs.PRODUCTION : SecurityConfigs.DEVELOPMENT;
  
  const config = customConfig ? { ...baseConfig, ...customConfig } : baseConfig;
  return new SecurityMiddleware(config);
}

/**
 * Next.js middleware integration
 */
export function withSecurity(config?: Partial<SecurityConfig>) {
  const securityMiddleware = createSecurityMiddleware(undefined, config);

  return async function middleware(req: NextRequest) {
    // Apply security middleware
    const securityResult = await securityMiddleware.handle(req);
    
    if (securityResult) {
      // Security middleware returned a response (blocked, rate limited, etc.)
      return securityMiddleware.applySecurityHeaders(securityResult);
    }

    // Continue with normal request processing
    const response = NextResponse.next();
    
    // Apply security headers to successful responses
    return securityMiddleware.applySecurityHeaders(response);
  };
}

/**
 * Route-specific security configurations
 */
export const RouteSecurityConfigs = {
  VIRAL_PREDICTION: {
    rateLimiting: { enabled: true, tiers: ['viralPrediction'] },
    authentication: { required: true, permissions: [Permission.VIRAL_PREDICTION_BASIC] },
    validation: { enabled: true, sanitizeInput: true, blockSuspiciousContent: true },
    monitoring: { enabled: true, logAllRequests: true }
  },

  ADMIN_PANEL: {
    rateLimiting: { enabled: true, tiers: ['admin'] },
    authentication: { required: true, permissions: [Permission.ADMIN_USERS] },
    validation: { enabled: true, sanitizeInput: true, blockSuspiciousContent: true },
    monitoring: { enabled: true, logAllRequests: true, alertOnThreats: true }
  },

  PUBLIC_API: {
    rateLimiting: { enabled: true, tiers: ['moderate'] },
    authentication: { required: false },
    validation: { enabled: true, sanitizeInput: true, blockSuspiciousContent: false },
    monitoring: { enabled: true, logAllRequests: false }
  }
};

// Export default configured middleware
export const securityMiddleware = createSecurityMiddleware();

// Export utilities
export { SecurityEventType, SecuritySeverity, Permission } from './auth-middleware';