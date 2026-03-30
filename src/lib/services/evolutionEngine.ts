import { createClient } from '@supabase/supabase-js';
import * as dayjs from 'dayjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface Template {
  template_id: string;
  videos: string[]; // Array of video_ids
  success_rate: number;
  updated_at: string;
  niche: string;
  status?: string;
  trend_pct?: number;
}

export interface EvolutionRun {
  run_id: string;
  hot_count: number;
  cooling_count: number;
  new_count: number;
  stable_count: number;
  run_ts: string;
}

export interface TemplateAnalysis {
  template_id: string;
  current_rate: number;
  previous_rate: number;
  trend_pct: number;
  viral_count_current: number;
  viral_count_previous: number;
  template_age_days: number;
  status: 'HOT' | 'COOLING' | 'NEW' | 'STABLE';
}

// Algorithm parameters
const HOT_TREND_THRESHOLD = 0.15; // +15%
const COOLING_TREND_THRESHOLD = -0.15; // -15%
const NEW_TEMPLATE_AGE_THRESHOLD = 3; // days
const NEW_TEMPLATE_MIN_VIRALS = 10;
const HOT_MIN_VIRALS = 20;
const COOLING_MIN_PREVIOUS_RATE = 0.05;
const MIN_RATE_DENOMINATOR = 0.01;
const PERFORMANCE_TARGET_MS = 10000; // 10 seconds

/**
 * Get video creation dates from video_features table
 */
