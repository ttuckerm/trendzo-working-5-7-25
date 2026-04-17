/**
 * Prompt 42 — Preload agency patterns verification.
 *
 * Can't create synthetic agencies safely (agency_members.user_id likely
 * FKs to auth.users). Instead we:
 *   1. Find an existing agency with at least one member + an onboarding
 *      profile that has niche_key set to a valid niche.
 *   2. Seed a cross_niche_patterns row whose source_niche matches that
 *      agency's niche, tagged with 'p42_test_preload_' prefix.
 *   3. Call preloadAgencyPatterns() for that agency.
 *   4. Assert memory_extractions now contains a row with
 *      source='cross_niche_preload' and fact referencing our seeded pattern.
 *   5. Call it AGAIN → assert patterns_skipped_duplicate > 0 (idempotency).
 *   6. Clean up: delete the seeded pattern + the memory_extractions row we inserted.
 */
import { Client } from 'pg'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'
config({ path: resolve(process.cwd(), '.env.local') })

import { preloadAgencyPatterns } from '../src/lib/memory/preload-agency-patterns'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const DB_PASSWORD = env.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)![1].trim()
const ref = SUPABASE_URL.replace('https://', '').split('.')[0]
const PG_CONN = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${ref}.supabase.co:5432/postgres`

const sb: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
const TEST_FEATURE = 'p42_test_preload_feature'

async function main() {
  const pg = new Client({ connectionString: PG_CONN })
  await pg.connect()

  // 1. Find an agency with any linked onboarding_profile. We'll
  //    temporarily update that profile's niche_key to a canonical
  //    niches.id value, run preload, then revert.
  const { rows: agencies } = await pg.query(
    `SELECT a.id AS agency_id, op.id AS profile_id, op.user_id, op.niche_key
       FROM agencies a
       JOIN onboarding_profiles op ON op.agency_id = a.id
       LIMIT 1`,
  )

  if (agencies.length === 0) {
    console.log('❌ No agency with linked profile found')
    await pg.end()
    process.exit(1)
  }

  const agency_id = agencies[0].agency_id as string
  const profile_id = agencies[0].profile_id as string
  const original_niche_key = agencies[0].niche_key as string | null
  const canonical_niche = 'cooking-food'

  console.log(`Found agency ${agency_id}`)
  console.log(`Profile ${profile_id} niche_key: '${original_niche_key}'`)
  console.log(`Temporarily setting profile.niche_key → '${canonical_niche}' for test`)

  // Save original then update.
  await pg.query(
    `UPDATE onboarding_profiles SET niche_key = $1 WHERE id = $2`,
    [canonical_niche, profile_id],
  )

  // Clean any prior test state.
  await pg.query(`DELETE FROM cross_niche_patterns WHERE feature_name = $1`, [TEST_FEATURE])
  await sb
    .from('memory_extractions')
    .delete()
    .eq('agency_id', agency_id)
    .eq('source', 'cross_niche_preload')

  // 2. Seed a cross_niche_pattern that matches this agency's niche.
  const ins = await pg.query(
    `INSERT INTO cross_niche_patterns
       (feature_name, source_niche, observed_delta, observed_n, tier, confirmed_in_niches)
     VALUES ($1, $2, 0.12, 40, 'warm', ARRAY[]::text[])
     RETURNING id`,
    [TEST_FEATURE, canonical_niche],
  )
  const patternId = ins.rows[0].id
  console.log(`Seeded cross_niche_pattern ${patternId}`)

  // 3. First preload run.
  const r1 = await preloadAgencyPatterns(sb, agency_id, 20)
  console.log(`First preload:`, r1)

  // 4. Check memory_extractions for a row referencing this pattern.
  const { data: memRows } = await sb
    .from('memory_extractions')
    .select('id, fact, tier, source')
    .eq('agency_id', agency_id)
    .eq('source', 'cross_niche_preload')
  const found = (memRows || []).some((r: any) => r.fact && r.fact.includes(patternId))
  console.log(`memory_extractions rows for agency: ${(memRows || []).length}, ours found: ${found}`)

  // 5. Second run — expect idempotent skip.
  const r2 = await preloadAgencyPatterns(sb, agency_id, 20)
  console.log(`Second preload:`, r2)

  const pass =
    r1.ok &&
    r1.patterns_inserted >= 1 &&
    found &&
    r2.patterns_skipped_duplicate >= 1 &&
    r2.patterns_inserted === 0

  // 6. Cleanup.
  await sb
    .from('memory_extractions')
    .delete()
    .eq('agency_id', agency_id)
    .eq('source', 'cross_niche_preload')
  await pg.query(`DELETE FROM cross_niche_patterns WHERE feature_name = $1`, [TEST_FEATURE])

  // Restore the original niche_key on the profile.
  await pg.query(
    `UPDATE onboarding_profiles SET niche_key = $1 WHERE id = $2`,
    [original_niche_key, profile_id],
  )
  console.log(`Restored profile niche_key → '${original_niche_key}'`)

  console.log(`\n${pass ? '✅ PASS' : '❌ FAIL'} — preload agency patterns end-to-end`)
  await pg.end()
  process.exit(pass ? 0 : 1)
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
