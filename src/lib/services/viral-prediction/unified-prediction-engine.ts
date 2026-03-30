/**
 * UNIFIED VIRAL PREDICTION ENGINE
 * 
 * This module consolidates all viral prediction scoring logic into a single,
 * reusable engine that combines:
 * - Dynamic Percentile System (DPS) with z-score methodology
 * - Framework-based scoring (40+ viral frameworks)
 * - God Mode psychological/production enhancements
 * - Platform-specific optimizations
 * - Engagement velocity analysis
 * 
 * INPUT: Standardized video features, engagement metrics, and platform context
 * OUTPUT: Comprehensive viral prediction with score, probability, confidence, and breakdown
 * 
 * DEPENDENCIES:
 * - Used by: Template Editor, Studio Dashboard, API prediction endpoints
 * - Database: Requires cohort statistics and historical data
 * - External: Platform-specific decay rates and thresholds
 */

import { createClient } from '@supabase/supabase-js';
import { startOfISOWeek, format } from 'date-fns';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, logSupabaseRuntimeEnv } from '@/lib/env';
import { PLATFORM_WEIGHTS as CFG_PLATFORM_WEIGHTS, COMPONENT_WEIGHTS as CFG_COMPONENT_WEIGHTS, VIRAL_PERCENTILE_THRESHOLDS } from '@/config/viral-thresholds';
import { classifyIncubation, IncubationLabel } from './incubation-classifier';
import { simulateAudience } from '@/lib/simulator/audience';
import { computeQualityFactor } from '@/lib/quality/anti_gaming';
import { classifySafety } from '@/lib/safety/brand_policy';
import { detectLanguage } from '@/lib/i18n/lang';
import { FEATURE_SCHEMA_V1 } from '@/lib/features/schema'
import { writeFeatures } from '@/lib/features/store'
import { runQualityChecks } from '@/lib/features/quality_gate'

// ===== TYPE DEFINITIONS =====

export interface PredictionInput {
  // Video Metrics
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  
  // Creator Context
  followerCount: number;
  creatorAuthority?: number; // 0-1 scale
  
  // Platform Context
  platform: 'tiktok' | 'instagram' | 'youtube';
  hoursSinceUpload: number;
  
  // Content Features (optional - used for enhanced scoring)
  contentFeatures?: {
    emotionalArousal?: number; // 0-100 scale
    productionQuality?: number; // 0-100 scale
    culturalRelevance?: number; // 0-100 scale
    authenticityScore?: number; // 0-100 scale
    hookStrength?: number; // 0-100 scale
    narrativeStructure?: number; // 0-100 scale
  };
  
  // Framework Scores (optional - from framework parser)
  frameworkScores?: {
    overallScore: number; // 0-1 scale
    topFrameworks: Array<{
      name: string;
      score: number;
      weight: number;
    }>;
  };
}

export interface PredictionOutput {
  // Core Scores
  viralScore: number; // 0-100 scale (final score)
  viralProbability: number; // 0-1 scale (probability of going viral)
  confidence: number; // 0-1 scale (prediction confidence)
  calibratedProbability?: number; // 0-1 scale after calibration
  incubationLabel?: IncubationLabel;
  
  // Classification
  classification: {
    category: 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal';
    percentile: number; // 0-100 scale
    threshold: string;
  };
  
  // Component Breakdown
  breakdown: {
    zScore: number;
    zScoreNormalized: number; // 0-1 scale
    engagementScore: number; // 0-1 scale
    platformWeight: number;
    decayFactor: number;
    godModeMultiplier?: number; // Applied if content features provided
    frameworkContribution?: number; // Applied if framework scores provided
    timingScore?: number;
    personalizationFactor?: number;
  };
  
  // Predictions
  predictions: {
    predictedViews: {
      pessimistic: number;
      realistic: number;
      optimistic: number;
    };
    predictedEngagement: number; // 0-1 scale
    peakTimeframe: string;
  };
  
  // Meta Information
  meta: {
    cohortSize: number;
    dataQuality: 'high' | 'medium' | 'low';
    modelVersion: string;
    cohortVersion?: string;
    processingTime: number; // milliseconds
    calibrationVersion?: string;
  };
}

// ===== CONSTANTS =====

const PLATFORM_WEIGHTS = {
  tiktok: CFG_PLATFORM_WEIGHTS.tiktok,
  instagram: CFG_PLATFORM_WEIGHTS.instagram,
  youtube: CFG_PLATFORM_WEIGHTS.youtube
};

const PLATFORM_DECAY_RATES = {
  tiktok: 0.5,    // Steep decay
  instagram: 0.3, // Moderate decay  
  youtube: 0.1    // Gradual decay
};

const VIRAL_THRESHOLDS = {
  tiktok: 0.06,    // >6% engagement for viral
  instagram: 0.03, // >3% engagement for viral
  youtube: 0.05    // >5% engagement for viral
};

const ENGAGEMENT_WEIGHTS = {
  tiktok: { like: 1, comment: 2, share: 3 },
  instagram: { like: 1, comment: 2, share: 2.5 },
  youtube: { like: 1, comment: 1.5, share: 2 }
};

const COMPONENT_WEIGHTS = CFG_COMPONENT_WEIGHTS;

const MODEL_VERSION = '3.1.0';

// ===== MAIN ENGINE CLASS =====

export class UnifiedPredictionEngine {
  private supabase: any;
  
