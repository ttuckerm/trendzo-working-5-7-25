import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'
config({ path: resolve(process.cwd(), '.env.local') })
const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const pw = env.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)![1].trim()
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '').split('.')[0]
const pg = new Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.${ref}.supabase.co:5432/postgres`,
})
;(async () => {
  await pg.connect()

  // Check which tables exist
  const tablesToCheck = [
    'morning_briefs',
    'cultural_events',
    'api_keys',
    'mcp_api_keys',
    'mcp_call_log',
    'prediction_runs',
    'agencies',
    'agency_members',
    'onboarding_profiles',
    'pre_generated_briefs',
  ]
  const { rows: existing } = await pg.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name = ANY($1::text[])`,
    [tablesToCheck],
  )
  console.log('Tables found:', existing.map((r) => r.table_name).sort())
  console.log(
    'Tables MISSING:',
    tablesToCheck.filter((t) => !existing.some((r) => r.table_name === t)),
  )

  for (const t of existing.map((r) => r.table_name).sort()) {
    console.log(`\n── ${t} ──`)
    const { rows } = await pg.query(
      `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_name=$1
         ORDER BY ordinal_position`,
      [t],
    )
    for (const r of rows) console.log(`  ${r.column_name}  ${r.data_type}  null=${r.is_nullable}`)
  }

  // Check cultural_events velocity_score constraint/range
  console.log('\n── cultural_events sample ──')
  try {
    const { rows } = await pg.query(
      `SELECT id, niche, velocity_score, status FROM cultural_events LIMIT 3`,
    )
    console.log(rows)
    const { rows: counts } = await pg.query(
      `SELECT COUNT(*)::int AS n FROM cultural_events`,
    )
    console.log(`cultural_events total rows: ${counts[0].n}`)
  } catch (e: any) {
    console.log(`  (query failed: ${e.message})`)
  }

  // Check prediction_runs columns for VPS score name
  console.log('\n── prediction_runs score columns ──')
  const { rows: prCols } = await pg.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_name='prediction_runs' AND (
        column_name LIKE '%vps%' OR column_name LIKE '%dps%' OR
        column_name LIKE '%engage%' OR column_name LIKE '%score%'
      )
      ORDER BY column_name`,
  )
  for (const r of prCols) console.log(`  ${r.column_name}`)

  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })
