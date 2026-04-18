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
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, source, segment } = body as {
    email?: string
    source?: string
    segment?: string
  }

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
  }
  if (!source || typeof source !== 'string' || !source.trim()) {
    return NextResponse.json({ success: false, error: 'Missing source' }, { status: 400 })
  }
  if (!segment || typeof segment !== 'string' || !segment.trim()) {
    return NextResponse.json({ success: false, error: 'Missing segment' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanSource = source.trim()
  const cleanSegment = segment.trim()

  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationId = process.env.BEEHIIV_PUB_ID
  const freedomAgentAutomationId = process.env.FREEDOM_AGENT_AUTOMATION_ID

  if (!apiKey || !publicationId || !freedomAgentAutomationId) {
    console.error('[subscribe] Missing required env vars:', {
      hasApiKey: Boolean(apiKey),
      hasPubId: Boolean(publicationId),
      hasAutomationId: Boolean(freedomAgentAutomationId),
    })
    return NextResponse.json({ success: false, error: 'Service not configured' }, { status: 500 })
  }

  const beehiivHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  const desiredTags = [`${cleanSource}-lead`, cleanSegment]
  let subscriberId: string | null = null
  let status: 'created' | 'existing' | 'failed' = 'failed'
  let errorDetail: string | null = null

  try {
    const createRes = await fetch(
      `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions`,
      {
        method: 'POST',
        headers: beehiivHeaders,
        body: JSON.stringify({
          email: cleanEmail,
          utm_source: cleanSource,
          tags: desiredTags,
          automation_ids: [freedomAgentAutomationId],
          custom_fields: [{ name: 'source', value: cleanSource }],
        }),
      },
    )

    if (createRes.ok) {
      const data = await createRes.json()
      subscriberId = data?.data?.id ?? null
      status = 'created'
      console.log('[subscribe] Beehiiv subscriber created:', { email: cleanEmail, subscriberId })
    } else if (createRes.status === 409) {
      // Subscriber already exists — look up ID, then apply tags via /tags endpoint
      const lookupRes = await fetch(
        `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions?email=${encodeURIComponent(cleanEmail)}`,
        { headers: beehiivHeaders },
      )
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json()
        subscriberId = lookupData?.data?.[0]?.id ?? null
      } else {
        errorDetail = `lookup_${lookupRes.status}`
      }

      if (subscriberId) {
        const tagRes = await fetch(
          `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions/${subscriberId}/tags`,
          {
            method: 'POST',
            headers: beehiivHeaders,
            body: JSON.stringify({ tags: desiredTags }),
          },
        )
        if (tagRes.ok) {
          status = 'existing'
          console.log('[subscribe] Beehiiv tags added to existing subscriber:', {
            email: cleanEmail,
            subscriberId,
            tags: desiredTags,
          })
        } else {
          const tagErr = await tagRes.text()
          errorDetail = `tag_post_${tagRes.status}`
          console.error('[subscribe] Beehiiv tag POST error:', {
            status: tagRes.status,
            body: tagErr.slice(0, 500),
          })
        }
      } else {
        errorDetail = errorDetail ?? 'existing_subscriber_not_found'
        console.error('[subscribe] 409 from Beehiiv but lookup returned no subscriber:', { email: cleanEmail })
      }
    } else {
      const errText = await createRes.text()
      errorDetail = `create_${createRes.status}`
      console.error('[subscribe] Beehiiv POST error:', {
        status: createRes.status,
        body: errText.slice(0, 500),
      })
    }
  } catch (err) {
    errorDetail = err instanceof Error ? err.message : 'unknown_error'
    console.error('[subscribe] Beehiiv call failed:', err)
  }

  // Log to Supabase (best effort)
  const supabase = getServiceSupabase()
  if (supabase) {
    const { error: logError } = await supabase.from('lead_capture_log').insert({
      email: cleanEmail,
      source: cleanSource,
      segment: cleanSegment,
      subscriber_id: subscriberId,
      status,
      error_detail: errorDetail,
    })
    if (logError) {
      console.error('[subscribe] lead_capture_log insert error:', logError)
    }
  } else {
    console.warn('[subscribe] Supabase not configured — skipping log')
  }

  const success = status !== 'failed'
  return NextResponse.json(
    { success, subscriber_id: subscriberId },
    { status: success ? 200 : 502 },
  )
}
