import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface VideoMetrics {
  id: string;
  views_1h: number;
  likes_1h: number;
  creator_followers: number;
}

interface ProcessedVideo extends VideoMetrics {
  engagement_score: number;
  follower_bucket: string;
}

interface ViralFilterRunSummary {
  run_id: string;
  total_processed: number;
  viral_count: number;
  neg_count: number;
  run_timestamp: string;
  status: 'completed' | 'insufficient_data' | 'error';
}

// Default percentile threshold (can be overridden by dps_spec.md)
const DEFAULT_VIRAL_PERCENTILE = 0.95;
const NEGATIVE_SAMPLE_RATE = 0.05;
const MIN_BATCH_SIZE = 20;

/**
 * Get follower count bucket for stratified sampling
 */
function getFollowerBucket(followers: number): string {
  if (followers <= 1000) return '≤1k';
  if (followers <= 10000) return '1k-10k';
  if (followers <= 100000) return '10k-100k';
  return '100k+';
}

/**
 * Calculate engagement score for a video
 */
function calculateEngagementScore(video: VideoMetrics): number {
  const denominator = Math.max(video.creator_followers, 1);
  return (video.likes_1h + video.views_1h) / denominator;
}

/**
 * Validate and clean video metrics
 */
function validateAndCleanMetrics(batch: VideoMetrics[]): ProcessedVideo[] {
  return batch
    .filter(video => {
      // Drop videos with missing or invalid metric fields
      return (
        video.id &&
        typeof video.views_1h === 'number' &&
        typeof video.likes_1h === 'number' &&
        typeof video.creator_followers === 'number' &&
        video.views_1h >= 0 &&
        video.likes_1h >= 0 &&
        video.creator_followers >= 0
      );
    })
    .map(video => ({
      ...video,
      engagement_score: calculateEngagementScore(video),
      follower_bucket: getFollowerBucket(video.creator_followers)
    }));
}

/**
 * Get viral percentile threshold from dps_spec.md or use default
 */
async function getViralPercentile(): Promise<number> {
  try {
    // TODO: Read from dps_spec.md when available
    // For now, return default
    return DEFAULT_VIRAL_PERCENTILE;
  } catch (error) {
    console.warn('Could not read dps_spec.md, using default percentile:', DEFAULT_VIRAL_PERCENTILE);
    return DEFAULT_VIRAL_PERCENTILE;
  }
}

/**
 * Group array by key (native implementation)
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Sample random items from array (native implementation)
 */
function sampleSize<T>(array: T[], size: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, size);
}

/**
 * Order array by property and direction (native implementation)
 */
function orderBy<T>(array: T[], keys: (keyof T)[], orders: ('asc' | 'desc')[]): T[] {
  return [...array].sort((a, b) => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const order = orders[i];
      const aVal = a[key] as any;
      const bVal = b[key] as any;
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Select stratified negative samples maintaining follower bucket distribution
 */
function selectStratifiedNegatives(
  nonViralVideos: ProcessedVideo[],
  targetCount: number
): ProcessedVideo[] {
  // Group by follower bucket
  const bucketGroups = groupBy(nonViralVideos, 'follower_bucket');
  const buckets = Object.keys(bucketGroups);
  
  if (buckets.length === 0) return [];
  
  // Calculate samples per bucket (proportional to bucket size)
  const totalNonViral = nonViralVideos.length;
  const selectedNegatives: ProcessedVideo[] = [];
  
  for (const bucket of buckets) {
    const bucketVideos = bucketGroups[bucket];
    const bucketProportion = bucketVideos.length / totalNonViral;
    const bucketSampleSize = Math.round(targetCount * bucketProportion);
    
    // Sample randomly from this bucket
    const bucketSamples = sampleSize(bucketVideos, Math.min(bucketSampleSize, bucketVideos.length));
    selectedNegatives.push(...bucketSamples);
  }
  
  // If we need more samples, randomly select from remaining
  if (selectedNegatives.length < targetCount) {
    const remaining = nonViralVideos.filter(v => !selectedNegatives.includes(v));
    const additionalSamples = sampleSize(remaining, targetCount - selectedNegatives.length);
    selectedNegatives.push(...additionalSamples);
  }
  
  return selectedNegatives.slice(0, targetCount);
}

/**
 * Insert viral candidates into viral_pool table
 */
async function insertViralPool(viralVideos: ProcessedVideo[]): Promise<void> {
  if (viralVideos.length === 0) return;

  const viralPoolData = viralVideos.map(video => ({
    video_id: video.id,
    follower_bucket: video.follower_bucket,
    engagement_score: video.engagement_score,
    views_1h: video.views_1h,
    likes_1h: video.likes_1h,
    creator_followers: video.creator_followers,
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('viral_pool')
    .insert(viralPoolData);

  if (error) {
    throw new Error(`Failed to insert viral pool: ${error.message}`);
  }
}

/**
 * Insert negative samples into negative_pool table
 */
async function insertNegativePool(negativeVideos: ProcessedVideo[]): Promise<void> {
  if (negativeVideos.length === 0) return;

  const negativePoolData = negativeVideos.map(video => ({
    video_id: video.id,
    follower_bucket: video.follower_bucket, // Required by schema
    engagement_score: video.engagement_score,
    views_1h: video.views_1h,
    likes_1h: video.likes_1h,
    creator_followers: video.creator_followers,
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('negative_pool')
    .insert(negativePoolData);

  if (error) {
    throw new Error(`Failed to insert negative pool: ${error.message}`);
  }
}

/**
 * Log run summary to viral_filter_runs table
 */
async function logFilterRun(summary: ViralFilterRunSummary): Promise<void> {
  const { error } = await supabase
    .from('viral_filter_runs')
    .insert(summary);
    
  if (error) {
    throw new Error(`Failed to log filter run: ${error.message}`);
  }
}

/**
 * Main viral filter function
 * Processes a batch of videos and identifies viral candidates and negative samples
 */
export async function runViralFilter(batch: VideoMetrics[]): Promise<void> {
  const runId = crypto.randomUUID();
  const runTimestamp = new Date().toISOString();
  const startTime = Date.now();
  
  try {
    console.log(`ViralFilter starting run ${runId} with ${batch.length} videos`);
    
    // Check minimum batch size
    if (batch.length < MIN_BATCH_SIZE) {
      console.warn(`Insufficient data: ${batch.length} videos (minimum ${MIN_BATCH_SIZE})`);
      
      await logFilterRun({
        run_id: runId,
        total_processed: batch.length,
        viral_count: 0,
        neg_count: 0,
        run_timestamp: runTimestamp,
        status: 'insufficient_data'
      });
      
      return;
    }
    
    // Validate and clean metrics
    const processedVideos = validateAndCleanMetrics(batch);
    console.log(`Processed ${processedVideos.length} valid videos from ${batch.length} total`);
    
    if (processedVideos.length < MIN_BATCH_SIZE) {
      console.warn(`Insufficient valid data after cleaning: ${processedVideos.length} videos`);
      
      await logFilterRun({
        run_id: runId,
        total_processed: processedVideos.length,
        viral_count: 0,
        neg_count: 0,
        run_timestamp: runTimestamp,
        status: 'insufficient_data'
      });
      
      return;
    }
    
    // Get viral percentile threshold
    const viralPercentile = await getViralPercentile();
    
    // Sort by engagement score (descending)
    const sortedVideos = orderBy(processedVideos, ['engagement_score'], ['desc']);
    
    // Calculate viral cutoff
    const viralCutoffIndex = Math.floor(sortedVideos.length * (1 - viralPercentile));
    const viralVideos = sortedVideos.slice(0, viralCutoffIndex);
    const nonViralVideos = sortedVideos.slice(viralCutoffIndex);
    
    console.log(`Identified ${viralVideos.length} viral candidates (top ${(viralPercentile * 100).toFixed(1)}%)`);
    
    // Select stratified negative samples
    const targetNegativeCount = Math.floor(nonViralVideos.length * NEGATIVE_SAMPLE_RATE);
    const negativeVideos = selectStratifiedNegatives(nonViralVideos, targetNegativeCount);
    
    console.log(`Selected ${negativeVideos.length} stratified negative samples`);
    
    // Insert into database
    await Promise.all([
      insertViralPool(viralVideos),
      insertNegativePool(negativeVideos)
    ]);
    
    // Log successful run
    await logFilterRun({
      run_id: runId,
      total_processed: processedVideos.length,
      viral_count: viralVideos.length,
      neg_count: negativeVideos.length,
      run_timestamp: runTimestamp,
      status: 'completed'
    });
    
    const duration = Date.now() - startTime;
    console.log(`ViralFilter completed run ${runId} in ${duration}ms`);
    
    // Performance check
    if (duration > 5000) {
      console.warn(`Performance warning: ViralFilter took ${duration}ms (target: <5000ms)`);
    }
    
  } catch (error) {
    console.error(`ViralFilter run ${runId} failed:`, error);
    
    // Log failed run
    try {
      await logFilterRun({
        run_id: runId,
        total_processed: batch.length,
        viral_count: 0,
        neg_count: 0,
        run_timestamp: runTimestamp,
        status: 'error'
      });
    } catch (logError) {
      console.error('Failed to log error run:', logError);
    }
    
    throw error;
  }
}

/**
 * Test function to validate viral filter with synthetic data
 */
export async function testViralFilter(): Promise<{
  success: boolean;
  viralCount: number;
  negativeCount: number;
  duration: number;
}> {
  console.log('Testing ViralFilter with synthetic data...');
  
  // Generate synthetic test data
  const testBatch: VideoMetrics[] = [];
  
  for (let i = 0; i < 100; i++) {
    testBatch.push({
      id: `test_video_${i}`,
      views_1h: Math.floor(Math.random() * 10000) + 100,
      likes_1h: Math.floor(Math.random() * 1000) + 10,
      creator_followers: Math.floor(Math.random() * 100000) + 1000
    });
  }
  
  // Add some obviously viral videos
  for (let i = 0; i < 5; i++) {
    testBatch.push({
      id: `viral_video_${i}`,
      views_1h: 50000 + i * 10000,
      likes_1h: 5000 + i * 1000,
      creator_followers: 1000 // Low followers = high engagement score
    });
  }
  
  const startTime = Date.now();
  
  try {
    await runViralFilter(testBatch);
    
    const duration = Date.now() - startTime;
    
    // Check results in database
    const { data: viralData } = await supabase
      .from('viral_pool')
      .select('video_id')
      .order('created_at', { ascending: false })
      .limit(10);
      
    const { data: negativeData } = await supabase
      .from('negative_pool')
      .select('video_id')
      .order('created_at', { ascending: false })
      .limit(20);
    
    return {
      success: true,
      viralCount: viralData?.length || 0,
      negativeCount: negativeData?.length || 0,
      duration
    };
    
  } catch (error) {
    console.error('ViralFilter test failed:', error);
    return {
      success: false,
      viralCount: 0,
      negativeCount: 0,
      duration: Date.now() - startTime
    };
  }
}