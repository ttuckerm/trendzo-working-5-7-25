import { createHmac, timingSafeEqual } from 'crypto';

export const CODE_PATH_COOKIE_NAME = 'dl_code_path';
const COOKIE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getSecret(): string {
  const s = process.env.CODE_PATH_COOKIE_SECRET;
  if (!s) throw new Error('CODE_PATH_COOKIE_SECRET is not configured');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

// Cookie format:
//   v1.{expiresAt}.{sig}                       (legacy — no redemption linkage)
//   v2.{expiresAt}.{redemptionId}.{sig}        (current — carries the
//                                               code_redemptions.id so the
//                                               generator can link the
//                                               assessment back to the
//                                               redemption row)
//
// Both versions verify as boolean-valid. Only v2 yields a redemption_id.

export function issueCodePathCookieValue(
  redemptionId: string,
  now: number = Date.now(),
): string {
  const expiresAt = now + COOKIE_TTL_MS;
  const payload = `v2.${expiresAt}.${redemptionId}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function constantTimeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyCodePathCookieValue(
  value: string | undefined | null,
  now: number = Date.now(),
): boolean {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split('.');

  if (parts.length === 3) {
    const [version, expiresAtStr, sigHex] = parts;
    if (version !== 'v1') return false;
    const expiresAt = Number(expiresAtStr);
    if (!Number.isFinite(expiresAt) || expiresAt < now) return false;
    const expected = sign(`${version}.${expiresAtStr}`);
    return constantTimeEqualHex(sigHex, expected);
  }

  if (parts.length === 4) {
    const [version, expiresAtStr, redemptionId, sigHex] = parts;
    if (version !== 'v2') return false;
    const expiresAt = Number(expiresAtStr);
    if (!Number.isFinite(expiresAt) || expiresAt < now) return false;
    if (!redemptionId) return false;
    const expected = sign(`${version}.${expiresAtStr}.${redemptionId}`);
    return constantTimeEqualHex(sigHex, expected);
  }

  return false;
}

export function readCodePathCookieRedemptionId(
  value: string | undefined | null,
  now: number = Date.now(),
): string | null {
  if (!verifyCodePathCookieValue(value, now)) return null;
  const parts = (value as string).split('.');
  if (parts.length !== 4) return null; // v1 has no redemption id
  return parts[2] || null;
}

export const CODE_PATH_COOKIE_TTL_SECONDS = Math.floor(COOKIE_TTL_MS / 1000);
