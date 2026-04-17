/**
 * Prompt 44 — Anonymization helpers for network insights.
 *
 * Two jobs:
 *   1. k-anonymity-lite: refuse to publish any finding where fewer
 *      than MIN_AGENCIES_PER_FINDING distinct agencies contributed.
 *   2. Text hygiene: after LLM phrasing, scan the final insight_text
 *      for substrings that match any real agency name or uuid and
 *      reject the text if found. The phraser then falls back to
 *      template.
 *
 * This module loads the agency name list from the DB once per
 * generation run — it does NOT keep a live subscription. Stale
 * agencies added between runs are OK; they'll be picked up in the
 * next run. Deleted agencies falling out of the list is also OK.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export const MIN_AGENCIES_PER_FINDING = 10

export interface AgencyNameIndex {
  names: string[]
  uuids: string[]
  byId: Map<string, string>
}

export async function loadAgencyNameIndex(db: SupabaseClient): Promise<AgencyNameIndex> {
  const { data, error } = await db.from('agencies').select('id, name, slug')
  if (error) throw new Error(`loadAgencyNameIndex failed: ${error.message}`)

  const names: string[] = []
  const uuids: string[] = []
  const byId = new Map<string, string>()
  for (const row of data || []) {
    const r = row as { id: string; name: string; slug: string }
    if (r.name && r.name.trim().length >= 3) names.push(r.name.trim())
    if (r.slug && r.slug.trim().length >= 3) names.push(r.slug.trim())
    if (r.id) uuids.push(r.id)
    byId.set(r.id, r.name)
  }
  return { names, uuids, byId }
}

/**
 * Returns null if the text is clean; otherwise returns the first
 * offending substring so the caller can log and fall back.
 */
export function scanForIdentityLeak(
  text: string,
  index: AgencyNameIndex,
): string | null {
  const haystack = text.toLowerCase()
  for (const n of index.names) {
    if (haystack.includes(n.toLowerCase())) return n
  }
  for (const u of index.uuids) {
    if (haystack.includes(u.toLowerCase())) return u
  }
  // Also catch obvious uuid-like patterns (8-4-4-4-12 hex) that might
  // be leaked even if not in the index — useful during testing with
  // freshly-created agencies that weren't loaded into the index.
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(text)) {
    return 'uuid_pattern'
  }
  return null
}

/**
 * k-anonymity-lite gate. Call before writing any finding.
 */
export function passesKAnonymity(supportingAgencyCount: number): boolean {
  return supportingAgencyCount >= MIN_AGENCIES_PER_FINDING
}
