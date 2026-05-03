import { NextRequest, NextResponse } from 'next/server';
import { recomputeCohortStats } from '@/lib/services/viral-prediction/dps-baselines';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const out = await recomputeCohortStats();
  return NextResponse.json({ ok: true, ...out });
}










