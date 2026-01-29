/**
 * Advanced CORS Security Middleware
 * Production-ready CORS hardening with intelligent origin validation and security controls
 */

import { NextRequest, NextResponse } from 'next/server';

export interface CORSConfig {
  allowedOrigins: string[] | '*' | ((origin: string) => boolean);
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
  credentials: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
  securityLevel: 'strict' | 'moderate' | 'permissive';
  dynamicOrigins?: {
    enabled: boolean;
    patterns: RegExp[];
    whitelist: string[];
    blacklist: string[];
    requireHTTPS: boolean;
  };
  rateLimiting?: {
    enabled: boolean;
    maxPreflightRequests: number;
    windowMs: number;
  };
}

export interface OriginValidationResult {
  allowed: boolean;
  origin: string;
  reason?: string;
  securityRisk?: 'low' | 'medium' | 'high';
}

/**
 * Predefined CORS configurations for different security levels
 */
export const CORSPresets = {
  STRICT_PRODUCTION: {
    allowedOrigins: [], // Must be explicitly set
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Accept-Language',
      'Content-Language',
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Requested-With'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    securityLevel: 'strict' as const,
    dynamicOrigins: {
      enabled: false,
      patterns: [],
      whitelist: [],
      blacklist: [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        'file://',
        'data:',
        'javascript:',
        'vbscript:'
      ],
      requireHTTPS: true
    },
    rateLimiting: {
      enabled: true,
      maxPreflightRequests: 100,
      windowMs: 60000 // 1 minute
    }
  },

  MODERATE_DEVELOPMENT: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'https://localhost:3000'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Accept-Language',
      'Content-Language',
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Requested-With',
      'X-CSRF-Token'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Total-Count'
    ],
    credentials: true,
    maxAge: 3600, // 1 hour
    securityLevel: 'moderate' as const,
    dynamicOrigins: {
      enabled: true,
      patterns: [
        /^https?:\/\/localhost:\d+$/,
        /^https?:\/\/127\.0\.0\.1:\d+$/,
        /^https:\/\/[\w-]+\.vercel\.app$/,
        /^https:\/\/[\w-]+\.netlify\.app$/
      ],
      whitelist: [],
      blacklist: ['file://', 'data:', 'javascript:', 'vbscript:'],
      requireHTTPS: false
    },
    rateLimiting: {
      enabled: true,
      maxPreflightRequests: 200,
      windowMs: 60000
    }
  },

  PERMISSIVE_TESTING: {
    allowedOrigins: '*',
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['*'],
    exposedHeaders: ['*'],
    credentials: false,
    maxAge: 300, // 5 minutes
    securityLevel: 'permissive' as const,
    dynamicOrigins: {
      enabled: false,
      patterns: [],
      whitelist: [],
      blacklist: [],
      requireHTTPS: false
    },
    rateLimiting: {
      enabled: false,
      maxPreflightRequests: 1000,
      windowMs: 60000
    }
  }
};

/**
 * Malicious origins and patterns to block
 */
const MALICIOUS_PATTERNS = [
  /phishing/i,
  /malware/i,
  /virus/i,
  /exploit/i,
  /hack/i,
  /xss/i,
  /injection/i,
  /\d+\.\d+\.\d+\.\d+/, // Block direct IP addresses in production
  /[^\w.-]/, // Block origins with special characters
];

const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq', // Free domains often used maliciously
  '.bit', '.onion' // Special domains
];

/**
 * CORS Security Analyzer
 */
export class CORSSecurityAnalyzer {
  /**
   * Analyze origin for security risks
   */
  static analyzeOrigin(origin: string): OriginValidationResult {
    const result: OriginValidationResult = {
      allowed: false,
      origin,
      securityRisk: 'low'
    };

    try {
      // Parse URL for analysis
      const url = new URL(origin);
      
      // Check for malicious patterns
      for (const pattern of MALICIOUS_PATTERNS) {
        if (pattern.test(origin)) {
          result.reason = 'Malicious pattern detected';
          result.securityRisk = 'high';
          return result;
        }
      }

      // Check for suspicious TLDs
      for (const tld of SUSPICIOUS_TLDS) {
        if (url.hostname.endsWith(tld)) {
          result.reason = 'Suspicious TLD';
          result.securityRisk = 'medium';
          return result;
        }
      }

      // Check for local/private networks in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = url.hostname.toLowerCase();
        
        // Block localhost and private IPs
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.16.') ||
            hostname === '0.0.0.0') {
          result.reason = 'Private network origin in production';
          result.securityRisk = 'medium';
          return result;
        }
      }

