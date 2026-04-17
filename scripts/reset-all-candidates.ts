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
  await pg.query(`UPDATE candidate_features SET status='untested', spearman_delta=NULL, tested_date=NULL WHERE status <> 'untested'`)
  const r = await pg.query(`SELECT feature_name, status FROM candidate_features ORDER BY created_at`)
  for (const row of r.rows) console.log(`  ${row.feature_name.padEnd(28)} ${row.status}`)
  await pg.end()
})()
