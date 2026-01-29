import { NextRequest, NextResponse } from 'next/server';
import { analyticsReporting, TimeGranularity } from '@/lib/monitoring/analytics-reporting';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const metric = url.searchParams.get('metric') || 'prediction_accuracy';
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const end = new Date();
    const results = await analyticsReporting.executeAnalyticsQuery({
      metrics: [metric],
      filters: {},
      timeRange: { start, end },
      granularity: TimeGranularity.DAY,
    } as any);
    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 200 });
  }
}



