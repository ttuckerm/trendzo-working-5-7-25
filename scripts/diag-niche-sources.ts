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

  console.log('═══ Does prediction_runs have a niche column? ═══')
  const r1 = await pg.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='prediction_runs' AND table_schema='public' AND column_name ILIKE '%niche%'
  `)
  console.log(r1.rows.length ? r1.rows : 'no niche column on prediction_runs')

  console.log('\n═══ What tables could provide niche by external video ID? ═══')
  const r2 = await pg.query(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' AND column_name='niche'
    ORDER BY table_name
  `)
  for (const r of r2.rows) console.log(`  ${r.table_name}.${r.column_name}`)

  console.log('\n═══ video_files schema ═══')
  const r3 = await pg.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name='video_files' AND table_schema='public'
    ORDER BY ordinal_position LIMIT 30
  `)
  for (const r of r3.rows) console.log(`  ${r.column_name.padEnd(30)} ${r.data_type}`)

  console.log('\n═══ Sample video_id values from prediction_runs (with scoreable rows) ═══')
  const r4 = await pg.query(`
    SELECT video_id, predicted_dps_7d, actual_dps
    FROM prediction_runs
    WHERE actual_dps IS NOT NULL AND predicted_dps_7d IS NOT NULL
    ORDER BY created_at DESC LIMIT 10
  `)
  for (const r of r4.rows) console.log(`  ${String(r.video_id).padEnd(45)} pred=${r.predicted_dps_7d} actual=${r.actual_dps}`)

  console.log('\n═══ Does scraped_videos exist? ═══')
  const r5 = await pg.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name='scraped_videos' AND table_schema='public'
    ORDER BY ordinal_position LIMIT 30
  `)
  if (r5.rows.length === 0) console.log('  table does not exist')
  else for (const r of r5.rows) console.log(`  ${r.column_name.padEnd(30)} ${r.data_type}`)

  console.log('\n═══ Does apify_videos or similar exist? ═══')
  const r6 = await pg.query(`
    SELECT DISTINCT table_name FROM information_schema.columns
    WHERE table_schema='public' AND (table_name ILIKE '%video%' OR table_name ILIKE '%tiktok%')
    ORDER BY table_name
  `)
  for (const r of r6.rows) console.log(`  ${r.table_name}`)

  console.log('\n═══ Dedup check: is da093384 in prediction_runs twice? ═══')
  const r7 = await pg.query(`
    SELECT video_id, COUNT(*)::int AS n, array_agg(DISTINCT predicted_dps_7d) AS preds, array_agg(DISTINCT actual_dps) AS actuals
    FROM prediction_runs
    WHERE actual_dps IS NOT NULL AND predicted_dps_7d IS NOT NULL
    GROUP BY video_id
    HAVING COUNT(*) > 1
    ORDER BY n DESC
  `)
  if (r7.rows.length === 0) console.log('  no duplicates')
  for (const r of r7.rows) console.log(`  ${r.video_id}: ${r.n}x — preds=${r.preds} actuals=${r.actuals}`)

  console.log('\n═══ Sanity: 43 row breakdown ═══')
  const r8 = await pg.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE actual_dps < 0)::int AS negative_actual,
      COUNT(*) FILTER (WHERE actual_dps >= 0)::int AS nonneg_actual,
      COUNT(*) FILTER (WHERE predicted_dps_7d < 0)::int AS negative_pred
    FROM prediction_runs
    WHERE actual_dps IS NOT NULL AND predicted_dps_7d IS NOT NULL
  `)
  console.log(r8.rows[0])

  await pg.end()
})()
