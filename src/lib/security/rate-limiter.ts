/**
 * Multi-Tier Rate Limiting System
 * Production-ready rate limiting with Redis backend and multiple strategies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  headers?: boolean;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitStore {
  get(key: string): Promise<number>;
  increment(key: string, windowMs: number): Promise<number>;
  reset(key: string): Promise<void>;
  getRemainingTTL(key: string): Promise<number>;
}

/**
 * Redis-based Rate Limit Store
 */
class RedisRateLimitStore implements RateLimitStore {
  private client: any;
  private redisAvailable: boolean = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      // Initialize Redis client if available
      if (process.env.REDIS_URL) {
        const { createClient } = await import('redis');
        this.client = createClient({
          url: process.env.REDIS_URL,
          password: process.env.REDIS_PASSWORD
        });
        
        await this.client.connect();
        this.redisAvailable = true;
        console.log('✅ Redis rate limiting store initialized');
      }
    } catch (error) {
      console.warn('⚠️ Redis not available, falling back to memory store:', error);
      this.redisAvailable = false;
    }
  }

  async get(key: string): Promise<number> {
    if (!this.redisAvailable) {
      return MemoryStore.get(key);
    }

    try {
      const value = await this.client.get(`ratelimit:${key}`);
      return value ? parseInt(value) : 0;
    } catch (error) {
      console.error('Redis get error:', error);
      return MemoryStore.get(key);
    }
  }

  async increment(key: string, windowMs: number): Promise<number> {
    if (!this.redisAvailable) {
      return MemoryStore.increment(key, windowMs);
    }

    try {
      const redisKey = `ratelimit:${key}`;
      const multi = this.client.multi();
      
      multi.incr(redisKey);
      multi.expire(redisKey, Math.ceil(windowMs / 1000));
      
      const results = await multi.exec();
      return results[0][1];
    } catch (error) {
      console.error('Redis increment error:', error);
      return MemoryStore.increment(key, windowMs);
    }
  }

  async reset(key: string): Promise<void> {
    if (!this.redisAvailable) {
      return MemoryStore.reset(key);
    }

    try {
      await this.client.del(`ratelimit:${key}`);
    } catch (error) {
      console.error('Redis reset error:', error);
      MemoryStore.reset(key);
    }
  }

  async getRemainingTTL(key: string): Promise<number> {
    if (!this.redisAvailable) {
      return MemoryStore.getRemainingTTL(key);
    }

    try {
      const ttl = await this.client.ttl(`ratelimit:${key}`);
      return ttl > 0 ? ttl * 1000 : 0;
    } catch (error) {
      console.error('Redis TTL error:', error);
      return MemoryStore.getRemainingTTL(key);
    }
  }
}

/**
 * Memory-based Rate Limit Store (Fallback)
 */
class MemoryRateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  get(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.count;
  }

  increment(key: string, windowMs: number): number {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      const newEntry = { count: 1, resetTime: now + windowMs };
      this.store.set(key, newEntry);
      return 1;
    }
    
    entry.count++;
    this.store.set(key, entry);
    return entry.count;
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  getRemainingTTL(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    
    const remaining = entry.resetTime - Date.now();
    return Math.max(0, remaining);
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const MemoryStore = new MemoryRateLimitStore();

// Cleanup memory store every 5 minutes
setInterval(() => MemoryStore.cleanup(), 5 * 60 * 1000);

/**
 * Rate Limit Configurations for Different Tiers
 */
export const RateLimitTiers = {
  // Global rate limits
  GLOBAL_STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.'
  },
  
  GLOBAL_MODERATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    message: 'Hourly rate limit exceeded.'
  },

  // API endpoint specific limits
  API_VIRAL_PREDICTION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Viral prediction API rate limit exceeded. Please wait before trying again.'
  },

  API_VIRAL_PREDICTION_PREMIUM: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Premium viral prediction rate limit exceeded.'
  },

  API_HEALTH_CHECK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Health check rate limit exceeded.'
  },

  // Authentication endpoints
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again later.'
  },

  AUTH_REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Registration rate limit exceeded.'
  },

  AUTH_PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Password reset rate limit exceeded.'
  },

  // Admin endpoints
  ADMIN_OPERATIONS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Admin operation rate limit exceeded.'
  }
};

/**
 * Key Generators for Different Rate Limiting Strategies
 */
