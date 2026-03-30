/**
 * API Key Management API Endpoints
 * Complete CRUD operations for API key management with security
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, RateLimitTiers, KeyGenerators } from '@/lib/security/rate-limiter';
import { requireAuth, Permission, getAuthService, ApiKey } from '@/lib/security/auth-middleware';
import { createValidationMiddleware, ValidationSchemas } from '@/lib/security/validation-middleware';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';

// Rate limiting for API key management
const apiKeyRateLimit = createRateLimiter({
  ...RateLimitTiers.ADMIN_OPERATIONS,
  keyGenerator: KeyGenerators.byIPAndUser
});

// Validation schemas
const createApiKeySchema = ValidationSchemas.apiKeyCreation;

const updateApiKeySchema = {
  name: {
    field: 'name',
    type: 'string' as const,
    required: false,
    minLength: 3,
    maxLength: 100
  },
  permissions: {
    field: 'permissions',
    type: 'array' as const,
    required: false
  },
  isActive: {
    field: 'isActive',
    type: 'boolean' as const,
    required: false
  }
};

// Lazily create client to avoid build-time env evaluation
function getDb() {
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
  );
}

/**
 * GET /api/admin/api-keys
 * List all API keys for the authenticated user or admin
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await apiKeyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_API_KEYS
    ])(req);
    if (authResponse) return authResponse;

    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const userId = url.searchParams.get('userId');
    const isActive = url.searchParams.get('isActive');
    const search = url.searchParams.get('search');

    // Build query
    let query = getDb()
      .from('api_keys')
      .select(`
        id,
        name,
        hashed_key,
        user_id,
        permissions,
        rate_limit,
        expires_at,
        created_at,
        last_used,
        is_active,
        users!inner(email, role)
      `, { count: 'exact' });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,users.email.ilike.%${search}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data: apiKeys, error, count } = await query;

    if (error) {
      console.error('Database error fetching API keys:', error);
      return NextResponse.json({
        error: 'Failed to fetch API keys',
        details: error.message
      }, { status: 500 });
    }

    // Transform data to remove sensitive information
    const sanitizedKeys = apiKeys?.map(key => ({
      id: key.id,
      name: key.name,
      keyPreview: `${key.hashed_key?.substring(0, 8)}...`,
      userId: key.user_id,
      userEmail: key.users?.email,
      userRole: key.users?.role,
      permissions: key.permissions,
      rateLimit: key.rate_limit,
      expiresAt: key.expires_at,
      createdAt: key.created_at,
      lastUsed: key.last_used,
      isActive: key.is_active,
      status: key.expires_at && new Date(key.expires_at) < new Date() ? 'expired' : 
              key.is_active ? 'active' : 'disabled'
    }));

    return NextResponse.json({
      success: true,
      data: {
        apiKeys: sanitizedKeys,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('API keys listing error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to list API keys'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/api-keys
 * Create a new API key
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await apiKeyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_API_KEYS
    ])(req);
    if (authResponse) return authResponse;

    // Validation
    const validator = createValidationMiddleware(createApiKeySchema);
    const { isValid, response: validationResponse, sanitizedData } = await validator(req);
    if (!isValid) return validationResponse;

    const { name, permissions, expiresAt, rateLimit, targetUserId } = sanitizedData;
    const currentUserId = authContext.user?.id || authContext.apiKey?.userId;

    if (!currentUserId) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'User ID not found in auth context'
      }, { status: 401 });
    }

    // Create API key
    const apiKey = await getAuthService().createUserApiKey(
      targetUserId || currentUserId,
      name,
      permissions,
      expiresAt ? new Date(expiresAt) : undefined,
      rateLimit
    );

    // Log API key creation
    console.log('✅ API key created:', {
      id: apiKey.id,
      name: apiKey.name,
      userId: apiKey.userId,
      permissions: apiKey.permissions,
      createdBy: currentUserId
    });

    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Only returned once during creation
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        isActive: apiKey.isActive
      },
      message: 'API key created successfully. Save the key securely - it will not be shown again.'
    }, { status: 201 });

  } catch (error) {
    console.error('API key creation error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to create API key'
    }, { status: 500 });
  }
}

/**
 * PUT /api/admin/api-keys/[id]
 * Update an existing API key
 */
export async function PUT(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await apiKeyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_API_KEYS
    ])(req);
    if (authResponse) return authResponse;

    // Get API key ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const apiKeyId = pathParts[pathParts.length - 1];

    if (!apiKeyId) {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'API key ID is required'
      }, { status: 400 });
    }

    // Validation
    const validator = createValidationMiddleware(updateApiKeySchema);
    const { isValid, response: validationResponse, sanitizedData } = await validator(req);
    if (!isValid) return validationResponse;

    // Update API key in database
    const { data: apiKey, error } = await getDb()
      .from('api_keys')
      .update({
        name: sanitizedData.name,
        permissions: sanitizedData.permissions,
        is_active: sanitizedData.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', apiKeyId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating API key:', error);
      return NextResponse.json({
        error: 'Failed to update API key',
        details: error.message
      }, { status: 500 });
    }

    if (!apiKey) {
      return NextResponse.json({
        error: 'Not found',
        message: 'API key not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        isActive: apiKey.is_active,
        updatedAt: apiKey.updated_at
      },
      message: 'API key updated successfully'
    });

  } catch (error) {
    console.error('API key update error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update API key'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/api-keys/[id]
 * Revoke (soft delete) an API key
 */
export async function DELETE(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await apiKeyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_API_KEYS
    ])(req);
    if (authResponse) return authResponse;

    // Get API key ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const apiKeyId = pathParts[pathParts.length - 1];

    if (!apiKeyId) {
      return NextResponse.json({
        error: 'Invalid request',
        message: 'API key ID is required'
      }, { status: 400 });
    }

    // Revoke API key
    const success = await getAuthService().revokeApiKey(apiKeyId);

    if (!success) {
      return NextResponse.json({
        error: 'Failed to revoke API key',
        message: 'API key not found or already revoked'
      }, { status: 404 });
    }

    // Log API key revocation
    console.log('🔒 API key revoked:', {
      id: apiKeyId,
      revokedBy: authContext.user?.id || authContext.apiKey?.userId
    });

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('API key revocation error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to revoke API key'
    }, { status: 500 });
  }
}