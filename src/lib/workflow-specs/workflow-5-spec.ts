/**
 * Workflow 5: Template Library (Entry Point Orchestrator)
 * 
 * Browse viral video library → Select template → Route to Workflow 1 or 3
 * This workflow serves as the entry point that routes users to the appropriate
 * content creation workflow based on their selection.
 */

import type {
  Niche,
  ViralTemplate,
  Platform,
} from './shared-components';

// =============================================================================
// WORKFLOW 5 PHASES
// =============================================================================

export const WORKFLOW_5_PHASES = [
  'browse',
  'select',
  'route',
] as const;

export type Workflow5Phase = typeof WORKFLOW_5_PHASES[number];
export type Workflow5PhaseNumber = 1 | 2 | 3;

export const PHASE_5_TO_NUMBER: Record<Workflow5Phase, Workflow5PhaseNumber> = {
  browse: 1,
  select: 2,
  route: 3,
};

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

export interface Workflow5StepSpec {
  id: string;
  phase: Workflow5Phase;
  phaseNumber: Workflow5PhaseNumber;
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
// PHASE 1: BROWSE (Steps 1.1 - 1.3)
// =============================================================================

export const BROWSE_STEPS: Workflow5StepSpec[] = [
  {
    id: 'tl_step_1_1',
    phase: 'browse',
    phaseNumber: 1,
    stepNumber: 1,
    name: 'Login to Video Library',
    description: 'Access the user\'s trending video library',
    userAction: 'Navigate to Template Library',
    acceptedInput: ['User authentication'],
    systemAction: 'Load user preferences, recent templates, saved favorites',
    successState: 'Template library loads with user\'s context',
    errorStates: ['Auth failed', 'Library load failed'],
    targetTime: '< 2 seconds',
    dataPersisted: 'Session storage',
    dependsOn: [],
  },
  {
    id: 'tl_step_1_2',
    phase: 'browse',
    phaseNumber: 1,
    stepNumber: 2,
    name: 'Browse Template Gallery',
    description: 'View grid of viral video templates (UI within UI)',
    userAction: 'Scroll through templates, use filters',
    acceptedInput: ['Filter selections (niche, DPS range, date)', 'Search query', 'Sort option'],
    systemAction: 'Query scraped_videos with filters, display paginated results',
    apiEndpoint: 'GET /api/templates?niche={niche}&minDps={dps}&sort={sort}&page={page}',
    successState: 'Template grid displays with thumbnails, DPS scores, view counts',
    errorStates: ['No templates found', 'Query timeout'],
    targetTime: '< 3 seconds per page',
    dataPersisted: 'None (stateless)',
    dependsOn: ['tl_step_1_1'],
  },
  {
    id: 'tl_step_1_3',
    phase: 'browse',
    phaseNumber: 1,
    stepNumber: 3,
    name: 'Filter and Search',
    description: 'Refine template results using filters',
    userAction: 'Select niche filter, DPS range, date range, or enter search query',
    acceptedInput: ['Niche selection (multi-select)', 'DPS range slider', 'Date range', 'Keyword search'],
    systemAction: 'Apply filters to query, refresh results',
    successState: 'Results update with filter badges shown',
    errorStates: ['No results match filters'],
    dataPersisted: 'localStorage:templateLibraryFilters',
    dependsOn: ['tl_step_1_2'],
  },
];

// =============================================================================
// PHASE 2: SELECT (Steps 2.1 - 2.3)
// =============================================================================

export const SELECT_STEPS_TL: Workflow5StepSpec[] = [
  {
    id: 'tl_step_2_1',
    phase: 'select',
    phaseNumber: 2,
    stepNumber: 1,
    name: 'Preview Template',
    description: 'Click template to open detailed preview',
    userAction: 'Click on template card',
    acceptedInput: ['Template ID (video_id)'],
    systemAction: 'Fetch full template data, display in modal/panel',
    apiEndpoint: 'GET /api/templates/{id}',
    successState: 'Preview panel shows video player, transcript, extracted patterns',
    errorStates: ['Template not found', 'Video unavailable'],
    targetTime: '< 2 seconds',
    dataPersisted: 'localStorage:templateLibraryLastViewed',
    dependsOn: ['tl_step_1_2'],
  },
  {
    id: 'tl_step_2_2',
    phase: 'select',
    phaseNumber: 2,
    stepNumber: 2,
    name: 'View Pattern Analysis',
    description: 'See extracted viral patterns (hook, structure, CTA)',
    userAction: 'View pattern breakdown in preview panel',
    acceptedInput: ['None (display only)'],
    systemAction: 'Display extracted 7 Idea Legos, hook type, CTA pattern',
    successState: 'Pattern analysis panel shows extracted elements',
    errorStates: ['Pattern extraction incomplete'],
    dataPersisted: 'None',
    dependsOn: ['tl_step_2_1'],
  },
  {
    id: 'tl_step_2_3',
    phase: 'select',
    phaseNumber: 2,
    stepNumber: 3,
    name: 'Select Template',
    description: 'Confirm template selection for content creation',
    userAction: 'Click "Use This Template" button',
    acceptedInput: ['Confirmation'],
    systemAction: 'Store selected template, prepare for workflow routing',
    successState: 'Template confirmed, workflow selection modal opens',
    errorStates: [],
    dataPersisted: 'localStorage:templateLibrarySelectedTemplate',
    dependsOn: ['tl_step_2_1'],
  },
];

// =============================================================================
// PHASE 3: ROUTE (Steps 3.1 - 3.2)
// =============================================================================

export const ROUTE_STEPS: Workflow5StepSpec[] = [
  {
    id: 'tl_step_3_1',
    phase: 'route',
    phaseNumber: 3,
    stepNumber: 1,
    name: 'Choose Workflow',
    description: 'Select which workflow to use with this template',
    userAction: 'Click "Quick Win" (Workflow 3) or "Full Creator" (Workflow 1)',
    acceptedInput: ['Workflow selection: "quick_win" | "creator"'],
    systemAction: 'Store workflow choice, prepare to transfer template context',
    successState: 'Workflow option highlighted, "Continue" enabled',
    errorStates: [],
    dataPersisted: 'localStorage:templateLibraryWorkflowChoice',
    dependsOn: ['tl_step_2_3'],
  },
  {
    id: 'tl_step_3_2',
    phase: 'route',
    phaseNumber: 3,
    stepNumber: 2,
    name: 'Launch Workflow',
    description: 'Navigate to selected workflow with template pre-loaded',
    userAction: 'Click "Continue" to launch workflow',
    acceptedInput: ['Confirmation'],
    systemAction: 'Create new workflow run, pre-populate with template data, redirect',
    successState: 'User redirected to Workflow 1 or 3 with template context loaded',
    errorStates: ['Workflow creation failed', 'Navigation failed'],
    dataPersisted: 'Creates new workflow in localStorage',
    dependsOn: ['tl_step_3_1'],
  },
];

// =============================================================================
// ALL WORKFLOW 5 STEPS
// =============================================================================

export const ALL_WORKFLOW_5_STEPS: Workflow5StepSpec[] = [
  ...BROWSE_STEPS,
  ...SELECT_STEPS_TL,
  ...ROUTE_STEPS,
];

export function getWorkflow5StepById(stepId: string): Workflow5StepSpec | undefined {
  return ALL_WORKFLOW_5_STEPS.find(step => step.id === stepId);
}

export function getWorkflow5StepsByPhase(phase: Workflow5Phase): Workflow5StepSpec[] {
  return ALL_WORKFLOW_5_STEPS.filter(step => step.phase === phase);
}

// =============================================================================
// TEMPLATE LIBRARY FILTERS
// =============================================================================

export interface TemplateLibraryFilters {
  niches: Niche[];
  dpsRange: {
    min: number;
    max: number;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
  searchQuery: string;
  sortBy: 'dps_score' | 'views_count' | 'created_at' | 'engagement_rate';
  sortOrder: 'asc' | 'desc';
  platform: Platform | 'all';
}

export const DEFAULT_FILTERS: TemplateLibraryFilters = {
  niches: [],
  dpsRange: { min: 0, max: 100 },
  dateRange: { from: null, to: null },
  searchQuery: '',
  sortBy: 'dps_score',
  sortOrder: 'desc',
  platform: 'all',
};

// =============================================================================
// WORKFLOW ROUTING OPTIONS
// =============================================================================

export type TargetWorkflow = 'creator' | 'quick_win';

export interface WorkflowRoutingOption {
  id: TargetWorkflow;
  label: string;
  description: string;
  estimatedTime: string;
  steps: number;
  icon: string;
  recommended: boolean;
}

export const WORKFLOW_ROUTING_OPTIONS: WorkflowRoutingOption[] = [
  {
    id: 'quick_win',
    label: 'Quick Win',
    description: 'Fast path: Select template → Generate script → Create video',
    estimatedTime: '15-30 minutes',
    steps: 3,
    icon: '⚡',
    recommended: true,
  },
  {
    id: 'creator',
    label: 'Full Creator Workflow',
    description: 'Complete pipeline: Research → Plan → Create → Optimize → Publish → Engage',
    estimatedTime: '1-2 hours',
    steps: 19,
    icon: '🎬',
    recommended: false,
  },
];

// =============================================================================
// WORKFLOW 5 STATE
// =============================================================================

export interface Workflow5State {
  // Identity
  workflowId: string;
  workflowType: 'template_library';
  