export const KeyGenerators = {
  // By IP address
  byIP: (req: NextRequest): string => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               req.headers.get('x-real-ip') || 
               req.ip || 
               'unknown';
    return `ip:${ip}`;
  },

  // By user ID (from JWT or session)
  byUser: (req: NextRequest): string => {
    const userId = req.headers.get('x-user-id') || 'anonymous';
    return `user:${userId}`;
  },

  // By API key
  byApiKey: (req: NextRequest): string => {
    const apiKey = req.headers.get('x-api-key') || 
                   req.headers.get('authorization')?.replace('Bearer ', '') || 
                   'no-key';
    const hashedKey = createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
    return `apikey:${hashedKey}`;
  },

  // Combined strategy (IP + User)
  byIPAndUser: (req: NextRequest): string => {
    const ip = KeyGenerators.byIP(req);
    const user = KeyGenerators.byUser(req);
    return `${ip}:${user}`;
  },

  // By endpoint
  byEndpoint: (req: NextRequest): string => {
    const path = new URL(req.url).pathname;
    const method = req.method;
    return `endpoint:${method}:${path}`;
  }
};

/**
 * Main Rate Limiter Class
 */
export class RateLimiter {
  private store: RateLimitStore;

  constructor() {
    this.store = new RedisRateLimitStore();
  }

  async checkLimit(
    req: NextRequest, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const keyGenerator = config.keyGenerator || KeyGenerators.byIP;
    const key = keyGenerator(req);
    
    const current = await this.store.increment(key, config.windowMs);
    const remaining = Math.max(0, config.maxRequests - current);
    const resetTime = Date.now() + config.windowMs;
    const success = current <= config.maxRequests;

    const result: RateLimitResult = {
      success,
      limit: config.maxRequests,
      current,
      remaining,
      resetTime
    };

    if (!success) {
      const ttl = await this.store.getRemainingTTL(key);
      result.retryAfter = Math.ceil(ttl / 1000);
    }

    return result;
  }

  async resetLimit(req: NextRequest, keyGenerator?: (req: NextRequest) => string): Promise<void> {
    const generator = keyGenerator || KeyGenerators.byIP;
    const key = generator(req);
    await this.store.reset(key);
  }
}

/**
 * Rate Limiting Middleware Factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  const limiter = new RateLimiter();

  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      const result = await limiter.checkLimit(req, config);

      // Add rate limit headers
      const response = result.success ? null : NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: config.message || 'Too many requests',
          retryAfter: result.retryAfter
        },
        { status: 429 }
      );

      if (response || config.headers !== false) {
        const headers = new Headers(response?.headers);
        
        if (config.standardHeaders !== false) {
          headers.set('RateLimit-Limit', result.limit.toString());
          headers.set('RateLimit-Remaining', result.remaining.toString());
          headers.set('RateLimit-Reset', new Date(result.resetTime).toISOString());
        }
        
        if (config.legacyHeaders !== false) {
          headers.set('X-RateLimit-Limit', result.limit.toString());
          headers.set('X-RateLimit-Remaining', result.remaining.toString());
          headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
        }

        if (result.retryAfter) {
          headers.set('Retry-After', result.retryAfter.toString());
        }

        if (response) {
          return new NextResponse(response.body, {
            status: response.status,
            headers
          });
        }
      }

      return null;
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if rate limiter fails
      return null;
    }
  };
}

/**
 * Multi-Tier Rate Limiting Middleware
 */
export function createMultiTierRateLimiter(configs: { name: string; config: RateLimitConfig }[]) {
  const limiters = configs.map(({ name, config }) => ({
    name,
    limiter: createRateLimiter(config)
  }));

  return async (req: NextRequest): Promise<NextResponse | null> => {
    for (const { name, limiter } of limiters) {
      const result = await limiter(req);
      if (result) {
        // Add which rate limit was hit
        const response = NextResponse.json({
          ...JSON.parse(await result.text()),
          rateLimitTier: name
        }, { status: 429, headers: result.headers });
        
        return response;
      }
    }
    return null;
  };
}

/**
 * Rate Limit Bypass for Trusted IPs
 */
export function createTrustedIPBypass(trustedIPs: string[]) {
  return (req: NextRequest): boolean => {
    const ip = KeyGenerators.byIP(req).replace('ip:', '');
    return trustedIPs.includes(ip);
  };
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Export pre-configured rate limiters for common use cases
export const commonRateLimiters = {
  strict: createRateLimiter(RateLimitTiers.GLOBAL_STRICT),
  moderate: createRateLimiter(RateLimitTiers.GLOBAL_MODERATE),
  viralPrediction: createRateLimiter(RateLimitTiers.API_VIRAL_PREDICTION),
  viralPredictionPremium: createRateLimiter(RateLimitTiers.API_VIRAL_PREDICTION_PREMIUM),
  auth: createRateLimiter(RateLimitTiers.AUTH_LOGIN),
  admin: createRateLimiter(RateLimitTiers.ADMIN_OPERATIONS)
};