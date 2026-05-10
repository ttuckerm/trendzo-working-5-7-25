import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BEEHIIV_BASE = 'https://api.beehiiv.com/v2'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    const supabase = getServiceSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Fetch card
    const { data: card, error: cardError } = await supabase
      .from('agent_cards')
      .select('id, creator_name, creator_niche, agency_name')
      .eq('share_id', shareId)
      .eq('is_active', true)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Save lead
    const { error: insertError } = await supabase
      .from('agent_card_leads')
      .insert({
        card_id: card.id,
        email: cleanEmail,
        source: 'card_cta',
      })

    if (insertError) {
      console.error('[card-lead] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    // Increment lead count (fire-and-forget)
    void supabase.rpc('increment_card_leads', { card_share_id: shareId })

    // Beehiiv subscription (fire-and-forget-ish — best effort)
    const apiKey = process.env.BEEHIIV_API_KEY
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID

    if (apiKey && publicationId) {
      try {
        await fetch(
          `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: cleanEmail,
              reactivate_existing: true,
              send_welcome_email: false,
              utm_source: 'trendzo-agent-card',
              utm_medium: 'card',
              utm_campaign: `card-${card.creator_niche}`,
              custom_fields: [
                { name: 'source', value: 'agent-card' },
                { name: 'card_creator', value: card.creator_name },
                { name: 'card_niche', value: card.creator_niche },
                { name: 'card_agency', value: card.agency_name },
              ],
            }),
          }
        )
        console.log('[card-lead] Beehiiv subscription sent for', cleanEmail)
      } catch (beehiivErr) {
        console.warn('[card-lead] Beehiiv subscription failed:', beehiivErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[card-lead] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
