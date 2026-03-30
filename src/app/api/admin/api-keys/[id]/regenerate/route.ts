/**
 * API Key Regeneration Endpoint
 * Regenerate API key while preserving permissions and settings
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { createRateLimiter, RateLimitTiers, KeyGenerators } from '@/lib/security/rate-limiter';
import { requireAuth, Permission } from '@/lib/security/auth-middleware';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

// Rate limiting - stricter for regeneration
const regenerateRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // Only 5 regenerations per hour
  keyGenerator: KeyGenerators.byIPAndUser,
  message: 'Too many API key regeneration attempts'
});

// Database client
function getDb(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

/**
 * POST /api/admin/api-keys/[id]/regenerate
 * Regenerate an API key
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Strict rate limiting for regeneration
    const rateLimitResponse = await regenerateRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_API_KEYS
    ])(req);
    if (authResponse) return authResponse;

    const { id: apiKeyId } = params;

    // Get existing API key
    const { data: existingKey, error: fetchError } = await getDb()
      .from('api_keys')
      .select('*')
      .eq('id', apiKeyId)
      .single();

    if (fetchError || !existingKey) {
      return NextResponse.json({
        error: 'Not found',
        message: 'API key not found'
      }, { status: 404 });
    }

    // Check if key is already inactive
    if (!existingKey.is_active) {
      return NextResponse.json({
        error: 'Invalid operation',
        message: 'Cannot regenerate inactive API key'
      }, { status: 400 });
    }

    // Generate new API key
    const newKey = `tk_${randomBytes(32).toString('hex')}`;
    const newHashedKey = createHash('sha256').update(newKey).digest('hex');

    // Update database with new key
    const { data: updatedKey, error: updateError } = await getDb()
      .from('api_keys')
      .update({
        hashed_key: newHashedKey,
        updated_at: new Date().toISOString(),
        last_used: null, // Reset last used timestamp
        regenerated_at: new Date().toISOString(),
        regenerated_by: authContext.user?.id || authContext.apiKey?.userId
      })
      .eq('id', apiKeyId)
      .select(`
        id,
        name,
        permissions,
        rate_limit,
        expires_at,
        updated_at,
        is_active
      `)
      .single();

    if (updateError) {
      console.error('Failed to regenerate API key:', updateError);
      return NextResponse.json({
        error: 'Failed to regenerate API key',
        details: updateError.message
      }, { status: 500 });
    }

    // Log the regeneration for audit
    await getDb()
      .from('audit_logs')
      .insert({
        action: 'api_key_regenerated',
        resource_type: 'api_key',
        resource_id: apiKeyId,
        user_id: authContext.user?.id || authContext.apiKey?.userId,
        metadata: {
          api_key_name: existingKey.name,
          user_id: existingKey.user_id,
          old_key_preview: existingKey.hashed_key?.substring(0, 8),
          new_key_preview: newHashedKey.substring(0, 8)
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      });

    console.log('🔄 API key regenerated:', {
      id: apiKeyId,
      name: existingKey.name,
      userId: existingKey.user_id,
      regeneratedBy: authContext.user?.id || authContext.apiKey?.userId,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedKey.id,
        name: updatedKey.name,
        key: newKey, // Only returned once during regeneration
        permissions: updatedKey.permissions,
        rateLimit: updatedKey.rate_limit,
        expiresAt: updatedKey.expires_at,
        regeneratedAt: updatedKey.updated_at,
        isActive: updatedKey.is_active
      },
      message: 'API key regenerated successfully. Save the new key securely - it will not be shown again.',
      warning: 'The old API key has been invalidated and will no longer work.'
    }, { status: 200 });

  } catch (error) {
    console.error('API key regeneration error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to regenerate API key'
    }, { status: 500 });
  }
}