async function getVideoCreationDates(videoIds: string[]): Promise<Map<string, string>> {
  if (videoIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('video_features')
    .select('video_id, upload_date')
    .in('video_id', videoIds);

  if (error) {
    console.warn('Could not fetch video creation dates:', error.message);
    return new Map();
  }

  const dateMap = new Map<string, string>();
  data?.forEach(video => {
    if (video.upload_date) {
      dateMap.set(video.video_id, video.upload_date);
    }
  });

  return dateMap;
}

/**
 * Get negative pool videos for niche comparison
 */
async function getNegativePoolVideos(niches: string[], startDate: string, endDate: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('negative_pool')
    .select('video_id, follower_bucket, created_at')
    .gte('created_at', startDate)
    .lt('created_at', endDate);

  if (error) {
    console.warn('Could not fetch negative pool videos:', error.message);
    return new Map();
  }

  // Get video features to determine niches
  const videoIds = data?.map(v => v.video_id) || [];
  if (videoIds.length === 0) return new Map();

  const { data: videoFeatures, error: featuresError } = await supabase
    .from('video_features')
    .select('video_id, caption')
    .in('video_id', videoIds);

  if (featuresError) {
    console.warn('Could not fetch video features for negative pool:', featuresError.message);
    return new Map();
  }

  // Simple niche classification based on caption keywords
  const nicheCountMap = new Map<string, number>();
  niches.forEach(niche => nicheCountMap.set(niche, 0));

  videoFeatures?.forEach(video => {
    const caption = (video.caption || '').toLowerCase();
    for (const niche of niches) {
      if (caption.includes(niche.toLowerCase())) {
        nicheCountMap.set(niche, (nicheCountMap.get(niche) || 0) + 1);
        break; // Assign to first matching niche
      }
    }
  });

  return nicheCountMap;
}

/**
 * Calculate template performance rate for a time window
 */
async function calculateTemplateRate(
  template: Template,
  startDate: string,
  endDate: string,
  negativePoolCounts: Map<string, number>
): Promise<{ rate: number; viral_count: number }> {
  // Get creation dates for template videos
  const videoDateMap = await getVideoCreationDates(template.videos);
  
  // Count videos in time window
  let viral_count = 0;
  for (const videoId of template.videos) {
    const creationDate = videoDateMap.get(videoId);
    if (creationDate) {
      const videoDate = dayjs(creationDate);
      if (videoDate.isAfter(startDate) && videoDate.isBefore(endDate)) {
        viral_count++;
      }
    }
  }

  // Get negative pool count for same niche
  const negativeCount = negativePoolCounts.get(template.niche) || 0;
  const denominator = viral_count + negativeCount;
  
  const rate = denominator > 0 ? viral_count / denominator : 0;
  
  return { rate, viral_count };
}

/**
 * Advanced temporal pattern analysis using multiple time windows and pattern detection
 */
interface TemporalPattern {
  pattern_type: 'explosive' | 'steady_growth' | 'cyclical' | 'decay' | 'stable' | 'volatile';
  confidence: number;
  momentum: number;
  acceleration: number;
  volatility: number;
  seasonal_factor: number;
}

async function analyzeTemporalPatterns(template: Template): Promise<TemporalPattern> {
  const now = dayjs();
  
  // Define multiple time windows for pattern analysis
  const windows = [
    { days: 1, label: '24h' },
    { days: 3, label: '3d' },
    { days: 7, label: '7d' },
    { days: 14, label: '14d' },
    { days: 21, label: '21d' },
    { days: 30, label: '30d' }
  ];
  
  // Calculate rates for each time window
  const windowRates: { period: string; rate: number; viral_count: number; timestamp: string }[] = [];
  
  for (const window of windows) {
    const startDate = now.subtract(window.days, 'day').toISOString();
    const endDate = now.toISOString();
    
    const negativeCount = await getNegativePoolVideos([template.niche], startDate, endDate);
    const windowData = await calculateTemplateRate(template, startDate, endDate, negativeCount);
    
    windowRates.push({
      period: window.label,
      rate: windowData.rate,
      viral_count: windowData.viral_count,
      timestamp: startDate
    });
  }
  
  // Calculate derivatives (rate of change)
  const derivatives: number[] = [];
  for (let i = 1; i < windowRates.length; i++) {
    const current = windowRates[i];
    const previous = windowRates[i - 1];
    const derivative = current.rate - previous.rate;
    derivatives.push(derivative);
  }
  
  // Calculate second derivatives (acceleration)
  const accelerations: number[] = [];
  for (let i = 1; i < derivatives.length; i++) {
    const acceleration = derivatives[i] - derivatives[i - 1];
    accelerations.push(acceleration);
  }
  
  // Calculate momentum (weighted recent performance)
  const weights = [0.4, 0.3, 0.2, 0.1]; // More weight on recent windows
  let momentum = 0;
  for (let i = 0; i < Math.min(derivatives.length, weights.length); i++) {
    momentum += derivatives[i] * weights[i];
  }
  
  // Calculate volatility (standard deviation of rates)
  const rates = windowRates.map(w => w.rate);
  const meanRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - meanRate, 2), 0) / rates.length;
  const volatility = Math.sqrt(variance);
  
  // Calculate acceleration (average of second derivatives)
  const avgAcceleration = accelerations.length > 0 
    ? accelerations.reduce((sum, acc) => sum + acc, 0) / accelerations.length 
    : 0;
  
  // Detect seasonal patterns (weekly cycles)
  const seasonalFactor = detectSeasonalPattern(windowRates);
  
  // Pattern classification using advanced rules
  let pattern_type: TemporalPattern['pattern_type'] = 'stable';
  let confidence = 0;
  
  // Explosive pattern: high positive acceleration + high momentum
  if (avgAcceleration > 0.1 && momentum > 0.2 && volatility < 0.3) {
    pattern_type = 'explosive';
    confidence = Math.min(0.9, (avgAcceleration + momentum) / 0.4);
  }
  // Steady growth: consistent positive momentum, low volatility
  else if (momentum > 0.05 && momentum < 0.2 && volatility < 0.2) {
    pattern_type = 'steady_growth';
    confidence = Math.min(0.8, momentum / 0.15);
  }
  // Decay pattern: negative momentum + negative acceleration
  else if (momentum < -0.05 && avgAcceleration < -0.05) {
    pattern_type = 'decay';
    confidence = Math.min(0.85, Math.abs(momentum + avgAcceleration) / 0.15);
  }
  // Cyclical pattern: high seasonal factor + moderate volatility
  else if (seasonalFactor > 0.3 && volatility > 0.1 && volatility < 0.5) {
    pattern_type = 'cyclical';
    confidence = Math.min(0.7, seasonalFactor);
  }
  // Volatile pattern: high volatility + inconsistent momentum
  else if (volatility > 0.3) {
    pattern_type = 'volatile';
    confidence = Math.min(0.75, volatility / 0.5);
  }
  // Stable pattern: low volatility + low momentum
  else {
    pattern_type = 'stable';
    confidence = Math.max(0.5, 1 - volatility - Math.abs(momentum));
  }
  
  return {
    pattern_type,
    confidence,
    momentum,
    acceleration: avgAcceleration,
    volatility,
    seasonal_factor: seasonalFactor
  };
}

/**
 * Detect seasonal/cyclical patterns in template performance
 */
