/**
 * Training Command Center — Config API
 *
 * POST /api/admin/training-command/config
 *   Update discovery_scan_config (enable/disable, hashtags, budget, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NICHE_REGISTRY } from '@/lib/prediction/system-registry';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();
    const nicheKey = String(body.niche_key || '').trim();

    if (!nicheKey) {
      return NextResponse.json(
        { success: false, error: 'niche_key is required' },
        { status: 400 },
      );
    }

    // Validate niche exists in registry
    const validNiche = NICHE_REGISTRY.find(n => n.key === nicheKey);
    if (!validNiche) {
      return NextResponse.json(
        { success: false, error: `Unknown niche: ${nicheKey}` },
        { status: 400 },
      );
    }

    // Build update object from allowed fields
    const update: Record<string, any> = { updated_at: new Date().toISOString() };

    if (typeof body.enabled === 'boolean') update.enabled = body.enabled;
    if (body.search_mode && ['hashtag', 'search_query', 'both'].includes(body.search_mode)) {
      update.search_mode = body.search_mode;
    }
    if (Array.isArray(body.hashtags)) update.hashtags = body.hashtags;
    if (Array.isArray(body.search_queries)) update.search_queries = body.search_queries;
    if (typeof body.max_age_minutes === 'number' && body.max_age_minutes > 0) {
      update.max_age_minutes = body.max_age_minutes;
    }
    if (typeof body.min_hearts === 'number' && body.min_hearts >= 0) {
      update.min_hearts = body.min_hearts;
    }
    if (typeof body.min_views === 'number' && body.min_views >= 0) {
      update.min_views = body.min_views;
    }
    if (typeof body.poll_interval_minutes === 'number' && body.poll_interval_minutes >= 5) {
      update.poll_interval_minutes = body.poll_interval_minutes;
    }
    if (typeof body.max_apify_calls_per_day === 'number' && body.max_apify_calls_per_day >= 0) {
      update.max_apify_calls_per_day = body.max_apify_calls_per_day;
    }
    if (typeof body.results_per_page === 'number' && body.results_per_page > 0) {
      update.results_per_page = body.results_per_page;
    }

    // If enabling, set next_poll_at to now so it's immediately scannable
    if (update.enabled === true) {
      update.next_poll_at = new Date().toISOString();
    }

    // Upsert: update existing or create new config
    const { data: existing } = await supabase
      .from('discovery_scan_config')
      .select('id')
      .eq('niche_key', nicheKey)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('discovery_scan_config')
        .update(update)
        .eq('niche_key', nicheKey)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('discovery_scan_config')
        .insert({ niche_key: nicheKey, ...update })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, config: result });
  } catch (error: any) {
    console.error('[TrainingCommand:Config] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
