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
    resolve(process.cwd(), 'supabase/migrations/20260411_morning_briefs_agent_attribution.sql'),
    'utf-8',
  )
  await pg.query(sql)
  console.log('Migration applied')

  const colCheck = await pg.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'morning_briefs' AND column_name = 'generated_by_agent'
  `)
  console.log('Column:', colCheck.rows)

  const sample = await pg.query(`
    SELECT id, agency_id, brief_date, generated_by_agent, card_count,
           jsonb_path_query_array(cards, '$[*].generated_by_agent') AS card_agents
    FROM morning_briefs
    ORDER BY brief_date DESC
    LIMIT 5
  `)
  console.log('Recent rows:')
  console.table(sample.rows)

  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })
