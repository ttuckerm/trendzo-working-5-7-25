/**
 * Viral Genomes Stats API
 * 
 * GET /api/admin/viral-genomes/stats
 * 
 * Returns statistics about extracted viral genomes including:
 * - Total count
 * - Distribution by niche
 * - Distribution by hook type
 * - Distribution by story structure
 * - Average DPS scores
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface GenomeStats {
  total: number;
  byNiche: Record<string, number>;
  byHookType: Record<string, number>;
  byStoryStructure: Record<string, number>;
  byVisualFormat: Record<string, number>;
  avgDps: number;
  avgAttributeScores: {
    tamResonance: number;
    sharability: number;
    hookStrength: number;
    formatInnovation: number;
    valueDensity: number;
    pacingRhythm: number;
    curiosityGaps: number;
    emotionalJourney: number;
    clearPayoff: number;
  };
  topViralPatterns: Array<{ pattern: string; count: number }>;
}

export async function GET() {
  try {
    // Get all viral genomes
    const { data, error } = await supabase
      .from('viral_genomes')
      .select('niche, pattern_type, pattern_dna, success_rate, dps_average');
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Initialize stats
    const stats: GenomeStats = {
      total: data?.length || 0,
      byNiche: {},
      byHookType: {},
      byStoryStructure: {},
      byVisualFormat: {},
      avgDps: 0,
      avgAttributeScores: {
        tamResonance: 0,
        sharability: 0,
        hookStrength: 0,
        formatInnovation: 0,
        valueDensity: 0,
        pacingRhythm: 0,
        curiosityGaps: 0,
        emotionalJourney: 0,
        clearPayoff: 0
      },
      topViralPatterns: []
    };
    
    if (!data || data.length === 0) {
      return NextResponse.json(stats);
    }
    
    // Aggregate data
    let totalDps = 0;
    const attributeTotals = {
      tamResonance: 0,
      sharability: 0,
      hookStrength: 0,
      formatInnovation: 0,
      valueDensity: 0,
      pacingRhythm: 0,
      curiosityGaps: 0,
      emotionalJourney: 0,
      clearPayoff: 0
    };
    let attributeCount = 0;
    const patternCounts: Record<string, number> = {};
    
    data.forEach(genome => {
      // By niche
      const niche = genome.niche || 'unknown';
      stats.byNiche[niche] = (stats.byNiche[niche] || 0) + 1;
      
      // Extract pattern_dna fields (handles both old and new schema)
      const patternDna = genome.pattern_dna || {};
      
      // By hook type (from pattern_dna or inferred from pattern_type)
      const hookType = patternDna.hook?.type || 
                       patternDna.hook_spoken?.substring(0, 20) || 
                       'unknown';
      stats.byHookType[hookType] = (stats.byHookType[hookType] || 0) + 1;
      
      // By story structure
      const storyStructure = patternDna.story_structure || 
                             genome.pattern_type || 
                             'unknown';
      stats.byStoryStructure[storyStructure] = (stats.byStoryStructure[storyStructure] || 0) + 1;
      
      // By visual format
      const visualFormat = patternDna.visual_format || 'unknown';
      stats.byVisualFormat[visualFormat] = (stats.byVisualFormat[visualFormat] || 0) + 1;
      
      // Total DPS
      totalDps += genome.dps_average || 0;
      
      // Nine attributes (from pattern_dna.nine_attributes)
      const nineAttrs = patternDna.nine_attributes || {};
      if (Object.keys(nineAttrs).length > 0) {
        attributeTotals.tamResonance += nineAttrs.tam_resonance || 0;
        attributeTotals.sharability += nineAttrs.sharability || 0;
        attributeTotals.hookStrength += nineAttrs.hook_strength || 0;
        attributeTotals.formatInnovation += nineAttrs.format_innovation || 0;
        attributeTotals.valueDensity += nineAttrs.value_density || 0;
        attributeTotals.pacingRhythm += nineAttrs.pacing_rhythm || 0;
        attributeTotals.curiosityGaps += nineAttrs.curiosity_gaps || 0;
        attributeTotals.emotionalJourney += nineAttrs.emotional_journey || 0;
        attributeTotals.clearPayoff += nineAttrs.clear_payoff || 0;
        attributeCount++;
      }
      
      // Count viral patterns
      const viralPatterns = patternDna.viral_patterns || [];
      viralPatterns.forEach((pattern: string) => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
    });
    
    // Calculate averages
    stats.avgDps = data.length > 0 ? Math.round(totalDps / data.length * 10) / 10 : 0;
    
    if (attributeCount > 0) {
      stats.avgAttributeScores = {
        tamResonance: Math.round(attributeTotals.tamResonance / attributeCount * 10) / 10,
        sharability: Math.round(attributeTotals.sharability / attributeCount * 10) / 10,
        hookStrength: Math.round(attributeTotals.hookStrength / attributeCount * 10) / 10,
        formatInnovation: Math.round(attributeTotals.formatInnovation / attributeCount * 10) / 10,
        valueDensity: Math.round(attributeTotals.valueDensity / attributeCount * 10) / 10,
        pacingRhythm: Math.round(attributeTotals.pacingRhythm / attributeCount * 10) / 10,
        curiosityGaps: Math.round(attributeTotals.curiosityGaps / attributeCount * 10) / 10,
        emotionalJourney: Math.round(attributeTotals.emotionalJourney / attributeCount * 10) / 10,
        clearPayoff: Math.round(attributeTotals.clearPayoff / attributeCount * 10) / 10
      };
    }
    
    // Top viral patterns (sorted by count)
    stats.topViralPatterns = Object.entries(patternCounts)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return NextResponse.json(stats);
    
  } catch (error: unknown) {
    console.error('Viral genomes stats error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



