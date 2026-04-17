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
  const { rows } = await pg.query(
    `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'pre_generated_briefs_priority_type_check'`,
  )
  console.log(rows)
  // Also any other checks on that table
  const { rows: all } = await pg.query(
    `SELECT conname, pg_get_constraintdef(oid) AS def
       FROM pg_constraint
       WHERE conrelid = 'pre_generated_briefs'::regclass`,
  )
  console.log('\nAll constraints on pre_generated_briefs:')
  for (const r of all) console.log(` ${r.conname}: ${r.def}`)
  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })
