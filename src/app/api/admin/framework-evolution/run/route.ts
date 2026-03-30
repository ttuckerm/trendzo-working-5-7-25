/**
 * Framework Evolution System API Endpoint
 * Manages automatic discovery and validation of new viral frameworks
 * Evolves framework library from 40 to hundreds
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { FrameworkEvolutionSystem } from '@/lib/services/viral-prediction/framework-evolution-system';
import { createClient } from '@supabase/supabase-js';

function getDb(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await request.json();
    
    // Initialize Evolution System with optional config
    const evolutionSystem = new FrameworkEvolutionSystem(body.config);

    // Run evolution cycle
    const results = await evolutionSystem.runEvolutionCycle();

    const processingTime = Date.now() - startTime;

    // Store evolution cycle in database
    await getDb()
      .from('framework_evolution_cycles')
      .insert({
        new_patterns_discovered: results.newPatternsDiscovered,
        frameworks_validated: results.frameworksValidated,
        frameworks_retired: results.frameworksRetired,
        total_frameworks: results.totalFrameworks,
        processing_time_ms: processingTime,
        evolution_summary: results.evolutionSummary,
        created_at: new Date().toISOString()
      });

    const response = {
      success: true,
      processingTime,
      evolution: {
        newPatternsDiscovered: results.newPatternsDiscovered,
        frameworksValidated: results.frameworksValidated,
        frameworksRetired: results.frameworksRetired,
        totalFrameworks: results.totalFrameworks,
        evolutionSummary: results.evolutionSummary
      },
      
      // Evidence for proof of concept
      evidence: {
        frameworkGrowth: `${results.totalFrameworks} total frameworks (${results.newPatternsDiscovered} new discoveries)`,
        automatedEvolution: results.newPatternsDiscovered > 0 || results.frameworksValidated > 0,
        qualityControl: `${results.frameworksRetired} underperforming frameworks retired`,
        scalabilityDemonstrated: results.totalFrameworks > 40,
        
        systemCapabilities: {
          patternDiscovery: 'Automated viral pattern recognition',
          validation: 'Real-world performance testing',
          retirement: 'Quality-based framework lifecycle management',
          scaling: '40 → hundreds framework evolution'
        }
      },
      
      // Growth metrics
      growth: {
        dailyGrowthRate: results.newPatternsDiscovered - results.frameworksRetired,
        frameworkEvolutionStatus: results.totalFrameworks > 100 ? 'SCALING' : 'GROWING',
        targetProgress: {
          current: results.totalFrameworks,
          target: 'hundreds',
          progressPercentage: Math.min((results.totalFrameworks / 200) * 100, 100)
        }
      },
      
      // Performance insights
      performance: {
        discoveryEfficiency: results.newPatternsDiscovered / Math.max(1, processingTime / 1000),
        validationRate: results.frameworksValidated / Math.max(1, results.newPatternsDiscovered),
        retirementRate: results.frameworksRetired / Math.max(1, results.totalFrameworks),
        systemHealth: results.frameworksValidated >= results.frameworksRetired ? 'HEALTHY' : 'OPTIMIZING'
      },
      
      // Next cycle planning
      nextCycle: {
        recommendedInterval: '24 hours',
        estimatedNewPatterns: Math.round(results.newPatternsDiscovered * 1.1), // 10% growth
        capacityRemaining: Math.max(0, 500 - results.totalFrameworks), // Target 500 frameworks
        needsAttention: results.frameworksRetired > results.frameworksValidated
      },
      
      metadata: {
        timestamp: new Date().toISOString(),
        evolutionEngine: 'Framework Evolution System v1.0',
        algorithm: 'ML-based pattern recognition with performance validation',
        qualityAssurance: 'Automated validation and retirement system'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Framework evolution error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Framework evolution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '30');

    // Get recent evolution cycles
    const { data: cycles, error } = await getDb()
      .from('framework_evolution_cycles')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Calculate evolution statistics
    const totalCycles = cycles?.length || 0;
    const totalNewPatterns = cycles?.reduce((sum, cycle) => sum + (cycle.new_patterns_discovered || 0), 0) || 0;
    const totalValidated = cycles?.reduce((sum, cycle) => sum + (cycle.frameworks_validated || 0), 0) || 0;
    const totalRetired = cycles?.reduce((sum, cycle) => sum + (cycle.frameworks_retired || 0), 0) || 0;
    const latestFrameworkCount = cycles?.[0]?.total_frameworks || 40;

    // Get framework growth trend
    const growthTrend = cycles?.map(cycle => ({
      date: cycle.created_at,
      totalFrameworks: cycle.total_frameworks,
      newPatterns: cycle.new_patterns_discovered,
      validated: cycle.frameworks_validated,
      retired: cycle.frameworks_retired
    })) || [];

    // Calculate growth rate
    const firstCount = cycles?.[cycles.length - 1]?.total_frameworks || 40;
    const lastCount = cycles?.[0]?.total_frameworks || 40;
    const growthRate = ((lastCount - firstCount) / Math.max(firstCount, 1)) * 100;

    return NextResponse.json({
      success: true,
      statistics: {
        totalEvolutionCycles: totalCycles,
        totalNewPatternsDiscovered: totalNewPatterns,
        totalFrameworksValidated: totalValidated,
        totalFrameworksRetired: totalRetired,
        currentFrameworkCount: latestFrameworkCount,
        growthRate: growthRate.toFixed(1) + '%',
        avgPatternsPerCycle: totalCycles > 0 ? (totalNewPatterns / totalCycles).toFixed(1) : '0',
        validationSuccessRate: totalNewPatterns > 0 ? ((totalValidated / totalNewPatterns) * 100).toFixed(1) + '%' : '0%'
      },
      
      evolutionProgress: {
        startingFrameworks: 40,
        currentFrameworks: latestFrameworkCount,
        targetFrameworks: 'hundreds (200-500)',
        progressToTarget: Math.min((latestFrameworkCount / 200) * 100, 100).toFixed(1) + '%',
        evolutionStatus: latestFrameworkCount > 100 ? 'SCALING_SUCCESS' : 'GROWING',
        timeToTarget: this.estimateTimeToTarget(growthRate, latestFrameworkCount)
      },
      
      recentCycles: cycles?.slice(0, 5).map(cycle => ({
        id: cycle.id,
        date: cycle.created_at,
        newPatterns: cycle.new_patterns_discovered,
        validated: cycle.frameworks_validated,
        retired: cycle.frameworks_retired,
        totalFrameworks: cycle.total_frameworks,
        summary: cycle.evolution_summary,
        processingTime: cycle.processing_time_ms
      })) || [],
      
      growthTrend: growthTrend.reverse(), // Chronological order
      
      systemStatus: {
        evolutionActive: totalCycles > 0,
        lastEvolutionCycle: cycles?.[0]?.created_at || null,
        frameworkQuality: totalRetired <= totalValidated ? 'HIGH' : 'OPTIMIZING',
        discoveryRate: totalCycles > 0 ? (totalNewPatterns / totalCycles).toFixed(1) + ' patterns/cycle' : '0',
        scalingVelocity: growthRate > 10 ? 'FAST' : growthRate > 5 ? 'MODERATE' : 'SLOW'
      },
      
      capabilities: {
        patternDiscovery: 'Automated detection of emerging viral patterns',
        performanceValidation: 'Real-world testing against actual content',
        qualityControl: 'Automatic retirement of underperforming frameworks',
        continuousEvolution: '24/7 framework library optimization',
        scalabilityProven: latestFrameworkCount > 40
      }
    });

  } catch (error) {
    console.error('Get evolution statistics error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve evolution statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function (would be moved to utils in production)
function estimateTimeToTarget(growthRate: number, currentCount: number): string {
  if (growthRate <= 0) return 'Unknown (no growth detected)';
  
  const target = 200;
  const remaining = target - currentCount;
  
  if (remaining <= 0) return 'Target achieved';
  
  // Assume growth rate is monthly, estimate months to reach target
  const monthsToTarget = Math.ceil(remaining / (currentCount * (growthRate / 100)));
  
  if (monthsToTarget <= 1) return '< 1 month';
  if (monthsToTarget <= 12) return `${monthsToTarget} months`;
  
  const years = Math.ceil(monthsToTarget / 12);
  return `${years} year${years > 1 ? 's' : ''}`;
}