import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface Pattern {
  pattern: string;
  dps: number;
  change: string;
  velocity: 'Fast' | 'Accelerating' | 'Explosive' | 'Steady' | 'Declining';
  niche: string;
  confidence: number;
  count: number;
  source?: string;
  viral_patterns?: string[];
  top_video_id?: string;
  id?: string; // Genome ID for script generation
}

// Calculate velocity label based on percentage change
function getVelocity(changePercent: number): Pattern['velocity'] {
  if (changePercent >= 50) return 'Explosive';
  if (changePercent >= 25) return 'Accelerating';
  if (changePercent >= 10) return 'Fast';
  if (changePercent >= 0) return 'Steady';
  return 'Declining';
}

// Calculate standard deviation
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

export async function GET(req: NextRequest) {
  try {
    const patterns: Pattern[] = [];
    let source = 'no_data';
    let totalAnalyzed = 0;

    // === PRIMARY METHOD: Get patterns from viral_genomes table ===
    const { data: genomes, error: genomesError } = await supabase
      .from('viral_genomes')
      .select('id, niche, pattern_type, pattern_dna, success_rate, dps_average, example_videos, times_used')
      .order('dps_average', { ascending: false })
      .limit(100);

    if (!genomesError && genomes && genomes.length > 0) {
      console.log(`[Bloomberg Patterns] Found ${genomes.length} viral genomes`);
      source = 'viral_genomes';
      totalAnalyzed = genomes.length;

      // Group genomes by niche + story_structure to create distinct patterns
      const patternGroups = new Map<string, {
        niche: string;
        topics: string[];
        dpsScores: number[];
        hookStrengths: number[];
        viralPatterns: string[];
        count: number;
        topVideoId: string;
        topGenomeId: string; // NEW: Track best genome ID for script generation
        topDps: number;
        bestTopic: string;
        storyStructure: string;
      }>();

      genomes.forEach(genome => {
        const dna = genome.pattern_dna || {};
        const storyStructure = dna.story_structure || genome.pattern_type?.split('_')[0] || 'general';
        const niche = genome.niche || 'general';
        const key = `${niche}-${storyStructure}`;
        
        if (!patternGroups.has(key)) {
          patternGroups.set(key, {
            niche,
            storyStructure,
            topics: [],
            dpsScores: [],
            hookStrengths: [],
            viralPatterns: [],
            count: 0,
            topVideoId: dna.source_video_id || '',
            topGenomeId: genome.id, // Track genome ID
            topDps: 0,
            bestTopic: ''
          });
        }

        const group = patternGroups.get(key)!;
        const dps = genome.dps_average || 0;
        
        group.dpsScores.push(dps);
        group.count++;
        
        if (dna.topic) group.topics.push(dna.topic);
        if (dna.nine_attributes?.hook_strength) {
          group.hookStrengths.push(dna.nine_attributes.hook_strength);
        }
        if (dna.viral_patterns) {
          group.viralPatterns.push(...dna.viral_patterns);
        }
        
        // Track top performing genome
        if (dps > group.topDps) {
          group.topDps = dps;
          group.topVideoId = dna.source_video_id || '';
          group.topGenomeId = genome.id; // Track the best genome ID
          group.bestTopic = dna.topic || '';
        }
      });

      // Convert groups to patterns
      const sortedGroups = Array.from(patternGroups.entries())
        .map(([key, group]) => {
          const avgDps = group.dpsScores.length > 0 
            ? group.dpsScores.reduce((a, b) => a + b, 0) / group.dpsScores.length 
            : 0;
          const avgHook = group.hookStrengths.length > 0
            ? group.hookStrengths.reduce((a, b) => a + b, 0) / group.hookStrengths.length
            : 5;
          
          // Calculate confidence based on consistency and count
          const dpsStdDev = standardDeviation(group.dpsScores);
          const consistencyFactor = Math.max(0, 1 - (dpsStdDev / 20)); // Lower std dev = higher confidence
          const countFactor = Math.min(group.count / 10, 1);
          const confidence = 0.5 + (consistencyFactor * 0.3) + (countFactor * 0.2);
          
          // Create pattern name from best topic or structure
          let patternName = group.bestTopic;
          if (!patternName || patternName.length > 60) {
            // Use story structure + niche as fallback
            const structureNames: Record<string, string> = {
              'list': 'Listicle Format',
              'tutorial': 'How-To Tutorial',
              'story': 'Personal Story',
              'comparison': 'Comparison Hook',
              'myth-bust': 'Myth Buster',
              'transformation': 'Transformation Arc',
              'challenge': 'Challenge Content',
              'breakdown': 'Breakdown Analysis',
              'case-study': 'Case Study',
              'other': 'Trending Topic',
              'general': 'Viral Pattern'
            };
            const structureName = structureNames[group.storyStructure] || 'Trending Topic';
            const nicheName = group.niche.charAt(0).toUpperCase() + group.niche.slice(1).replace(/-/g, ' ');
            patternName = `${nicheName} ${structureName}`;
          }
          
          // Truncate long topics
          if (patternName.length > 50) {
            patternName = patternName.substring(0, 47) + '...';
          }
          
          // Get unique viral patterns
          const uniqueViralPatterns = [...new Set(group.viralPatterns)].slice(0, 5);
          
          // Calculate change (use DPS relative to baseline of 50)
          const changePercent = Math.round(((avgDps - 50) / 50) * 100);
          
          return {
            pattern: patternName,
            dps: Math.round(avgDps * 10) / 10,
            change: `+${Math.max(0, changePercent)}%`,
            velocity: getVelocity(changePercent),
            niche: group.niche.charAt(0).toUpperCase() + group.niche.slice(1).replace(/-/g, ' '),
            confidence: Math.round(confidence * 100) / 100,
            count: group.count,
            viral_patterns: uniqueViralPatterns,
            top_video_id: group.topVideoId,
            id: group.topGenomeId, // Include genome ID for script generation
            avgDps
          };
        })
        .sort((a, b) => b.avgDps - a.avgDps)
        .slice(0, 10);

      // Add to patterns array
      sortedGroups.forEach(g => {
        patterns.push({
          pattern: g.pattern,
          dps: g.dps,
          change: g.change,
          velocity: g.velocity,
          niche: g.niche,
          confidence: g.confidence,
          count: g.count,
          source: 'viral_genomes',
          viral_patterns: g.viral_patterns,
          top_video_id: g.top_video_id,
          id: g.id // Include genome ID for script generation
        });
      });
    }

    // === FALLBACK: If no genomes, extract from scraped_videos ===
    if (patterns.length === 0) {
      console.log('[Bloomberg Patterns] No genomes found, falling back to scraped_videos');
      
      const { data: topVideos, error: videosError } = await supabase
        .from('scraped_videos')
        .select('video_id, title, dps_score, views_count, description')
        .not('title', 'is', null)
        .not('dps_score', 'is', null)
        .gte('dps_score', 50)
        .order('dps_score', { ascending: false })
        .limit(50);

      if (!videosError && topVideos && topVideos.length > 0) {
        source = 'scraped_videos_fallback';
        totalAnalyzed = topVideos.length;

        // Group by detected patterns
        const patternCounts = new Map<string, { dps: number[], niche: string, titles: string[] }>();
        
        const VIRAL_PATTERNS = [
          { regex: /how to/i, name: 'How-To Tutorial' },
          { regex: /money|save|invest|rich|wealth|income/i, name: 'Money & Wealth Tips' },
          { regex: /secret|hack|trick|hidden/i, name: 'Secret Hack Reveal' },
          { regex: /mistake|wrong|stop|never/i, name: 'Avoid This Mistake' },
          { regex: /\d+\s*(ways|tips|things|reasons|steps)/i, name: 'Numbered List' },
          { regex: /truth|honest|real|actually/i, name: 'Truth Bomb' },
          { regex: /question|\?/i, name: 'Question Hook' },
        ];

        topVideos.forEach(video => {
          if (!video.title) return;
          
          for (const pattern of VIRAL_PATTERNS) {
            if (pattern.regex.test(video.title)) {
              if (!patternCounts.has(pattern.name)) {
                patternCounts.set(pattern.name, { dps: [], niche: 'General', titles: [] });
              }
              const stats = patternCounts.get(pattern.name)!;
              stats.dps.push(video.dps_score);
              if (stats.titles.length < 3) stats.titles.push(video.title);
              break;
            }
          }
        });

        patternCounts.forEach((stats, patternName) => {
          if (stats.dps.length >= 1) {
            const avgDps = stats.dps.reduce((a, b) => a + b, 0) / stats.dps.length;
            const changePercent = Math.round(((avgDps - 50) / 50) * 100);
            
            patterns.push({
              pattern: patternName,
              dps: Math.round(avgDps * 10) / 10,
              change: `+${Math.max(0, changePercent)}%`,
              velocity: getVelocity(changePercent),
              niche: stats.niche,
              confidence: Math.min(0.9, 0.6 + (stats.dps.length / 20)),
              count: stats.dps.length,
              source: 'scraped_videos'
            });
          }
        });

        patterns.sort((a, b) => b.dps - a.dps);
      }
    }

    // === RETURN RESULTS ===
    if (patterns.length === 0) {
      return NextResponse.json({
        success: true,
        patterns: [],
        metadata: {
          totalAnalyzed: 0,
          source: 'no_data',
          message: 'No viral patterns found. Run genome extraction first via /api/admin/extract-genomes',
          dateRange: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      patterns: patterns.slice(0, 5),
      metadata: {
        totalAnalyzed,
        totalPatternsFound: patterns.length,
        source,
        dateRange: {
          from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching trending patterns:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
