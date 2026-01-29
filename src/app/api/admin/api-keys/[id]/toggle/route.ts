/**
 * API Key Toggle Endpoint
 * Enable/disable API keys
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { createRateLimiter, RateLimitTiers, KeyGenerators } from '@/lib/security/rate-limiter';
import { requireAuth, Permission } from '@/lib/security/auth-middleware';
import { createClient } from '@supabase/supabase-js';

// Rate limiting
const toggleRateLimit = createRateLimiter({
  ...RateLimitTiers.ADMIN_OPERATIONS,
  keyGenerator: KeyGenerators.byIPAndUser
});

// Database client
function getDb(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

/**
 * PATCH /api/admin/api-keys/[id]/toggle
 * Toggle API key active state
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResponse = await toggleRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_API_KEYS
    ])(req);
    if (authResponse) return authResponse;

    const { id: apiKeyId } = params;

    // Get current state
    const { data: existingKey, error: fetchError } = await getDb()
      .from('api_keys')
      .select('id, name, user_id, is_active, users!inner(email)')
      .eq('id', apiKeyId)
      .single();

    if (fetchError || !existingKey) {
      return NextResponse.json({
        error: 'Not found',
        message: 'API key not found'
      }, { status: 404 });
    }

    // Toggle active state
    const newActiveState = !existingKey.is_active;

    const { data: updatedKey, error: updateError } = await getDb()
      .from('api_keys')
      .update({
        is_active: newActiveState,
        updated_at: new Date().toISOString(),
        toggled_by: authContext.user?.id || authContext.apiKey?.userId,
        toggled_at: new Date().toISOString()
      })
      .eq('id', apiKeyId)
      .select('id, name, is_active, updated_at')
      .single();

    if (updateError) {
      console.error('Failed to toggle API key:', updateError);
      return NextResponse.json({
        error: 'Failed to toggle API key',
        details: updateError.message
      }, { status: 500 });
    }

    // Log the toggle action for audit
    await getDb()
      .from('audit_logs')
      .insert({
        action: newActiveState ? 'api_key_enabled' : 'api_key_disabled',
        resource_type: 'api_key',
        resource_id: apiKeyId,
        user_id: authContext.user?.id || authContext.apiKey?.userId,
        metadata: {
          api_key_name: existingKey.name,
          owner_user_id: existingKey.user_id,
          owner_email: existingKey.users?.email,
          previous_state: existingKey.is_active,
          new_state: newActiveState
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      });

    // Log for monitoring
    console.log(`${newActiveState ? '✅' : '🔒'} API key ${newActiveState ? 'enabled' : 'disabled'}:`, {
      id: apiKeyId,
      name: existingKey.name,
      userId: existingKey.user_id,
      userEmail: existingKey.users?.email,
      newState: newActiveState,
      toggledBy: authContext.user?.id || authContext.apiKey?.userId,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedKey.id,
        name: updatedKey.name,
        isActive: updatedKey.is_active,
        updatedAt: updatedKey.updated_at,
        status: newActiveState ? 'enabled' : 'disabled'
      },
      message: `API key ${newActiveState ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('API key toggle error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to toggle API key'
    }, { status: 500 });
  }
}