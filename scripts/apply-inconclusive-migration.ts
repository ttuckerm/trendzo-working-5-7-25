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

  // 1. Apply the migration
  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260411_prompt41_inconclusive_result.sql'),
    'utf-8',
  )
  await pg.query(sql)
  console.log('✅ Migration applied: training_experiments.result CHECK extended')

  // 2. Verify the CHECK now includes inconclusive_tiny_sample
  const c = await pg.query(`
    SELECT pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conname = 'training_experiments_result_check'
  `)
  console.log(`constraint: ${c.rows[0].pg_get_constraintdef}`)

  // 3. Reset any candidate_features stuck in 'testing' back to 'untested'
  const r = await pg.query(`
    UPDATE candidate_features
       SET status='untested', spearman_delta=NULL, tested_date=NULL
     WHERE status = 'testing'
    RETURNING feature_name
  `)
  console.log(`✅ Reset ${r.rows.length} stuck 'testing' row(s) to 'untested':`)
  for (const row of r.rows) console.log(`   - ${row.feature_name}`)

  // 4. Report current candidate_features state
  const s = await pg.query(`
    SELECT feature_name, status, spearman_delta
    FROM candidate_features
    ORDER BY created_at
  `)
  console.log(`\ncandidate_features now:`)
  for (const row of s.rows) {
    console.log(`   ${row.feature_name.padEnd(28)} ${row.status.padEnd(10)} delta=${row.spearman_delta ?? 'null'}`)
  }

  await pg.end()
})()
