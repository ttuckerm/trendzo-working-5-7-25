/**
 * Authentication & Authorization Middleware
 * Production-ready security system with JWT, API keys, and role-based access
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac, randomBytes } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface ApiKey {
  id: string;
  key: string;
  hashedKey: string;
  name: string;
  userId: string;
  permissions: Permission[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  expiresAt?: Date;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface AuthContext {
  user?: User;
  apiKey?: ApiKey;
  permissions: Set<Permission>;
  authMethod: 'jwt' | 'api_key' | 'none';
  rateLimitTier: 'free' | 'premium' | 'enterprise';
}

export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum Permission {
  // Viral prediction permissions
  VIRAL_PREDICTION_BASIC = 'viral:prediction:basic',
  VIRAL_PREDICTION_ADVANCED = 'viral:prediction:advanced',
  VIRAL_PREDICTION_BULK = 'viral:prediction:bulk',
  
  // Template permissions
  TEMPLATE_VIEW = 'template:view',
  TEMPLATE_USE = 'template:use',
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_MANAGE = 'template:manage',
  
  // Data permissions
  DATA_EXPORT = 'data:export',
  DATA_ANALYTICS = 'data:analytics',
  DATA_HISTORICAL = 'data:historical',
  
  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_API_KEYS = 'admin:api_keys',
  ADMIN_ANALYTICS = 'admin:analytics',
  ADMIN_SYSTEM = 'admin:system',
  
  // Special permissions
  BYPASS_RATE_LIMIT = 'special:bypass_rate_limit',
  PRIORITY_QUEUE = 'special:priority_queue'
}

/**
 * Role-based permissions mapping
 * Note: Avoid self-references during object literal initialization (TDZ errors)
 */
const baseRolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    Permission.VIRAL_PREDICTION_BASIC,
    Permission.TEMPLATE_VIEW
  ],
  [UserRole.USER]: [
    Permission.VIRAL_PREDICTION_BASIC,
    Permission.VIRAL_PREDICTION_ADVANCED,
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_USE,
    Permission.DATA_ANALYTICS
  ],
  [UserRole.PREMIUM]: [
    Permission.VIRAL_PREDICTION_BASIC,
    Permission.VIRAL_PREDICTION_ADVANCED,
    Permission.VIRAL_PREDICTION_BULK,
    Permission.TEMPLATE_VIEW,
    Permission.TEMPLATE_USE,
    Permission.TEMPLATE_CREATE,
    Permission.DATA_EXPORT,
    Permission.DATA_ANALYTICS,
    Permission.DATA_HISTORICAL,
    Permission.PRIORITY_QUEUE
  ],
  // Placeholders; will be overridden below
  [UserRole.ADMIN]: [],
  [UserRole.SUPER_ADMIN]: []
};

const rolePermissions: Record<UserRole, Permission[]> = {
  ...baseRolePermissions,
  [UserRole.ADMIN]: [
    ...baseRolePermissions[UserRole.PREMIUM],
    Permission.TEMPLATE_MANAGE,
    Permission.ADMIN_USERS,
    Permission.ADMIN_API_KEYS,
    Permission.ADMIN_ANALYTICS
  ],
  [UserRole.SUPER_ADMIN]: Object.values(Permission)
};

/**
 * JWT Token Manager
 */
export class JWTManager {
  private secret: Uint8Array | null;
  private issuer: string;
  private audience: string;

  constructor() {
    const secretKey = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    this.secret = secretKey ? new TextEncoder().encode(secretKey) : null;
    this.issuer = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
    this.audience = 'trendzo-api';
  }

  async createToken(user: User, expiresIn: string = '24h'): Promise<string> {
    if (!this.secret) {
      // In build or missing secret, return a dummy token for non-prod; throw in prod to avoid unsafe tokens
      if (process.env.NODE_ENV === 'production') throw new Error('JWT secret not configured');
      return 'dummy.token.for.dev';
    }
    const now = Math.floor(Date.now() / 1000);
    const expiration = this.parseExpiration(expiresIn);

    return await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + expiration)
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .sign(this.secret);
  }

  async verifyToken(token: string): Promise<User | null> {
    if (!this.secret) return null;
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience
      });

      return {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as UserRole,
        permissions: (payload.permissions as Permission[]) || [],
        createdAt: new Date(),
        isActive: true
      };
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  private parseExpiration(expiresIn: string): number {
    const units: Record<string, number> = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800
    };

    const match = expiresIn.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error('Invalid expiration format');
    }

    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }
}

