import { NextResponse } from 'next/server';
import { checkAllPagesHealth } from '@/lib/control-center/page-health-checker';
import { checkAllComponentsHealth, checkEnhancementsStatus, calculateAverageLatency } from '@/lib/control-center/component-status-checker';
import { SystemHealthSummary } from '@/lib/control-center/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
    return NextResponse.json({ summary: { pagesHealthy: 0, pagesWarning: 0, pagesError: 0, componentsHealthy: 0, componentsWarning: 0, componentsError: 0, enhancementsComplete: 0, enhancementsInProgress: 0, enhancementsPending: 0, avgLatency: 0, uptime: 100 }, pages: [], components: [], enhancements: [] });
  }

  try {
    const [pages, components, enhancements] = await Promise.all([
      checkAllPagesHealth(),
      checkAllComponentsHealth(),
      checkEnhancementsStatus()
    ]);
    
    // Calculate summary stats
    const pagesHealthy = pages.filter(p => p.status === 'healthy').length;
    const pagesWarning = pages.filter(p => p.status === 'warning').length;
    const pagesError = pages.filter(p => p.status === 'error').length;
    
    const componentsActive = components.filter(c => c.status === 'healthy' || c.status === 'running').length;
    const componentsTotal = components.length;
    
    // Calculate average latency
    const avgLatencyMs = calculateAverageLatency(components);
    const avgLatency = avgLatencyMs / 1000; // Convert to seconds
    
    const summary: SystemHealthSummary = {
      pagesHealthy,
      pagesWarning,
      pagesError,
      componentsActive,
      componentsTotal,
      avgAccuracy: 67, // TODO: Calculate from actual prediction records
      avgLatency,
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json({
      summary,
      pages,
      components,
      enhancements
    });
  } catch (error) {
    console.error('System health check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    );
  }
}
































































