function detectSeasonalPattern(windowRates: { period: string; rate: number; viral_count: number; timestamp: string }[]): number {
  if (windowRates.length < 4) return 0;
  
  // Look for weekly patterns (7-day cycles)
  const dailyRates = windowRates.slice(0, 4); // Use 1d, 3d, 7d, 14d windows
  
  // Calculate autocorrelation for 7-day lag (if we had daily data)
  // For now, use simple pattern matching
  const rates = dailyRates.map(w => w.rate);
  
  // Check for alternating high/low pattern
  let alternatingPattern = 0;
  for (let i = 1; i < rates.length; i++) {
    const trend1 = rates[i] - rates[i - 1];
    if (i > 1) {
      const trend2 = rates[i - 1] - rates[i - 2];
      if (trend1 * trend2 < 0) { // Opposite directions
        alternatingPattern += 0.25;
      }
    }
  }
  
  // Check for periodic peaks
  const mean = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  const peakCount = rates.filter(r => r > mean * 1.2).length;
  const periodicFactor = peakCount / rates.length;
  
  return Math.min(1.0, alternatingPattern + periodicFactor);
}

/**
 * Enhanced template analysis with advanced temporal pattern recognition
 */
async function analyzeTemplate(template: Template): Promise<TemplateAnalysis & { pattern: TemporalPattern }> {
  const now = dayjs();
  const templateAge = dayjs(template.updated_at);
  const template_age_days = now.diff(templateAge, 'day');

  // Get advanced temporal pattern analysis
  const pattern = await analyzeTemporalPatterns(template);

  // Define time windows for basic analysis
  const currentWindowStart = now.subtract(7, 'day').toISOString();
  const currentWindowEnd = now.toISOString();
  const previousWindowStart = now.subtract(14, 'day').toISOString();
  const previousWindowEnd = now.subtract(7, 'day').toISOString();

  // Get negative pool counts for both windows
  const currentNegativeCounts = await getNegativePoolVideos([template.niche], currentWindowStart, currentWindowEnd);
  const previousNegativeCounts = await getNegativePoolVideos([template.niche], previousWindowStart, previousWindowEnd);

  // Calculate rates for both windows
  const currentWindow = await calculateTemplateRate(template, currentWindowStart, currentWindowEnd, currentNegativeCounts);
  const previousWindow = await calculateTemplateRate(template, previousWindowStart, previousWindowEnd, previousNegativeCounts);

  const current_rate = currentWindow.rate;
  const previous_rate = previousWindow.rate;
  const viral_count_current = currentWindow.viral_count;
  const viral_count_previous = previousWindow.viral_count;

  // Enhanced trend calculation using momentum and pattern analysis
  let trend_pct = 0;
  if (previous_rate === 0) {
    trend_pct = current_rate >= 0.05 ? 1.0 : 0;
  } else {
    trend_pct = (current_rate - previous_rate) / Math.max(previous_rate, MIN_RATE_DENOMINATOR);
  }

  // Adjust trend based on pattern momentum and confidence
  const momentumAdjustment = pattern.momentum * pattern.confidence;
  trend_pct = trend_pct + momentumAdjustment;

  // Enhanced status classification using pattern analysis
  let status: 'HOT' | 'COOLING' | 'NEW' | 'STABLE' = 'STABLE';

  // NEW: Recent template with good performance
  if (template_age_days < NEW_TEMPLATE_AGE_THRESHOLD && viral_count_current >= NEW_TEMPLATE_MIN_VIRALS) {
    status = 'NEW';
  }
  // HOT: Explosive or steady growth pattern with strong momentum
  else if (
    (pattern.pattern_type === 'explosive' || pattern.pattern_type === 'steady_growth') &&
    pattern.confidence > 0.6 &&
    trend_pct >= HOT_TREND_THRESHOLD &&
    viral_count_current >= HOT_MIN_VIRALS
  ) {
    status = 'HOT';
  }
  // COOLING: Decay pattern or negative momentum with high confidence
  else if (
    (pattern.pattern_type === 'decay' || pattern.momentum < -0.1) &&
    pattern.confidence > 0.5 &&
    (trend_pct <= COOLING_TREND_THRESHOLD || pattern.acceleration < -0.05) &&
    previous_rate >= COOLING_MIN_PREVIOUS_RATE
  ) {
    status = 'COOLING';
  }
  // Check for volatile patterns that might need special handling
  else if (pattern.pattern_type === 'volatile' && pattern.confidence > 0.7) {
    // Volatile templates get classified based on recent momentum
    if (pattern.momentum > 0.1) {
      status = 'HOT';
    } else if (pattern.momentum < -0.1) {
      status = 'COOLING';
    }
  }

  return {
    template_id: template.template_id,
    current_rate,
    previous_rate,
    trend_pct,
    viral_count_current,
    viral_count_previous,
    template_age_days,
    status,
    pattern
  };
}

