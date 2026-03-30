import { NextRequest, NextResponse } from 'next/server';
import { recomputeCohortStats } from '@/lib/services/viral-prediction/dps-baselines';

export async function GET(_req: NextRequest) {
  const out = await recomputeCohortStats();
  return NextResponse.json({ ok: true, ...out });
}










