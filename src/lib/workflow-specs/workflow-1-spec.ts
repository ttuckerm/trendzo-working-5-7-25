/**
 * Workflow 1: Viral Content Creator (Full 6-Phase, 19-Step Workflow)
 * 
 * Complete specification following the Product Operations Pack format.
 * This is the comprehensive content creation pipeline.
 */

import type {
  Niche,
  AudienceAgeBand,
  ContentPurpose,
  ContentPillar,
  ContentFormat,
  GoalType,
  ContentBeat,
  SEOPack,
  ViralTemplate,
  Platform,
  PerformanceMetrics,
  ContentIteration,
} from './shared-components';

// =============================================================================
// WORKFLOW 1 PHASES
// =============================================================================

export const WORKFLOW_1_PHASES = [
  'research',
  'plan', 
  'create',
  'optimize',
  'publish',
  'engage',
] as const;

export type Workflow1Phase = typeof WORKFLOW_1_PHASES[number];
export type Workflow1PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6;

export const PHASE_TO_NUMBER: Record<Workflow1Phase, Workflow1PhaseNumber> = {
  research: 1,
  plan: 2,
  create: 3,
  optimize: 4,
  publish: 5,
  engage: 6,
};

export const NUMBER_TO_PHASE: Record<Workflow1PhaseNumber, Workflow1Phase> = {
  1: 'research',
  2: 'plan',
  3: 'create',
  4: 'optimize',
  5: 'publish',
  6: 'engage',
};

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

export interface StepSpec {
  id: string;
  phase: Workflow1Phase;
  phaseNumber: Workflow1PhaseNumber;
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
// PHASE 1: RESEARCH (Steps 1.1 - 1.5)
// =============================================================================

export const RESEARCH_STEPS: StepSpec[] = [
  {
    id: 'step_1_1',
    phase: 'research',
    phaseNumber: 1,
    stepNumber: 1,
    name: 'Define Niche',
    description: 'Select your content niche/category',
    userAction: 'Select niche from dropdown',
    acceptedInput: ['Niche selection from 20+ categories'],
    systemAction: 'Store niche selection, filter exemplars by niche',
    successState: 'Niche badge appears, related niches suggested',
    errorStates: ['No niche selected'],
    dataPersisted: 'localStorage:creatorData.niche',
    dependsOn: [],
  },
  {
    id: 'step_1_2',
    phase: 'research',
    phaseNumber: 1,
    stepNumber: 2,
    name: 'Target Audience Demographics',
    description: 'Define your target audience age band',
    userAction: 'Click age band button (18-24, 25-34, 35-44, 45+)',
    acceptedInput: ['Single age band selection'],
    systemAction: 'Store audience selection, adjust recommendations',
    successState: 'Age band highlighted, content style hints shown',
    errorStates: ['No age band selected'],
    dataPersisted: 'localStorage:creatorData.targetAudience.age',
    dependsOn: ['step_1_1'],
  },
  {
    id: 'step_1_3',
    phase: 'research',
    phaseNumber: 1,
    stepNumber: 3,
    name: 'Content Purpose',
    description: 'What do you want your audience to do? (Know/Like/Trust)',
    userAction: 'Select content purpose card',
    acceptedInput: ['KNOW, LIKE, or TRUST selection'],
    systemAction: 'Store purpose, suggest CTA strategies',
    successState: 'Purpose card selected, CTA examples shown',
    errorStates: ['No purpose selected'],
    dataPersisted: 'localStorage:creatorData.contentPurpose',
    dependsOn: ['step_1_2'],
  },
  {
    id: 'step_1_4',
    phase: 'research',
    phaseNumber: 1,
    stepNumber: 4,
    name: 'Set Goals & KPIs',
    description: 'Define your primary content goal and target metrics',
    userAction: 'Select goal from dropdown, enter target view count',
    acceptedInput: ['Goal type selection', 'Target views number'],
    systemAction: 'Store goals, calculate realistic targets',
    successState: 'Goal badge shown, target metrics displayed',
    errorStates: ['No goal selected', 'Invalid target number'],
    dataPersisted: 'localStorage:creatorData.goals',
    dependsOn: ['step_1_3'],
  },
  {
    id: 'step_1_5',
    phase: 'research',
    phaseNumber: 1,
    stepNumber: 5,
    name: 'Exemplar Swoop',
    description: 'Find 25 accounts in your niche, track their viral videos',
    userAction: 'Search hashtags/keywords/creators, select exemplars',
    acceptedInput: ['Search query', 'Platform selection (TikTok/YouTube/Instagram)'],
    systemAction: 'Query scraped_videos by niche, return top performers',
    apiEndpoint: 'GET /api/templates?niche={niche}',
    successState: 'Exemplar grid shows videos with DPS scores',
    errorStates: ['No results found', 'API error'],
    dataPersisted: 'localStorage:creatorData.exemplarSwoop',
    dependsOn: ['step_1_1'],
  },
];

// =============================================================================
// PHASE 2: PLAN (Steps 2.1 - 2.5)
// =============================================================================

export const PLAN_STEPS: StepSpec[] = [
  {
    id: 'step_2_1',
    phase: 'plan',
    phaseNumber: 2,
    stepNumber: 1,
    name: 'Keyword Selection',
    description: 'Select primary and alternative keywords for your content',
    userAction: 'Enter keywords or select from AI suggestions',
    acceptedInput: ['Primary keywords (comma-separated)', 'Alternative keywords'],
    systemAction: 'Validate keywords, check search volume hints',
    successState: 'Keywords displayed as tags',
    errorStates: ['No keywords entered'],
    dataPersisted: 'localStorage:creatorData.seoStrategy.primaryTerms',
    dependsOn: ['step_1_1', 'step_1_5'],
  },
  {
    id: 'step_2_2',
    phase: 'plan',
    phaseNumber: 2,
    stepNumber: 2,
    name: 'Content Topic',
    description: 'Define the specific topic for this video',
    userAction: 'Enter topic or select from generated suggestions',
    acceptedInput: ['Topic text (max 200 chars)'],
    systemAction: 'Store topic, generate related subtopics',
    successState: 'Topic displayed with character count',
    errorStates: ['Topic too long', 'No topic entered'],
    dataPersisted: 'localStorage:creatorData.topicShortlist',
    dependsOn: ['step_2_1'],
  },
  {
    id: 'step_2_3',
    phase: 'plan',
    phaseNumber: 2,
    stepNumber: 3,
    name: 'Format Analysis',
    description: 'Choose the video format (list style, storytelling, etc.)',
    userAction: 'Select format from options',
    acceptedInput: ['Format selection from 10 options'],
    systemAction: 'Store format, load format-specific templates',
    successState: 'Format card selected with description',
    errorStates: ['No format selected'],
    dataPersisted: 'localStorage:creatorData.contentFormat',
    dependsOn: ['step_2_2'],
  },
  {
    id: 'step_2_4',
    phase: 'plan',
    phaseNumber: 2,
    stepNumber: 4,
    name: 'Content Pillar',
    description: 'Select content pillar (Education, Entertainment, etc.)',
    userAction: 'Click pillar card',
    acceptedInput: ['Pillar selection (4 options)'],
    systemAction: 'Store pillar, adjust beat recommendations',
    successState: 'Pillar badge highlighted',
    errorStates: ['No pillar selected'],
    dataPersisted: 'localStorage:creatorData.goldenPillars',
    dependsOn: ['step_1_3'],
  },
  {
    id: 'step_2_5',
    phase: 'plan',
    phaseNumber: 2,
    stepNumber: 5,
    name: 'Content Goals',
    description: 'Define specific content goals (knowledge transfer, trust building)',
    userAction: 'Select primary and secondary content goals',
    acceptedInput: ['Primary goal', 'Secondary goal'],
    systemAction: 'Store goals, update beat sheet recommendations',
    successState: 'Goals displayed as badges',
    errorStates: ['No goals selected'],
    dataPersisted: 'localStorage:creatorData.contentGoals',
    dependsOn: ['step_1_3', 'step_2_4'],
  },
];

// =============================================================================
// PHASE 3: CREATE (Steps 3.1 - 3.4)
// =============================================================================

export const CREATE_STEPS: StepSpec[] = [
  {
    id: 'step_3_1',
    phase: 'create',
    phaseNumber: 3,
    stepNumber: 1,
    name: 'Content Beat',
    description: 'Define hooks, proof points, value propositions, and CTAs',
    userAction: 'Fill in beat editor with Hook, Proof, Value, CTA',
    acceptedInput: ['Hook text', 'Proof point', 'Value proposition', 'Call to action'],
    systemAction: 'Validate beat structure, calculate timing suggestions',
    successState: 'Beat sheet complete with all 4 sections filled',
    errorStates: ['Missing required section', 'Hook too long'],
    dataPersisted: 'localStorage:creatorData.beatSheet',
    dependsOn: ['step_2_1', 'step_2_2', 'step_2_3', 'step_2_4', 'step_2_5'],
  },
  {
    id: 'step_3_2',
    phase: 'create',
    phaseNumber: 3,
    stepNumber: 2,
    name: 'SEO Pack',
    description: 'Generate SEO elements (primary terms, alternative terms, hashtags)',
    userAction: 'Review and edit generated SEO pack',
    acceptedInput: ['Primary terms (editable)', 'Alternative terms', 'Hashtags'],
    systemAction: 'Auto-generate based on keywords, allow edits',
    apiEndpoint: 'POST /api/seo/generate',
    successState: 'SEO pack displayed with copy buttons',
    errorStates: ['Generation failed'],
    dataPersisted: 'localStorage:creatorData.seoStrategy',
    dependsOn: ['step_2_1', 'step_2_2'],
  },
  {
    id: 'step_3_3',
    phase: 'create',
    phaseNumber: 3,
    stepNumber: 3,
    name: 'On-Screen Display',
    description: 'Define on-screen text overlays and captions timing',
    userAction: 'Enter on-screen text for each beat section',
    acceptedInput: ['Hook text overlay', 'Key point overlays', 'CTA overlay'],
    systemAction: 'Store overlays, suggest font styles',
    successState: 'Text overlays listed with timing suggestions',
    errorStates: ['Text too long for screen'],
    dataPersisted: 'localStorage:creatorData.onScreenDisplay',
    dependsOn: ['step_3_1'],
  },
  {
    id: 'step_3_4',
    phase: 'create',
    phaseNumber: 3,
    stepNumber: 4,
    name: 'Captions',
    description: 'Generate or edit video captions',
    userAction: 'Review auto-generated captions or enter manually',
    acceptedInput: ['Caption text', 'Caption style selection'],
    systemAction: 'Generate captions from beat sheet, allow edits',
    successState: 'Captions displayed with character count',
    errorStates: ['Caption exceeds platform limit'],
    dataPersisted: 'localStorage:creatorData.captions',
    dependsOn: ['step_3_1'],
  },
];

// =============================================================================
// PHASE 4: OPTIMIZE (Steps 4.1 - 4.2)
// =============================================================================

export const OPTIMIZE_STEPS: StepSpec[] = [
  {
    id: 'step_4_1',
    phase: 'optimize',
    phaseNumber: 4,
    stepNumber: 1,
    name: 'Optimization Checklist',
    description: 'Review optimization checklist before prediction',
    userAction: 'Check off items in the optimization checklist',
    acceptedInput: ['Checklist item toggles'],
    systemAction: 'Track completion, gate prediction behind critical items',
    successState: 'All critical items checked, prediction enabled',
    errorStates: ['Critical item unchecked'],
    dataPersisted: 'localStorage:creatorData.optimizationChecklist',
    dependsOn: ['step_3_1', 'step_3_2', 'step_3_3', 'step_3_4'],
  },
  {
    id: 'step_4_2',
    phase: 'optimize',
    phaseNumber: 4,
    stepNumber: 2,
    name: 'DPS Prediction',
    description: 'Get AI prediction of viral potential',
    userAction: 'Click "Get Prediction" button',
    acceptedInput: ['All previous step data'],
    systemAction: 'Call prediction API, display results',
    apiEndpoint: 'POST /api/kai/predict',
    successState: 'DPS score displayed with confidence and recommendations',
    errorStates: ['Prediction failed', 'Timeout'],
    targetTime: '< 25 seconds',
    dataPersisted: 'localStorage:creatorData.prediction, DB:prediction_runs',
    dependsOn: ['step_4_1'],
  },
];

// =============================================================================
// PHASE 5: PUBLISH (Step 5.1)
// =============================================================================

export const PUBLISH_STEPS: StepSpec[] = [
  {
    id: 'step_5_1',
    phase: 'publish',
    phaseNumber: 5,
    stepNumber: 1,
    name: 'Publish to Platform',
    description: 'Select platform and publish/schedule content',
    userAction: 'Select platform(s), set schedule, click publish',
    acceptedInput: ['Platform selection', 'Schedule time (optional)', 'Video file'],
    systemAction: 'Validate content, initiate publish or schedule',
    successState: 'Content published/scheduled, confirmation shown',
    errorStates: ['Platform auth missing', 'Upload failed', 'Content violation'],
    dataPersisted: 'localStorage:creatorData.publishStatus',
    dependsOn: ['step_4_2'],
  },
];

// =============================================================================
// PHASE 6: ENGAGE & LEARN (Steps 6.1 - 6.2)
// =============================================================================

export const ENGAGE_STEPS: StepSpec[] = [
  {
    id: 'step_6_1',
    phase: 'engage',
    phaseNumber: 6,
    stepNumber: 1,
    name: 'Track Results',
    description: 'Monitor video performance metrics',
    userAction: 'View performance dashboard',
    acceptedInput: ['Video ID for tracking'],
    systemAction: 'Fetch metrics from platform API, calculate DPS',
    apiEndpoint: 'GET /api/analytics/video/{id}',
    successState: 'Metrics dashboard populated with real data',
    errorStates: ['Metrics unavailable', 'Video not found'],
    dataPersisted: 'localStorage:creatorData.performanceMetrics',
    dependsOn: ['step_5_1'],
  },
  {
    id: 'step_6_2',
    phase: 'engage',
    phaseNumber: 6,
    stepNumber: 2,
    name: 'Content Iteration',
    description: 'Review performance, get improvement suggestions',
    userAction: 'View iteration suggestions, plan next content',
    acceptedInput: ['Performance data from step 6.1'],
    systemAction: 'Generate improvement suggestions, compare to prediction',
    successState: 'Iteration panel shows suggestions and next steps',
    errorStates: ['Insufficient data for analysis'],
    dataPersisted: 'localStorage:creatorData.contentIteration',
    dependsOn: ['step_6_1'],
  },
];

// =============================================================================
// ALL STEPS COMBINED
// =============================================================================

export const ALL_WORKFLOW_1_STEPS: StepSpec[] = [
  ...RESEARCH_STEPS,
  ...PLAN_STEPS,
  ...CREATE_STEPS,
  ...OPTIMIZE_STEPS,
  ...PUBLISH_STEPS,
  ...ENGAGE_STEPS,
];

export function getStepById(stepId: string): StepSpec | undefined {
  return ALL_WORKFLOW_1_STEPS.find(step => step.id === stepId);
}

export function getStepsByPhase(phase: Workflow1Phase): StepSpec[] {
  return ALL_WORKFLOW_1_STEPS.filter(step => step.phase === phase);
}

// =============================================================================
// WORKFLOW 1 STATE
// =============================================================================

export interface Workflow1State {
  // Identity
  workflowId: string;
  workflowType: 'creator';
  
