import { NextResponse } from 'next/server';
import { checkAllPagesHealth } from '@/lib/control-center/page-health-checker';
import { checkAllComponentsHealth, checkEnhancementsStatus, calculateAverageLatency } from '@/lib/control-center/component-status-checker';
import { SystemHealthSummary } from '@/lib/control-center/types';

export const dynamic = 'force-dynamic';

export async function GET() {
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
































































































