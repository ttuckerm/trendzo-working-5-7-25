/**
 * FAST VIRAL PREDICTION API - SUB-100MS ENDPOINT
 * 
 * 🎯 TARGET: ≤100ms response time for 95% of requests
 * 🎯 TARGET: ≤50ms for cache hits
 * 
 * USAGE:
 * POST /api/viral-prediction/fast
 * {
 *   "content": "Your video script or description",
 *   "hashtags": ["fitness", "transformation"],
 *   "platform": "tiktok",
 *   "creator_followers": 50000,
 *   "niche": "fitness"
 * }
 * 
 * RESPONSE:
 * {
 *   "viral_score": 87,
 *   "viral_probability": 0.87,
 *   "confidence": 0.92,
 *   "processing_time_ms": 45,
 *   "tier_used": "fast",
 *   "cache_status": "computed",
 *   "recommendations": ["Add stronger hook", "Optimize hashtags"],
 *   "prediction_id": "fast_1234567890_abc123"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { realTimeMonitor } from '@/lib/monitoring/real-time-monitor';
import { devGetCalibration } from '@/lib/dev/accuracyStore'

async function getFastEngine(){
  const mod = await import('@/lib/services/fast-prediction-engine');
  return (mod as any).fastPredictionEngine || (mod as any).default || mod;
}

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function applyCalibration(p: number, cohortKey?: string): number {
  const rec = cohortKey ? devGetCalibration(cohortKey) : undefined
  if (!rec || !(rec as any).mapping?.length) return p
  const pts = [...(rec as any).mapping].sort((a: any, b: any) => a.x - b.x)
  if (p <= pts[0].x) return pts[0].y
  if (p >= pts[pts.length - 1].x) return pts[pts.length - 1].y
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    if (p <= b.x) {
      const t = (p - a.x) / Math.max(1e-9, b.x - a.x)
      return a.y + t * (b.y - a.y)
    }
  }
  return p
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = `fast_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // 1. Rate limiting check (fast - ~1ms)
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 100 requests per minute.' },
        { status: 429 }
      );
    }
    
    // 2. Parse and validate input (fast - ~2ms)
    const body = await request.json();
    const validationResult = validateInput(body);
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }
    
    // 3. Run fast prediction (target: <100ms)
    const predictionInput = {
      content: body.content,
      hashtags: body.hashtags || [],
      platform: body.platform || 'tiktok',
      creator_followers: body.creator_followers,
      video_length: body.video_length,
      upload_time: body.upload_time,
      visual_quality: body.visual_quality,
      audio_quality: body.audio_quality,
      niche: body.niche,
      request_id: requestId
    };
    
    console.log(`🚀 Fast prediction request: ${requestId}`);
    const engine = await getFastEngine();
    const result = await engine.predict(predictionInput);
    const cohortKey: string | undefined = body.cohortKey || body.cohort || undefined
    const rawProb: number = typeof (result as any).viral_probability === 'number'
      ? (result as any).viral_probability
      : (typeof (result as any).viralProbability === 'number'
        ? (result as any).viralProbability
        : (typeof (result as any).probability === 'number' ? (result as any).probability : 0))
    const calibratedProb = applyCalibration(rawProb, cohortKey)
    const roundedRaw = Math.round(rawProb * 1000) / 1000
    const roundedCal = Math.round(calibratedProb * 1000) / 1000
    
    const totalTime = performance.now() - startTime;
    
    // 4. Log performance metrics
    console.log(`⚡ Fast prediction complete: ${totalTime.toFixed(1)}ms (${result.tier_used} track)`);
    
    // Track metrics
    realTimeMonitor.recordResponseTime({
      endpoint: '/api/viral-prediction/fast',
      method: 'POST',
      responseTime: totalTime,
      statusCode: 200,
      timestamp: new Date()
    });
    
    // 5. Return optimized response
    const response = {
      success: true,
      data: {
        viral_score: Math.round(result.viral_score * 10) / 10,
        viral_probability: roundedRaw,
        raw_probability: roundedRaw,
        calibrated_probability: roundedCal,
        confidence: Math.round(result.confidence * 1000) / 1000,
        processing_time_ms: Math.round(totalTime * 10) / 10,
        tier_used: result.tier_used,
        cache_status: result.cache_status,
        recommendations: result.recommendations,
        risk_factors: result.risk_factors,
        prediction_id: result.prediction_id,
        accuracy_estimate: result.accuracy_estimate
      },
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        engine_version: 'fast-v1.0',
        performance: {
          target_met: totalTime <= 100,
          tier_performance: {
            lightning_target: '< 50ms',
            fast_target: '< 100ms',
            full_target: '< 2000ms'
          }
        }
      }
    };
    
    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${totalTime.toFixed(1)}ms`,
        'X-Prediction-Tier': result.tier_used,
        'X-Cache-Status': result.cache_status,
        'X-Engine-Version': 'fast-v1.0'
      }
    });
    
  } catch (error) {
    const totalTime = performance.now() - startTime;
    console.error('❌ Fast prediction error:', error);
    
    // Track error
    realTimeMonitor.recordResponseTime({
      endpoint: '/api/viral-prediction/fast',
      method: 'POST',
      responseTime: totalTime,
      statusCode: 500,
      timestamp: new Date()
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fast prediction failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        metadata: {
          request_id: requestId,
          processing_time_ms: totalTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for engine statistics and health check
 */
