/**
 * TRENDZO WORKFLOW CONFIGURATION
 * 
 * Comprehensive workflow management system for the Trendzo platform
 * Defines all available workflows, their steps, configurations, and integrations
 * with the sandbox environment and production systems.
 */

import { trendzoBrand } from '../branding/trendzo-brand';
import { getSandboxDatabase } from '../database/sandbox-database';

// ===== WORKFLOW TYPES =====

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  component: string;
  estimated_time: number; // in minutes
  required_data: string[];
  optional_data: string[];
  validation_rules: ValidationRule[];
  next_steps: string[];
  can_skip: boolean;
  help_text?: string;
  tips?: string[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
  custom_validator?: (value: any) => boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: 'content_creation' | 'analysis' | 'optimization' | 'campaign' | 'learning';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number; // in minutes
  prerequisites: string[];
  outcomes: string[];
  steps: WorkflowStep[];
  integrations: WorkflowIntegration[];
  metadata: {
    version: string;
    created_at: string;
    updated_at: string;
    author: string;
    tags: string[];
  };
}

export interface WorkflowIntegration {
  type: 'database' | 'api' | 'ai_service' | 'analytics' | 'export';
  service: string;
  endpoint?: string;
  required_permissions: string[];
  configuration: Record<string, any>;
}

// ===== WORKFLOW CATALOG =====

export const workflowCatalog: Record<string, WorkflowDefinition> = {
  // ===== QUICK WIN WORKFLOW =====
  quick_win: {
    id: 'quick_win',
    name: 'Quick Win Workflow',
    description: 'Streamlined process from idea to viral content in minutes',
    category: 'content_creation',
    difficulty: 'beginner',
    estimated_duration: 15,
    prerequisites: [],
    outcomes: [
      'Viral content prediction',
      'Optimized content structure',
      'Platform-specific recommendations',
      'Publishing schedule'
    ],
    steps: [
      {
        id: 'onboarding',
        title: 'Getting Started',
        description: 'Set your niche, goals, and platform preferences',
        component: 'OnboardingStep',
        estimated_time: 3,
        required_data: ['niche', 'primary_goal', 'target_platform'],
        optional_data: ['secondary_platforms', 'audience_size', 'content_type_preference'],
        validation_rules: [
          {
            field: 'niche',
            type: 'required',
            message: 'Please select your content niche'
          },
          {
            field: 'primary_goal',
            type: 'required',
            message: 'Please specify your primary goal'
          }
        ],
        next_steps: ['gallery'],
        can_skip: false,
        help_text: 'This helps us personalize your experience and provide better recommendations.',
        tips: [
          'Choose the niche you\'re most passionate about',
          'Your primary goal will influence our recommendations',
          'You can change these settings later'
        ]
      },
      {
        id: 'gallery',
        title: 'Template Gallery',
        description: 'Browse and select from high-performing viral templates',
        component: 'GalleryStep',
        estimated_time: 5,
        required_data: ['selected_template'],
        optional_data: ['template_customizations', 'inspiration_notes'],
        validation_rules: [
          {
            field: 'selected_template',
            type: 'required',
            message: 'Please select a template to continue'
          }
        ],
        next_steps: ['script'],
        can_skip: false,
        help_text: 'Templates are proven structures that increase your chances of going viral.',
        tips: [
          'Look for templates with high success rates in your niche',
          'Consider templates that match your content style',
          'You can customize any template to fit your needs'
        ]
      },
      {
        id: 'script',
        title: 'Script Creation',
        description: 'Generate and refine your content script using AI',
        component: 'ScriptStep',
        estimated_time: 4,
        required_data: ['script_content'],
        optional_data: ['tone_adjustments', 'length_preference', 'call_to_action'],
        validation_rules: [
          {
            field: 'script_content',
            type: 'min_length',
            value: 10,
            message: 'Script must be at least 10 characters long'
          },
          {
            field: 'script_content',
            type: 'max_length',
            value: 2000,
            message: 'Script must be less than 2000 characters'
          }
        ],
        next_steps: ['analysis'],
        can_skip: false,
        help_text: 'Our AI will help you create compelling content that resonates with your audience.',
        tips: [
          'Start with a strong hook in the first 3 seconds',
          'Keep your message clear and focused',
          'Include a clear call-to-action'
        ]
      },
      {
        id: 'analysis',
        title: 'Viral Analysis',
        description: 'Get AI-powered predictions and optimization suggestions',
        component: 'AnalysisStep',
        estimated_time: 2,
        required_data: [],
        optional_data: ['analysis_preferences', 'focus_areas'],
        validation_rules: [],
        next_steps: ['schedule'],
        can_skip: true,
        help_text: 'Our analysis provides insights into your content\'s viral potential.',
        tips: [
          'Pay attention to the hook strength score',
          'Consider the timing recommendations',
          'Review platform-specific optimizations'
        ]
      },
      {
        id: 'schedule',
        title: 'Publishing Schedule',
        description: 'Plan your content release for maximum impact',
        component: 'ScheduleStep',
        estimated_time: 1,
        required_data: [],
        optional_data: ['preferred_times', 'timezone', 'frequency'],
        validation_rules: [],
        next_steps: [],
        can_skip: true,
        help_text: 'Timing can significantly impact your content\'s reach and engagement.',
        tips: [
          'Post when your audience is most active',
          'Consider time zones for global reach',
          'Consistency is key for building an audience'
        ]
      }
    ],
    integrations: [
      {
        type: 'ai_service',
        service: 'viral_prediction_engine',
        required_permissions: ['predict', 'analyze'],
        configuration: {
          model_version: 'v2.1',
          confidence_threshold: 0.7
        }
      },
      {
        type: 'database',
        service: 'sandbox_database',
        required_permissions: ['read', 'write'],
        configuration: {
          tables: ['workflow_sessions', 'viral_predictions', 'content_templates']
        }
      },
      {
        type: 'analytics',
        service: 'workflow_analytics',
        required_permissions: ['track'],
        configuration: {
          events: ['step_completed', 'workflow_finished', 'template_selected']
        }
      }
    ],
    metadata: {
      version: '2.1.0',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-11-02T00:00:00Z',
      author: 'Trendzo Team',
      tags: ['quick', 'beginner', 'viral', 'content_creation']
    }
  },

  // ===== DEEP ANALYSIS WORKFLOW =====
  deep_analysis: {
    id: 'deep_analysis',
    name: 'Deep Analysis Workflow',
    description: 'Comprehensive content analysis with advanced AI insights',
    category: 'analysis',
    difficulty: 'intermediate',
    estimated_duration: 30,
    prerequisites: ['basic_content_knowledge'],
    outcomes: [
      'Detailed viral potential report',
      'Competitor analysis',
      'Trend alignment assessment',
      'Optimization roadmap'
    ],
    steps: [
      {
        id: 'content_input',
        title: 'Content Input',
        description: 'Upload or input your content for analysis',
        component: 'ContentInputStep',
        estimated_time: 5,
        required_data: ['content'],
        optional_data: ['content_type', 'target_audience', 'goals'],
        validation_rules: [
          {
            field: 'content',
            type: 'required',
            message: 'Please provide content to analyze'
          }
        ],
        next_steps: ['viral_analysis'],
        can_skip: false
      },
      {
        id: 'viral_analysis',
        title: 'Viral Potential Analysis',
        description: 'AI-powered analysis of viral potential',
        component: 'ViralAnalysisStep',
        estimated_time: 8,
        required_data: [],
        optional_data: ['analysis_depth', 'focus_metrics'],
        validation_rules: [],
        next_steps: ['competitor_analysis'],
        can_skip: false
      },
      {
        id: 'competitor_analysis',
        title: 'Competitor Analysis',
        description: 'Compare against similar successful content',
        component: 'CompetitorAnalysisStep',
        estimated_time: 10,
        required_data: [],
        optional_data: ['competitor_list', 'comparison_metrics'],
        validation_rules: [],
        next_steps: ['trend_analysis'],
        can_skip: true
      },
      {
        id: 'trend_analysis',
        title: 'Trend Analysis',
        description: 'Assess alignment with current trends',
        component: 'TrendAnalysisStep',
        estimated_time: 5,
        required_data: [],
        optional_data: ['trend_categories', 'time_range'],
        validation_rules: [],
        next_steps: ['recommendations'],
        can_skip: true
      },
      {
        id: 'recommendations',
        title: 'Optimization Recommendations',
        description: 'Get actionable improvement suggestions',
        component: 'RecommendationsStep',
        estimated_time: 2,
        required_data: [],
        optional_data: ['priority_areas'],
        validation_rules: [],
        next_steps: [],
        can_skip: false
      }
    ],
    integrations: [
      {
        type: 'ai_service',
        service: 'advanced_analysis_engine',
        required_permissions: ['analyze', 'compare', 'predict'],
        configuration: {
          analysis_depth: 'comprehensive',
          include_competitor_data: true,
          trend_analysis: true
        }
      },
      {
        type: 'api',
        service: 'trend_data_api',
        endpoint: '/api/trends/current',
        required_permissions: ['read'],
        configuration: {
          platforms: ['tiktok', 'instagram', 'youtube'],
          time_range: '30d'
        }
      }
    ],
    metadata: {
      version: '1.5.0',
      created_at: '2024-02-01T00:00:00Z',
      updated_at: '2024-11-02T00:00:00Z',
      author: 'Trendzo Team',
      tags: ['analysis', 'advanced', 'comprehensive', 'ai']
    }
  },

  // ===== CAMPAIGN WORKFLOW =====
  campaign_management: {
    id: 'campaign_management',
    name: 'Campaign Management',
    description: 'Orchestrate multi-platform viral campaigns',
    category: 'campaign',
    difficulty: 'advanced',
    estimated_duration: 60,
    prerequisites: ['content_creation_experience', 'platform_knowledge'],
    outcomes: [
      'Multi-platform campaign strategy',
      'Content calendar',
      'Performance tracking setup',
      'Optimization schedule'
    ],
    steps: [
      {
        id: 'campaign_setup',
        title: 'Campaign Setup',
        description: 'Define campaign goals, audience, and platforms',
        component: 'CampaignSetupStep',
        estimated_time: 15,
        required_data: ['campaign_name', 'objectives', 'target_platforms'],
        optional_data: ['budget', 'duration', 'kpis'],
        validation_rules: [
          {
            field: 'campaign_name',
            type: 'required',
            message: 'Campaign name is required'
          },
          {
            field: 'objectives',
            type: 'required',
            message: 'Please define campaign objectives'
          }
        ],
        next_steps: ['content_planning'],
        can_skip: false
      },
      {
        id: 'content_planning',
        title: 'Content Planning',
        description: 'Plan content pieces for each platform',
        component: 'ContentPlanningStep',
        estimated_time: 20,
        required_data: ['content_pieces'],
        optional_data: ['content_themes', 'posting_frequency'],
        validation_rules: [
          {
            field: 'content_pieces',
            type: 'custom',
            message: 'At least one content piece is required',
            custom_validator: (value) => Array.isArray(value) && value.length > 0
          }
        ],
        next_steps: ['scheduling'],
        can_skip: false
      },
      {
        id: 'scheduling',
        title: 'Content Scheduling',
        description: 'Create optimal posting schedule',
        component: 'SchedulingStep',
        estimated_time: 15,
        required_data: ['posting_schedule'],
        optional_data: ['timezone_preferences', 'audience_insights'],
        validation_rules: [],
        next_steps: ['monitoring_setup'],
        can_skip: false
      },
      {
        id: 'monitoring_setup',
        title: 'Monitoring Setup',
        description: 'Configure performance tracking and alerts',
        component: 'MonitoringSetupStep',
        estimated_time: 10,
        required_data: [],
        optional_data: ['alert_thresholds', 'reporting_frequency'],
        validation_rules: [],
        next_steps: [],
        can_skip: true
      }
    ],
    integrations: [
      {
        type: 'api',
        service: 'social_media_apis',
        required_permissions: ['post', 'schedule', 'analytics'],
        configuration: {
          platforms: ['tiktok', 'instagram', 'youtube', 'twitter'],
          auto_posting: true
        }
      },
      {
        type: 'analytics',
        service: 'campaign_analytics',
        required_permissions: ['track', 'report'],
        configuration: {
          real_time_monitoring: true,
          custom_dashboards: true
        }
      }
    ],
    metadata: {
      version: '1.0.0',
      created_at: '2024-03-01T00:00:00Z',
      updated_at: '2024-11-02T00:00:00Z',
      author: 'Trendzo Team',
      tags: ['campaign', 'advanced', 'multi_platform', 'management']
    }
  },

  // ===== LEARNING WORKFLOW =====
  viral_mastery: {
    id: 'viral_mastery',
    name: 'Viral Mastery Learning Path',
    description: 'Comprehensive learning journey to master viral content creation',
    category: 'learning',
    difficulty: 'beginner',
    estimated_duration: 120,
    prerequisites: [],
    outcomes: [
      'Understanding of viral mechanics',
      'Platform-specific expertise',
      'Content optimization skills',
      'Analytics interpretation'
    ],
    steps: [
      {
        id: 'fundamentals',
        title: 'Viral Fundamentals',
        description: 'Learn the core principles of viral content',
        component: 'FundamentalsStep',
        estimated_time: 30,
        required_data: [],
        optional_data: ['learning_pace', 'focus_areas'],
        validation_rules: [],
        next_steps: ['platform_mastery'],
        can_skip: false
      },
      {
        id: 'platform_mastery',
        title: 'Platform Mastery',
        description: 'Deep dive into platform-specific strategies',
        component: 'PlatformMasteryStep',
        estimated_time: 45,
        required_data: ['selected_platforms'],
        optional_data: ['specialization_areas'],
        validation_rules: [
          {
            field: 'selected_platforms',
            type: 'required',
            message: 'Please select at least one platform to master'
          }
        ],
        next_steps: ['practical_exercises'],
        can_skip: false
      },
      {
        id: 'practical_exercises',
        title: 'Practical Exercises',
        description: 'Hands-on practice with real content creation',
        component: 'PracticalExercisesStep',
        estimated_time: 30,
        required_data: ['completed_exercises'],
        optional_data: ['exercise_preferences'],
        validation_rules: [],
        next_steps: ['mastery_assessment'],
        can_skip: false
      },
      {
        id: 'mastery_assessment',
        title: 'Mastery Assessment',
        description: 'Test your knowledge and get certified',
        component: 'MasteryAssessmentStep',
        estimated_time: 15,
        required_data: ['assessment_completion'],
        optional_data: [],
        validation_rules: [
          {
            field: 'assessment_completion',
            type: 'required',
            message: 'Please complete the assessment'
          }
        ],
        next_steps: [],
        can_skip: false
      }
    ],
    integrations: [
      {
        type: 'database',
        service: 'learning_management',
        required_permissions: ['read', 'write', 'progress_tracking'],
        configuration: {
          track_progress: true,
          issue_certificates: true
        }
      }
    ],
    metadata: {
      version: '1.2.0',
      created_at: '2024-04-01T00:00:00Z',
      updated_at: '2024-11-02T00:00:00Z',
      author: 'Trendzo Education Team',
      tags: ['learning', 'education', 'mastery', 'certification']
    }
  }
};

