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
  for (const tbl of ['agencies', 'agency_members', 'onboarding_profiles', 'memory_extractions']) {
    console.log(`\n── ${tbl} ──`)
    const { rows } = await pg.query(
      `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_name=$1 ORDER BY ordinal_position`,
      [tbl],
    )
    for (const r of rows) console.log(`${r.column_name}  ${r.data_type}  nullable=${r.is_nullable}  default=${r.column_default || ''}`)
  }
  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })
