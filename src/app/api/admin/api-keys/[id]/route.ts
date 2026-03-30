/**
 * Individual API Key Management Endpoints
 * Detailed operations for specific API keys
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { createRateLimiter, RateLimitTiers, KeyGenerators } from '@/lib/security/rate-limiter';
import { requireAuth, Permission } from '@/lib/security/auth-middleware';
import { createClient } from '@supabase/supabase-js';

// Rate limiting
const apiKeyRateLimit = createRateLimiter({
  ...RateLimitTiers.ADMIN_OPERATIONS,
  keyGenerator: KeyGenerators.byIPAndUser
});

function getDb(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

/**
 * GET /api/admin/api-keys/[id]
 * Get detailed information about a specific API key
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResponse = await apiKeyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_API_KEYS
    ])(req);
    if (authResponse) return authResponse;

    const { id: apiKeyId } = params;

    // Get API key details with usage statistics
    const { data: apiKey, error } = await getDb()
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
        users!inner(email, role, created_at)
      `)
      .eq('id', apiKeyId)
      .single();

    if (error || !apiKey) {
      return NextResponse.json({
        error: 'Not found',
        message: 'API key not found'
      }, { status: 404 });
    }

    // Get usage statistics (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: usageStats, error: usageError } = await getDb()
      .from('api_usage_logs')
      .select('endpoint, status_code, response_time, created_at')
      .eq('api_key_id', apiKeyId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });

    if (usageError) {
      console.warn('Failed to fetch usage stats:', usageError);
    }

    // Calculate usage metrics
    const usageMetrics = usageStats ? {
      totalRequests: usageStats.length,
      successfulRequests: usageStats.filter(log => log.status_code < 400).length,
      errorRequests: usageStats.filter(log => log.status_code >= 400).length,
      averageResponseTime: usageStats.length > 0 ? 
        usageStats.reduce((sum, log) => sum + (log.response_time || 0), 0) / usageStats.length : 0,
      lastUsed: apiKey.last_used,
      popularEndpoints: this.getPopularEndpoints(usageStats),
      dailyUsage: this.getDailyUsage(usageStats)
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        keyPreview: `${apiKey.hashed_key?.substring(0, 12)}...`,
        user: {
          id: apiKey.user_id,
          email: apiKey.users?.email,
          role: apiKey.users?.role,
          memberSince: apiKey.users?.created_at
        },
        permissions: apiKey.permissions,
        rateLimit: apiKey.rate_limit,
        expiresAt: apiKey.expires_at,
        createdAt: apiKey.created_at,
        lastUsed: apiKey.last_used,
        isActive: apiKey.is_active,
        status: this.getKeyStatus(apiKey),
        usage: usageMetrics
      }
    });

  } catch (error) {
    console.error('API key details error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch API key details'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/api-keys/[id]/regenerate
 * Regenerate an API key (create new key, invalidate old one)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResponse = await apiKeyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication & authorization
    const { authContext, response: authResponse } = await requireAuth([
      Permission.ADMIN_API_KEYS
    ])(req);
    if (authResponse) return authResponse;

    const { id: apiKeyId } = params;
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (action === 'regenerate') {
      return await this.handleRegenerate(apiKeyId, authContext);
    } else if (action === 'toggle') {
      return await this.handleToggle(apiKeyId, authContext);
    } else {
      return NextResponse.json({
        error: 'Invalid action',
        message: 'Action not supported'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('API key action error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to perform action'
    }, { status: 500 });
  }
}

/**
 * Helper methods
 */
async function handleRegenerate(apiKeyId: string, authContext: any) {
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

  // Generate new key
  const crypto = require('crypto');
  const newKey = `tk_${crypto.randomBytes(32).toString('hex')}`;
  const newHashedKey = crypto.createHash('sha256').update(newKey).digest('hex');

  // Update database with new key
  const { data: updatedKey, error: updateError } = await getDb()
    .from('api_keys')
    .update({
      hashed_key: newHashedKey,
      updated_at: new Date().toISOString(),
      last_used: null // Reset last used
    })
    .eq('id', apiKeyId)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to regenerate API key:', updateError);
    return NextResponse.json({
      error: 'Failed to regenerate API key',
      details: updateError.message
    }, { status: 500 });
  }

  // Log the regeneration
  console.log('🔄 API key regenerated:', {
    id: apiKeyId,
    name: existingKey.name,
    regeneratedBy: authContext.user?.id || authContext.apiKey?.userId
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updatedKey.id,
      name: updatedKey.name,
      key: newKey, // Only returned once
      regeneratedAt: updatedKey.updated_at
    },
    message: 'API key regenerated successfully. Save the new key securely - it will not be shown again.'
  });
}

async function handleToggle(apiKeyId: string, authContext: any) {
  // Get current state
  const { data: existingKey, error: fetchError } = await getDb()
    .from('api_keys')
    .select('is_active, name')
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
      updated_at: new Date().toISOString()
    })
    .eq('id', apiKeyId)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to toggle API key:', updateError);
    return NextResponse.json({
      error: 'Failed to toggle API key',
      details: updateError.message
    }, { status: 500 });
  }

  // Log the toggle
  console.log(`${newActiveState ? '✅' : '🔒'} API key ${newActiveState ? 'enabled' : 'disabled'}:`, {
    id: apiKeyId,
    name: existingKey.name,
    newState: newActiveState,
    toggledBy: authContext.user?.id || authContext.apiKey?.userId
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updatedKey.id,
      isActive: updatedKey.is_active,
      updatedAt: updatedKey.updated_at
    },
    message: `API key ${newActiveState ? 'enabled' : 'disabled'} successfully`
  });
}

function getKeyStatus(apiKey: any): string {
  if (!apiKey.is_active) return 'disabled';
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return 'expired';
  return 'active';
}

function getPopularEndpoints(usageStats: any[]): Array<{endpoint: string, count: number}> {
  if (!usageStats || usageStats.length === 0) return [];

  const endpointCounts = usageStats.reduce((acc, log) => {
    acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(endpointCounts)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getDailyUsage(usageStats: any[]): Array<{date: string, requests: number}> {
  if (!usageStats || usageStats.length === 0) return [];

  const dailyCounts = usageStats.reduce((acc, log) => {
    const date = new Date(log.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(dailyCounts)
    .map(([date, requests]) => ({ date, requests }))
    .sort((a, b) => a.date.localeCompare(b.date));
}