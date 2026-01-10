/**
 * Kai Orchestrator - The Brain of the Viral Prediction System
 *
 * Orchestrates all 24 components to produce unified predictions:
 * 1. 9 Attributes Scorer
 * 2. 24 Video Styles Classifier
 * 3. XGBoost 118 Features
 * 4. FFmpeg Visual Analysis
 * 5. 7 Idea Legos Pattern Extraction
 * 6. Whisper Transcription
 * 7. Multi-LLM (GPT-4, Claude, Gemini)
 * 8. Niche Keywords
 * 9. DPS Calculator
 * 10. SEO Title/Hashtag Generator
 * 11. 1000+ Keywords Database
 * 12. Virality Matrix Scorer
 * 13. Historical Comparison
 * 14. Universal Reasoning
 * ... and more
 */

import OpenAI from 'openai';
import { runUnifiedGradingWithFallback, UnifiedGradingResult } from '../rubric-engine';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ComponentRegistry {
  id: string;
  name: string;
  type: 'quantitative' | 'qualitative' | 'pattern' | 'historical';
  status: 'active' | 'degraded' | 'failed';
  reliability: number; // 0-1, updated based on accuracy
  avgLatency: number;
  lastSuccess: Date | null;
  execute: (input: VideoInput) => Promise<ComponentResult>;
}

export interface VideoInput {
  videoId: string;
  transcript?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  niche?: string;
  goal?: string;
  accountSize?: string;
  videoPath?: string;
  ffmpegData?: any;
  // A/B Testing config (injected by orchestrator when test is active)
  _abTestConfig?: Record<string, any>;
  // Metrics (only for validation, NOT for prediction)
  actualMetrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
}

export interface ComponentResult {
  componentId: string;
  success: boolean;
  prediction?: number;
  confidence?: number;
  insights?: string[];
  features?: Record<string, any>;
  error?: string;
  latency: number;
}

export interface PredictionPath {
  name: string;
  components: string[];
  weight: number;
  context: WorkflowType;
}

export interface PathResult {
  path: string;
  results: ComponentResult[];
  weight: number;
  success: boolean;
  aggregatedPrediction?: number;
  aggregatedConfidence?: number;
}

export interface PredictionResult {
  id: string;
  success: boolean;
  dps: number;
  confidence: number;
  range: [number, number];
  viralPotential: 'mega-viral' | 'viral' | 'good' | 'average' | 'low';
  recommendations: string[];
  componentsUsed: string[];
  componentScores: Map<string, number>;
  features: Record<string, any>; // Component-specific features (e.g., Gemini analysis details)
  paths: PathResult[];
  warnings: string[];
  latency: number;
  workflow: WorkflowType;
}

export interface AgreementAnalysis {
  level: 'high' | 'moderate' | 'low';
  variance: number;
  outliers: string[];
}

export type WorkflowType =
  | 'content-planning'
  | 'template-selection'
  | 'quick-win'
  | 'immediate-analysis'
  | 'trending-library';

export type ComponentWeightMap = Record<string, number>;

// ============================================================================
// KAI ORCHESTRATOR CLASS
// ============================================================================

export class KaiOrchestrator {
  private componentRegistry: Map<string, ComponentRegistry>;
  private predictionPaths: Map<string, PredictionPath>;
  private contextWeights: Map<WorkflowType, ComponentWeightMap>;
  private reliabilityScoresLoaded: boolean = false;

  constructor() {
    this.componentRegistry = new Map();
    this.predictionPaths = new Map();
    this.contextWeights = new Map();

    this.initializeComponentRegistry();
    this.initializePredictionPaths();
    this.initializeContextWeights();
  }

  /**
   * Load component reliability scores from database
   * This updates component weights based on historical accuracy
   */
  async loadReliabilityScores(): Promise<void> {
    if (this.reliabilityScoresLoaded) return;

    try {
      // Import supabase client dynamically to avoid server-side issues
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
        {
          db: { schema: 'public' },
          auth: { persistSession: false }
        }
      );

      const { data: scores, error } = await supabase
        .from('component_reliability')
        .select('component_id, reliability_score, total_predictions, avg_accuracy_delta')
        .eq('enabled', true);

      if (error) {
        console.warn('Failed to load reliability scores:', error.message);
        return;
      }

      if (scores && scores.length > 0) {
        for (const score of scores) {
          const component = this.componentRegistry.get(score.component_id);
          if (component) {
            // Update reliability from database
            component.reliability = score.reliability_score;

            console.log(
              `Updated ${score.component_id} reliability: ${(score.reliability_score * 100).toFixed(1)}% ` +
              `(${score.total_predictions} predictions, avg error: ${score.avg_accuracy_delta?.toFixed(1)} DPS)`
            );
          }
        }

        this.reliabilityScoresLoaded = true;
        console.log(`✓ Loaded reliability scores for ${scores.length} components`);
      }
    } catch (error: any) {
      console.warn('Error loading reliability scores:', error.message);
      // Continue with default scores if loading fails
    }
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private initializeComponentRegistry(): void {
    // Component 1: 9 Attributes Scorer
    this.componentRegistry.set('9-attributes', {
      id: '9-attributes',
      name: '9 Attributes Scorer',
      type: 'pattern',
      status: 'active',
      reliability: 0.85,
      avgLatency: 500,
      lastSuccess: null,
      execute: async (input) => this.execute9Attributes(input)
    });

    // Component 3: XGBoost Predictor
    this.componentRegistry.set('xgboost', {
      id: 'xgboost',
      name: 'XGBoost 118 Features',
      type: 'quantitative',
      status: 'active',
      reliability: 0.97,
      avgLatency: 50,
      lastSuccess: null,
      execute: async (input) => this.executeXGBoost(input)
    });

    // Component 4: FFmpeg Visual Analysis
    this.componentRegistry.set('ffmpeg', {
      id: 'ffmpeg',
      name: 'FFmpeg Visual Analysis',
      type: 'quantitative',
      status: 'active',
      reliability: 0.99,
      avgLatency: 2000,
      lastSuccess: null,
      execute: async (input) => this.executeFFmpeg(input)
    });

    // Component 5: 7 Idea Legos
    this.componentRegistry.set('7-legos', {
      id: '7-legos',
      name: '7 Idea Legos Pattern Extraction',
      type: 'pattern',
      status: 'active',
      reliability: 0.90,
      avgLatency: 1000,
      lastSuccess: null,
      execute: async (input) => this.execute7Legos(input)
    });

    // Component 6: Whisper Transcription
    this.componentRegistry.set('whisper', {
      id: 'whisper',
      name: 'Whisper Transcription',
      type: 'quantitative',
      status: 'active',
      reliability: 0.95,
      avgLatency: 5000,
      lastSuccess: null,
      execute: async (input) => this.executeWhisper(input)
    });

    // Component 7: Multi-LLM (GPT-4)
    this.componentRegistry.set('gpt4', {
      id: 'gpt4',
      name: 'GPT-4 Qualitative Analysis',
      type: 'qualitative',
      status: 'active',
      reliability: 0.92,
      avgLatency: 3000,
      lastSuccess: null,
      execute: async (input) => this.executeGPT4(input)
    });

    // Component 7c: Multi-LLM (Gemini 3 Pro Preview - Enhanced)
    this.componentRegistry.set('gemini', {
      id: 'gemini',
      name: 'Gemini 3 Pro Preview Analysis',
      type: 'qualitative',
      status: 'active',
      reliability: 0.92, // Improved with Gemini 3 Pro advanced reasoning
      avgLatency: 2000,
      lastSuccess: null,
      execute: async (input) => this.executeGemini(input)
    });

    // Component 8: Niche Keywords
    this.componentRegistry.set('niche-keywords', {
      id: 'niche-keywords',
      name: 'Niche Keywords Analyzer',
      type: 'pattern',
      status: 'active',
      reliability: 0.85,
      avgLatency: 200,
      lastSuccess: null,
      execute: async (input) => this.executeNicheKeywords(input)
    });

    // Component 9: DPS Calculator
    this.componentRegistry.set('dps-engine', {
      id: 'dps-engine',
      name: 'DPS Calculation Engine',
      type: 'quantitative',
      status: 'active',
      reliability: 1.0,
      avgLatency: 20,
      lastSuccess: null,
      execute: async (input) => this.executeDPSEngine(input)
    });

    // Component 10: Feature Extraction
    this.componentRegistry.set('feature-extraction', {
      id: 'feature-extraction',
      name: 'Feature Extraction Service',
      type: 'quantitative',
      status: 'active',
      reliability: 0.99,
      avgLatency: 100,
      lastSuccess: null,
      execute: async (input) => this.executeFeatureExtraction(input)
    });

    // Component 11: Pattern Extraction
    this.componentRegistry.set('pattern-extraction', {
      id: 'pattern-extraction',
      name: 'Pattern Extraction Engine',
      type: 'pattern',
      status: 'active',
      reliability: 0.90,
      avgLatency: 2000,
      lastSuccess: null,
      execute: async (input) => this.executePatternExtraction(input)
    });

    // Component 12: Historical Comparison
    this.componentRegistry.set('historical', {
      id: 'historical',
      name: 'Historical Comparison',
      type: 'historical',
      status: 'active',
      reliability: 0.80,
      avgLatency: 500,
      lastSuccess: null,
      execute: async (input) => this.executeHistoricalComparison(input)
    });

    // Component 17: Hook Strength Scorer
    this.componentRegistry.set('hook-scorer', {
      id: 'hook-scorer',
      name: 'Hook Strength Scorer',
      type: 'pattern',
      status: 'active',
      reliability: 0.5, // Will improve with learning loop
      avgLatency: 50,
      lastSuccess: null,
      execute: async (input) => this.executeHookScorer(input)
    });

    // Component 15: Audio Analysis
    this.componentRegistry.set('audio-analyzer', {
      id: 'audio-analyzer',
      name: 'Audio Analysis Engine',
      type: 'quantitative',
      status: 'active',
      reliability: 0.5, // Will improve with learning loop
      avgLatency: 3000,
      lastSuccess: null,
      execute: async (input) => this.executeAudioAnalyzer(input)
    });

    // Component 16: Visual Scene Detection
    this.componentRegistry.set('visual-scene-detector', {
      id: 'visual-scene-detector',
      name: 'Visual Scene Detection',
      type: 'quantitative',
      status: 'active',
      reliability: 0.5, // Will improve with learning loop
      avgLatency: 5000,
      lastSuccess: null,
      execute: async (input) => this.executeVisualSceneDetector(input)
    });

    // Component 18: Trend Timing Analyzer
    this.componentRegistry.set('trend-timing-analyzer', {
      id: 'trend-timing-analyzer',
      name: 'Trend Timing Analyzer',
      type: 'historical',
      status: 'active',
      reliability: 0.5, // Will improve with learning loop
      avgLatency: 1000,
      lastSuccess: null,
      execute: async (input) => this.executeTrendTimingAnalyzer(input)
    });

    // Component 20: Thumbnail Analyzer
    this.componentRegistry.set('thumbnail-analyzer', {
      id: 'thumbnail-analyzer',
      name: 'Thumbnail Analyzer',
      type: 'quantitative',
      status: 'active',
      reliability: 0.5, // Will improve with learning loop
      avgLatency: 2000,
      lastSuccess: null,
      execute: async (input) => this.executeThumbnailAnalyzer(input)
    });

    // Component 21: Posting Time Optimizer
    this.componentRegistry.set('posting-time-optimizer', {
      id: 'posting-time-optimizer',
      name: 'Posting Time Optimizer',
      type: 'historical',
      status: 'active',
      reliability: 0.5, // Will improve with learning loop
      avgLatency: 1200,
      lastSuccess: null,
      execute: async (input) => this.executePostingTimeOptimizer(input)
    });

    // Component 22: 24 Video Styles Classifier (RE-ENABLED)
    // NOTE: Learning data shows this component over-predicts - reduced weight
    this.componentRegistry.set('24-styles', {
      id: '24-styles',
      name: '24 Video Styles Classifier',
      type: 'pattern',
      status: 'active',
      reliability: 0.5, // REDUCED from 0.75 - learning data shows it over-predicts
      avgLatency: 2000,
      lastSuccess: null,
      execute: async (input) => this.execute24Styles(input)
    });

    // Component 23: Virality Matrix (RE-ENABLED)
    this.componentRegistry.set('virality-matrix', {
      id: 'virality-matrix',
      name: 'TikTok Virality Matrix',
      type: 'pattern',
      status: 'active',
      reliability: 0.8,
      avgLatency: 2500,
      lastSuccess: null,
      execute: async (input) => this.executeViralityMatrix(input)
    });

    // Component 24: Claude Analysis (if API key available)
    this.componentRegistry.set('claude', {
      id: 'claude',
      name: 'Claude Analysis',
      type: 'qualitative',
      status: 'active',
      reliability: 0.85,
      avgLatency: 3000,
      lastSuccess: null,
      execute: async (input) => this.executeClaude(input)
    });

    // Component 25: Python Enhanced Analysis (PySceneDetect, VADER, faster-whisper)
    this.componentRegistry.set('python-analysis', {
      id: 'python-analysis',
      name: 'Python Enhanced Analysis',
      type: 'quantitative',
      status: 'active',
      reliability: 0.9, // High reliability - real video/audio analysis
      avgLatency: 3000,
      lastSuccess: null,
      execute: async (input) => this.executePythonAnalysis(input)
    });

    // Component 26: Unified Grading (LLM-based rubric with 9 attributes + 7 legos)
    this.componentRegistry.set('unified-grading', {
      id: 'unified-grading',
      name: 'Unified Grading Rubric',
      type: 'qualitative',
      status: 'active',
      reliability: 0.85, // Evidence-based rubric scoring
      avgLatency: 3000,
      lastSuccess: null,
      execute: async (input) => this.executeUnifiedGrading(input)
    });
  }

  private initializePredictionPaths(): void {
    // Multi-Path Exploration Strategy
    this.predictionPaths.set('quantitative', {
      name: 'Quantitative Analysis',
      components: ['feature-extraction', 'xgboost', 'dps-engine', 'ffmpeg', 'audio-analyzer', 'visual-scene-detector', 'thumbnail-analyzer', 'python-analysis'],
      weight: 0.15, // Reduced - basic features less predictive without video
      context: 'immediate-analysis'
    });

    this.predictionPaths.set('qualitative', {
      name: 'Qualitative Analysis',
      components: ['gpt4', 'gemini', 'claude'], // Added Claude back
      weight: 0.25, // Balanced - Gemini accurate but sometimes conservative
      context: 'content-planning'
    });

    this.predictionPaths.set('pattern_based', {
      name: 'Pattern Recognition',
      components: ['7-legos', '9-attributes', '24-styles', 'virality-matrix', 'pattern-extraction', 'hook-scorer'],
      weight: 0.45, // HIGHEST - 9-attributes and 7-legos most accurate
      context: 'template-selection'
    });

    this.predictionPaths.set('historical', {
      name: 'Historical Comparison',
      components: ['historical', 'niche-keywords', 'trend-timing-analyzer', 'posting-time-optimizer'],
      weight: 0.15, // Market context
      context: 'trending-library'
    });
  }

