/**
 * Prompt 43 — MCP API key authentication.
 *
 * Keys are issued per-agency via scripts/mcp-create-key.ts. Format:
 *   mcp_live_<32 url-safe chars>
 * Stored as sha256(key) in mcp_api_keys.key_hash. The raw key is
 * shown exactly once at creation time. The first 8 chars after the
 * prefix are also stored in plaintext as key_prefix for identification.
 *
 * verifyApiKey() takes a raw key, hashes it, looks up the row,
 * confirms is_active=true and revoked_at IS NULL, and returns the
 * agency_id + tier + key id. Returns null on any failure — callers
 * should treat null as "unauthorized, no further info".
 */

import { createHash, randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface McpAuthContext {
  api_key_id: string
  agency_id: string
  agency_tier: string
  agency_name: string
  key_label: string
}

export function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

export function generateRawKey(): { raw: string; prefix: string; hash: string } {
  // 24 bytes → 32 url-safe chars after base64url encode.
  const body = randomBytes(24).toString('base64url')
  const raw = `mcp_live_${body}`
  const prefix = raw.slice(0, 16) // "mcp_live_" + 7 chars
  return { raw, prefix, hash: hashKey(raw) }
}

export async function verifyApiKey(
  db: SupabaseClient,
  rawKey: string,
): Promise<McpAuthContext | null> {
  if (!rawKey || typeof rawKey !== 'string' || !rawKey.startsWith('mcp_live_')) {
    return null
  }
  const hash = hashKey(rawKey)

  const { data: keyRow } = await db
    .from('mcp_api_keys')
    .select('id, agency_id, label, is_active, revoked_at')
    .eq('key_hash', hash)
    .maybeSingle()

  if (!keyRow || !keyRow.is_active || keyRow.revoked_at) return null

  const { data: agency } = await db
    .from('agencies')
    .select('id, name, tier, status')
    .eq('id', keyRow.agency_id)
    .maybeSingle()

  if (!agency || agency.status !== 'active') return null

  // Fire-and-forget last_used_at update. Don't block the call on it.
  void db
    .from('mcp_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)

  return {
    api_key_id: keyRow.id as string,
    agency_id: agency.id as string,
    agency_tier: agency.tier as string,
    agency_name: agency.name as string,
    key_label: keyRow.label as string,
  }
}
