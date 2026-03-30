/**
 * Workflow Types
 *
 * TypeScript types matching the database schema for workflow persistence.
 * Used by useWorkflowPersistence hook and workflow API routes.
 */

// Workflow run status
export type WorkflowStatus = 'active' | 'completed' | 'abandoned';

// Phase names
export type WorkflowPhase = 'research' | 'plan' | 'create' | 'optimize' | 'publish' | 'engage';
export type WorkflowPhaseNumber = 1 | 2 | 3 | 4 | 5 | 6;

// Phase step status
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

// Main workflow record
export interface WorkflowRun {
  id: string;
  user_id: string;
  workflow_type: string;
  status: WorkflowStatus;
  current_phase: WorkflowPhaseNumber;
  started_at: string;
  completed_at: string | null;
  metadata: WorkflowMetadata;
}

// Workflow metadata stored in JSONB
export interface WorkflowMetadata {
  title?: string;
  niche?: string;
  target_audience?: {
    age: string;
    interests: string[];
    pain_points: string[];
  };
}

// Individual phase step
export interface WorkflowStep {
  id: string;
  workflow_run_id: string;
  phase_number: WorkflowPhaseNumber;
  phase_name: string;
  status: StepStatus;
  started_at: string | null;
  completed_at: string | null;
  last_edited_at: string | null;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  gate_check_results: GateCheckResults | null;
}

// Gate check results for Optimize phase
export interface GateCheckResults {
  hook_effectiveness: boolean;
  proof_quality: boolean;
  cta_alignment: boolean;
  warnings: string[];
}

// Artifact types
export type ArtifactType =
  | 'script'
  | 'hook_options'
  | 'thumbnail'
  | 'prediction_result'
  | 'optimized_content'
  | 'beat_sheet';

export interface WorkflowArtifact {
  id: string;
  workflow_run_id: string;
  step_id: string | null;
  artifact_type: ArtifactType;
  artifact_data: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

// Creator data structure (matches existing state in studio/page.tsx)
export interface CreatorData {
  // Research Phase
  niche: string;
  targetAudience: {
    age: string;
    interests: string[];
    painPoints: string[];
  };
  goals: {
    kpis: string[];
    timeline: string;
  };
  exemplarSwoop: unknown[];
  topicShortlist: string[];
  // Plan Phase
  seoStrategy: {
    primaryTerms: string;
    alternateTerms: string;
    hashtags: string[];
  };
  goldenPillars: string[];
  contentGoals: {
    primary: string;
    secondary: string;
  };
  beatSheet: Array<{
    hook: string;
    proofPoint: string;
    valueProposition: string;
    callToAction: string;
  }>;
  // Create Phase
  videoDetails: {
    title: string;
    description: string;
    duration: string;
  };
  recordingSetup: {
    cameraPosition: string;
    lighting: string;
    background: string;
  };
  proofAssets: string[];
  // Optimize Phase
  optimizationScore: number;
  gateAChecks: {
    hookEffectiveness: boolean;
    proofQuality: boolean;
    ctaAlignment: boolean;
  };
  aiRecommendations: string[];
  // Publish Phase
  scheduledTime: string;
  platforms: string[];
  publishingChecklist: {
    thumbnail: boolean;
    captions: boolean;
    hashtags: boolean;
  };
  // Engage Phase
  performanceMetrics: {
    views: number;
    engagement: number;
    avgWatchTime: string;
  };
  abTestResults: unknown[];
  contentInsights: string[];
}

// Phase to number mapping
export const PHASE_NUMBER_MAP: Record<WorkflowPhase, WorkflowPhaseNumber> = {
  research: 1,
  plan: 2,
  create: 3,
  optimize: 4,
  publish: 5,
  engage: 6,
};

export const NUMBER_PHASE_MAP: Record<WorkflowPhaseNumber, WorkflowPhase> = {
  1: 'research',
  2: 'plan',
  3: 'create',
  4: 'optimize',
  5: 'publish',
  6: 'engage',
};

// Helper to get initial empty CreatorData
export function getEmptyCreatorData(): CreatorData {
  return {
    niche: '',
    targetAudience: { age: '', interests: [], painPoints: [] },
    goals: { kpis: [], timeline: '' },
    exemplarSwoop: [],
    topicShortlist: [],
    seoStrategy: { primaryTerms: '', alternateTerms: '', hashtags: [] },
    goldenPillars: [],
    contentGoals: { primary: '', secondary: '' },
    beatSheet: [],
    videoDetails: { title: '', description: '', duration: '' },
    recordingSetup: { cameraPosition: '', lighting: '', background: '' },
    proofAssets: [],
    optimizationScore: 0,
    gateAChecks: { hookEffectiveness: false, proofQuality: false, ctaAlignment: false },
    aiRecommendations: [],
    scheduledTime: '',
    platforms: [],
    publishingChecklist: { thumbnail: false, captions: false, hashtags: false },
    performanceMetrics: { views: 0, engagement: 0, avgWatchTime: '' },
    abTestResults: [],
    contentInsights: [],
  };
}
