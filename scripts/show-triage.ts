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

  const { rows } = await pg.query(
    `SELECT agency_id, triage_date, item_count, computed_at, items
     FROM agency_triage
     ORDER BY computed_at DESC
     LIMIT 5`,
  )

  for (const row of rows) {
    console.log(`\n=== agency ${row.agency_id} | date ${row.triage_date} | ${row.item_count} items ===`)
    console.log(`computed at: ${row.computed_at}`)
    for (let i = 0; i < row.items.length; i++) {
      const item = row.items[i]
      console.log(`\n  [${i + 1}] ${item.type.toUpperCase()} (urgency ${item.urgency}/10)`)
      console.log(`      ${item.summary}`)
      console.log(`      actions: ${item.suggested_actions.join(', ')}`)
    }
  }

  await pg.end()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