  constructor() {
    logSupabaseRuntimeEnv();
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  /**
   * MAIN PREDICTION METHOD
   * Orchestrates all scoring components to generate comprehensive viral prediction
   */
  async predict(input: PredictionInput): Promise<PredictionOutput> {
    const startTime = Date.now();
    
    try {
      // 1. Get cohort statistics for z-score calculation (regional if available)
      const cohortStats = await this.getCohortStatistics(input.followerCount, input.platform);
      
      // 2. Persist features to feature_store and run quality gate
      try {
        const vec = [input.viewCount, input.likeCount, input.commentCount, input.shareCount, input.followerCount, input.hoursSinceUpload]
        const q = await runQualityChecks(vec, FEATURE_SCHEMA_V1)
        await writeFeatures((input as any)?.videoId || (input as any)?.video_id || 'ad-hoc', {
          viewCount: input.viewCount,
          likeCount: input.likeCount,
          commentCount: input.commentCount,
          shareCount: input.shareCount,
          followerCount: input.followerCount,
          hoursSinceUpload: input.hoursSinceUpload
        }, q)
        if (!q.pass) {
          // mark factor and apply 0.95 down-weight later
          ;(globalThis as any).__feature_quality_fail = true
        } else {
          ;(globalThis as any).__feature_quality_fail = false
        }
      } catch {}

      // 3. Calculate core statistical components
      const zScore = this.calculateZScore(input.viewCount, cohortStats);
      const zScoreNormalized = this.normalizeZScore(zScore);
      const percentile = this.zScoreToPercentile(zScore);
      
      // 3. Calculate engagement score
      const engagementScore = this.calculateEngagementScore(input);
      
      // 4. Calculate platform and time factors
      const platformWeight = PLATFORM_WEIGHTS[input.platform];
      const decayFactor = this.calculateDecayFactor(input.hoursSinceUpload, input.platform);
      
      // 4b. Locale detection for regional baselines and normalization
      let locale = { lang: 'en', country: 'US', confidence: 1.0 } as any
      try {
        locale = detectLanguage({ caption: (input as any)?.caption, transcript: (input as any)?.transcript, hashtags: (input as any)?.hashtags || [], soundTitle: (input as any)?.soundTitle })
      } catch {}

      // 5. Calculate base viral score using master formula
      const baseViralScore = this.calculateBaseViralScore({
        zScoreNormalized,
        engagementScore,
        platformWeight,
        decayFactor
      });
      
      // 6. Apply enhancements if available
      let enhancedScore = baseViralScore;
      let godModeMultiplier = 1.0;
      let frameworkContribution = 0;
      let transcriptHookBonus = 0; // max +0.05 (→ +5 pts after scaling)
      
      if (input.contentFeatures) {
        godModeMultiplier = this.calculateGodModeMultiplier(input.contentFeatures);
        enhancedScore *= godModeMultiplier;
      }
      
      if (input.frameworkScores) {
        frameworkContribution = this.calculateFrameworkContribution(input.frameworkScores);
        enhancedScore = (enhancedScore * 0.7) + (frameworkContribution * 0.3);
      }

      // 6a. Transcript-derived features + hook DSL matching
      try {
        const vid = (input as any)?.videoId || (input as any)?.video_id || ''
        if (vid) {
          const { createClient } = await import('@supabase/supabase-js')
          const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import('@/lib/env')
          const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
          const { data: trs } = await db.from('video_transcripts').select('lang,text').eq('video_id', vid).order('created_at', { ascending: false }).limit(5)
          const caption = (input as any)?.caption || ''
          const text = [caption, ...((trs||[]).map((t:any)=> String((t?.text)||'')))].join(' ').slice(0, 50000)
          const { extractScriptFeatures } = await import('@/lib/transcripts/text_features')
          const feats = extractScriptFeatures(text)
          // Bonus up to +0.05 raw (≈ +5 pts after *100)
          transcriptHookBonus = Math.max(0, Math.min(0.05, feats.hook_match_strength * 0.05 + feats.cta_intent * 0.02 + feats.claim_strength * 0.02))
          enhancedScore = enhancedScore + transcriptHookBonus
          ;(globalThis as any).__transcript_features = feats
        }
      } catch {}
      
      // 6b. Apply alignment factor from telemetry if present in DB
      let alignmentFactor = 1.0;
      let telemetrySnapshot: any = null;
      try {
        const latestTelemetry = await this.fetchLatestFirstHourTelemetry(input);
        if (latestTelemetry && latestTelemetry.expectedProfile) {
          const { computeAlignmentFactor } = await import('@/lib/frameworks/mapping_guide');
          const comp = computeAlignmentFactor(latestTelemetry.points, latestTelemetry.expectedProfile);
          alignmentFactor = Math.max(0.85, Math.min(1.15, comp.alignmentFactor)); // clamp [0.85, 1.15]
          telemetrySnapshot = { alignmentFactor, details: comp.details, pointsCount: latestTelemetry.points?.length || 0 };
        }
      } catch {}

      // TimingScore from trend nowcast (per niche)
      let timingScore = 1.0;
      try {
        const timing = await this.computeTimingScore(input);
        timingScore = Math.max(0.9, Math.min(1.12, timing)); // clamp [0.9, 1.12]
      } catch {}

      // Personalization: creator fingerprinting factor
      let personalizationFactor = 1.0;
      try {
        personalizationFactor = Math.max(0.9, Math.min(1.12, await this.computePersonalizationFactor(input)));
      } catch {}

      // 6c. Audience simulator factor
      let simulatorSnapshot: any = null;
      let simulatorFactor = 1.0;
      try {
        const tokens: string[] = ((input as any)?.frameworkScores?.tokens) || [];
        const audience = simulateAudience({
          niche: (input as any)?.niche || 'general',
          cohort: (input as any)?.cohort || 'default',
          platform: input.platform as any,
          tokens,
          frameworkProfile: { overallScore: Math.max(0, Math.min(1, (input as any)?.frameworkScores?.overallScore ?? 0.6)) },
          timingScore,
          personalizationFactor,
          impressions: 10000,
          videoFeatures: {
            hookStrength: Math.max(0, Math.min(1, (input as any)?.contentFeatures?.hookStrength ?? 0.6)),
            durationSeconds: Math.max(5, Math.min(120, (input as any)?.durationSeconds ?? 22))
          }
        });
        const simScore = audience.sim_score || 1.0;
        simulatorFactor = Math.max(0.92, Math.min(1.12, simScore));
        simulatorSnapshot = audience;
      } catch {}

      // 6d. Commerce: compute RevenueScore later after probability

      // 7. Generate final scores and classification with alignment, timing, personalization, simulator, and distribution
      // Locale factor (regional robustness): clamp [0.95, 1.05]
      let localeFactor = 1.0
      try {
        // Simple heuristic: modest boost if not default country due to novelty, else neutral
        localeFactor = locale.country && locale.country !== 'US' ? 1.03 : 1.0
        localeFactor = Math.max(0.95, Math.min(1.05, localeFactor))
      } catch {}
      let baseFinalViralScore = Math.min(enhancedScore * alignmentFactor * timingScore * personalizationFactor * simulatorFactor * localeFactor * 100, 100);
      if ((globalThis as any).__feature_quality_fail) {
        baseFinalViralScore = Math.min(100, baseFinalViralScore * 0.95) // FEATURE_QUALITY_FAIL_DOWNWEIGHT
      }
      const baseProbability = this.calculateViralProbability(baseFinalViralScore, percentile);
      // Distribution factor from partner signals
      let distributionFactor = 1.0;
      try {
        distributionFactor = await this.computeDistributionFactor(input);
      } catch {}
      distributionFactor = Math.max(0.90, Math.min(1.12, distributionFactor));
      // Format routing and weighting
      let fmt: string = (input as any)?.format || 'short_video'
      try {
        if (!fmt) {
          const { detectFormat } = await import('@/lib/formats/detection')
          fmt = detectFormat(input)
        }
      } catch {}
      if (fmt === 'carousel') {
        try {
          const { extractCarouselFeatures } = await import('@/lib/features/format_features')
          const ff = extractCarouselFeatures(input)
          const slideBoost = Math.min(1.15, 1.0 + Math.min(0.15, (ff.slide_count||0) * 0.01))
          const lingerBoost = 1.0 + Math.min(0.10, ff.swipe_linger_proxy * 0.10)
          const formatFactor = Math.max(0.92, Math.min(1.15, slideBoost * lingerBoost))
          enhancedScore *= formatFactor
          ;(globalThis as any).__format_breakdown = { type: 'carousel', slideBoost, lingerBoost, formatFactor }
        } catch {}
      } else if (fmt === 'long_video_3m') {
        try {
          const { extractLong3mFeatures } = await import('@/lib/features/format_features')
          const lf = extractLong3mFeatures(input)
          const retWeight = (Math.max(0, lf.ret_30s||0) * 0.3) + (Math.max(0, lf.ret_60s||0) * 0.35) + (Math.max(0, lf.ret_180s||0) * 0.35)
          const buildAllowance = 1.0 + Math.min(0.15, retWeight * 0.15)
          const formatFactor = Math.max(0.90, Math.min(1.15, buildAllowance))
          enhancedScore *= formatFactor
          const smootherDecay = 0.98
          enhancedScore *= smootherDecay
          ;(globalThis as any).__format_breakdown = { type: 'long_video_3m', buildAllowance, smootherDecay, formatFactor }
        } catch {}
      } else {
        ;(globalThis as any).__format_breakdown = { type: 'short_video' }
      }

      // Apply calibration layer per platform+niche(+format)
      let viralProbability = baseProbability;
      let calibrationVersion: string | null = null;
      try {
        const { applyCalibration } = await import('@/lib/calibration/calibration');
        const niche = (input as any)?.niche || 'general';
        const applied = await applyCalibration(baseProbability, input.platform, niche, fmt);
        viralProbability = applied.calibrated;
        calibrationVersion = applied.version;
      } catch {}
      // Tighter confidence if aligned near 1.0
      const baseConfidence = this.calculateConfidence(input, cohortStats);
      let confidence = Math.max(0, Math.min(1, baseConfidence * (1 - Math.min(0.15, Math.abs(1 - alignmentFactor)))));
      const classification = this.classifyResult(percentile, zScore);
      
      // 7b. Incubation classification (with hourly series accel)
      const hours = Math.max(1, input.hoursSinceUpload);
      let likesPerHour = input.likeCount / hours;
      let commentsPerHour = input.commentCount / hours;
      let sharesPerHour = input.shareCount / hours;
      let accel = 0;
      try {
        const vid = (input as any)?.videoId || (input as any)?.video_id || ''
        if (vid) {
          const { getVideoHourlySeries } = await import('@/lib/video/hourly')
          const series = await getVideoHourlySeries(vid, 8)
          if (Array.isArray(series) && series.length>=3) {
            const lr: number[] = []
            for (let i=0;i<series.length;i++) {
              const h = series[i]
              const prev = i>0? series[i-1] : series[i]
              const dLikes = Math.max(0, (h.likes||0) - (prev.likes||0))
              lr.push(dLikes)
            }
            // Simple moving average smoothing (window 3)
            const sm: number[] = []
            for (let i=0;i<lr.length;i++) {
              const a = lr[Math.max(0,i-1)]||0, b = lr[i]||0, c = lr[Math.min(lr.length-1,i+1)]||0
              sm.push((a+b+c)/3)
            }
            likesPerHour = sm[sm.length-1] || likesPerHour
            const a1 = sm[sm.length-1]||0, a0 = sm[sm.length-2]||0
            accel = (a1 - a0) / Math.max(1, a0)
          }
        }
      } catch {}
      const frameworkMatch = Math.max(0, Math.min(1, input.frameworkScores?.overallScore ?? 0));
      const trendSimilarity = frameworkMatch; // fallback: reuse framework score if no explicit trend sim available
      const incubationLabel = classifyIncubation({
        hoursSinceUpload: input.hoursSinceUpload,
        cohortPercentile: percentile,
        likesPerHour,
        sharesPerHour,
        commentsPerHour,
        accel,
        trendSimilarity,
        frameworkMatch
      });
      
      // Active learning queue: low confidence or disagreement between base and calibrated
      try {
        const disagreement = Math.abs(baseProbability - viralProbability)
        if (confidence < 0.45 || disagreement > 0.12) {
          await this.supabase.from('active_label_queue').insert({
            prediction_id: (input as any)?.videoId || (input as any)?.id || null,
            platform: input.platform,
            niche: (input as any)?.niche || 'general',
            probability: viralProbability,
            confidence,
            disagreement,
            status: 'pending',
            metadata: { baseProbability, percentile, zScore }
          } as any)
        }
      } catch {}
      
      // 7e. Anti-gaming quality factor (Moat E)
      let qualityFactor = 1.0
      let qualityFlags: string[] = []
      let qualitySnapshot: any = null
      try {
        const q = computeQualityFactor({
          videoId: (input as any)?.videoId || (input as any)?.video_id,
          platform: input.platform as any,
          viewCount: input.viewCount,
          likeCount: input.likeCount,
          commentCount: input.commentCount,
          shareCount: input.shareCount,
          hoursSinceUpload: input.hoursSinceUpload,
          window: (input as any)?.window,
          referrers: (input as any)?.referrers || []
        })
        qualityFactor = q.qualityFactor
        qualityFlags = q.flags
        qualitySnapshot = q.snapshot
      } catch {}

      const finalViralScore = Math.min(100, Math.max(0, baseFinalViralScore * qualityFactor)) // QUALITY_FACTOR_APPLIED

      // 8. Generate predictions
      const predictions = this.generatePredictions(viralProbability * distributionFactor, input);

      // 8c. Completion proxy from telemetry or heuristic
      let completion_proxy = 0
      let completion_source = 'none'
      try {
        const latest = await this.fetchLatestFirstHourTelemetry(input)
        if (latest && Array.isArray(latest.points) && latest.points.length) {
          const last = latest.points[latest.points.length-1]
          const pct = Number(last.avg_watch_pct || 0) * 100
          completion_proxy = Math.min(1, Math.max(0, pct/100))
          completion_source = 'telemetry'
        } else {
          // Heuristic: use framework tokens and simple duration proxy
          const tokens: string[] = ((input as any)?.frameworkScores?.tokens) || []
          const hasCuts = tokens.some(t => /cut|montage|jump|b_roll/i.test(String(t)))
          const dur = Math.max(5, Math.min(120, (input as any)?.durationSeconds || 22))
          const base = dur <= 20 ? 0.62 : dur <= 40 ? 0.55 : 0.48
          const lift = hasCuts ? 0.06 : 0.0
          completion_proxy = Math.min(1, Math.max(0, base + lift))
          completion_source = 'heuristic'
        }
      } catch {}

      // 8a. Brand-safety & policy guard (Moat F)
      let safetySnapshot: any = null
      try {
        const safety = classifySafety({
          caption: (input as any)?.caption || '',
          transcript: (input as any)?.transcript || '',
          soundTokens: (input as any)?.soundTokens || [],
          hashtags: (input as any)?.hashtags || [],
          frameworkTokens: (input as any)?.frameworkScores?.tokens || []
        })
        safetySnapshot = safety
        if (safety.policy_risk === 'high' || safety.brand_safety === 'MA') {
          confidence = Math.max(0, Math.min(1, confidence * 0.90)) // SAFETY_CONFIDENCE_GATE
        }
      } catch {}

      // 8b. Compute RevenueScore and snapshot
      let commerceSnapshot: any = null;
      try {
        const niche = (input as any)?.niche || 'general';
        const expectedConversionPrior = (n: string) => ({ general: 0.02, beauty: 0.03, gadgets: 0.025 } as any)[n] || 0.02;
        const expectedAOV = (n: string) => ({ general: 45, beauty: 35, gadgets: 60 } as any)[n] || 45;
        const revenueScore = Math.max(0, viralProbability) * expectedConversionPrior(niche) * expectedAOV(niche);
        const { createClient } = await import('@supabase/supabase-js')
        const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import('@/lib/env')
        const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        const vid = (input as any)?.videoId || (input as any)?.video_id || ''
        let clicks = 0, orders = 0, revenue = 0
        if (vid) {
          const { data } = await db.from('attribution').select('clicks,orders,revenue').eq('video_id', vid).limit(1)
          if (Array.isArray(data) && data.length) { clicks = Number(data[0].clicks||0); orders = Number(data[0].orders||0); revenue = Number(data[0].revenue||0) }
        }
        const revenue_lift_estimate = Math.round(revenueScore * 100) / 100 * 100 // scaled to dollars-like signal
        commerceSnapshot = { clicks, orders, revenue, revenue_score: Number(revenueScore.toFixed(2)), revenue_lift_estimate }
      } catch {}
      
      // 9. Assess data quality
      const dataQuality = this.assessDataQuality(input, cohortStats);
      
      const processingTime = Date.now() - startTime;
      const cohortVersion = format(startOfISOWeek(new Date()), "yyyy'W'II");
      
      const output: PredictionOutput = {
        viralScore: Math.round(finalViralScore * 100) / 100,
        viralProbability: Math.round(baseProbability * 10000) / 10000,
        calibratedProbability: Math.round(viralProbability * 10000) / 10000,
        confidence: Math.round(confidence * 10000) / 10000,
        incubationLabel,
        classification,
        breakdown: {
          zScore: Math.round(zScore * 1000) / 1000,
          zScoreNormalized: Math.round(zScoreNormalized * 1000) / 1000,
          engagementScore: Math.round(engagementScore * 1000) / 1000,
          platformWeight,
          decayFactor: Math.round(decayFactor * 1000) / 1000,
          godModeMultiplier: input.contentFeatures ? Math.round(godModeMultiplier * 1000) / 1000 : undefined,
          frameworkContribution: input.frameworkScores ? Math.round(frameworkContribution * 1000) / 1000 : undefined,
          timingScore: Math.round(timingScore * 1000) / 1000,
          personalizationFactor: Math.round(personalizationFactor * 1000) / 1000
        },
        predictions,
        meta: {
          cohortSize: cohortStats.sampleSize,
          dataQuality,
          modelVersion: MODEL_VERSION,
          cohortVersion,
          processingTime,
          telemetrySnapshot,
          timingSnapshot: { timingScore },
          creatorSnapshot: { personalizationFactor },
          distributionSnapshot: { distributionFactor },
          calibrationVersion,
          simulatorSnapshot,
          commerceSnapshot,
          qualitySnapshot,
          qualityFactor,
          qualityFlags,
          featureQualityFail: Boolean((globalThis as any).__feature_quality_fail),
          localeSnapshot: locale,
          localeFactor,
          safetySnapshot,
          transcriptFeatures: (globalThis as any).__transcript_features || null,
          completion_proxy,
          completion_source
        },
        // format annotations
        // @ts-ignore - extend output
        format: fmt,
        // @ts-ignore
        format_breakdown: (globalThis as any).__format_breakdown || null
      };

      // ===== AUDIT TRAIL: deterministic digests and signature =====
      try {
        const { ensureAuditTables, sha256Hex, hmacSignHex } = await import('@/lib/audit/audit_utils')
        await ensureAuditTables()
        const featuresRaw = JSON.stringify({ input, topFrameworks: (input as any)?.frameworkScores?.top3 || null, tokens: (input as any)?.frameworkScores?.tokens || [] })
        const outputsRaw = JSON.stringify({ score: output.viralScore, prob: output.viralProbability, label: incubationLabel, distributionFactor })
        const inputs_digest = sha256Hex(featuresRaw)
        const outputs_digest = sha256Hex(outputsRaw)
        const auditSeed = sha256Hex(`${inputs_digest}|${outputs_digest}|${MODEL_VERSION}`)
        const key = process.env.AUDIT_HMAC_KEY || process.env.NEXTAUTH_SECRET || 'local-dev'
        const signature = hmacSignHex(auditSeed, key)
        const token_lifts = { frameworkContribution } as any
        try {
          await this.supabase.from('predictions_audit').upsert({
            prediction_id: (input as any)?.id || (input as any)?.videoId || `${Date.now()}`,
            model_version: MODEL_VERSION,
            cohort_version: cohortVersion,
            inputs_digest,
            outputs_digest,
            token_lifts,
            timing_score: timingScore,
            personalization_factor: personalizationFactor,
            alignment_factor: alignmentFactor,
            signed_at: new Date().toISOString(),
            signature
          } as any)
        } catch {}
      } catch {}

      // 9b. Persist quality flags + snapshot (best-effort)
      try {
        const db = this.supabase
        try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists quality_flags (id bigserial primary key, video_id text, flag text, score numeric, ts timestamptz default now());" }) } catch {}
        const vid = (input as any)?.videoId || (input as any)?.video_id || null
        if (vid && Array.isArray(qualityFlags) && qualityFlags.length) {
          for (const f of qualityFlags) {
            try { await db.from('quality_flags').insert({ video_id: vid, flag: f, score: qualityFactor } as any) } catch {}
          }
        }
        // Attach snapshot to predictions table if column exists
        if (vid) {
          try { await (db as any).rpc?.('exec_sql', { query: "alter table if exists predictions add column if not exists quality_snapshot jsonb;" }) } catch {}
          try { await db.from('predictions').update({ quality_snapshot: qualitySnapshot } as any).eq('video_id', vid) } catch {}
          // Persist bandit snapshot if exists on predictions table
          try { await (db as any).rpc?.('exec_sql', { query: "alter table if exists predictions add column if not exists bandit_snapshot jsonb;" }) } catch {}
          try {
            const { data: p } = await db.from('predictions').select('bandit_snapshot').eq('video_id', vid).limit(1)
            // no-op: placeholder to ensure column exists; actual snapshot written by /api/bandit/allocate
          } catch {}
        }
      } catch {}

      return output;
      
    } catch (error) {
      // Fallback to heuristic prediction if database fails
      console.warn('Database prediction failed, using heuristic fallback:', error);
      return this.generateHeuristicPrediction(input, startTime);
    }
  }

  private async computeTimingScore(input: any): Promise<number> {
    try {
      const niche = (input as any)?.niche || 'general'
      const labelTokens: string[] = ((input as any)?.frameworkScores?.tokens) || []
      const soundId = (input as any)?.soundId || ''
      const hashtags: string[] = ((input as any)?.hashtags) || []
      const { data, error } = await this.supabase
        .from('trend_nowcast')
        .select('entity_id,niche,velocity,acceleration,half_life_hours,strength,updated_at')
        .eq('niche', niche)
        .order('strength', { ascending: false })
        .limit(50)
      if (error || !data) return 1.0
      let score = 1.0
      for (const row of data as any[]) {
        const match = (row.entity_id && (soundId && row.entity_id === soundId)) || hashtags.includes(row.entity_id) || labelTokens.includes(row.entity_id)
        if (match) {
          score = Math.max(score, 1.0 + Math.min(0.12, Math.max(0, row.strength) / 1000))
        }
      }
      return score
    } catch { return 1.0 }
  }

  private async computePersonalizationFactor(input: any): Promise<number> {
    try {
      const creatorId = (input as any)?.creatorId || (input as any)?.creator_id || ''
      if (!creatorId) return 1.0
      const { createClient } = await import('@supabase/supabase-js')
      const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import('@/lib/env')
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const { data: coeffs } = await db.from('creator_token_coeffs').select('token,coeff').eq('creator_id', creatorId).limit(100)
      // Load global personalization model (latest)
      let global: Record<string, number> = {}
      try {
        const { data: gm } = await db.from('global_personalization_models').select('model_version,weights').order('created_at', { ascending: false }).limit(1)
        global = (gm||[])[0]?.weights || {}
      } catch {}
      if (!coeffs || !coeffs.length) return 1.0
      const tokens: string[] = ((input as any)?.frameworkScores?.tokens) || []
      let globalLift = 0.0
      if ((input as any)?.frameworkScores?.overallScore) {
        globalLift = Number((input as any).frameworkScores.overallScore) * 0.05
      }
      let personalized = 0.0
      for (const t of tokens) {
        const hit = (coeffs as any[]).find(c=> c.token === t)
        const g = Number((global as any)[t] || 0)
        if (hit) personalized += Number(hit.coeff || 0) + g
        else personalized += g
      }
      const blend = 0.7 * globalLift + 0.3 * personalized
      return 1.0 + Math.max(-0.1, Math.min(0.12, blend))
    } catch { return 1.0 }
  }

  private async fetchLatestFirstHourTelemetry(input: any): Promise<{ points: any[]; expectedProfile: any } | null> {
    try {
      const { mergeExpectedFirstHourForTokens } = await import('@/lib/frameworks/mapping_guide');
      const { data, error } = await this.supabase
        .from('first_hour_telemetry')
        .select('*')
        .eq('video_id', (input as any)?.videoId || (input as any)?.video_id || (input as any)?.id || '')
        .gte('ts', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('ts', { ascending: true });
      if (error || !data || data.length === 0) return null;
      const tokens = ((input as any)?.frameworkScores?.tokens) || [];
      const expected = mergeExpectedFirstHourForTokens(Array.isArray(tokens) ? tokens : []);
      return { points: data.map((d: any) => ({
        ts: d.ts,
        views: d.views,
        unique_viewers: d.unique_viewers,
        avg_watch_pct: Number(d.avg_watch_pct),
        completion_rate: Number(d.completion_rate),
        rewatches: d.rewatches,
        shares: d.shares,
        saves: d.saves,
        comments: d.comments,
      })), expectedProfile: expected };
    } catch {
      return null;
    }
  }

  private async computeDistributionFactor(input: any): Promise<number> {
    try {
      const creatorId = (input as any)?.creatorId || (input as any)?.creator_id || ''
      const videoId = (input as any)?.videoId || (input as any)?.video_id || ''
      if (!creatorId && !videoId) return 1.0
      const { data, error } = await this.supabase
        .from('distribution_signals')
        .select('ts_iso,boost_network,crosspost_schedule,channel_quality,partner_tag')
        .or(`creator_id.eq.${creatorId},video_id.eq.${videoId}`)
        .order('ts_iso', { ascending: false })
        .limit(1)
      if (error || !data || !data.length) return 1.0
      const row: any = data[0]
      let factor = 1.0
      const q = row.channel_quality || {}
      if (q.tier === 'gold') factor += 0.06
      if (q.tier === 'silver') factor += 0.03
      if (Array.isArray(row.crosspost_schedule) && row.crosspost_schedule.length >= 2) factor += 0.02
      if (row.boost_network && row.boost_network.size >= 2) factor += 0.03
      if (typeof row.partner_tag === 'string' && row.partner_tag.toLowerCase().includes('priority')) factor += 0.02
      return factor
    } catch {
      return 1.0
    }
  }

  // ===== CORE CALCULATION METHODS =====

  /**
   * Get cohort statistics for z-score calculation
   */
  private async getCohortStatistics(followerCount: number, platform: string): Promise<{
    mean: number;
    median: number;
    standardDeviation: number;
    sampleSize: number;
  }> {
    const lowerBound = followerCount * 0.8;
    const upperBound = followerCount * 1.2;
    
    const { data, error } = await this.supabase
      .from('videos')
      .select('view_count')
      .gte('creator_followers', lowerBound)
      .lte('creator_followers', upperBound)
      .eq('platform', platform)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('view_count', { ascending: true });
    
    if (error || !data || data.length < 10) {
      return this.getResearchBasedCohortStats(followerCount, platform);
    }
    
    const viewCounts = data.map(d => d.view_count);
    const mean = viewCounts.reduce((sum, val) => sum + val, 0) / viewCounts.length;
    const median = this.calculateMedian(viewCounts);
    const variance = viewCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / viewCounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    return { mean, median, standardDeviation, sampleSize: viewCounts.length };
  }

  /**
   * Research-based fallback cohort statistics
   */
  private getResearchBasedCohortStats(followerCount: number, platform: string): {
    mean: number;
    median: number;
    standardDeviation: number;
    sampleSize: number;
  } {
    const platformMultipliers = {
      tiktok: { baseline: 0.128, variance: 0.5 },
      instagram: { baseline: 0.08, variance: 0.3 },
      youtube: { baseline: 0.05, variance: 0.4 }
    };
    
    const multiplier = platformMultipliers[platform] || platformMultipliers.tiktok;
    const mean = followerCount * multiplier.baseline;
    const median = mean * 0.8;
    const standardDeviation = mean * multiplier.variance;
    
    return { mean, median, standardDeviation, sampleSize: 100 };
  }

  /**
   * Calculate z-score (statistical outlier measure)
   */
  private calculateZScore(viewCount: number, cohortStats: { mean: number; standardDeviation: number }): number {
    if (cohortStats.standardDeviation === 0) return 0;
    return (viewCount - cohortStats.mean) / cohortStats.standardDeviation;
  }

  /**
   * Normalize z-score to 0-1 scale
   */
  private normalizeZScore(zScore: number): number {
    return Math.max(0, Math.min(1, (zScore + 3) / 6));
  }

  /**
   * Calculate engagement score using platform-specific weights
   */
  private calculateEngagementScore(input: PredictionInput): number {
    if (input.viewCount === 0) return 0;
    
    const weights = ENGAGEMENT_WEIGHTS[input.platform];
    const totalEngagement = 
      (input.likeCount * weights.like) + 
      (input.commentCount * weights.comment) + 
      (input.shareCount * weights.share);
    
    const engagementRate = totalEngagement / input.viewCount;
    const threshold = VIRAL_THRESHOLDS[input.platform];
    
    return Math.min(engagementRate / threshold, 2.0);
  }

  /**
   * Calculate time decay factor
   */
  private calculateDecayFactor(hoursSinceUpload: number, platform: string): number {
    const rate = PLATFORM_DECAY_RATES[platform];
    return Math.exp(-rate * (hoursSinceUpload / 24));
  }

  /**
   * Calculate base viral score using master formula
   */
  private calculateBaseViralScore({
    zScoreNormalized,
    engagementScore,
    platformWeight,
    decayFactor
  }: {
    zScoreNormalized: number;
    engagementScore: number;
    platformWeight: number;
    decayFactor: number;
  }): number {
    return (
      (zScoreNormalized * COMPONENT_WEIGHTS.zScore) +
      (engagementScore * COMPONENT_WEIGHTS.engagement) +
      (platformWeight * COMPONENT_WEIGHTS.platform) +
      (decayFactor * COMPONENT_WEIGHTS.decay)
    );
  }

  /**
   * Calculate God Mode enhancement multiplier
   */
  private calculateGodModeMultiplier(features: NonNullable<PredictionInput['contentFeatures']>): number {
    const psychologicalMultiplier = 1 + ((features.emotionalArousal || 50) / 100) * 0.25;
    const productionMultiplier = 1 + ((features.productionQuality || 50) / 100) * 0.20;
    const culturalMultiplier = 1 + ((features.culturalRelevance || 50) / 100) * 0.35;
    const authenticityFactor = Math.min((features.authenticityScore || 80) / 100, 1.0);
    
    const combinedMultiplier = psychologicalMultiplier * productionMultiplier * culturalMultiplier * authenticityFactor;
    return Math.min(combinedMultiplier, 1.35); // Cap at 35% boost
  }

  /**
   * Calculate framework contribution score
   */
  private calculateFrameworkContribution(frameworks: NonNullable<PredictionInput['frameworkScores']>): number {
    return Math.min(frameworks.overallScore, 1.0);
  }

  /**
   * Calculate viral probability
   */
  private calculateViralProbability(viralScore: number, percentile: number): number {
    let probability = viralScore / 100;
    
    // Boost for high percentile performance
    if (percentile >= 95) probability += 0.2;
    else if (percentile >= 90) probability += 0.1;
    else if (percentile >= 80) probability += 0.05;
    
    return Math.min(probability, 0.95);
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(input: PredictionInput, cohortStats: { sampleSize: number }): number {
    const timeConfidence = Math.min(input.hoursSinceUpload / 72, 1);
    const viewConfidence = Math.min(input.viewCount / 10000, 1);
    const dataConfidence = Math.min(cohortStats.sampleSize / 50, 1);
    
    return (timeConfidence * 0.4 + viewConfidence * 0.3 + dataConfidence * 0.3);
  }

  /**
   * Classify viral result
   */
  private classifyResult(percentile: number, zScore: number): PredictionOutput['classification'] {
    let category: PredictionOutput['classification']['category'] = 'normal';
    let threshold = '';
    
    if (zScore >= 3.0 && percentile >= VIRAL_PERCENTILE_THRESHOLDS.mega) {
      category = 'mega-viral';
      threshold = 'Top 0.1% (z-score ≥ 3.0)';
    } else if (zScore >= 2.5 && percentile >= VIRAL_PERCENTILE_THRESHOLDS.hyper) {
      category = 'hyper-viral';
      threshold = 'Top 1% (z-score ≥ 2.5)';
    } else if (zScore >= 2.0 && percentile >= VIRAL_PERCENTILE_THRESHOLDS.viral) {
      category = 'viral';
      threshold = 'Top 5% (z-score ≥ 2.0)';
    } else if (zScore >= 1.0 && percentile >= VIRAL_PERCENTILE_THRESHOLDS.trending) {
      category = 'trending';
      threshold = 'Top 10% (z-score ≥ 1.0)';
    } else {
      threshold = 'Standard performance';
    }
    
    return { category, percentile: Math.round(percentile * 100) / 100, threshold };
  }

  /**
   * Generate view and engagement predictions
   */
  private generatePredictions(viralProbability: number, input: PredictionInput): PredictionOutput['predictions'] {
    const baseViews = Math.pow(viralProbability, 1.5) * 3000000;
    const platformMultiplier = PLATFORM_WEIGHTS[input.platform];
    
    const predictedViews = {
      pessimistic: Math.round(baseViews * platformMultiplier * 0.3),
      realistic: Math.round(baseViews * platformMultiplier * 0.7),
      optimistic: Math.round(baseViews * platformMultiplier * 1.5)
    };
    
    const predictedEngagement = viralProbability * 0.08;
    
    let peakTimeframe = 'viral potential low';
    if (viralProbability > 0.8) peakTimeframe = 'within 6 hours';
    else if (viralProbability > 0.6) peakTimeframe = 'within 12 hours';
    else if (viralProbability > 0.4) peakTimeframe = 'within 24 hours';
    
    return { predictedViews, predictedEngagement, peakTimeframe };
  }

  /**
   * Assess data quality for confidence calculation
   */
  private assessDataQuality(input: PredictionInput, cohortStats: { sampleSize: number }): 'high' | 'medium' | 'low' {
    if (cohortStats.sampleSize >= 50 && input.viewCount >= 1000) return 'high';
    if (cohortStats.sampleSize >= 20 && input.viewCount >= 100) return 'medium';
    return 'low';
  }

  // ===== UTILITY METHODS =====

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private zScoreToPercentile(zScore: number): number {
    return Math.max(0, Math.min(100, 50 * (1 + this.erf(zScore / Math.sqrt(2)))));
  }

  private erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  /**
   * Heuristic fallback prediction when database is unavailable
   */
  private generateHeuristicPrediction(input: PredictionInput, startTime: number): PredictionOutput {
    const engagementRate = input.viewCount > 0 ? 
      (input.likeCount + input.commentCount + input.shareCount) / input.viewCount : 0;
    
    let score = 50; // Base score
    
    // View count scoring
    if (input.viewCount > 1000000) score += 20;
    else if (input.viewCount > 100000) score += 15;
    else if (input.viewCount > 10000) score += 10;
    
    // Engagement scoring
    if (engagementRate > 0.1) score += 15;
    else if (engagementRate > 0.05) score += 10;
    else if (engagementRate > 0.02) score += 5;
    
    // Platform adjustments
    score *= PLATFORM_WEIGHTS[input.platform];
    
    score = Math.min(Math.max(score, 0), 100);
    
    return {
      viralScore: score,
      viralProbability: score / 100,
      confidence: 0.5, // Lower confidence for heuristic
      classification: {
        category: score >= 80 ? 'viral' : score >= 60 ? 'trending' : 'normal',
        percentile: score,
        threshold: 'Heuristic estimation'
      },
      breakdown: {
        zScore: 0,
        zScoreNormalized: score / 100,
        engagementScore: engagementRate * 10,
        platformWeight: PLATFORM_WEIGHTS[input.platform],
        decayFactor: 1.0
      },
      predictions: {
        predictedViews: {
          pessimistic: Math.round(score * 1000),
          realistic: Math.round(score * 2000),
          optimistic: Math.round(score * 4000)
        },
        predictedEngagement: engagementRate,
        peakTimeframe: 'uncertain'
      },
      meta: {
        cohortSize: 0,
        dataQuality: 'low',
        modelVersion: MODEL_VERSION + '-heuristic',
        processingTime: Date.now() - startTime
      }
    };
  }
}

// ===== SINGLETON INSTANCE =====

let engineInstance: UnifiedPredictionEngine | null = null;

/**
 * Get singleton instance of the prediction engine
 */
export function getPredictionEngine(): UnifiedPredictionEngine {
  if (!engineInstance) {
    engineInstance = new UnifiedPredictionEngine();
  }
  return engineInstance;
}

/**
 * Convenience function for quick predictions
 */
export async function predictViral(input: PredictionInput): Promise<PredictionOutput> {
  const engine = getPredictionEngine();
  return engine.predict(input);
} 