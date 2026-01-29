/**
 * Viral Research Pipeline Orchestrator
 *
 * Chains together all phases of viral content research:
 * 1. Scraping (Apify → scraped_videos)
 * 2. Transcription (tikwm → OpenAI Whisper)
 * 3. DPS Calculation (cohort-relative scoring)
 * 4. Pattern Extraction (viral fingerprinting)
 * 5. Knowledge Extraction (multi-LLM consensus)
 * 6. Research Report Generation
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// =====================================================
// Configuration
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? 'found' : 'missing');
  console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'found' : 'missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const NICHE_CONFIG_PATH = path.join(__dirname, '..', 'config', 'niche-keywords.json');
const PROGRESS_DIR = path.join(__dirname, '..', 'pipeline-progress');
const REPORTS_DIR = path.join(__dirname, '..', 'research-reports');

// Ensure directories exist
[PROGRESS_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// =====================================================
// Phase 1: Apify Scraping
// =====================================================

async function triggerApifyScrape(nicheConfig) {
  console.log(`\n🔍 PHASE 1: Scraping ${nicheConfig.displayName}...`);

  // TODO: Integrate with Apify API
  // For now, we'll assume videos are already scraped or will be scraped manually
  console.log(`   ℹ️  Apify scraping would be triggered here`);
  console.log(`   📋 Keywords: ${nicheConfig.searchTerms.slice(0, 3).join(', ')}...`);
  console.log(`   🎯 Target: ${nicheConfig.maxResults} videos`);
  console.log(`   ✅ Assuming videos are already in scraped_videos table with niche tag`);

  return {
    phase: 'scraping',
    niche: nicheConfig.niche,
    status: 'completed',
    message: 'Scraping phase completed (manual/existing data)'
  };
}

// =====================================================
// Phase 2: Transcription
// =====================================================

async function transcribeNicheVideos(nicheConfig) {
  console.log(`\n🎙️  PHASE 2: Transcribing ${nicheConfig.displayName} videos...`);

  // Get videos without transcripts for this niche
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('video_id, url, transcript_text')
    .or('transcript_text.is.null,transcript_text.eq.')
    .limit(nicheConfig.maxResults);

  if (error) {
    console.error('   ❌ Error fetching videos:', error.message);
    return { phase: 'transcription', niche: nicheConfig.niche, status: 'error', error: error.message };
  }

  const videosNeedingTranscription = videos || [];

  console.log(`   📊 Found ${videosNeedingTranscription.length} videos needing transcription`);

  if (videosNeedingTranscription.length === 0) {
    console.log(`   ✅ All videos already have transcripts`);
    return { phase: 'transcription', niche: nicheConfig.niche, status: 'completed', transcribed: 0 };
  }

  console.log(`   ℹ️  Transcription would be performed via API endpoint: POST /api/admin/transcribe`);
  console.log(`   ⏱️  Estimated time: ~${Math.ceil(videosNeedingTranscription.length * 2 / 60)} minutes (2 sec/video)`);
  console.log(`   💡 Run transcription manually or via separate script to avoid rate limits`);

  return {
    phase: 'transcription',
    niche: nicheConfig.niche,
    status: 'pending',
    videosNeedingTranscription: videosNeedingTranscription.length,
    message: 'Transcription needed - run transcribe-slow-safe.js'
  };
}

// =====================================================
// Phase 3: DPS Calculation
// =====================================================

async function calculateDPSForNiche(nicheConfig) {
  console.log(`\n📊 PHASE 3: Calculating DPS scores for ${nicheConfig.displayName}...`);

  // Get videos with transcripts but no DPS scores
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .not('transcript_text', 'is', null)
    .or('dps_score.is.null,dps_classification.is.null')
    .limit(nicheConfig.maxResults);

  if (error) {
    console.error('   ❌ Error fetching videos:', error.message);
    return { phase: 'dps', niche: nicheConfig.niche, status: 'error', error: error.message };
  }

  const videosNeedingDPS = videos || [];

  console.log(`   📊 Found ${videosNeedingDPS.length} videos needing DPS calculation`);

  if (videosNeedingDPS.length === 0) {
    console.log(`   ✅ All videos already have DPS scores`);
    return { phase: 'dps', niche: nicheConfig.niche, status: 'completed', calculated: 0 };
  }

  let successCount = 0;
  let errorCount = 0;

  // Process videos in cohorts
  const cohortMap = new Map(); // followerCount -> [videos]

  for (const video of videosNeedingDPS) {
    const followerCount = video.creator_followers_count || 0;
    const cohortKey = getCohortKey(followerCount);

    if (!cohortMap.has(cohortKey)) {
      cohortMap.set(cohortKey, []);
    }
    cohortMap.get(cohortKey).push(video);
  }

  console.log(`   📊 Processing ${cohortMap.size} cohorts...`);

  // Calculate DPS for each cohort
  for (const [cohortKey, cohortVideos] of cohortMap.entries()) {
    const [lowerBound, upperBound] = parseCohortKey(cohortKey);

    // Get all videos in this cohort for statistics
    const { data: allCohortVideos } = await supabase
      .from('scraped_videos')
      .select('views_count')
      .gte('creator_followers_count', lowerBound)
      .lte('creator_followers_count', upperBound);

    if (!allCohortVideos || allCohortVideos.length < 10) {
      console.log(`   ⚠️  Cohort ${cohortKey} has insufficient data (${allCohortVideos?.length || 0} videos) - skipping`);
      continue;
    }

    // Calculate cohort statistics
    const viewCounts = allCohortVideos.map(v => v.views_count);
    const cohortStats = calculateCohortStats(viewCounts);

    console.log(`   📊 Cohort ${cohortKey}: ${cohortVideos.length} videos, stats: mean=${Math.round(cohortStats.mean)}, stdDev=${Math.round(cohortStats.stdDev)}`);

    // Calculate DPS for each video in this cohort
    for (const video of cohortVideos) {
      try {
        const dpsResult = calculateDPSForVideo(video, cohortStats);

        // Update database
        const { error: updateError } = await supabase
          .from('scraped_videos')
          .update({
            dps_score: dpsResult.viralScore,
            dps_classification: dpsResult.classification,
            dps_percentile: dpsResult.percentileRank,
            dps_z_score: dpsResult.zScore,
            dps_confidence: dpsResult.confidence,
            dps_calculated_at: new Date().toISOString()
          })
          .eq('video_id', video.video_id);

        if (updateError) {
          console.error(`   ❌ Error updating video ${video.video_id}:`, updateError.message);
          errorCount++;
        } else {
          successCount++;

          // Log viral videos
          if (dpsResult.classification === 'viral' || dpsResult.classification === 'mega-viral') {
            console.log(`   🔥 ${dpsResult.classification.toUpperCase()}: ${video.video_id} - DPS ${dpsResult.viralScore.toFixed(1)} (z-score: ${dpsResult.zScore.toFixed(2)})`);
          }
        }
      } catch (err) {
        console.error(`   ❌ Error calculating DPS for video ${video.video_id}:`, err.message);
        errorCount++;
      }
    }
  }

  console.log(`   ✅ DPS calculation complete: ${successCount} success, ${errorCount} errors`);

  return {
    phase: 'dps',
    niche: nicheConfig.niche,
    status: 'completed',
    successCount,
    errorCount,
    cohorts: cohortMap.size
  };
}

// Helper: Get cohort key for grouping
function getCohortKey(followerCount) {
  const lowerBound = Math.floor(followerCount * 0.8);
  const upperBound = Math.ceil(followerCount * 1.2);
  return `${lowerBound}-${upperBound}`;
}

// Helper: Parse cohort key back to bounds
function parseCohortKey(cohortKey) {
  const [lower, upper] = cohortKey.split('-').map(Number);
  return [lower, upper];
}

// Helper: Calculate cohort statistics
function calculateCohortStats(values) {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, median: 0 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return { mean, stdDev, median };
}

// Helper: Calculate DPS for a single video
function calculateDPSForVideo(video, cohortStats) {
  const viewCount = video.views_count || 0;
  const likeCount = video.likes_count || 0;
  const commentCount = video.comments_count || 0;
  const shareCount = video.shares_count || 0;

  // Calculate z-score
  const zScore = cohortStats.stdDev === 0 ? 0 : (viewCount - cohortStats.mean) / cohortStats.stdDev;

  // Calculate engagement score
  const likeRate = viewCount > 0 ? likeCount / viewCount : 0;
  const commentRate = viewCount > 0 ? commentCount / viewCount : 0;
  const shareRate = viewCount > 0 ? shareCount / viewCount : 0;

  // TikTok weights: like=0.35, comment=0.30, share=0.35
  const engagementScore = (likeRate * 0.35 + commentRate * 0.30 + shareRate * 0.35) * 10;
  const clampedEngagement = Math.min(1.0, engagementScore);

  // Calculate decay factor (assume 24 hours old for now - adjust if scraped_at is available)
  const hoursOld = 24;
  const decayFactor = Math.exp(-0.5 * hoursOld / 100); // TikTok decay rate: 0.5

  // Calculate identity container score from caption
  const identityScore = video.caption ? calculateIdentityContainerScore(video.caption) : 50;

  // Calculate master viral score
  // Z-score: 55%, Engagement: 22%, Decay: 13%, Identity: 10%
  const zScoreNormalized = Math.max(0, Math.min(100, ((zScore + 3) / 6) * 100));

  const viralScore =
    (zScoreNormalized * 0.55) +
    (clampedEngagement * 100 * 0.22) +
    (decayFactor * 100 * 0.13) +
    (identityScore * 0.10);

  // Calculate percentile
  const percentileRank = zScoreToPercentile(zScore);

  // Classify
  let classification = 'normal';
  if (viralScore >= 80) classification = 'mega-viral';
  else if (viralScore >= 70) classification = 'viral';

  // Calculate confidence
  let confidence = 1.0;
  if (cohortStats.sampleSize < 100) confidence *= 0.7;
  else if (cohortStats.sampleSize < 500) confidence *= 0.85;

  return {
    viralScore: Math.max(0, Math.min(100, viralScore)),
    percentileRank,
    classification,
    zScore,
    confidence
  };
}

// Helper: Identity container score
function calculateIdentityContainerScore(caption) {
  if (!caption || caption.trim().length === 0) return 50;

  let score = 50;

  // Personal pronouns (+20)
  const pronouns = (caption.match(/\b(I|my|me|mine|we|our|us)\b/gi) || []).length;
  score += Math.min(20, pronouns * 5);

  // Questions (+15)
  const questions = (caption.match(/\?/g) || []).length;
  score += Math.min(15, questions * 7.5);

  // Emojis (+10)
  const emojis = (caption.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  score += Math.min(10, emojis * 2);

  // Excessive hashtags (-20)
  const hashtags = (caption.match(/#/g) || []).length;
  if (hashtags > 5) score -= Math.min(20, (hashtags - 5) * 4);

  return Math.max(0, Math.min(100, score));
}

// Helper: Z-score to percentile
function zScoreToPercentile(zScore) {
  const clampedZ = Math.max(-5, Math.min(5, zScore));
  const t = 1 / (1 + 0.2316419 * Math.abs(clampedZ));
  const d = 0.3989423 * Math.exp(-clampedZ * clampedZ / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  const percentile = clampedZ >= 0 ? (1 - probability) * 100 : probability * 100;
  return Math.max(0, Math.min(100, percentile));
}

// =====================================================
// Phase 4: Pattern Extraction
// =====================================================

async function extractPatternsForNiche(nicheConfig) {
  console.log(`\n🔬 PHASE 4: Extracting patterns for ${nicheConfig.displayName}...`);

  // Get viral videos (DPS >= 70)
  const { data: viralVideos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .gte('dps_score', 70)
    .not('transcript_text', 'is', null)
    .order('dps_score', { ascending: false })
    .limit(100); // Top 100 viral videos

  if (error) {
    console.error('   ❌ Error fetching viral videos:', error.message);
    return { phase: 'patterns', niche: nicheConfig.niche, status: 'error', error: error.message };
  }

  if (!viralVideos || viralVideos.length === 0) {
    console.log(`   ⚠️  No viral videos found for pattern extraction`);
    return { phase: 'patterns', niche: nicheConfig.niche, status: 'completed', patterns: 0 };
  }

  console.log(`   📊 Analyzing ${viralVideos.length} viral videos...`);
  console.log(`   ℹ️  Pattern extraction would call FEAT-003 extractFeatures()`);
  console.log(`   💡 This requires OpenAI API integration - placeholder for now`);

  // TODO: Call actual pattern extraction
  // const patterns = await extractFeatures(viralVideos);

  return {
    phase: 'patterns',
    niche: nicheConfig.niche,
    status: 'completed',
    viralVideos: viralVideos.length,
    message: 'Pattern extraction ready - integrate FEAT-003'
  };
}

// =====================================================
// Phase 5: Knowledge Extraction
// =====================================================

async function extractKnowledgeForNiche(nicheConfig) {
  console.log(`\n🧠 PHASE 5: Extracting knowledge for ${nicheConfig.displayName}...`);

  console.log(`   ℹ️  Knowledge extraction would call FEAT-060 GPT Knowledge Engine`);
  console.log(`   💡 Multi-LLM consensus analysis - placeholder for now`);

  return {
    phase: 'knowledge',
    niche: nicheConfig.niche,
    status: 'completed',
    message: 'Knowledge extraction ready - integrate FEAT-060'
  };
}

// =====================================================
// Phase 6: Research Report Generation
// =====================================================

async function generateResearchReport(nicheConfig) {
  console.log(`\n📄 PHASE 6: Generating research report for ${nicheConfig.displayName}...`);

  // Get viral videos statistics
  const { data: viralVideos, error: viralError } = await supabase
    .from('scraped_videos')
    .select('dps_score, dps_classification, creator_followers_count, views_count, video_id')
    .gte('dps_score', 70)
    .order('dps_score', { ascending: false });

  const { data: allVideos, error: allError } = await supabase
    .from('scraped_videos')
    .select('dps_score')
    .not('dps_score', 'is', null);

  if (viralError || allError) {
    console.error('   ❌ Error fetching report data');
    return { phase: 'report', niche: nicheConfig.niche, status: 'error' };
  }

  // Calculate statistics
  const totalVideos = allVideos?.length || 0;
  const viralCount = viralVideos?.length || 0;
  const megaViralCount = viralVideos?.filter(v => v.dps_classification === 'mega-viral').length || 0;

  const avgDPS = totalVideos > 0
    ? allVideos.reduce((sum, v) => sum + (v.dps_score || 0), 0) / totalVideos
    : 0;

  // Cohort distribution
  const cohortDistribution = {
    'micro (0-10K followers)': viralVideos?.filter(v => v.creator_followers_count < 10000).length || 0,
    'small (10K-100K)': viralVideos?.filter(v => v.creator_followers_count >= 10000 && v.creator_followers_count < 100000).length || 0,
    'medium (100K-1M)': viralVideos?.filter(v => v.creator_followers_count >= 100000 && v.creator_followers_count < 1000000).length || 0,
    'large (1M+)': viralVideos?.filter(v => v.creator_followers_count >= 1000000).length || 0,
  };

  const report = {
    niche: nicheConfig.niche,
    displayName: nicheConfig.displayName,
    generatedAt: new Date().toISOString(),
    searchTerms: nicheConfig.searchTerms,
    hashtags: nicheConfig.hashtags,
    statistics: {
      totalVideosScraped: totalVideos,
      viralVideosFound: viralCount,
      megaViralVideosFound: megaViralCount,
      viralityRate: totalVideos > 0 ? (viralCount / totalVideos * 100).toFixed(1) + '%' : '0%',
      avgDPS: avgDPS.toFixed(1),
      cohortDistribution
    },
    insights: {
      topPerformingCohort: Object.entries(cohortDistribution).sort((a, b) => b[1] - a[1])[0][0],
      message: 'Pattern and knowledge extraction needed for detailed insights'
    },
    recommendations: [
      'Complete pattern extraction (FEAT-003) to identify viral hooks and structures',
      'Complete knowledge extraction (FEAT-060) for multi-LLM consensus insights',
      'Analyze top 10 viral videos manually for immediate learnings'
    ],
    topVideos: viralVideos?.slice(0, 10).map(v => ({
      video_id: v.video_id,
      dps_score: v.dps_score,
      classification: v.dps_classification,
      views: v.views_count,
      followers: v.creator_followers_count
    })) || []
  };

  // Save report
  const reportPath = path.join(REPORTS_DIR, `${nicheConfig.niche}-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`   ✅ Report generated: ${reportPath}`);
  console.log(`   📊 Summary:`);
  console.log(`      - Total videos: ${totalVideos}`);
  console.log(`      - Viral videos: ${viralCount} (${report.statistics.viralityRate})`);
  console.log(`      - Mega-viral: ${megaViralCount}`);
  console.log(`      - Average DPS: ${avgDPS.toFixed(1)}`);
  console.log(`      - Top cohort: ${report.insights.topPerformingCohort}`);

  return {
    phase: 'report',
    niche: nicheConfig.niche,
    status: 'completed',
    reportPath,
    statistics: report.statistics
  };
}

// =====================================================
// Main Orchestration
// =====================================================

async function runResearchPipeline(nicheConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Starting viral research pipeline for: ${nicheConfig.displayName}`);
  console.log(`${'='.repeat(60)}`);

  const results = {
    niche: nicheConfig.niche,
    displayName: nicheConfig.displayName,
    startedAt: new Date().toISOString(),
    phases: {}
  };

  try {
    // Phase 1: Scraping
    results.phases.scraping = await triggerApifyScrape(nicheConfig);

    // Phase 2: Transcription
    results.phases.transcription = await transcribeNicheVideos(nicheConfig);

    // Phase 3: DPS Calculation
    results.phases.dps = await calculateDPSForNiche(nicheConfig);

    // Phase 4: Pattern Extraction
    results.phases.patterns = await extractPatternsForNiche(nicheConfig);

    // Phase 5: Knowledge Extraction
    results.phases.knowledge = await extractKnowledgeForNiche(nicheConfig);

    // Phase 6: Report Generation
    results.phases.report = await generateResearchReport(nicheConfig);

    results.completedAt = new Date().toISOString();
    results.status = 'completed';

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Pipeline complete for: ${nicheConfig.displayName}`);
    console.log(`${'='.repeat(60)}`);

  } catch (err) {
    console.error(`\n❌ Pipeline failed for ${nicheConfig.displayName}:`, err.message);
    results.status = 'error';
    results.error = err.message;
    results.completedAt = new Date().toISOString();
  }

  // Save progress
  const progressPath = path.join(PROGRESS_DIR, `${nicheConfig.niche}-progress.json`);
  fs.writeFileSync(progressPath, JSON.stringify(results, null, 2));

  return results;
}

async function runAllNiches() {
  console.log('🌐 Loading niche configurations...');

  const nicheConfigs = JSON.parse(fs.readFileSync(NICHE_CONFIG_PATH, 'utf-8'));
  console.log(`📊 Found ${nicheConfigs.length} niches\n`);

  const allResults = [];

  for (const nicheConfig of nicheConfigs) {
    const result = await runResearchPipeline(nicheConfig);
    allResults.push(result);

    // Small delay between niches
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate master summary
  const summary = {
    totalNiches: nicheConfigs.length,
    completed: allResults.filter(r => r.status === 'completed').length,
    failed: allResults.filter(r => r.status === 'error').length,
    generatedAt: new Date().toISOString(),
    results: allResults
  };

  const summaryPath = path.join(REPORTS_DIR, 'master-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 ALL NICHES COMPLETE`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Completed: ${summary.completed}/${summary.totalNiches}`);
  console.log(`❌ Failed: ${summary.failed}/${summary.totalNiches}`);
  console.log(`📄 Master summary: ${summaryPath}`);
  console.log(`${'='.repeat(60)}\n`);
}

// =====================================================
// CLI Entry Point
// =====================================================

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  node orchestrate-viral-research.js all              # Run all niches');
  console.log('  node orchestrate-viral-research.js <niche-name>     # Run single niche');
  console.log('\nAvailable niches:');
  const configs = JSON.parse(fs.readFileSync(NICHE_CONFIG_PATH, 'utf-8'));
  configs.forEach(c => console.log(`  - ${c.niche} (${c.displayName})`));
  process.exit(0);
}

if (args[0] === 'all') {
  runAllNiches().catch(console.error);
} else {
  const nicheConfigs = JSON.parse(fs.readFileSync(NICHE_CONFIG_PATH, 'utf-8'));
  const niche = nicheConfigs.find(c => c.niche === args[0]);

  if (!niche) {
    console.error(`❌ Niche "${args[0]}" not found`);
    process.exit(1);
  }

  runResearchPipeline(niche).catch(console.error);
}
