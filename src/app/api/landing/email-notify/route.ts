import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notifyBeehiiv } from '@/lib/beehiiv/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Bucket = { count: number; resetAt: number };
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const buckets = new Map<string, Bucket>();

function rateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(ip);
  if (!existing || existing.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  return { ok: true };
}

if (typeof globalThis !== 'undefined' && !(globalThis as any).__landingEmailRateLimitCleanup) {
  (globalThis as any).__landingEmailRateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }, 10 * 60 * 1000);
}

function getIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SOURCES = new Set(['landing_notify', 'landing_youtube_fallback']);

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'RATE_LIMIT', message: 'Too many attempts. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'BAD_REQUEST', message: 'Invalid request.' },
      { status: 400 }
    );
  }

  const rawEmail = typeof (body as { email?: unknown })?.email === 'string'
    ? (body as { email: string }).email.trim().toLowerCase()
    : '';
  const rawSource = typeof (body as { source?: unknown })?.source === 'string'
    ? (body as { source: string }).source
    : 'landing_notify';

  if (!EMAIL_RE.test(rawEmail) || rawEmail.length > 320) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_EMAIL', message: 'That email doesn\'t look right.' },
      { status: 400 }
    );
  }

  const source = ALLOWED_SOURCES.has(rawSource) ? rawSource : 'landing_notify';

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('landing_email_notifications')
    .insert({ email: rawEmail, source });

  let alreadySubscribed = false;
  if (error) {
    // Unique violation: pretend success to avoid leaking which emails are on
    // the list. Still push the row to Beehiiv — they may have unsubscribed
    // from the newsletter even if their landing-page row already exists.
    if (error.code === '23505') {
      alreadySubscribed = true;
    } else {
      // Surface the real Postgres error in the dev-server terminal so the cause is visible.
      console.error('[landing/email-notify] insert failed', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { ok: false, error: 'STORAGE_ERROR', message: 'Couldn\'t save that. Try again in a moment.' },
        { status: 500 }
      );
    }
  }

  // ── Beehiiv (best-effort, never blocks the user response) ──────────────
  // Landing-page subscribers have no assessment yet, so no funnel_segment
  // and no plan URL. Source label is 'landing-page' per spec.
  try {
    await notifyBeehiiv({
      email: rawEmail,
      customFields: [
        { name: 'waitlist_source', value: 'landing-page' },
      ],
      tags: ['high-intent'],
      reactivateExisting: true,
      sendWelcomeEmail: false,
      utmSource: 'dailylotion',
      utmMedium: 'landing',
      utmCampaign: source, // landing_notify | landing_youtube_fallback
      logScope: 'landing/email-notify',
    });
  } catch (beehiivErr) {
    // notifyBeehiiv already swallows internal errors; this catch is a
    // belt-and-suspenders guard against unexpected throws (e.g. fetch ctor).
    console.error('[landing/email-notify] beehiiv side-effect threw', beehiivErr);
  }

  return NextResponse.json({ ok: true, ...(alreadySubscribed ? { alreadySubscribed: true } : {}) });
}
