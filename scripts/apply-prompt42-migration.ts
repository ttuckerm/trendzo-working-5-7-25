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

  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260411_prompt42_cross_niche_patterns.sql'),
    'utf-8',
  )
  await pg.query(sql)
  console.log('✅ Migration applied')

  // Verify
  const t = await pg.query(`SELECT COUNT(*)::int AS n FROM cross_niche_patterns`)
  console.log(`cross_niche_patterns rows: ${t.rows[0].n}`)

  const v1 = await pg.query(`SELECT COUNT(*)::int AS n FROM niche_adjacency`)
  console.log(`niche_adjacency pairs: ${v1.rows[0].n}`)

  const v2 = await pg.query(`SELECT COUNT(*)::int AS n FROM top_features_per_niche`)
  console.log(`top_features_per_niche rows: ${v2.rows[0].n}`)

  const c1 = await pg.query(`
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conname = 'coordinator_tasks_task_type_check'
  `)
  console.log(`coordinator_tasks CHECK includes cross_niche_transfer: ${c1.rows[0]?.pg_get_constraintdef?.includes('cross_niche_transfer')}`)

  const c2 = await pg.query(`
    SELECT pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conname = 'scheduled_actions_action_type_check'
  `)
  console.log(`scheduled_actions CHECK includes cross_niche_review: ${c2.rows[0]?.pg_get_constraintdef?.includes('cross_niche_review')}`)

  // Sample adjacency
  console.log('\nSample adjacency (first 10 pairs):')
  const s = await pg.query(`SELECT niche_a, niche_b, shared_category FROM niche_adjacency ORDER BY shared_category, niche_a LIMIT 10`)
  for (const r of s.rows) console.log(`  ${r.niche_a.padEnd(28)} <-> ${r.niche_b.padEnd(28)} (${r.shared_category})`)

  await pg.end()
})()