      // Check protocol security
      if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
        result.reason = 'Non-HTTPS origin in production';
        result.securityRisk = 'medium';
        return result;
      }

      // Check for data URIs and other dangerous protocols
      if (['data:', 'javascript:', 'vbscript:', 'file:'].includes(url.protocol)) {
        result.reason = 'Dangerous protocol';
        result.securityRisk = 'high';
        return result;
      }

      result.allowed = true;
      return result;

    } catch (error) {
      result.reason = 'Invalid origin URL';
      result.securityRisk = 'high';
      return result;
    }
  }

  /**
   * Check if origin matches dynamic patterns
   */
  static matchesDynamicPattern(origin: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(origin));
  }

  /**
   * Check if origin is in whitelist/blacklist
   */
  static checkLists(origin: string, whitelist: string[], blacklist: string[]): boolean {
    // Blacklist takes precedence
    if (blacklist.some(blocked => origin.includes(blocked))) {
      return false;
    }

    // If whitelist exists and origin is not in it, deny
    if (whitelist.length > 0 && !whitelist.includes(origin)) {
      return false;
    }

    return true;
  }
}

/**
 * Preflight Request Rate Limiter
 */
class PreflightRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  checkLimit(origin: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const key = `preflight:${origin}`;
    const current = this.requests.get(key);

    if (!current || now > current.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= maxRequests) {
      return false;
    }

    current.count++;
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const preflightLimiter = new PreflightRateLimiter();

// Cleanup preflight limiter every 5 minutes
setInterval(() => preflightLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Main CORS Middleware Class
 */
export class CORSMiddleware {
  private config: CORSConfig;

  constructor(config: CORSConfig) {
    this.config = config;
  }

  /**
   * Validate origin against configuration
   */
  private validateOrigin(origin: string | null): OriginValidationResult {
    if (!origin) {
      return {
        allowed: false,
        origin: 'null',
        reason: 'No origin header'
      };
    }

    // Security analysis
    const securityAnalysis = CORSSecurityAnalyzer.analyzeOrigin(origin);
    if (!securityAnalysis.allowed) {
      return securityAnalysis;
    }

    // Check against configured origins
    if (this.config.allowedOrigins === '*') {
      return { allowed: true, origin };
    }

    if (Array.isArray(this.config.allowedOrigins)) {
      if (this.config.allowedOrigins.includes(origin)) {
        return { allowed: true, origin };
      }
    }

    if (typeof this.config.allowedOrigins === 'function') {
      const allowed = this.config.allowedOrigins(origin);
      return { 
        allowed, 
        origin,
        reason: allowed ? undefined : 'Rejected by custom function'
      };
    }

    // Check dynamic origins if enabled
    if (this.config.dynamicOrigins?.enabled) {
      const { patterns, whitelist, blacklist, requireHTTPS } = this.config.dynamicOrigins;

      // Check lists
      if (!CORSSecurityAnalyzer.checkLists(origin, whitelist, blacklist)) {
        return {
          allowed: false,
          origin,
          reason: 'Origin blocked by whitelist/blacklist'
        };
      }

      // Check HTTPS requirement
      if (requireHTTPS && !origin.startsWith('https://')) {
        return {
          allowed: false,
          origin,
          reason: 'HTTPS required'
        };
      }

      // Check patterns
      if (CORSSecurityAnalyzer.matchesDynamicPattern(origin, patterns)) {
        return { allowed: true, origin };
      }
    }

    return {
      allowed: false,
      origin,
      reason: 'Origin not in allowed list'
    };
  }

  /**
   * Handle preflight request
   */
  private handlePreflight(req: NextRequest, origin: string): NextResponse {
    const headers = new Headers();

    // Set origin
    headers.set('Access-Control-Allow-Origin', origin);

    // Set credentials
    if (this.config.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Set allowed methods
    headers.set('Access-Control-Allow-Methods', this.config.allowedMethods.join(', '));

    // Set allowed headers
    const requestedHeaders = req.headers.get('Access-Control-Request-Headers');
    if (requestedHeaders) {
      const allowedHeaders = this.config.allowedHeaders.includes('*') 
        ? requestedHeaders
        : this.config.allowedHeaders.filter(header => 
            requestedHeaders.toLowerCase().includes(header.toLowerCase())
          ).join(', ');
      
      headers.set('Access-Control-Allow-Headers', allowedHeaders);
    } else {
      headers.set('Access-Control-Allow-Headers', this.config.allowedHeaders.join(', '));
    }

    // Set max age
    if (this.config.maxAge) {
      headers.set('Access-Control-Max-Age', this.config.maxAge.toString());
    }

    // Security headers for preflight
    headers.set('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new NextResponse(null, {
      status: this.config.optionsSuccessStatus || 204,
      headers
    });
  }

  /**
   * Handle actual request
   */
  private handleActualRequest(req: NextRequest, origin: string): Headers {
    const headers = new Headers();

    // Set origin
    headers.set('Access-Control-Allow-Origin', origin);

    // Set credentials
    if (this.config.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Set exposed headers
    if (this.config.exposedHeaders && this.config.exposedHeaders.length > 0) {
      headers.set('Access-Control-Expose-Headers', this.config.exposedHeaders.join(', '));
    }

    // Security headers
    headers.set('Vary', 'Origin');

    return headers;
  }

  /**
   * Main middleware function
   */
  async handle(req: NextRequest): Promise<{ response?: NextResponse; headers?: Headers }> {
    const origin = req.headers.get('origin');
    const method = req.method;

    // Validate origin
    const validation = this.validateOrigin(origin);
    
    if (!validation.allowed) {
      // Log security violations
      if (validation.securityRisk === 'high') {
        console.warn('🚨 CORS Security Violation:', {
          origin: validation.origin,
          reason: validation.reason,
          risk: validation.securityRisk,
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        });
      }

      return {
        response: NextResponse.json({
          error: 'CORS policy violation',
          message: 'Origin not allowed'
        }, { status: 403 })
      };
    }

    // Handle preflight requests
    if (method === 'OPTIONS') {
      // Rate limiting for preflight requests
      if (this.config.rateLimiting?.enabled && origin) {
        const allowed = preflightLimiter.checkLimit(
          origin,
          this.config.rateLimiting.maxPreflightRequests,
          this.config.rateLimiting.windowMs
        );

        if (!allowed) {
          return {
            response: NextResponse.json({
              error: 'Rate limit exceeded',
              message: 'Too many preflight requests'
            }, { status: 429 })
          };
        }
      }

      return {
        response: this.handlePreflight(req, validation.origin)
      };
    }

    // Handle actual requests
    const corsHeaders = this.handleActualRequest(req, validation.origin);
    
    return {
      headers: corsHeaders
    };
  }
}

/**
 * CORS Middleware Factory
 */
export function createCORSMiddleware(config: CORSConfig) {
  const middleware = new CORSMiddleware(config);
  
  return async (req: NextRequest): Promise<{ response?: NextResponse; headers?: Headers }> => {
    return await middleware.handle(req);
  };
}

/**
 * Environment-based CORS configuration factory
 */
export function createEnvironmentCORS(): CORSConfig {
  const env = process.env.NODE_ENV;
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || [];

  switch (env) {
    case 'production':
      return {
        ...CORSPresets.STRICT_PRODUCTION,
        allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : [
          process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'
        ]
      };

    case 'staging':
      return {
        ...CORSPresets.MODERATE_DEVELOPMENT,
        allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : [
          'https://staging.yourdomain.com',
          'https://preview.yourdomain.com'
        ]
      };

    case 'development':
    default:
      return {
        ...CORSPresets.MODERATE_DEVELOPMENT,
        allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'https://localhost:3000'
        ]
      };
  }
}

/**
 * Common CORS middleware instances
 */
export const corsMiddleware = {
  strict: createCORSMiddleware(CORSPresets.STRICT_PRODUCTION),
  moderate: createCORSMiddleware(CORSPresets.MODERATE_DEVELOPMENT),
  permissive: createCORSMiddleware(CORSPresets.PERMISSIVE_TESTING),
  environment: createCORSMiddleware(createEnvironmentCORS())
};

// Export utilities
export { CORSSecurityAnalyzer, PreflightRateLimiter };