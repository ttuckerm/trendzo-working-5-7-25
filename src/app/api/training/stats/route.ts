/**
 * API Route: Get Training Data Statistics
 * 
 * GET /api/training/stats
 * 
 * Returns comprehensive statistics about the training data pipeline,
 * including source video counts, training data distribution, and quality metrics.
 */

import { NextResponse } from 'next/server';
import { 
  getTrainingDataStats, 
  getVideoSelectionStats,
  getTrainingPipelineStats
} from '@/lib/services/training';

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [trainingStats, selectionStats] = await Promise.all([
      getTrainingDataStats(),
      getVideoSelectionStats()
    ]);

    // Calculate derived metrics
    const viralCount = (trainingStats.byTier['mega-viral'] || 0) + 
                       (trainingStats.byTier['viral'] || 0);
    const viralPercentage = trainingStats.total > 0 
      ? (viralCount / trainingStats.total) * 100 
      : 0;

    // Check training readiness
    const isReady = {
      hasMinimumSamples: trainingStats.total >= 500,
      hasBalancedData: viralPercentage >= 10,
      hasGoodQuality: trainingStats.avgQuality >= 70,
      hasGoodCoverage: trainingStats.avgCoverage >= 50
    };

    const readyForTraining = isReady.hasMinimumSamples && 
                             isReady.hasBalancedData && 
                             isReady.hasGoodQuality;

    return NextResponse.json({
      success: true,
      
      // Source data stats
      source: {
        total: selectionStats.total,
        withTranscript: selectionStats.withTranscript,
        withDPS: selectionStats.withDPS,
        byClassification: selectionStats.byClassification,
        bySource: selectionStats.bySource,
        alreadyProcessed: selectionStats.alreadyProcessed,
        readyForProcessing: selectionStats.readyForProcessing
      },
      
      // Training data stats
      training: {
        total: trainingStats.total,
        byTier: trainingStats.byTier,
        bySplit: trainingStats.bySplit,
        avgQuality: Math.round(trainingStats.avgQuality * 10) / 10,
        avgCoverage: Math.round(trainingStats.avgCoverage * 10) / 10,
        withTranscript: trainingStats.withTranscript,
        lastUpdated: trainingStats.lastUpdated
      },
      
      // Derived metrics
      metrics: {
        viralCount,
        viralPercentage: Math.round(viralPercentage * 10) / 10,
        processingRate: selectionStats.total > 0 
          ? Math.round((selectionStats.alreadyProcessed / selectionStats.total) * 100) 
          : 0
      },
      
      // Readiness check
      readiness: {
        checks: isReady,
        readyForTraining,
        blockers: Object.entries(isReady)
          .filter(([_, passed]) => !passed)
          .map(([check]) => check)
      },
      
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Training stats error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}









