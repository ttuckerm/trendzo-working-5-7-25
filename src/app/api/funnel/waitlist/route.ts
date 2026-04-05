import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BEEHIIV_BASE = 'https://api.beehiiv.com/v2'
const VALID_SOURCES = ['studio', 'canvas', 'hub'] as const
type WaitlistSource = (typeof VALID_SOURCES)[number]

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
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, source } = body as { email?: string; source?: string }

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
  }

  if (!source || !VALID_SOURCES.includes(source as WaitlistSource)) {
    return NextResponse.json({ success: false, error: 'Invalid source' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 500 })
  }

  try {
    // Check if this email already has a waitlist position
    const { data: existing } = await supabase
      .from('freedom_os_saved_plans')
      .select('id, waitlist_position')
      .eq('email', cleanEmail)
      .not('waitlist_position', 'is', null)
      .order('waitlist_position', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existing?.waitlist_position) {
      console.log('[funnel/waitlist] existing position', { email: cleanEmail, position: existing.waitlist_position })
      return NextResponse.json({ success: true, position: existing.waitlist_position })
    }

    // Calculate next position
    const { data: maxRow } = await supabase
      .from('freedom_os_saved_plans')
      .select('waitlist_position')
      .not('waitlist_position', 'is', null)
      .order('waitlist_position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextPosition = (maxRow?.waitlist_position ?? 0) + 1
    const now = new Date().toISOString()

    // Check if email has any row (from plan submission)
    const { data: existingRow } = await supabase
      .from('freedom_os_saved_plans')
      .select('id')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingRow) {
      const { error } = await supabase
        .from('freedom_os_saved_plans')
        .update({ waitlist_position: nextPosition, waitlist_joined_at: now })
        .eq('id', existingRow.id)

      if (error) {
        console.error('[funnel/waitlist] update error:', error)
        return NextResponse.json({ success: false, error: 'Failed to join waitlist' }, { status: 500 })
      }
    } else {
      const ua = request.headers.get('user-agent') || null
      const { error } = await supabase
        .from('freedom_os_saved_plans')
        .insert({
          email: cleanEmail,
          plan: null,
          segment: null,
          source_url: source,
          user_agent: ua,
          waitlist_position: nextPosition,
          waitlist_joined_at: now,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })

      if (error) {
        console.error('[funnel/waitlist] insert error:', error)
        return NextResponse.json({ success: false, error: 'Failed to join waitlist' }, { status: 500 })
      }
    }

    console.log('[funnel/waitlist] joined', { email: cleanEmail, position: nextPosition, source })

    // ── Tag in Beehiiv ──────────────────────────────────────────
    const apiKey = process.env.BEEHIIV_API_KEY
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID

    if (apiKey && publicationId) {
      const beehiivHeaders = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }

      const desiredTags = ['waitlist', 'high-intent']

      try {
        // Step 1: POST — create or reactivate subscription
        // NOTE: Beehiiv v2 POST ignores `tags` — must use PATCH (Step 2)
        const createRes = await fetch(
          `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions`,
          {
            method: 'POST',
            headers: beehiivHeaders,
            body: JSON.stringify({
              email: cleanEmail,
              reactivate_existing: true,
              send_welcome_email: false,
              utm_source: 'trendzo-waitlist',
              utm_medium: source,
              custom_fields: [
                { name: 'waitlist_source', value: source },
              ],
            }),
          },
        )

        let subscriptionId: string | null = null

        if (createRes.ok) {
          const beehiivData = await createRes.json()
          subscriptionId = beehiivData?.data?.id ?? null
          console.log('[funnel/waitlist] Beehiiv subscriber created/reactivated:', {
            email: cleanEmail,
            subscriptionId: beehiivData?.data?.id,
          })
        } else {
          const errText = await createRes.text()
          console.error('[funnel/waitlist] Beehiiv POST error:', { status: createRes.status, body: errText.slice(0, 500) })
        }

        // Step 2: PATCH — apply tags (Beehiiv v2 only accepts tags via PATCH, not POST)
        if (subscriptionId) {
          try {
            const tagRes = await fetch(
              `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions/${subscriptionId}`,
              {
                method: 'PATCH',
                headers: beehiivHeaders,
                body: JSON.stringify({ tags: desiredTags }),
              },
            )
            if (tagRes.ok) {
              const tagData = await tagRes.json()
              console.log('[funnel/waitlist] Beehiiv tag PATCH status:', tagRes.status)
              console.log('[funnel/waitlist] Beehiiv tag PATCH response tags:', tagData?.data?.tags)
            } else {
              const tagErr = await tagRes.text()
              console.error('[funnel/waitlist] Beehiiv tag PATCH error:', {
                status: tagRes.status,
                body: tagErr.slice(0, 500),
              })
            }
          } catch (tagPatchErr) {
            console.error('[funnel/waitlist] Beehiiv tag PATCH failed:', tagPatchErr)
          }
        }
      } catch (err) {
        console.error('[funnel/waitlist] Beehiiv call failed:', err)
      }
    }

    return NextResponse.json({ success: true, position: nextPosition })
  } catch (err) {
    console.error('[funnel/waitlist] unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}
