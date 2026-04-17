import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'
config({ path: resolve(process.cwd(), '.env.local') })
const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const pw = env.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)![1].trim()
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '').split('.')[0]
const pg = new Client({ connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.${ref}.supabase.co:5432/postgres` })
;(async () => {
  await pg.connect()
  const counts = await pg.query(`
    SELECT
      (SELECT COUNT(*) FROM agencies) AS agencies,
      (SELECT COUNT(*) FROM agency_members WHERE is_active) AS active_members,
      (SELECT COUNT(*) FROM onboarding_profiles WHERE niche_key IS NOT NULL AND niche_key <> '') AS profiles_with_niche,
      (SELECT COUNT(*) FROM onboarding_profiles WHERE agency_id IS NOT NULL) AS profiles_with_agency
  `)
  console.log(counts.rows[0])

  console.log('\n-- profiles with niche and agency (first 3):')
  const { rows } = await pg.query(
    `SELECT user_id, agency_id, niche_key, selected_niche
       FROM onboarding_profiles
       WHERE (niche_key IS NOT NULL AND niche_key <> '') OR (selected_niche IS NOT NULL AND selected_niche <> '')
       LIMIT 5`,
  )
  for (const r of rows) console.log(r)

  console.log('\n-- niche keys used in profiles:')
  const { rows: nk } = await pg.query(
    `SELECT DISTINCT COALESCE(NULLIF(niche_key,''), NULLIF(selected_niche,'')) AS nk
       FROM onboarding_profiles
       WHERE (niche_key IS NOT NULL AND niche_key <> '') OR (selected_niche IS NOT NULL AND selected_niche <> '')`,
  )
  for (const r of nk) console.log(r.nk)

  console.log('\n-- canonical niches.id (first 10):')
  const { rows: nids } = await pg.query(`SELECT id FROM niches ORDER BY id LIMIT 10`)
  for (const r of nids) console.log(r.id)

  // Check if agency_id in onboarding_profiles is the link, not agency_members
  console.log('\n-- agencies joined via onboarding_profiles.agency_id:')
  const { rows: aj } = await pg.query(`
    SELECT a.id AS agency_id, op.user_id, op.niche_key, op.selected_niche
      FROM agencies a
      JOIN onboarding_profiles op ON op.agency_id = a.id
      WHERE (op.niche_key IS NOT NULL AND op.niche_key <> '') OR (op.selected_niche IS NOT NULL AND op.selected_niche <> '')
      LIMIT 5`)
  for (const r of aj) console.log(r)

  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })
