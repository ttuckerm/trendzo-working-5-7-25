/**
 * Agency Memory CRUD API
 *
 * GET    /api/agency/memory?agency_id=UUID&tier=hot|warm|cold
 * POST   /api/agency/memory  { agency_id, fact, tier?, confidence? }
 * PATCH  /api/agency/memory  { id, fact?, tier?, confidence? }
 * DELETE /api/agency/memory  { id }
 *
 * All mutations log to memory_consolidation_log with source='operator_override'.
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

// ── GET — List facts ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const agencyId = searchParams.get('agency_id')
  if (!agencyId) return NextResponse.json({ error: 'agency_id required' }, { status: 400 })

  const tier = searchParams.get('tier')

  let query = db
    .from('memory_extractions')
    .select('*')
    .eq('agency_id', agencyId)
    .order('confidence', { ascending: false })

  if (tier) {
    query = query.eq('tier', tier)
  }

  const { data, error } = await query.limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Compute hot token usage
  const hotFacts = (data || []).filter((f: any) => f.tier === 'hot')
  const hotTokens = hotFacts.reduce((sum: number, f: any) => sum + Math.ceil(f.fact.length / 4), 0)

  return NextResponse.json({
    facts: data || [],
    hot_token_usage: hotTokens,
    hot_token_budget: 2000,
  })
}

// ── POST — Create fact ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })

  const body = await request.json()
  const { agency_id, fact, tier, confidence } = body

  if (!agency_id || !fact) {
    return NextResponse.json({ error: 'agency_id and fact required' }, { status: 400 })
  }

  if (fact.length > 2000) {
    return NextResponse.json({ error: 'Fact too long (max 2000 chars)' }, { status: 400 })
  }

  const targetTier = tier || 'hot'

  // Check token budget if adding to hot
  if (targetTier === 'hot') {
    const { data: hotFacts } = await db
      .from('memory_extractions')
      .select('fact')
      .eq('agency_id', agency_id)
      .eq('tier', 'hot')

    const currentTokens = (hotFacts || []).reduce((sum: number, f: any) => sum + Math.ceil(f.fact.length / 4), 0)
    const newTokens = Math.ceil(fact.length / 4)

    if (currentTokens + newTokens > 2000) {
      return NextResponse.json({
        error: 'Would exceed hot memory token budget',
        current_tokens: currentTokens,
        new_tokens: newTokens,
        budget: 2000,
      }, { status: 422 })
    }
  }

  const { data, error } = await db
    .from('memory_extractions')
    .insert({
      agency_id,
      fact,
      source: 'operator_override',
      tier: targetTier,
      confidence: confidence ?? 1.0,
      reference_count: 1,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the addition
  await db.from('memory_consolidation_log').insert({
    agency_id,
    facts_added: 1,
    generated_by_agent: 'Memory Keeper',
  })

  return NextResponse.json({ fact: data })
}

// ── PATCH — Update fact ─────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })

  const body = await request.json()
  const { id, agency_id, fact, tier, confidence } = body

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (fact !== undefined) updates.fact = fact
  if (tier !== undefined) updates.tier = tier
  if (confidence !== undefined) updates.confidence = confidence

  // If promoting to hot, check token budget
  if (tier === 'hot' && agency_id) {
    const { data: hotFacts } = await db
      .from('memory_extractions')
      .select('fact')
      .eq('agency_id', agency_id)
      .eq('tier', 'hot')

    const currentTokens = (hotFacts || []).reduce((sum: number, f: any) => sum + Math.ceil(f.fact.length / 4), 0)

    // Get the fact being promoted
    const { data: existing } = await db
      .from('memory_extractions')
      .select('fact, tier')
      .eq('id', id)
      .single()

    if (existing && existing.tier !== 'hot') {
      const addTokens = Math.ceil(existing.fact.length / 4)
      if (currentTokens + addTokens > 2000) {
        return NextResponse.json({
          error: 'Would exceed hot memory token budget',
          current_tokens: currentTokens,
          new_tokens: addTokens,
          budget: 2000,
        }, { status: 422 })
      }
    }
  }

  const { data, error } = await db
    .from('memory_extractions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the change
  if (agency_id) {
    const logEntry: Record<string, any> = {
      agency_id,
      generated_by_agent: 'Memory Keeper',
    }
    if (tier === 'warm' || tier === 'cold') logEntry.facts_demoted = 1
    try { await db.from('memory_consolidation_log').insert(logEntry) } catch {}
  }

  return NextResponse.json({ fact: data })
}

// ── DELETE — Remove fact ────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })

  const body = await request.json()
  const { id, agency_id } = body

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await db
    .from('memory_extractions')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the deletion
  if (agency_id) {
    await db.from('memory_consolidation_log').insert({
      agency_id,
      facts_demoted: 1,
      generated_by_agent: 'Memory Keeper',
    })
  }

  return NextResponse.json({ success: true })
}
