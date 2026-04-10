/**
 * Brief Review Queue API
 *
 * GET   /api/agency/brief-review?agency_id=UUID — list all draft briefs grouped by client
 * PATCH /api/agency/brief-review              — approve/reject a brief
 *   Body: { id, action: 'approve'|'reject', rejection_reason?, edited_content? }
 *
 * Approved briefs → content_briefs table with status='approved'
 * Rejected briefs → logged for Atlas feedback (brief_rejections table)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getVariantsForBriefs, selectVariant } from '@/lib/content/variant-generator'

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
  const agencyId = searchParams.get('agency_id')

  if (!agencyId) {
    return NextResponse.json({ error: 'agency_id required' }, { status: 400 })
  }

  // Fetch all draft/presented briefs for this agency
  const { data: briefs, error } = await db
    .from('pre_generated_briefs')
    .select('id, agency_id, client_id, cultural_event_id, brief_content, vps_score, confidence, priority_type, status, generated_at, expires_at, niche')
    .eq('agency_id', agencyId)
    .in('status', ['draft', 'presented'])
    .order('vps_score', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch client names for display
  const clientIds = [...new Set((briefs || []).map((b: any) => b.client_id))]
  let clientMap: Record<string, string> = {}

  if (clientIds.length > 0) {
    const { data: profiles } = await db
      .from('onboarding_profiles')
      .select('user_id, business_name')
      .in('user_id', clientIds)

    ;(profiles || []).forEach((p: any) => {
      clientMap[p.user_id] = p.business_name || 'Unknown'
    })
  }

  // Fetch cultural event titles
  const eventIds = [...new Set((briefs || []).map((b: any) => b.cultural_event_id).filter(Boolean))]
  let eventMap: Record<number, string> = {}

  if (eventIds.length > 0) {
    const { data: events } = await db
      .from('cultural_events')
      .select('id, event_title')
      .in('id', eventIds)

    ;(events || []).forEach((e: any) => {
      eventMap[e.id] = e.event_title
    })
  }

  // Fetch variants for all briefs
  const briefIds = (briefs || []).map((b: any) => b.id)
  const variantsMap = await getVariantsForBriefs(db, briefIds)

  // Enrich briefs with client names, event titles, and variants
  const enrichedBriefs = (briefs || []).map((b: any) => {
    const variants = variantsMap[b.id] || []
    // Only include alternatives if VPS delta > 5
    const variantA = variants.find((v: any) => v.variant_label === 'A')
    const alternatives = variants.filter((v: any) => v.variant_label !== 'A')
    const primaryVps = variantA?.vps_score ?? b.vps_score ?? 0
    const meaningfulAlternatives = alternatives.filter(
      (v: any) => Math.abs((v.vps_score ?? 0) - primaryVps) > 5
    )

    return {
      ...b,
      client_name: clientMap[b.client_id] || 'Unknown',
      event_title: eventMap[b.cultural_event_id] || 'Unknown Event',
      variants: variants.length > 0 ? variants : undefined,
      has_meaningful_alternatives: meaningfulAlternatives.length > 0,
    }
  })

  // Group by client
  const grouped: Record<string, any[]> = {}
  enrichedBriefs.forEach((b: any) => {
    const key = b.client_id
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(b)
  })

  // Summary counts
  const counts = {
    total: enrichedBriefs.length,
    by_priority: {
      outperformance_alert: enrichedBriefs.filter((b: any) => b.priority_type === 'outperformance_alert').length,
      decay_warning: enrichedBriefs.filter((b: any) => b.priority_type === 'decay_warning').length,
      trend_opportunity: enrichedBriefs.filter((b: any) => b.priority_type === 'trend_opportunity').length,
    },
  }

  return NextResponse.json({
    briefs: enrichedBriefs,
    grouped,
    counts,
  })
}

export async function PATCH(request: NextRequest) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })

  const body = await request.json()
  const { id, action, rejection_reason, edited_content, variant_label } = body

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 })
  }

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  // Fetch the brief
  const { data: brief, error: fetchErr } = await db
    .from('pre_generated_briefs')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  if (action === 'approve') {
    // Update pre_generated_brief status
    await db
      .from('pre_generated_briefs')
      .update({ status: 'accepted' })
      .eq('id', id)

    // Determine which content to use: variant content > edited content > original
    let briefContent = edited_content || brief.brief_content
    let approvedVps = brief.vps_score

    // If a specific variant was selected, use its content and track the selection
    if (variant_label) {
      await selectVariant(db, id, variant_label)

      // If not Variant A, fetch the variant's content
      if (variant_label !== 'A') {
        const { data: variant } = await db
          .from('brief_variants')
          .select('brief_content, vps_score')
          .eq('brief_id', id)
          .eq('variant_label', variant_label)
          .single()

        if (variant) {
          briefContent = variant.brief_content
          approvedVps = variant.vps_score ?? brief.vps_score
        }
      } else {
        // Variant A selected — still record the selection
      }
    }

    // Create entry in content_briefs table
    const { data: contentBrief, error: insertErr } = await db
      .from('content_briefs')
      .insert({
        user_id: brief.client_id,
        brief_content: briefContent,
        predicted_vps: approvedVps,
        status: 'generated', // enters the Quick Win workflow
      })
      .select('id')
      .single()

    if (insertErr) {
      return NextResponse.json({ error: `Failed to create content brief: ${insertErr.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      action: 'approved',
      pre_brief_id: id,
      content_brief_id: contentBrief?.id,
      variant_selected: variant_label || 'A',
    })
  }

  if (action === 'reject') {
    // Update pre_generated_brief status
    await db
      .from('pre_generated_briefs')
      .update({ status: 'rejected' })
      .eq('id', id)

    // Log rejection for Atlas feedback loop
    // Store in the brief_content itself as rejection metadata
    await db
      .from('pre_generated_briefs')
      .update({
        brief_content: {
          ...brief.brief_content,
          _rejection: {
            reason: rejection_reason || 'not specified',
            rejected_at: new Date().toISOString(),
            rejected_by: 'chairman',
          },
        },
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      action: 'rejected',
      pre_brief_id: id,
      rejection_logged: true,
    })
  }
}