  // Current position
  currentPhase: Workflow1Phase;
  currentPhaseNumber: Workflow1PhaseNumber;
  currentStepId: string;
  
  // Phase 1: Research
  niche: Niche | null;
  audienceAgeBand: AudienceAgeBand | null;
  contentPurpose: ContentPurpose | null;
  goals: {
    primaryGoal: GoalType | null;
    targetViews: number;
    kpis: string[];
  };
  exemplarSwoop: ViralTemplate[];
  
  // Phase 2: Plan
  keywords: {
    primary: string[];
    alternative: string[];
  };
  contentTopic: string;
  contentFormat: ContentFormat | null;
  contentPillar: ContentPillar | null;
  contentGoals: {
    primary: string;
    secondary: string;
  };
  
  // Phase 3: Create
  beatSheet: ContentBeat[];
  seoPack: SEOPack | null;
  onScreenDisplay: string[];
  captions: string;
  
  // Phase 4: Optimize
  optimizationChecklist: {
    hookEffectiveness: boolean;
    proofQuality: boolean;
    ctaAlignment: boolean;
    audioQuality: boolean;
    visualClarity: boolean;
  };
  prediction: {
    dpsScore: number | null;
    confidence: number | null;
    range: [number, number] | null;
    recommendations: string[];
  };
  
