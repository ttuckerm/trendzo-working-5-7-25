/**
 * Prompt 41 — Feature Discovery finalize API
 *
 * POST /api/admin/coordinator/feature-discovery/finalize
 *   Body: { task_id }
 *   Returns: FinalizeResult (see feature-discovery-finalize.ts)
 *
 * Called by OperationsPanel once it sees a feature_discovery task
 * flip to status='completed'. Separate from the dispatch route so
 * the dispatcher's invariants (no post-hook) are preserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { finalizeFeatureDiscoveryTask } from '@/lib/coordinator/feature-discovery-finalize';

export const dynamic = 'force-dynamic';

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...(init || {}), cache: 'no-store' }),
    },
  });
}

export async function POST(request: NextRequest) {
  const db = getServiceDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  const taskId = typeof body?.task_id === 'string' ? body.task_id : null;
  if (!taskId) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 });
  }

  const result = await finalizeFeatureDiscoveryTask(db, taskId);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