/**
 * API Key Manager
 */
export class ApiKeyManager {
  private supabase: any;

  constructor() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }
  }

  generateApiKey(): { key: string; hashedKey: string } {
    const key = `tk_${randomBytes(32).toString('hex')}`;
    const hashedKey = createHash('sha256').update(key).digest('hex');
    return { key, hashedKey };
  }

  async createApiKey(
    userId: string,
    name: string,
    permissions: Permission[],
    expiresAt?: Date,
    rateLimit?: { requests: number; windowMs: number }
  ): Promise<ApiKey> {
    const { key, hashedKey } = this.generateApiKey();
    
    const apiKey: ApiKey = {
      id: randomBytes(16).toString('hex'),
      key,
      hashedKey,
      name,
      userId,
      permissions,
      rateLimit,
      expiresAt,
      createdAt: new Date(),
      isActive: true
    };

    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('api_keys')
          .insert({
            id: apiKey.id,
            hashed_key: hashedKey,
            name: apiKey.name,
            user_id: apiKey.userId,
            permissions: apiKey.permissions,
            rate_limit: apiKey.rateLimit,
            expires_at: apiKey.expiresAt?.toISOString(),
            created_at: apiKey.createdAt.toISOString(),
            is_active: apiKey.isActive
          });

        if (error) {
          console.error('Failed to store API key:', error);
        }
      } catch (error) {
        console.error('Database error storing API key:', error);
      }
    }

    return apiKey;
  }

  async validateApiKey(key: string): Promise<ApiKey | null> {
    if (!key || !key.startsWith('tk_')) {
      return null;
    }

    const hashedKey = createHash('sha256').update(key).digest('hex');

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('api_keys')
          .select('*')
          .eq('hashed_key', hashedKey)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          return null;
        }

        const apiKey: ApiKey = {
          id: data.id,
          key,
          hashedKey: data.hashed_key,
          name: data.name,
          userId: data.user_id,
          permissions: data.permissions || [],
          rateLimit: data.rate_limit,
          expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
          createdAt: new Date(data.created_at),
          lastUsed: data.last_used ? new Date(data.last_used) : undefined,
          isActive: data.is_active
        };

        // Check if key is expired
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          return null;
        }

        // Update last used timestamp
        this.updateLastUsed(apiKey.id);

        return apiKey;
      } catch (error) {
        console.error('Database error validating API key:', error);
      }
    }

    return null;
  }

  private async updateLastUsed(apiKeyId: string): Promise<void> {
    if (this.supabase) {
      try {
        await this.supabase
          .from('api_keys')
          .update({ last_used: new Date().toISOString() })
          .eq('id', apiKeyId);
      } catch (error) {
        console.error('Failed to update last_used:', error);
      }
    }
  }

  async revokeApiKey(apiKeyId: string): Promise<boolean> {
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('api_keys')
          .update({ is_active: false })
          .eq('id', apiKeyId);

        return !error;
      } catch (error) {
        console.error('Failed to revoke API key:', error);
      }
    }
    return false;
  }
}

/**
 * Main Authentication Service
 */
export class AuthenticationService {
  private jwtManager: JWTManager;
  private apiKeyManager: ApiKeyManager;

  constructor() {
    this.jwtManager = new JWTManager();
    this.apiKeyManager = new ApiKeyManager();
  }

