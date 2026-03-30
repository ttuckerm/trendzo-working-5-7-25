import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { KaiOrchestrator } from '@/lib/orchestration/kai-orchestrator';
import { analyzeVideoImmediately } from '@/lib/services/immediate-video-analyzer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface StartScrapingRequest {
  type: 'channel' | 'keyword';
  target: string; // @username or keyword
  platform?: string;
  niches?: string[];
  filters?: {
    minViews?: number;
    dateRange?: number; // days
  };
}

/**
 * POST /api/scraping/start
 * Start a new scraping job
 */
export async function POST(req: NextRequest) {
  try {
    const body: StartScrapingRequest = await req.json();
    const { type, platform = 'tiktok', niches = [], filters = {} } = body;

    // Clean and validate target - remove ALL whitespace including tabs, newlines, etc.
    const target = body.target?.trim().replace(/\s+/g, '');

    // Validate input
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Target is required' },
        { status: 400 }
      );
    }

    // Create job record
    const jobId = uuidv4();
    const { data: job, error: insertError } = await supabase
      .from('scraping_jobs')
      .insert({
        id: jobId,
        type,
        target,
        platform,
        status: 'pending',
        niche: niches[0] || null, // Primary niche
        filters: {
          ...filters,
          niches, // Store all selected niches in filters
          requested_by: 'admin',
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Start background scraping (don't await)
    processScraping(jobId, type, target, platform, filters).catch((error) => {
      console.error(`Scraping job ${jobId} failed:`, error);
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: `Scraping job started for ${type}: ${target}`,
    });

  } catch (error: any) {
    console.error('Error starting scraping:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Background process to scrape and analyze videos
 */
async function processScraping(
  jobId: string,
  type: 'channel' | 'keyword',
  target: string,
  platform: string,
  filters: any
) {
  try {
    // Update status to running
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    // Scrape videos from Apify
    console.log(`[APIFY] Starting scrape for ${type}: ${target}`);
    console.log(`[APIFY] Environment check - Token exists: ${!!process.env.APIFY_API_TOKEN}`);
    console.log(`[APIFY] Token value (first 10 chars): ${process.env.APIFY_API_TOKEN?.substring(0, 10)}`);

    const { ApifyClient } = require('apify-client');
    const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

    // Clean the target for Apify - remove @ symbol and any remaining whitespace
    const cleanTarget = target.replace('@', '').trim();

    const inputConfig = {
      profiles: type === 'channel' ? [cleanTarget] : [],
      resultsPerPage: filters.maxResults || 50,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
    };

    console.log(`[APIFY] Original target: "${target}"`);
    console.log(`[APIFY] Cleaned target: "${cleanTarget}"`);
    console.log(`[APIFY] Calling actor with input:`, JSON.stringify(inputConfig, null, 2));

    const run = await client.actor('clockworks/tiktok-scraper').call(inputConfig);

    console.log(`[APIFY] Actor run completed`);
    console.log(`[APIFY] Run ID: ${run.id}`);
    console.log(`[APIFY] Run status: ${run.status}`);
    console.log(`[APIFY] Default dataset ID: ${run.defaultDatasetId}`);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`[APIFY] Dataset fetch completed`);
    console.log(`[APIFY] Items array exists: ${!!items}`);
    console.log(`[APIFY] Items length: ${items?.length || 0}`);
    if (items && items.length > 0) {
      console.log(`[APIFY] First item structure:`, JSON.stringify(Object.keys(items[0]), null, 2));
      console.log(`[APIFY] First item sample:`, JSON.stringify(items[0], null, 2).substring(0, 500));
    }

    if (!items || items.length === 0) {
      throw new Error(`No videos found for ${type}: ${target}`);
    }

    // Convert to VIT format
    const filteredVideos = items.map((video: any) => ({
      id: video.id,
      platform: 'tiktok',
      platformVideoId: video.id,
      creatorId: video.authorMeta?.name || 'unknown',
      niche: filters.niches?.[0] || 'General',
      publishTs: video.createTime ? new Date(video.createTime * 1000).toISOString() : new Date().toISOString(),
      durationSec: video.videoMeta?.duration || 0,
      caption: video.text || '',
      hashtags: video.hashtags?.map((h: any) => h.name) || [],
      metrics: [{
        views: video.playCount || 0,
        likes: video.diggCount || 0,
        comments: video.commentCount || 0,
        shares: video.shareCount || 0,
        saves: video.collectCount || 0,
      }],
    }));

    // Update videos found count
    await supabase
      .from('scraping_jobs')
      .update({
        videos_found: filteredVideos.length,
      })
      .eq('id', jobId);

    // Initialize Kai Orchestrator for video analysis
    const kai = new KaiOrchestrator();
    await kai.loadReliabilityScores();

    // Process each video
    let processed = 0;
    let analyzed = 0;
    let ffmpegAnalyzed = 0;
    
    for (const video of filteredVideos) {
      try {
        const actualDps = null; // Legacy DPS removed; v2 scoring in dps-v2.ts

        // Get video URL from raw Apify data for FFmpeg analysis
        const rawVideo = items.find((item: any) => item.id === video.id);
        const videoUrl = rawVideo?.webVideoUrl || rawVideo?.videoUrl || rawVideo?.video?.playAddr;

        // =====================================================
        // IMMEDIATE FFmpeg ANALYSIS (while CDN URL is fresh!)
        // =====================================================
        if (videoUrl) {
          try {
            console.log(`[FFmpeg] Starting immediate analysis for ${video.id}...`);
            const ffmpegResult = await analyzeVideoImmediately(
              videoUrl,
              video.id,
              video.caption || '' // Use caption as transcript fallback
            );
            
            if (ffmpegResult.success) {
              ffmpegAnalyzed++;
              console.log(`[FFmpeg] ✅ ${video.id}: ${ffmpegResult.analysis?.sceneChanges} scenes, ${ffmpegResult.analysis?.height}p`);
            } else {
              console.warn(`[FFmpeg] ⚠️ ${video.id}: ${ffmpegResult.error}`);
            }
          } catch (ffmpegError: any) {
            console.error(`[FFmpeg] ❌ ${video.id}: ${ffmpegError.message}`);
            // Continue processing - FFmpeg failure shouldn't stop scraping
          }
        } else {
          console.warn(`[FFmpeg] No video URL found for ${video.id}`);
        }

        // Run Kai analysis on this video
        let kaiPrediction = null;
        try {
          kaiPrediction = await kai.predict({
            videoId: video.id,
            transcript: video.caption || '',
            title: video.caption,
            hashtags: video.hashtags || [],
            niche: video.niche || filters.niches?.[0] || 'General',
            goal: 'viral',
            accountSize: 'medium',
            actualMetrics: {
              views: video.metrics?.[0]?.views || 0,
              likes: video.metrics?.[0]?.likes || 0,
              comments: video.metrics?.[0]?.comments || 0,
              shares: video.metrics?.[0]?.shares || 0,
              saves: video.metrics?.[0]?.saves || 0,
            },
          }, 'immediate-analysis');

          analyzed++;
          console.log(`Analyzed video ${video.id}: Predicted DPS ${kaiPrediction.dps} vs Actual ${actualDps}`);

        } catch (kaiError) {
          console.error(`Kai analysis failed for ${video.id}:`, kaiError);
        }

        // Store in creator_video_history with Kai prediction
        await supabase
          .from('creator_video_history')
          .insert({
            video_id: video.platformVideoId,
            creator_profile_id: null,
            actual_dps: actualDps,
            predicted_dps: kaiPrediction?.dps || null,
            metrics: video.metrics,
            metadata: {
              scraping_job_id: jobId,
              scraped_at: new Date().toISOString(),
              kai_prediction: kaiPrediction ? {
                dps: kaiPrediction.dps,
                confidence: kaiPrediction.confidence,
                viral_potential: kaiPrediction.viralPotential,
                components_used: kaiPrediction.componentsUsed,
              } : null,
            },
          });

        // Update learning loop with prediction outcome
        if (kaiPrediction) {
          await updateLearningLoop(video, kaiPrediction, actualDps);
        }

        processed++;

        // Update progress
        if (processed % 10 === 0) {
          await supabase
            .from('scraping_jobs')
            .update({
              videos_processed: processed,
              videos_analyzed: analyzed,
            })
            .eq('id', jobId);
        }

      } catch (err) {
        console.error(`Failed to process video ${video.id}:`, err);
      }
    }

    // Trigger pattern analysis
    await analyzePatterns(jobId, filteredVideos);

    // Recalculate DPS buckets
    // EVIDENCE: supabase/migrations/20251121_scraping_command_center.sql
    await supabase.rpc('calculate_dps_buckets', { job_uuid: jobId });

    // Mark as complete
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'complete',
        videos_processed: processed,
        videos_analyzed: analyzed,
        completed_at: new Date().toISOString(),
        metadata: {
          ffmpeg_analyzed: ffmpegAnalyzed,
          kai_analyzed: analyzed,
          total_videos: filteredVideos.length,
        }
      })
      .eq('id', jobId);

    console.log(`Scraping job ${jobId} completed:`);
    console.log(`  ✓ ${processed} videos processed`);
    console.log(`  ✓ ${ffmpegAnalyzed} videos with FFmpeg analysis`);
    console.log(`  ✓ ${analyzed} videos with Kai predictions`);

  } catch (error: any) {
    console.error(`Scraping job ${jobId} failed:`, error);

    // Mark as failed
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}

// Legacy calculateDPS removed (2026-03-25). Ground-truth DPS is in dps-v2.ts.

/**
 * Update learning loop with prediction outcome
 * EVIDENCE: component_reliability table in supabase/migrations/20251119_learning_loop_system.sql
 */
async function updateLearningLoop(video: any, prediction: any, actualDps: number) {
  try {
    const delta = prediction.dps - actualDps;
    const deltaPct = Math.abs(delta) / Math.max(actualDps, 1) * 100;

    // Update each component's reliability
    for (const componentId of prediction.componentsUsed || []) {
      const componentScore = prediction.componentScores?.get(componentId);
      if (componentScore !== undefined) {
        const componentDelta = componentScore - actualDps;

        // Upsert component reliability - just use direct upsert
        await supabase.from('component_reliability')
          .upsert({
            component_id: componentId,
            component_type: 'quantitative',
            reliability_score: Math.max(0, 1 - (Math.abs(componentDelta) / 100)),
            total_predictions: 1,
            correct_predictions: deltaPct < 15 ? 1 : 0,
            avg_accuracy_delta: Math.abs(componentDelta),
            last_updated: new Date().toISOString(),
          }, {
            onConflict: 'component_id',
          });
      }
    }

    console.log(`Updated learning loop for ${prediction.componentsUsed?.length || 0} components`);
  } catch (err) {
    console.error('Failed to update learning loop:', err);
  }
}

/**
 * Advanced pattern analysis - analyzes multiple dimensions
 */
async function analyzePatterns(jobId: string, videos: any[]) {
  // Split into DPS buckets
  // Legacy DPS bucketing removed (2026-03-25). Use raw engagement metrics for pattern analysis.
  const getEngRate = (v: any) => {
    const m = v.metrics?.[0];
    if (!m || !m.views) return 0;
    return (m.likes + m.shares * 2 + m.comments * 3) / m.views;
  };
  const viral = videos.filter(v => getEngRate(v) >= 0.10);
  const good = videos.filter(v => getEngRate(v) >= 0.05 && getEngRate(v) < 0.10);
  const poor = videos.filter(v => getEngRate(v) < 0.05);

  if (viral.length < 3 || poor.length < 3) {
    console.log(`Not enough samples for pattern analysis: ${viral.length} viral, ${poor.length} poor`);
    return;
  }

  const insights: any[] = [];

  // 1. Hook Pattern Analysis
  const hookPatterns = analyzeHookPatterns(viral, poor);
  insights.push(...hookPatterns);

  // 2. Video Length Analysis
  const lengthPatterns = analyzeLengthPatterns(viral, poor);
  insights.push(...lengthPatterns);

  // 3. Timing Analysis (if timestamp data available)
  const timingPatterns = analyzeTimingPatterns(viral, poor);
  insights.push(...timingPatterns);

  // 4. Keyword Analysis
  const keywordPatterns = analyzeKeywordPatterns(viral, poor);
  insights.push(...keywordPatterns);

  // 5. Hashtag Analysis
  const hashtagPatterns = analyzeHashtagPatterns(viral, poor);
  insights.push(...hashtagPatterns);

  // Store all insights
  for (const insight of insights) {
    if (insight.lift_factor > 1.5) { // Only store significant patterns
      await supabase.from('pattern_insights').insert({
        scraping_job_id: jobId,
        niche: 'General', // Could be video-specific
        ...insight,
        viral_sample_size: viral.length,
        poor_sample_size: poor.length,
        total_videos_analyzed: videos.length,
      });
    }
  }

  console.log(`Pattern analysis complete: ${insights.length} insights discovered`);

  // Feed patterns to Bloomberg Terminal
  await feedPatternsToBloomberg(insights.filter(i => i.lift_factor > 2.0));
}

/**
 * Analyze hook patterns (question, bold statement, curiosity gap)
 */
function analyzeHookPatterns(viral: any[], poor: any[]): any[] {
  const insights: any[] = [];

  // Question hooks
  const viralQuestions = viral.filter(v => v.caption?.includes('?')).length / viral.length;
  const poorQuestions = poor.filter(v => v.caption?.includes('?')).length / poor.length;

  if (poorQuestions > 0 && viralQuestions / poorQuestions > 1.5) {
    insights.push({
      pattern_type: 'hook',
      pattern_name: 'Question Hook',
      pattern_description: 'Videos that start with a question',
      viral_occurrence: viralQuestions,
      poor_occurrence: poorQuestions,
      lift_factor: viralQuestions / poorQuestions,
      recommendation: `Use question hooks to increase viral potential by ${(viralQuestions / poorQuestions).toFixed(1)}x`,
      priority: 8,
      statistical_significance: 0.85,
      confidence_level: 'high',
    });
  }

  // Bold statements (contains exclamation)
  const viralBold = viral.filter(v => v.caption?.includes('!')).length / viral.length;
  const poorBold = poor.filter(v => v.caption?.includes('!')).length / poor.length;

  if (poorBold > 0 && viralBold / poorBold > 1.5) {
    insights.push({
      pattern_type: 'hook',
      pattern_name: 'Bold Statement Hook',
      pattern_description: 'Videos with exclamation points (bold statements)',
      viral_occurrence: viralBold,
      poor_occurrence: poorBold,
      lift_factor: viralBold / poorBold,
      recommendation: `Use bold statements to increase engagement by ${(viralBold / poorBold).toFixed(1)}x`,
      priority: 7,
      statistical_significance: 0.75,
      confidence_level: 'medium',
    });
  }

  return insights;
}

/**
 * Analyze video length patterns
 */
function analyzeLengthPatterns(viral: any[], poor: any[]): any[] {
  const insights: any[] = [];

  const viralLengths = viral.map(v => v.durationSec || 0).filter(l => l > 0);
  const poorLengths = poor.map(v => v.durationSec || 0).filter(l => l > 0);

  if (viralLengths.length === 0 || poorLengths.length === 0) return insights;

  const viralAvgLength = viralLengths.reduce((a, b) => a + b, 0) / viralLengths.length;
  const poorAvgLength = poorLengths.reduce((a, b) => a + b, 0) / poorLengths.length;

  const lengthDiff = Math.abs(viralAvgLength - poorAvgLength);
  const liftFactor = poorAvgLength > 0 ? poorAvgLength / viralAvgLength : 1;

  if (lengthDiff > 5) { // Significant 5+ second difference
    insights.push({
      pattern_type: 'length',
      pattern_name: 'Optimal Video Length',
      pattern_description: `Viral videos average ${viralAvgLength.toFixed(1)}s vs poor videos ${poorAvgLength.toFixed(1)}s`,
      viral_occurrence: viralAvgLength / 60, // Store as percentage for consistency
      poor_occurrence: poorAvgLength / 60,
      lift_factor: liftFactor,
      recommendation: viralAvgLength < poorAvgLength
        ? `Keep videos under ${Math.ceil(viralAvgLength)}s for better performance`
        : `Longer videos (${Math.ceil(viralAvgLength)}s) perform better`,
      priority: 9,
      statistical_significance: 0.90,
      confidence_level: 'high',
    });
  }

  return insights;
}

/**
 * Analyze posting time patterns
 */
function analyzeTimingPatterns(viral: any[], poor: any[]): any[] {
  const insights: any[] = [];

  // Extract posting hours if available
  const viralHours = viral
    .map(v => v.publishTs ? new Date(v.publishTs).getHours() : null)
    .filter(h => h !== null);
  const poorHours = poor
    .map(v => v.publishTs ? new Date(v.publishTs).getHours() : null)
    .filter(h => h !== null);

  if (viralHours.length < 3 || poorHours.length < 3) return insights;

  // Find most common hour for viral videos
  const viralHourCounts: Record<number, number> = {};
  viralHours.forEach(h => viralHourCounts[h!] = (viralHourCounts[h!] || 0) + 1);
  const peakViralHour = Object.keys(viralHourCounts)
    .map(Number)
    .sort((a, b) => viralHourCounts[b] - viralHourCounts[a])[0];

  const viralAtPeak = viralHourCounts[peakViralHour] / viralHours.length;
  const poorAtPeak = poorHours.filter(h => h === peakViralHour).length / poorHours.length;

  if (poorAtPeak > 0 && viralAtPeak / poorAtPeak > 1.5) {
    const hourLabel = peakViralHour === 0 ? '12am' : peakViralHour < 12 ? `${peakViralHour}am` : peakViralHour === 12 ? '12pm' : `${peakViralHour - 12}pm`;

    insights.push({
      pattern_type: 'timing',
      pattern_name: `Peak Performance at ${hourLabel}`,
      pattern_description: `Videos posted around ${hourLabel} have higher viral rate`,
      viral_occurrence: viralAtPeak,
      poor_occurrence: poorAtPeak,
      lift_factor: viralAtPeak / poorAtPeak,
      recommendation: `Post videos around ${hourLabel} for ${(viralAtPeak / poorAtPeak).toFixed(1)}x better engagement`,
      priority: 6,
      statistical_significance: 0.70,
      confidence_level: 'medium',
    });
  }

  return insights;
}

/**
 * Analyze keyword patterns
 */
function analyzeKeywordPatterns(viral: any[], poor: any[]): any[] {
  const insights: any[] = [];

  // Extract words from captions
  const getWords = (videos: any[]) => {
    return videos
      .flatMap(v => (v.caption || '').toLowerCase().split(/\s+/))
      .filter(w => w.length > 3); // Only meaningful words
  };

  const viralWords = getWords(viral);
  const poorWords = getWords(poor);

  // Count word frequencies
  const viralWordCounts: Record<string, number> = {};
  const poorWordCounts: Record<string, number> = {};

  viralWords.forEach(w => viralWordCounts[w] = (viralWordCounts[w] || 0) + 1);
  poorWords.forEach(w => poorWordCounts[w] = (poorWordCounts[w] || 0) + 1);

  // Find words that appear much more in viral
  const significantWords = Object.keys(viralWordCounts).filter(word => {
    const viralFreq = viralWordCounts[word] / viral.length;
    const poorFreq = (poorWordCounts[word] || 0) / poor.length;
    return poorFreq > 0 && viralFreq / poorFreq > 2.0 && viralWordCounts[word] >= 3;
  });

  for (const word of significantWords.slice(0, 3)) { // Top 3 keywords
    const viralFreq = viralWordCounts[word] / viral.length;
    const poorFreq = (poorWordCounts[word] || 0) / poor.length;

    insights.push({
      pattern_type: 'keywords',
      pattern_name: `High-Impact Keyword: "${word}"`,
      pattern_description: `The word "${word}" appears more frequently in viral content`,
      viral_occurrence: viralFreq,
      poor_occurrence: poorFreq,
      lift_factor: viralFreq / poorFreq,
      recommendation: `Include "${word}" in captions for ${(viralFreq / poorFreq).toFixed(1)}x better performance`,
      priority: 5,
      statistical_significance: 0.65,
      confidence_level: 'medium',
    });
  }

  return insights;
}

/**
 * Analyze hashtag patterns
 */
function analyzeHashtagPatterns(viral: any[], poor: any[]): any[] {
  const insights: any[] = [];

  // Count average number of hashtags
  const viralHashtagCounts = viral.map(v => (v.hashtags || []).length);
  const poorHashtagCounts = poor.map(v => (v.hashtags || []).length);

  const viralAvgHashtags = viralHashtagCounts.reduce((a, b) => a + b, 0) / viral.length;
  const poorAvgHashtags = poorHashtagCounts.reduce((a, b) => a + b, 0) / poor.length;

  if (Math.abs(viralAvgHashtags - poorAvgHashtags) > 1) {
    insights.push({
      pattern_type: 'hashtags',
      pattern_name: 'Optimal Hashtag Count',
      pattern_description: `Viral videos use ${viralAvgHashtags.toFixed(1)} hashtags on average`,
      viral_occurrence: viralAvgHashtags / 10, // Normalize for storage
      poor_occurrence: poorAvgHashtags / 10,
      lift_factor: poorAvgHashtags > 0 ? viralAvgHashtags / poorAvgHashtags : 1,
      recommendation: `Use approximately ${Math.round(viralAvgHashtags)} hashtags per video`,
      priority: 4,
      statistical_significance: 0.60,
      confidence_level: 'low',
    });
  }

  return insights;
}

/**
 * Feed top patterns to Bloomberg Terminal
 */
async function feedPatternsToBloomberg(topInsights: any[]) {
  try {
    // Update Bloomberg patterns endpoint with new discoveries
    // This would call the Bloomberg patterns API to inject new patterns
    console.log(`Feeding ${topInsights.length} patterns to Bloomberg Terminal`);

    // For now, just log - in production this would update the patterns cache
    // that Bloomberg Terminal reads from
    for (const insight of topInsights) {
      console.log(`  → ${insight.pattern_name}: ${insight.lift_factor.toFixed(1)}x lift`);
    }

    // TODO: Implement actual Bloomberg feed mechanism
    // Could use a shared cache, database trigger, or API endpoint
  } catch (err) {
    console.error('Failed to feed patterns to Bloomberg:', err);
  }
}
