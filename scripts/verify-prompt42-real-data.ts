/**
 * Prompt 42 — Real-data verification
 *
 * Dispatches a cross_niche_transfer task directly via the dispatcher
 * (bypassing HTTP auth) and asserts the task completes gracefully
 * with zero subtasks because real training_experiments have
 * niche_scope=NULL, so top_features_per_niche is empty.
 */
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

async function main() {
  await pg.connect()
  console.log('═══ Real-data Prompt 42 verification ═══\n')

  // 1. Confirm top_features_per_niche is empty (the condition that makes
  //    real-data transfer graceful).
  const topView = await pg.query(`SELECT COUNT(*)::int AS n FROM top_features_per_niche`)
  console.log(`top_features_per_niche rows: ${topView.rows[0].n}`)

  // 2. Confirm niche_adjacency has pairs (structural check).
  const adj = await pg.query(`SELECT COUNT(*)::int AS n FROM niche_adjacency`)
  console.log(`niche_adjacency pairs: ${adj.rows[0].n}`)

  // 3. Dispatch a cross_niche_transfer task pointing at a data-thin niche.
  //    We pick `cooking-food` because real data has 0 experiments for it,
  //    so it's "thin" by any threshold. If this niche key doesn't exist
  //    we'll see it in the output.
  const nicheCheck = await pg.query(
    `SELECT id FROM niches WHERE id = 'cooking-food' OR id = 'side-hustles' ORDER BY id`,
  )
  console.log(`niches present: ${nicheCheck.rows.map((r) => r.id).join(', ')}`)

  // Import the handler dynamically so tsx resolves via Next's path aliases.
  process.env.NODE_ENV = 'development'
  const { crossNicheTransferHandler } = await import(
    '../src/lib/coordinator/handlers/cross-niche-transfer'
  )

  // Insert a real coordinator_tasks row so finalize can reference it.
  const targetNiche = 'cooking-food'
  const inserted = await pg.query(
    `INSERT INTO coordinator_tasks (task_type, status, params, created_at)
     VALUES ('cross_niche_transfer', 'running', $1::jsonb, now())
     RETURNING id`,
    [JSON.stringify({ target_niche: targetNiche })],
  )
  const taskId = inserted.rows[0].id
  console.log(`\nCreated coordinator_tasks row: ${taskId}`)

  // Call breakdown() directly.
  const ctx = {
    db: pg,
    taskId,
    params: { target_niche: targetNiche },
  } as any

  const breakdown = await crossNicheTransferHandler.breakdown(ctx)
  console.log(`\nbreakdown() returned ${breakdown.subtasks.length} subtask(s)`)
  console.log(`meta:`, JSON.stringify(breakdown.meta, null, 2))

  // Assert graceful: zero subtasks, note explains why.
  const pass =
    breakdown.subtasks.length === 0 &&
    breakdown.meta &&
    typeof breakdown.meta.note === 'string'

  console.log(`\n${pass ? '✅ PASS' : '❌ FAIL'} — real-data graceful degradation`)

  // Clean up the test task row so we don't pollute coordinator history.
  await pg.query(`DELETE FROM coordinator_tasks WHERE id = $1`, [taskId])

  await pg.end()
  process.exit(pass ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
