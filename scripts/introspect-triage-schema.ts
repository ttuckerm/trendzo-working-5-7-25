import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env.local') })
const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const pw = env.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)![1].trim()
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '').split('.')[0]

;(async () => {
  const pg = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.${ref}.supabase.co:5432/postgres`,
  })
  await pg.connect()

  for (const t of ['content_briefs', 'detected_trends', 'cultural_events', 'onboarding_profiles', 'agency_events']) {
    const { rows } = await pg.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name=$1
       ORDER BY column_name`,
      [t],
    )
    console.log(`\n${t}:`, rows.length === 0 ? 'NOT FOUND' : rows.map((r: any) => r.column_name).join(', '))
  }

  await pg.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
