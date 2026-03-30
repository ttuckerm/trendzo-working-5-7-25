#!/usr/bin/env npx tsx
/**
 * Export Evaluation Set — Most Recent 20% of Training Data
 *
 * Uses the same extraction logic as export-training-dataset.ts but takes only
 * the most recent 20% of qualifying rows (ordered by created_at ASC, so the
 * last 20% are the newest).
 *
 * Run:
 *   npx tsx scripts/export-eval-set.ts
 *   npx tsx scripts/export-eval-set.ts --niche gaming
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

import { exportTrainingDataset } from './export-training-dataset';

function getCliArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const eq = args.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=')[1];
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

async function main() {
  const niche = (getCliArg('--niche') ?? 'side-hustles').toLowerCase().replace(/_/g, '-');

  console.log('═══════════════════════════════════════════════════');
  console.log(`  Evaluation Set Export — ${niche} (most recent 20%)`);
  console.log('═══════════════════════════════════════════════════\n');

  const { rowCount, outputPath } = await exportTrainingDataset({
    splitPercent: 0.2,
    niche,
  });

  console.log(`Eval set: ${rowCount} rows → ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