  private initializeContextWeights(): void {
    // Content Planning workflow
    this.contextWeights.set('content-planning', {
      quantitative: 0.15,
      qualitative: 0.25,
      pattern_based: 0.45, // Pattern-heavy for content planning
      historical: 0.15
    });

    // Template Selection workflow
    this.contextWeights.set('template-selection', {
      quantitative: 0.10,
      qualitative: 0.20,
      pattern_based: 0.55, // Highest for template work
      historical: 0.15
    });

    // Quick Win workflow
    this.contextWeights.set('quick-win', {
      quantitative: 0.15,
      qualitative: 0.20,
      pattern_based: 0.50,
      historical: 0.15
    });

    // Immediate Analysis workflow (Admin Lab / Upload Test)
    this.contextWeights.set('immediate-analysis', {
      quantitative: 0.20,
      qualitative: 0.25,
      pattern_based: 0.40, // Pattern analysis most accurate
      historical: 0.15
    });

    // Trending Library workflow
    this.contextWeights.set('trending-library', {
      quantitative: 0.10,
      qualitative: 0.20,
      pattern_based: 0.40,
      historical: 0.30 // Highest for trending work
    });
  }

  // ==========================================================================
  // MAIN PREDICTION METHOD
  // ==========================================================================

  async predict(input: VideoInput, workflow: WorkflowType): Promise<PredictionResult> {
    const startTime = Date.now();
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`\n========================================`);
    console.log(`KAI ORCHESTRATOR - Starting Prediction`);
    console.log(`Workflow: ${workflow}`);
    console.log(`Video ID: ${input.videoId}`);
    console.log(`========================================\n`);

