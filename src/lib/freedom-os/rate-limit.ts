/**
 * Simple in-memory rate limiter for serverless-friendly burst control.
 * Resets per IP every hour; max N hits per window.
 */

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

const WINDOW_MS = 60 * 60 * 1000

export function checkIpRateLimit(
  ip: string,
  maxPerWindow: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  let e = store.get(ip)
  if (!e || now >= e.resetAt) {
    e = { count: 0, resetAt: now + WINDOW_MS }
    store.set(ip, e)
  }
  if (e.count >= maxPerWindow) {
    return { ok: false, retryAfterSec: Math.ceil((e.resetAt - now) / 1000) }
  }
  e.count += 1
  return { ok: true }
}

export function getClientIp(request: Request): string {
  const xf = request.headers.get('x-forwarded-for')
  if (xf) {
    const first = xf.split(',')[0]?.trim()
    if (first) return first
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
