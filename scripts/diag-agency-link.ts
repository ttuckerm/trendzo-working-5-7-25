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

  const { rows: tables } = await pg.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND (table_name LIKE '%video%' OR table_name LIKE '%creator%' OR table_name LIKE '%client%' OR table_name LIKE '%ingest%')
    ORDER BY table_name`)
  console.log('\nvideo/creator/client/ingest tables:')
  for (const r of tables) console.log(`  ${r.table_name}`)

  const { rows: agCols } = await pg.query(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public'
      AND column_name IN ('agency_id','creator_id','client_id','user_id','owner_id','video_id')
    ORDER BY table_name, column_name`)
  console.log('\ncolumns referencing agency/creator/client/user/owner/video:')
  for (const r of agCols) console.log(`  ${r.table_name}.${r.column_name}`)

  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })
