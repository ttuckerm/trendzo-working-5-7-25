/**
 * Pattern Extraction API for Bloomberg Terminal
 * 
 * POST /api/bloomberg/extract-patterns
 * 
 * Analyzes scraped videos to extract viral patterns and populate
 * the pattern_insights table for real-time pattern detection.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Pattern detection rules
const PATTERN_DETECTORS = {
  hook_patterns: [
    { name: 'Question Hook', pattern: /^[^.!]*\?/i, description: 'Opens with a question to create curiosity' },
    { name: 'Provocative Statement', pattern: /don't|stop|never|wrong|mistake|lie|truth|actually|secret/i, description: 'Uses provocative language to grab attention' },
    { name: 'Direct Address', pattern: /^(you|your|here's|this is|watch|listen)/i, description: 'Directly addresses the viewer in first 3 words' },
    { name: 'Number Hook', pattern: /^\d+|top \d+|\d+ (ways|tips|things|reasons)/i, description: 'Uses numbers to promise specific value' },
    { name: 'Emotional Hook', pattern: /💰|🔥|⚠️|🚨|😱|🤯|❤️|✨/i, description: 'Uses emojis for emotional impact' },
  ],
  content_patterns: [
    { name: 'How-To Tutorial', pattern: /how to|tutorial|step.by.step|guide|learn/i, description: 'Educational content with clear instructions' },
    { name: 'Story Format', pattern: /when i|my story|i was|happened|journey/i, description: 'Personal narrative driving engagement' },
    { name: 'Listicle Format', pattern: /\d+ (ways|tips|things|reasons|steps|hacks)/i, description: 'Easy-to-consume list format' },
    { name: 'Before/After', pattern: /before|after|transformation|changed|from.+to/i, description: 'Shows transformation for visual impact' },
    { name: 'Myth Busting', pattern: /myth|actually|truth|lie|wrong|misconception/i, description: 'Challenges common beliefs' },
  ],
  topic_patterns: [
    { name: 'Money/Finance', pattern: /money|save|invest|rich|wealth|income|salary|budget|debt/i, description: 'Financial advice and tips' },
    { name: 'Career/Business', pattern: /job|career|work|business|entrepreneur|side hustle/i, description: 'Professional development content' },
    { name: 'Lifestyle', pattern: /life|routine|morning|habit|productive|success/i, description: 'Lifestyle improvement content' },
    { name: 'Relationships', pattern: /relationship|dating|love|partner|marriage|friend/i, description: 'Relationship advice' },
    { name: 'Self-Improvement', pattern: /mindset|growth|learn|improve|better|confidence/i, description: 'Personal development' },
  ]
};

interface PatternResult {
  pattern_type: string;
  pattern_name: string;
  pattern_description: string;
  viral_occurrence: number;
  poor_occurrence: number;
  viral_sample_size: number;
  poor_sample_size: number;
  total_videos_analyzed: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get the niche filter if provided
    const body = await request.json().catch(() => ({}));
    const nicheFilter = body.niche;
    
    // Fetch viral videos (DPS >= 60)
    let viralQuery = supabase
      .from('scraped_videos')
      .select('video_id, title, dps_score, views_count')
      .not('title', 'is', null)
      .gte('dps_score', 60);
    
    // Fetch poor performing videos (DPS <= 40)
    let poorQuery = supabase
      .from('scraped_videos')
      .select('video_id, title, dps_score, views_count')
      .not('title', 'is', null)
      .lte('dps_score', 40);
    
    const [viralResult, poorResult] = await Promise.all([
      viralQuery.limit(300),
      poorQuery.limit(300)
    ]);
    
    if (viralResult.error) throw viralResult.error;
    if (poorResult.error) throw poorResult.error;
    
    const viralVideos = viralResult.data || [];
    const poorVideos = poorResult.data || [];
    
    // Analyze patterns
    const patternResults: PatternResult[] = [];
    
    for (const [category, patterns] of Object.entries(PATTERN_DETECTORS)) {
      for (const pattern of patterns) {
        // Count occurrences in viral videos
        const viralMatches = viralVideos.filter(v => 
          v.title && pattern.pattern.test(v.title)
        );
        
        // Count occurrences in poor videos
        const poorMatches = poorVideos.filter(v => 
          v.title && pattern.pattern.test(v.title)
        );
        
        const viralOccurrence = viralVideos.length > 0 
          ? viralMatches.length / viralVideos.length 
          : 0;
        const poorOccurrence = poorVideos.length > 0 
          ? poorMatches.length / poorVideos.length 
          : 0;
        
        // Only include patterns with meaningful data
        if (viralMatches.length >= 2 || poorMatches.length >= 2) {
          patternResults.push({
            pattern_type: category.replace('_patterns', ''),
            pattern_name: pattern.name,
            pattern_description: pattern.description,
            viral_occurrence: viralOccurrence,
            poor_occurrence: poorOccurrence,
            viral_sample_size: viralMatches.length,
            poor_sample_size: poorMatches.length,
            total_videos_analyzed: viralVideos.length + poorVideos.length
          });
        }
      }
    }
    
    // Sort by lift factor (viral vs poor ratio)
    patternResults.sort((a, b) => {
      const liftA = a.poor_occurrence > 0 ? a.viral_occurrence / a.poor_occurrence : a.viral_occurrence * 10;
      const liftB = b.poor_occurrence > 0 ? b.viral_occurrence / b.poor_occurrence : b.viral_occurrence * 10;
      return liftB - liftA;
    });
    
    // Insert/update patterns in pattern_insights
    const insertedPatterns = [];
    for (const pattern of patternResults) {
      const { data, error } = await supabase
        .from('pattern_insights')
        .upsert({
          niche: nicheFilter || 'general',
          pattern_type: pattern.pattern_type,
          pattern_name: pattern.pattern_name,
          pattern_description: pattern.pattern_description,
          viral_occurrence: pattern.viral_occurrence,
          poor_occurrence: pattern.poor_occurrence,
          viral_sample_size: pattern.viral_sample_size,
          poor_sample_size: pattern.poor_sample_size,
          total_videos_analyzed: pattern.total_videos_analyzed,
          statistical_significance: calculateSignificance(
            pattern.viral_sample_size, 
            pattern.poor_sample_size,
            pattern.viral_occurrence,
            pattern.poor_occurrence
          ),
          confidence_level: getConfidenceLevel(pattern.viral_sample_size + pattern.poor_sample_size),
          recommendation: generateRecommendation(pattern),
          priority: calculatePriority(pattern)
        }, {
          onConflict: 'pattern_name,niche'
        })
        .select()
        .single();
      
      if (!error && data) {
        insertedPatterns.push(data);
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: {
        patternsExtracted: patternResults.length,
        patternsInserted: insertedPatterns.length,
        viralVideosAnalyzed: viralVideos.length,
        poorVideosAnalyzed: poorVideos.length,
        topPatterns: patternResults.slice(0, 10).map(p => ({
          name: p.pattern_name,
          type: p.pattern_type,
          liftFactor: p.poor_occurrence > 0 
            ? (p.viral_occurrence / p.poor_occurrence).toFixed(2) 
            : 'N/A',
          viralRate: `${(p.viral_occurrence * 100).toFixed(1)}%`,
          sampleSize: p.viral_sample_size + p.poor_sample_size
        }))
      },
      meta: {
        processingTimeMs: processingTime,
        niche: nicheFilter || 'all'
      }
    });
    
  } catch (error: any) {
    console.error('[Pattern Extraction] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateSignificance(viralCount: number, poorCount: number, viralRate: number, poorRate: number): number {
  // Simple significance calculation based on sample size and difference
  const totalSample = viralCount + poorCount;
  const rateDiff = Math.abs(viralRate - poorRate);
  
  if (totalSample < 10) return 0.3;
  if (totalSample < 30) return 0.5 + (rateDiff * 0.3);
  if (totalSample < 100) return 0.7 + (rateDiff * 0.2);
  return Math.min(0.99, 0.85 + (rateDiff * 0.15));
}

function getConfidenceLevel(sampleSize: number): string {
  if (sampleSize >= 100) return 'high';
  if (sampleSize >= 30) return 'medium';
  return 'low';
}

function generateRecommendation(pattern: PatternResult): string {
  const lift = pattern.poor_occurrence > 0 
    ? pattern.viral_occurrence / pattern.poor_occurrence 
    : pattern.viral_occurrence * 10;
  
  if (lift >= 2) {
    return `STRONGLY RECOMMENDED: This pattern appears ${lift.toFixed(1)}x more in viral content. Prioritize using "${pattern.pattern_name}" in your content strategy.`;
  } else if (lift >= 1.5) {
    return `RECOMMENDED: This pattern shows ${((lift - 1) * 100).toFixed(0)}% higher occurrence in viral content. Consider incorporating "${pattern.pattern_name}".`;
  } else if (lift >= 1) {
    return `NEUTRAL: "${pattern.pattern_name}" appears similarly in both viral and non-viral content. Other factors may be more important.`;
  } else {
    return `AVOID: "${pattern.pattern_name}" appears more frequently in low-performing content. Consider alternative approaches.`;
  }
}

function calculatePriority(pattern: PatternResult): number {
  const lift = pattern.poor_occurrence > 0 
    ? pattern.viral_occurrence / pattern.poor_occurrence 
    : pattern.viral_occurrence * 10;
  const sampleWeight = Math.min(1, (pattern.viral_sample_size + pattern.poor_sample_size) / 100);
  
  // Priority 1-10 based on lift and sample size
  return Math.round(Math.min(10, Math.max(1, lift * 2 * sampleWeight + (pattern.viral_occurrence * 5))));
}

/**
 * GET - Return current pattern insights
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    let query = supabase
      .from('pattern_insights')
      .select('*')
      .order('priority', { ascending: false })
      .limit(limit);
    
    if (niche) {
      query = query.eq('niche', niche);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      patterns: data || [],
      count: data?.length || 0
    });
    
  } catch (error: any) {
    console.error('[Pattern Insights] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}