// ===== WORKFLOW MANAGER =====

export class WorkflowManager {
  private static instance: WorkflowManager;
  private database = getSandboxDatabase();
  private activeWorkflows: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): WorkflowManager {
    if (!WorkflowManager.instance) {
      WorkflowManager.instance = new WorkflowManager();
    }
    return WorkflowManager.instance;
  }

  // ===== WORKFLOW OPERATIONS =====

  /**
   * Get workflow definition by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | null {
    return workflowCatalog[workflowId] || null;
  }

  /**
   * Get all available workflows
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Object.values(workflowCatalog);
  }

  /**
   * Get workflows by category
   */
  getWorkflowsByCategory(category: WorkflowDefinition['category']): WorkflowDefinition[] {
    return Object.values(workflowCatalog).filter(workflow => workflow.category === category);
  }

  /**
   * Get workflows by difficulty
   */
  getWorkflowsByDifficulty(difficulty: WorkflowDefinition['difficulty']): WorkflowDefinition[] {
    return Object.values(workflowCatalog).filter(workflow => workflow.difficulty === difficulty);
  }

  /**
   * Search workflows
   */
  searchWorkflows(query: string): WorkflowDefinition[] {
    const searchTerm = query.toLowerCase();
    return Object.values(workflowCatalog).filter(workflow => 
      workflow.name.toLowerCase().includes(searchTerm) ||
      workflow.description.toLowerCase().includes(searchTerm) ||
      workflow.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // ===== SESSION MANAGEMENT =====

  /**
   * Start a new workflow session
   */
  async startWorkflowSession(workflowId: string, userId: string): Promise<string | null> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) return null;

    try {
      const session = await this.database.createWorkflowSession({
        user_id: userId,
        workflow_type: workflowId,
        current_step: 0,
        total_steps: workflow.steps.length,
        session_data: {
          workflow_id: workflowId,
          started_at: new Date().toISOString(),
          steps_completed: [],
          current_data: {}
        },
        status: 'active'
      });

      if (session) {
        this.activeWorkflows.set(session.id, {
          session,
          workflow,
          current_step_index: 0
        });

        // Track workflow start
        await this.database.trackEvent({
          user_id: userId,
          event_type: 'workflow_started',
          event_data: {
            workflow_id: workflowId,
            session_id: session.id
          }
        });

        return session.id;
      }

      return null;
    } catch (error) {
      console.error('Failed to start workflow session:', error);
      return null;
    }
  }

  /**
   * Get current step for a session
   */
  getCurrentStep(sessionId: string): WorkflowStep | null {
    const activeWorkflow = this.activeWorkflows.get(sessionId);
    if (!activeWorkflow) return null;

    const { workflow, current_step_index } = activeWorkflow;
    return workflow.steps[current_step_index] || null;
  }

  /**
   * Complete current step and move to next
   */
  async completeStep(sessionId: string, stepData: any): Promise<boolean> {
    const activeWorkflow = this.activeWorkflows.get(sessionId);
    if (!activeWorkflow) return false;

    const { session, workflow, current_step_index } = activeWorkflow;
    const currentStep = workflow.steps[current_step_index];

    if (!currentStep) return false;

    try {
      // Validate step data
      const isValid = this.validateStepData(currentStep, stepData);
      if (!isValid) return false;

      // Update session data
      const updatedSessionData = {
        ...session.session_data,
        current_data: {
          ...session.session_data.current_data,
          [currentStep.id]: stepData
        },
        steps_completed: [
          ...session.session_data.steps_completed,
          currentStep.id
        ]
      };

      const nextStepIndex = current_step_index + 1;
      const isWorkflowComplete = nextStepIndex >= workflow.steps.length;

      // Update database
      await this.database.updateWorkflowSession(sessionId, {
        current_step: nextStepIndex,
        session_data: updatedSessionData,
        status: isWorkflowComplete ? 'completed' : 'active',
        completed_at: isWorkflowComplete ? new Date().toISOString() : undefined
      });

      // Update active workflow
      this.activeWorkflows.set(sessionId, {
        ...activeWorkflow,
        current_step_index: nextStepIndex
      });

      // Track step completion
      await this.database.trackEvent({
        user_id: session.user_id,
        event_type: 'workflow_step_completed',
        event_data: {
          workflow_id: workflow.id,
          session_id: sessionId,
          step_id: currentStep.id,
          step_data: stepData
        }
      });

      if (isWorkflowComplete) {
        await this.database.trackEvent({
          user_id: session.user_id,
          event_type: 'workflow_completed',
          event_data: {
            workflow_id: workflow.id,
            session_id: sessionId,
            total_time: Date.now() - new Date(session.started_at).getTime()
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to complete step:', error);
      return false;
    }
  }

  /**
   * Validate step data against rules
   */
  private validateStepData(step: WorkflowStep, data: any): boolean {
    for (const rule of step.validation_rules) {
      const value = data[rule.field];

      switch (rule.type) {
        case 'required':
          if (!value) return false;
          break;
        case 'min_length':
          if (typeof value === 'string' && value.length < rule.value) return false;
          break;
        case 'max_length':
          if (typeof value === 'string' && value.length > rule.value) return false;
          break;
        case 'pattern':
          if (typeof value === 'string' && !new RegExp(rule.value).test(value)) return false;
          break;
        case 'custom':
          if (rule.custom_validator && !rule.custom_validator(value)) return false;
          break;
      }
    }

    return true;
  }

  // ===== UTILITY METHODS =====

  /**
   * Get workflow progress
   */
  getWorkflowProgress(sessionId: string): { current: number; total: number; percentage: number } | null {
    const activeWorkflow = this.activeWorkflows.get(sessionId);
    if (!activeWorkflow) return null;

    const { workflow, current_step_index } = activeWorkflow;
    
    return {
      current: current_step_index,
      total: workflow.steps.length,
      percentage: Math.round((current_step_index / workflow.steps.length) * 100)
    };
  }

  /**
   * Get estimated time remaining
   */
  getEstimatedTimeRemaining(sessionId: string): number {
    const activeWorkflow = this.activeWorkflows.get(sessionId);
    if (!activeWorkflow) return 0;

    const { workflow, current_step_index } = activeWorkflow;
    
    return workflow.steps
      .slice(current_step_index)
      .reduce((total, step) => total + step.estimated_time, 0);
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get workflow manager instance
 */
export function getWorkflowManager(): WorkflowManager {
  return WorkflowManager.getInstance();
}

/**
 * Quick workflow getter
 */
export function getWorkflow(workflowId: string): WorkflowDefinition | null {
  return workflowCatalog[workflowId] || null;
}

/**
 * Get recommended workflows for user
 */
export function getRecommendedWorkflows(userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): WorkflowDefinition[] {
  return Object.values(workflowCatalog)
    .filter(workflow => workflow.difficulty === userLevel)
    .sort((a, b) => a.estimated_duration - b.estimated_duration);
}

export default WorkflowManager;





















