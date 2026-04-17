/**
 * Prompt 42 — Cross-niche transfer finalize API
 *
 * POST /api/admin/coordinator/cross-niche-transfer/finalize
 *   Body: { task_id }
 *   Returns: CrossNicheFinalizeResult
 *
 * Called by OperationsPanel once it sees a cross_niche_transfer
 * task flip to completed. Mirror of the Prompt 41 feature-discovery
 * finalize route. Separate from the dispatch path so the dispatcher's
 * no-post-hook invariant is preserved.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { finalizeCrossNicheTransferTask } from '@/lib/coordinator/cross-niche-transfer-finalize'

export const dynamic = 'force-dynamic'

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...(init || {}), cache: 'no-store' }),
    },
  })
}

export async function POST(request: NextRequest) {
  const db = getServiceDb()
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 })
  }

  const taskId = typeof body?.task_id === 'string' ? body.task_id : null
  if (!taskId) return NextResponse.json({ error: 'task_id required' }, { status: 400 })

  const result = await finalizeCrossNicheTransferTask(db, taskId)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
