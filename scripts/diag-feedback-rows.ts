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

  console.log('═══ prediction_runs totals ═══')
  const a = await pg.query(`SELECT COUNT(*)::int AS n FROM prediction_runs`)
  console.log(`total rows: ${a.rows[0].n}`)

  const b = await pg.query(`
    SELECT COUNT(*)::int AS n FROM prediction_runs
    WHERE actual_dps IS NOT NULL AND predicted_dps_7d IS NOT NULL
  `)
  console.log(`with both actual_dps + predicted_dps_7d: ${b.rows[0].n}`)

  const b2 = await pg.query(`
    SELECT COUNT(*)::int AS n FROM prediction_runs
    WHERE actual_dps IS NOT NULL
  `)
  const b3 = await pg.query(`
    SELECT COUNT(*)::int AS n FROM prediction_runs
    WHERE predicted_dps_7d IS NOT NULL
  `)
  console.log(`with actual_dps alone: ${b2.rows[0].n}`)
  console.log(`with predicted_dps_7d alone: ${b3.rows[0].n}`)

  console.log('\n═══ getLastTrainingDate equivalent ═══')
  const c = await pg.query(`
    SELECT id, created_at, description, result, experiment_mode
    FROM training_experiments
    WHERE result IN ('improved','no_change','degraded','pending_promotion')
    ORDER BY created_at DESC
    LIMIT 5
  `)
  console.log(`most recent 5 non-error experiments:`)
  for (const r of c.rows) {
    console.log(`  ${r.created_at.toISOString()} — ${r.result} — ${r.experiment_mode || 'null'} — ${(r.description || '').slice(0, 80)}`)
  }
  const lastTrainingDate = c.rows[0]?.created_at

  console.log('\n═══ Rows that WOULD be loaded by loadFeedbackData ═══')
  if (lastTrainingDate) {
    const d = await pg.query(`
      SELECT COUNT(*)::int AS n FROM prediction_runs
      WHERE actual_dps IS NOT NULL
        AND predicted_dps_7d IS NOT NULL
        AND created_at >= $1
    `, [lastTrainingDate])
    console.log(`with filter (created_at >= ${lastTrainingDate.toISOString()}): ${d.rows[0].n}`)
  }
  const e = await pg.query(`
    SELECT COUNT(*)::int AS n FROM prediction_runs
    WHERE actual_dps IS NOT NULL
      AND predicted_dps_7d IS NOT NULL
  `)
  console.log(`WITHOUT date filter: ${e.rows[0].n}`)

  console.log('\n═══ Distribution: when were the scoreable rows created? ═══')
  const f = await pg.query(`
    SELECT DATE_TRUNC('day', created_at)::date AS day, COUNT(*)::int AS n
    FROM prediction_runs
    WHERE actual_dps IS NOT NULL AND predicted_dps_7d IS NOT NULL
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 20
  `)
  for (const r of f.rows) console.log(`  ${r.day} — ${r.n}`)

  console.log('\n═══ What a Feature Discovery worker would see (SAMPLE) ═══')
  const g = await pg.query(`
    SELECT id, predicted_dps_7d, actual_dps, video_id, created_at
    FROM prediction_runs
    WHERE actual_dps IS NOT NULL AND predicted_dps_7d IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 5
  `)
  for (const r of g.rows) {
    console.log(`  ${r.created_at.toISOString()} — pred=${r.predicted_dps_7d} actual=${r.actual_dps} video=${r.video_id?.slice(0, 16)}...`)
  }

  await pg.end()
})()
