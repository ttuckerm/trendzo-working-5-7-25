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
  const { rows } = await pg.query(
    `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name='training_experiments'
       ORDER BY ordinal_position`,
  )
  for (const r of rows) console.log(`${r.column_name}  ${r.data_type}  ${r.is_nullable}`)
  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })
