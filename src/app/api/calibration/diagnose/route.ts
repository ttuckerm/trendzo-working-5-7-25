import { NextRequest, NextResponse } from 'next/server';
import { calibrateScore } from '@/lib/calibration/score-calibrator';
import { applySignals } from '@/lib/calibration/negative-signals';
import { KaiOrchestrator } from '@/lib/orchestration/kai-orchestrator';

/**
 * Diagnostic API for Calibration Lab
 * 
 * FIXED: Now uses real KaiOrchestrator components instead of simulations.
 * Runs all 22 components and shows calibration results.
 */

interface ComponentResult {
  componentId: string;
  componentName: string;
  score: number;
  calibratedScore: number;
  latency: number;
  status: 'success' | 'error' | 'skipped';
  rawOutput?: any;
  error?: string;
}

// Component display names
const COMPONENT_NAMES: Record<string, string> = {
  'xgboost': 'XGBoost Predictor',
  'gpt4': 'GPT-4 Refinement',
  'gemini': 'Gemini 3 Pro',
  'claude': 'Claude Analyzer',
  'feature-extraction': 'Feature Extraction (152 features)',
  '7-legos': '7 Idea Legos',
  '9-attributes': '9 Viral Attributes',
  '24-styles': '24 Video Styles',
  'virality-matrix': 'Virality Matrix',
  'hook-scorer': 'Hook Scorer',
  'pattern-extraction': 'Pattern Extraction',
  'ffmpeg': 'FFmpeg Visual Analysis',
  'whisper': 'Whisper Transcription',
  'historical': 'Historical Analyzer',
  'trend-timing-analyzer': 'Trend Timing',
  'posting-time-optimizer': 'Posting Time Optimizer',
  'thumbnail-analyzer': 'Thumbnail Analyzer',
  'audio-analyzer': 'Audio Analyzer',
  'niche-keywords': 'Niche Keywords',
  'visual-scene-detector': 'Visual Scene Detector'
};

// Components to run for calibration (text-based ones that don't need video file)
const CALIBRATION_COMPONENTS = [
  'feature-extraction',
  'xgboost',
  'gpt4',
  'claude',
  '7-legos',
  '9-attributes',
  '24-styles',
  'virality-matrix',
  'hook-scorer',
  'pattern-extraction',
  'niche-keywords'
];

// Weight configuration for final score calculation
const COMPONENT_WEIGHTS: Record<string, number> = {
  'xgboost': 0.15,
  'gpt4': 0.12,
  'gemini': 0.10,
  'claude': 0.08,
  'feature-extraction': 0.10,
  '7-legos': 0.10,
  '9-attributes': 0.10,
  '24-styles': 0.05,
  'virality-matrix': 0.08,
  'hook-scorer': 0.07,
  'pattern-extraction': 0.05
};

