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
  for (const t of ['creators', 'videos', 'creator_predictions']) {
    console.log(`\n── ${t} ──`)
    const { rows } = await pg.query(
      `SELECT column_name, data_type FROM information_schema.columns
        WHERE table_name=$1 ORDER BY ordinal_position`,
      [t],
    )
    for (const r of rows) console.log(`  ${r.column_name}  ${r.data_type}`)
  }
  // Sample creators row count + check if any exist for the real agency
  const { rows } = await pg.query(
    `SELECT COUNT(*)::int AS n FROM creators WHERE agency_id = '62cb020e-5303-452e-8cf2-83368c912b6e'`,
  )
  console.log(`\ncreators for real agency: ${rows[0].n}`)
  const { rows: sample } = await pg.query(
    `SELECT id, agency_id, user_id FROM creators LIMIT 3`,
  )
  console.log('sample creators:', sample)
  await pg.end()
})().catch((e) => { console.error(e); process.exit(1) })
