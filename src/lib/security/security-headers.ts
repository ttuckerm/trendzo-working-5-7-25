/**
 * Comprehensive Security Headers Middleware
 * Production-ready security headers for protection against various attacks
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  // Content Security Policy
  csp: {
    enabled: boolean;
    reportOnly?: boolean;
    directives: CSPDirectives;
    reportUri?: string;
    upgradeInsecureRequests?: boolean;
  };
  
  // HTTP Strict Transport Security
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  
  // X-Frame-Options
  frameOptions: {
    enabled: boolean;
    value: 'DENY' | 'SAMEORIGIN' | string; // string for ALLOW-FROM
  };
  
  // X-Content-Type-Options
  contentTypeOptions: {
    enabled: boolean;
    nosniff: boolean;
  };
  
  // X-XSS-Protection
  xssProtection: {
    enabled: boolean;
    mode: '0' | '1' | '1; mode=block';
  };
  
  // Referrer Policy
  referrerPolicy: {
    enabled: boolean;
    policy: ReferrerPolicyValue;
  };
  
  // Permissions Policy (formerly Feature Policy)
  permissionsPolicy: {
    enabled: boolean;
    directives: PermissionsPolicyDirectives;
  };
  
  // Cross-Origin policies
  crossOrigin: {
    embedderPolicy: 'unsafe-none' | 'require-corp' | 'credentialless';
    openerPolicy: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
    resourcePolicy: 'same-site' | 'same-origin' | 'cross-origin';
  };
  
  // Additional security headers
  additional: {
    removeServerHeader: boolean;
    removePoweredBy: boolean;
    expectCT?: {
      enabled: boolean;
      maxAge: number;
      enforce: boolean;
      reportUri?: string;
    };
    publicKeyPins?: {
      enabled: boolean;
      pins: string[];
      maxAge: number;
      includeSubDomains: boolean;
      reportUri?: string;
    };
  };
  
  // Environment-specific overrides
  environment: 'development' | 'staging' | 'production';
}

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'child-src'?: string[];
  'frame-src'?: string[];
  'worker-src'?: string[];
  'frame-ancestors'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'manifest-src'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

export interface PermissionsPolicyDirectives {
  accelerometer?: string[];
  'ambient-light-sensor'?: string[];
  autoplay?: string[];
  battery?: string[];
  camera?: string[];
  'display-capture'?: string[];
  'document-domain'?: string[];
  'encrypted-media'?: string[];
  'execution-while-not-rendered'?: string[];
  'execution-while-out-of-viewport'?: string[];
  fullscreen?: string[];
  geolocation?: string[];
  gyroscope?: string[];
  magnetometer?: string[];
  microphone?: string[];
  midi?: string[];
  'navigation-override'?: string[];
  payment?: string[];
  'picture-in-picture'?: string[];
  'publickey-credentials-get'?: string[];
  'screen-wake-lock'?: string[];
  'sync-xhr'?: string[];
  usb?: string[];
  'web-share'?: string[];
  'xr-spatial-tracking'?: string[];
}

type ReferrerPolicyValue = 
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

/**
 * Predefined security configurations for different environments
 */
export const SecurityPresets = {
  PRODUCTION: {
    csp: {
      enabled: true,
      reportOnly: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'", // Remove in production after implementing nonces
          "'unsafe-eval'", // Remove after eliminating eval usage
          'https://apis.google.com',
          'https://www.google-analytics.com',
          'https://www.googletagmanager.com'
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com'
        ],
        'img-src': [
          "'self'",
          'data:',
          'https:',
          'blob:'
        ],
        'font-src': [
          "'self'",
          'https://fonts.gstatic.com'
        ],
        'connect-src': [
          "'self'",
          'https://api.openai.com',
          'https://api.anthropic.com',
          'https://*.supabase.co',
          'wss://*.supabase.co'
        ],
        'media-src': ["'self'", 'https:', 'blob:'],
        'object-src': ["'none'"],
        'child-src': ["'self'"],
        'frame-src': [
          "'self'",
          'https://accounts.google.com',
          'https://www.youtube.com'
        ],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
        'base-uri': ["'self'"],
        'manifest-src': ["'self'"],
        'upgrade-insecure-requests': true,
        'block-all-mixed-content': true
      },
      upgradeInsecureRequests: true
    },
    hsts: {
      enabled: true,
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameOptions: {
      enabled: true,
      value: 'DENY'
    },
    contentTypeOptions: {
      enabled: true,
      nosniff: true
    },
    xssProtection: {
      enabled: true,
      mode: '1; mode=block'
    },
    referrerPolicy: {
      enabled: true,
      policy: 'strict-origin-when-cross-origin'
    },
    permissionsPolicy: {
      enabled: true,
      directives: {
        camera: [],
        microphone: [],
        geolocation: [],
        payment: [],
        usb: [],
        'xr-spatial-tracking': [],
        autoplay: ["'self'"]
      }
    },
    crossOrigin: {
      embedderPolicy: 'require-corp',
      openerPolicy: 'same-origin',
      resourcePolicy: 'same-origin'
    },
    additional: {
      removeServerHeader: true,
      removePoweredBy: true,
      expectCT: {
        enabled: true,
        maxAge: 86400,
        enforce: true
      }
    },
    environment: 'production' as const
  },

  DEVELOPMENT: {
    csp: {
      enabled: true,
      reportOnly: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https:',
          'http:',
          'ws:',
          'wss:'
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https:',
          'http:'
        ],
        'img-src': ["'self'", 'data:', 'https:', 'http:', 'blob:'],
        'font-src': ["'self'", 'https:', 'http:', 'data:'],
        'connect-src': [
          "'self'",
          'https:',
          'http:',
          'ws:',
          'wss:',
          'data:'
        ],
        'media-src': ["'self'", 'https:', 'http:', 'blob:', 'data:'],
        'object-src': ["'none'"],
        'child-src': ["'self'", 'blob:'],
        'frame-src': ["'self'", 'https:', 'http:'],
        'frame-ancestors': ["'self'"],
        'form-action': ["'self'"],
        'base-uri': ["'self'"]
      }
    },
    hsts: {
      enabled: false,
      maxAge: 300,
      includeSubDomains: false,
      preload: false
    },
    frameOptions: {
      enabled: true,
      value: 'SAMEORIGIN'
    },
    contentTypeOptions: {
      enabled: true,
      nosniff: true
    },
    xssProtection: {
      enabled: true,
      mode: '1; mode=block'
    },
    referrerPolicy: {
      enabled: true,
      policy: 'strict-origin-when-cross-origin'
    },
    permissionsPolicy: {
      enabled: false,
      directives: {}
    },
    crossOrigin: {
      embedderPolicy: 'unsafe-none',
      openerPolicy: 'unsafe-none',
      resourcePolicy: 'cross-origin'
    },
    additional: {
      removeServerHeader: false,
      removePoweredBy: true
    },
    environment: 'development' as const
  }
};

/**
 * Security Headers Builder
 */
export class SecurityHeadersBuilder {
  private config: SecurityHeadersConfig;

  constructor(config: SecurityHeadersConfig) {
    this.config = config;
  }

  /**
   * Build Content Security Policy header
   */
  private buildCSP(): string {
    const { csp } = this.config;
    const directives: string[] = [];

    for (const [directive, values] of Object.entries(csp.directives)) {
      if (directive === 'upgrade-insecure-requests' && values === true) {
        directives.push('upgrade-insecure-requests');
      } else if (directive === 'block-all-mixed-content' && values === true) {
        directives.push('block-all-mixed-content');
      } else if (Array.isArray(values) && values.length > 0) {
        directives.push(`${directive} ${values.join(' ')}`);
      }
    }

    if (csp.reportUri) {
      directives.push(`report-uri ${csp.reportUri}`);
    }

    return directives.join('; ');
  }

  /**
   * Build Permissions Policy header
   */
  private buildPermissionsPolicy(): string {
    const { permissionsPolicy } = this.config;
    const directives: string[] = [];

    for (const [directive, values] of Object.entries(permissionsPolicy.directives)) {
      if (Array.isArray(values)) {
        if (values.length === 0) {
          directives.push(`${directive}=()`);
        } else {
          const allowList = values.map(v => 
            v === "'self'" ? 'self' : v === "'none'" ? '' : `"${v}"`
          ).join(' ');
          directives.push(`${directive}=(${allowList})`);
        }
      }
    }

    return directives.join(', ');
  }

  /**
   * Build Public Key Pins header
   */
  private buildPKP(): string | null {
    const { publicKeyPins } = this.config.additional;
    if (!publicKeyPins?.enabled) return null;

    const directives = [
      ...publicKeyPins.pins.map(pin => `pin-sha256="${pin}"`),
      `max-age=${publicKeyPins.maxAge}`
    ];

    if (publicKeyPins.includeSubDomains) {
      directives.push('includeSubDomains');
    }

    if (publicKeyPins.reportUri) {
      directives.push(`report-uri="${publicKeyPins.reportUri}"`);
    }

    return directives.join('; ');
  }

  /**
   * Build Expect-CT header
   */
  private buildExpectCT(): string | null {
    const { expectCT } = this.config.additional;
    if (!expectCT?.enabled) return null;

    const directives = [`max-age=${expectCT.maxAge}`];

    if (expectCT.enforce) {
      directives.push('enforce');
    }

    if (expectCT.reportUri) {
      directives.push(`report-uri="${expectCT.reportUri}"`);
    }

    return directives.join(', ');
  }

  /**
   * Build all security headers
   */
  buildHeaders(): Headers {
    const headers = new Headers();

    // Content Security Policy
    if (this.config.csp.enabled) {
      const cspHeader = this.config.csp.reportOnly ? 
        'Content-Security-Policy-Report-Only' : 
        'Content-Security-Policy';
      headers.set(cspHeader, this.buildCSP());
    }

    // HTTP Strict Transport Security
    if (this.config.hsts.enabled) {
      const hstsDirectives = [`max-age=${this.config.hsts.maxAge}`];
      if (this.config.hsts.includeSubDomains) {
        hstsDirectives.push('includeSubDomains');
      }
      if (this.config.hsts.preload) {
        hstsDirectives.push('preload');
      }
      headers.set('Strict-Transport-Security', hstsDirectives.join('; '));
    }

    // X-Frame-Options
    if (this.config.frameOptions.enabled) {
      headers.set('X-Frame-Options', this.config.frameOptions.value);
    }

    // X-Content-Type-Options
    if (this.config.contentTypeOptions.enabled && this.config.contentTypeOptions.nosniff) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection
    if (this.config.xssProtection.enabled) {
      headers.set('X-XSS-Protection', this.config.xssProtection.mode);
    }

    // Referrer Policy
    if (this.config.referrerPolicy.enabled) {
      headers.set('Referrer-Policy', this.config.referrerPolicy.policy);
    }

    // Permissions Policy
    if (this.config.permissionsPolicy.enabled) {
      const permissionsPolicy = this.buildPermissionsPolicy();
      if (permissionsPolicy) {
        headers.set('Permissions-Policy', permissionsPolicy);
      }
    }

    // Cross-Origin Embedder Policy
    headers.set('Cross-Origin-Embedder-Policy', this.config.crossOrigin.embedderPolicy);

    // Cross-Origin Opener Policy
    headers.set('Cross-Origin-Opener-Policy', this.config.crossOrigin.openerPolicy);

    // Cross-Origin Resource Policy
    headers.set('Cross-Origin-Resource-Policy', this.config.crossOrigin.resourcePolicy);

    // Expect-CT
    const expectCT = this.buildExpectCT();
    if (expectCT) {
      headers.set('Expect-CT', expectCT);
    }

    // Public Key Pins (use with caution)
    const pkp = this.buildPKP();
    if (pkp) {
      headers.set('Public-Key-Pins', pkp);
    }

    // Additional security headers
    headers.set('X-DNS-Prefetch-Control', 'off');
    headers.set('X-Download-Options', 'noopen');
    headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    // Cache control for security-sensitive content
    if (this.config.environment === 'production') {
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    }

    // Remove server identification headers
    if (this.config.additional.removeServerHeader) {
      headers.delete('Server');
      headers.set('Server', ''); // Override server header
    }

    if (this.config.additional.removePoweredBy) {
      headers.delete('X-Powered-By');
    }

    return headers;
  }
}

