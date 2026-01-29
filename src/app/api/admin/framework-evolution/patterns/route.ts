/**
 * Emerging Patterns API Endpoint
 * Manages discovery and tracking of new viral patterns
 * Shows framework evolution from 40 to hundreds in real-time
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { createClient } from '@supabase/supabase-js';

function getDb(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // 'emerging', 'validated', 'retired', 'all'
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'discoveredAt'; // 'discoveredAt', 'viralRate', 'confidence'

    // Build query
    let query = getDb()
      .from('emerging_patterns')
      .select('*');

    // Apply filters
    if (status !== 'all') {
      if (status === 'emerging') query = query.eq('validated', false);
      if (status === 'validated') query = query.eq('validated', true);
      if (status === 'retired') query = query.eq('retired', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Apply sorting
    const sortField = {
      'discoveredAt': 'discovered_at',
      'viralRate': 'avg_viral_rate',
      'confidence': 'confidence_score'
    }[sortBy] || 'discovered_at';

    query = query.order(sortField, { ascending: false }).limit(limit);

    const { data: patterns, error } = await query;

    if (error) {
      throw error;
    }

    // Get pattern statistics
    const { data: stats } = await getDb()
      .from('emerging_patterns')
      .select('validated, category, avg_viral_rate, confidence_score');

    const statistics = {
      total: stats?.length || 0,
      emerging: stats?.filter(s => !s.validated).length || 0,
      validated: stats?.filter(s => s.validated).length || 0,
      avgViralRate: stats ? stats.reduce((sum, s) => sum + (s.avg_viral_rate || 0), 0) / stats.length : 0,
      avgConfidence: stats ? stats.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / stats.length : 0,
      categoryBreakdown: this.getCategoryBreakdown(stats || [])
    };

    // Format patterns for response
    const formattedPatterns = patterns?.map(pattern => ({
      id: pattern.id,
      name: pattern.name,
      description: pattern.description,
      category: pattern.category,
      status: pattern.validated ? 'validated' : 'emerging',
      discoveredAt: pattern.discovered_at,
      confidenceScore: pattern.confidence_score,
      occurrences: pattern.occurrences,
      avgViralRate: pattern.avg_viral_rate,
      tier: pattern.tier,
      platforms: pattern.platforms,
      keyIndicators: pattern.key_indicators,
      examples: pattern.examples ? JSON.parse(pattern.examples) : [],
      performanceMetrics: pattern.performance_metrics ? JSON.parse(pattern.performance_metrics) : null
    })) || [];

    return NextResponse.json({
      success: true,
      patterns: formattedPatterns,
      statistics,
      
      // Framework evolution evidence
      evolution: {
        patternsDiscovered: statistics.total,
        validationRate: statistics.total > 0 ? (statistics.validated / statistics.total) * 100 : 0,
        emergingCount: statistics.emerging,
        qualityScore: statistics.avgConfidence * 100,
        
        // Growth demonstration
        growthEvidence: {
          baseFrameworks: 40,
          emergingPatterns: statistics.emerging,
          validatedAdditions: statistics.validated,
          projectedTotal: 40 + statistics.validated,
          targetAchievement: ((40 + statistics.validated) / 200) * 100 // Progress to hundreds
        }
      },
      
      // Discovery insights
      discovery: {
        topCategories: Object.entries(this.getCategoryBreakdown(stats || []))
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count })),
        
        recentDiscoveries: formattedPatterns
          .filter(p => p.status === 'emerging')
          .slice(0, 5)
          .map(p => ({
            name: p.name,
            category: p.category,
            viralRate: p.avgViralRate,
            confidence: p.confidenceScore
          })),
        
        highPerformers: formattedPatterns
          .filter(p => p.avgViralRate > 0.6)
          .slice(0, 5)
          .map(p => ({
            name: p.name,
            viralRate: p.avgViralRate,
            occurrences: p.occurrences,
            tier: p.tier
          }))
      },
      
      // System capabilities demonstration
      capabilities: {
        automatedDiscovery: statistics.total > 0,
        crossPlatformAnalysis: this.hasCrossPlatformPatterns(formattedPatterns),
        qualityValidation: statistics.validated > 0,
        performanceTracking: formattedPatterns.some(p => p.performanceMetrics),
        continuousEvolution: this.hasRecentActivity(formattedPatterns)
      },
      
      metadata: {
        timestamp: new Date().toISOString(),
        totalPatterns: statistics.total,
        filters: { status, category, sortBy },
        systemStatus: statistics.emerging > 0 ? 'DISCOVERING' : 'MONITORING'
      }
    });

  } catch (error) {
    console.error('Get emerging patterns error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve emerging patterns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'validate_pattern') {
      return await this.validatePattern(body.patternId);
    }

    if (action === 'retire_pattern') {
      return await this.retirePattern(body.patternId, body.reason);
    }

    if (action === 'force_discovery') {
      return await this.forceDiscovery(body.config);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Pattern management error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Pattern management failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper methods (would be moved to a service class in production)
function getCategoryBreakdown(stats: any[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  for (const stat of stats) {
    const category = stat.category || 'unknown';
    breakdown[category] = (breakdown[category] || 0) + 1;
  }
  
  return breakdown;
}

function hasCrossPlatformPatterns(patterns: any[]): boolean {
  return patterns.some(pattern => 
    Array.isArray(pattern.platforms) && pattern.platforms.length > 1
  );
}

function hasRecentActivity(patterns: any[]): boolean {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return patterns.some(pattern => 
    new Date(pattern.discoveredAt) > oneDayAgo
  );
}

async function validatePattern(patternId: string) {
  try {
    // Update pattern status to validated
    const { error } = await getDb()
      .from('emerging_patterns')
      .update({ 
        validated: true,
        validated_at: new Date().toISOString()
      })
      .eq('id', patternId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      action: 'pattern_validated',
      patternId,
      message: 'Pattern successfully validated and added to framework library'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Pattern validation failed', details: error },
      { status: 500 }
    );
  }
}

async function retirePattern(patternId: string, reason: string) {
  try {
    // Update pattern status to retired
    const { error } = await getDb()
      .from('emerging_patterns')
      .update({ 
        retired: true,
        retirement_reason: reason,
        retired_at: new Date().toISOString()
      })
      .eq('id', patternId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      action: 'pattern_retired',
      patternId,
      reason,
      message: 'Pattern successfully retired from active tracking'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Pattern retirement failed', details: error },
      { status: 500 }
    );
  }
}

async function forceDiscovery(config: any) {
  try {
    // Trigger immediate pattern discovery
    const { FrameworkEvolutionSystem } = await import('@/lib/services/viral-prediction/framework-evolution-system');
    const evolutionSystem = new FrameworkEvolutionSystem(config);
    
    // Run discovery only (not full evolution cycle)
    const results = await evolutionSystem.runEvolutionCycle();

    return NextResponse.json({
      success: true,
      action: 'discovery_forced',
      results: {
        newPatterns: results.newPatternsDiscovered,
        totalFrameworks: results.totalFrameworks
      },
      message: `Discovered ${results.newPatternsDiscovered} new patterns`
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Forced discovery failed', details: error },
      { status: 500 }
    );
  }
}