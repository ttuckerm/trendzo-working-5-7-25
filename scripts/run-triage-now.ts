/**
 * Manual trigger for overnight triage. Calls runTriageForAllAgencies
 * directly (no HTTP). Useful for first-time population and smoke tests.
 *
 * Loads .env.local manually BEFORE importing anything that reads env vars
 * at module-load time (@/lib/env does that).
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

;(async () => {
  // Dynamic import so dotenv runs first.
  const { runTriageForAllAgencies } = await import('@/lib/triage/overnight-triage')
  console.log('Running overnight triage for all agencies…')
  const result = await runTriageForAllAgencies()
  console.log(JSON.stringify(result, null, 2))
})().catch((e) => {
  console.error('Triage run failed:', e)
  process.exit(1)
})
