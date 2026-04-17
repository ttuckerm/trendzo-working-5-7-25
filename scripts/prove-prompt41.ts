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
  const a = await pg.query(`SELECT COUNT(*)::int AS n FROM candidate_features`)
  console.log(`candidate_features rows: ${a.rows[0].n}`)
  const b = await pg.query(`SELECT feature_name, status FROM candidate_features ORDER BY created_at`)
  for (const r of b.rows) console.log(`  ${r.feature_name.padEnd(28)} ${r.status}`)
  const c = await pg.query(`
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conname IN ('coordinator_tasks_task_type_check','scheduled_actions_action_type_check')
  `)
  for (const r of c.rows) {
    const def = r.pg_get_constraintdef as string
    console.log(`\n${r.conname}:`)
    console.log(`  includes feature_discovery: ${def.includes('feature_discovery')}`)
  }
  await pg.end()
})()