  // Current position
  currentPhase: Workflow5Phase;
  currentPhaseNumber: Workflow5PhaseNumber;
  currentStepId: string;
  
  // Browse state
  filters: TemplateLibraryFilters;
  currentPage: number;
  totalPages: number;
  templates: ViralTemplate[];
  isLoading: boolean;
  
  // Selection state
  selectedTemplate: ViralTemplate | null;
  lastViewedTemplateId: string | null;
  
  // Routing state
  targetWorkflow: TargetWorkflow | null;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  status: 'browsing' | 'selecting' | 'routing' | 'completed';
}

// =============================================================================
// INITIAL STATE FACTORY
// =============================================================================

export function createEmptyWorkflow5State(workflowId?: string): Workflow5State {
  return {
    workflowId: workflowId || crypto.randomUUID(),
    workflowType: 'template_library',
    currentPhase: 'browse',
    currentPhaseNumber: 1,
    currentStepId: 'tl_step_1_1',
    
    // Browse
    filters: { ...DEFAULT_FILTERS },
    currentPage: 1,
    totalPages: 1,
    templates: [],
    isLoading: false,
    
    // Selection
    selectedTemplate: null,
    lastViewedTemplateId: null,
    
    // Routing
    targetWorkflow: null,
    
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    status: 'browsing',
  };
}

// =============================================================================
// PHASE VALIDATION
// =============================================================================

export interface Workflow5PhaseValidation {
  phase: Workflow5Phase;
  isComplete: boolean;
  missingSteps: string[];
  warnings: string[];
}

export function validateBrowsePhase(state: Workflow5State): Workflow5PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  if (state.templates.length === 0 && !state.isLoading) {
    missingSteps.push('Load Templates');
  }
  
