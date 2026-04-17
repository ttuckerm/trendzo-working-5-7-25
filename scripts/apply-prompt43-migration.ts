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
  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260411_prompt43_mcp.sql'),
    'utf-8',
  )
  await pg.query(sql)
  console.log('✅ Migration applied')
  const { rows: k } = await pg.query(`SELECT COUNT(*)::int AS n FROM mcp_api_keys`)
  const { rows: l } = await pg.query(`SELECT COUNT(*)::int AS n FROM mcp_call_log`)
  console.log(`mcp_api_keys rows: ${k[0].n}`)
  console.log(`mcp_call_log rows: ${l[0].n}`)
  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })
