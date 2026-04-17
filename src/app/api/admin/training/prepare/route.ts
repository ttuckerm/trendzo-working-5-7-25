/**
 * POST /api/admin/training/prepare
 *
 * Runs the full training dataset preparation pipeline:
 *   1) filter → 2) row-floor check → (stop if not met) → 3) DPS bimodal check →
 *   4) scaling params → 5) insert training_prep_runs row
 *
 * Admin/chairman role required. Optional body: { filterParams?: Partial<FilterParams> }.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-guard';
import {
  filterTrainingRows,
  checkRowFloor,
  checkDPSDistribution,
  computeScalingParams,
  recordPrepRun,
  DEFAULT_FILTER_PARAMS,
  FilterParams,
  RowFloorResult,
  DPSDistributionResult,
} from '@/lib/training/dataset-prep';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface PrepResult {
  totalEligible: number;
  totalAfterFilter: number;
  rowFloor: RowFloorResult;
  dpsDistribution?: DPSDistributionResult;
  scalingParams?: { featuresScaled: number };
  readyForS6: boolean;
  prepRunId: string | null;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const allowedRoles = ['chairman', 'admin', 'super_admin'];
  if (!auth.profile?.role || !allowedRoles.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  let body: { filterParams?: Partial<FilterParams> } = {};
  try {
    body = (await req.json().catch(() => ({}))) as { filterParams?: Partial<FilterParams> };
  } catch {
    // Empty body is allowed — defaults will apply.
  }

  try {
    // 1) Filter
    const filtered = await filterTrainingRows(body.filterParams);

    // 2) Row floor
    const rowFloor = checkRowFloor(filtered.count);
    if (!rowFloor.met) {
      // Record the aborted run so the diagnostic history is complete.
      const prepRunId = await recordPrepRun({
        totalEligible: filtered.totalEligible,
        totalAfterFilter: filtered.count,
        dpsMeanOriginal: 0,
        dpsMeanNew: 0,
        isBimodal: false,
        dpsPopulationFlagAdded: false,
        minRowFloorMet: false,
        scalingApplied: false,
        filterParams: filtered.filterParams,
        notes: `Aborted — row floor not met (${rowFloor.count} < ${1500}). Suggestion: ${rowFloor.suggestion}`,
      });
      const result: PrepResult = {
        totalEligible: filtered.totalEligible,
        totalAfterFilter: filtered.count,
        rowFloor,
        readyForS6: false,
        prepRunId,
      };
      return NextResponse.json(
        { error: 'Row floor not met — training cannot proceed', ...result },
        { status: 400 },
      );
    }

    // 3) DPS bimodal check (also writes the flag on the cache when bimodal)
    const dpsDistribution = await checkDPSDistribution(filtered.rows);

    // 4) Scaling params
    const scalingParams = await computeScalingParams(filtered.rows);

    // 5) Record the prep run
    const prepRunId = await recordPrepRun({
      totalEligible: filtered.totalEligible,
      totalAfterFilter: filtered.count,
      dpsMeanOriginal: dpsDistribution.popA.mean,
      dpsMeanNew: dpsDistribution.popB.mean,
      isBimodal: dpsDistribution.isBimodal,
      dpsPopulationFlagAdded: dpsDistribution.flagAdded,
      minRowFloorMet: true,
      scalingApplied: scalingParams.featuresScaled > 0,
      filterParams: filtered.filterParams,
    });

    const result: PrepResult = {
      totalEligible: filtered.totalEligible,
      totalAfterFilter: filtered.count,
      rowFloor,
      dpsDistribution,
      scalingParams: { featuresScaled: scalingParams.featuresScaled },
      readyForS6: true,
      prepRunId,
    };
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Expose the defaults so the UI can show what will be applied.
export async function GET() {
  return NextResponse.json({ defaults: DEFAULT_FILTER_PARAMS });
}