  // Phase 5: Publish
  publishConfig: {
    platforms: Platform[];
    scheduledTime: string | null;
    status: 'draft' | 'scheduled' | 'published';
  };
  
  // Phase 6: Engage
  performanceMetrics: PerformanceMetrics | null;
  contentIteration: ContentIteration | null;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  status: 'active' | 'completed' | 'abandoned';
}

// =============================================================================
// INITIAL STATE FACTORY
// =============================================================================

export function createEmptyWorkflow1State(workflowId?: string): Workflow1State {
  return {
    workflowId: workflowId || crypto.randomUUID(),
    workflowType: 'creator',
    currentPhase: 'research',
    currentPhaseNumber: 1,
    currentStepId: 'step_1_1',
    
    // Research
    niche: null,
    audienceAgeBand: null,
    contentPurpose: null,
    goals: { primaryGoal: null, targetViews: 10000, kpis: [] },
    exemplarSwoop: [],
    
    // Plan
    keywords: { primary: [], alternative: [] },
    contentTopic: '',
    contentFormat: null,
    contentPillar: null,
    contentGoals: { primary: '', secondary: '' },
    
    // Create
    beatSheet: [],
    seoPack: null,
    onScreenDisplay: [],
    captions: '',
    
    // Optimize
    optimizationChecklist: {
      hookEffectiveness: false,
      proofQuality: false,
      ctaAlignment: false,
      audioQuality: false,
      visualClarity: false,
    },
    prediction: {
      dpsScore: null,
      confidence: null,
      range: null,
      recommendations: [],
    },
    
    // Publish
    publishConfig: {
      platforms: [],
      scheduledTime: null,
      status: 'draft',
    },
    
    // Engage
    performanceMetrics: null,
    contentIteration: null,
    
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    status: 'active',
  };
}

// =============================================================================
// PHASE COMPLETION VALIDATION
// =============================================================================

export interface PhaseValidation {
  phase: Workflow1Phase;
  isComplete: boolean;
  missingSteps: string[];
  warnings: string[];
}

export function validateResearchPhase(state: Workflow1State): PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  if (!state.niche) missingSteps.push('Define Niche');
  if (!state.audienceAgeBand) missingSteps.push('Target Audience');
  if (!state.contentPurpose) missingSteps.push('Content Purpose');
  if (!state.goals.primaryGoal) missingSteps.push('Set Goals');
  if (state.exemplarSwoop.length === 0) warnings.push('No exemplar videos selected (optional but recommended)');
  
  return {
    phase: 'research',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validatePlanPhase(state: Workflow1State): PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  if (state.keywords.primary.length === 0) missingSteps.push('Keyword Selection');
  if (!state.contentTopic) missingSteps.push('Content Topic');
  if (!state.contentFormat) missingSteps.push('Format Analysis');
  if (!state.contentPillar) missingSteps.push('Content Pillar');
  if (!state.contentGoals.primary) warnings.push('No primary content goal set');
  
  return {
    phase: 'plan',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validateCreatePhase(state: Workflow1State): PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  if (state.beatSheet.length === 0) missingSteps.push('Content Beat');
  else {
    const beat = state.beatSheet[0];
    if (!beat.hook) missingSteps.push('Beat: Hook missing');
    if (!beat.valueProposition) missingSteps.push('Beat: Value proposition missing');
    if (!beat.callToAction) missingSteps.push('Beat: CTA missing');
  }
  if (!state.seoPack) warnings.push('SEO Pack not generated (optional)');
  if (state.onScreenDisplay.length === 0) warnings.push('No on-screen text defined');
  
  return {
    phase: 'create',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validateOptimizePhase(state: Workflow1State): PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  const checklist = state.optimizationChecklist;
  if (!checklist.hookEffectiveness) missingSteps.push('Hook Effectiveness check');
  if (!checklist.proofQuality) missingSteps.push('Proof Quality check');
  if (!checklist.ctaAlignment) missingSteps.push('CTA Alignment check');
  
  if (!state.prediction.dpsScore) warnings.push('DPS Prediction not run');
  
  return {
    phase: 'optimize',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validatePhase(phase: Workflow1Phase, state: Workflow1State): PhaseValidation {
  switch (phase) {
    case 'research': return validateResearchPhase(state);
    case 'plan': return validatePlanPhase(state);
    case 'create': return validateCreatePhase(state);
    case 'optimize': return validateOptimizePhase(state);
    case 'publish': return { phase, isComplete: true, missingSteps: [], warnings: [] };
    case 'engage': return { phase, isComplete: true, missingSteps: [], warnings: [] };
  }
}
