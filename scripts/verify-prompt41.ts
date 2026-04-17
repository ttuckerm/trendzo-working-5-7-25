/**
 * Prompt 41 — end-to-end verification + TABM Gate 4 adversarial runs.
 *
 * Usage: npx tsx scripts/verify-prompt41.ts
 *
 * What this does (all against live Supabase):
 *   1. Apply the Prompt 41 migration (CREATE candidate_features + ALTER
 *      CHECKs) via direct pg connection.
 *   2. Seed ~40 synthetic prediction_runs rows with plausible
 *      predicted_dps_7d + actual_dps pairs, tagged source='prompt41_test'
 *      so cleanup is trivial.
 *   3. Run the happy path: invoke the feature-discovery handler directly
 *      (avoids the fire-and-forget dispatcher path), write the task row
 *      like the dispatcher would, then call the finalizer.
 *   4. Query candidate_features + scheduled_actions to verify the flow.
 *   5. Run three TABM Gate 4 adversarial cases:
 *        - Empty data: wipe synthetic rows, re-run.
 *        - Bad data: synthetic rows with actual_dps=0 everywhere.
 *        - Overload: 50 untested candidate_features, confirm only top 2
 *          dispatched.
 *   6. Clean up: delete synthetic prediction_runs + test-inserted
 *      candidate_features + coordinator_tasks + scheduled_actions.
 *
 * Everything tagged with source='prompt41_test' (prediction_runs) or
 * created_by='prompt41_test' (coordinator_tasks) or
 * trigger_condition containing 'prompt41_test' (scheduled_actions).
 */

import { Client } from 'pg'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env.local') })

import { featureDiscoveryHandler } from '../src/lib/coordinator/handlers/feature-discovery'
import { finalizeFeatureDiscoveryTask } from '../src/lib/coordinator/feature-discovery-finalize'

// ── Env + connections ──────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const dbPwMatch = envContent.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)
const DB_PASSWORD = dbPwMatch ? dbPwMatch[1].trim() : process.env.SUPABASE_DB_PASSWORD || ''

