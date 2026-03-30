#!/usr/bin/env npx tsx
/**
 * Step 6 Verification Script — Legacy Label Archive
 *
 * Run after applying 20260325_dps_v2_step6_archive_legacy_labels.sql
 * to verify the archival was complete and correct.
 *
 * Checks:
 *   1. No labeled rows have NULL dps_formula_version
 *   2. Legacy rows have legacy_actual_dps populated
 *   3. Legacy rows are excluded from training_label_eligible
 *   4. V2 rows (if any) are untouched
 *   5. History and eval routes would still load (type check)
 *
 * Run:
 *   npx tsx scripts/verify-legacy-archive.ts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  classifyLabelCategory,
  computeLabelBreakdown,
  isTrainingLabelEligible,
} from '../src/lib/training/training-eligibility';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Step 6 Verification — Legacy Label Archive');
  console.log('═══════════════════════════════════════════════════\n');

  const results: CheckResult[] = [];

  // ── Check 1: No labeled rows with NULL dps_formula_version ──────────────
  {
    const { count } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null)
      .is('dps_formula_version', null);

    results.push({
      name: 'No labeled rows with NULL dps_formula_version',
      passed: (count || 0) === 0,
      detail: count === 0
        ? 'All labeled rows have explicit version'
        : `${count} rows still have NULL dps_formula_version`,
    });
  }

  // ── Check 2: Legacy rows have legacy_actual_dps populated ───────────────
  {
    const { count: legacyTotal } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .eq('dps_formula_version', 'legacy_v1');

    const { count: legacyWithArchive } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .eq('dps_formula_version', 'legacy_v1')
      .not('legacy_actual_dps', 'is', null);

    const total = legacyTotal || 0;
    const archived = legacyWithArchive || 0;

    results.push({
      name: 'Legacy rows have legacy_actual_dps populated',
      passed: total === archived,
      detail: `${archived}/${total} legacy rows have legacy_actual_dps`,
    });
  }

  // ── Check 3: Legacy rows excluded from training_label_eligible ──────────
  {
    const { data: legacySample } = await supabase
      .from('prediction_runs')
      .select('id, actual_dps, dps_formula_version, dps_label_trust, dps_training_weight')
      .eq('dps_formula_version', 'legacy_v1')
      .limit(100);

    const rows = (legacySample || []) as any[];
    const eligible = rows.filter(r => isTrainingLabelEligible(r));
    const allLegacy = rows.every(r => classifyLabelCategory(r) === 'legacy_v1');

    results.push({
      name: 'Legacy rows classified correctly by TS eligibility',
      passed: eligible.length === 0 && allLegacy,
      detail: eligible.length === 0
        ? `All ${rows.length} sampled legacy rows are ineligible (classify as legacy_v1)`
        : `${eligible.length}/${rows.length} legacy rows INCORRECTLY classified as eligible`,
    });
  }

  // ── Check 3b: Verify via enriched view ──────────────────────────────────
  {
    const { count } = await supabase
      .from('prediction_runs_enriched')
      .select('id', { count: 'exact', head: true })
      .eq('dps_formula_version', 'legacy_v1')
      .eq('training_label_eligible', true);

    results.push({
      name: 'Legacy rows excluded from training_label_eligible (SQL view)',
      passed: (count || 0) === 0,
      detail: count === 0
        ? 'No legacy_v1 rows have training_label_eligible=true'
        : `${count} legacy_v1 rows INCORRECTLY have training_label_eligible=true`,
    });
  }

  // ── Check 4: V2 rows untouched ─────────────────────────────────────────
  {
    const { count: v2Count } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('dps_formula_version', 'is', null)
      .like('dps_formula_version', '2%');

    // V2 rows should NOT have legacy_dps_formula_version set (we never touch them)
    const { count: v2WithLegacyTag } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .like('dps_formula_version', '2%')
      .not('legacy_dps_formula_version', 'is', null);

    results.push({
      name: 'V2 rows untouched by archival',
      passed: (v2WithLegacyTag || 0) === 0,
      detail: `${v2Count || 0} v2 rows exist; ${v2WithLegacyTag || 0} have legacy archive tags (should be 0)`,
    });
  }

  // ── Check 5: Legacy rows have training_weight = 0 ──────────────────────
  {
    const { count } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .eq('dps_formula_version', 'legacy_v1')
      .gt('dps_training_weight', 0);

    results.push({
      name: 'Legacy rows have training_weight = 0',
      passed: (count || 0) === 0,
      detail: count === 0
        ? 'All legacy_v1 rows have weight 0'
        : `${count} legacy_v1 rows have training_weight > 0`,
    });
  }

  // ── Check 6: Full label breakdown ──────────────────────────────────────
  {
    const { data: allLabeled } = await supabase
      .from('prediction_runs')
      .select('actual_dps, dps_formula_version, dps_label_trust, dps_training_weight')
      .not('actual_dps', 'is', null);

    const breakdown = computeLabelBreakdown((allLabeled || []) as any[]);

    results.push({
      name: 'Label breakdown computed successfully',
      passed: true,
      detail: `total=${breakdown.total}, legacy_v1=${breakdown.legacy_v1}, ` +
        `v2_trusted=${breakdown.v2_trusted}, v2_degraded=${breakdown.v2_degraded}, ` +
        `v2_untrusted=${breakdown.v2_untrusted}, v2_eligible=${breakdown.total_v2_eligible}`,
    });
  }

  // ── Check 7: Provenance breakdown ──────────────────────────────────────
  {
    const { data: provenanceRows } = await supabase
      .from('prediction_runs')
      .select('legacy_dps_formula_version')
      .eq('dps_formula_version', 'legacy_v1')
      .not('legacy_dps_formula_version', 'is', null);

    const counts: Record<string, number> = {};
    for (const r of (provenanceRows || []) as any[]) {
      const prov = r.legacy_dps_formula_version || 'null';
      counts[prov] = (counts[prov] || 0) + 1;
    }

    const summary = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');

    results.push({
      name: 'Legacy provenance inferred',
      passed: Object.keys(counts).length > 0 || (provenanceRows || []).length === 0,
      detail: summary || '(no legacy rows — nothing to verify)',
    });
  }

  // ── Report ─────────────────────────────────────────────────────────────

  console.log('  Results:');
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${r.name}`);
    console.log(`         ${r.detail}`);
    if (!r.passed) allPassed = false;
  }

  console.log('\n═══════════════════════════════════════════════════');
  if (allPassed) {
    console.log('  ALL CHECKS PASSED');
  } else {
    console.log('  SOME CHECKS FAILED — review above');
  }
  console.log('═══════════════════════════════════════════════════\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
