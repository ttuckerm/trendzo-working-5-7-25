export const runtime = 'nodejs';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { devGetCalibration } from '@/lib/dev/accuracyStore';

export async function GET(req: NextRequest) {
  try {
    const u = new URL(req.url);
    const cohort = u.searchParams.get('cohort') || '';
    if (!cohort) return NextResponse.json({ ok: false, error: 'missing cohort' }, { status: 400 });

    const rec = devGetCalibration?.(cohort);
    if (!rec) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });

    return NextResponse.json({ ok: true, cohort, points: (rec as any).mapping ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}