if (!SUPABASE_URL || !SERVICE_KEY || !DB_PASSWORD) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY / SUPABASE_DB_PASSWORD')
  process.exit(1)
}

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0]
const PG_CONN = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`

const sb: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const TEST_TAG = 'prompt41_test'
const TEST_CANDIDATE_NAMES_OVERLOAD = Array.from({ length: 50 }, (_, i) => `prompt41_overload_${i}`)

// ── Helpers ────────────────────────────────────────────────────────────
function banner(msg: string) {
  console.log('\n' + '═'.repeat(72))
  console.log(msg)
  console.log('═'.repeat(72))
}

async function applyMigration(pg: Client) {
  banner('1. Applying Prompt 41 migration')
  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260411_prompt41_candidate_features.sql'),
    'utf-8',
  )
  await pg.query(sql)
  console.log('✅ Migration applied (or already present — all statements are idempotent)')
}

async function seedPredictionRuns(n: number, actualPattern: 'realistic' | 'zero') {
  // Required columns guess — minimal set. If insert fails on a NOT NULL
  // we'll see the error clearly.
  const rows: Array<Record<string, unknown>> = []
  for (let i = 0; i < n; i++) {
    // Correlated predicted/actual so baseline Spearman is meaningful.
    const predicted = 0.3 + (i / n) * 0.5 + (Math.random() - 0.5) * 0.05
    const actual = actualPattern === 'zero'
      ? 0
      : predicted + (Math.random() - 0.5) * 0.1
    rows.push({
      video_id: `prompt41_test_${i}_${Date.now()}`,
      predicted_dps_7d: predicted,
      actual_dps: Math.max(0, actual),
      source: TEST_TAG,
      created_at: new Date().toISOString(),
    })
  }
  const { error } = await sb.from('prediction_runs').insert(rows)
  if (error) throw new Error(`Failed to seed prediction_runs: ${error.message}`)
}

async function cleanupSyntheticRuns() {
  await sb.from('prediction_runs').delete().eq('source', TEST_TAG)
}

async function cleanupAllTestArtifacts(pg: Client) {
  await cleanupSyntheticRuns()
  // Delete test-created coordinator tasks
  await sb.from('coordinator_tasks').delete().eq('created_by', TEST_TAG)
  // Delete only the overload batch — NEVER delete the 3 seed rows,
  // they're production data the migration ships. Also reset the
  // seed rows back to 'untested' in case a test run promoted/
  // rejected them.
  await pg.query(
    `DELETE FROM candidate_features WHERE feature_name = ANY($1::text[])`,
    [TEST_CANDIDATE_NAMES_OVERLOAD],
  )
  await pg.query(
    `UPDATE candidate_features
       SET status='untested', spearman_delta=NULL, tested_date=NULL
     WHERE feature_name IN ('hook_word_count','on_screen_text_density','audio_onset_count')`,
  )
  // Delete test-scheduled actions
  await sb
    .from('scheduled_actions')
    .delete()
    .eq('action_type', 'feature_discovery_review')
    .ilike('trigger_condition', `%${TEST_TAG}%`)
  // Also delete any feature_discovery_review rows we wrote during verification
  // (the finalizer writes them without the test tag — match on params.task_id
  // being one of our test task ids is harder, so we clean up by created_at).
  await sb
    .from('scheduled_actions')
    .delete()
    .eq('action_type', 'feature_discovery_review')
    .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
  // Also delete training_experiments rows created during the test
  await sb
    .from('training_experiments')
    .delete()
    .ilike('description', '%[SANDBOX][FEATURE_DISCOVERY]%')
    .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
}

async function resetTestCandidates() {
  // Reset the 3 seeded candidate features back to untested in case a
  // previous run flipped them.
  await sb
    .from('candidate_features')
    .update({ status: 'untested', spearman_delta: null, tested_date: null })
    .in('feature_name', ['hook_word_count', 'on_screen_text_density', 'audio_onset_count'])
}

// ── Dispatcher substitute ──────────────────────────────────────────────
// Runs breakdown + all subtasks + writes coordinator_tasks rows the
// same way the real dispatcher does, but synchronously so we can
// await the whole thing inside the verification script.
async function runFeatureDiscoveryTaskSync(testLabel: string): Promise<string> {
  const { data: inserted, error: insertErr } = await sb
    .from('coordinator_tasks')
    .insert({
      task_type: 'feature_discovery',
      status: 'running',
      input_params: { test_label: testLabel },
      created_by: TEST_TAG,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertErr || !inserted) throw new Error(`Failed to create task row: ${insertErr?.message}`)
  const taskId = inserted.id as string

  const { subtasks, meta } = await featureDiscoveryHandler.breakdown({}, sb)
  const results: Array<{ label: string; ok: true; result: unknown; subtask_params: Record<string, unknown> }> = []
  const errors: Array<{ label: string; ok: false; error: string; subtask_params: Record<string, unknown> }> = []

  for (const st of subtasks) {
    try {
      const r = await featureDiscoveryHandler.runSubtask(st.params, sb)
      results.push({ label: st.label, ok: true, result: r, subtask_params: st.params })
    } catch (err) {
      errors.push({
        label: st.label,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        subtask_params: st.params,
      })
    }
  }

  await sb
    .from('coordinator_tasks')
    .update({
      status: 'completed',
      output_result: {
        ok: results.length,
        failed: errors.length,
        results,
        errors,
        progress: { done: subtasks.length, total: subtasks.length },
        meta,
      },
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  return taskId
}

// ── Verification assertions ────────────────────────────────────────────

interface Summary {
  name: string
  pass: boolean
  details: string[]
}

const summaries: Summary[] = []
function record(name: string, pass: boolean, details: string[]) {
  summaries.push({ name, pass, details })
  const icon = pass ? '✅' : '❌'
  console.log(`\n${icon} ${name}`)
  for (const d of details) console.log(`   ${d}`)
}

async function runHappyPath() {
  banner('2. Happy path: seed 40 synthetic rows, run feature discovery')
  await cleanupSyntheticRuns()
  await seedPredictionRuns(40, 'realistic')
  await resetTestCandidates()

  const taskId = await runFeatureDiscoveryTaskSync('happy_path')
  const fin = await finalizeFeatureDiscoveryTask(sb, taskId)

  // Assertion 1: task output has 5 results
  const { data: task } = await sb
    .from('coordinator_tasks')
    .select('output_result')
    .eq('id', taskId)
    .single()
  const out = task?.output_result as any
  const fiveResults = Array.isArray(out?.results) && out.results.length + out.errors.length === 5
  const details: string[] = []
  details.push(`task ${taskId.slice(0, 8)} — ok=${out?.ok} failed=${out?.failed}`)
  for (const r of out?.results || []) {
    const res = r.result as any
    if (res.skipped_reason) {
      details.push(`  ${r.label}: SKIPPED (${res.skipped_reason})`)
    } else {
      details.push(`  ${r.label}: spearman=${res.validation_spearman} delta=${res.delta} n=${res.n_evaluated}`)
    }
  }

  // Assertion 2: candidate_features flipped
  const { data: cands } = await sb
    .from('candidate_features')
    .select('feature_name, status, spearman_delta')
    .in('feature_name', ['hook_word_count', 'on_screen_text_density', 'audio_onset_count'])
  details.push(`candidate_features after finalize:`)
  for (const c of cands || []) {
    details.push(`  ${c.feature_name}: ${c.status} (delta ${c.spearman_delta})`)
  }

  // Assertion 3: scheduled_action written
  details.push(`finalizer result: ok=${fin.ok} scheduled_action_id=${fin.scheduled_action_id?.slice(0, 8)} best=${fin.best_worker?.label}`)

  const pass =
    fiveResults &&
    fin.ok === true &&
    !!fin.scheduled_action_id &&
    (cands || []).some((c: any) => c.status === 'promoted' || c.status === 'rejected')

  record('Happy path (3 candidates, 40 rows)', pass, details)
}

async function runAdversarial1_EmptyData() {
  banner('3a. Adversarial: empty data (zero prediction_runs)')
  await cleanupSyntheticRuns()
  await resetTestCandidates()
  // Also delete any OTHER prediction_runs for the window the loader
  // pulls? No — the loader reads from all prediction_runs since last
  // training date. If prod data exists, we can't truly test "zero".
  // We test the narrower property: when the loader returns 0 rows,
  // workers skip with insufficient_data. To do that honestly, we
  // don't wipe prod data — we rely on the seeded rows being the only
  // test data. If the loader returns >0 due to real data, we note it
  // in the test output and still check the degraded-path contract.
  const taskId = await runFeatureDiscoveryTaskSync('empty_data')
  await finalizeFeatureDiscoveryTask(sb, taskId)

  const { data: task } = await sb
    .from('coordinator_tasks')
    .select('output_result')
    .eq('id', taskId)
    .single()
  const out = task?.output_result as any
  const meta = out?.meta
  const details: string[] = []
  details.push(`feedback_rows seen by handler: ${meta?.feedback_rows}`)

  // The test is "does the system degrade gracefully when rows are scarce?"
  // If real prod data exists, the test is weaker — document that.
  if ((meta?.feedback_rows ?? 0) === 0) {
    // Pure empty case: all workers should skip
    let allSkipped = true
    for (const r of out?.results || []) {
      const res = r.result as any
      if (!res.skipped_reason && res.experiment_id !== '') {
        allSkipped = false
        details.push(`  ${r.label}: NOT skipped (spearman=${res.validation_spearman})`)
      } else {
        details.push(`  ${r.label}: skipped (${res.skipped_reason || 'insufficient_data'})`)
      }
    }
    // Task should still be completed, not failed
    record('Adversarial: empty data', allSkipped && out?.failed === 0, details)
  } else {
    details.push(`NOTE: ${meta?.feedback_rows} real prod prediction_runs exist. Can't simulate true-empty. Workers ran against real data.`)
    // Weaker assertion: task still completes without throwing
    record('Adversarial: empty data (weakened — real data present)', out?.failed === 0, details)
  }
}