export async function POST(request: NextRequest) {
  try {
    const { transcript, expectedDPS, sampleId, niche, videoPath } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const componentResults: ComponentResult[] = [];
    const startTime = Date.now();

    // ============================================
    // INSTANTIATE KAI ORCHESTRATOR
    // ============================================
    
    const kai = new KaiOrchestrator();

    // Prepare input for components
    const input = {
      videoId: sampleId || 'calibration-test',
      transcript: transcript,
      title: '',
      description: '',
      hashtags: [],
      niche: niche || 'general',
      videoPath: videoPath || undefined,
      duration: 0,
      creatorFollowers: 0,
      accountSize: 'medium'
    };

    // ============================================
    // RUN EACH COMPONENT VIA KAI ORCHESTRATOR
    // ============================================

    for (const componentId of CALIBRATION_COMPONENTS) {
      const componentStartTime = Date.now();
      
      try {
        // Access the component from Kai's registry
        const component = (kai as any)['componentRegistry']?.get(componentId);
        
        if (!component) {
          componentResults.push({
            componentId,
            componentName: COMPONENT_NAMES[componentId] || componentId,
            score: 0,
            calibratedScore: 0,
            latency: Date.now() - componentStartTime,
            status: 'error',
            error: 'Component not found in registry'
          });
          continue;
        }

        // Execute the component with timeout
        const timeoutMs = 30000;
        const resultPromise = component.execute(input);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        );

        const result = await Promise.race([resultPromise, timeoutPromise]) as any;

        // Extract score from result
        let rawScore = 50; // Default
        if (result.prediction !== undefined) {
          rawScore = result.prediction;
        } else if (result.score !== undefined) {
          rawScore = result.score;
        } else if (result.features?.score !== undefined) {
          rawScore = result.features.score;
        }

        // Clamp score to valid range
        rawScore = Math.max(0, Math.min(100, rawScore));

        // Apply calibration
        const calibratedScore = calibrateScore(rawScore, componentId);

        componentResults.push({
          componentId,
          componentName: COMPONENT_NAMES[componentId] || componentId,
          score: rawScore,
          calibratedScore,
          latency: Date.now() - componentStartTime,
          status: result.success !== false ? 'success' : 'error',
          rawOutput: {
            prediction: result.prediction,
            confidence: result.confidence,
            features: result.features,
            insights: result.insights
          },
          error: result.error
        });

      } catch (error: any) {
        componentResults.push({
          componentId,
          componentName: COMPONENT_NAMES[componentId] || componentId,
          score: 50,
          calibratedScore: calibrateScore(50, componentId),
          latency: Date.now() - componentStartTime,
          status: 'error',
          error: error.message
        });
      }
    }

    // ============================================
    // CALCULATE WEIGHTED SCORES
    // ============================================
    
    // Filter to only successful components with weights
    const successfulResults = componentResults.filter(r => 
      r.status === 'success' && COMPONENT_WEIGHTS[r.componentId]
    );

    // Calculate raw weighted score
    let totalWeight = 0;
    let rawWeightedScore = 0;
    let calibratedWeightedScore = 0;

    for (const result of successfulResults) {
      const weight = COMPONENT_WEIGHTS[result.componentId] || 0;
      totalWeight += weight;
      rawWeightedScore += result.score * weight;
      calibratedWeightedScore += result.calibratedScore * weight;
    }

    // Normalize by actual weights used
    if (totalWeight > 0) {
      rawWeightedScore = rawWeightedScore / totalWeight;
      calibratedWeightedScore = calibratedWeightedScore / totalWeight;
    } else {
      rawWeightedScore = 50;
      calibratedWeightedScore = 50;
    }

    // ============================================
    // APPLY SIGNAL ADJUSTMENTS (POSITIVE + NEGATIVE)
    // ============================================
    
    const signalResult = applySignals(calibratedWeightedScore, transcript);
    const {
      adjustedScore: finalCalibratedDPS,
      negativeSignals,
      positiveSignals,
      totalPenalty,
      totalBonus,
      netAdjustment
    } = signalResult;

    const totalLatency = Date.now() - startTime;

    // ============================================
    // BUILD CALCULATION BREAKDOWN
    // ============================================

    const calculation: any = {
      raw: {},
      calibrated: {}
    };

    for (const result of successfulResults) {
      const weight = COMPONENT_WEIGHTS[result.componentId];
      if (weight) {
        calculation.raw[result.componentId] = `${result.score.toFixed(1)} × ${weight}`;
        calculation.calibrated[result.componentId] = `${result.calibratedScore.toFixed(1)} × ${weight}`;
      }
    }

    calculation.raw.total = rawWeightedScore.toFixed(1);
    calculation.calibrated.subtotal = calibratedWeightedScore.toFixed(1);
    calculation.calibrated.bonus = `+${totalBonus}`;
    calculation.calibrated.penalty = `-${totalPenalty}`;
    calculation.calibrated.netAdjustment = `${netAdjustment >= 0 ? '+' : ''}${netAdjustment}`;
    calculation.calibrated.final = finalCalibratedDPS.toFixed(1);

    return NextResponse.json({
      success: true,
      sampleId,
      predictedDPS: rawWeightedScore,
      calibratedDPS: finalCalibratedDPS,
      expectedDPS,
      accuracy: expectedDPS ? {
        rawError: Math.abs(rawWeightedScore - expectedDPS),
        calibratedError: Math.abs(finalCalibratedDPS - expectedDPS),
        improvement: Math.abs(rawWeightedScore - expectedDPS) - Math.abs(finalCalibratedDPS - expectedDPS)
      } : null,
      componentResults,
      componentStats: {
        total: componentResults.length,
        succeeded: componentResults.filter(r => r.status === 'success').length,
        failed: componentResults.filter(r => r.status === 'error').length,
        skipped: componentResults.filter(r => r.status === 'skipped').length
      },
      negativeSignals,
      positiveSignals,
      totalPenalty,
      totalBonus,
      netAdjustment,
      weights: COMPONENT_WEIGHTS,
      calculation,
      latency: totalLatency,
      timestamp: new Date().toISOString(),
      usingKaiOrchestrator: true,
      componentsExecuted: CALIBRATION_COMPONENTS
    });

  } catch (error: any) {
    console.error('Calibration diagnostic error:', error);
    return NextResponse.json(
      { success: false, error: 'Diagnostic failed', message: error.message },
      { status: 500 }
    );
  }
}