export async function GET(request: NextRequest) {
  try {
    const engine = await getFastEngine();
    const stats = engine.getPerformanceStats();
    
    return NextResponse.json({
      status: 'healthy',
      engine: 'fast-prediction-engine',
      version: '1.0.0',
      performance: {
        lightning_hit_rate: Math.round(stats.lightning_hit_rate * 1000) / 10 + '%',
        fast_hit_rate: Math.round(stats.fast_hit_rate * 1000) / 10 + '%',
        full_fallback_rate: Math.round(stats.full_fallback_rate * 1000) / 10 + '%',
        total_predictions: stats.total_predictions,
        cache_status: stats.cache_status
      },
      targets: {
        lightning_track: '< 50ms (cache hits)',
        fast_track: '< 100ms (simplified algorithms)',
        full_track: '< 2000ms (comprehensive analysis)'
      },
      last_check: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}

// ===== UTILITY FUNCTIONS =====

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or create new entry
    requestCounts.set(clientId, {
      count: 1,
      resetTime: now + RATE_WINDOW
    });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return false;
  }
  
  clientData.count++;
  return true;
}

function validateInput(body: any): { valid: boolean; error?: string } {
  // Required fields validation
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }
  
  // Platform validation
  const validPlatforms = ['tiktok', 'instagram', 'youtube', 'twitter'];
  if (body.platform && !validPlatforms.includes(body.platform)) {
    return { valid: false, error: `Platform must be one of: ${validPlatforms.join(', ')}` };
  }
  
  // Content validation
  if (body.content && typeof body.content !== 'string') {
    return { valid: false, error: 'Content must be a string' };
  }
  
  if (body.content && body.content.length > 5000) {
    return { valid: false, error: 'Content must be less than 5000 characters' };
  }
  
  // Hashtags validation
  if (body.hashtags && !Array.isArray(body.hashtags)) {
    return { valid: false, error: 'Hashtags must be an array' };
  }
  
  if (body.hashtags && body.hashtags.length > 20) {
    return { valid: false, error: 'Maximum 20 hashtags allowed' };
  }
  
  // Numeric field validation
  if (body.creator_followers && (typeof body.creator_followers !== 'number' || body.creator_followers < 0)) {
    return { valid: false, error: 'Creator followers must be a positive number' };
  }
  
  if (body.video_length && (typeof body.video_length !== 'number' || body.video_length < 1 || body.video_length > 600)) {
    return { valid: false, error: 'Video length must be between 1 and 600 seconds' };
  }
  
  // Quality scores validation
  if (body.visual_quality && (typeof body.visual_quality !== 'number' || body.visual_quality < 0 || body.visual_quality > 100)) {
    return { valid: false, error: 'Visual quality must be between 0 and 100' };
  }
  
  if (body.audio_quality && (typeof body.audio_quality !== 'number' || body.audio_quality < 0 || body.audio_quality > 100)) {
    return { valid: false, error: 'Audio quality must be between 0 and 100' };
  }
  
  return { valid: true };
}

/**
 * Warm up the engine on module load for optimal performance
 */
if (process.env.NODE_ENV === 'production') {
  // Warm up in production for best performance
  getFastEngine()
    .then((engine) => engine?.warmUp?.())
    .catch(error => {
      console.error('⚠️ Fast prediction engine warm-up failed:', error);
    });
}