/**
 * Security Headers Middleware
 */
export class SecurityHeadersMiddleware {
  private builder: SecurityHeadersBuilder;

  constructor(config: SecurityHeadersConfig) {
    this.builder = new SecurityHeadersBuilder(config);
  }

  /**
   * Apply security headers to response
   */
  applyHeaders(response: NextResponse): NextResponse {
    const securityHeaders = this.builder.buildHeaders();

    // Add security headers to response
    for (const [key, value] of securityHeaders.entries()) {
      if (value) {
        response.headers.set(key, value);
      }
    }

    return response;
  }

  /**
   * Get security headers for middleware
   */
  getHeaders(): Headers {
    return this.builder.buildHeaders();
  }
}

/**
 * Nonce Generator for CSP
 */
export class NonceGenerator {
  private static instance: NonceGenerator;
  private nonces = new Map<string, { nonce: string; timestamp: number }>();

  static getInstance(): NonceGenerator {
    if (!NonceGenerator.instance) {
      NonceGenerator.instance = new NonceGenerator();
    }
    return NonceGenerator.instance;
  }

  generateNonce(requestId?: string): string {
    const nonce = Buffer.from(
      require('crypto').randomBytes(16)
    ).toString('base64');

    if (requestId) {
      this.nonces.set(requestId, { nonce, timestamp: Date.now() });
    }

    return nonce;
  }

  getNonce(requestId: string): string | null {
    const entry = this.nonces.get(requestId);
    if (!entry) return null;

    // Clean up expired nonces (older than 5 minutes)
    if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
      this.nonces.delete(requestId);
      return null;
    }

    return entry.nonce;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [requestId, entry] of this.nonces.entries()) {
      if (now - entry.timestamp > 5 * 60 * 1000) {
        this.nonces.delete(requestId);
      }
    }
  }
}

// Cleanup nonces every minute
setInterval(() => {
  NonceGenerator.getInstance().cleanup();
}, 60 * 1000);

/**
 * Middleware factory function
 */
export function createSecurityHeadersMiddleware(config?: Partial<SecurityHeadersConfig>) {
  const environment = process.env.NODE_ENV as 'development' | 'staging' | 'production';
  const baseConfig = environment === 'production' ? 
    SecurityPresets.PRODUCTION : 
    SecurityPresets.DEVELOPMENT;

  const finalConfig = config ? { ...baseConfig, ...config } : baseConfig;
  const middleware = new SecurityHeadersMiddleware(finalConfig);

  return (req: NextRequest): Headers => {
    return middleware.getHeaders();
  };
}

/**
 * Environment-based security headers
 */
export function createEnvironmentSecurityHeaders(): SecurityHeadersConfig {
  const environment = process.env.NODE_ENV as 'development' | 'staging' | 'production';
  
  switch (environment) {
    case 'production':
      return SecurityPresets.PRODUCTION;
    case 'development':
    default:
      return SecurityPresets.DEVELOPMENT;
  }
}

// Export pre-configured instances
export const securityHeaders = {
  production: createSecurityHeadersMiddleware(SecurityPresets.PRODUCTION),
  development: createSecurityHeadersMiddleware(SecurityPresets.DEVELOPMENT),
  environment: createSecurityHeadersMiddleware()
};

// Export utilities
export { SecurityHeadersBuilder, NonceGenerator };