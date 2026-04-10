/**
 * Cultural Events Admin API
 *
 * GET  /api/admin/cultural-events              — list events (with optional ?status=detected&niche=fitness)
 * PATCH /api/admin/cultural-events             — update event status { id, status, reviewed_by }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(request: NextRequest) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const niche = searchParams.get('niche')

  let query = db
    .from('cultural_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)
  if (niche) query = query.eq('niche', niche)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also fetch summary counts
  const { data: allEvents } = await db
    .from('cultural_events')
    .select('status')

  const counts = {
    detected: 0, approved: 0, rejected: 0, expired: 0, total: 0,
  }
  ;(allEvents || []).forEach((e: any) => {
    counts.total++
    if (e.status in counts) (counts as any)[e.status]++
  })

  return NextResponse.json({ events: data || [], counts })
}

export async function PATCH(request: NextRequest) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })

  const body = await request.json()
  const { id, status, reviewed_by, event_title, event_summary, keywords } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  }

  if (!['detected', 'approved', 'rejected', 'expired'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const update: Record<string, any> = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewed_by || 'chairman',
  }

  // Allow editing title, summary, keywords during review
  if (event_title) update.event_title = event_title
  if (event_summary) update.event_summary = event_summary
  if (keywords) update.keywords = keywords

  const { error } = await db
    .from('cultural_events')
    .update(update)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, id, status })
}
