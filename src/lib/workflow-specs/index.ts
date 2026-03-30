/**
 * Workflow Specifications - Barrel Export
 * 
 * Centralized exports for all workflow specification types and utilities.
 */

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

export {
  // Niche
  NICHES,
  NICHE_OPTIONS,
  isValidNiche,
  type Niche,
  type NicheOption,
  
  // Audience
  AUDIENCE_AGE_BANDS,
  AUDIENCE_AGE_OPTIONS,
  isValidAudienceAgeBand,
  type AudienceAgeBand,
  type AudienceAgeBandOption,
  
  // Content Purpose
  CONTENT_PURPOSES,
  CONTENT_PURPOSE_OPTIONS,
  isValidContentPurpose,
  type ContentPurpose,
  type ContentPurposeOption,
  
  // Content Pillars
  CONTENT_PILLARS,
  CONTENT_PILLAR_OPTIONS,
  isValidContentPillar,
  type ContentPillar,
  type ContentPillarOption,
  
  // Content Formats
  CONTENT_FORMATS,
  CONTENT_FORMAT_OPTIONS,
  type ContentFormat,
  type ContentFormatOption,
  
  // Goals
  GOAL_TYPES,
  GOAL_OPTIONS,
  isValidGoalType,
  type GoalType,
  type GoalOption,
  
  // Content Beat
  type ContentBeat,
  type ContentBeatWithTimings,
  
  // SEO
  type SEOPack,
  
  // Templates
  type ViralTemplate,
  
  // Platforms
  PLATFORMS,
  PLATFORM_OPTIONS,
  isValidPlatform,
  type Platform,
  type PlatformOption,
  
  // Performance
  type PerformanceMetrics,
  type ContentIteration,
  
  // Shared State
  type SharedWorkflowState,
} from './shared-components';

// =============================================================================
// WORKFLOW 1: VIRAL CONTENT CREATOR
// =============================================================================

export {
  // Phases
  WORKFLOW_1_PHASES,
  PHASE_TO_NUMBER,
  NUMBER_TO_PHASE,
  type Workflow1Phase,
  type Workflow1PhaseNumber,
  
  // Step Definitions
  RESEARCH_STEPS,
  PLAN_STEPS,
  CREATE_STEPS,
  OPTIMIZE_STEPS,
  PUBLISH_STEPS,
  ENGAGE_STEPS,
  ALL_WORKFLOW_1_STEPS,
  getStepById,
  getStepsByPhase,
  type StepSpec,
  
  // State
  type Workflow1State,
  createEmptyWorkflow1State,
  
  // Validation
  validateResearchPhase,
  validatePlanPhase,
  validateCreatePhase,
  validateOptimizePhase,
  validatePhase,
  type PhaseValidation,
} from './workflow-1-spec';

// =============================================================================
// WORKFLOW 3: QUICK WIN
// =============================================================================

export {
  // Phases
  WORKFLOW_3_PHASES,
  PHASE_3_TO_NUMBER,
  type Workflow3Phase,
  type Workflow3PhaseNumber,
  
  // Step Definitions
  SELECT_STEPS,
  GENERATE_STEPS,
  CREATE_STEPS_QW,
  ALL_WORKFLOW_3_STEPS,
  getWorkflow3StepById,
  getWorkflow3StepsByPhase,
  type Workflow3StepSpec,
  
  // State
  type Workflow3State,
  type GeneratedHook,
  type GeneratedScript,
  type AnalysisResult,
  type AIFix,
  type BlockchainReceipt,
  createEmptyWorkflow3State,
  
  // Validation
  validateSelectPhase,
  validateGeneratePhase,
  validateCreatePhaseQW,
  validateWorkflow3Phase,
  type Workflow3PhaseValidation,
} from './workflow-3-spec';

// =============================================================================
// WORKFLOW 5: TEMPLATE LIBRARY
// =============================================================================

export {
  // Phases
  WORKFLOW_5_PHASES,
  PHASE_5_TO_NUMBER,
  type Workflow5Phase,
  type Workflow5PhaseNumber,
  
  // Step Definitions
  BROWSE_STEPS,
  SELECT_STEPS_TL,
  ROUTE_STEPS,
  ALL_WORKFLOW_5_STEPS,
  getWorkflow5StepById,
  getWorkflow5StepsByPhase,
  type Workflow5StepSpec,
  
  // Filters
  DEFAULT_FILTERS,
  type TemplateLibraryFilters,
  
  // Routing
  WORKFLOW_ROUTING_OPTIONS,
  getWorkflowLaunchUrl,
  type TargetWorkflow,
  type WorkflowRoutingOption,
  type WorkflowLaunchConfig,
  
  // State
  type Workflow5State,
  createEmptyWorkflow5State,
  
  // Validation
  validateBrowsePhase,
  validateSelectPhaseTL,
  validateRoutePhase,
  validateWorkflow5Phase,
  type Workflow5PhaseValidation,
} from './workflow-5-spec';

// =============================================================================
// VERIFICATION GATES
// =============================================================================

export {
  // Types
  type VerificationStatus,
  type VerificationCriterion,
  type VerificationGate,
  type VerificationReport,
  type WorkflowVerificationState,
  type SessionHandoff,
  
  // Gate Factories
  createSprint1Gate,
  createSprint2Gate,
  createSprint3Gate,
  createSprint4Gate,
  createSprint5Gate,
  createSprint6Gate,
  
  // Gate Operations
  calculateGateStatus,
  updateCriterion,
  signOffGate,
  canProceedPastGate,
  
  // Reports
  generateVerificationReport,
  formatVerificationReportText,
  
  // Workflow Verification
  createWorkflowVerificationState,
  getNextGate,
  
  // Session Handoff
  createSessionHandoff,
  formatSessionHandoffMarkdown,
} from './verification-gates';