  async authenticate(req: NextRequest): Promise<AuthContext> {
    const authContext: AuthContext = {
      permissions: new Set(),
      authMethod: 'none',
      rateLimitTier: 'free'
    };

    // Try API key authentication first
    const apiKey = await this.authenticateApiKey(req);
    if (apiKey) {
      authContext.apiKey = apiKey;
      authContext.permissions = new Set(apiKey.permissions);
      authContext.authMethod = 'api_key';
      authContext.rateLimitTier = this.determineRateLimitTier(apiKey.permissions);
      return authContext;
    }

    // Try JWT authentication
    const user = await this.authenticateJWT(req);
    if (user) {
      authContext.user = user;
      authContext.permissions = new Set([
        ...rolePermissions[user.role],
        ...user.permissions
      ]);
      authContext.authMethod = 'jwt';
      authContext.rateLimitTier = this.determineRateLimitTierFromRole(user.role);
      return authContext;
    }

    // Guest access
    authContext.permissions = new Set(rolePermissions[UserRole.GUEST]);
    return authContext;
  }

  private async authenticateJWT(req: NextRequest): Promise<User | null> {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.substring(7);
    return await this.jwtManager.verifyToken(token);
  }

  private async authenticateApiKey(req: NextRequest): Promise<ApiKey | null> {
    const apiKey = req.headers.get('x-api-key') || 
                   req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return null;
    }

    return await this.apiKeyManager.validateApiKey(apiKey);
  }

  private determineRateLimitTier(permissions: Permission[]): 'free' | 'premium' | 'enterprise' {
    if (permissions.includes(Permission.BYPASS_RATE_LIMIT)) {
      return 'enterprise';
    }
    if (permissions.includes(Permission.VIRAL_PREDICTION_BULK)) {
      return 'premium';
    }
    return 'free';
  }

  private determineRateLimitTierFromRole(role: UserRole): 'free' | 'premium' | 'enterprise' {
    if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
      return 'enterprise';
    }
    if (role === UserRole.PREMIUM) {
      return 'premium';
    }
    return 'free';
  }

  // Public methods for token and API key management
  async createUserToken(user: User, expiresIn?: string): Promise<string> {
    return await this.jwtManager.createToken(user, expiresIn);
  }

  async createUserApiKey(
    userId: string,
    name: string,
    permissions: Permission[],
    expiresAt?: Date,
    rateLimit?: { requests: number; windowMs: number }
  ): Promise<ApiKey> {
    return await this.apiKeyManager.createApiKey(userId, name, permissions, expiresAt, rateLimit);
  }

  async revokeApiKey(apiKeyId: string): Promise<boolean> {
    return await this.apiKeyManager.revokeApiKey(apiKeyId);
  }
}

/**
 * Authorization Middleware Factory
 */
export function requireAuth(requiredPermissions?: Permission[]) {
  const authService = new AuthenticationService();

  return async (req: NextRequest): Promise<{ authContext: AuthContext; response?: NextResponse }> => {
    const authContext = await authService.authenticate(req);

    // Check if authentication is required
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission => 
        authContext.permissions.has(permission)
      );

      if (!hasPermission) {
        return {
          authContext,
          response: NextResponse.json(
            { 
              error: 'Insufficient permissions',
              required: requiredPermissions,
              current: Array.from(authContext.permissions)
            },
            { status: 403 }
          )
        };
      }
    }

    // Add auth context to request headers for downstream use
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-auth-context', JSON.stringify({
      userId: authContext.user?.id || authContext.apiKey?.userId,
      role: authContext.user?.role,
      permissions: Array.from(authContext.permissions),
      authMethod: authContext.authMethod,
      rateLimitTier: authContext.rateLimitTier
    }));

    return { authContext };
  };
}

/**
 * Role-based access control middleware
 */
export function requireRole(requiredRole: UserRole) {
  return requireAuth(rolePermissions[requiredRole]);
}

/**
 * Permission checking utilities
 */
export function hasPermission(authContext: AuthContext, permission: Permission): boolean {
  return authContext.permissions.has(permission);
}

export function hasAnyPermission(authContext: AuthContext, permissions: Permission[]): boolean {
  return permissions.some(permission => authContext.permissions.has(permission));
}

export function hasAllPermissions(authContext: AuthContext, permissions: Permission[]): boolean {
  return permissions.every(permission => authContext.permissions.has(permission));
}

// Export singleton instance
let _authService: AuthenticationService | null = null;
export function getAuthService(): AuthenticationService {
  if (!_authService) _authService = new AuthenticationService();
  return _authService;
}