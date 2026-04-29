import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  CODE_PATH_COOKIE_NAME,
  CODE_PATH_COOKIE_TTL_SECONDS,
  issueCodePathCookieValue,
} from '@/lib/stripe/cookie';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Rate limiting ──────────────────────────────────────────────────────────

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

if (typeof globalThis !== 'undefined' && !(globalThis as any).__landingRateLimitCleanup) {
  (globalThis as any).__landingRateLimitCleanup = setInterval(() => {
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

// ─── Supabase service client ────────────────────────────────────────────────

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Route ──────────────────────────────────────────────────────────────────

const GENERIC_INVALID = {
  ok: false as const,
  error: 'INVALID_CODE',
  message: "That code didn't work. Check for typos or grab a fresh one from the channel.",
};

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'RATE_LIMIT', message: 'Too many attempts. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'BAD_REQUEST', message: 'Invalid request.' },
      { status: 400 },
    );
  }

  const rawCode = typeof (body as { code?: unknown })?.code === 'string'
    ? (body as { code: string }).code.trim().toUpperCase()
    : '';

  if (!/^[A-Z]{5}$/.test(rawCode)) {
    return NextResponse.json(GENERIC_INVALID, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    console.error('[code-validate] supabase service client not configured');
    return NextResponse.json(
      { ok: false, error: 'CONFIG_ERROR', message: 'Server is not configured for access. Please try again later.' },
      { status: 500 },
    );
  }

  // Atomic redeem: locks the code row, validates state (not found / revoked /
  // expired / exhausted), inserts a code_redemptions row, increments the
  // count. Any failure mode raises generic exception P0001 — we map all of
  // them to the opaque "invalid code" response so we don't leak which check
  // failed.
  const { data: redemptionId, error: rpcErr } = await supabase.rpc('redeem_code', {
    p_code: rawCode,
    p_ip: ip,
  });

  if (rpcErr || !redemptionId || typeof redemptionId !== 'string') {
    if (rpcErr && (rpcErr as { code?: string }).code !== 'P0001') {
      console.error('[code-validate] redeem_code rpc failed', rpcErr);
    }
    return NextResponse.json(GENERIC_INVALID, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, redirectTo: '/welcome?source=code' });
  try {
    res.cookies.set({
      name: CODE_PATH_COOKIE_NAME,
      value: issueCodePathCookieValue(redemptionId),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: CODE_PATH_COOKIE_TTL_SECONDS,
    });
  } catch (e) {
    console.error('[code-validate] cookie sign failed', e);
    return NextResponse.json(
      { ok: false, error: 'CONFIG_ERROR', message: 'Server is not configured for access. Please try again later.' },
      { status: 500 },
    );
  }
  return res;
}
