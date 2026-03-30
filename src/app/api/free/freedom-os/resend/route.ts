import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BEEHIIV_BASE = 'https://api.beehiiv.com/v2'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { email } = body as { email?: string }

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ ok: false, error: 'Invalid email address' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  console.log('[freedom-os/resend] Resend requested:', { email: cleanEmail })

  // ── Look up most recent non-expired plan ─────────────────────
  const supabase = getServiceSupabase()
  if (!supabase) {
    console.warn('[freedom-os/resend] Supabase not configured')
    return NextResponse.json({ ok: false, error: 'Service unavailable' }, { status: 503 })
  }

  const { data: row, error } = await supabase
    .from('freedom_os_saved_plans')
    .select('id, expires_at')
    .eq('email', cleanEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !row) {
    console.log('[freedom-os/resend] No plan found for email:', { email: cleanEmail })
    return NextResponse.json({ ok: false, error: 'No saved plan found for this email.' }, { status: 404 })
  }

  // Check if expired
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    console.log('[freedom-os/resend] Plan expired:', { planId: row.id, expires_at: row.expires_at })
    return NextResponse.json({ ok: false, error: 'Your plan has expired. Please generate a new one.' }, { status: 410 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const planLink = `${siteUrl}/free/freedom-os/plan/${row.id}`

  console.log('[freedom-os/resend] Plan found, resending:', { planId: row.id, planLink })

  // ── Re-trigger Beehiiv custom field update ───────────────────
  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID

  if (apiKey && publicationId) {
    const beehiivHeaders = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }

    try {
      // Look up subscriber by email
      const lookupRes = await fetch(
        `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions?email=${encodeURIComponent(cleanEmail)}`,
        { headers: beehiivHeaders },
      )
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json()
        const subscriptionId = lookupData?.data?.[0]?.id
        if (subscriptionId) {
          // PUT to update freedom_os_plan_url
          const updateRes = await fetch(
            `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions/${subscriptionId}`,
            {
              method: 'PUT',
              headers: beehiivHeaders,
              body: JSON.stringify({
                custom_fields: [{ name: 'freedom_os_plan_url', value: planLink }],
              }),
            },
          )
          if (updateRes.ok) {
            console.log('[freedom-os/resend] Beehiiv freedom_os_plan_url updated:', { subscriptionId })
          } else {
            console.error('[freedom-os/resend] Beehiiv PUT error:', { status: updateRes.status })
          }
        }
      }
    } catch (err) {
      console.error('[freedom-os/resend] Beehiiv update failed:', err)
    }
  }

  return NextResponse.json({ ok: true, planLink })
}