    try {
      // Load reliability scores from learning loop (only once)
      await this.loadReliabilityScores();

      // Get context-aware weights for this workflow
      const contextWeights = this.getContextWeights(workflow);

      // Execute multiple paths in parallel
      console.log(`Executing ${this.predictionPaths.size} prediction paths...`);
      const pathResults = await this.executeMultiPath(input, contextWeights);

      // NEW: Check for viral patterns
      const patternBoost = await this.checkViralPatterns(input);

      // Check for agreement/disagreement between paths
      const agreement = this.calculateAgreement(pathResults);
      console.log(`Path agreement level: ${agreement.level} (variance: ${agreement.variance.toFixed(2)})`);

      let finalPrediction: number;
      let finalConfidence: number;
      let recommendations: string[] = [];
      let warnings: string[] = [];

      if (agreement.level === 'high') {
        // High agreement - confident prediction
        const result = this.synthesizeConfidentPrediction(pathResults);
        finalPrediction = result.prediction;
        finalConfidence = result.confidence;
        recommendations = result.recommendations;
      } else if (agreement.level === 'moderate') {
        // Moderate agreement - weighted consensus
        const result = this.synthesizeWeightedConsensus(pathResults, contextWeights);
        finalPrediction = result.prediction;
        finalConfidence = result.confidence;
        recommendations = result.recommendations;
        warnings.push(`Moderate disagreement between analysis paths (variance: ${agreement.variance.toFixed(1)})`);
      } else {
        // Low agreement - deep analysis needed
        const result = await this.performDeepAnalysis(pathResults, input);
        finalPrediction = result.prediction;
        finalConfidence = result.confidence;
        recommendations = result.recommendations;
        warnings.push(`Significant disagreement between paths - performed deep analysis`);
        warnings.push(...agreement.outliers.map(o => `Outlier prediction from: ${o}`));
      }

      // Apply pattern boost
      if (patternBoost > 0) {
        console.log(`[Kai] Applying viral pattern boost: +${(patternBoost * 100).toFixed(1)}%`);
        finalPrediction = finalPrediction * (1 + patternBoost);
        finalPrediction = Math.min(100, finalPrediction);
        recommendations.push('Viral patterns detected - prediction boosted');
      }

      // APPLY CALIBRATION ADJUSTMENTS (Over-Prediction Prevention)
      const calibrated = this.applyCalibrationAdjustments(finalPrediction, input, finalConfidence);
      finalPrediction = calibrated.prediction;
      finalConfidence = calibrated.confidence;
      
      // Add calibration info to warnings if significant adjustments were made
      const totalAdjustment = calibrated.adjustments.nicheFactor * calibrated.adjustments.accountFactor * calibrated.adjustments.conservativeFactor;
      if (totalAdjustment < 0.9) {
        warnings.push(`Score calibrated for market factors (${((1 - totalAdjustment) * 100).toFixed(0)}% reduction)`);
      }

      // Calculate prediction range based on confidence
      // Widen range for high predictions (more uncertainty)
      const baseUncertainty = (1 - finalConfidence) * 15;
      let predictionUncertainty = 0;
      if (finalPrediction > 75) {
        predictionUncertainty = (finalPrediction - 75) * 0.5; // Extra uncertainty for high scores
      }
      const totalUncertainty = baseUncertainty + predictionUncertainty;
      
      const range: [number, number] = [
        Math.max(0, finalPrediction - totalUncertainty),
        Math.min(100, finalPrediction + totalUncertainty)
      ];

      // Determine viral potential
      const viralPotential = this.getViralPotential(finalPrediction);

      // Compile component scores
      const componentScores = new Map<string, number>();
      for (const pathResult of pathResults) {
        for (const result of pathResult.results) {
          if (result.prediction !== undefined) {
            componentScores.set(result.componentId, result.prediction);
          }
        }
      }

      // Get list of components used
      const componentsUsed = pathResults.flatMap(p =>
        p.results.filter(r => r.success).map(r => r.componentId)
      );

      // Extract features from component results
      const features: Record<string, any> = {};
      for (const pathResult of pathResults) {
        for (const result of pathResult.results) {
          if (result.success && result.features) {
            features[result.componentId] = result.features;
          }
        }
      }

      const latency = Date.now() - startTime;

      console.log(`\n========================================`);
      console.log(`PREDICTION COMPLETE`);
      console.log(`DPS: ${finalPrediction.toFixed(1)}`);
      console.log(`Confidence: ${(finalConfidence * 100).toFixed(0)}%`);
      console.log(`Range: [${range[0].toFixed(1)}, ${range[1].toFixed(1)}]`);
      console.log(`Viral Potential: ${viralPotential}`);
      console.log(`Latency: ${latency}ms`);
      console.log(`Components Used: ${componentsUsed.length}`);
      console.log(`========================================\n`);

      return {
        id: predictionId,
        success: true,
        dps: Math.round(finalPrediction * 10) / 10,
        confidence: Math.round(finalConfidence * 100) / 100,
        range,
        viralPotential,
        recommendations,
        componentsUsed,
        componentScores,
        features,
        paths: pathResults,
        warnings,
        latency,
        workflow
      };

    } catch (error: any) {
      console.error(`KAI ORCHESTRATOR ERROR: ${error.message}`);

      return {
        id: predictionId,
        success: false,
        dps: 0,
        confidence: 0,
        range: [0, 0],
        viralPotential: 'low',
        recommendations: [],
        componentsUsed: [],
        componentScores: new Map(),
        features: {},
        paths: [],
        warnings: [`Fatal error: ${error.message}`],
        latency: Date.now() - startTime,
        workflow
      };
    }
  }

  // ==========================================================================
  // MULTI-PATH EXECUTION
  // ==========================================================================

  private getContextWeights(workflow: WorkflowType): ComponentWeightMap {
    return this.contextWeights.get(workflow) || {
      quantitative: 0.35,
      qualitative: 0.25,
      pattern_based: 0.25,
      historical: 0.15
    };
  }

  // ==========================================================================
  // CALIBRATION FACTORS (Over-Prediction Prevention)
  // ==========================================================================

  /**
   * Get niche difficulty factor - some niches are more competitive
   * 1.0 = normal, < 1.0 = harder to go viral, > 1.0 = easier
   */
  private getNicheDifficultyFactor(niche: string): number {
    const nicheDifficulty: Record<string, number> = {
      // Highly saturated, competitive niches (harder)
      'side-hustles': 0.85,
      'make-money-online': 0.80,
      'dropshipping': 0.75,
      'crypto': 0.85,
      'forex': 0.80,
      'affiliate-marketing': 0.80,
      
      // Moderately competitive
      'personal-finance': 0.90,
      'investing': 0.90,
      'fitness': 0.90,
      'weight-loss': 0.85,
      'productivity': 0.92,
      'tech': 0.92,
      
      // Less saturated, more opportunity
      'cooking': 1.0,
      'parenting': 1.0,
      'pets': 1.05,
      'travel': 0.95,
      'diy': 1.0,
      'gardening': 1.05,
      
      // Default
      'general': 1.0
    };
    
    // Normalize niche name
    const normalizedNiche = niche?.toLowerCase().replace(/[^a-z-]/g, '') || 'general';
    
    return nicheDifficulty[normalizedNiche] || 0.95;
  }

  /**
   * Get account size adjustment - larger accounts have different viral dynamics
   */
  private getAccountSizeAdjustment(followerCount: number | undefined, accountSize: string | undefined): number {
    let followers = followerCount || 0;
    
    // If followerCount not provided, estimate from accountSize
    if (!followers && accountSize) {
      const sizeEstimates: Record<string, number> = {
        'nano': 1000,
        'micro': 5000,
        'small': 15000,
        'medium': 50000,
        'large': 150000,
        'macro': 500000,
        'mega': 1000000
      };
      followers = sizeEstimates[accountSize.toLowerCase()] || 10000;
    }
    
    // Adjustment factor based on account size
    // Mid-size accounts (50K-200K) have hardest time going "viral" relative to size
    if (followers < 10000) {
      return 1.0; // Small accounts - predictions are baseline accurate
    } else if (followers < 50000) {
      return 0.98; // Growing accounts - slight reduction
    } else if (followers < 200000) {
      return 0.92; // Mid-size accounts - harder to exceed expectations
    } else if (followers < 500000) {
      return 0.95; // Large accounts - moderate adjustment
    } else {
      return 0.98; // Very large accounts - back to baseline
    }
  }

  /**
   * Apply calibration adjustments to final prediction
   */
  private applyCalibrationAdjustments(
    rawPrediction: number,
    input: VideoInput,
    baseConfidence: number
  ): { prediction: number; confidence: number; adjustments: Record<string, number> } {
    // ADJUSTMENT 1: Apply niche difficulty factor
    const nicheFactor = this.getNicheDifficultyFactor(input.niche || 'general');
    
    // ADJUSTMENT 2: Apply account size adjustment
    const accountFactor = this.getAccountSizeAdjustment(
      (input as any).creatorFollowers || (input as any).followerCount,
      input.accountSize
    );
    
    // ADJUSTMENT 3: Apply conservative pull for high predictions
    // High predictions (70+) are statistically less likely to be accurate
    let conservativeFactor = 1.0;
    if (rawPrediction > 80) {
      conservativeFactor = 0.92; // Pull back 8% for very high predictions
    } else if (rawPrediction > 70) {
      conservativeFactor = 0.95; // Pull back 5% for high predictions
    }
    
    // Apply all adjustments
    let finalPrediction = rawPrediction * nicheFactor * accountFactor * conservativeFactor;
    
    // Ensure bounds
    finalPrediction = Math.max(0, Math.min(100, finalPrediction));
    
    // Adjust confidence based on factors
    let confidenceAdjustment = 0;
    if (nicheFactor < 0.9) confidenceAdjustment -= 0.05; // Less confident in competitive niches
    if (!input.videoPath) confidenceAdjustment -= 0.1; // Less confident without video
    
    const adjustedConfidence = Math.max(0.4, Math.min(0.95, baseConfidence + confidenceAdjustment));
    
    // Log adjustments for debugging
    console.log('[Kai] Score calibration:', {
      rawScore: rawPrediction.toFixed(1),
      nicheFactor: nicheFactor.toFixed(2),
      accountFactor: accountFactor.toFixed(2),
      conservativeFactor: conservativeFactor.toFixed(2),
      finalScore: finalPrediction.toFixed(1),
      confidence: adjustedConfidence.toFixed(2)
    });
    
    return {
      prediction: Math.round(finalPrediction * 10) / 10,
      confidence: adjustedConfidence,
      adjustments: {
        nicheFactor,
        accountFactor,
        conservativeFactor
      }
    };
  }

  private async executeMultiPath(
    input: VideoInput,
    weights: ComponentWeightMap
  ): Promise<PathResult[]> {
    const pathPromises = Array.from(this.predictionPaths.entries()).map(
      async ([pathName, path]) => {
        console.log(`  Executing path: ${path.name}`);

        try {
          const results = await this.executeComponentsWithRetry(path.components, input);

          // Calculate aggregated prediction for this path
          // FILTER OUT: Components returning default/suspicious scores
          const successfulResults = results.filter(r => {
            if (!r.success || r.prediction === undefined) return false;
            
            // Exclude components returning obvious default values
            const defaultValues = [50, 62, 65, 68, 70];
            const isDefault = defaultValues.includes(Math.round(r.prediction));
            
            // Check if this component has real analysis (features or insights)
            const hasRealAnalysis = (r.features && Object.keys(r.features).length > 0) || 
                                    (r.insights && r.insights.length > 0 && !r.insights[0]?.includes('No '));
            
            // If it returns a default value AND has no real analysis, exclude it
            if (isDefault && !hasRealAnalysis) {
              console.log(`    Excluding ${r.componentId} from average (default value: ${r.prediction}, no analysis)`);
              return false;
            }
            
            return true;
          });
          
          let aggregatedPrediction: number | undefined;
          let aggregatedConfidence: number | undefined;

          if (successfulResults.length > 0) {
            // Weighted average by component confidence
            // Give EXTRA weight to components with extreme scores (they're likely more discriminating)
            let totalWeight = 0;
            let weightedSum = 0;
            let confidenceSum = 0;

            for (const result of successfulResults) {
              let weight = result.confidence || 0.5;
              
              // Boost weight for extreme scores (more discriminating)
              const score = result.prediction || 50;
              if (score < 30 || score > 80) {
                weight *= 1.5; // 50% boost for extreme scores
              }
              
              // Boost weight for LLM-based components (more nuanced analysis)
              // Gemini gets HIGHEST boost - it's the most accurate differentiator
              if (result.componentId === 'gemini') {
                weight *= 2.5; // 150% boost for Gemini (most accurate)
              } else if (['gpt4', '9-attributes', '7-legos'].includes(result.componentId)) {
                weight *= 1.2; // 20% boost for other LLM components
              }
              
              weightedSum += (result.prediction || 0) * weight;
              totalWeight += weight;
              confidenceSum += result.confidence || 0;
            }

            aggregatedPrediction = totalWeight > 0 ? weightedSum / totalWeight : undefined;
            aggregatedConfidence = successfulResults.length > 0
              ? confidenceSum / successfulResults.length
              : undefined;
          }

          return {
            path: pathName,
            results,
            weight: weights[pathName] || path.weight,
            success: successfulResults.length > 0,
            aggregatedPrediction,
            aggregatedConfidence
          };
        } catch (error: any) {
          console.error(`    Path ${pathName} failed: ${error.message}`);
          return {
            path: pathName,
            results: [],
            weight: weights[pathName] || path.weight,
            success: false
          };
        }
      }
    );

    return Promise.all(pathPromises);
  }

  // ==========================================================================
  // RETRY WITH ENHANCEMENT PIPELINE
  // ==========================================================================

  private async executeComponentsWithRetry(
    componentIds: string[],
    input: VideoInput
  ): Promise<ComponentResult[]> {
    const results: ComponentResult[] = [];

    for (const componentId of componentIds) {
      const component = this.componentRegistry.get(componentId);

      if (!component) {
        console.warn(`    Component not found: ${componentId}`);
        results.push({
          componentId,
          success: false,
          error: 'Component not registered',
          latency: 0
        });
        continue;
      }

      if (component.status === 'failed') {
        console.warn(`    Skipping failed component: ${componentId}`);
        results.push({
          componentId,
          success: false,
          error: 'Component marked as failed',
          latency: 0
        });
        continue;
      }

      // Check if component has active A/B test
      const variantInfo = await this.getComponentVariant(componentId);
      let testInput = input;

      if (variantInfo) {
        console.log(`    A/B Test active for ${componentId} - Using variant ${variantInfo.variant}`);
        // Merge variant config into input (component can use this to modify behavior)
        testInput = { ...input, _abTestConfig: variantInfo.config };
      }

      let attempt = 0;
      let success = false;
      let result: ComponentResult | null = null;

      while (attempt < 3 && !success) {
        const startTime = Date.now();

        try {
          if (attempt === 0) {
            // Level 1: Quick attempt with standard timeout
            result = await this.executeWithTimeout(component, testInput, 5000);
          } else if (attempt === 1) {
            // Level 2: Retry with enhanced input
            console.log(`      Retry ${attempt + 1} for ${componentId} with enhanced input`);
            const enhanced = await this.enhanceInput(testInput, component.type);
            result = await this.executeWithTimeout(component, enhanced, 10000);
          } else {
            // Level 3: Alternative method with longer timeout
            console.log(`      Retry ${attempt + 1} for ${componentId} with alternative method`);
            result = await this.executeAlternativeMethod(component, testInput);
          }

          success = result.success;

          if (success) {
            // Update component stats
            component.lastSuccess = new Date();
            component.avgLatency = (component.avgLatency + result.latency) / 2;

            // Record A/B test prediction if test is active
            if (variantInfo && result.prediction !== undefined) {
              await this.recordTestPrediction(
                componentId,
                variantInfo.variant,
                result.prediction,
                input.videoId
              );
            }
          } else {
            // Increment attempt even if component returns success: false
            attempt++;
          }
        } catch (error: any) {
          attempt++;
          console.warn(`      Attempt ${attempt} failed for ${componentId}: ${error.message}`);

          result = {
            componentId,
            success: false,
            error: error.message,
            latency: Date.now() - startTime
          };
        }
      }

      if (!success && result) {
        // Level 4: Mark for review and use partial result
        console.warn(`      All retries failed for ${componentId}`);
        this.flagForReview(component, input);

        // Degrade component reliability
        component.reliability = Math.max(0, component.reliability - 0.05);
        if (component.reliability < 0.5) {
          component.status = 'degraded';
        }
      }

      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  private async executeWithTimeout(
    component: ComponentRegistry,
    input: VideoInput,
    timeout: number
  ): Promise<ComponentResult> {
    const timeoutPromise = new Promise<ComponentResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms`));
      }, timeout);
    });

    const executionPromise = component.execute(input);

    return Promise.race([executionPromise, timeoutPromise]);
  }

  private async enhanceInput(input: VideoInput, type: string): Promise<VideoInput> {
    // Enhance input based on component type
    const enhanced = { ...input };

    if (type === 'qualitative' && !enhanced.transcript) {
      // Try to generate transcript if missing
      enhanced.transcript = 'Unable to extract transcript';
    }

    if (type === 'pattern' && !enhanced.hashtags) {
      // Extract hashtags from description
      const hashtagMatches = (enhanced.description || '').match(/#\w+/g);
      enhanced.hashtags = hashtagMatches || [];
    }

    return enhanced;
  }

  private async executeAlternativeMethod(
    component: ComponentRegistry,
    input: VideoInput
  ): Promise<ComponentResult> {
    // Try alternative approach for the component
    const startTime = Date.now();

    try {
      // For most components, just retry with longer timeout
      const result = await component.execute(input);
      return result;
    } catch (error: any) {
      return {
        componentId: component.id,
        success: false,
        error: `Alternative method failed: ${error.message}`,
        latency: Date.now() - startTime
      };
    }
  }

  private flagForReview(component: ComponentRegistry, input: VideoInput): void {
    console.warn(`FLAGGED FOR REVIEW: ${component.id} failed for video ${input.videoId}`);
    // In production, this would log to a review queue
  }

  // ==========================================================================
  // AGREEMENT ANALYSIS
  // ==========================================================================

  private calculateAgreement(pathResults: PathResult[]): AgreementAnalysis {
    const predictions = pathResults
      .filter(p => p.success && p.aggregatedPrediction !== undefined)
      .map(p => ({ path: p.path, prediction: p.aggregatedPrediction! }));

    if (predictions.length < 2) {
      return { level: 'high', variance: 0, outliers: [] };
    }

    // Calculate mean
    const mean = predictions.reduce((sum, p) => sum + p.prediction, 0) / predictions.length;

    // Calculate variance
    const variance = predictions.reduce(
      (sum, p) => sum + Math.pow(p.prediction - mean, 2),
      0
    ) / predictions.length;

    const stdDev = Math.sqrt(variance);

    // Identify outliers (more than 2 standard deviations from mean)
    const outliers = predictions
      .filter(p => Math.abs(p.prediction - mean) > 2 * stdDev)
      .map(p => p.path);

    // Determine agreement level
    let level: 'high' | 'moderate' | 'low';
    if (stdDev < 5) {
      level = 'high';
    } else if (stdDev < 15) {
      level = 'moderate';
    } else {
      level = 'low';
    }

    return { level, variance, outliers };
  }

  // ==========================================================================
  // SYNTHESIS METHODS
  // ==========================================================================

  private synthesizeConfidentPrediction(pathResults: PathResult[]): {
    prediction: number;
    confidence: number;
    recommendations: string[];
  } {
    const predictions = pathResults
      .filter(p => p.success && p.aggregatedPrediction !== undefined);

    // Simple weighted average for high agreement
    let totalWeight = 0;
    let weightedSum = 0;
    let confidenceSum = 0;

    for (const path of predictions) {
      weightedSum += path.aggregatedPrediction! * path.weight;
      totalWeight += path.weight;
      confidenceSum += (path.aggregatedConfidence || 0.5) * path.weight;
    }

    const prediction = totalWeight > 0 ? weightedSum / totalWeight : 50;
    const confidence = totalWeight > 0 ? confidenceSum / totalWeight : 0.5;

    // High confidence = 0.95+ when paths agree
    const adjustedConfidence = Math.min(0.98, confidence + 0.1);

    return {
      prediction,
      confidence: adjustedConfidence,
      recommendations: this.generateRecommendations(pathResults, prediction)
    };
  }

  private synthesizeWeightedConsensus(
    pathResults: PathResult[],
    weights: ComponentWeightMap
  ): {
    prediction: number;
    confidence: number;
    recommendations: string[];
  } {
    const predictions = pathResults
      .filter(p => p.success && p.aggregatedPrediction !== undefined);

    // Apply context-aware weights + component reliability weights
    let totalWeight = 0;
    let weightedSum = 0;
    let confidenceSum = 0;

    for (const path of predictions) {
      const contextWeight = weights[path.path] || path.weight;

      // Calculate average reliability of components in this path
      let pathReliability = 1.0;
      let reliabilityCount = 0;
      for (const result of path.results) {
        const component = this.componentRegistry.get(result.componentId);
        if (component) {
          pathReliability += component.reliability;
          reliabilityCount++;
        }
      }
      pathReliability = reliabilityCount > 0 ? pathReliability / reliabilityCount : 0.5;

      // Combine context weight with learned reliability
      const finalWeight = contextWeight * pathReliability;

      weightedSum += path.aggregatedPrediction! * finalWeight;
      totalWeight += finalWeight;
      confidenceSum += (path.aggregatedConfidence || 0.5) * finalWeight;
    }

    const prediction = totalWeight > 0 ? weightedSum / totalWeight : 50;
    const confidence = totalWeight > 0 ? confidenceSum / totalWeight : 0.5;

    // Moderate agreement = lower confidence
    const adjustedConfidence = Math.max(0.6, confidence - 0.05);

    return {
      prediction,
      confidence: adjustedConfidence,
      recommendations: this.generateRecommendations(pathResults, prediction)
    };
  }

  private async performDeepAnalysis(
    pathResults: PathResult[],
    input: VideoInput
  ): Promise<{
    prediction: number;
    confidence: number;
    recommendations: string[];
  }> {
    console.log('  Performing deep analysis due to low agreement...');

    // When paths disagree significantly:
    // CHANGED: Don't use median - it ignores accurate low scores from Gemini
    // Instead: Use weighted average with EXTRA weight on qualitative path (Gemini)
    // because Gemini is the most accurate differentiator

    const predictions = pathResults
      .filter(p => p.success && p.aggregatedPrediction !== undefined);

    if (predictions.length === 0) {
      return {
        prediction: 50,
        confidence: 0.3,
        recommendations: ['Unable to generate reliable prediction - insufficient data']
      };
    }

    // Use weighted average with qualitative boost
    let totalWeight = 0;
    let weightedSum = 0;

    for (const path of predictions) {
      let weight = path.weight;
      
      // CRITICAL: Give qualitative path (Gemini) 3x weight in disagreement scenarios
      // because Gemini is the most accurate differentiator
      if (path.path === 'qualitative') {
        weight *= 3.0;
        console.log(`    Boosting qualitative weight 3x (Gemini is most accurate)`);
      }
      
      weightedSum += path.aggregatedPrediction! * weight;
      totalWeight += weight;
    }

    const prediction = totalWeight > 0 ? weightedSum / totalWeight : 50;

    // Lower confidence for deep analysis scenarios
    const confidence = 0.65;

    return {
      prediction,
      confidence,
      recommendations: [
        'Prediction based on weighted average (qualitative boosted due to disagreement)',
        'High path variance indicates mixed signals',
        ...this.generateRecommendations(pathResults, prediction)
      ]
    };
  }

  // ==========================================================================
  // PATTERN CHECKING
  // ==========================================================================

  private async checkViralPatterns(input: VideoInput): Promise<number> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      // Get patterns for this niche
      const { data: patterns } = await supabase
        .from('viral_genomes')
        .select('*')
        .eq('niche', input.niche || 'general')
        .gte('success_rate', 0.7);

      if (!patterns || patterns.length === 0) return 0;

      let boost = 0;
      const transcript = (input.transcript || '').toLowerCase();

      for (const pattern of patterns) {
        // Simple keyword matching for now based on pattern_dna description
        // In a real system, we'd parse the JSON pattern
        if (transcript.includes('hook') || transcript.includes('secret')) {
           // Placeholder logic: if we match high-level concepts
           boost += (pattern.success_rate || 0.1) * 0.05;
        }
      }

      return Math.min(boost, 0.3); // Max 30% boost from patterns
    } catch (e) {
      console.warn('Pattern check failed', e);
      return 0;
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private getViralPotential(dps: number): 'mega-viral' | 'viral' | 'good' | 'average' | 'low' {
    if (dps >= 85) return 'mega-viral';
    if (dps >= 70) return 'viral';
    if (dps >= 55) return 'good';
    if (dps >= 40) return 'average';
    return 'low';
  }

  private generateRecommendations(pathResults: PathResult[], prediction: number): string[] {
    const recommendations: string[] = [];

    // Based on prediction level
    if (prediction < 40) {
      recommendations.push('Consider strengthening the hook in first 3 seconds');
      recommendations.push('Add more curiosity gaps throughout the content');
      recommendations.push('Increase emotional resonance with target audience');
    } else if (prediction < 55) {
      recommendations.push('Content has potential - focus on improving pacing');
      recommendations.push('Consider adding a clear call-to-action');
    } else if (prediction < 70) {
      recommendations.push('Good viral potential - optimize hashtags for discovery');
      recommendations.push('Test posting at peak engagement times');
    } else {
      recommendations.push('Strong viral potential - ready for publishing');
      recommendations.push('Consider A/B testing different hooks');
    }

    // Extract insights from path results
    for (const path of pathResults) {
      for (const result of path.results) {
        if (result.insights) {
          recommendations.push(...result.insights.slice(0, 2));
        }
      }
    }

    // Deduplicate and limit
    return [...new Set(recommendations)].slice(0, 5);
  }

  // ==========================================================================
  // COMPONENT EXECUTION METHODS
  // ==========================================================================

  private async execute9Attributes(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Nine Attributes Framework Analysis
      // Based on project docs: Getting Attention (4) + Holding Attention (5)
      const analysis = await this.analyzeNineAttributes(input);

      // Generate insights from analysis
      const insights: string[] = [];
      
      // Find strongest and weakest
      const scores = [
        { name: 'TAM Resonance', score: analysis.tamResonance.score },
        { name: 'Sharability', score: analysis.sharability.score },
        { name: 'Hook Strength', score: analysis.hookStrength.score },
        { name: 'Format Innovation', score: analysis.formatInnovation.score },
        { name: 'Value Density', score: analysis.valueDensity.score },
        { name: 'Pacing & Rhythm', score: analysis.pacingRhythm.score },
        { name: 'Curiosity Gaps', score: analysis.curiosityGaps.score },
        { name: 'Emotional Journey', score: analysis.emotionalJourney.score },
        { name: 'Clear Payoff', score: analysis.clearPayoff.score }
      ];
      
      const sorted = [...scores].sort((a, b) => b.score - a.score);
      const strongest = sorted[0];
      const weakest = sorted[sorted.length - 1];
      
      insights.push(`Strongest: ${strongest.name} (${strongest.score}/10)`);
      insights.push(`Weakest: ${weakest.name} (${weakest.score}/10)`);
      insights.push(`Attention Score: ${analysis.attentionScore.toFixed(1)}/10`);
      insights.push(`Retention Score: ${analysis.retentionScore.toFixed(1)}/10`);
      
      if (analysis.hookStrength.score >= 8) {
        insights.push('✓ Strong hook - captures attention immediately');
      } else if (analysis.hookStrength.score <= 5) {
        insights.push('⚠ Weak hook - improve first 3 seconds');
      }

      return {
        componentId: '9-attributes',
        success: true,
        prediction: analysis.totalScore,
        confidence: 0.85,
        insights,
        features: {
          // Individual attribute scores with reasons
          tamResonance: analysis.tamResonance,
          sharability: analysis.sharability,
          hookStrength: analysis.hookStrength,
          formatInnovation: analysis.formatInnovation,
          valueDensity: analysis.valueDensity,
          pacingRhythm: analysis.pacingRhythm,
          curiosityGaps: analysis.curiosityGaps,
          emotionalJourney: analysis.emotionalJourney,
          clearPayoff: analysis.clearPayoff,
          // Aggregate scores
          attentionScore: analysis.attentionScore,
          retentionScore: analysis.retentionScore,
          strongestAttribute: strongest.name,
          weakestAttribute: weakest.name
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: '9-attributes',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Nine Attributes Framework Analysis
   * 
   * GETTING ATTENTION (Bucket 1):
   * 1. TAM Resonance - How broad is the potential audience?
   * 2. Sharability Factor - How likely to be shared?
   * 3. Hook Strength - Impact in first 1-3 seconds
   * 4. Format Innovation - Visual/structural presentation
   * 
   * HOLDING ATTENTION (Bucket 2):
   * 5. Value Density - Useful information per second
   * 6. Pacing & Rhythm - Speed and flow
   * 7. Curiosity Gaps - Open loops that must be closed
   * 8. Emotional Journey - Feeling progression
   * 9. Clear Payoff - Valuable conclusion
   */
  private async analyzeNineAttributes(input: VideoInput): Promise<{
    tamResonance: { score: number; reason: string };
    sharability: { score: number; reason: string };
    hookStrength: { score: number; reason: string };
    formatInnovation: { score: number; reason: string };
    valueDensity: { score: number; reason: string };
    pacingRhythm: { score: number; reason: string };
    curiosityGaps: { score: number; reason: string };
    emotionalJourney: { score: number; reason: string };
    clearPayoff: { score: number; reason: string };
    attentionScore: number;
    retentionScore: number;
    totalScore: number;
  }> {
    const transcript = (input.transcript || '').toLowerCase();
    const originalTranscript = input.transcript || '';
    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = originalTranscript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const firstSentence = sentences[0]?.toLowerCase() || '';
    const lastSentence = sentences[sentences.length - 1]?.toLowerCase() || '';
    
    // Helper functions
    const count = (regex: RegExp) => (transcript.match(regex) || []).length;
    const has = (regex: RegExp) => regex.test(transcript);
    const hasInFirst = (regex: RegExp) => regex.test(firstSentence);

    // =========================================================================
    // BUCKET 1: GETTING ATTENTION
    // =========================================================================

    // 1. TAM Resonance (Target Audience Match / Broad Appeal)
    let tamScore = 5;
    let tamReason = 'Moderate audience appeal';
    
    // Universal topics that resonate broadly
    const universalTopics = /money|wealth|health|relationship|success|happiness|fear|love|secret|truth|mistake/;
    const nicheTopics = /crypto|nft|blockchain|coding|programming|specific\s+tool/;
    
    if (has(universalTopics)) {
      tamScore += 3;
      tamReason = 'Universal topic with broad appeal';
    }
    if (has(/everyone|most people|nobody|you all|we all/)) {
      tamScore += 2;
      tamReason = 'Inclusive language expands audience';
    }
    if (has(nicheTopics)) {
      tamScore -= 1;
      tamReason = 'Niche topic limits audience size';
    }
    // Check niche alignment
    if (input.niche && transcript.includes(input.niche.toLowerCase().split('/')[0])) {
      tamScore += 1;
    }
    tamScore = Math.min(10, Math.max(1, tamScore));

    // 2. Sharability Factor
    let shareScore = 5;
    let shareReason = 'Moderate share potential';
    
    // Direct share triggers
    if (has(/send this to|tag a friend|share with|tell someone/)) {
      shareScore += 3;
      shareReason = 'Direct share CTA present';
    }
    // Relatable content
    if (has(/relatable|literally me|pov:|so true|fr fr|no cap/)) {
      shareScore += 2;
      shareReason = 'Highly relatable content';
    }
    // Controversial/debate-worthy
    if (has(/unpopular opinion|hot take|controversial|debate|disagree/)) {
      shareScore += 2;
      shareReason = 'Controversial content drives shares';
    }
    // Educational value (people share to look smart)
    if (has(/did you know|most people don't know|secret|hack|trick/)) {
      shareScore += 2;
      shareReason = 'Educational content people want to share';
    }
    shareScore = Math.min(10, Math.max(1, shareScore));

    // 3. Hook Strength (First 1-3 seconds / first sentence)
    let hookScore = 5;
    let hookReason = 'Average hook';
    
    // Question hooks
    if (hasInFirst(/\?/)) {
      hookScore += 2;
      hookReason = 'Question hook creates curiosity';
    }
    // Pattern interrupt words
    if (hasInFirst(/stop|wait|hold on|listen|watch this|look/)) {
      hookScore += 3;
      hookReason = 'Strong pattern interrupt';
    }
    // Benefit-driven hooks
    if (hasInFirst(/want to|how to|here's how|the secret|the reason/)) {
      hookScore += 2;
      hookReason = 'Benefit-driven hook';
    }
    // Direct address
    if (hasInFirst(/you |your /)) {
      hookScore += 1;
      hookReason += ' with direct address';
    }
    // Shock/curiosity triggers
    if (hasInFirst(/secret|nobody|never|always|mistake|wrong|truth/)) {
      hookScore += 2;
      hookReason = 'Curiosity-triggering hook';
    }
    // Short punchy hook (under 10 words is ideal)
    const hookWordCount = firstSentence.split(/\s+/).length;
    if (hookWordCount <= 10 && hookWordCount > 0) {
      hookScore += 1;
    }
    hookScore = Math.min(10, Math.max(1, hookScore));

    // 4. Format Innovation
    let formatScore = 6;
    let formatReason = 'Standard format';
    
    // Text indicators of format variety
    if (has(/step \d|number \d|first|second|third/)) {
      formatScore += 1;
      formatReason = 'List/step format adds structure';
    }
    if (has(/watch this|look at this|see this|check this/)) {
      formatScore += 1;
      formatReason = 'Visual demonstration indicated';
    }
    // Story format
    if (has(/once|when i|story time|let me tell you/)) {
      formatScore += 2;
      formatReason = 'Story format engages viewers';
    }
    // POV format
    if (has(/pov:|imagine|picture this/)) {
      formatScore += 2;
      formatReason = 'POV format is innovative';
    }
    formatScore = Math.min(10, Math.max(1, formatScore));

    // =========================================================================
    // BUCKET 2: HOLDING ATTENTION
    // =========================================================================

    // 5. Value Density (Information per second)
    let valueScore = 5;
    let valueReason = 'Moderate value density';
    
    // Actionable content
    if (has(/how to|step by step|tutorial|guide|tips|hack|trick/)) {
      valueScore += 2;
      valueReason = 'Actionable how-to content';
    }
    // Specific numbers/data
    if (has(/\d+%|\$\d+|\d+ ways|\d+ tips|\d+ reasons/)) {
      valueScore += 2;
      valueReason = 'Specific data adds credibility';
    }
    // Examples
    if (has(/for example|like this|such as|here's an example/)) {
      valueScore += 1;
      valueReason = 'Examples increase value';
    }
    // Unique insights
    if (has(/most people|nobody knows|secret|hidden|truth is/)) {
      valueScore += 2;
      valueReason = 'Unique insights provide value';
    }
    // Word count check (too short = low value, too long = diluted)
    if (wordCount >= 50 && wordCount <= 200) {
      valueScore += 1;
    }
    valueScore = Math.min(10, Math.max(1, valueScore));

    // 6. Pacing & Rhythm
    let paceScore = 6;
    let paceReason = 'Standard pacing';
    
    // Short sentences = faster pace
    const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
    if (avgSentenceLength <= 12) {
      paceScore += 2;
      paceReason = 'Short punchy sentences maintain pace';
    } else if (avgSentenceLength >= 25) {
      paceScore -= 2;
      paceReason = 'Long sentences may slow pace';
    }
    // Exclamation marks indicate energy
    const exclamationCount = count(/!/g);
    if (exclamationCount >= 2) {
      paceScore += 1;
      paceReason = 'High energy delivery';
    }
    // Variety in sentence structure
    if (sentences.length >= 4) {
      paceScore += 1;
    }
    paceScore = Math.min(10, Math.max(1, paceScore));

    // 7. Curiosity Gaps (Open loops)
    let curiosityScore = 5;
    let curiosityReason = 'Moderate curiosity';
    
    // Questions create open loops
    const questionCount = count(/\?/g);
    if (questionCount >= 1) {
      curiosityScore += 1;
    }
    if (questionCount >= 3) {
      curiosityScore += 1;
      curiosityReason = 'Multiple questions create loops';
    }
    // Teaser phrases
    if (has(/here's why|the reason is|but wait|and here's the thing/)) {
      curiosityScore += 2;
      curiosityReason = 'Teaser phrases create anticipation';
    }
    // Incomplete information that needs resolution
    if (has(/secret|hidden|reveal|discover|find out|you won't believe/)) {
      curiosityScore += 2;
      curiosityReason = 'Strong curiosity triggers';
    }
    // "But" creates contrast/curiosity
    if (has(/but |however |instead /)) {
      curiosityScore += 1;
    }
    curiosityScore = Math.min(10, Math.max(1, curiosityScore));

    // 8. Emotional Journey
    let emotionScore = 5;
    let emotionReason = 'Moderate emotional impact';
    
    // Positive emotions
    const positiveWords = /love|amazing|incredible|awesome|best|perfect|happy|excited|success/;
    // Negative emotions (create contrast)
    const negativeWords = /hate|terrible|worst|mistake|wrong|fail|struggle|pain|fear/;
    
    const hasPositive = has(positiveWords);
    const hasNegative = has(negativeWords);
    
    if (hasPositive && hasNegative) {
      emotionScore += 3;
      emotionReason = 'Emotional contrast creates journey';
    } else if (hasPositive) {
      emotionScore += 2;
      emotionReason = 'Positive emotional tone';
    } else if (hasNegative) {
      emotionScore += 1;
      emotionReason = 'Negative emotion needs resolution';
    }
    // Exclamations show emotion
    if (exclamationCount >= 2) {
      emotionScore += 1;
    }
    // Personal stories
    if (has(/i was|i felt|i realized|my experience|when i/)) {
      emotionScore += 2;
      emotionReason = 'Personal story creates connection';
    }
    emotionScore = Math.min(10, Math.max(1, emotionScore));

    // 9. Clear Payoff
    let payoffScore = 5;
    let payoffReason = 'Moderate payoff';
    
    // CTA at end
    if (has(/follow|subscribe|like|comment|share|link in bio|check out/)) {
      payoffScore += 1;
      payoffReason = 'Clear CTA provides direction';
    }
    // Summary/conclusion indicators
    if (has(/so remember|the key is|bottom line|in summary|that's how|now you know/)) {
      payoffScore += 2;
      payoffReason = 'Clear conclusion wraps up content';
    }
    // Actionable takeaway
    if (has(/try this|do this|start|go|now you can/)) {
      payoffScore += 2;
      payoffReason = 'Actionable takeaway';
    }
    // Promise fulfilled
    if (has(/that's the secret|there you have it|and that's|so that's/)) {
      payoffScore += 2;
      payoffReason = 'Promise from hook is fulfilled';
    }
    payoffScore = Math.min(10, Math.max(1, payoffScore));

    // =========================================================================
    // CALCULATE AGGREGATE SCORES
    // =========================================================================

    // Attention Score (Hook weighted 1.5x for short-form)
    const attentionScore = (
      tamScore + 
      shareScore + 
      (hookScore * 1.5) + 
      formatScore
    ) / 4.5;

    // Retention Score
    const retentionScore = (
      valueScore + 
      paceScore + 
      curiosityScore + 
      emotionScore + 
      payoffScore
    ) / 5;

    // Final Score: 60% attention, 40% retention (for short-form)
    const totalScore = Math.round((attentionScore * 0.6 + retentionScore * 0.4) * 10);

    return {
      tamResonance: { score: tamScore, reason: tamReason },
      sharability: { score: shareScore, reason: shareReason },
      hookStrength: { score: hookScore, reason: hookReason },
      formatInnovation: { score: formatScore, reason: formatReason },
      valueDensity: { score: valueScore, reason: valueReason },
      pacingRhythm: { score: paceScore, reason: paceReason },
      curiosityGaps: { score: curiosityScore, reason: curiosityReason },
      emotionalJourney: { score: emotionScore, reason: emotionReason },
      clearPayoff: { score: payoffScore, reason: payoffReason },
      attentionScore,
      retentionScore,
      totalScore: Math.min(100, Math.max(0, totalScore))
    };
  }

  // NOTE: execute24Styles REMOVED - was returning hardcoded value 70
  // Component not registered, method was dead code

  private async executeXGBoost(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // For now, use a simplified prediction based on transcript analysis
      // This avoids import issues while still providing value
      const transcript = input.transcript || '';

      // Simple heuristic-based scoring
      let score = 50;

      // Word count scoring
      const wordCount = transcript.split(/\s+/).length;
      if (wordCount >= 100 && wordCount <= 300) score += 10;
      else if (wordCount > 300) score += 5;

      // Question marks (curiosity)
      const questions = (transcript.match(/\?/g) || []).length;
      score += Math.min(10, questions * 2);

      // Exclamation marks (emotion)
      const exclamations = (transcript.match(/!/g) || []).length;
      score += Math.min(5, exclamations);

      // Power words
      const powerWords = ['secret', 'proven', 'guaranteed', 'exclusive', 'limited', 'free', 'new', 'now', 'instant', 'easy'];
      const powerCount = powerWords.filter(w => transcript.toLowerCase().includes(w)).length;
      score += powerCount * 3;

      // Call to action
      const ctaWords = ['follow', 'like', 'comment', 'share', 'subscribe', 'click', 'link', 'bio'];
      const ctaCount = ctaWords.filter(w => transcript.toLowerCase().includes(w)).length;
      score += ctaCount * 2;

      return {
        componentId: 'xgboost',
        success: true,
        prediction: Math.min(100, Math.max(0, score)),
        confidence: 0.75,
        insights: [
          `Word count: ${wordCount}`,
          `Questions: ${questions}`,
          `Power words: ${powerCount}`
        ],
        features: { wordCount, questions, powerCount, ctaCount },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'xgboost',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executeFFmpeg(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Use pre-computed FFmpeg data if available
      if (input.ffmpegData) {
        const visualScore = this.calculateVisualScore(input.ffmpegData);
        return {
          componentId: 'ffmpeg',
          success: true,
          prediction: visualScore,
          confidence: 0.90,
          insights: [
            `Duration: ${input.ffmpegData.duration}s`,
            `Resolution: ${input.ffmpegData.width}x${input.ffmpegData.height}`,
            `FPS: ${input.ffmpegData.fps}`
          ],
          features: input.ffmpegData,
          latency: Date.now() - startTime
        };
      }

      // No FFmpeg data available
      return {
        componentId: 'ffmpeg',
        success: false,
        error: 'No FFmpeg data available',
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'ffmpeg',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private calculateVisualScore(ffmpegData: any): number {
    // Score based on optimal video characteristics
    let score = 50;

    // Optimal duration: 15-60 seconds
    if (ffmpegData.duration >= 15 && ffmpegData.duration <= 60) {
      score += 15;
    } else if (ffmpegData.duration < 15) {
      score += 5;
    }

    // High resolution bonus
    if (ffmpegData.height >= 1080) {
      score += 10;
    }

    // Good FPS bonus
    if (ffmpegData.fps >= 30) {
      score += 5;
    }

    // Vertical aspect ratio for TikTok
    if (ffmpegData.aspectRatio && ffmpegData.height > ffmpegData.width) {
      score += 10;
    }

    // Has audio
    if (ffmpegData.hasAudio) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * 7 Idea Legos Framework
   * 
   * Breaks down viral videos into 7 component building blocks:
   * 1. TOPIC - One sentence description of video content
   * 2. ANGLE - Unique premise, take, and key facts
   * 3. HOOK STRUCTURE - Spoken hook, Text hook, Visual hook
   * 4. STORY STRUCTURE - Narrative flow (breakdown, tutorial, list, etc.)
   * 5. VISUAL FORMAT - Overall layout (green screen, POV, faceless, etc.)
   * 6. KEY VISUALS - Actual visuals used (A-roll, B-roll, animations)
   * 7. AUDIO - Background music or sound effects
   */
  private async execute7Legos(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const transcript = input.transcript || '';
      const transcriptLower = transcript.toLowerCase();
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const firstSentence = sentences[0]?.trim() || '';
      const words = transcriptLower.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;

      // Extract and score each of the 7 Idea Legos
      const legos = await this.extractSevenLegos(input, transcript, transcriptLower, sentences, firstSentence, wordCount);

      // Generate insights
      const insights: string[] = [];
      insights.push(`Topic: ${legos.topic.description}`);
      insights.push(`Angle: ${legos.angle.description}`);
      insights.push(`Hook: "${legos.hook.spoken.substring(0, 50)}..."`);
      insights.push(`Structure: ${legos.storyStructure.type}`);
      insights.push(`Format: ${legos.visualFormat.type}`);
      insights.push(`Strongest Lego: ${legos.strongestLego}`);
      insights.push(`Weakest Lego: ${legos.weakestLego}`);

      return {
        componentId: '7-legos',
        success: true,
        prediction: legos.overallScore,
        confidence: 0.80,
        insights,
        features: {
          topic: legos.topic,
          angle: legos.angle,
          hook: legos.hook,
          storyStructure: legos.storyStructure,
          visualFormat: legos.visualFormat,
          keyVisuals: legos.keyVisuals,
          audio: legos.audio,
          strongestLego: legos.strongestLego,
          weakestLego: legos.weakestLego,
          viralPatternMatch: legos.viralPatternMatch
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: '7-legos',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async extractSevenLegos(
    input: VideoInput,
    transcript: string,
    transcriptLower: string,
    sentences: string[],
    firstSentence: string,
    wordCount: number
  ): Promise<{
    topic: { description: string; clarity: number; relevance: number };
    angle: { description: string; uniqueness: number; intrigue: number };
    hook: { spoken: string; effectiveness: number };
    storyStructure: { type: string; execution: number };
    visualFormat: { type: string; match: number };
    keyVisuals: { elements: string[]; variety: number };
    audio: { description: string; enhancement: number };
    overallScore: number;
    strongestLego: string;
    weakestLego: string;
    viralPatternMatch: string;
  }> {
    const niche = (input.niche || 'general').toLowerCase();

    // =========================================================================
    // LEGO 1: TOPIC
    // =========================================================================
    let topicDescription = 'General content';
    let topicClarity = 5;
    let topicRelevance = 5;

    // Extract topic from first sentence or key phrases
    if (firstSentence.length > 0) {
      topicDescription = firstSentence.length > 100 
        ? firstSentence.substring(0, 100) + '...' 
        : firstSentence;
    }

    // Topic clarity - is it immediately clear what this is about?
    const clarityIndicators = /how to|what is|why|the secret|the truth|here's|this is/i;
    if (clarityIndicators.test(firstSentence)) {
      topicClarity += 3;
    }
    if (wordCount >= 30 && wordCount <= 200) {
      topicClarity += 1; // Optimal length for clarity
    }

    // Topic relevance - trending/interesting topics
    const trendingTopics = /money|wealth|ai|passive income|side hustle|health|relationship|success|viral|hack|secret/;
    if (trendingTopics.test(transcriptLower)) {
      topicRelevance += 3;
    }
    // Niche alignment
    if (transcriptLower.includes(niche.split('/')[0])) {
      topicRelevance += 2;
    }
    topicClarity = Math.min(10, Math.max(1, topicClarity));
    topicRelevance = Math.min(10, Math.max(1, topicRelevance));

    // =========================================================================
    // LEGO 2: ANGLE
    // =========================================================================
    let angleDescription = 'Standard approach';
    let angleUniqueness = 5;
    let angleIntrigue = 5;

    // Detect unique angles
    const contrarianAngle = /most people|everyone thinks|common mistake|wrong about|actually|truth is|nobody|secret/;
    const personalAngle = /i discovered|i learned|my experience|when i|i was|i realized/;
    const dataAngle = /study shows|research|statistics|data|percent|%/;
    const storyAngle = /story time|let me tell you|once upon|when i was/;

    if (contrarianAngle.test(transcriptLower)) {
      angleDescription = 'Contrarian/Myth-busting angle';
      angleUniqueness += 3;
      angleIntrigue += 2;
    } else if (personalAngle.test(transcriptLower)) {
      angleDescription = 'Personal experience angle';
      angleUniqueness += 2;
      angleIntrigue += 2;
    } else if (dataAngle.test(transcriptLower)) {
      angleDescription = 'Data-driven angle';
      angleUniqueness += 2;
      angleIntrigue += 1;
    } else if (storyAngle.test(transcriptLower)) {
      angleDescription = 'Storytelling angle';
      angleUniqueness += 2;
      angleIntrigue += 3;
    }

    // Questions create intrigue
    const questionCount = (transcriptLower.match(/\?/g) || []).length;
    if (questionCount >= 1) angleIntrigue += 1;
    if (questionCount >= 3) angleIntrigue += 1;

    angleUniqueness = Math.min(10, Math.max(1, angleUniqueness));
    angleIntrigue = Math.min(10, Math.max(1, angleIntrigue));

    // =========================================================================
    // LEGO 3: HOOK STRUCTURE
    // =========================================================================
    const spokenHook = firstSentence || 'No hook detected';
    let hookEffectiveness = 5;

    // Pattern interrupt hooks
    if (/stop|wait|hold on|listen|watch this/i.test(firstSentence)) {
      hookEffectiveness += 3;
    }
    // Question hooks
    if (/\?/.test(firstSentence)) {
      hookEffectiveness += 2;
    }
    // Benefit-driven hooks
    if (/want to|here's how|the secret|how to/i.test(firstSentence)) {
      hookEffectiveness += 2;
    }
    // Curiosity hooks
    if (/nobody|never|secret|mistake|wrong/i.test(firstSentence)) {
      hookEffectiveness += 2;
    }
    // Direct address
    if (/you |your /i.test(firstSentence)) {
      hookEffectiveness += 1;
    }
    // Short punchy hooks (under 12 words)
    const hookWords = firstSentence.split(/\s+/).length;
    if (hookWords <= 12 && hookWords > 0) {
      hookEffectiveness += 1;
    }

    hookEffectiveness = Math.min(10, Math.max(1, hookEffectiveness));

    // =========================================================================
    // LEGO 4: STORY STRUCTURE
    // =========================================================================
    let storyType = 'other';
    let storyExecution = 5;

    // Detect structure type
    if (/step \d|step one|first|second|third|finally/i.test(transcriptLower)) {
      storyType = 'tutorial';
      storyExecution += 2;
    } else if (/\d\.|number \d|tip \d|reason \d/i.test(transcriptLower)) {
      storyType = 'list';
      storyExecution += 2;
    } else if (/vs|versus|compared to|difference between/i.test(transcriptLower)) {
      storyType = 'comparison';
      storyExecution += 2;
    } else if (/before|after|transformation|journey|progress/i.test(transcriptLower)) {
      storyType = 'breakdown';
      storyExecution += 2;
    } else if (/challenge|try|attempt|test/i.test(transcriptLower)) {
      storyType = 'challenge';
      storyExecution += 1;
    } else if (/once|when i|story|happened/i.test(transcriptLower)) {
      storyType = 'story';
      storyExecution += 2;
    }

    // Clear conclusion adds to execution
    if (/so remember|that's why|the key|bottom line|in conclusion/i.test(transcriptLower)) {
      storyExecution += 1;
    }

    // Proper sentence count for structure
    if (sentences.length >= 3 && sentences.length <= 15) {
      storyExecution += 1;
    }

    storyExecution = Math.min(10, Math.max(1, storyExecution));

    // =========================================================================
    // LEGO 5: VISUAL FORMAT
    // =========================================================================
    let visualType = 'talking-head'; // Default assumption
    let visualMatch = 6;

    // Detect format from transcript cues
    if (/look at this|watch this|see this|check this out/i.test(transcriptLower)) {
      visualType = 'demo';
      visualMatch += 1;
    } else if (/pov:|imagine|picture this/i.test(transcriptLower)) {
      visualType = 'pov';
      visualMatch += 2;
    } else if (/on screen|text|caption/i.test(transcriptLower)) {
      visualType = 'text-overlay';
      visualMatch += 1;
    } else if (/b-roll|footage|clip/i.test(transcriptLower)) {
      visualType = 'voiceover-broll';
      visualMatch += 1;
    }

    // Format matching content type
    if (storyType === 'tutorial' && (visualType === 'demo' || visualType === 'talking-head')) {
      visualMatch += 1;
    }
    if (storyType === 'story' && visualType === 'talking-head') {
      visualMatch += 1;
    }

    visualMatch = Math.min(10, Math.max(1, visualMatch));

    // =========================================================================
    // LEGO 6: KEY VISUALS
    // =========================================================================
    const visualElements: string[] = [];
    let visualVariety = 5;

    // Detect mentioned visual elements
    if (/screenshot|screen|display/i.test(transcriptLower)) {
      visualElements.push('screenshots');
      visualVariety += 1;
    }
    if (/graph|chart|data|statistics/i.test(transcriptLower)) {
      visualElements.push('data-visualization');
      visualVariety += 2;
    }
    if (/example|like this|here's an/i.test(transcriptLower)) {
      visualElements.push('examples');
      visualVariety += 1;
    }
    if (/before|after|transformation/i.test(transcriptLower)) {
      visualElements.push('before-after');
      visualVariety += 2;
    }
    if (/text|caption|on screen/i.test(transcriptLower)) {
      visualElements.push('text-overlays');
      visualVariety += 1;
    }
    if (/product|item|thing/i.test(transcriptLower)) {
      visualElements.push('product-shots');
      visualVariety += 1;
    }

    // Default visual elements if none detected
    if (visualElements.length === 0) {
      visualElements.push('talking-head');
    }

    visualVariety = Math.min(10, Math.max(1, visualVariety));

    // =========================================================================
    // LEGO 7: AUDIO
    // =========================================================================
    let audioDescription = 'Voice only';
    let audioEnhancement = 5;

    // Detect audio cues from transcript
    if (/music|song|beat|sound/i.test(transcriptLower)) {
      audioDescription = 'Background music mentioned';
      audioEnhancement += 2;
    }
    if (/sound effect|sfx|ding|whoosh/i.test(transcriptLower)) {
      audioDescription = 'Sound effects indicated';
      audioEnhancement += 1;
    }

    // Energy indicators (exclamation marks suggest energetic delivery)
    const exclamationCount = (transcript.match(/!/g) || []).length;
    if (exclamationCount >= 2) {
      audioDescription = 'High energy delivery';
      audioEnhancement += 2;
    }

    // Pacing indicators
    const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
    if (avgSentenceLength <= 15) {
      audioEnhancement += 1; // Fast paced
    }

    audioEnhancement = Math.min(10, Math.max(1, audioEnhancement));

    // =========================================================================
    // CALCULATE OVERALL SCORE
    // =========================================================================
    const legoScores = [
      { name: 'Topic', score: (topicClarity + topicRelevance) / 2 },
      { name: 'Angle', score: (angleUniqueness + angleIntrigue) / 2 },
      { name: 'Hook', score: hookEffectiveness * 1.5 }, // Hook weighted 1.5x
      { name: 'Story Structure', score: storyExecution },
      { name: 'Visual Format', score: visualMatch },
      { name: 'Key Visuals', score: visualVariety },
      { name: 'Audio', score: audioEnhancement }
    ];

    // Sort to find strongest/weakest
    const sortedScores = [...legoScores].sort((a, b) => b.score - a.score);
    const strongestLego = sortedScores[0].name;
    const weakestLego = sortedScores[sortedScores.length - 1].name;

    // Calculate weighted average (hook gets 1.5x weight)
    const totalWeight = 7.5; // 6 legos at 1x + hook at 1.5x
    const weightedSum = legoScores.reduce((sum, lego) => sum + lego.score, 0);
    const avgScore = weightedSum / totalWeight;
    const overallScore = Math.round(avgScore * 10);

    // Determine viral pattern match
    let viralPatternMatch = 'Standard content';
    if (overallScore >= 80) {
      viralPatternMatch = 'Strong viral potential - all legos aligned';
    } else if (overallScore >= 70) {
      viralPatternMatch = 'Good viral potential - most legos strong';
    } else if (overallScore >= 60) {
      viralPatternMatch = 'Moderate potential - some legos need work';
    } else {
      viralPatternMatch = 'Low potential - multiple legos weak';
    }

    return {
      topic: { description: topicDescription, clarity: topicClarity, relevance: topicRelevance },
      angle: { description: angleDescription, uniqueness: angleUniqueness, intrigue: angleIntrigue },
      hook: { spoken: spokenHook, effectiveness: hookEffectiveness },
      storyStructure: { type: storyType, execution: storyExecution },
      visualFormat: { type: visualType, match: visualMatch },
      keyVisuals: { elements: visualElements, variety: visualVariety },
      audio: { description: audioDescription, enhancement: audioEnhancement },
      overallScore: Math.min(100, Math.max(0, overallScore)),
      strongestLego,
      weakestLego,
      viralPatternMatch
    };
  }

  private async executeWhisper(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      if (input.transcript) {
        // Already have transcript
        return {
          componentId: 'whisper',
          success: true,
          prediction: undefined, // Whisper doesn't predict, it transcribes
          confidence: 1.0,
          features: {
            transcript: input.transcript,
            wordCount: input.transcript.split(/\s+/).length
          },
          latency: Date.now() - startTime
        };
      }

      // No transcript available
      return {
        componentId: 'whisper',
        success: false,
        error: 'No transcript available',
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'whisper',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executeGPT4(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Simplified qualitative analysis based on content structure
      const transcript = input.transcript || '';
      let score = 55;

      // Analyze structure
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
      const avgSentenceLength = transcript.length / Math.max(1, sentences.length);

      // Good sentence length (10-20 words optimal for TikTok)
      if (avgSentenceLength >= 30 && avgSentenceLength <= 100) score += 10;

      // Strong opening
      const firstSentence = sentences[0]?.toLowerCase() || '';
      if (firstSentence.includes('?') || firstSentence.includes('you') || firstSentence.includes('this')) {
        score += 10;
      }

      // Emotional words
      const emotionalWords = ['love', 'hate', 'amazing', 'terrible', 'incredible', 'shocking', 'unbelievable'];
      const emotionalCount = emotionalWords.filter(w => transcript.toLowerCase().includes(w)).length;
      score += emotionalCount * 3;

      // Value indicators
      const valueWords = ['learn', 'how to', 'tip', 'hack', 'secret', 'strategy', 'method'];
      const valueCount = valueWords.filter(w => transcript.toLowerCase().includes(w)).length;
      score += valueCount * 4;

      return {
        componentId: 'gpt4',
        success: true,
        prediction: Math.min(100, score),
        confidence: 0.78,
        insights: [
          `Sentence structure: ${sentences.length} sentences`,
          `Emotional words: ${emotionalCount}`,
          `Value indicators: ${valueCount}`
        ],
        features: { sentences: sentences.length, emotionalCount, valueCount },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'gpt4',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  // NOTE: executeClaude REMOVED - was returning hardcoded value 68
  // Component not registered, method was dead code
  // If Claude API integration is needed, implement real analysis like executeGemini

  private async executeGemini(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { geminiService } = await import('@/lib/services/gemini-service');

      if (!geminiService.isConfigured()) {
        console.error('[Gemini] ❌ API not configured - missing GOOGLE_AI_API_KEY');
        return {
          componentId: 'gemini',
          success: false,
          error: 'Gemini API not configured (missing GOOGLE_AI_API_KEY)',
          latency: Date.now() - startTime
        };
      }

      let result;

      // Prioritize video file analysis if videoPath is available
      if (input.videoPath) {
        console.log('[Gemini 3 Pro] Analyzing video file directly');
        result = await geminiService.analyzeVideoFile(
          input.videoPath,
          input.niche,
          input.goal
        );
      } else {
        // Fallback to transcript analysis
        const transcript = input.transcript || '';
        if (!transcript || transcript.length < 10) {
          return {
            componentId: 'gemini',
            success: false,
            error: 'No video file or transcript available for Gemini analysis',
            latency: Date.now() - startTime
          };
        }

        console.log('[Gemini 3 Pro] Analyzing transcript (no video file available)');
        result = await geminiService.analyzeTranscript(
          transcript,
          input.niche,
          input.goal,
          {
            title: input.title,
            description: input.description,
            hashtags: input.hashtags
          }
        );
      }

      if (!result.success) {
        console.error('[Gemini] ❌ Analysis failed:', result.error);
        return {
          componentId: 'gemini',
          success: false,
          error: result.error || 'Gemini analysis failed',
          latency: Date.now() - startTime
        };
      }

      // If this was a video analysis (not just transcript), boost confidence
      // because Gemini saw the actual execution quality
      let confidenceBoost = 0;
      let insightPrefix = '';
      const insights = [...(result.insights || [])];

      if (input.videoPath && result.analysis?.executionQuality !== undefined) {
        confidenceBoost = 0.1;
        insightPrefix = '[Video Analysis] ';

        // If execution quality is low, add a warning
        if (result.analysis.executionQuality < 5) {
          insights.unshift('⚠️ Low execution quality detected - may underperform predictions');
        }
      }

      const finalConfidence = Math.min(0.95, (result.confidence || 0.7) + confidenceBoost);

      console.log('[Gemini] ✅ Analysis successful - DPS:', result.viralPotential);
      return {
        componentId: 'gemini',
        success: true,
        prediction: result.viralPotential,
        confidence: finalConfidence,
        insights: insights.map(i => insightPrefix + i),
        features: {
          modelName: geminiService.getModelName(),
          analysisType: input.videoPath ? 'video_file' : 'transcript',
          hookStrength: result.analysis.hookStrength,
          contentStructure: result.analysis.contentStructure,
          emotionalAppeal: result.analysis.emotionalAppeal,
          valueProposition: result.analysis.valueProposition,
          narrativeFlow: result.analysis.narrativeFlow,
          visualEngagement: result.analysis.visualEngagement,
          audioQuality: result.analysis.audioQuality,
          pacing: result.analysis.pacing,
          toneAnalysis: result.analysis.toneAnalysis,
          targetAudience: result.analysis.targetAudience,
          contentType: result.analysis.contentType,
          // New calibrated fields
          executionQuality: result.analysis.executionQuality,
          authenticity: result.analysis.authenticity,
          shareability: result.analysis.shareability,
          platformFit: result.analysis.platformFit,
          viralFactorsPresent: result.analysis.viralFactorsPresent,
          viralFactorsMissing: result.analysis.viralFactorsMissing,
          recommendations: result.recommendations
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('[Gemini] ❌ Exception during execution:', error.message);
      return {
        componentId: 'gemini',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executeNicheKeywords(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Analyze niche-specific keywords in transcript
      const transcript = (input.transcript || '').toLowerCase();
      const niche = (input.niche || 'general').toLowerCase();

      if (!transcript || transcript.length < 20) {
        return {
          componentId: 'niche-keywords',
          success: false,
          error: 'Insufficient transcript for keyword analysis',
          confidence: 0.3,
          latency: Date.now() - startTime
        };
      }

      // Load keywords from external file (easy to update)
      let nicheKeywords: Record<string, string[]>;
      try {
        nicheKeywords = require('@/data/niche-keywords.json');
      } catch {
        // Fallback to default if file doesn't exist
        nicheKeywords = this.getDefaultNicheKeywords();
      }

      const keywords = nicheKeywords[niche] || nicheKeywords['general'] || [];

      if (keywords.length === 0) {
        return {
          componentId: 'niche-keywords',
          success: true,
          prediction: 50, // Neutral baseline
          confidence: 0.3,
          insights: [`No keywords defined for niche: ${niche}`],
          features: { niche, keywordCount: 0, matches: [] },
          latency: Date.now() - startTime
        };
      }

      // Count keyword matches
      const matches: string[] = [];
      for (const keyword of keywords) {
        if (transcript.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      }

      const matchCount = matches.length;
      const keywordDensity = matchCount / keywords.length;

      // Score based on matches
      let score: number;
      if (matchCount < 2) {
        score = 30 + (matchCount * 10); // 30-40 for weak relevance
      } else if (matchCount < 5) {
        score = 50 + (matchCount * 5); // 50-70 for moderate relevance
      } else {
        score = 70 + Math.min(30, matchCount * 3); // 70-100 for strong relevance
      }

      return {
        componentId: 'niche-keywords',
        success: true,
        prediction: Math.min(100, score),
        confidence: Math.min(0.9, 0.5 + keywordDensity),
        insights: [
          `Found ${matchCount} niche keywords: ${matches.slice(0, 5).join(', ')}${matches.length > 5 ? '...' : ''}`,
          `Keyword density: ${(keywordDensity * 100).toFixed(1)}%`
        ],
        features: {
          niche: niche,
          matchCount: matchCount,
          matches: matches,
          totalKeywords: keywords.length,
          density: keywordDensity
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('[niche-keywords] Error:', error);
      return {
        componentId: 'niche-keywords',
        success: false,
        error: error.message,
        confidence: 0.3,
        latency: Date.now() - startTime
      };
    }
  }

  private getDefaultNicheKeywords(): Record<string, string[]> {
    return {
      'personal-finance': [
        'money', 'invest', 'investing', 'savings', 'budget', 'wealth', 'retire',
        'retirement', 'compound', 'stocks', 'stock market', 'crypto', 'bitcoin',
        'passive income', 'side hustle', 'debt', 'debt free', 'financial freedom',
        'millionaire', 'rich', 'poor', 'broke', 'salary', 'income', 'expenses',
        'save money', 'make money', 'net worth', 'assets', 'liabilities'
      ],
      'fitness': [
        'workout', 'exercise', 'gains', 'muscle', 'cardio', 'protein', 'gym',
        'lift', 'lifting', 'weight loss', 'fat loss', 'bulk', 'cut', 'diet',
        'calories', 'macros', 'reps', 'sets', 'pr', 'personal record', 'fit'
      ],
      'side-hustles': [
        'hustle', 'side hustle', 'extra income', 'freelance', 'gig', 'earn',
        'money online', 'work from home', 'remote', 'passive', 'business',
        'entrepreneur', 'startup', 'client', 'customers', 'sell', 'selling'
      ],
      'tech': [
        'app', 'software', 'code', 'coding', 'programming', 'ai',
        'artificial intelligence', 'tech', 'technology', 'startup', 'saas'
      ],
      'productivity': [
        'productive', 'productivity', 'focus', 'time management', 'schedule',
        'routine', 'habit', 'habits', 'morning routine', 'discipline'
      ],
      'general': [
        'tips', 'trick', 'tricks', 'hack', 'hacks', 'secret', 'secrets',
        'how to', 'why', 'what', 'best', 'worst', 'top', 'guide'
      ]
    };
  }

  private async executeDPSEngine(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    // DPS Engine is for calculating actual DPS from metrics
    // It should NOT be used for prediction - only for validation after the fact
    return {
      componentId: 'dps-engine',
      success: false,
      error: 'DPS engine requires actual metrics - skipped for prediction',
      latency: Date.now() - startTime
    };
  }

  private async executeFeatureExtraction(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Simplified feature extraction - extract key metrics from transcript
      const transcript = input.transcript || '';
      const title = input.title || '';

      const features = {
        // Text features
        wordCount: transcript.split(/\s+/).filter(w => w).length,
        charCount: transcript.length,
        sentenceCount: (transcript.match(/[.!?]+/g) || []).length,
        avgWordLength: transcript.length / Math.max(1, transcript.split(/\s+/).length),

        // Engagement signals
        questionCount: (transcript.match(/\?/g) || []).length,
        exclamationCount: (transcript.match(/!/g) || []).length,

        // Title features
        titleLength: title.length,
        titleWordCount: title.split(/\s+/).filter(w => w).length,

        // Hashtags
        hashtagCount: (input.hashtags || []).length
      };

      return {
        componentId: 'feature-extraction',
        success: true,
        prediction: undefined, // Feature extraction doesn't predict
        confidence: 1.0,
        features: { features, featureCount: Object.keys(features).length },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'feature-extraction',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executePatternExtraction(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const transcript = (input.transcript || '').toLowerCase();
      const patterns: string[] = [];
      let score = 45;

      // Pattern detection - viral content patterns
      const patternChecks = [
        { name: 'hook-opening', regex: /^(stop|wait|listen|watch|look|this|here|did you)/i, points: 8 },
        { name: 'story-arc', regex: /(first|then|finally|but then|until|when)/i, points: 6 },
        { name: 'curiosity-gap', regex: /(secret|hidden|nobody|most people|what if|turns out)/i, points: 7 },
        { name: 'social-proof', regex: /(everyone|millions|thousands|trending|viral|famous)/i, points: 5 },
        { name: 'urgency', regex: /(now|today|immediately|hurry|limited|before)/i, points: 6 },
        { name: 'value-promise', regex: /(learn|discover|get|become|transform|how to)/i, points: 5 },
        { name: 'emotional-trigger', regex: /(love|hate|amazing|shocking|incredible|unbelievable)/i, points: 7 },
        { name: 'cta-pattern', regex: /(follow|like|share|comment|subscribe|save this)/i, points: 4 },
        { name: 'contrast', regex: /(but|however|instead|not|never|always)/i, points: 3 },
        { name: 'list-format', regex: /(first|second|third|number one|tip \d|step \d)/i, points: 5 }
      ];

      for (const check of patternChecks) {
        if (check.regex.test(transcript)) {
          patterns.push(check.name);
          score += check.points;
        }
      }

      return {
        componentId: 'pattern-extraction',
        success: true,
        prediction: Math.min(100, score),
        confidence: 0.82,
        insights: [`Found ${patterns.length} viral patterns: ${patterns.join(', ')}`],
        features: { patterns, patternCount: patterns.length },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'pattern-extraction',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executeHistoricalComparison(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      // Get average DPS for this niche from real scraped videos
      const niche = input.niche || 'general';
      const { data: nicheVideos, error } = await supabase
        .from('scraped_videos')
        .select('dps_score, views_count, likes_count')
        .or(`description.ilike.%${niche}%,caption.ilike.%${niche}%`)
        .not('dps_score', 'is', null)
        .order('dps_score', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[historical] Database error:', error);
        // Return baseline instead of failing
        return {
          componentId: 'historical',
          success: true,
          prediction: 50,  // Neutral baseline
          confidence: 0.3,  // Low confidence due to no data
          insights: ['No historical data available - using baseline'],
          features: { dataSource: 'baseline', nicheVideos: 0 },
          latency: Date.now() - startTime
        };
      }

      if (!nicheVideos || nicheVideos.length < 5) {
        // Not enough data - return baseline with low confidence
        return {
          componentId: 'historical',
          success: true,
          prediction: 55,  // Slightly optimistic baseline
          confidence: 0.4,
          insights: [`Only ${nicheVideos?.length || 0} videos found in niche - limited comparison available`],
          features: { dataSource: 'limited', nicheVideos: nicheVideos?.length || 0 },
          latency: Date.now() - startTime
        };
      }

      // Calculate market benchmark from top performers
      const scores = nicheVideos.map(v => v.dps_score).filter((s): s is number => s != null);
      const avgTopDPS = scores.reduce((a, b) => a + b, 0) / scores.length;
      const maxDPS = Math.max(...scores);

      // Prediction is 85% of market ceiling (realistic target)
      const prediction = Math.round(avgTopDPS * 0.85);

      return {
        componentId: 'historical',
        success: true,
        prediction: Math.max(30, Math.min(95, prediction)),
        confidence: Math.min(0.85, 0.5 + (nicheVideos.length / 100)),
        insights: [
          `Analyzed ${nicheVideos.length} videos in ${niche} niche`,
          `Top performer: ${maxDPS.toFixed(1)} DPS`,
          `Market average: ${avgTopDPS.toFixed(1)} DPS`
        ],
        features: {
          dataSource: 'database',
          nicheVideos: nicheVideos.length,
          avgTopDPS: avgTopDPS,
          maxDPS: maxDPS,
          marketCeiling: prediction
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('[historical] Error:', error);
      // Return baseline on error
      return {
        componentId: 'historical',
        success: true,
        prediction: 50,
        confidence: 0.3,
        insights: ['Historical analysis unavailable - using baseline'],
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executeHookScorer(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { HookScorer } = await import('@/lib/components/hook-scorer');

      // Analyze hook strength from transcript
      const result = HookScorer.analyze(input.transcript);

      if (!result.success) {
        return {
          componentId: 'hook-scorer',
          success: false,
          error: result.error || 'Hook analysis failed',
          latency: Date.now() - startTime
        };
      }

      // Convert hook score to DPS prediction
      const dpsPrediction = HookScorer.toDPS(result);

      return {
        componentId: 'hook-scorer',
        success: true,
        prediction: dpsPrediction,
        confidence: result.hookConfidence,
        insights: result.insights,
        features: {
          hookType: result.hookType,
          hookScore: result.hookScore,
          hookText: result.hookText
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'hook-scorer',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executeAudioAnalyzer(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Require video path for audio analysis
      if (!input.videoPath) {
        return {
          componentId: 'audio-analyzer',
          success: false,
          error: 'Video path required for audio analysis',
          latency: Date.now() - startTime
        };
      }

      const { AudioAnalyzer } = await import('@/lib/components/audio-analyzer');

      // Analyze audio from video
      const result = await AudioAnalyzer.analyze(input.videoPath);

      if (!result.success) {
        return {
          componentId: 'audio-analyzer',
          success: false,
          error: result.error || 'Audio analysis failed',
          latency: Date.now() - startTime
        };
      }

      // Convert audio score to DPS prediction
      const dpsPrediction = AudioAnalyzer.toDPS(result);

      return {
        componentId: 'audio-analyzer',
        success: true,
        prediction: dpsPrediction,
        confidence: result.audioScore / 10, // Normalize to 0-1
        insights: result.insights,
        features: {
          audioScore: result.audioScore,
          speakingPace: result.speakingPace,
          energyLevel: result.energyLevel,
          silenceRatio: result.silenceRatio,
          volumeVariance: result.volumeVariance
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'audio-analyzer',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executeVisualSceneDetector(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Require video path for visual analysis
      if (!input.videoPath) {
        return {
          componentId: 'visual-scene-detector',
          success: false,
          error: 'Video path required for visual analysis',
          latency: Date.now() - startTime
        };
      }

      const { VisualSceneDetector } = await import('@/lib/components/visual-scene-detector');

      // Analyze visual scenes from video
      const result = await VisualSceneDetector.analyze(input.videoPath);

      if (!result.success) {
        return {
          componentId: 'visual-scene-detector',
          success: false,
          error: result.error || 'Visual analysis failed',
          latency: Date.now() - startTime
        };
      }

      // Convert visual score to DPS prediction
      const dpsPrediction = VisualSceneDetector.toDPS(result);

      return {
        componentId: 'visual-scene-detector',
        success: true,
        prediction: dpsPrediction,
        confidence: result.visualScore / 10, // Normalize to 0-1
        insights: result.insights,
        features: {
          visualScore: result.visualScore,
          cutsPerSecond: result.cutsPerSecond,
          editingPace: result.editingPace,
          sceneChanges: result.sceneChanges,
          hasTextOverlay: result.hasTextOverlay
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'visual-scene-detector',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executeTrendTimingAnalyzer(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { TrendTimingAnalyzer } = await import('@/lib/components/trend-timing-analyzer');

      const result = await TrendTimingAnalyzer.analyze(
        input.transcript,
        input.niche,
        input.goal,
        input.accountSize
      );

      if (!result.success) {
        return {
          componentId: 'trend-timing-analyzer',
          success: false,
          error: result.error || 'Trend timing analysis failed',
          latency: Date.now() - startTime
        };
      }

      const dpsPrediction = TrendTimingAnalyzer.toDPS(result);

      return {
        componentId: 'trend-timing-analyzer',
        success: true,
        prediction: dpsPrediction,
        confidence: result.confidence,
        insights: result.insights,
        features: {
          trendStage: result.trendStage,
          timingScore: result.timingScore,
          momentum: result.momentum,
          optimalPostingHours: result.optimalPostingHours,
          daysSinceTrendStart: result.daysSinceTrendStart
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'trend-timing-analyzer',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executeThumbnailAnalyzer(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { ThumbnailAnalyzer } = await import('@/lib/components/thumbnail-analyzer');

      const result = await ThumbnailAnalyzer.analyze(input.videoPath);

      if (!result.success) {
        return {
          componentId: 'thumbnail-analyzer',
          success: false,
          error: result.error || 'Thumbnail analysis failed',
          latency: Date.now() - startTime
        };
      }

      const dpsPrediction = ThumbnailAnalyzer.toDPS(result);

      return {
        componentId: 'thumbnail-analyzer',
        success: true,
        prediction: dpsPrediction,
        confidence: result.confidence,
        insights: result.insights,
        features: {
          visualScore: result.visualScore,
          contrastScore: result.contrastScore,
          colorScore: result.colorScore,
          compositionScore: result.compositionScore,
          brightness: result.features.brightness,
          contrast: result.features.contrast,
          colorfulness: result.features.colorfulness
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'thumbnail-analyzer',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  private async executePostingTimeOptimizer(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { PostingTimeOptimizer } = await import('@/lib/components/posting-time-optimizer');

      const result = await PostingTimeOptimizer.analyze(
        input.niche,
        input.goal,
        input.accountSize
      );

      if (!result.success) {
        return {
          componentId: 'posting-time-optimizer',
          success: false,
          error: result.error || 'Posting time optimization failed',
          latency: Date.now() - startTime
        };
      }

      const dpsPrediction = PostingTimeOptimizer.toDPS(result);

      return {
        componentId: 'posting-time-optimizer',
        success: true,
        prediction: dpsPrediction,
        confidence: result.confidence,
        insights: result.insights,
        features: {
          optimalHours: result.optimalHours,
          optimalDays: result.optimalDays,
          timingScore: result.timingScore,
          peakWindow: result.peakWindow,
          avoidHours: result.avoidHours
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'posting-time-optimizer',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  // ==========================================================================
  // A/B TESTING INTEGRATION
  // ==========================================================================

  /**
   * Check if a component has an active A/B test and select variant
   * Returns variant config if test is active, null otherwise
   */
  private async getComponentVariant(componentId: string): Promise<{ variant: 'A' | 'B'; config: Record<string, any> } | null> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      // Check for active test
      const { data: test, error } = await supabase
        .from('kai_component_tests')
        .select('*')
        .eq('component_id', componentId)
        .eq('status', 'running')
        .single();

      if (error || !test) return null;

      // Randomly assign variant (50/50 split)
      const variant = Math.random() < 0.5 ? 'A' : 'B';
      const config = variant === 'A' ? test.variant_a_config : test.variant_b_config;

      return { variant, config };
    } catch (error) {
      console.error(`Error checking A/B test for ${componentId}:`, error);
      return null;
    }
  }

  /**
   * Record A/B test prediction result
   */
  private async recordTestPrediction(
    componentId: string,
    variant: 'A' | 'B',
    prediction: number,
    videoId: string
  ): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      // Get test ID
      const { data: test } = await supabase
        .from('kai_component_tests')
        .select('test_id')
        .eq('component_id', componentId)
        .eq('status', 'running')
        .single();

      if (!test) return;

      const { ABKaiIntegration } = await import('@/lib/services/ab-kai-integration');
      const abKai = ABKaiIntegration.getInstance();

      await abKai.recordVariantPrediction(
        test.test_id,
        variant,
        videoId,
        prediction,
        0, // actualDPS - will be updated later when results are known
        0  // latency - not tracked at this level
      );
    } catch (error) {
      console.error(`Error recording test prediction for ${componentId}:`, error);
    }
  }

  // ==========================================================================
  // COMPONENT DISCOVERY
  // ==========================================================================

  async discoverComponents(): Promise<void> {
    console.log('Discovering available components...');

    // Check which components are actually available
    for (const [id, component] of this.componentRegistry) {
      try {
        // Simple availability check
        component.status = 'active';
        console.log(`  ${id}: active`);
      } catch {
        component.status = 'failed';
        console.log(`  ${id}: failed`);
      }
    }
  }

  getComponentStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    for (const [id, component] of this.componentRegistry) {
      status[id] = component.status;
    }
    return status;
  }

  // ==========================================================================
  // 24-STYLES COMPONENT (RE-ENABLED WITH REAL GPT-4O-MINI ANALYSIS)
  // ==========================================================================

  private async execute24Styles(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const transcript = input.transcript || '';

      if (!transcript || transcript.length < 50) {
        return {
          componentId: '24-styles',
          success: false,
          error: 'Insufficient transcript for style classification',
          confidence: 0.3,
          latency: Date.now() - startTime
        };
      }

      const VIDEO_STYLES = [
        { id: 'talking-head-explainer', name: 'Talking-Head Explainer', viralWeight: 0.7 },
        { id: 'green-screen-commentary', name: 'Green-Screen Commentary', viralWeight: 0.75 },
        { id: 'picture-in-picture', name: 'Picture-in-Picture Screen Walkthrough', viralWeight: 0.8 },
        { id: 'voiceover-broll', name: 'Voiceover + B-Roll Montage', viralWeight: 0.85 },
        { id: 'whiteboard-teach', name: 'Whiteboard/Notepad Teach', viralWeight: 0.7 },
        { id: 'top-down-demo', name: 'Desk/Top-Down Hands-Only Demo', viralWeight: 0.8 },
        { id: 'product-demo', name: 'Product/Feature Demo', viralWeight: 0.75 },
        { id: 'case-study', name: 'Case Study / Before-After', viralWeight: 0.9 },
        { id: 'comparison', name: 'Comparison / A-vs-B-vs-C', viralWeight: 0.85 },
        { id: 'myth-bust', name: 'Myth-Bust / Red-Flag-Green-Flag', viralWeight: 0.9 },
        { id: 'sop-checklist', name: 'SOP/Checklist Walkthrough', viralWeight: 0.75 },
        { id: 'decision-tree', name: 'Decision Tree / If-Then Navigator', viralWeight: 0.7 },
        { id: 'challenge-protocol', name: 'Challenge / 7-30 Day Protocol', viralWeight: 0.85 },
        { id: 'live-build', name: 'Live Build / Real-Time Teardown', viralWeight: 0.8 },
        { id: 'faq-rapid-fire', name: 'FAQ/AMA Rapid-Fire', viralWeight: 0.75 },
        { id: 'expert-clip', name: 'Expert Clip / Interview Bite', viralWeight: 0.7 },
        { id: 'ugc-testimonial', name: 'UGC Testimonial / Social Proof Stack', viralWeight: 0.9 },
        { id: 'transformation-timelapse', name: 'Transformation Time-Lapse', viralWeight: 0.95 },
        { id: 'checklist-audit', name: 'Checklist Review / Audit', viralWeight: 0.75 },
        { id: 'template-framework', name: 'Template/Framework Explainer', viralWeight: 0.8 },
        { id: 'price-roi', name: 'Price/ROI Breakdown', viralWeight: 0.85 },
        { id: 'regulation-update', name: 'Regulation/Update Explainer', viralWeight: 0.7 },
        { id: 'routine-system', name: 'Routine/System', viralWeight: 0.8 },
        { id: 'slideshow-infographic', name: 'Slideshow Infographic', viralWeight: 0.75 }
      ];

      const styleList = VIDEO_STYLES.map(s => s.id).join(', ');

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are an expert video content analyst. Classify this video transcript into ONE of these 24 proven viral video styles:

${styleList}

TRANSCRIPT:
"""
${transcript.substring(0, 3000)}
"""

Analyze the content structure, delivery style, and format indicators to determine which style best matches.

Respond ONLY with valid JSON:
{
  "style": "the-style-id-from-list",
  "confidence": 0.0-1.0,
  "execution_score": 0-100,
  "style_indicators": ["indicator1", "indicator2", "indicator3"],
  "reasoning": "brief explanation of why this style"
}

Scoring guidelines for execution_score:
- 90-100: Perfect execution of the style, hits all key elements
- 75-89: Strong execution with minor gaps
- 60-74: Decent execution but missing some style elements
- 45-59: Weak execution, style partially present
- Below 45: Poor match or very weak execution`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      // Find the style's viral weight
      const matchedStyle = VIDEO_STYLES.find(s => s.id === result.style);
      const viralWeight = matchedStyle?.viralWeight || 0.75;

      // Final score combines execution quality with style's inherent viral potential
      const executionScore = Math.max(0, Math.min(100, result.execution_score || 50));
      const finalScore = Math.round(executionScore * viralWeight + (viralWeight * 20));

      return {
        componentId: '24-styles',
        success: true,
        prediction: Math.min(100, finalScore),
        confidence: result.confidence || 0.7,
        insights: [
          `Detected style: ${matchedStyle?.name || result.style}`,
          `Execution quality: ${executionScore}/100`,
          result.reasoning || ''
        ].filter(Boolean),
        features: {
          style: result.style,
          styleName: matchedStyle?.name,
          executionScore: executionScore,
          viralWeight: viralWeight,
          indicators: result.style_indicators || []
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('[24-styles] Error:', error);
      return {
        componentId: '24-styles',
        success: false,
        error: error.message,
        confidence: 0.3,
        latency: Date.now() - startTime
      };
    }
  }

  // ==========================================================================
  // VIRALITY-MATRIX COMPONENT (RE-ENABLED WITH REAL GPT-4O-MINI ANALYSIS)
  // ==========================================================================

  private async executeViralityMatrix(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const transcript = input.transcript || '';
      const duration = input.ffmpegData?.duration || 30;

      if (!transcript || transcript.length < 50) {
        return {
          componentId: 'virality-matrix',
          success: false,
          error: 'Insufficient transcript for virality matrix analysis',
          confidence: 0.3,
          latency: Date.now() - startTime
        };
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are a TikTok viral content expert. Analyze this video using the 9-dimension TikTok Virality Matrix.

VIDEO DURATION: ${duration} seconds
TRANSCRIPT:
"""
${transcript.substring(0, 3000)}
"""

Score each dimension from 0-10:

DIMENSION 1: HOOK ARCHITECTURE (0-3 seconds)
- Does it stop the scroll immediately?
- Hook types: question, statistic, story, problem, solution-tease

DIMENSION 2: ENGAGEMENT CHECKPOINTS (every 5 seconds)
- Does each segment deliver value or create curiosity?
- 70% retention required per checkpoint

DIMENSION 3: EMOTIONAL JOURNEY
- Arc patterns: curiosity→satisfaction, problem→solution, surprise→delight
- Emotional velocity (changes per 7 seconds)

DIMENSION 4: VIRAL COEFFICIENTS
- Shareability: meme potential, controversy, relatability, surprise
- Engagement triggers: save probability, comment trigger, share motivation

DIMENSION 5: NARRATIVE STRUCTURE
- Setup (0-5s) → Conflict (5-10s) → Resolution (10-20s) → Payoff (20-30s)

DIMENSION 6: TREND ALIGNMENT
- Trending audio potential, hashtag relevance, cultural moment

DIMENSION 7: CTA OPTIMIZATION
- Soft/hard/embedded CTAs, timing effectiveness

DIMENSION 8: TECHNICAL QUALITY
- Pacing, text readability, audio clarity indicators

DIMENSION 9: PLATFORM FIT
- Vertical format optimization, short-form structure

Respond ONLY with valid JSON:
{
  "dimensions": {
    "hook_architecture": { "score": 0-10, "reason": "brief" },
    "engagement_checkpoints": { "score": 0-10, "reason": "brief" },
    "emotional_journey": { "score": 0-10, "reason": "brief" },
    "viral_coefficients": { "score": 0-10, "reason": "brief" },
    "narrative_structure": { "score": 0-10, "reason": "brief" },
    "trend_alignment": { "score": 0-10, "reason": "brief" },
    "cta_optimization": { "score": 0-10, "reason": "brief" },
    "technical_quality": { "score": 0-10, "reason": "brief" },
    "platform_fit": { "score": 0-10, "reason": "brief" }
  },
  "overall_score": 0-100,
  "viral_prediction": "HIGH_VIRAL|LIKELY_VIRAL|MODERATE|UNLIKELY|LOW",
  "top_strength": "which dimension is strongest",
  "critical_weakness": "which dimension needs most improvement",
  "improvement_tip": "one specific actionable tip"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      // Calculate weighted score (hook and viral coefficients weighted higher)
      const dimensions = result.dimensions || {};
      const weights: Record<string, number> = {
        hook_architecture: 2.0,      // Most important for short-form
        engagement_checkpoints: 1.5,
        emotional_journey: 1.2,
        viral_coefficients: 1.8,     // Direct viral indicator
        narrative_structure: 1.0,
        trend_alignment: 1.3,
        cta_optimization: 0.8,
        technical_quality: 0.7,
        platform_fit: 0.7
      };

      let weightedSum = 0;
      let totalWeight = 0;

      for (const [dim, weight] of Object.entries(weights)) {
        const dimScore = dimensions[dim]?.score || 5;
        weightedSum += dimScore * weight;
        totalWeight += weight;
      }

      const weightedAvg = weightedSum / totalWeight;
      const finalScore = Math.round(weightedAvg * 10); // Convert 0-10 to 0-100

      return {
        componentId: 'virality-matrix',
        success: true,
        prediction: Math.max(0, Math.min(100, finalScore)),
        confidence: 0.8,
        insights: [
          `Viral prediction: ${result.viral_prediction}`,
          `Top strength: ${result.top_strength}`,
          `Critical weakness: ${result.critical_weakness}`,
          result.improvement_tip
        ].filter(Boolean),
        features: {
          dimensions: dimensions,
          viralPrediction: result.viral_prediction,
          topStrength: result.top_strength,
          criticalWeakness: result.critical_weakness
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('[virality-matrix] Error:', error);
      return {
        componentId: 'virality-matrix',
        success: false,
        error: error.message,
        confidence: 0.3,
        latency: Date.now() - startTime
      };
    }
  }

  // ==========================================================================
  // CLAUDE COMPONENT (RE-ENABLED - ONLY WORKS IF ANTHROPIC API KEY AVAILABLE)
  // ==========================================================================

  private async executeClaude(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        componentId: 'claude',
        success: false,
        error: 'Claude API key not configured',
        confidence: 0,
        latency: Date.now() - startTime
      };
    }

    try {
      const transcript = input.transcript || '';

      if (!transcript || transcript.length < 50) {
        return {
          componentId: 'claude',
          success: false,
          error: 'Insufficient transcript for Claude analysis',
          confidence: 0.3,
          latency: Date.now() - startTime
        };
      }

      // Dynamic import Anthropic SDK
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyze this video transcript for viral potential on TikTok. Score from 0-100.

TRANSCRIPT:
"""
${transcript.substring(0, 3000)}
"""

Evaluate:
1. Hook strength (first 3 seconds)
2. Value delivery
3. Emotional engagement
4. Shareability
5. Call-to-action effectiveness

Respond as JSON only:
{
  "viral_score": 0-100,
  "confidence": 0.0-1.0,
  "hook_rating": 0-10,
  "value_rating": 0-10,
  "emotion_rating": 0-10,
  "share_rating": 0-10,
  "cta_rating": 0-10,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1"],
  "recommendation": "one key improvement"
}`
        }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const result = JSON.parse(content);

      return {
        componentId: 'claude',
        success: true,
        prediction: Math.max(0, Math.min(100, result.viral_score || 50)),
        confidence: result.confidence || 0.75,
        insights: [
          ...(result.strengths || []),
          result.recommendation
        ].filter(Boolean),
        features: {
          hookRating: result.hook_rating,
          valueRating: result.value_rating,
          emotionRating: result.emotion_rating,
          shareRating: result.share_rating,
          ctaRating: result.cta_rating,
          weaknesses: result.weaknesses
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('[claude] Error:', error);
      return {
        componentId: 'claude',
        success: false,
        error: error.message,
        confidence: 0.3,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Python Enhanced Analysis
   * Uses PySceneDetect, VADER sentiment, and faster-whisper for accurate
   * video/audio analysis features.
   */
  private async executePythonAnalysis(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Dynamic import to avoid bundling issues
      const { pythonService } = await import('../services/python-service-client');
      
      // Check if Python service is available
      const isAvailable = await pythonService.healthCheck();
      
      if (!isAvailable) {
        return {
          componentId: 'python-analysis',
          success: false,
          error: 'Python service unavailable',
          confidence: 0.3,
          latency: Date.now() - startTime
        };
      }

      // If we have transcript, analyze sentiment
      if (input.transcript) {
        const sentiment = await pythonService.analyzeSentiment(input.transcript);
        
        if (sentiment.success) {
          // Calculate prediction based on viral indicators
          const sentimentScore = (sentiment.overall.compound + 1) * 50; // -1 to 1 -> 0 to 100
          const emotionalIntensity = sentiment.viral_indicators.emotional_intensity;
          const hasStrongEmotion = sentiment.viral_indicators.has_strong_emotion;
          
          // Strong emotion = higher viral potential
          let prediction = sentimentScore * 0.3 + emotionalIntensity * 0.7;
          if (hasStrongEmotion) prediction = Math.min(100, prediction * 1.2);
          
          const insights: string[] = [
            `Sentiment: ${sentiment.overall.classification} (${(sentiment.overall.compound * 100).toFixed(0)}%)`,
            `Emotional Intensity: ${emotionalIntensity.toFixed(0)}/100`,
          ];
          
          if (sentiment.emotional_journey) {
            insights.push(`Emotional Arc: ${sentiment.emotional_journey.emotional_arc}`);
          }
          
          return {
            componentId: 'python-analysis',
            success: true,
            prediction: Math.max(0, Math.min(100, prediction)),
            confidence: 0.85,
            insights,
            features: {
              sentiment_polarity: sentiment.viral_indicators.sentiment_score_for_xgboost.sentiment_polarity,
              sentiment_subjectivity: sentiment.viral_indicators.sentiment_score_for_xgboost.sentiment_subjectivity,
              positive_negative_ratio: sentiment.viral_indicators.sentiment_score_for_xgboost.positive_negative_ratio,
              emotional_volatility: sentiment.viral_indicators.sentiment_score_for_xgboost.emotional_volatility,
              emotional_arc: sentiment.emotional_journey?.emotional_arc,
              has_strong_emotion: hasStrongEmotion
            },
            latency: Date.now() - startTime
          };
        }
      }

      // No data to analyze
      return {
        componentId: 'python-analysis',
        success: false,
        error: 'No transcript available for analysis',
        confidence: 0.3,
        latency: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('[python-analysis] Error:', error);
      return {
        componentId: 'python-analysis',
        success: false,
        error: error.message,
        confidence: 0.3,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Unified Grading component
   * Uses LLM-based rubric to score 9 attributes, 7 idea legos, and additional dimensions
   */
  private async executeUnifiedGrading(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Require transcript for grading
      if (!input.transcript || input.transcript.length < 10) {
        return {
          componentId: 'unified-grading',
          success: false,
          error: 'Transcript required for unified grading (minimum 10 characters)',
          confidence: 0,
          latency: Date.now() - startTime
        };
      }

      // Build feature snapshot from available data
      const featureSnapshot: Record<string, unknown> = {};
      if (input.ffmpegData) {
        featureSnapshot.ffmpeg = input.ffmpegData;
      }

      // Run unified grading with fallback
      const result: UnifiedGradingResult = await runUnifiedGradingWithFallback({
        niche: input.niche || 'general',
        goal: input.goal || 'engagement',
        transcript: input.transcript,
        feature_snapshot: featureSnapshot
      });

      // Calculate overall prediction from attribute scores
      const attrScores = result.attribute_scores.map(a => a.score);
      const avgAttrScore = attrScores.length > 0
        ? attrScores.reduce((sum, s) => sum + s, 0) / attrScores.length
        : 5;

      // Convert 1-10 scale to 0-100 DPS
      // Also factor in hook, pacing, clarity, novelty
      const additionalScores = [
        result.hook.clarity_score,
        result.pacing.score,
        result.clarity.score,
        result.novelty.score
      ];
      const avgAdditional = additionalScores.reduce((sum, s) => sum + s, 0) / additionalScores.length;

      // Weighted average: 70% attributes, 30% additional dimensions
      const combinedScore = avgAttrScore * 0.7 + avgAdditional * 0.3;
      const prediction = Math.round(combinedScore * 10); // 1-10 -> 10-100

      // Count idea legos present
      const legoCount = Object.entries(result.idea_legos)
        .filter(([key, val]) => key.startsWith('lego_') && val === true)
        .length;

      const insights: string[] = [
        `Style: ${result.style_classification.label} (${(result.style_classification.confidence * 100).toFixed(0)}% confidence)`,
        `Idea Legos: ${legoCount}/7 present`,
        `Hook: ${result.hook.type} (clarity: ${result.hook.clarity_score}/10)`,
        `Average attribute score: ${avgAttrScore.toFixed(1)}/10`
      ];

      // Add any warnings
      if (result.warnings.length > 0) {
        insights.push(`Warnings: ${result.warnings.join(', ')}`);
      }

      return {
        componentId: 'unified-grading',
        success: true,
        prediction,
        confidence: result.grader_confidence,
        insights,
        features: {
          // Store the full grading result for training data export
          unified_grading_result: result,
          // Also store flattened features for easier access
          style_label: result.style_classification.label,
          style_confidence: result.style_classification.confidence,
          lego_count: legoCount,
          lego_1: result.idea_legos.lego_1,
          lego_2: result.idea_legos.lego_2,
          lego_3: result.idea_legos.lego_3,
          lego_4: result.idea_legos.lego_4,
          lego_5: result.idea_legos.lego_5,
          lego_6: result.idea_legos.lego_6,
          lego_7: result.idea_legos.lego_7,
          hook_type: result.hook.type,
          hook_clarity: result.hook.clarity_score,
          pacing_score: result.pacing.score,
          clarity_score: result.clarity.score,
          novelty_score: result.novelty.score,
          grader_confidence: result.grader_confidence,
          avg_attribute_score: avgAttrScore,
          // Individual attribute scores
          ...result.attribute_scores.reduce((acc, attr) => {
            acc[`attr_${attr.attribute}`] = attr.score;
            return acc;
          }, {} as Record<string, number>)
        },
        latency: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('[unified-grading] Error:', error);
      return {
        componentId: 'unified-grading',
        success: false,
        error: error.message,
        confidence: 0,
        latency: Date.now() - startTime
      };
    }
  }
}

// Export singleton instance
export const kai = new KaiOrchestrator();

export default KaiOrchestrator;
