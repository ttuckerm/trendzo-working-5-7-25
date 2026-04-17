import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env.local') })

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const pw = env.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)![1].trim()
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '').split('.')[0]

const MIGRATIONS = [
  'supabase/migrations/20260417_agency_triage.sql',
  'supabase/migrations/20260417_content_briefs_email_tracking.sql',
  'supabase/migrations/20260417_phase1_action_scaffolding.sql',
]

;(async () => {
  const pg = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.${ref}.supabase.co:5432/postgres`,
  })
  await pg.connect()

  for (const path of MIGRATIONS) {
    const sql = readFileSync(resolve(process.cwd(), path), 'utf-8')
    console.log(`Applying: ${path}`)
    await pg.query(sql)
    console.log(`  ✅ applied`)
  }

  // Smoke-check both migrations landed.
  const { rows: triageCheck } = await pg.query(
    `SELECT COUNT(*)::int AS n FROM agency_triage`,
  )
  console.log(`agency_triage rows: ${triageCheck[0].n}`)

  const { rows: colCheck } = await pg.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'content_briefs'
      AND column_name IN ('opened_at', 'clicked_at', 'open_count')
    ORDER BY column_name
  `)
  console.log(`content_briefs new columns: ${colCheck.map((r: any) => r.column_name).join(', ')}`)

  await pg.end()
})().catch((e) => {
  console.error('MIGRATION FAILED:', e)
  process.exit(1)
})
