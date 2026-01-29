import { NextRequest, NextResponse } from 'next/server';
import { FrameworkEvolutionSystem } from '@/lib/services/viral-prediction/framework-evolution-system';

export async function POST(req: NextRequest) {
  try {
    const evo = new FrameworkEvolutionSystem();
    const result = await evo.runEvolutionCycle();
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 200 });
  }
}

export async function GET() {
  // For now, expose a simple status endpoint
  return NextResponse.json({ status: 'ready' });
}