/**
 * Update template status in database with pattern analysis
 */
async function updateTemplateStatuses(analyses: (TemplateAnalysis & { pattern: TemporalPattern })[]): Promise<void> {
  for (const analysis of analyses) {
    const { error } = await supabase
      .from('template_library')
      .update({
        status: analysis.status,
        trend_pct: analysis.trend_pct,
        pattern_type: analysis.pattern.pattern_type,
        pattern_confidence: analysis.pattern.confidence,
        momentum: analysis.pattern.momentum,
        volatility: analysis.pattern.volatility,
        updated_at: new Date().toISOString()
      })
      .eq('template_id', analysis.template_id);

    if (error) {
      console.error(`Failed to update template ${analysis.template_id}:`, error.message);
    }
  }
}

/**
 * Log evolution run results with pattern analysis
 */
async function logEvolutionRun(analyses: (TemplateAnalysis & { pattern: TemporalPattern })[], duration: number): Promise<void> {
  const statusCounts = {
    hot_count: analyses.filter(a => a.status === 'HOT').length,
    cooling_count: analyses.filter(a => a.status === 'COOLING').length,
    new_count: analyses.filter(a => a.status === 'NEW').length,
    stable_count: analyses.filter(a => a.status === 'STABLE').length
  };

  // Calculate pattern distribution
  const patternCounts = {
    explosive: analyses.filter(a => a.pattern.pattern_type === 'explosive').length,
    steady_growth: analyses.filter(a => a.pattern.pattern_type === 'steady_growth').length,
    cyclical: analyses.filter(a => a.pattern.pattern_type === 'cyclical').length,
    decay: analyses.filter(a => a.pattern.pattern_type === 'decay').length,
    stable: analyses.filter(a => a.pattern.pattern_type === 'stable').length,
    volatile: analyses.filter(a => a.pattern.pattern_type === 'volatile').length
  };

  // Calculate average metrics
  const avgConfidence = analyses.reduce((sum, a) => sum + a.pattern.confidence, 0) / analyses.length;
  const avgMomentum = analyses.reduce((sum, a) => sum + a.pattern.momentum, 0) / analyses.length;
  const avgVolatility = analyses.reduce((sum, a) => sum + a.pattern.volatility, 0) / analyses.length;

  const { error } = await supabase
    .from('evolution_runs')
    .insert({
      ...statusCounts,
      duration_ms: duration,
      run_ts: new Date().toISOString(),
      pattern_explosive: patternCounts.explosive,
      pattern_steady_growth: patternCounts.steady_growth,
      pattern_cyclical: patternCounts.cyclical,
      pattern_decay: patternCounts.decay,
      pattern_stable: patternCounts.stable,
      pattern_volatile: patternCounts.volatile,
      avg_confidence: avgConfidence,
      avg_momentum: avgMomentum,
      avg_volatility: avgVolatility
    });

  if (error) {
    console.error('Failed to log evolution run:', error.message);
  }
}

/**
 * Main EvolutionEngine function
 * Runs once every 24h after TemplateGenerator to evaluate template trends
 */
