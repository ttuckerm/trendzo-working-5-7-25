/**
 * Workflow 3: Quick Win (Streamlined 3-10 Step Workflow)
 * 
 * Fast path to viral content creation using template modeling.
 * "Start your quick win" → Select template → Generate script → Create video
 */

import type {
  Niche,
  ViralTemplate,
  ContentBeat,
  Platform,
} from './shared-components';

// =============================================================================
// WORKFLOW 3 PHASES
// =============================================================================

export const WORKFLOW_3_PHASES = [
  'select',
  'generate',
  'create',
] as const;

export type Workflow3Phase = typeof WORKFLOW_3_PHASES[number];
export type Workflow3PhaseNumber = 1 | 2 | 3;

export const PHASE_3_TO_NUMBER: Record<Workflow3Phase, Workflow3PhaseNumber> = {
  select: 1,
  generate: 2,
  create: 3,
};

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

export interface Workflow3StepSpec {
  id: string;
  phase: Workflow3Phase;
  phaseNumber: Workflow3PhaseNumber;
  stepNumber: number;
  name: string;
  description: string;
  userAction: string;
  acceptedInput: string[];
  systemAction: string;
  apiEndpoint?: string;
  successState: string;
  errorStates: string[];
  targetTime?: string;
  dataPersisted: string;
  dependsOn: string[];
}

// =============================================================================
// PHASE 1: SELECT (Steps 1.1 - 1.3)
// =============================================================================

export const SELECT_STEPS: Workflow3StepSpec[] = [
  {
    id: 'qw_step_1_1',
    phase: 'select',
    phaseNumber: 1,
    stepNumber: 1,
    name: 'Start Quick Win',
    description: 'System automatically selects 3 best viral templates based on user niche',
    userAction: 'Click "Start Quick Win" button',
    acceptedInput: ['User niche (from previous selection or default)'],
    systemAction: 'Query top 3 viral videos from scraped_videos by niche and DPS score',
    apiEndpoint: 'GET /api/templates?niche={niche}&limit=3&minDps=80',
    successState: '3 template cards displayed with DPS scores, thumbnails, view counts',
    errorStates: ['No templates found for niche', 'API error'],
    targetTime: '< 3 seconds',
    dataPersisted: 'localStorage:quickWinState.templates',
    dependsOn: [],
  },
  {
    id: 'qw_step_1_2',
    phase: 'select',
    phaseNumber: 1,
    stepNumber: 2,
    name: 'Choose Template',
    description: 'Select one of the 3 curated maximum viral potential videos',
    userAction: 'Click on one of the 3 template cards',
    acceptedInput: ['Template selection (video_id)'],
    systemAction: 'Store selected template, fetch full template data including transcript',
    successState: 'Template highlighted, "Generate Script" button enabled',
    errorStates: ['Template data fetch failed'],
    dataPersisted: 'localStorage:quickWinState.selectedTemplate',
    dependsOn: ['qw_step_1_1'],
  },
  {
    id: 'qw_step_1_3',
    phase: 'select',
    phaseNumber: 1,
    stepNumber: 3,
    name: 'Preview Template',
    description: 'View template preview alongside Value Editor',
    userAction: 'View template video preview and extracted patterns',
    acceptedInput: ['None (display only)'],
    systemAction: 'Display video thumbnail, transcript excerpt, extracted hook/CTA',
    successState: 'Preview panel shows template details',
    errorStates: ['Video preview unavailable'],
    dataPersisted: 'None',
    dependsOn: ['qw_step_1_2'],
  },
];

// =============================================================================
// PHASE 2: GENERATE (Steps 2.1 - 2.4)
// =============================================================================

export const GENERATE_STEPS: Workflow3StepSpec[] = [
  {
    id: 'qw_step_2_1',
    phase: 'generate',
    phaseNumber: 2,
    stepNumber: 1,
    name: 'Hook Selection',
    description: 'Choose from 3 AI-generated hooks based on template pattern',
    userAction: 'Select one of 3 hook options',
    acceptedInput: ['Hook selection (1, 2, or 3)'],
    systemAction: 'Generate 3 hook variations using template DNA, let user choose',
    apiEndpoint: 'POST /api/generate/hooks',
    successState: '3 hook options displayed, one can be selected',
    errorStates: ['Generation failed', 'Rate limit exceeded'],
    targetTime: '< 5 seconds',
    dataPersisted: 'localStorage:quickWinState.selectedHook',
    dependsOn: ['qw_step_1_2'],
  },
  {
    id: 'qw_step_2_2',
    phase: 'generate',
    phaseNumber: 2,
    stepNumber: 2,
    name: 'Beat Selector',
    description: 'Define or customize the content beat structure',
    userAction: 'Review generated beat, make edits',
    acceptedInput: ['Beat structure (Hook, Context, Value, CTA)'],
    systemAction: 'Pre-fill beat from template, allow customization',
    successState: 'Beat editor shows complete 4-section structure',
    errorStates: ['Beat generation failed'],
    dataPersisted: 'localStorage:quickWinState.beat',
    dependsOn: ['qw_step_2_1'],
  },
  {
    id: 'qw_step_2_3',
    phase: 'generate',
    phaseNumber: 2,
    stepNumber: 3,
    name: 'Audio Trends',
    description: 'Select trending audio/sounds for the video',
    userAction: 'Browse and select trending audio',
    acceptedInput: ['Audio selection (audio_id or "original")'],
    systemAction: 'Suggest trending sounds in niche, or use original audio',
    successState: 'Audio selected or "Original" confirmed',
    errorStates: ['Audio library unavailable'],
    dataPersisted: 'localStorage:quickWinState.audioSelection',
    dependsOn: ['qw_step_1_2'],
  },
  {
    id: 'qw_step_2_4',
    phase: 'generate',
    phaseNumber: 2,
    stepNumber: 4,
    name: 'Generate Full Script',
    description: 'Generate complete script based on selections',
    userAction: 'Click "Generate Script" button',
    acceptedInput: ['All previous selections'],
    systemAction: 'Call script generation API with template, hook, beat selections',
    apiEndpoint: 'POST /api/generate/script',
    successState: 'Full script displayed with sections and timings',
    errorStates: ['Script generation failed', 'Timeout'],
    targetTime: '< 10 seconds',
    dataPersisted: 'localStorage:quickWinState.generatedScript',
    dependsOn: ['qw_step_2_1', 'qw_step_2_2'],
  },
];

// =============================================================================
// PHASE 3: CREATE (Steps 3.1 - 3.5)
// =============================================================================

export const CREATE_STEPS_QW: Workflow3StepSpec[] = [
  {
    id: 'qw_step_3_1',
    phase: 'create',
    phaseNumber: 3,
    stepNumber: 1,
    name: 'Pre-Filming Analysis',
    description: 'Review analysis and recommendations before filming',
    userAction: 'Review pre-filming checklist and tips',
    acceptedInput: ['None (read-only)'],
    systemAction: 'Display filming recommendations based on template style',
    successState: 'Checklist displayed, "Continue to Film" enabled',
    errorStates: [],
    dataPersisted: 'None',
    dependsOn: ['qw_step_2_4'],
  },
  {
    id: 'qw_step_3_2',
    phase: 'create',
    phaseNumber: 3,
    stepNumber: 2,
    name: 'Film Video with Teleprompter',
    description: 'Use built-in teleprompter to film video following script',
    userAction: 'Enable teleprompter, film video',
    acceptedInput: ['Video recording'],
    systemAction: 'Display scrolling teleprompter with script, record video',
    successState: 'Video recorded, preview available',
    errorStates: ['Camera access denied', 'Recording failed'],
    dataPersisted: 'localStorage:quickWinState.recordedVideo (blob URL)',
    dependsOn: ['qw_step_3_1'],
  },
  {
    id: 'qw_step_3_3',
    phase: 'create',
    phaseNumber: 3,
    stepNumber: 3,
    name: 'Post-Filming Analysis',
    description: 'Get AI analysis score after filming',
    userAction: 'Submit video for analysis',
    acceptedInput: ['Recorded video file'],
    systemAction: 'Run video through prediction pipeline, return DPS and recommendations',
    apiEndpoint: 'POST /api/kai/predict',
    successState: 'Analysis score displayed with breakdown',
    errorStates: ['Analysis failed', 'Video too large'],
    targetTime: '< 25 seconds',
    dataPersisted: 'localStorage:quickWinState.analysisResult',
    dependsOn: ['qw_step_3_2'],
  },
  {
    id: 'qw_step_3_4',
    phase: 'create',
    phaseNumber: 3,
    stepNumber: 4,
    name: 'AI Suggested Fixes',
    description: 'Review and optionally apply AI-suggested improvements',
    userAction: 'Review suggestions, click "Apply Fix" on desired improvements',
    acceptedInput: ['Fix selections'],
    systemAction: 'Display actionable suggestions with estimated DPS lift per fix',
    successState: 'Fixes reviewed, user can re-record or proceed',
    errorStates: [],
    dataPersisted: 'localStorage:quickWinState.appliedFixes',
    dependsOn: ['qw_step_3_3'],
  },
  {
    id: 'qw_step_3_5',
    phase: 'create',
    phaseNumber: 3,
    stepNumber: 5,
    name: 'Final Prediction & Receipt',
    description: 'Get final prediction with blockchain-verified receipt',
    userAction: 'Click "Get Final Prediction"',
    acceptedInput: ['Final video (after any re-records)'],
    systemAction: 'Run final prediction, generate immutable blockchain receipt',
    apiEndpoint: 'POST /api/kai/predict?receipt=true',
    successState: 'Final DPS score, confidence, and blockchain receipt hash displayed',
    errorStates: ['Prediction failed', 'Receipt generation failed'],
    targetTime: '< 30 seconds',
    dataPersisted: 'DB:prediction_runs, localStorage:quickWinState.finalPrediction',
    dependsOn: ['qw_step_3_3'],
  },
];

// =============================================================================
// ALL WORKFLOW 3 STEPS
// =============================================================================

export const ALL_WORKFLOW_3_STEPS: Workflow3StepSpec[] = [
  ...SELECT_STEPS,
  ...GENERATE_STEPS,
  ...CREATE_STEPS_QW,
];

export function getWorkflow3StepById(stepId: string): Workflow3StepSpec | undefined {
  return ALL_WORKFLOW_3_STEPS.find(step => step.id === stepId);
}

export function getWorkflow3StepsByPhase(phase: Workflow3Phase): Workflow3StepSpec[] {
  return ALL_WORKFLOW_3_STEPS.filter(step => step.phase === phase);
}

// =============================================================================
// WORKFLOW 3 STATE
// =============================================================================

export interface GeneratedHook {
  id: number;
  text: string;
  type: string;
  source: 'template' | 'ai_variation';
}

export interface GeneratedScript {
  hook: { text: string; timing: string };
  context: { text: string; timing: string };
  value: { text: string; timing: string };
  cta: { text: string; timing: string };
  fullScript: string;
  visualNotes?: string;
}

export interface AnalysisResult {
  dpsScore: number;
  confidence: number;
  range: [number, number];
  viralPotential: 'poor' | 'average' | 'good' | 'excellent';
  recommendations: string[];
  packResults?: {
    pack1?: Record<string, unknown>;
    pack2?: Record<string, unknown>;
    pack3?: Record<string, unknown>;
    packV?: Record<string, unknown>;
  };
}

export interface AIFix {
  id: string;
  category: 'hook' | 'pacing' | 'cta' | 'audio' | 'visual';
  suggestion: string;
  estimatedLift: number;
  applied: boolean;
}

export interface BlockchainReceipt {
  hash: string;
  timestamp: string;
  network: 'ethereum' | 'polygon' | 'solana';
  txUrl: string;
  predictionSnapshot: {
    dpsScore: number;
    confidence: number;
    videoHash: string;
  };
}

export interface Workflow3State {
  // Identity
  workflowId: string;
  workflowType: 'quick_win';
  
  // Current position
  currentPhase: Workflow3Phase;
  currentPhaseNumber: Workflow3PhaseNumber;
  currentStepId: string;
  
  // Phase 1: Select
  userNiche: Niche | null;
  availableTemplates: ViralTemplate[];
  selectedTemplate: ViralTemplate | null;
  
  // Phase 2: Generate
  hookOptions: GeneratedHook[];
  selectedHook: GeneratedHook | null;
  beat: ContentBeat | null;
  audioSelection: string | null;
  generatedScript: GeneratedScript | null;
  
  // Phase 3: Create
  preFilmingChecked: boolean;
  recordedVideoUrl: string | null;
  analysisResult: AnalysisResult | null;
  aiFixes: AIFix[];
  finalPrediction: AnalysisResult | null;
  blockchainReceipt: BlockchainReceipt | null;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  status: 'active' | 'completed' | 'abandoned';
}

// =============================================================================
// INITIAL STATE FACTORY
// =============================================================================

export function createEmptyWorkflow3State(workflowId?: string): Workflow3State {
  return {
    workflowId: workflowId || crypto.randomUUID(),
    workflowType: 'quick_win',
    currentPhase: 'select',
    currentPhaseNumber: 1,
    currentStepId: 'qw_step_1_1',
    
    // Select
    userNiche: null,
    availableTemplates: [],
    selectedTemplate: null,
    
    // Generate
    hookOptions: [],
    selectedHook: null,
    beat: null,
    audioSelection: null,
    generatedScript: null,
    
    // Create
    preFilmingChecked: false,
    recordedVideoUrl: null,
    analysisResult: null,
    aiFixes: [],
    finalPrediction: null,
    blockchainReceipt: null,
    
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    status: 'active',
  };
}

// =============================================================================
// PHASE VALIDATION
// =============================================================================

export interface Workflow3PhaseValidation {
  phase: Workflow3Phase;
  isComplete: boolean;
  missingSteps: string[];
  warnings: string[];
}

export function validateSelectPhase(state: Workflow3State): Workflow3PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  if (state.availableTemplates.length === 0) missingSteps.push('Load Templates');
  if (!state.selectedTemplate) missingSteps.push('Select Template');
  
  return {
    phase: 'select',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validateGeneratePhase(state: Workflow3State): Workflow3PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  if (!state.selectedHook) missingSteps.push('Select Hook');
  if (!state.beat) missingSteps.push('Define Beat');
  if (!state.generatedScript) missingSteps.push('Generate Script');
  
  if (!state.audioSelection) warnings.push('No audio selected (will use original)');
  
  return {
    phase: 'generate',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validateCreatePhaseQW(state: Workflow3State): Workflow3PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  if (!state.recordedVideoUrl) missingSteps.push('Record Video');
  if (!state.analysisResult) missingSteps.push('Get Analysis');
  
  if (!state.finalPrediction) warnings.push('Final prediction not yet run');
  if (!state.blockchainReceipt) warnings.push('Blockchain receipt not generated');
  
  return {
    phase: 'create',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validateWorkflow3Phase(phase: Workflow3Phase, state: Workflow3State): Workflow3PhaseValidation {
  switch (phase) {
    case 'select': return validateSelectPhase(state);
    case 'generate': return validateGeneratePhase(state);
    case 'create': return validateCreatePhaseQW(state);
  }
}
