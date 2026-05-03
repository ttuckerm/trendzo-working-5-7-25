import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-guard';
import { createClient } from '@supabase/supabase-js';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

/**
 * Atlas Accuracy Dashboard API
 *
 * GET: Returns latest prediction accuracy summaries.
 * Requires chairman auth — feeds into the Atlas Chairman Dashboard.
 */

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const auth = await requireAuth('view_model_internals');
  if (auth.error) return auth.error;

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  // Latest accuracy summaries (last 10 periods)
  const { data: accuracy, error: accError } = await supabase
    .from('atlas_accuracy_summary')
    .select('*')
    .order('period_end', { ascending: false })
    .limit(10);

  if (accError) {
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  // Overall feedback collection stats
  const { count: totalLogged } = await supabase
    .from('prediction_log')
    .select('*', { count: 'exact', head: true });

  const { count: totalCollected } = await supabase
    .from('prediction_log')
    .select('*', { count: 'exact', head: true })
    .eq('feedback_collected', true);

  const { count: pendingCollection } = await supabase
    .from('prediction_log')
    .select('*', { count: 'exact', head: true })
    .eq('feedback_collected', false);

  return NextResponse.json({
    accuracy: accuracy || [],
    stats: {
      total_logged: totalLogged || 0,
      total_collected: totalCollected || 0,
      pending_collection: pendingCollection || 0,
      collection_rate: totalLogged && totalLogged > 0
        ? Math.round(((totalCollected || 0) / totalLogged) * 100)
        : 0,
    },
  });
}