export async function runEvolutionEngine(): Promise<void> {
  const startTime = Date.now();
  console.log('🧪 EvolutionEngine starting...');

  try {
    // Fetch all templates from template_library
    const { data: templates, error: templatesError } = await supabase
      .from('template_library')
      .select('template_id, videos, success_rate, updated_at, niche, status, trend_pct');

    if (templatesError) {
      throw new Error(`Failed to fetch templates: ${templatesError.message}`);
    }

    if (!templates || templates.length === 0) {
      console.log('No templates found in template_library');
      return;
    }

    console.log(`Analyzing ${templates.length} templates...`);

    // Analyze each template with advanced pattern recognition
    const analyses: (TemplateAnalysis & { pattern: TemporalPattern })[] = [];
    for (const template of templates) {
      try {
        const analysis = await analyzeTemplate(template as Template);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze template ${template.template_id}:`, error);
      }
    }

    console.log(`Completed analysis of ${analyses.length} templates`);

    // Update template statuses in database
    await updateTemplateStatuses(analyses);

    const duration = Date.now() - startTime;

    // Log evolution run
    await logEvolutionRun(analyses, duration);

    // Print comprehensive summary
    const summary = {
      HOT: analyses.filter(a => a.status === 'HOT').length,
      COOLING: analyses.filter(a => a.status === 'COOLING').length,
      NEW: analyses.filter(a => a.status === 'NEW').length,
      STABLE: analyses.filter(a => a.status === 'STABLE').length
    };

    const patternSummary = {
      explosive: analyses.filter(a => a.pattern.pattern_type === 'explosive').length,
      steady_growth: analyses.filter(a => a.pattern.pattern_type === 'steady_growth').length,
      cyclical: analyses.filter(a => a.pattern.pattern_type === 'cyclical').length,
      decay: analyses.filter(a => a.pattern.pattern_type === 'decay').length,
      stable: analyses.filter(a => a.pattern.pattern_type === 'stable').length,
      volatile: analyses.filter(a => a.pattern.pattern_type === 'volatile').length
    };

    const avgConfidence = analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + a.pattern.confidence, 0) / analyses.length 
      : 0;

    console.log(`🧪 EvolutionEngine completed in ${duration}ms`);
    console.log('Template Status Summary:', summary);
    console.log('Temporal Pattern Summary:', patternSummary);
    console.log(`Average Pattern Confidence: ${(avgConfidence * 100).toFixed(1)}%`);

    // Performance check
    if (duration > PERFORMANCE_TARGET_MS) {
      console.warn(`Performance warning: EvolutionEngine took ${duration}ms (target: <${PERFORMANCE_TARGET_MS}ms)`);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('EvolutionEngine failed:', error);
    
    // Log failed run
    try {
      await supabase
        .from('evolution_runs')
        .insert({
          hot_count: 0,
          cooling_count: 0,
          new_count: 0,
          stable_count: 0,
          duration_ms: duration,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          run_ts: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error run:', logError);
    }

    throw error;
  }
}

/**
 * Test function with synthetic data
 */
export async function testEvolutionEngine(): Promise<{
  success: boolean;
  templatesAnalyzed: number;
  statusCounts: Record<string, number>;
  duration: number;
}> {
  console.log('🧪 Testing EvolutionEngine with synthetic analysis...');
  
  const startTime = Date.now();
  
  try {
    // Create synthetic template data for testing
    const now = dayjs();
    
    const testTemplates: Template[] = [
      // HOT template: high trend
      {
        template_id: 'test-hot-template',
        videos: ['video1', 'video2', 'video3'],
        success_rate: 0.8,
        updated_at: now.subtract(5, 'day').toISOString(),
        niche: 'fitness'
      },
      // COOLING template: negative trend
      {
        template_id: 'test-cooling-template',
        videos: ['video4', 'video5'],
        success_rate: 0.3,
        updated_at: now.subtract(10, 'day').toISOString(),
        niche: 'business'
      },
      // NEW template: recent with good performance
      {
        template_id: 'test-new-template',
        videos: Array.from({ length: 12 }, (_, i) => `new_video_${i}`),
        success_rate: 0.7,
        updated_at: now.subtract(2, 'day').toISOString(),
        niche: 'entertainment'
      },
      // STABLE template: no significant change
      {
        template_id: 'test-stable-template',
        videos: ['video6', 'video7'],
        success_rate: 0.5,
        updated_at: now.subtract(20, 'day').toISOString(),
        niche: 'lifestyle'
      }
    ];

    // Analyze synthetic templates
    const analyses: TemplateAnalysis[] = [];
    for (const template of testTemplates) {
      const analysis = await analyzeTemplate(template);
      analyses.push(analysis);
    }

    const statusCounts = {
      HOT: analyses.filter(a => a.status === 'HOT').length,
      COOLING: analyses.filter(a => a.status === 'COOLING').length,
      NEW: analyses.filter(a => a.status === 'NEW').length,
      STABLE: analyses.filter(a => a.status === 'STABLE').length
    };

    const duration = Date.now() - startTime;

    return {
      success: true,
      templatesAnalyzed: analyses.length,
      statusCounts,
      duration
    };

  } catch (error) {
    console.error('EvolutionEngine test failed:', error);
    return {
      success: false,
      templatesAnalyzed: 0,
      statusCounts: { HOT: 0, COOLING: 0, NEW: 0, STABLE: 0 },
      duration: Date.now() - startTime
    };
  }
}