// Minimal Beehiiv subscriber helper for the new Escape Assessment funnel.
//
// Why this exists (and not src/lib/services/beehiivService.ts):
// the legacy BeehiivService is a Trendzo-era singleton with hardcoded
// niche/platform/template fields, no tag support, and a flow that doesn't
// match what the new funnel needs. This helper is a thin, dependency-free
// wrapper around the three Beehiiv calls that actually matter for us:
//
//   1. POST  /subscriptions               — create or reactivate, set custom_fields
//   2. POST  /subscriptions/:id/tags      — apply tags (cannot be done via PUT)
//   3. PUT   /subscriptions/:id           — re-assert custom_fields (belt-and-suspenders)
//
// All errors are caught and logged. Callers should treat Beehiiv as a
// best-effort side-effect: do not block the user response on it.
//
// Custom field names and tag names must already exist in the Beehiiv
// publication. The Escape Assessment funnel uses:
//   custom fields: waitlist_source, funnel_segment, assessment_url,
//                  freedom_number, youtube_source
//   tags:          freedom-os, recovery-requested,
//                  ready-to-scale, building-momentum, stuck-zero, tire-kicker
//
// Legacy `freedom_os_plan_url` was renamed to `assessment_url` — the user
// renames the field in the Beehiiv dashboard manually as part of deploy.

const BEEHIIV_BASE = 'https://api.beehiiv.com/v2'

export interface BeehiivCustomField {
  name: string
  value: string
}

export interface BeehiivNotifyParams {
  email: string
  customFields: BeehiivCustomField[]
  tags: string[]
  reactivateExisting?: boolean
  sendWelcomeEmail?: boolean
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referringSite?: string
  // Caller-supplied label used only for log scoping, e.g. 'landing-notify'.
  logScope?: string
}

export interface BeehiivNotifyResult {
  ok: boolean
  subscriptionId: string | null
  // True if we couldn't even attempt the call because env vars are missing.
  skipped?: boolean
  // Set when a step failed; the user-facing endpoint should still return success.
  error?: string
}

/**
 * Create-or-reactivate a Beehiiv subscriber, set custom fields, then apply tags.
 * Never throws. Returns a result object describing what happened.
 *
 * The function is intentionally fire-and-forget shaped: callers wrap this in
 * try/catch out of paranoia, but every internal failure is already swallowed.
 */
export async function notifyBeehiiv(
  params: BeehiivNotifyParams,
): Promise<BeehiivNotifyResult> {
  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID
  const scope = params.logScope ?? 'beehiiv'

  if (!apiKey || !publicationId) {
    console.warn(
      `[${scope}] BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID not set — skipping`,
    )
    return { ok: false, subscriptionId: null, skipped: true }
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  const email = params.email.trim().toLowerCase()
  let subscriptionId: string | null = null

  // ── Step 1: create or reactivate subscription ─────────────────────────
  try {
    const createRes = await fetch(
      `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          reactivate_existing: params.reactivateExisting ?? true,
          send_welcome_email: params.sendWelcomeEmail ?? false,
          utm_source: params.utmSource ?? 'dailylotion',
          utm_medium: params.utmMedium ?? 'website',
          utm_campaign: params.utmCampaign ?? 'escape-funnel',
          referring_site: params.referringSite ?? '',
          custom_fields: params.customFields,
        }),
      },
    )

    if (createRes.ok) {
      const data = await createRes.json().catch(() => null)
      subscriptionId = data?.data?.id ?? null
      console.log(`[${scope}] beehiiv subscriber created/reactivated`, {
        email,
        subscriptionId,
        status: data?.data?.status,
      })
    } else {
      const text = await createRes.text().catch(() => '')
      console.error(`[${scope}] beehiiv POST /subscriptions failed`, {
        status: createRes.status,
        body: text.slice(0, 500),
      })
    }
  } catch (err) {
    console.error(`[${scope}] beehiiv POST /subscriptions threw`, err)
  }

  // ── Step 1b: lookup by email if we didn't get an ID back ──────────────
  // Happens when Beehiiv returns 200 without an ID, or when the subscriber
  // already exists and the create call returned a non-2xx.
  if (!subscriptionId) {
    try {
      const lookupRes = await fetch(
        `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions?email=${encodeURIComponent(email)}`,
        { headers },
      )
      if (lookupRes.ok) {
        const data = await lookupRes.json().catch(() => null)
        subscriptionId = data?.data?.[0]?.id ?? null
        if (subscriptionId) {
          console.log(`[${scope}] beehiiv subscriber found via lookup`, {
            subscriptionId,
          })
        }
      }
    } catch (err) {
      console.error(`[${scope}] beehiiv lookup failed`, err)
    }
  }

  // No ID, no tags, no PUT — return what we have. Custom fields were set
  // (or attempted) on the create call so this isn't a total loss.
  if (!subscriptionId) {
    return {
      ok: false,
      subscriptionId: null,
      error: 'no_subscription_id',
    }
  }

  // ── Step 2: apply tags via the dedicated /tags endpoint ───────────────
  // Tags can't be set via PUT/PATCH on the subscription resource.
  if (params.tags.length > 0) {
    try {
      const tagRes = await fetch(
        `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions/${subscriptionId}/tags`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ tags: params.tags }),
        },
      )
      if (tagRes.ok) {
        console.log(`[${scope}] beehiiv tags applied`, {
          subscriptionId,
          tags: params.tags,
        })
      } else {
        const text = await tagRes.text().catch(() => '')
        console.error(`[${scope}] beehiiv POST /tags failed`, {
          status: tagRes.status,
          body: text.slice(0, 500),
        })
      }
    } catch (err) {
      console.error(`[${scope}] beehiiv POST /tags threw`, err)
    }
  }

  // ── Step 3: re-assert custom fields via PUT ───────────────────────────
  // The create call already set custom_fields, but a follow-up PUT is
  // belt-and-suspenders insurance against a partial create. Cheap, safe.
  if (params.customFields.length > 0) {
    try {
      const putRes = await fetch(
        `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions/${subscriptionId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ custom_fields: params.customFields }),
        },
      )
      if (!putRes.ok) {
        const text = await putRes.text().catch(() => '')
        console.error(`[${scope}] beehiiv PUT /subscriptions failed`, {
          status: putRes.status,
          body: text.slice(0, 500),
        })
      }
    } catch (err) {
      console.error(`[${scope}] beehiiv PUT /subscriptions threw`, err)
    }
  }

  return { ok: true, subscriptionId }
}