  return {
    phase: 'browse',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validateSelectPhaseTL(state: Workflow5State): Workflow5PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  if (!state.selectedTemplate) {
    missingSteps.push('Select Template');
  }
  
  return {
    phase: 'select',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validateRoutePhase(state: Workflow5State): Workflow5PhaseValidation {
  const missingSteps: string[] = [];
  const warnings: string[] = [];
  
  if (!state.targetWorkflow) {
    missingSteps.push('Choose Workflow');
  }
  
  return {
    phase: 'route',
    isComplete: missingSteps.length === 0,
    missingSteps,
    warnings,
  };
}

export function validateWorkflow5Phase(phase: Workflow5Phase, state: Workflow5State): Workflow5PhaseValidation {
  switch (phase) {
    case 'browse': return validateBrowsePhase(state);
    case 'select': return validateSelectPhaseTL(state);
    case 'route': return validateRoutePhase(state);
  }
}

// =============================================================================
// WORKFLOW ROUTING LOGIC
// =============================================================================

/**
 * Creates a new workflow with the selected template pre-populated
 */
export interface WorkflowLaunchConfig {
  targetWorkflow: TargetWorkflow;
  template: ViralTemplate;
  niche: Niche | null;
}

/**
 * Returns the URL to navigate to based on workflow selection
 */
export function getWorkflowLaunchUrl(config: WorkflowLaunchConfig): string {
  const params = new URLSearchParams({
    templateId: config.template.video_id,
    niche: config.niche || '',
    source: 'template_library',
  });
  
  switch (config.targetWorkflow) {
    case 'quick_win':
      return `/admin/workflows/quick-win?${params.toString()}`;
    case 'creator':
      return `/admin/workflows/creator?${params.toString()}`;
  }
}