async function runAdversarial2_BadData() {
  banner('3b. Adversarial: bad data (actual_dps=0 everywhere)')
  await cleanupSyntheticRuns()
  await seedPredictionRuns(40, 'zero')
  await resetTestCandidates()
  const taskId = await runFeatureDiscoveryTaskSync('bad_data')
  await finalizeFeatureDiscoveryTask(sb, taskId)
  const { data: task } = await sb
    .from('coordinator_tasks')
    .select('output_result')
    .eq('id', taskId)
    .single()
  const out = task?.output_result as any
  const details: string[] = []
  details.push(`meta.feedback_rows=${out?.meta?.feedback_rows}`)
  for (const r of out?.results || []) {
    const res = r.result as any
    if (res.skipped_reason) {
      details.push(`  ${r.label}: skipped (${res.skipped_reason})`)
    } else {
      details.push(`  ${r.label}: spearman=${res.validation_spearman} delta=${res.delta}`)
    }
  }
  // Expected: task completes, no crashes, deltas are ~0 or negative
  const noCrashes = out?.failed === 0
  record('Adversarial: bad data (actual_dps=0)', noCrashes, details)
}

async function runAdversarial3_Overload(pg: Client) {
  banner('3c. Adversarial: 50 untested candidate_features')
  // The test-sequencing artifact: getLastTrainingDate() from the
  // trainer-engine returns the most recent (improved|no_change|degraded|
  // pending_promotion) experiment. Case 3b writes 'degraded' experiments
  // from its actual_dps=0 run. Case 3c's fresh prediction_runs need to
  // be AFTER that last training date or the loader will filter them out.
  // We've already ensured created_at=now() in seedPredictionRuns, but
  // to eliminate any clock skew, we wipe prior test experiments first.
  await sb
    .from('training_experiments')
    .delete()
    .ilike('description', '%[SANDBOX][FEATURE_DISCOVERY]%')
  await cleanupSyntheticRuns()
  await seedPredictionRuns(40, 'realistic')
  await resetTestCandidates()

  // Delete any prior overload rows, then insert 50.
  await pg.query('DELETE FROM candidate_features WHERE feature_name = ANY($1::text[])', [TEST_CANDIDATE_NAMES_OVERLOAD])
  const values = TEST_CANDIDATE_NAMES_OVERLOAD
    .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3}, 'untested')`)
    .join(',')
  const params: string[] = []
  for (const name of TEST_CANDIDATE_NAMES_OVERLOAD) {
    params.push(name, `overload test ${name}`, 'noop')
  }
  await pg.query(
    `INSERT INTO candidate_features (feature_name, description, extraction_logic, status) VALUES ${values}`,
    params,
  )

  const taskId = await runFeatureDiscoveryTaskSync('overload')
  await finalizeFeatureDiscoveryTask(sb, taskId)

  const { data: task } = await sb
    .from('coordinator_tasks')
    .select('output_result')
    .eq('id', taskId)
    .single()
  const out = task?.output_result as any
  const details: string[] = []
  details.push(`meta.feedback_rows=${out?.meta?.feedback_rows} meta.candidates_seen=${out?.meta?.candidates_seen} candidates_dispatched=${out?.meta?.candidates_dispatched}`)
  for (const r of out?.results || []) {
    const res = r.result as any
    if (res.skipped_reason) {
      details.push(`  ${r.label}: skipped (${res.skipped_reason})`)
    } else {
      details.push(`  ${r.label}: spearman=${res.validation_spearman} delta=${res.delta} n=${res.n_evaluated}`)
    }
  }
  // Also count how many overload rows are still untested after run
  const { data: stillUntested } = await sb
    .from('candidate_features')
    .select('feature_name')
    .in('feature_name', TEST_CANDIDATE_NAMES_OVERLOAD)
    .eq('status', 'untested')
  details.push(`overload rows still untested: ${stillUntested?.length} / ${TEST_CANDIDATE_NAMES_OVERLOAD.length}`)

  // Expected: only 2 dispatched (workers B and C), 48 still untested
  const dispatchedOk = out?.meta?.candidates_dispatched === 2
  const untestedOk = (stillUntested?.length ?? 0) >= 48
  record('Adversarial: 50-candidate overload', dispatchedOk && untestedOk, details)
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  const pg = new Client({ connectionString: PG_CONN })
  await pg.connect()
  try {
    await applyMigration(pg)
    await runHappyPath()
    await runAdversarial1_EmptyData()
    await runAdversarial2_BadData()
    await runAdversarial3_Overload(pg)
  } finally {
    banner('4. Cleanup')
    await cleanupAllTestArtifacts(pg)
    console.log('✅ Cleaned up synthetic rows + test artifacts')
    await pg.end()
  }

  banner('SUMMARY')
  for (const s of summaries) {
    console.log(`${s.pass ? '✅' : '❌'} ${s.name}`)
  }
  const allPass = summaries.every((s) => s.pass)
  process.exit(allPass ? 0 : 1)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
