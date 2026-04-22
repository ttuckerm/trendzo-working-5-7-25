// HMAC-SHA256 signed token for brief acknowledgment email links.
// See SUBSTRATE_AUDIT_2026-04-21.md §2.D and Fix 2 spec.
//
// Token shape: base64url(HMAC-SHA256(briefId + '.' + creatorUserId, BRIEF_ACK_SECRET))
//
// Signing happens in src/lib/email/send-brief.ts when the brief email is
// dispatched. Verification happens in /api/brief-acknowledge/[briefId]?token=...
// against the brief.user_id loaded from the DB (option A — no creator_user_id
// in URL, at the cost of a weak brief-id enumeration oracle which is acceptable
// given UUIDs and the 404 vs 401 distinguishability).

import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const s = process.env.BRIEF_ACK_SECRET
  if (!s || s.length < 16) {
    throw new Error(
      'BRIEF_ACK_SECRET env var is not set (or too short). ' +
      'Generate a 32-byte hex secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    )
  }
  return s
}

function toBase64Url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64Url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const normalized = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(normalized, 'base64')
}

export function signBriefAckToken(briefId: string, creatorUserId: string): string {
  const message = `${briefId}.${creatorUserId}`
  const sig = createHmac('sha256', getSecret()).update(message).digest()
  return toBase64Url(sig)
}

export function verifyBriefAckToken(
  briefId: string,
  creatorUserId: string,
  providedToken: string | null | undefined,
): boolean {
  if (!providedToken || typeof providedToken !== 'string') return false

  let expected: Buffer
  let provided: Buffer
  try {
    expected = createHmac('sha256', getSecret())
      .update(`${briefId}.${creatorUserId}`)
      .digest()
    provided = fromBase64Url(providedToken)
  } catch {
    return false
  }

  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}
