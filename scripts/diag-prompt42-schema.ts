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

  console.log('═══ training_experiments.features_used shape ═══')
  const a = await pg.query(`
    SELECT jsonb_typeof(features_used) AS t, COUNT(*)::int AS n
    FROM training_experiments
    WHERE features_used IS NOT NULL
    GROUP BY 1
  `)
  console.log(a.rows)

  console.log('\n═══ Sample features_used values ═══')
  const b = await pg.query(`
    SELECT id, niche_scope, result, delta,
           jsonb_typeof(features_used) AS t,
           jsonb_array_length(features_used) AS len_if_array
    FROM training_experiments
    WHERE features_used IS NOT NULL
      AND jsonb_typeof(features_used) = 'array'
    ORDER BY created_at DESC
    LIMIT 5
  `)
  for (const r of b.rows) console.log(`  ${r.id.slice(0,8)} niche=${r.niche_scope} result=${r.result} delta=${r.delta} len=${r.len_if_array}`)

  console.log('\n═══ Does niches table exist with id+category? ═══')
  const c = await pg.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name='niches' AND table_schema='public'
    ORDER BY ordinal_position
  `)
  for (const r of c.rows) console.log(`  ${r.column_name.padEnd(30)} ${r.data_type}`)

  console.log('\n═══ Distinct categories in niches table ═══')
  const d = await pg.query(`SELECT category, COUNT(*)::int AS n FROM niches GROUP BY category ORDER BY n DESC`)
  for (const r of d.rows) console.log(`  ${(r.category || '(null)').padEnd(20)} ${r.n}`)

  console.log('\n═══ agency_members schema ═══')
  const e = await pg.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name='agency_members' AND table_schema='public'
    ORDER BY ordinal_position
  `)
  for (const r of e.rows) console.log(`  ${r.column_name.padEnd(20)} ${r.data_type}`)

  console.log('\n═══ onboarding_profiles relevant columns ═══')
  const f = await pg.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name='onboarding_profiles' AND table_schema='public'
      AND (column_name = 'user_id' OR column_name = 'agency_id' OR column_name ILIKE '%niche%')
    ORDER BY ordinal_position
  `)
  for (const r of f.rows) console.log(`  ${r.column_name.padEnd(20)} ${r.data_type}`)

  console.log('\n═══ memory_extractions columns relevant to preload ═══')
  const g = await pg.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name='memory_extractions' AND table_schema='public'
    ORDER BY ordinal_position
  `)
  for (const r of g.rows) console.log(`  ${r.is_nullable === 'NO' ? 'REQ' : '   '} ${r.column_name.padEnd(22)} ${r.data_type}`)

  console.log('\n═══ Existing niche data in prediction_runs (via video_files + scraped_videos) ═══')
  const h = await pg.query(`
    SELECT COALESCE(vf.niche, sv.niche, '__unknown__') AS niche, COUNT(*)::int AS n
    FROM prediction_runs pr
    LEFT JOIN video_files vf ON (pr.video_id)::uuid = vf.id
    LEFT JOIN scraped_videos sv ON pr.video_id = sv.video_id
    WHERE pr.actual_dps IS NOT NULL AND pr.predicted_dps_7d IS NOT NULL
    GROUP BY 1
    ORDER BY n DESC
  `)
  for (const r of h.rows) console.log(`  ${r.niche.padEnd(20)} ${r.n}`)

  await pg.end()
})()
