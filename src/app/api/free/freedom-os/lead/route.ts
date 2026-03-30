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

  const { email, inputs, outputs, pageUrl, createdAt } = body as {
    email?: string
    inputs?: unknown
    outputs?: unknown
    pageUrl?: string
    createdAt?: string
  }

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ ok: false, error: 'Invalid email address' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()

  console.log('[freedom-os/track] email_submitted', { email: cleanEmail })

  // ── Save plan to Supabase ──────────────────────────────────
  let planId: string | null = null
  let planLink: string | null = null

  const supabase = getServiceSupabase()
  if (supabase) {
    try {
      const ua = request.headers.get('user-agent') || null
      const { data, error } = await supabase
        .from('freedom_os_saved_plans')
        .insert({
          email: cleanEmail,
          plan: {
            inputs: inputs ?? null,
            outputs: outputs ?? null,
            createdAt: createdAt || new Date().toISOString(),
            tool: 'freedom-os',
            version: 'v0',
          },
          source_url: pageUrl || null,
          user_agent: ua,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single()

      if (error) {
        console.error('[freedom-os/lead] Supabase insert error:', { message: error.message, code: error.code, details: error.details, hint: error.hint })
        return NextResponse.json(
          { ok: false, error: 'Failed to save your plan. Please try again.' },
          { status: 500 },
        )
      }

      planId = data.id
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      planLink = `${siteUrl}/free/freedom-os/plan/${planId}`
      console.log('[freedom-os/track] plan_saved', { planId, email: cleanEmail })
    } catch (err) {
      console.error('[freedom-os/lead] Supabase save failed:', err)
      return NextResponse.json(
        { ok: false, error: 'Failed to save your plan. Please try again.' },
        { status: 500 },
      )
    }
  } else {
    console.warn('[freedom-os/lead] Supabase not configured — skipping plan save')
  }

  // ── Subscribe via Beehiiv API ────────────────────────────────
  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID

  if (!apiKey || !publicationId) {
    console.warn('[freedom-os/lead] BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID not set — skipping subscribe')
    return NextResponse.json({ ok: true, planId, planLink })
  }

  console.log('[freedom-os/lead] planLink generated:', planLink)

  const beehiivHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  const customFields = [
    { name: 'source', value: 'freedom-os' },
    { name: 'page_url', value: pageUrl || '' },
    { name: 'created_at', value: createdAt || new Date().toISOString() },
    ...(planLink ? [{ name: 'freedom_os_plan_url', value: planLink }] : []),
  ]

  try {
    // Step 1: POST — create or reactivate subscription
    const createRes = await fetch(
      `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions`,
      {
        method: 'POST',
        headers: beehiivHeaders,
        body: JSON.stringify({
          email: cleanEmail,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: 'freedom-os',
          utm_medium: 'tool',
          utm_campaign: 'freedom-os-v0',
          referring_site: pageUrl || '',
          custom_fields: customFields,
        }),
      },
    )

    let subscriptionId: string | null = null

    if (createRes.ok) {
      const createData = await createRes.json()
      subscriptionId = createData?.data?.id ?? null
      console.log('[freedom-os/lead] Beehiiv subscriber created/reactivated:', {
        email: cleanEmail,
        subscriptionId,
        status: createData?.data?.status,
      })
      console.log('[freedom-os/track] email_sent', { email: cleanEmail, subscriptionId })
    } else if (createRes.status === 429) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Please wait a moment and try again.', planId, planLink },
        { status: 429 },
      )
    } else {
      const errorText = await createRes.text()
      console.error('[freedom-os/lead] Beehiiv POST error:', {
        status: createRes.status,
        body: errorText.slice(0, 500),
      })
    }

    // Step 2: If we don't have a subscription ID from POST, look up by email
    if (!subscriptionId) {
      try {
        const lookupRes = await fetch(
          `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions?email=${encodeURIComponent(cleanEmail)}`,
          { headers: beehiivHeaders },
        )
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json()
          subscriptionId = lookupData?.data?.[0]?.id ?? null
          if (subscriptionId) {
            console.log('[freedom-os/lead] Beehiiv subscriber found via lookup:', { subscriptionId })
          }
        }
      } catch (lookupErr) {
        console.error('[freedom-os/lead] Beehiiv lookup failed:', lookupErr)
      }
    }

    // Step 3: PUT — update custom fields to guarantee freedom_os_plan_url is set
    if (subscriptionId && planLink) {
      try {
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
          console.log('[freedom-os/lead] Beehiiv freedom_os_plan_url set successfully:', {
            subscriptionId,
            freedom_os_plan_url: planLink,
          })
        } else {
          const updateErr = await updateRes.text()
          console.error('[freedom-os/lead] Beehiiv PUT error:', {
            status: updateRes.status,
            body: updateErr.slice(0, 500),
          })
        }
      } catch (putErr) {
        console.error('[freedom-os/lead] Beehiiv PUT failed:', putErr)
      }
    }

    return NextResponse.json({ ok: true, planId, planLink })
  } catch (err) {
    console.error('[freedom-os/lead] Beehiiv flow failed:', err)
    return NextResponse.json(
      { ok: true, planId, planLink, beehiivError: true },
    )
  }
}
