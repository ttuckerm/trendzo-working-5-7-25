/**
 * Kai Orchestrator - The Brain of the Viral Prediction System
 *
 * Orchestrates 22 registered components (21 active) across 4 prediction paths.
 * See src/lib/prediction/system-registry.ts for the canonical component/path definitions.
 *
 * API KEY DEPENDENCIES:
 * | Component        | Env Variable                                    | Fallback?         |
 * |------------------|-------------------------------------------------|-------------------|
 * | gpt4             | OPENAI_API_KEY                                  | Yes (heuristic)   |
 * | gemini           | GOOGLE_GEMINI_AI_API_KEY / GOOGLE_AI_API_KEY    | No (disabled)     |
 * | claude           | ANTHROPIC_API_KEY                               | No (disabled)     |
 * | virality-matrix  | (none — 100% regex)                             | DISABLED          |
 * | unified-grading  | GOOGLE_GEMINI_AI_API_KEY / GOOGLE_AI_API_KEY    | Yes (unavailable) |
 * | editing-coach    | GOOGLE_GEMINI_AI_API_KEY / GOOGLE_AI_API_KEY    | Yes (template)    |
 * | xgboost-virality-ml | (Python subprocess, no API key)              | N/A               |
 * All other components run locally without API keys.
 */

import OpenAI from 'openai';
import {
  getPredictionConfig,
  checkComponentInputs,
  createSkippedResult,
  hasValidTranscript
} from '@/lib/prediction/prediction-config';
import { getVpsTier, VIDEO_STYLES_REGISTRY } from '@/lib/prediction/system-registry';
import { COACH_LANE_COMPONENT_IDS } from '@/lib/prediction/normalize-component-result';
import type { CreatorContext } from '@/lib/prediction/creator-context';

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
  // Pre-computed LLM scores (for v5 XGBoost model)
  gpt4Score?: number;
  claudeScore?: number;
  // Metrics (only for validation, NOT for prediction)
  actualMetrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  // Component results from prior execution (for Pack 2 dependency on Pack 1)
  componentResults?: ComponentResult[];
  // Creator context: calibration profile + channel data (optional, for personalization)
  creatorContext?: CreatorContext | null;
  // Speaking rate data from Whisper segments (Batch B — computed in prediction pipeline)
  speakingRateData?: import('@/lib/services/speaking-rate-analyzer').SpeakingRateResult;
  // Raw Whisper segments for components that need real timestamps (e.g., hook-scorer first 3s)
  whisperSegments?: Array<{ start: number; end: number; text: string }>;
  // Pre-computed XGBoost v7 prediction (extracted in pipeline before orchestrator)
  xgboostPrecomputed?: {
    vps: number;
    raw_prediction: number;
    model_version: string;
    features_provided: number;
    features_total: number;
    missing_features: string[];
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
  skipped?: boolean;
  skipReason?: string;
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
  vps: number;
  /** @deprecated Use vps instead */
  dps?: number;
  confidence: number;
  range: [number, number];
  viralPotential: string; // System 1 VPS tier label from system-registry.ts
  recommendations: string[];
  componentsUsed: string[];
  componentScores: Map<string, number>;
  features: Record<string, any>; // Component-specific features (e.g., Gemini analysis details)
  paths: PathResult[];
  warnings: string[];
  latency: number;
  workflow: WorkflowType;
  // Calibration adjustments applied to the raw prediction
  adjustments?: {
    rawScore: number;           // Score before adjustments
    nicheFactor: number;        // Niche difficulty multiplier
    accountFactor: number;      // Account size multiplier (VPS is relative to cohort)
    // conservativeFactor retired per RF-3.2 — consolidated into prediction-calibrator.ts
    totalFactor: number;        // Combined multiplier
    accountSize?: string;       // Account size used for adjustment
  };
  /** QC Harness: max(llm_preds) - min(llm_preds). High spread = LLM disagreement. */
  llm_spread?: number;
  /** true when LLM components contributed non-zero weight to the final VPS */
  llm_influence_applied?: boolean;
  /** Two-Lane: score_lane VPS (deterministic/ML only, no LLM influence) */
  score_lane_vps?: number;
  /** @deprecated Use score_lane_vps instead */
  score_lane_dps?: number;
  /** Two-Lane: per-LLM predictions for the coach lane */
  coach_lane_llm_predictions?: Array<{ componentId: string; prediction: number }>;
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
  private disabledComponents: Set<string> = new Set();

  // QC Harness: determinism controls for validation mode
  private _deterministic: boolean = false;
  private _deterministicSeed: string = '';
  private _excludeLLMsFromAggregate: boolean = false;
  /** Computed after path execution: max - min of LLM component predictions */
  private _llmSpread: number = 0;

  constructor() {
    this.componentRegistry = new Map();
    this.predictionPaths = new Map();
    this.contextWeights = new Map();

    this.initializeComponentRegistry();
    this.initializePredictionPaths();
    this.initializeContextWeights();
  }

  /**
   * QC Harness: Enable deterministic mode for run-to-run reproducibility.
   * When active: LLM temperature → 0, A/B tests → deterministic hash of seed.
   */
  setDeterministic(enabled: boolean, seed: string = '') {
    this._deterministic = enabled;
    this._deterministicSeed = seed;
    if (enabled) {
      console.log(`[Kai] Deterministic mode ENABLED (seed=${seed})`);
    }
  }

  /**
   * QC Harness: Exclude LLM components from the VPS aggregate.
   * Components still run (results are stored), but their weight is 0 in the final VPS.
   * Use with deterministic mode to isolate whether LLM variance causes VPS drift.
   */
  setExcludeLLMsFromAggregate(enabled: boolean) {
    this._excludeLLMsFromAggregate = enabled;
    if (enabled) {
      console.log(`[Kai] LLM exclusion ENABLED — LLMs run but weight=0 in VPS aggregate`);
    }
  }

  /** Returns the LLM temperature to use: 0 in deterministic mode, otherwise the provided default */
  private getTemperature(defaultTemp: number): number {
    return this._deterministic ? 0 : defaultTemp;
  }

  /** Returns deterministic A/B variant (hash-based) or random */
  private getABVariant(): 'A' | 'B' {
    if (this._deterministic && this._deterministicSeed) {
      // Simple deterministic hash: sum char codes mod 2
      let hash = 0;
      for (let i = 0; i < this._deterministicSeed.length; i++) {
        hash = ((hash << 5) - hash + this._deterministicSeed.charCodeAt(i)) | 0;
      }
      return (Math.abs(hash) % 2 === 0) ? 'A' : 'B';
    }
    return Math.random() < 0.5 ? 'A' : 'B';
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
              `(${score.total_predictions} predictions, avg error: ${score.avg_accuracy_delta?.toFixed(1)} VPS)`
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

  /**
   * Load component configuration from database
   * This determines which components are enabled/disabled for predictions
   */
  async loadComponentConfiguration(): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          db: { schema: 'public' },
          auth: { persistSession: false }
        }
      );

      const { data: configs, error } = await supabase
        .from('component_configuration')
        .select('component_id, enabled, status');

      if (error) {
        // If table doesn't exist yet, use SMART defaults based on API key availability
        if (error.message.includes('does not exist')) {
          console.log('[KaiOrchestrator] component_configuration table not found, using smart defaults');
          
          // Build disabled list based on what's actually available
          const disabledList: string[] = [];
          
          // Only disable LLM components if their API keys are MISSING
          // Check for Gemini API key (multiple possible env var names)
          const hasGeminiKey = !!(process.env.GOOGLE_GEMINI_AI_API_KEY || 
                                  process.env.GOOGLE_AI_API_KEY || 
                                  process.env.GEMINI_API_KEY);
          if (!hasGeminiKey) {
            disabledList.push('gemini');
            console.log('[KaiOrchestrator] ❌ Gemini disabled - no GOOGLE_GEMINI_AI_API_KEY');
          } else {
            console.log('[KaiOrchestrator] ✅ Gemini ENABLED - API key found');
          }
          
          // Check for OpenAI API key (GPT-4) 
          // NOTE: GPT-4 component currently uses heuristic analysis, not OpenAI API
          // So we enable it regardless
          console.log('[KaiOrchestrator] ✅ GPT-4 ENABLED - uses heuristic analysis');
          
          // Check for Claude API key
          const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;
          if (!hasClaudeKey) {
            disabledList.push('claude');
            console.log('[KaiOrchestrator] ❌ Claude disabled - no ANTHROPIC_API_KEY');
          } else {
            console.log('[KaiOrchestrator] ✅ Claude ENABLED - API key found');
          }
          
          // These are always disabled by default (non-LLM reasons)
          // Note: 24-styles, visual-scene-detector, thumbnail-analyzer RE-ENABLED for Pack V
          disabledList.push('niche-keywords', 'competitor-benchmark', 'feature-extraction', 'virality-matrix');
          
          this.disabledComponents = new Set(disabledList);
          console.log(`[KaiOrchestrator] Smart defaults - Disabled: ${disabledList.length > 0 ? disabledList.join(', ') : 'none'}`);
          console.log(`[KaiOrchestrator] 🎯 Qualitative path components: gemini=${hasGeminiKey ? 'ENABLED' : 'disabled'}, gpt4=ENABLED, claude=${hasClaudeKey ? 'ENABLED' : 'disabled'}`);
          return;
        }
        console.warn('[KaiOrchestrator] Failed to load component config:', error.message);
        return;
      }

      if (configs && configs.length > 0) {
        this.disabledComponents.clear();
        let enabledCount = 0;
        let disabledCount = 0;

        for (const config of configs) {
          if (!config.enabled || config.status !== 'active') {
            this.disabledComponents.add(config.component_id);
            disabledCount++;
          } else {
            enabledCount++;
          }
        }

        console.log(`[KaiOrchestrator] Component config loaded: ${enabledCount} enabled, ${disabledCount} disabled`);
        
        if (this.disabledComponents.size > 0) {
          console.log(`[KaiOrchestrator] Disabled components: ${Array.from(this.disabledComponents).join(', ')}`);
        }
      }
    } catch (error: any) {
      console.warn('[KaiOrchestrator] Error loading component config:', error.message);
      // Continue with all components enabled if loading fails
    }
  }

  /**
   * Check if a component is enabled for predictions
   */
  isComponentEnabled(componentId: string): boolean {
    return !this.disabledComponents.has(componentId);
  }

  /**
   * Get list of enabled component IDs
   */
  getEnabledComponents(): string[] {
    return Array.from(this.componentRegistry.keys()).filter(id => this.isComponentEnabled(id));
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
    // ❌ DISABLED - This was a FAKE heuristic-based placeholder, NOT real XGBoost!
    // The REAL XGBoost is 'xgboost-virality-ml' (Component 27) which uses Python + v5 model
    // Disabled on 2025-12-27 to stop polluting predictions with word-count garbage
    // this.componentRegistry.set('xgboost', {
    //   id: 'xgboost',
    //   name: 'XGBoost 118 Features',
    //   type: 'quantitative',
    //   status: 'active',
    //   reliability: 0.97,
    //   avgLatency: 50,
    //   lastSuccess: null,
    //   execute: async (input) => this.executeXGBoost(input)
    // });

    // Component 4: FFmpeg Visual Analysis (analyzes video files directly)
    this.componentRegistry.set('ffmpeg', {
      id: 'ffmpeg',
      name: 'FFmpeg Visual Analysis',
      type: 'quantitative',
      status: 'active',
      reliability: 0.99,
      avgLatency: 30000, // Increased: actual video file analysis takes 10-30s
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
      execute: async (_input) => ({
        componentId: 'whisper',
        success: false,
        error: 'Dead code removed (WSP-001). Real Whisper runs in transcription-pipeline.ts before orchestrator.',
        latency: 0
      })
    });

    // Component 7: Text Analysis (GPT-4o-mini / Heuristic)
    this.componentRegistry.set('gpt4', {
      id: 'gpt4',
      name: 'Text Analysis (GPT-4o-mini / Heuristic)',
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
      avgLatency: 45000, // Video upload + processing + analysis for 60s videos needs ~40-50s
      lastSuccess: null,
      execute: async (input) => this.executeGemini(input)
    });

    // Component 8: Niche Keywords — ALWAYS DISABLED at runtime (line ~333 pushes to disabledComponents).
    // Kept in registry to prevent historical path execution errors; contributes 0 to predictions.
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

    // Component 9: DPS Calculator — REMOVED (DPS v2 rollout).
    // DPS is a post-hoc ground-truth label, not a prediction component.
    // Canonical scoring: src/lib/training/dps-v2.ts

    // Component 10: Feature Extraction (FULL 152 features) — ALWAYS DISABLED at runtime (pushed to disabledComponents).
    // Returns prediction: undefined, output consumed by nothing. Kept for future XGBoost retrain (200+ labeled videos).
    this.componentRegistry.set('feature-extraction', {
      id: 'feature-extraction',
      name: 'Feature Extraction Service (152 features)',
      type: 'quantitative',
      status: 'active',
      reliability: 0.99,
      avgLatency: 60000, // Increased: includes FFmpeg + LLM scoring which can take 30-60s
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

    // DISABLED: Zero variance - just returns niche average VPS, not contributing to prediction accuracy
    // Component 12: Historical Comparison
    // this.componentRegistry.set('historical', {
    //   id: 'historical',
    //   name: 'Historical Comparison',
    //   type: 'historical',
    //   status: 'active',
    //   reliability: 0.80,
    //   avgLatency: 500,
    //   lastSuccess: null,
    //   execute: async (input) => this.executeHistoricalComparison(input)
    // });

    // Component 17: Hook Strength Scorer — 5-channel multi-modal (text/audio/visual/pace/tone)
    // Runs in Phase 2 (DEPENDENT_COMPONENTS) to access audio-analyzer results from Phase 1.
    this.componentRegistry.set('hook-scorer', {
      id: 'hook-scorer',
      name: 'Hook Strength Scorer (Multi-Modal)',
      type: 'pattern',
      status: 'active',
      reliability: 0.8, // Deterministic multi-modal fusion, no LLM
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
      reliability: 0.5,
      avgLatency: 30000,
      lastSuccess: null,
      execute: async (input) => this.executeAudioAnalyzer(input)
    });

    // Component 16: Visual Scene Detection (RE-ENABLED for Pack V visual rubric)
    this.componentRegistry.set('visual-scene-detector', {
      id: 'visual-scene-detector',
      name: 'Visual Scene Detection',
      type: 'quantitative',
      status: 'active',
      reliability: 0.5,
      avgLatency: 40000,
      lastSuccess: null,
      execute: async (input) => this.executeVisualSceneDetector(input)
    });

    // DISABLED: Content-independent, returns same score regardless of video quality
    // Component 18: Trend Timing Analyzer
    // this.componentRegistry.set('trend-timing-analyzer', {
    //   id: 'trend-timing-analyzer',
    //   name: 'Trend Timing Analyzer',
    //   type: 'historical',
    //   status: 'active',
    //   reliability: 0.5, // Will improve with learning loop
    //   avgLatency: 1000,
    //   lastSuccess: null,
    //   execute: async (input) => this.executeTrendTimingAnalyzer(input)
    // });

    // Component 20: Thumbnail Analyzer (RE-ENABLED for Pack V visual rubric)
    this.componentRegistry.set('thumbnail-analyzer', {
      id: 'thumbnail-analyzer',
      name: 'Thumbnail Analyzer',
      type: 'quantitative',
      status: 'active',
      reliability: 0.5,
      avgLatency: 35000,
      lastSuccess: null,
      execute: async (input) => this.executeThumbnailAnalyzer(input)
    });

    // DISABLED: Content-independent - useful for timing recommendations but not prediction accuracy
    // Component 21: Posting Time Optimizer
    // this.componentRegistry.set('posting-time-optimizer', {
    //   id: 'posting-time-optimizer',
    //   name: 'Posting Time Optimizer',
    //   type: 'historical',
    //   status: 'active',
    //   reliability: 0.5, // Will improve with learning loop
    //   avgLatency: 1200,
    //   lastSuccess: null,
    //   execute: async (input) => this.executePostingTimeOptimizer(input)
    // });

    // Component 22: 24 Video Styles Classifier (RE-ENABLED for Pack V visual rubric)
    this.componentRegistry.set('24-styles', {
      id: '24-styles',
      name: '24 Video Styles Classifier',
      type: 'pattern',
      status: 'active',
      reliability: 0.5,
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
      avgLatency: 15000, // Increased: OpenAI GPT-4 call can take 5-10s
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
      avgLatency: 15000, // Increased: Claude API can take 5-10s
      lastSuccess: null,
      execute: async (input) => this.executeClaude(input)
    });

    // Component 25: Python Enhanced Analysis (PySceneDetect, VADER, faster-whisper)
    // this.componentRegistry.set('python-analysis', {
    //   id: 'python-analysis',
    //   name: 'Python Enhanced Analysis',
    //   type: 'quantitative',
    //   status: 'active',
    //   reliability: 0.9, // High reliability - real video/audio analysis
    //   avgLatency: 3000,
    //   lastSuccess: null,
    //   execute: async (input) => this.executePythonAnalysis(input)
    // });

    // Component 26: Virality Indicator Engine
    // Proprietary 6-factor prediction algorithm (runs locally, no API calls)
    this.componentRegistry.set('virality-indicator', {
      id: 'virality-indicator',
      name: 'Virality Indicator Engine',
      type: 'pattern',
      status: 'active',
      reliability: 0.85,
      avgLatency: 500, // Target: < 2 seconds
      lastSuccess: null,
      execute: async (input) => this.executeViralityIndicator(input)
    });

    // Component 27: XGBoost Virality ML Predictor v7 (TRAINED MODEL — TypeScript inference)
    // Uses pre-computed result from pipeline (70 content-only features, no follower bias).
    // One component among many — blended by orchestrator, NOT the sole VPS source.
    this.componentRegistry.set('xgboost-virality-ml', {
      id: 'xgboost-virality-ml',
      name: 'XGBoost Virality ML Predictor v7',
      type: 'quantitative',
      status: 'active',
      reliability: 0.75, // One signal among many, not sole authority
      avgLatency: 2000, // TypeScript inference, no Python subprocess
      lastSuccess: null,
      execute: async (input) => this.executeXGBoostViralityML(input)
    });

    // Component 28: Pack 1 - Unified Grading Rubric
    this.componentRegistry.set('unified-grading', {
      id: 'unified-grading',
      name: 'Unified Grading Rubric (Pack 1)',
      type: 'qualitative',
      status: 'active',
      reliability: 0.90,
      avgLatency: 25000,
      lastSuccess: null,
      execute: async (input) => this.executeUnifiedGrading(input)
    });

    // Component 29: Pack 2 - Editing Coach
    this.componentRegistry.set('editing-coach', {
      id: 'editing-coach',
      name: 'Editing Coach (Pack 2)',
      type: 'qualitative',
      status: 'active',
      reliability: 0.88,
      avgLatency: 5000,
      lastSuccess: null,
      execute: async (input) => this.executeEditingCoach(input)
    });

    // Component 30: Pack V - Visual Rubric (NO transcript required)
    this.componentRegistry.set('visual-rubric', {
      id: 'visual-rubric',
      name: 'Visual Rubric (Pack V)',
      type: 'qualitative',
      status: 'active',
      reliability: 0.85,
      avgLatency: 100, // Rule-based, very fast
      lastSuccess: null,
      execute: async (input) => this.executeVisualRubric(input)
    });

    // Component 31: Pack 3 - Viral Mechanics (synthesizes all signals)
    this.componentRegistry.set('viral-mechanics', {
      id: 'viral-mechanics',
      name: 'Viral Mechanics (Pack 3)',
      type: 'qualitative',
      status: 'active',
      reliability: 0.80,
      avgLatency: 50, // Rule-based, very fast
      lastSuccess: null,
      execute: async (input) => this.executeViralMechanics(input)
    });
  }

  private initializePredictionPaths(): void {
    // Multi-Path Exploration Strategy
    this.predictionPaths.set('quantitative', {
      name: 'Quantitative Analysis',
      // REMOVED 'xgboost' (fake heuristic) - 'xgboost-virality-ml' moved to pattern_based path
      // where it runs in Phase 2 with access to real component results (hook-scorer, 7-legos, etc.)
      components: ['feature-extraction'],
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
      // visual-rubric added - runs WITHOUT transcript, before Pack 1/2
      // ffmpeg, visual-scene-detector, thumbnail-analyzer, audio-analyzer moved here for Pack V input
      // xgboost-virality-ml added as component #18 — pre-computed in pipeline, blended by orchestrator
      components: ['ffmpeg', 'visual-scene-detector', 'thumbnail-analyzer', 'audio-analyzer', '7-legos', '9-attributes', '24-styles', 'pattern-extraction', 'hook-scorer', 'virality-indicator', 'xgboost-virality-ml', 'visual-rubric', 'unified-grading', 'editing-coach', 'viral-mechanics'],
      weight: 0.45, // HIGHEST - 9-attributes and 7-legos most accurate
      context: 'template-selection'
    });

    // NOTE (D11): Historical path is defined but ALL its components are disabled/removed:
    // - 'historical': Removed (zero variance — returns niche average VPS)
    // - 'niche-keywords': Always disabled at runtime
    // - 'trend-timing-analyzer': Removed (content-independent)
    // - 'posting-time-optimizer': Removed (content-independent)
    // Components list is empty — path contributes 0 to predictions. Its 15% weight is
    // redistributed to surviving paths via graceful degradation.
    this.predictionPaths.set('historical', {
      name: 'Historical Comparison',
      components: [],
      weight: 0.15,
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
      
      // Load component configuration (which components are enabled/disabled)
      await this.loadComponentConfiguration();

      // Get context-aware weights for this workflow
      const contextWeights = this.getContextWeights(workflow);

      // Execute multiple paths in parallel
      console.log(`Executing ${this.predictionPaths.size} prediction paths...`);
      const pathResults = await this.executeMultiPath(input, contextWeights);

      // ========================================================================
      // GRACEFUL DEGRADATION: Handle failed paths and adjust weights
      // ========================================================================
      const successfulPaths = pathResults.filter(p => p.success);
      const failedPaths = pathResults.filter(p => !p.success);
      
      console.log(`[Kai] Path execution summary: ${successfulPaths.length}/${pathResults.length} paths succeeded`);
      
      // Log each path's status
      for (const path of pathResults) {
        if (path.success) {
          console.log(`  ✅ ${path.path}: VPS=${path.aggregatedPrediction?.toFixed(1)}, weight=${(path.weight * 100).toFixed(0)}%`);
        } else {
          console.log(`  ❌ ${path.path}: FAILED (${path.results.length} components attempted)`);
          // Log component-level failures
          for (const result of path.results) {
            if (!result.success) {
              console.log(`     └─ ${result.componentId}: ${result.error || 'failed'}`);
            }
          }
        }
      }
      
      // Special handling for qualitative path failure
      const qualitativePath = pathResults.find(p => p.path === 'qualitative');
      if (qualitativePath && !qualitativePath.success) {
        console.log('[Kai] ⚠️ QUALITATIVE PATH FAILED - Redistributing weights to other paths');
        
        // Calculate total weight of successful paths
        const totalSuccessWeight = successfulPaths.reduce((sum, p) => sum + p.weight, 0);
        
        // Redistribute qualitative weight proportionally to other paths
        if (totalSuccessWeight > 0 && successfulPaths.length > 0) {
          const qualitativeWeight = contextWeights['qualitative'] || 0.25;
          const redistributionFactor = 1 + (qualitativeWeight / totalSuccessWeight);
          
          console.log(`[Kai] Redistributing ${(qualitativeWeight * 100).toFixed(0)}% qualitative weight (factor: ${redistributionFactor.toFixed(2)}x)`);
          
          // Boost weights of successful paths
          for (const path of successfulPaths) {
            path.weight = path.weight * redistributionFactor;
          }
        }
      }

      // ════════════════════════════════════════════════════════════════════
      // LLM CONSENSUS GATE: Compute spread and recompute path aggregations
      // Must run BEFORE agreement/synthesis so those use gated values
      // ════════════════════════════════════════════════════════════════════
      const llmGate = this.applyLLMConsensusGate(pathResults);

      // NEW: Check for viral patterns
      const patternBoost = await this.checkViralPatterns(input);

      // Check for agreement/disagreement between paths (uses gated aggregations)
      const agreement = this.calculateAgreement(pathResults);
      console.log(`Path agreement level: ${agreement.level} (variance: ${agreement.variance.toFixed(2)})`);

      let finalPrediction: number;
      let finalConfidence: number;
      let recommendations: string[] = [];
      let warnings: string[] = [];
      
      // Add warning if LLM consensus gate fired
      if (llmGate.llmDisagreement) {
        warnings.push(`LLM disagreement detected (spread=${llmGate.llmSpread.toFixed(1)} VPS > ${KaiOrchestrator.LLM_SPREAD_THRESHOLD}) — LLM weight zeroed`);
      }

      // Add warning if qualitative path failed
      if (qualitativePath && !qualitativePath.success) {
        warnings.push('Qualitative analysis (LLM) unavailable - using remaining paths');
        
        // Explain which components failed
        const failedComponents = qualitativePath.results
          .filter(r => !r.success)
          .map(r => `${r.componentId}: ${r.error}`);
        
        if (failedComponents.length > 0) {
          console.log('[Kai] Qualitative component failures:', failedComponents.join(', '));
        }
      }

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
        const result = await this.performDisagreementReconciliation(pathResults, input);
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
      const rawScoreBeforeCalibration = finalPrediction;
      const calibrated = this.applyCalibrationAdjustments(finalPrediction, input, finalConfidence);
      finalPrediction = calibrated.prediction;
      finalConfidence = calibrated.confidence;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30a7b9'},body:JSON.stringify({sessionId:'30a7b9',location:'kai-orchestrator.ts:ORCH_FINAL',message:'Orchestrator final VPS computation',data:{rawScoreBeforeCalibration,nicheFactor:calibrated.adjustments.nicheFactor,accountFactor:calibrated.adjustments.accountFactor,postCalibrationVPS:finalPrediction,finalConfidence,patternBoost,agreementLevel:agreement.level,llmSpread:llmGate.llmSpread,llmDisagreement:llmGate.llmDisagreement,llmInfluenceApplied:llmGate.llmInfluenceApplied,pathAggregations:pathResults.filter(p=>p.success).map(p=>({path:p.path,weight:p.weight,aggregatedPrediction:p.aggregatedPrediction}))},timestamp:Date.now(),hypothesisId:'C,D'})}).catch(()=>{});
      // #endregion
      
      // Store adjustment details for transparency
      const adjustmentsApplied = {
        rawScore: rawScoreBeforeCalibration,
        nicheFactor: calibrated.adjustments.nicheFactor,
        accountFactor: calibrated.adjustments.accountFactor,
        // conservativeFactor retired per RF-3.2 — consolidated into prediction-calibrator.ts
        totalFactor: calibrated.adjustments.nicheFactor * calibrated.adjustments.accountFactor,
        accountSize: input.accountSize
      };
      
      // Add calibration info to warnings if significant adjustments were made
      const totalAdjustment = adjustmentsApplied.totalFactor;
      if (totalAdjustment < 0.9) {
        warnings.push(`Score calibrated for market factors (${((1 - totalAdjustment) * 100).toFixed(0)}% reduction)`);
      } else if (totalAdjustment > 1.1) {
        warnings.push(`Score boosted for account size advantage (+${((totalAdjustment - 1) * 100).toFixed(0)}%)`);
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

      // Determine viral potential using System 1 VPS tiers (System 2 retired per D4)
      const viralPotential = getVpsTier(finalPrediction).label;

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
      
      // COUNT: Components that succeeded vs failed/skipped
      const allResults = pathResults.flatMap(p => p.results);
      const successfulResults = allResults.filter(r => r.success);
      const skippedResults = allResults.filter(r => !r.success && r.error?.includes('No valid transcript'));
      const failedResults = allResults.filter(r => !r.success && !r.error?.includes('No valid transcript'));
      
      // WARNING: If most components skipped due to missing input, add explicit warning
      const config = getPredictionConfig();
      if (skippedResults.length > successfulResults.length && !config.enableMocks) {
        const skippedReason = `${skippedResults.length}/${allResults.length} components skipped due to missing input (transcript/video)`;
        warnings.push(`⚠️ LOW CONFIDENCE: ${skippedReason}`);
        warnings.push('Prediction based on limited data - provide transcript or video for accurate results');
        console.warn(`[Kai] ⚠️ ${skippedReason}`);
      }

      console.log(`\n========================================`);
      console.log(`PREDICTION COMPLETE`);
      console.log(`VPS: ${finalPrediction.toFixed(1)}`);
      console.log(`Confidence: ${(finalConfidence * 100).toFixed(0)}%`);
      console.log(`Range: [${range[0].toFixed(1)}, ${range[1].toFixed(1)}]`);
      console.log(`Viral Potential: ${viralPotential}`);
      console.log(`Latency: ${latency}ms`);
      console.log(`Components: ${successfulResults.length} succeeded, ${skippedResults.length} skipped, ${failedResults.length} failed`);
      console.log(`========================================\n`);

      // ── Two-Lane: compute score-lane VPS (deterministic/ML only) ────────
      // Re-aggregate only non-LLM components across all paths
      let scoreLaneVps = finalPrediction; // default to same if no LLM influence
      if (llmGate.llmInfluenceApplied) {
        // LLMs did influence the main VPS — recompute without them
        let scoreLaneWeightedSum = 0;
        let scoreLaneTotalWeight = 0;
        for (const pr of pathResults) {
          if (!pr.results) continue;
          for (const r of pr.results) {
            if (!r.success || r.prediction === undefined) continue;
            if (KaiOrchestrator.LLM_COMPONENT_IDS.has(r.componentId)) continue;
            const w = r.confidence || 0.5;
            scoreLaneWeightedSum += r.prediction * w;
            scoreLaneTotalWeight += w;
          }
        }
        if (scoreLaneTotalWeight > 0) {
          scoreLaneVps = scoreLaneWeightedSum / scoreLaneTotalWeight;
        }
      }

      return {
        id: predictionId,
        success: true,
        vps: Math.round(finalPrediction * 10) / 10,
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
        workflow,
        adjustments: adjustmentsApplied,
        llm_spread: llmGate.llmSpread,
        llm_influence_applied: llmGate.llmInfluenceApplied,
        score_lane_vps: Math.round(scoreLaneVps * 10) / 10,
        score_lane_dps: Math.round(scoreLaneVps * 10) / 10,
        coach_lane_llm_predictions: llmGate.llmPredictions,
      };

    } catch (error: any) {
      console.error(`KAI ORCHESTRATOR ERROR: ${error.message}`);

      return {
        id: predictionId,
        success: false,
        vps: 0,
        dps: 0,
        confidence: 0,
        range: [0, 0],
        viralPotential: 'Needs Work',
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
   * Get account size adjustment - VPS is RELATIVE to cohort expectations
   * 
   * KEY INSIGHT: The same raw engagement means VERY different things:
   * - 10K views from 1K follower account = EXCEPTIONAL (VPS 85+)
   * - 10K views from 1M follower account = FLOP (VPS 15)
   * 
   * Account size cohort benchmarks:
   * | Account Size | Expected Engagement | Views/Followers Ratio |
   * |--------------|--------------------|-----------------------|
   * | 0-10K        | 8-15%              | 0.5-2x followers      |
   * | 10K-100K     | 5-10%              | 0.3-1x followers      |
   * | 100K-1M      | 3-6%               | 0.1-0.5x followers    |
   * | 1M+          | 1-4%               | 0.05-0.2x followers   |
   * 
   * The adjustment BOOSTS small account predictions (easier to go viral relative to cohort)
   * and REDUCES large account predictions (harder to exceed massive audience expectations).
   */
  private getAccountSizeAdjustment(followerCount: number | undefined, accountSize: string | undefined): number {
    if (!accountSize && !followerCount) return 1.0; // Raw VPS mode — no account adjustment

    let followers = followerCount || 0;
    
    // Parse accountSize string to estimate follower count
    // Format examples: "small (0-10K)", "Medium (10K-100K)", "large (100k-1m)", "mega (1M+)"
    if (!followers && accountSize) {
      const sizeLower = accountSize.toLowerCase();
      
      // Match patterns like "0-10k", "10k-100k", "100k-1m", "1m+"
      if (sizeLower.includes('0-10k') || sizeLower.includes('nano') || sizeLower.includes('micro')) {
        followers = 5000; // Midpoint of 0-10K
      } else if (sizeLower.includes('10k-100k') || sizeLower.includes('small') && !sizeLower.includes('0-')) {
        followers = 35000; // Midpoint of 10K-100K
      } else if (sizeLower.includes('100k-1m') || sizeLower.includes('large')) {
        followers = 350000; // Midpoint of 100K-1M
      } else if (sizeLower.includes('1m+') || sizeLower.includes('mega') || sizeLower.includes('1m-')) {
        followers = 2000000; // Representative of 1M+
      } else if (sizeLower.startsWith('small')) {
        followers = 5000; // Default small
      } else if (sizeLower.startsWith('medium')) {
        followers = 35000; // Default medium
      } else {
        followers = 10000; // Default fallback
      }
      
      console.log(`[Kai] Account size parsed: "${accountSize}" → ${followers.toLocaleString()} followers`);
    }
    
    // VPS Cohort Adjustment Factors
    // 
    // PHILOSOPHY: VPS measures performance vs. cohort EXPECTATIONS
    // - Small accounts: Lower baseline expectations → same content scores HIGHER
    // - Large accounts: Higher baseline expectations → same content scores LOWER
    //
    // The XGBoost model predicts "raw" virality. This adjustment contextualizes it.
    
    if (followers <= 10000) {
      // Small accounts (0-10K): BOOST predictions
      // Rationale: 10K views from 5K followers is EXCEPTIONAL (2x follower reach)
      // Same quality content has higher relative impact
      return 1.15; // +15% boost to predicted VPS
      
    } else if (followers <= 50000) {
      // Growing accounts (10K-50K): Moderate boost  
      // Still relatively easy to exceed cohort expectations
      return 1.08; // +8% boost
      
    } else if (followers <= 100000) {
      // Medium accounts (50K-100K): Baseline (model trained mostly here)
      return 1.0; // No adjustment - this is the reference cohort
      
    } else if (followers <= 500000) {
      // Large accounts (100K-500K): Reduction
      // Harder to stand out when audience expects millions of views
      return 0.88; // -12% reduction
      
    } else if (followers <= 1000000) {
      // Very Large accounts (500K-1M): Significant reduction
      return 0.78; // -22% reduction
      
    } else {
      // Mega accounts (1M+): Maximum reduction
      // Even 1M views might be "underperforming" for their cohort
      return 0.68; // -32% reduction
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
    // ── Raw VPS mode: skip niche/account adjustments (Scoring Rescue, 2026-03-11) ──
    // When no accountSize is provided, this is a Raw VPS prediction (Workflow 1).
    // Niche and account factors are cohort adjustments, not content quality signals.
    // They belong in Workflow 2 (creator-facing predictions via /api/creator/predict).
    const isRawVpsMode = !input.accountSize;

    // ADJUSTMENT 1: Apply niche difficulty factor (skip in Raw VPS mode)
    const nicheFactor = isRawVpsMode ? 1.0 : this.getNicheDifficultyFactor(input.niche || 'general');

    // ADJUSTMENT 2: Apply account size adjustment (skip in Raw VPS mode)
    const accountFactor = isRawVpsMode ? 1.0 : this.getAccountSizeAdjustment(
      (input as any).creatorFollowers || (input as any).followerCount,
      input.accountSize
    );

    if (isRawVpsMode) {
      console.log('[Kai] Raw VPS mode: niche/account adjustments SKIPPED (no accountSize provided)');
    }

    // NOTE: Conservative pull for high predictions was removed (RF-3.2).
    // The calibrator's Rule 4 (prediction-calibrator.ts) is the single source
    // of truth for high-prediction scaling, with full audit trail logging.

    // Apply all adjustments
    let finalPrediction = rawPrediction * nicheFactor * accountFactor;
    
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
      finalScore: finalPrediction.toFixed(1),
      confidence: adjustedConfidence.toFixed(2)
    });

    return {
      prediction: Math.round(finalPrediction * 10) / 10,
      confidence: adjustedConfidence,
      adjustments: {
        nicheFactor,
        accountFactor,
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
        
        // Special logging for qualitative path to diagnose issues
        if (pathName === 'qualitative') {
          console.log('[Qualitative] 🎯 Starting Qualitative path analysis');
          console.log('[Qualitative] Components to execute:', path.components.join(', '));
          
          // Check which components are enabled
          for (const componentId of path.components) {
            const isEnabled = this.isComponentEnabled(componentId);
            console.log(`[Qualitative] Component ${componentId}: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
          }
        }

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

            // Reference the static set — only direct LLM evaluators
            const LLM_COMPONENT_IDS = KaiOrchestrator.LLM_COMPONENT_IDS;

            for (const result of successfulResults) {
              let weight = result.confidence || 0.5;

              // Coach-lane components: still execute & store in DB, but never influence VPS
              if (COACH_LANE_COMPONENT_IDS.has(result.componentId)) {
                console.log(`    [Coach Lane] Zeroing weight for ${result.componentId} (coach-lane-only)`);
                weight = 0;
              // QC Harness: zero weight for LLM components when flag is set
              // Component still ran (stored in DB), but does not influence VPS
              } else if (this._excludeLLMsFromAggregate && LLM_COMPONENT_IDS.has(result.componentId)) {
                console.log(`    [QC] Zeroing weight for ${result.componentId} (excludeLLMsFromAggregate=true)`);
                weight = 0;
              } else {
                // All components weighted by confidence only — no artificial boosts
                // Extreme-score boost removed (CCI-L3-007): was inflating pre-gate values
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

          // DIAGNOSTIC LOGGING: Log individual component scores for debugging over-prediction
          console.log(`\n[${pathName}] 📊 Component Scores:`);
          console.log(`[${pathName}]   ┌──────────────────────────────────────────────────────────────┐`);
          const LLM_IDS_FOR_LOG = KaiOrchestrator.LLM_COMPONENT_IDS;
          for (const result of results) {
            if (result.success && result.prediction !== undefined) {
              const weight = result.confidence || 0.5;
              const isCoachLane = COACH_LANE_COMPONENT_IDS.has(result.componentId);
              const zeroed = isCoachLane || (this._excludeLLMsFromAggregate && LLM_IDS_FOR_LOG.has(result.componentId));
              const effWeight = zeroed ? 0 : weight;
              const tag = isCoachLane ? ' [COACH]' : zeroed ? ' [EXCLUDED]' : '';
              console.log(`[${pathName}]   │ ${result.componentId.padEnd(20)} VPS=${String(result.prediction?.toFixed(1)).padStart(5)} │ conf=${result.confidence?.toFixed(2) || 'N/A'} │ eff_weight=${effWeight.toFixed(2)}${tag}`);
            } else if (!result.success) {
              console.log(`[${pathName}]   │ ${result.componentId.padEnd(20)} ❌ FAILED: ${(result.error || 'unknown').substring(0, 30)}`);
            }
          }
          console.log(`[${pathName}]   └──────────────────────────────────────────────────────────────┘`);

          if (successfulResults.length === 0) {
            console.log(`[${pathName}] ⚠️ PATH FAILED - No components succeeded!`);
          } else {
            console.log(`[${pathName}] 🎯 Aggregated prediction: ${aggregatedPrediction?.toFixed(1)} (from ${successfulResults.length} components)`);
          }

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30a7b9'},body:JSON.stringify({sessionId:'30a7b9',location:`kai-orchestrator.ts:PATH_${pathName}`,message:`Path ${pathName} component scores`,data:{path:pathName,aggregatedPrediction,aggregatedConfidence,componentScores:results.filter(r=>r.success&&r.prediction!==undefined).map(r=>({id:r.componentId,prediction:r.prediction,confidence:r.confidence,isCoachLane:['gpt4','claude','unified-grading','editing-coach','9-attributes','7-legos'].includes(r.componentId)})),excludedDefaults:results.filter(r=>r.success&&r.prediction!==undefined).filter(r=>{const dv=[50,62,65,68,70];return dv.includes(Math.round(r.prediction||0))&&(!r.features||Object.keys(r.features).length===0)}).map(r=>r.componentId)},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
          // #endregion

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
    // ========================================================================
    // TWO-PHASE EXECUTION:
    // Phase 1: Run independent components in parallel
    // Phase 2: Run dependent components (visual-rubric, unified-grading, editing-coach)
    //          with componentResults from Phase 1
    // ========================================================================

    // Components that depend on results from other components
    // viral-mechanics runs LAST because it synthesizes all other signals
    const DEPENDENT_COMPONENTS = ['hook-scorer', '24-styles', 'visual-rubric', 'unified-grading', 'editing-coach', 'viral-mechanics'];

    // First pass: filter out invalid/disabled components
    const validComponents: Array<{
      componentId: string;
      component: ComponentRegistry;
      testInput: VideoInput;
      isQualitative: boolean;
      baseTimeout: number;
      isDependent: boolean;
    }> = [];

    const skippedResults: ComponentResult[] = [];

    for (const componentId of componentIds) {
      const component = this.componentRegistry.get(componentId);

      if (!component) {
        console.warn(`    Component not found: ${componentId}`);
        skippedResults.push({
          componentId,
          success: false,
          error: 'Component not registered',
          latency: 0
        });
        continue;
      }

      if (!this.isComponentEnabled(componentId)) {
        console.log(`    ⏭️ Skipping disabled component: ${componentId}`);
        skippedResults.push({
          componentId,
          success: false,
          error: 'Component disabled in configuration',
          latency: 0
        });
        continue;
      }

      if (component.status === 'failed') {
        console.warn(`    Skipping failed component: ${componentId}`);
        skippedResults.push({
          componentId,
          success: false,
          error: 'Component marked as failed',
          latency: 0
        });
        continue;
      }

      // Check for A/B test (quick check, don't await here for speed)
      const variantInfo = await this.getComponentVariant(componentId);
      let testInput = input;

      if (variantInfo) {
        console.log(`    A/B Test active for ${componentId} - Using variant ${variantInfo.variant}`);
        testInput = { ...input, _abTestConfig: variantInfo.config };
      }

      const isQualitativeComponent = ['gemini', 'gpt4', 'claude', 'unified-grading', 'editing-coach', 'visual-rubric'].includes(componentId);
      const baseTimeout = isQualitativeComponent ? 
        Math.max(45000, component.avgLatency * 2.0) : 
        Math.max(45000, component.avgLatency * 1.5);
      
      if (isQualitativeComponent) {
        console.log(`[Qualitative] Starting ${componentId} (timeout: ${baseTimeout}ms)`);
      }

      validComponents.push({
        componentId,
        component,
        testInput,
        isQualitative: isQualitativeComponent,
        baseTimeout,
        isDependent: DEPENDENT_COMPONENTS.includes(componentId)
      });
    }

    // ========================================================================
    // PHASE 1: Execute independent components in PARALLEL
    // ========================================================================
    const independentComponents = validComponents.filter(c => !c.isDependent);
    const dependentComponents = validComponents.filter(c => c.isDependent);

    console.log(`[Execution] Phase 1: Running ${independentComponents.length} independent components in parallel`);
    console.log(`[Execution] Phase 2 pending: ${dependentComponents.length} dependent components (${dependentComponents.map(c => c.componentId).join(', ')})`);

    const phase1Results = await Promise.all(
      independentComponents.map(async ({ componentId, component, testInput, isQualitative, baseTimeout }) => {
        const startTime = Date.now();
        
        try {
          // First attempt
          const result = await this.executeWithTimeout(component, testInput, baseTimeout);
          
          if (result.success) {
            component.lastSuccess = new Date();
            component.avgLatency = (component.avgLatency + result.latency) / 2;
            
            if (isQualitative) {
              console.log(`[Qualitative] ✅ ${componentId} completed - VPS: ${result.prediction?.toFixed(1)}, latency: ${result.latency}ms`);
            }
            return result;
          }
          
          // First attempt failed - try one quick retry (no retries for slow components)
          if (!isQualitative && baseTimeout < 10000) {
            console.log(`      Quick retry for ${componentId}`);
            const retryResult = await this.executeWithTimeout(component, testInput, baseTimeout * 1.5);
            if (retryResult.success) {
              component.lastSuccess = new Date();
              return retryResult;
            }
          }
          
          // Log failure
          if (isQualitative) {
            console.log(`[Qualitative] ⚠️ ${componentId} failed: ${result?.error || 'returned success: false'}`);
          }
          
          // Mark for review
          this.flagForReview(component, testInput);
          component.reliability = Math.max(0, component.reliability - 0.05);
          if (component.reliability < 0.5) {
            component.status = 'degraded';
          }
          
          return result;
          
        } catch (error: any) {
          console.warn(`      ${componentId} failed: ${error.message}`);
          
          if (isQualitative) {
            console.log(`[Qualitative] ❌ ${componentId} exception: ${error.message}`);
          }

          // Mark for review
          this.flagForReview(component, testInput);
          component.reliability = Math.max(0, component.reliability - 0.05);

          return {
            componentId,
            success: false,
            error: error.message,
            latency: Date.now() - startTime
          };
        }
      })
    );

    // ========================================================================
    // PHASE 2: Execute dependent components with Phase 1 results
    // ========================================================================
    console.log(`[Execution] Phase 1 complete. ${phase1Results.filter(r => r.success).length}/${phase1Results.length} components succeeded`);

    let phase2Results: ComponentResult[] = [];

    if (dependentComponents.length > 0) {
      console.log(`[Execution] Phase 2: Running ${dependentComponents.length} dependent components with componentResults`);

      // Build enhanced input with Phase 1 results
      const allPhase1Results = [...skippedResults, ...phase1Results];

      // Execute dependent components sequentially (they may depend on each other)
      // Order: visual-rubric, unified-grading, editing-coach, viral-mechanics
      // viral-mechanics runs LAST to synthesize all results
      const dependentOrder = ['hook-scorer', '24-styles', 'visual-rubric', 'unified-grading', 'editing-coach', 'viral-mechanics'];
      const sortedDependentComponents = dependentComponents.sort((a, b) => {
        const aIdx = dependentOrder.indexOf(a.componentId);
        const bIdx = dependentOrder.indexOf(b.componentId);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });

      for (const { componentId, component, testInput, isQualitative, baseTimeout } of sortedDependentComponents) {
        const startTime = Date.now();

        // Inject all prior results into componentResults
        const enhancedInput: VideoInput = {
          ...testInput,
          componentResults: [...allPhase1Results, ...phase2Results]
        };

        console.log(`[Execution] Phase 2: Running ${componentId} with ${enhancedInput.componentResults?.length || 0} component results`);

        try {
          const result = await this.executeWithTimeout(component, enhancedInput, baseTimeout);

          if (result.success) {
            component.lastSuccess = new Date();
            component.avgLatency = (component.avgLatency + result.latency) / 2;

            if (isQualitative) {
              console.log(`[Execution] ✅ ${componentId} completed - prediction: ${result.prediction?.toFixed(1)}, latency: ${result.latency}ms`);
            }
          } else {
            console.log(`[Execution] ⚠️ ${componentId} failed: ${result?.error || 'returned success: false'}`);
          }

          phase2Results.push(result);
        } catch (error: any) {
          console.warn(`[Execution] ❌ ${componentId} exception: ${error.message}`);

          phase2Results.push({
            componentId,
            success: false,
            error: error.message,
            latency: Date.now() - startTime
          });
        }
      }
    }

    // Combine all results
    return [...skippedResults, ...phase1Results, ...phase2Results];
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
  // LLM CONSENSUS GATE
  // ==========================================================================

  /** LLM component IDs for spread computation — only direct LLM evaluators */
  private static readonly LLM_COMPONENT_IDS = new Set([
    'gpt4', 'gemini', 'claude',
  ]);

  /** Threshold above which LLM weight is zeroed */
  private static readonly LLM_SPREAD_THRESHOLD = 10;

  /** Max weight an LLM component can contribute when spread is within threshold */
  private static readonly LLM_CONSENSUS_WEIGHT_CAP = 0.15;

  /**
   * Compute LLM spread across all paths, then recompute path aggregations
   * with the consensus gate applied.
   *
   * If spread > 10 VPS  → LLM weight = 0, flag LLM_DISAGREEMENT
   * If spread <= 10 VPS → LLM weight capped at 0.15
   *
   * Returns the spread value and whether the gate fired.
   */
  private applyLLMConsensusGate(pathResults: PathResult[]): {
    llmSpread: number;
    llmDisagreement: boolean;
    llmInfluenceApplied: boolean;
    llmPredictions: { componentId: string; prediction: number }[];
  } {
    // 1. Collect all LLM predictions from across every path
    const llmPredictions: { componentId: string; prediction: number }[] = [];
    for (const path of pathResults) {
      for (const r of path.results) {
        if (
          r.success &&
          r.prediction !== undefined &&
          KaiOrchestrator.LLM_COMPONENT_IDS.has(r.componentId)
        ) {
          llmPredictions.push({ componentId: r.componentId, prediction: r.prediction });
        }
      }
    }

    if (llmPredictions.length < 2) {
      // Not enough LLMs to compute spread — no gate action
      // If there's exactly 1 LLM and it's not manually excluded, it influences VPS
      const singleLLMInfluence = llmPredictions.length === 1 && !this._excludeLLMsFromAggregate;
      this._llmSpread = 0;
      return { llmSpread: 0, llmDisagreement: false, llmInfluenceApplied: singleLLMInfluence, llmPredictions };
    }

    // 2. Compute spread
    const preds = llmPredictions.map(p => p.prediction);
    const llmSpread = Math.max(...preds) - Math.min(...preds);
    this._llmSpread = Math.round(llmSpread * 10) / 10;

    const llmDisagreement = llmSpread > KaiOrchestrator.LLM_SPREAD_THRESHOLD;

    console.log(`\n[Kai] ═══ LLM Consensus Gate ═══`);
    console.log(`[Kai]   LLM predictions: ${llmPredictions.map(p => `${p.componentId}=${p.prediction.toFixed(1)}`).join(', ')}`);
    console.log(`[Kai]   Spread: ${llmSpread.toFixed(1)} VPS (threshold: ${KaiOrchestrator.LLM_SPREAD_THRESHOLD})`);
    console.log(`[Kai]   Gate: ${llmDisagreement ? 'FIRED — LLM weight → 0' : `PASSED — LLM weight capped at ${KaiOrchestrator.LLM_CONSENSUS_WEIGHT_CAP}`}`);

    // 3. Recompute each path's aggregatedPrediction with the gate applied
    for (const path of pathResults) {
      if (!path.success) continue;

      const successfulResults = path.results.filter(r => {
        if (!r.success || r.prediction === undefined) return false;
        const defaultValues = [50, 62, 65, 68, 70];
        const isDefault = defaultValues.includes(Math.round(r.prediction));
        const hasRealAnalysis =
          (r.features && Object.keys(r.features).length > 0) ||
          (r.insights && r.insights.length > 0 && !r.insights[0]?.includes('No '));
        if (isDefault && !hasRealAnalysis) return false;
        return true;
      });

      if (successfulResults.length === 0) continue;

      let totalWeight = 0;
      let weightedSum = 0;
      let confidenceSum = 0;

      for (const result of successfulResults) {
        let weight = result.confidence || 0.5;
        const isLLM = KaiOrchestrator.LLM_COMPONENT_IDS.has(result.componentId);

        // Coach-lane components: never influence VPS regardless of consensus gate
        if (COACH_LANE_COMPONENT_IDS.has(result.componentId)) {
          weight = 0;
        } else if (this._excludeLLMsFromAggregate && isLLM) {
          // Manual exclusion flag takes priority
          weight = 0;
        } else if (isLLM) {
          if (llmDisagreement) {
            // Spread > threshold → zero weight
            weight = 0;
          } else {
            // Spread within threshold → cap weight instead of boosting
            weight = Math.min(weight, KaiOrchestrator.LLM_CONSENSUS_WEIGHT_CAP);
          }
        } else {
          // Non-LLM component: apply normal extreme-score boost
          const score = result.prediction || 50;
          if (score < 30 || score > 80) {
            weight *= 1.5;
          }
        }

        weightedSum += (result.prediction || 0) * weight;
        totalWeight += weight;
        confidenceSum += result.confidence || 0;
      }

      // FIX CCI-L3-002: When totalWeight=0 (all weights zeroed), set undefined — NOT stale pre-gate value
      path.aggregatedPrediction = totalWeight > 0 ? weightedSum / totalWeight : undefined;
      path.aggregatedConfidence = totalWeight > 0
        ? confidenceSum / successfulResults.length
        : undefined;

      console.log(`[Kai]   Path '${path.path}' re-aggregated: VPS=${path.aggregatedPrediction?.toFixed(1)}`);
    }

    // LLMs influence the VPS only when not disagreeing AND not manually excluded
    const llmInfluenceApplied = !llmDisagreement && !this._excludeLLMsFromAggregate;
    console.log(`[Kai]   llm_influence_applied: ${llmInfluenceApplied}`);
    console.log(`[Kai] ═════════════════════════\n`);

    return { llmSpread: this._llmSpread, llmDisagreement, llmInfluenceApplied, llmPredictions };
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

  private async performDisagreementReconciliation(
    pathResults: PathResult[],
    input: VideoInput
  ): Promise<{
    prediction: number;
    confidence: number;
    recommendations: string[];
  }> {
    console.log('  Performing disagreement reconciliation due to low agreement...');

    // When paths disagree significantly:
    // Weighted average using configured path weights — no artificial boosts

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
      const weight = path.weight;
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

  // NOTE: getViralPotential() (System 2) has been RETIRED per D4.
  // VPS tier labels now come from getVpsTier() in system-registry.ts (System 1).

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

    // NOTE: Component insights (result.insights) are NOT included here.
    // They contain diagnostic data (feature counts, coverage %, sub-scores)
    // that pollute the user-facing recommendations. Insights are available
    // in the component detail panels for debugging.

    // Deduplicate and limit
    return [...new Set(recommendations)].slice(0, 5);
  }

  // ==========================================================================
  // COMPONENT EXECUTION METHODS
  // ==========================================================================

  private async execute9Attributes(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    // CHECK INPUT: 9-attributes requires transcript for analysis
    const inputCheck = checkComponentInputs('9-attributes', input, ['transcript']);
    if (!inputCheck.shouldRun) {
      return {
        componentId: '9-attributes',
        success: false,
        error: inputCheck.skipReason,
        insights: ['Skipped: ' + inputCheck.skipReason],
        latency: Date.now() - startTime
      };
    }

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

      // DYNAMIC CONFIDENCE: Based on transcript length and attribute variance
      const transcriptLength = (input.transcript || '').length;
      const scoreVariance = Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s.score - analysis.totalScore / 10, 2), 0) / scores.length);
      
      // Higher confidence when:
      // - More transcript to analyze (length bonus)
      // - Scores are consistent (low variance = patterns are clear)
      const lengthBonus = Math.min(0.25, transcriptLength / 1000);
      const varianceBonus = Math.max(0, 0.2 - scoreVariance * 0.05); // Low variance = high confidence
      const dynamicConfidence = Math.min(0.9, 0.45 + lengthBonus + varianceBonus);

      return {
        componentId: '9-attributes',
        success: true,
        prediction: analysis.totalScore,
        confidence: dynamicConfidence,
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
          weakestAttribute: weakest.name,
          confidenceFactors: { lengthBonus, varianceBonus, transcriptLength }
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
      // Use pre-computed FFmpeg data if available (legacy path)
      if (input.ffmpegData) {
        const visualScore = this.calculateVisualScore(input.ffmpegData);
        return {
          componentId: 'ffmpeg',
          success: true,
          prediction: visualScore,
          confidence: 0.90,
          insights: [
            `Duration: ${input.ffmpegData.duration || input.ffmpegData.duration_seconds}s`,
            `Resolution: ${input.ffmpegData.width || input.ffmpegData.resolution_width}x${input.ffmpegData.height || input.ffmpegData.resolution_height}`,
            `FPS: ${input.ffmpegData.fps}`
          ],
          features: input.ffmpegData,
          latency: Date.now() - startTime
        };
      }

      // Analyze video file using canonical analyzer
      if (input.videoPath) {
        try {
          const { analyzeVideo } = await import('@/lib/services/ffmpeg-canonical-analyzer');
          const result = await analyzeVideo(input.videoPath, { timeout: 45000 });

          if (result.extraction_success) {
            const visualScore = this.calculateVisualScore(result);

            return {
              componentId: 'ffmpeg',
              success: true,
              prediction: visualScore,
              confidence: 0.90,
              insights: [
                `Duration: ${result.duration_seconds.toFixed(1)}s`,
                `Resolution: ${result.resolution_width}x${result.resolution_height}`,
                `FPS: ${result.fps.toFixed(1)}`,
                `Scenes: ${result.scene_changes}`,
                `Cuts/sec: ${result.cuts_per_second.toFixed(2)}`,
                `Brightness: ${result.brightness_avg.toFixed(2)}`,
                `Motion: ${result.avg_motion.toFixed(2)}`
              ],
              features: {
                duration: result.duration_seconds,
                width: result.resolution_width,
                height: result.resolution_height,
                fps: result.fps,
                bitrate: result.bitrate,
                hasAudio: result.has_audio,
                sceneChanges: result.scene_changes,
                cutsPerSecond: result.cuts_per_second,
                hookSceneChanges: result.hook_scene_changes,
                aspectRatio: result.aspect_ratio,
                isPortrait: result.resolution_height > result.resolution_width,
                isLandscape: result.resolution_width > result.resolution_height,
                isSquare: Math.abs(result.resolution_width - result.resolution_height) < 20,
                brightnessAvg: result.brightness_avg,
                contrastScore: result.contrast_score,
                colorVariance: result.color_variance,
                avgMotion: result.avg_motion,
              },
              latency: Date.now() - startTime
            };
          } else {
            return {
              componentId: 'ffmpeg',
              success: false,
              error: result.error || 'FFmpeg extraction failed',
              latency: Date.now() - startTime
            };
          }
        } catch (ffmpegError: any) {
          return {
            componentId: 'ffmpeg',
            success: false,
            error: `FFmpeg analysis error: ${ffmpegError.message}`,
            latency: Date.now() - startTime
          };
        }
      }

      // No FFmpeg data or video path available
      return {
        componentId: 'ffmpeg',
        success: false,
        error: 'No video file path provided for FFmpeg analysis',
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

  /**
   * Calculate visual score (0-100) from FFmpeg analysis.
   * Uses real features: scene density, brightness, contrast, color, motion.
   * Produces actual variance across different videos (FFM-003 fix).
   */
  private calculateVisualScore(ffmpegData: any): number {
    let score = 0;

    const duration = ffmpegData.duration || ffmpegData.duration_seconds || 0;
    const height = ffmpegData.height || ffmpegData.resolution_height || 0;
    const width = ffmpegData.width || ffmpegData.resolution_width || 0;
    const fps = ffmpegData.fps || 0;
    const hasAudio = ffmpegData.hasAudio ?? ffmpegData.has_audio ?? false;
    const sceneChanges = ffmpegData.sceneChanges ?? ffmpegData.scene_changes ?? 0;
    const cutsPerSecond = ffmpegData.cutsPerSecond ?? ffmpegData.cuts_per_second ?? 0;
    const brightness = ffmpegData.brightnessAvg ?? ffmpegData.brightness_avg ?? -1;
    const contrast = ffmpegData.contrastScore ?? ffmpegData.contrast_score ?? -1;
    const colorVariance = ffmpegData.colorVariance ?? ffmpegData.color_variance ?? -1;
    const motion = ffmpegData.avgMotion ?? ffmpegData.avg_motion ?? -1;

    // --- Technical baseline (max 25 points) ---
    // Duration: sweet spot 15-60s for TikTok
    if (duration >= 15 && duration <= 60) score += 10;
    else if (duration > 60 && duration <= 180) score += 6;
    else if (duration > 0) score += 3;

    // Resolution: 1080p+
    if (height >= 1080) score += 5;
    else if (height >= 720) score += 3;

    // FPS: 30+
    if (fps >= 30) score += 3;
    else if (fps >= 24) score += 2;

    // Portrait format for short-form
    if (height > width) score += 4;

    // Audio present
    if (hasAudio) score += 3;

    // --- Scene dynamics (max 30 points) ---
    // Cuts per second: 0.3-2.0 is ideal for engagement
    if (cutsPerSecond >= 0.5 && cutsPerSecond <= 2.0) score += 15;
    else if (cutsPerSecond >= 0.3 && cutsPerSecond < 0.5) score += 10;
    else if (cutsPerSecond > 2.0) score += 8; // Very fast can feel choppy
    else if (cutsPerSecond > 0 && cutsPerSecond < 0.3) score += 5;
    // 0 cuts = 0 points (static video)

    // Total scene changes (variety indicator)
    if (sceneChanges >= 10) score += 10;
    else if (sceneChanges >= 5) score += 7;
    else if (sceneChanges >= 2) score += 4;

    // Motion score (dynamic content)
    if (motion >= 0) {
      score += Math.round(motion * 5); // 0-5 points
    }

    // --- Visual quality (max 30 points, only when signalstats available) ---
    if (brightness >= 0) {
      // Brightness: optimal range 0.35-0.70 (well-lit but not blown out)
      if (brightness >= 0.35 && brightness <= 0.70) score += 10;
      else if (brightness >= 0.25 && brightness <= 0.80) score += 6;
      else score += 2;
    }

    if (contrast >= 0) {
      // Contrast: higher = more visual pop
      score += Math.round(Math.min(1, contrast) * 10); // 0-10 points
    }

    if (colorVariance >= 0) {
      // Color saturation: higher = more vibrant
      score += Math.round(Math.min(1, colorVariance) * 10); // 0-10 points
    }

    // Clamp to 0-100
    return Math.min(100, Math.max(0, score));
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

    // CHECK INPUT: 7-legos requires transcript for analysis
    const inputCheck = checkComponentInputs('7-legos', input, ['transcript']);
    if (!inputCheck.shouldRun) {
      return {
        componentId: '7-legos',
        success: false,
        error: inputCheck.skipReason,
        insights: ['Skipped: ' + inputCheck.skipReason],
        latency: Date.now() - startTime
      };
    }

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

      // DYNAMIC CONFIDENCE: Based on word count and lego analysis quality
      // More words = more content to analyze = higher confidence
      const wordBonus = Math.min(0.3, wordCount / 300);
      // Higher overall score indicates clearer patterns = higher confidence
      const scoreBonus = Math.min(0.2, (legos.overallScore - 40) / 200);
      const dynamicConfidence = Math.min(0.9, 0.4 + wordBonus + scoreBonus);

      return {
        componentId: '7-legos',
        success: true,
        prediction: legos.overallScore,
        confidence: dynamicConfidence,
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
          viralPatternMatch: legos.viralPatternMatch,
          wordCount,
          confidenceFactors: { wordBonus, scoreBonus }
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

  // [WSP-001] Dead executeWhisper() and transcribeVideoWithWhisper() removed (128 lines).
  // Real Whisper implementation: src/lib/services/whisper-service.ts
  // Called by: src/lib/services/transcription-pipeline.ts (runs BEFORE orchestrator)

  private async executeGPT4(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const transcript = input.transcript || '';
      const niche = input.niche || 'general';

      // Validate transcript
      if (!transcript || transcript.length < 20) {
        return {
          componentId: 'gpt4',
          success: false,
          error: 'Insufficient transcript for GPT-4 analysis (minimum 20 characters)',
          confidence: 0.3,
          latency: Date.now() - startTime
        };
      }

      // Check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        console.warn('[GPT-4] No OPENAI_API_KEY - using fallback heuristic');
        return this.executeGPT4Fallback(input, startTime);
      }

      // REAL OpenAI API call (matching training implementation)
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const hookText = transcript.split(/\s+/).slice(0, 15).join(' ');

      console.log('[GPT-4] Calling OpenAI API for viral analysis...');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Analyze this TikTok video transcript for viral potential in the ${niche} niche.

HOOK (first 3 seconds): "${hookText}"

FULL TRANSCRIPT:
"""
${transcript.substring(0, 2000)}
"""

Score each dimension from 0-100:
1. viral_probability: Overall likelihood this goes viral (based on hook, content, engagement triggers)
2. hook_effectiveness: How well does the hook grab attention and stop scrolling?
3. emotional_appeal: Does it trigger strong emotions (curiosity, surprise, desire, fear, joy)?
4. audience_match: How well does it resonate with the ${niche} audience?

Return ONLY valid JSON with these 4 numeric scores:
{"viral_probability": <0-100>, "hook_effectiveness": <0-100>, "emotional_appeal": <0-100>, "audience_match": <0-100>}`
        }],
        temperature: this.getTemperature(0.3),
        max_tokens: 100,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from GPT-4');
      }

      const result = JSON.parse(content);

      // Normalize scores to 0-100 range
      const viralProbability = Math.min(100, Math.max(0, result.viral_probability || 50));
      const hookEffectiveness = Math.min(100, Math.max(0, result.hook_effectiveness || 50));
      const emotionalAppeal = Math.min(100, Math.max(0, result.emotional_appeal || 50));
      const audienceMatch = Math.min(100, Math.max(0, result.audience_match || 50));

      // Calculate weighted prediction (viral_probability weighted highest)
      const prediction = Math.round(
        viralProbability * 0.4 +
        hookEffectiveness * 0.25 +
        emotionalAppeal * 0.2 +
        audienceMatch * 0.15
      );

      console.log(`[GPT-4] ✅ Analysis complete - Viral: ${viralProbability}, Hook: ${hookEffectiveness}, Emotion: ${emotionalAppeal}, Audience: ${audienceMatch}`);

      return {
        componentId: 'gpt4',
        success: true,
        prediction,
        confidence: 0.85,
        insights: [
          `Viral probability: ${viralProbability}/100`,
          `Hook effectiveness: ${hookEffectiveness}/100`,
          `Emotional appeal: ${emotionalAppeal}/100`,
          `Audience match: ${audienceMatch}/100`
        ],
        features: {
          viral_probability: viralProbability / 100,
          hook_effectiveness: hookEffectiveness / 100,
          emotional_appeal: emotionalAppeal / 100,
          audience_match: audienceMatch / 100
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('[GPT-4] ❌ Error:', error.message);
      return {
        componentId: 'gpt4',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Fallback heuristic when OpenAI API is unavailable
   * Only used when OPENAI_API_KEY is missing
   */
  private executeGPT4Fallback(input: VideoInput, startTime: number): ComponentResult {
    const transcript = input.transcript || '';
    let score = 55;

    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
    const avgSentenceLength = transcript.length / Math.max(1, sentences.length);

    if (avgSentenceLength >= 30 && avgSentenceLength <= 100) score += 10;

    const firstSentence = sentences[0]?.toLowerCase() || '';
    if (firstSentence.includes('?') || firstSentence.includes('you') || firstSentence.includes('this')) {
      score += 10;
    }

    const emotionalWords = ['love', 'hate', 'amazing', 'terrible', 'incredible', 'shocking', 'unbelievable'];
    const emotionalCount = emotionalWords.filter(w => transcript.toLowerCase().includes(w)).length;
    score += emotionalCount * 3;

    const valueWords = ['learn', 'how to', 'tip', 'hack', 'secret', 'strategy', 'method'];
    const valueCount = valueWords.filter(w => transcript.toLowerCase().includes(w)).length;
    score += valueCount * 4;

    return {
      componentId: 'gpt4',
      success: true,
      prediction: Math.min(100, score),
      confidence: 0.5, // Lower confidence for fallback
      insights: [
        '⚠️ Using fallback heuristic (no API key)',
        `Sentence structure: ${sentences.length} sentences`,
        `Emotional words: ${emotionalCount}`,
        `Value indicators: ${valueCount}`
      ],
      features: {
        viral_probability: score / 100,
        hook_effectiveness: 0.5,
        emotional_appeal: emotionalCount > 0 ? 0.6 : 0.4,
        audience_match: 0.5,
        is_fallback: true
      },
      latency: Date.now() - startTime
    };
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

      console.log('[Gemini] ✅ Analysis successful - VPS:', result.viralPotential);
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

  // executeDPSEngine — REMOVED (DPS v2 rollout). DPS is a post-hoc label, not a prediction component.

  private async executeFeatureExtraction(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Use FULL 152-feature extraction service
      const { extractUnifiedTrainingFeatures } = await import('@/lib/services/training/unified-training-features');
      
      const extractionInput = {
        video_id: input.videoId,
        transcript: input.transcript || '',
        title: input.title,
        description: input.description,
        hashtags: input.hashtags,
        duration_seconds: input.duration,
        video_path: input.videoPath,
        niche: input.niche,
      };

      const result = await extractUnifiedTrainingFeatures(extractionInput, {
        includeFFmpeg: !!input.videoPath,
        includeLLMScoring: true,
        includePatternFeatures: true,
        ffmpegTimeout: 30000,
        llmTimeout: 30000,
      });

      return {
        componentId: 'feature-extraction',
        success: true,
        prediction: undefined, // Feature extraction doesn't predict
        confidence: result.coverage,
        features: { 
          features: result.features, 
          featureCount: result.featureCount,
          coverage: result.coverage,
          groupsExtracted: result.groupsExtracted
        },
        insights: [
          `Extracted ${result.featureCount} features`,
          `Coverage: ${(result.coverage * 100).toFixed(1)}%`,
          result.groupsExtracted.textMetadata ? '✓ Text/Metadata' : '✗ Text/Metadata',
          result.groupsExtracted.ffmpeg ? '✓ FFmpeg' : '✗ FFmpeg',
          result.groupsExtracted.llm ? '✓ LLM Scores' : '✗ LLM Scores',
          result.groupsExtracted.pattern ? '✓ Patterns' : '✗ Patterns',
        ],
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('[feature-extraction] Error:', error.message);
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
    const config = getPredictionConfig();

    // CHECK INPUT: Pattern extraction requires transcript
    const inputCheck = checkComponentInputs('pattern-extraction', input, ['transcript']);
    if (!inputCheck.shouldRun) {
      return {
        componentId: 'pattern-extraction',
        success: false,
        error: inputCheck.skipReason,
        insights: ['Skipped: ' + inputCheck.skipReason],
        latency: Date.now() - startTime
      };
    }

    try {
      const transcript = input.transcript || '';
      const transcriptLower = transcript.toLowerCase();
      const transcriptLength = transcript.length;

      // ── Positional segmentation ──
      // First 25% = hook+setup (full weight), middle 50% = body (0.7x), last 25% = CTA region (0.5x, except cta-pattern gets 1.0x)
      const q1End = Math.floor(transcriptLength * 0.25);
      const q3Start = Math.floor(transcriptLength * 0.75);
      const hookSetup = transcriptLower.slice(0, q1End);
      const body = transcriptLower.slice(q1End, q3Start);
      const ctaRegion = transcriptLower.slice(q3Start);

      // ── Tightened pattern checks ──
      // hook-opening REMOVED — deduplicated, this is hook-scorer's job (Component 17)
      const patternChecks = [
        { name: 'story-arc',         regex: /(first.*then|but then|until.*finally|and then|turns out|plot twist)/i, points: 6, ctaWeight: 0.5 },
        { name: 'curiosity-gap',     regex: /(secret|hidden|nobody knows|most people don't|what if I told you|turns out|you won't believe)/i, points: 7, ctaWeight: 0.5 },
        { name: 'social-proof',      regex: /(millions of people|thousands of|went viral|trending on|famous for|everyone is doing)/i, points: 5, ctaWeight: 0.5 },
        { name: 'urgency',           regex: /(right now|do this today|hurry up|limited time|before it's too late|don't wait|act fast|last chance)/i, points: 6, ctaWeight: 0.5 },
        { name: 'value-promise',     regex: /(you'll learn|you'll discover|i'll show you|you'll get|how to .{5,}|transform your|here's how|the secret to)/i, points: 5, ctaWeight: 0.5 },
        { name: 'emotional-trigger', regex: /(I love|I hate|this is amazing|shocking|incredible|unbelievable|blew my mind|changed my life|game changer)/i, points: 7, ctaWeight: 0.5 },
        { name: 'cta-pattern',       regex: /(follow me|hit the like|share this|drop a comment|subscribe for|save this for|link in bio|let me know)/i, points: 4, ctaWeight: 1.0 },
        { name: 'contrast',          regex: /(but here's the thing|but wait|the truth is|however.*most people|instead of.*you should|what they tell you vs)/i, points: 5, ctaWeight: 0.5 },
        { name: 'list-format',       regex: /(number one|number two|tip \d|step \d|first thing|second thing|third thing|reason \d)/i, points: 5, ctaWeight: 0.5 },
      ];

      const patterns: string[] = [];
      let score = 30; // Base score: below average for zero-pattern transcripts

      for (const check of patternChecks) {
        // Check each positional zone and apply weight
        let bestWeight = 0;

        if (check.regex.test(hookSetup)) {
          bestWeight = 1.0; // Full weight in hook+setup
        }
        if (check.regex.test(body)) {
          bestWeight = Math.max(bestWeight, 0.7); // Body = 0.7x
        }
        if (check.regex.test(ctaRegion)) {
          bestWeight = Math.max(bestWeight, check.ctaWeight); // CTA region: 0.5x default, 1.0x for cta-pattern
        }

        if (bestWeight > 0) {
          patterns.push(check.name);
          score += Math.round(check.points * bestWeight);
        }
      }

      // ── Co-occurrence bonuses ──
      const hasPattern = (name: string) => patterns.includes(name);
      let coOccurrenceBonus = 0;
      const bonuses: string[] = [];

      if (hasPattern('curiosity-gap') && hasPattern('story-arc')) {
        coOccurrenceBonus += 5;
        bonuses.push('narrative-tension');
      }
      if (hasPattern('emotional-trigger') && hasPattern('urgency')) {
        coOccurrenceBonus += 4;
        bonuses.push('emotional-urgency');
      }
      if (hasPattern('social-proof') && hasPattern('value-promise')) {
        coOccurrenceBonus += 3;
        bonuses.push('authority-promise');
      }

      score += coOccurrenceBonus;

      // Cap at 85 (no single component should produce 100)
      const finalScore = Math.min(85, score);

      // DYNAMIC CONFIDENCE
      const patternCount = patterns.length;
      const patternConfBonus = Math.min(0.4, patternCount * 0.05);
      const lengthConfBonus = Math.min(0.2, transcriptLength / 1000);
      const dynamicConfidence = Math.min(0.9, 0.3 + patternConfBonus + lengthConfBonus);

      return {
        componentId: 'pattern-extraction',
        success: true,
        prediction: finalScore,
        confidence: dynamicConfidence,
        insights: [
          `Found ${patterns.length} viral patterns: ${patterns.join(', ')}`,
          ...(bonuses.length > 0 ? [`Co-occurrence bonuses: ${bonuses.join(', ')} (+${coOccurrenceBonus})`] : []),
          `Positional weighting applied (hook/setup=1.0x, body=0.7x, CTA=${patterns.includes('cta-pattern') ? '1.0x' : '0.5x'})`,
        ],
        features: {
          patterns,
          patternCount,
          transcriptLength,
          coOccurrenceBonuses: bonuses,
          coOccurrenceBonus,
          confidenceFactors: { patternBonus: patternConfBonus, lengthBonus: lengthConfBonus }
        },
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
      type HookInput = import('@/lib/components/hook-scorer').HookInput;

      // ── Build multi-modal HookInput from available signals ──

      const hookInput: HookInput = {
        transcript: input.transcript,
      };

      // Whisper segments for real first-3-second text extraction
      if (input.whisperSegments && input.whisperSegments.length > 0) {
        hookInput.whisperSegments = input.whisperSegments;
      }

      // Audio channel: extract from audio-analyzer Phase 1 results
      const audioResult = input.componentResults?.find(r => r.componentId === 'audio-analyzer' && r.success);
      if (audioResult?.features) {
        const f = audioResult.features;
        if (f.hookLoudness != null && f.hookSilenceRatio != null) {
          hookInput.audioHook = {
            hookLoudness: f.hookLoudness ?? 1.0,
            hookPitchMean: f.pitchMean != null ? (f.pitchMean > 0 ? 1.0 : 1.0) : 1.0, // pitchMean is absolute, use hookPitchMean if available
            hookSilenceRatio: f.hookSilenceRatio ?? 0.1,
          };
          // The prosodic hookPitchMean ratio is stored as a separate feature if available
          // audio-analyzer stores pitchContourSlope but not hookPitchMean ratio directly
          // We approximate from pitchContourSlope: positive slope = rising energy ≈ hookPitch > 1
          if (f.pitchContourSlope != null) {
            hookInput.audioHook.hookPitchMean = f.pitchContourSlope > 0 ? 1.0 + Math.min(0.3, f.pitchContourSlope * 0.1) : 1.0 - Math.min(0.2, Math.abs(f.pitchContourSlope) * 0.05);
          }
        }
      }

      // Visual channel: hook_scene_changes from ffmpeg canonical analyzer
      if (input.ffmpegData) {
        const hookSceneChanges = input.ffmpegData.hookSceneChanges ?? input.ffmpegData.hook_scene_changes;
        if (hookSceneChanges != null) {
          hookInput.visualHook = { hookSceneChanges };
        }
      }

      // Pace channel: from speaking rate data
      if (input.speakingRateData?.success) {
        hookInput.paceHook = {
          hookWpm: input.speakingRateData.hookWpm ?? 1.0,
          wpmAcceleration: input.speakingRateData.wpmAcceleration ?? 0,
        };
      }

      // Tone channel: musicRatio + energyLevel + pitchContourSlope
      if (audioResult?.features) {
        const f = audioResult.features;
        if (f.musicRatio != null || f.energyLevel != null) {
          hookInput.tone = {
            musicRatio: f.musicRatio ?? 0,
            energyLevel: f.energyLevel ?? 'medium',
            pitchContourSlope: f.pitchContourSlope ?? 0,
          };
        }
      }

      // ── Run multi-modal analysis ──
      const result = HookScorer.analyze(hookInput);

      if (!result.success) {
        return {
          componentId: 'hook-scorer',
          success: false,
          error: result.error || 'Hook analysis failed',
          latency: Date.now() - startTime
        };
      }

      // Convert hook score to VPS prediction
      const vpsPrediction = HookScorer.toPrediction(result);

      return {
        componentId: 'hook-scorer',
        success: true,
        prediction: vpsPrediction,
        confidence: result.hookConfidence,
        insights: result.insights,
        features: {
          hookType: result.hookType,
          hookCluster: result.hookCluster,
          hookScore: result.hookScore,
          hookText: result.hookText,
          channelsUsed: result.channelsUsed,
          // Channel sub-scores for training features
          textScore: result.channels.text.score,
          audioScore: result.channels.audio.score,
          visualScore: result.channels.visual.score,
          paceScore: result.channels.pace.score,
          toneScore: result.channels.tone.score,
          // Raw signals for debugging
          hookLoudness: result.channels.audio.hookLoudness,
          hookSceneChanges: result.channels.visual.hookSceneChanges,
          hookWpm: result.channels.pace.hookWpm,
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

  /**
   * Virality Indicator Engine
   * 
   * Proprietary 6-factor prediction algorithm that runs locally.
   * Predicts viral potential based on content features that CAUSE viral metrics.
   * Components: Retention (35%), Shareability (25%), Save Potential (15%),
   * Comment Catalyst (10%), Technical Quality (8%), Trend Alignment (7%)
   */
  private async executeViralityIndicator(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    // CHECK INPUT: Virality indicator works best with transcript or video data
    const inputCheck = checkComponentInputs('virality-indicator', input, ['either']);
    if (!inputCheck.shouldRun) {
      return {
        componentId: 'virality-indicator',
        success: false,
        error: inputCheck.skipReason,
        insights: ['Skipped: ' + inputCheck.skipReason],
        latency: Date.now() - startTime
      };
    }

    try {
      const { viralityIndicator } = await import('@/lib/services/virality-indicator');

      // Build input for virality indicator
      const viInput = {
        transcript: input.transcript || '',
        duration_seconds: (input as any).duration || 0,
        resolution: input.ffmpegData?.height,
        niche: input.niche,
        ffmpeg_data: input.ffmpegData ? {
          scene_changes: input.ffmpegData.sceneChanges || 0,
          avg_brightness: input.ffmpegData.avgBrightness || 50,
          has_faces: input.ffmpegData.hasFaces || false,
          audio_levels: input.ffmpegData.audioLevels || []
        } : undefined,
        metadata: {
          has_text_overlay: (input as any).hasTextOverlay || false,
          has_trending_audio: (input as any).hasTrendingAudio || false,
          posting_hour: (input as any).postingHour
        }
      };

      // Run analysis
      const result = await viralityIndicator.analyze(viInput);

      // Direct pass-through: indicator is already 0-100, same as VPS scale
      // VIR-004 fix: removed artificial floor/ceiling mapping (was: 25 + indicator * 0.70)
      const vpsPrediction = result.virality_indicator;

      return {
        componentId: 'virality-indicator',
        success: true,
        prediction: Math.round(vpsPrediction * 10) / 10,
        confidence: result.confidence,
        insights: [
          `Virality Indicator: ${result.virality_indicator?.toFixed(1) ?? '0.0'}/100 (${result.classification ?? 'unknown'})`,
          `Visual: ${result.breakdown?.visual?.toFixed(0) ?? 'N/A'}`,
          `Audio: ${result.breakdown?.audio?.toFixed(0) ?? 'N/A'}`,
          `Text: ${result.breakdown?.text?.toFixed(0) ?? 'N/A'}`,
          ...result.top_recommendations.slice(0, 2)
        ],
        features: {
          virality_indicator: result.virality_indicator,
          classification: result.classification,
          breakdown: result.breakdown,
          sub_scores: result.sub_scores,
          processing_time_ms: result.processing_time_ms
        },
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        componentId: 'virality-indicator',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Component 27: XGBoost Virality ML Predictor v7
   *
   * Uses the pre-computed XGBoost result passed via input.xgboostPrecomputed.
   * Feature extraction and inference happen in the pipeline BEFORE the orchestrator,
   * so this method just returns the pre-computed result as a ComponentResult.
   * If no pre-computed result is available, the component returns a skip.
   */
  private async executeXGBoostViralityML(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    // Use pre-computed result from pipeline (feature extraction already done)
    if (input.xgboostPrecomputed) {
      const xgb = input.xgboostPrecomputed;
      console.log(`[XGBoost-ML v7] Using pre-computed result: VPS=${xgb.vps}, features=${xgb.features_provided}/${xgb.features_total}`);

      return {
        componentId: 'xgboost-virality-ml',
        success: true,
        prediction: xgb.vps,
        confidence: 0.75, // Fixed confidence — model is one signal among many
        insights: [
          `Predicted VPS: ${xgb.vps}`,
          `Model: ${xgb.model_version}`,
          `Features used: ${xgb.features_provided}/${xgb.features_total}`,
          ...(xgb.missing_features.length > 0
            ? [`Missing: ${xgb.missing_features.length} features`]
            : []),
        ],
        features: {
          predicted_vps: xgb.vps,
          raw_prediction: xgb.raw_prediction,
          model_version: xgb.model_version,
          features_provided: xgb.features_provided,
          features_total: xgb.features_total,
          missing_features: xgb.missing_features,
        },
        latency: Date.now() - startTime,
      };
    }

    // No pre-computed result — skip (video file was not available in pipeline)
    return {
      componentId: 'xgboost-virality-ml',
      success: false,
      skipped: true,
      skipReason: 'No pre-computed XGBoost result (video file required)',
      error: 'XGBoost v7 requires video file — no pre-computed result available',
      latency: Date.now() - startTime,
    };
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

      // Attach speaking rate data from Whisper pipeline if available (Batch B)
      if (input.speakingRateData) {
        result.speakingRate = input.speakingRateData;
      }

      // Convert audio score to VPS prediction
      const vpsPrediction = AudioAnalyzer.toPrediction(result);

      return {
        componentId: 'audio-analyzer',
        success: true,
        prediction: vpsPrediction,
        confidence: result.audioScore / 10, // Normalize to 0-1
        insights: result.insights,
        features: {
          audioScore: result.audioScore,
          speakingPace: result.speakingPace,
          energyLevel: result.energyLevel,
          silenceRatio: result.silenceRatio,
          volumeVariance: result.volumeVariance,
          // Enhanced prosodic features (Batch B)
          ...(result.prosodic?.volumeDynamics ? {
            loudnessRange: result.prosodic.volumeDynamics.loudnessRange,
            loudnessVariance: result.prosodic.volumeDynamics.loudnessVariance,
            loudnessRateOfChange: result.prosodic.volumeDynamics.loudnessRateOfChange,
            hookLoudness: result.prosodic.volumeDynamics.hookLoudness,
          } : {}),
          ...(result.prosodic?.pitchAnalysis ? {
            pitchRange: result.prosodic.pitchAnalysis.pitchRange,
            pitchVariance: result.prosodic.pitchAnalysis.pitchVariance,
            pitchContourSlope: result.prosodic.pitchAnalysis.pitchContourSlope,
            pitchMean: result.prosodic.pitchAnalysis.pitchMean,
          } : {}),
          ...(result.prosodic?.silencePatterns ? {
            silencePattern: result.prosodic.silencePatterns.silencePattern,
            hookSilenceRatio: result.prosodic.silencePatterns.hookSilenceRatio,
          } : {}),
          // Speaking rate (attached from transcription pipeline via TASK 2)
          ...(result.speakingRate?.success ? {
            wpmMean: result.speakingRate.wpmMean,
            wpmVariance: result.speakingRate.wpmVariance,
            wpmAcceleration: result.speakingRate.wpmAcceleration,
            paceCategory: result.speakingRate.paceCategory,
          } : {}),
          // Sound profile (Batch B)
          ...(result.soundProfile ? {
            musicRatio: result.soundProfile.musicRatio,
            speechRatio: result.soundProfile.speechRatio,
            audioType: result.soundProfile.audioType,
            audioFingerprint: result.soundProfile.fingerprint,
          } : {}),
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

      // Convert visual score to VPS prediction
      const vpsPrediction = VisualSceneDetector.toPrediction(result);

      return {
        componentId: 'visual-scene-detector',
        success: true,
        prediction: vpsPrediction,
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

      const vpsPrediction = TrendTimingAnalyzer.toPrediction(result);

      return {
        componentId: 'trend-timing-analyzer',
        success: true,
        prediction: vpsPrediction,
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

      const vpsPrediction = ThumbnailAnalyzer.toPrediction(result);

      return {
        componentId: 'thumbnail-analyzer',
        success: true,
        prediction: vpsPrediction,
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

      const vpsPrediction = PostingTimeOptimizer.toPrediction(result);

      return {
        componentId: 'posting-time-optimizer',
        success: true,
        prediction: vpsPrediction,
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

      // Assign variant: deterministic (hash-based) in validation mode, random otherwise
      const variant = this.getABVariant();
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
      const abKai = new ABKaiIntegration(supabase);

      await abKai.recordVariantPrediction(
        test.test_id,
        variant,
        videoId,
        prediction
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

      // ── Gather multi-modal signals from Phase 1 results ──
      const overallWpm = input.speakingRateData?.overallWpm ?? null;
      const hookSceneChanges = input.ffmpegData?.hookSceneChanges ?? input.ffmpegData?.hook_scene_changes ?? null;
      const cutsPerSecond = input.ffmpegData?.cuts_per_second ?? input.ffmpegData?.cutsPerSecond ?? null;
      const hasSceneChanges = hookSceneChanges != null ? hookSceneChanges > 0 : (cutsPerSecond != null ? cutsPerSecond > 0.2 : null);

      // Audio features from Phase 1 audio-analyzer (available in Phase 2)
      const audioResult = input.componentResults?.find(r => r.componentId === 'audio-analyzer' && r.success);
      const musicRatio = audioResult?.features?.musicRatio ?? null;
      const speechRatio = audioResult?.features?.speechRatio ?? null;

      const questionMarkCount = (transcript.match(/\?/g) || []).length;
      const numberedStepCount = (transcript.match(/\b(?:step\s+\d|number\s+\d|#\d|\d\.\s)/gi) || []).length;

      // ── TIER 1: Deterministic keyword + structural classifier ──
      const scores: Array<{ id: string; name: string; score: number; matchedSignals: string[] }> = [];

      for (const style of VIDEO_STYLES_REGISTRY) {
        let score = 0;
        const matchedSignals: string[] = [];

        // Text signal matching (primary signal)
        for (const regex of style.textSignals) {
          const matches = transcript.match(new RegExp(regex.source, regex.flags + (regex.flags.includes('g') ? '' : 'g')));
          if (matches && matches.length > 0) {
            score += 0.2 + Math.min(0.2, (matches.length - 1) * 0.05);
            matchedSignals.push(`text:${regex.source.substring(0, 30)}`);
          }
        }

        // Structural hint matching (secondary signals)
        const hints = style.structuralHints;
        if (hints) {
          if (hints.minQuestionMarks != null && questionMarkCount >= hints.minQuestionMarks) {
            score += 0.15;
            matchedSignals.push(`questions:${questionMarkCount}`);
          }
          if (hints.minNumberedSteps != null && numberedStepCount >= hints.minNumberedSteps) {
            score += 0.15;
            matchedSignals.push(`steps:${numberedStepCount}`);
          }
          if (hints.expectsHighWpm && overallWpm != null && overallWpm > 150) {
            score += 0.1;
            matchedSignals.push(`highWpm:${Math.round(overallWpm)}`);
          }
          if (hints.expectsLowWpm && overallWpm != null && overallWpm < 100) {
            score += 0.1;
            matchedSignals.push(`lowWpm:${Math.round(overallWpm)}`);
          }
          if (hints.expectsSceneChanges && hasSceneChanges === true) {
            score += 0.1;
            matchedSignals.push('sceneChanges:yes');
          }
          if (hints.expectsNoSceneChanges && hasSceneChanges === false) {
            score += 0.1;
            matchedSignals.push('sceneChanges:no');
          }
          if (hints.expectsHighMusicRatio && musicRatio != null && musicRatio > 0.3) {
            score += 0.1;
            matchedSignals.push(`musicRatio:${musicRatio.toFixed(2)}`);
          }
          if (hints.expectsHighSpeechRatio && speechRatio != null && speechRatio > 0.6) {
            score += 0.1;
            matchedSignals.push(`speechRatio:${speechRatio.toFixed(2)}`);
          }
        }

        if (score > 0) {
          scores.push({ id: style.id, name: style.name, score: Math.min(1.0, score), matchedSignals });
        }
      }

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);

      const topMatch = scores[0];
      const secondMatch = scores[1];
      const tier1Confident = topMatch && topMatch.score > 0.7 && (!secondMatch || secondMatch.score < 0.5);
      const tier1Ambiguous = topMatch && secondMatch && Math.abs(topMatch.score - secondMatch.score) < 0.15;

      console.log(`[24-styles] Tier 1: top=${topMatch?.id}(${topMatch?.score.toFixed(2)}) second=${secondMatch?.id}(${secondMatch?.score.toFixed(2)}) confident=${tier1Confident} ambiguous=${tier1Ambiguous}`);

      // ── TIER 1 result: confident deterministic classification ──
      if (tier1Confident) {
        const executionScore = Math.round(topMatch.score * 100);
        return {
          componentId: '24-styles',
          success: true,
          prediction: executionScore,
          confidence: Math.min(0.9, topMatch.score),
          insights: [
            `Detected style: ${topMatch.name} (deterministic)`,
            `Execution quality: ${executionScore}/100`,
            `Matched signals: ${topMatch.matchedSignals.join(', ')}`
          ],
          features: {
            style: topMatch.id,
            styleName: topMatch.name,
            executionScore,
            classificationTier: 'deterministic',
            matchedSignals: topMatch.matchedSignals,
            candidateScores: scores.slice(0, 5).map(s => ({ id: s.id, score: s.score }))
          },
          latency: Date.now() - startTime
        };
      }

      // ── TIER 2: LLM refinement for ambiguous cases ──
      if (!process.env.OPENAI_API_KEY) {
        // No API key — return best deterministic guess
        const bestGuess = topMatch || { id: 'talking-head-explainer', name: 'Talking-Head Explainer', score: 0.3, matchedSignals: [] };
        return {
          componentId: '24-styles',
          success: true,
          prediction: Math.round(bestGuess.score * 100),
          confidence: Math.min(0.5, bestGuess.score),
          insights: [
            `Detected style: ${bestGuess.name} (deterministic, low confidence)`,
            `No OPENAI_API_KEY — LLM refinement skipped`
          ],
          features: {
            style: bestGuess.id,
            styleName: bestGuess.name,
            executionScore: Math.round(bestGuess.score * 100),
            classificationTier: 'deterministic-fallback',
            matchedSignals: bestGuess.matchedSignals,
            candidateScores: scores.slice(0, 5).map(s => ({ id: s.id, score: s.score }))
          },
          latency: Date.now() - startTime
        };
      }

      // Narrow candidates to top 5 (or all if fewer scored)
      const candidates = scores.slice(0, 5);
      const candidateIds = candidates.length > 0
        ? candidates.map(s => s.id)
        : VIDEO_STYLES_REGISTRY.map(s => s.id); // fallback: send all 24 if no Tier 1 matches

      const candidateList = candidateIds.join(', ');

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are an expert video content analyst. Classify this video transcript into ONE of these video styles:

${candidateList}

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
        temperature: this.getTemperature(0.3)
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      const matchedStyle = VIDEO_STYLES_REGISTRY.find(s => s.id === result.style);
      const executionScore = Math.max(0, Math.min(100, result.execution_score || 50));

      return {
        componentId: '24-styles',
        success: true,
        prediction: executionScore,
        confidence: result.confidence || 0.6,
        insights: [
          `Detected style: ${matchedStyle?.name || result.style} (LLM-refined)`,
          `Execution quality: ${executionScore}/100`,
          result.reasoning || ''
        ].filter(Boolean),
        features: {
          style: result.style,
          styleName: matchedStyle?.name,
          executionScore,
          classificationTier: 'llm-refined',
          indicators: result.style_indicators || [],
          tier1Candidates: candidates.map(s => ({ id: s.id, score: s.score }))
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
  // VIRALITY-MATRIX COMPONENT (ALIGNED WITH TRAINING - 9 DIMENSION SCORING)
  // Uses ViralityMatrix class from src/lib/components/virality-matrix.ts
  // ==========================================================================

  private async executeViralityMatrix(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      // Import the ViralityMatrix component class
      const { ViralityMatrix } = await import('@/lib/components/virality-matrix');

      const transcript = input.transcript || '';
      const duration = input.ffmpegData?.duration || 30;
      const niche = input.niche || 'general';

      // Call the production component (aligned with training)
      const result = await ViralityMatrix.analyze({
        transcript,
        duration,
        niche
      });

      if (!result.success) {
        return {
          componentId: 'virality-matrix',
          success: false,
          error: result.error || 'Virality matrix analysis failed',
          confidence: 0.3,
          latency: result.latency || (Date.now() - startTime)
        };
      }

      // Convert overall score (0-1) to VPS prediction (0-100)
      const prediction = Math.round(result.vm_overall * 100);

      console.log(`[virality-matrix] ✅ 9-dimension analysis complete - Overall: ${prediction}/100`);

      return {
        componentId: 'virality-matrix',
        success: true,
        prediction,
        confidence: 0.8,
        insights: result.insights,
        features: {
          // All 10 features aligned with training extraction
          vm_overall: result.vm_overall,
          vm_hook_strength: result.vm_hook_strength,
          vm_emotional_resonance: result.vm_emotional_resonance,
          vm_value_density: result.vm_value_density,
          vm_shareability: result.vm_shareability,
          vm_trend_alignment: result.vm_trend_alignment,
          vm_pacing_retention: result.vm_pacing_retention,
          vm_authenticity: result.vm_authenticity,
          vm_controversy: result.vm_controversy,
          vm_cta_strength: result.vm_cta_strength
        },
        latency: result.latency || (Date.now() - startTime)
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
      const AnthropicModule = await import('@anthropic-ai/sdk');
      const Anthropic = AnthropicModule.default || AnthropicModule.Anthropic;
      if (!Anthropic) {
        return {
          componentId: 'claude',
          success: false,
          error: 'Failed to load Anthropic SDK',
          latency: Date.now() - startTime
        };
      }
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        temperature: this.getTemperature(0.3),
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
   * Execute Pack 1: Unified Grading Rubric
   * Generates 9 attribute scores, 7 idea legos, hook analysis, and dimension scores
   */
  private async executeUnifiedGrading(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { runUnifiedGrading, computeAverageAttributeScore } =
        await import('@/lib/rubric-engine');

      const transcript = input.transcript || '';
      if (!transcript || transcript.length < 10) {
        return {
          componentId: 'unified-grading',
          success: false,
          error: 'Transcript required for unified grading (min 10 chars)',
          latency: Date.now() - startTime
        };
      }

      // Check if API key is available
      const hasApiKey = !!(process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY);

      if (!hasApiKey) {
        console.log('[unified-grading] No AI API key configured (checked GOOGLE_GEMINI_AI_API_KEY and GOOGLE_AI_API_KEY)');
        return {
          componentId: 'unified-grading',
          success: false,
          error: 'Pack 1 unavailable - no AI API key configured',
          latency: Date.now() - startTime
        };
      }

      const result = await runUnifiedGrading({
        transcript,
        niche: input.niche,
        goal: input.goal
      }, {
        temperature: this._deterministic ? 0 : undefined,
      });

      if (!result.success || !result.result) {
        return {
          componentId: 'unified-grading',
          success: false,
          error: result.error || 'Unified grading failed',
          latency: Date.now() - startTime
        };
      }

      // Compute aggregate score from attributes
      const avgScore = computeAverageAttributeScore(result.result.attribute_scores);
      const vpsEstimate = avgScore * 10; // Convert 1-10 to 10-100 scale

      return {
        componentId: 'unified-grading',
        success: true,
        prediction: vpsEstimate,
        confidence: result.result.grader_confidence,
        features: { ...result.result, _meta: result._meta }, // Attach _meta (same pattern as Pack 2)
        insights: result.result.warnings,
        latency: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('[unified-grading] Error:', error);
      return {
        componentId: 'unified-grading',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Pack 2: Editing Coach
   * Generates top 3 improvement suggestions with estimated lift
   * REQUIRES: unified-grading result from prior execution
   */
  private async executeEditingCoach(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { runEditingCoach, generateRuleBasedSuggestions } =
        await import('@/lib/rubric-engine');

      // Get unified-grading result from input (passed via features or componentResults)
      const rubricResult = input.componentResults?.find(r => r.componentId === 'unified-grading');

      if (!rubricResult?.success || !rubricResult.features) {
        return {
          componentId: 'editing-coach',
          success: false,
          error: 'Editing Coach requires unified-grading result (run unified-grading first)',
          latency: Date.now() - startTime
        };
      }

      const rubric = rubricResult.features;
      const predictedScore = rubricResult.prediction || 50;

      // Check if Google AI API key is available for LLM-powered coaching
      const hasApiKey = !!(process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY);

      if (hasApiKey) {
        // LLM-powered editing coach
        console.log('[editing-coach] API key found, running LLM-powered coach');
        const execResult = await runEditingCoach({
          rubric: rubric as any,
          predicted_score: predictedScore,
          confidence: rubricResult.confidence || 0.5,
          creator_context: input.creatorContext || undefined,
        });

        if (execResult.success && execResult.result) {
          // Attach _meta from runner onto the result
          const result = { ...execResult.result, _meta: execResult._meta };
          return {
            componentId: 'editing-coach',
            success: true,
            prediction: result.predicted_after_estimate,
            confidence: 0.85,
            features: result,
            insights: [result.notes],
            latency: Date.now() - startTime
          };
        }

        // LLM call failed — fall through to rule-based fallback
        console.log('[editing-coach] LLM call failed, falling back to rule-based:', execResult.error);
      }

      // Rule-based fallback (no API key or LLM call failed)
      console.log('[editing-coach] Using rule-based suggestions (no API key or LLM fallback)');
      const suggestions = generateRuleBasedSuggestions(rubric, predictedScore, input.creatorContext);
      // Override _meta to indicate this is a fallback, not a real LLM result
      suggestions._meta = {
        source: 'real',
        provider: 'rule-based-fallback',
        latency_ms: Date.now() - startTime,
      };

      return {
        componentId: 'editing-coach',
        success: true,
        prediction: suggestions.predicted_after_estimate,
        confidence: 0.75,
        features: suggestions,
        insights: [suggestions.notes],
        latency: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('[editing-coach] Error:', error);
      return {
        componentId: 'editing-coach',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Pack V: Visual Rubric
   * Visual-only analysis that runs even when transcript is missing.
   * Uses FFmpeg-derived signals and existing component outputs.
   * DOES NOT require transcript.
   */
  private async executeVisualRubric(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { runVisualRubric, createVisualRubricStub } = await import('@/lib/rubric-engine');

      // Build input from available component results and input data
      const componentResults = input.componentResults || [];

      // ═══════════════════════════════════════════════════════════════════════
      // DEBUG: Log available component results for Pack V input mapping
      // ═══════════════════════════════════════════════════════════════════════
      console.log('[visual-rubric] ═══════════════════════════════════════════════════════════');
      console.log('[visual-rubric] DEBUG: Input mapping for Pack V');
      console.log(`[visual-rubric]   componentResults count: ${componentResults.length}`);
      console.log(`[visual-rubric]   componentResults IDs: ${componentResults.map(r => r.componentId).join(', ') || 'NONE'}`);
      console.log(`[visual-rubric]   input.ffmpegData present: ${!!input.ffmpegData}`);

      // Extract FFmpeg features and MAP to Pack V expected format
      const ffmpegResult = componentResults.find(r => r.componentId === 'ffmpeg');
      const rawFFmpegFeatures = ffmpegResult?.features || input.ffmpegData;
      const ffmpegFeatures = rawFFmpegFeatures ? {
        // Map component output -> Pack V expected input
        duration_seconds: rawFFmpegFeatures.duration,
        fps: rawFFmpegFeatures.fps,
        resolution: rawFFmpegFeatures.width && rawFFmpegFeatures.height ? {
          width: rawFFmpegFeatures.width,
          height: rawFFmpegFeatures.height
        } : undefined,
        scene_count: rawFFmpegFeatures.sceneChanges ?? rawFFmpegFeatures.scene_changes,
        motion_intensity: rawFFmpegFeatures.cutsPerSecond ?? rawFFmpegFeatures.cuts_per_second, // Use cuts/sec as motion proxy
        brightness_avg: rawFFmpegFeatures.brightnessAvg ?? rawFFmpegFeatures.brightness_avg,
        contrast_ratio: rawFFmpegFeatures.contrastRatio ?? rawFFmpegFeatures.contrast_ratio,
      } : undefined;
      console.log(`[visual-rubric]   ffmpegResult found: ${!!ffmpegResult}, features: ${ffmpegFeatures ? Object.keys(ffmpegFeatures).filter(k => (ffmpegFeatures as any)[k] !== undefined).length + ' keys' : 'NONE'}`);

      // Extract style features from 24-styles and MAP to Pack V expected format
      const styleResult = componentResults.find(r => r.componentId === '24-styles');
      const rawStyleFeatures = styleResult?.features;
      const styleFeatures = rawStyleFeatures ? {
        // Map component output -> Pack V expected input
        detected_style: rawStyleFeatures.detectedStyle ?? rawStyleFeatures.detected_style ?? rawStyleFeatures.style,
        style_confidence: rawStyleFeatures.styleConfidence ?? rawStyleFeatures.style_confidence ?? rawStyleFeatures.confidence,
        visual_elements: rawStyleFeatures.visualElements ?? rawStyleFeatures.visual_elements ?? rawStyleFeatures.elements,
      } : undefined;
      console.log(`[visual-rubric]   24-styles found: ${!!styleResult}, features: ${styleFeatures ? Object.keys(styleFeatures).filter(k => (styleFeatures as any)[k] !== undefined).length + ' keys' : 'NONE'}`);

      // Extract thumbnail features and MAP to Pack V expected format
      const thumbnailResult = componentResults.find(r => r.componentId === 'thumbnail-analyzer');
      const rawThumbFeatures = thumbnailResult?.features;
      const thumbnailFeatures = rawThumbFeatures ? {
        // Map component output -> Pack V expected input
        thumbnail_score: rawThumbFeatures.overallScore ? rawThumbFeatures.overallScore * 10 : undefined, // 0-10 -> 0-100
        has_face: rawThumbFeatures.hasFace,
        has_text: rawThumbFeatures.hasText,
        color_vibrancy: rawThumbFeatures.colorfulness ? rawThumbFeatures.colorfulness / 100 : undefined, // 0-100 -> 0-1
        composition_score: rawThumbFeatures.compositionScore ? rawThumbFeatures.compositionScore * 10 : undefined, // 0-10 -> 0-100
      } : undefined;
      console.log(`[visual-rubric]   thumbnail-analyzer found: ${!!thumbnailResult}, features: ${thumbnailFeatures ? Object.keys(thumbnailFeatures).filter(k => thumbnailFeatures[k] !== undefined).length + ' keys' : 'NONE'}`);

      // Extract scene features and MAP to Pack V expected format
      const sceneResult = componentResults.find(r => r.componentId === 'visual-scene-detector');
      const rawSceneFeatures = sceneResult?.features;
      const sceneFeatures = rawSceneFeatures ? {
        // Map component output -> Pack V expected input (VSD-001 fix)
        scene_transitions: rawSceneFeatures.sceneChanges,
        avg_shot_length: rawSceneFeatures.cutsPerSecond > 0 ? 1 / rawSceneFeatures.cutsPerSecond : undefined,
        visual_variety: undefined, // Component does not emit this
        dominant_colors: undefined, // Component does not emit this
      } : undefined;
      console.log(`[visual-rubric]   visual-scene-detector found: ${!!sceneResult}, features: ${sceneFeatures ? Object.keys(sceneFeatures).filter(k => sceneFeatures[k] !== undefined).length + ' keys' : 'NONE'}`);

      // Extract audio features and MAP to Pack V expected format (enhanced Batch B)
      const audioResult = componentResults.find(r => r.componentId === 'audio-analyzer');
      const rawAudioFeatures = audioResult?.features;
      const audioFeatures = rawAudioFeatures ? {
        // Map component output -> Pack V expected input
        // Use richer prosodic data when available (Batch B)
        has_music: rawAudioFeatures.musicRatio !== undefined
          ? rawAudioFeatures.musicRatio > 0.3
          : (rawAudioFeatures.energyLevel === 'high' || rawAudioFeatures.energyLevel === 'medium'),
        beat_aligned: rawAudioFeatures.silencePattern !== undefined
          ? rawAudioFeatures.silencePattern === 'rhythmic'
          : (rawAudioFeatures.silenceRatio !== undefined ? rawAudioFeatures.silenceRatio < 0.3 : undefined),
        audio_visual_sync: rawAudioFeatures.loudnessRateOfChange !== undefined
          ? rawAudioFeatures.loudnessRateOfChange
          : (rawAudioFeatures.volumeVariance !== undefined ? 1 - rawAudioFeatures.volumeVariance : undefined),
        // Raw audio features
        audio_score: rawAudioFeatures.audioScore,
        energy_level: rawAudioFeatures.energyLevel,
        silence_ratio: rawAudioFeatures.silenceRatio,
        speaking_pace: rawAudioFeatures.speakingPace,
        // New prosodic fields for Pack V (Batch B)
        pitch_variance: rawAudioFeatures.pitchVariance,
        speaking_rate_variance: rawAudioFeatures.wpmVariance,
        volume_dynamics_score: rawAudioFeatures.loudnessVariance,
      } : undefined;
      console.log(`[visual-rubric]   audio-analyzer found: ${!!audioResult}, features: ${audioFeatures ? Object.keys(audioFeatures).filter(k => audioFeatures[k] !== undefined).length + ' keys' : 'NONE'}`);

      // Extract hook features (may be partial without transcript)
      const hookResult = componentResults.find(r => r.componentId === 'hook-scorer');
      const rawHookFeatures = hookResult?.features;
      const hookFeatures = rawHookFeatures ? {
        // Map component output -> Pack V expected input
        hook_visual_score: rawHookFeatures.hookVisualScore ?? rawHookFeatures.hook_visual_score,
        opening_frame_quality: rawHookFeatures.openingFrameQuality ?? rawHookFeatures.opening_frame_quality,
      } : undefined;
      console.log(`[visual-rubric]   hook-scorer found: ${!!hookResult}, features: ${hookFeatures ? Object.keys(hookFeatures).filter(k => hookFeatures[k] !== undefined).length + ' keys' : 'NONE'}`);

      // Check if we have any visual data to work with
      const hasAnyVisualData = ffmpegFeatures || styleFeatures || thumbnailFeatures ||
                               sceneFeatures || audioFeatures || hookFeatures;
      console.log(`[visual-rubric]   hasAnyVisualData: ${hasAnyVisualData}`);
      console.log('[visual-rubric] ═══════════════════════════════════════════════════════════');

      if (!hasAnyVisualData) {
        console.log('[visual-rubric] No visual component data available, returning stub');
        const stub = createVisualRubricStub();
        return {
          componentId: 'visual-rubric',
          success: true,
          prediction: stub.overall_visual_score,
          confidence: 0.3,
          features: stub,
          insights: ['No visual data available - using default scores'],
          latency: Date.now() - startTime
        };
      }

      // Run visual rubric analysis
      const result = await runVisualRubric({
        videoId: input.videoId,
        videoPath: input.videoPath,
        ffmpegFeatures,
        styleFeatures,
        thumbnailFeatures,
        sceneFeatures,
        audioFeatures,
        hookFeatures,
        niche: input.niche
      });

      console.log(`[visual-rubric] Analysis complete: overall=${result.overall_visual_score}/100`);

      // PV-006 fix: Dynamic confidence based on upstream signal availability
      let confidence = 0.3; // base: minimal data
      if (input.videoPath) confidence += 0.25; // video file → Gemini Vision can analyze
      if (ffmpegFeatures && Object.keys(ffmpegFeatures).length > 3) confidence += 0.15; // rich FFmpeg data
      if (audioFeatures) confidence += 0.10; // audio analysis available
      if (sceneFeatures) confidence += 0.10; // scene detection available
      if (thumbnailFeatures) confidence += 0.05; // thumbnail analysis available
      if (hookFeatures) confidence += 0.05; // hook scorer data available
      confidence = Math.min(confidence, 0.95);

      return {
        componentId: 'visual-rubric',
        success: true,
        prediction: result.overall_visual_score,
        confidence,
        features: result,
        insights: [
          `Visual hook: ${result.visual_hook_score.score}/10`,
          `Pacing: ${result.pacing_score.score}/10`,
          `Pattern interrupts: ${result.pattern_interrupts_score.score}/10`
        ],
        latency: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('[visual-rubric] Error:', error);
      return {
        componentId: 'visual-rubric',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Pack 3: Viral Mechanics
   * Rule-based analysis that synthesizes all available signals to explain
   * WHY the model believes the video will perform well.
   * Runs LAST in the dependent component chain.
   */
  private async executeViralMechanics(input: VideoInput): Promise<ComponentResult> {
    const startTime = Date.now();

    try {
      const { runViralMechanics } = await import('@/lib/rubric-engine');

      // Get component results (includes Pack 1, Pack 2, Pack V from prior execution)
      const componentResults = input.componentResults || [];

      console.log('[viral-mechanics] ═══════════════════════════════════════════════════════════');
      console.log('[viral-mechanics] DEBUG: Input mapping for Pack 3');
      console.log(`[viral-mechanics]   componentResults count: ${componentResults.length}`);
      console.log(`[viral-mechanics]   componentResults IDs: ${componentResults.map(r => r.componentId).join(', ') || 'NONE'}`);

      // Extract Pack 1, Pack 2, Pack V results
      const pack1Result = componentResults.find(r => r.componentId === 'unified-grading');
      const pack2Result = componentResults.find(r => r.componentId === 'editing-coach');
      const packVResult = componentResults.find(r => r.componentId === 'visual-rubric');

      console.log(`[viral-mechanics]   Pack 1 present: ${!!pack1Result?.features}`);
      console.log(`[viral-mechanics]   Pack 2 present: ${!!pack2Result?.features}`);
      console.log(`[viral-mechanics]   Pack V present: ${!!packVResult?.features}`);

      // Check for transcript
      const hasTranscript = !!(input.transcript && input.transcript.trim().length >= 10);
      const transcriptLength = input.transcript?.trim().length || 0;

      // Extract detected style from 24-styles
      const styleResult = componentResults.find(r => r.componentId === '24-styles');
      const detectedStyle = styleResult?.features?.detected_style ||
                           styleResult?.features?.detectedStyle ||
                           styleResult?.features?.style;

      console.log(`[viral-mechanics]   hasTranscript: ${hasTranscript} (${transcriptLength} chars)`);
      console.log(`[viral-mechanics]   detectedStyle: ${detectedStyle || 'none'}`);
      console.log(`[viral-mechanics]   niche: ${input.niche || 'none'}`);
      console.log('[viral-mechanics] ═══════════════════════════════════════════════════════════');

      // Build Pack 3 input
      const pack3Input = {
        pack1: pack1Result?.features || null,
        pack2: pack2Result?.features || null,
        packV: packVResult?.features || null,
        componentResults: componentResults.map(r => ({
          componentId: r.componentId,
          success: r.success,
          prediction: r.prediction,
          confidence: r.confidence,
          features: r.features,
          insights: r.insights,
        })),
        hasTranscript,
        transcriptLength,
        niche: input.niche,
        detectedStyle,
      };

      // Run viral mechanics analysis
      const execResult = runViralMechanics(pack3Input);

      if (!execResult.success || !execResult.result) {
        console.log('[viral-mechanics] Analysis failed:', execResult.error);
        return {
          componentId: 'viral-mechanics',
          success: false,
          error: execResult.error || 'Unknown error',
          latency: Date.now() - startTime
        };
      }

      const result = execResult.result;

      console.log(`[viral-mechanics] ✓ Analysis complete: ${result.mechanics.length} mechanics, confidence: ${result.confidence}`);
      console.log(`[viral-mechanics]   Top mechanic: ${result.mechanics[0]?.name || 'none'} (${result.mechanics[0]?.strength || 0}/100)`);
      console.log(`[viral-mechanics]   Limited signal mode: ${result.limited_signal_mode}`);

      // VPS should reflect content quality via mechanic strengths, not signal availability
      // PM-001 fix: replaced `confidence * 100` (always 80-95) with mechanic-strength-based formula
      const mechanics = result.mechanics || [];
      const avgStrength = mechanics.length > 0
        ? mechanics.reduce((sum: number, m: any) => sum + m.strength, 0) / mechanics.length
        : 30;
      // If fewer than 2 mechanics detected, cap VPS at 40 (insufficient evidence for high score)
      const mechanicVps = mechanics.length >= 2 ? avgStrength : Math.min(avgStrength, 40);

      return {
        componentId: 'viral-mechanics',
        success: true,
        prediction: Math.round(mechanicVps * 10) / 10,
        confidence: result.confidence, // confidence stays for metadata (signal availability)
        features: result, // Store full Pack 3 result
        insights: [
          result.summary,
          ...result.mechanics.map(m => `${m.name}: ${m.strength}/100`)
        ],
        latency: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('[viral-mechanics] Error:', error);
      return {
        componentId: 'viral-mechanics',
        success: false,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }
}

// Export singleton instance
export const kai = new KaiOrchestrator();

export default KaiOrchestrator;
