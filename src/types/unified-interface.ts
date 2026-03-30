// Unified Interface Architecture Types
// Based on Creative Phase Architecture Design

export type InterfaceMode = 'focus' | 'deepdive' | 'demo';
export type DisclosureLayer = 'primary' | 'secondary' | 'tertiary';
export type LoadingStrategy = 'eager' | 'lazy' | 'on-demand';

// Core State Interfaces
export interface UnifiedState {
  // System-wide state
  currentMode: InterfaceMode;
  userPatterns: UserBehaviorData;
  systemMetrics: SystemHealthData;
  
  // Component-specific state
  recipeBook: RecipeBookState;
  armory: ArmoryState;
  provingGrounds: ProvingGroundsState;
  
  // Disclosure control state
  layerVisibility: LayerVisibilityState;
  componentExpansion: ComponentExpansionState;
  
  // Adaptive intelligence state
  adaptiveData: AdaptiveLearningData;
}

// User Behavior & Analytics
export interface UserBehaviorData {
  usagePatterns: UsagePattern[];
  recentActions: UserAction[];
  preferredWorkflows: WorkflowPreference[];
  sessionData: SessionData;
}

export interface UsagePattern {
  id: string;
  componentId: string;
  frequency: number;
  lastUsed: Date;
  duration: number;
  context: UserContext;
}

export interface UserAction {
  id: string;
  type: 'click' | 'navigate' | 'expand' | 'collapse' | 'mode_switch';
  componentId: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

// System Health & Metrics
export interface SystemHealthData {
  modules: ModuleHealthData[];
  overall: OverallSystemMetrics;
  alerts: AlertData[];
  lastUpdate: Date;
}

export interface ModuleHealthData {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: Record<string, number>;
  lastCheck: Date;
}

// Component State Interfaces
export interface RecipeBookState {
  activeTab: RecipeBookTab;
  templates: TemplateData[];
  analytics: AnalyticsData;
  filters: FilterState;
  searchQuery: string;
}

export interface ArmoryState {
  selectedFramework: FrameworkData | null;
  deploymentStatus: DeploymentState;
  successMetrics: FrameworkMetrics;
  availableFrameworks: FrameworkData[];
}

export interface ProvingGroundsState {
  moduleHealth: ModuleHealthData[];
  systemPerformance: PerformanceMetrics;
  realTimeAlerts: AlertData[];
  analyticsView: 'overview' | 'detailed' | 'trends';
}

// Disclosure Control
export interface LayerVisibilityState {
  primary: LayerConfig;
  secondary: LayerConfig;
  tertiary: LayerConfig;
}

export interface LayerConfig {
  visible: boolean;
  components: ComponentVisibility[];
  transitionState: 'stable' | 'expanding' | 'collapsing';
}

export interface ComponentVisibility {
  componentId: string;
  visible: boolean;
  loadingStrategy: LoadingStrategy;
  priority: number;
}

export interface ComponentExpansionState {
  expandedPanels: Set<string>;
  modalStack: string[];
  slideOutActive: string | null;
}

// Adaptive Intelligence
export interface AdaptiveLearningData {
  userProfile: UserProfile;
  contextModel: ContextModel;
  predictionModel: PredictionModel;
  learningMetrics: LearningMetrics;
}

export interface UserProfile {
  role: 'operator' | 'analyst' | 'presenter' | 'admin';
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferences: UserPreferences;
  workflowHistory: WorkflowHistory[];
}

// Context & Environment
export interface UserContext {
  currentTask: 'monitoring' | 'analysis' | 'deployment' | 'presentation';
  timeContext: 'work_hours' | 'off_hours' | 'deadline_pressure';
  systemContext: 'high_activity' | 'normal' | 'maintenance';
  deviceContext: 'desktop' | 'tablet' | 'mobile';
}

// Smart Loading & Performance
export interface ComponentLoadingConfig {
  componentId: string;
  loadingStrategy: LoadingStrategy;
  dependencies: string[];
  priority: number;
  cacheStrategy: CacheStrategy;
}

export interface CacheStrategy {
  type: 'memory' | 'session' | 'persistent';
  ttl: number;
  invalidationRules: string[];
}

// Mode-Specific Configurations
export interface ModeConfiguration {
  mode: InterfaceMode;
  layerVisibility: {
    primary: boolean;
    secondary: boolean;
    tertiary: boolean;
  };
  componentPriorities: ComponentPriority[];
  transitionSettings: TransitionSettings;
}

export interface ComponentPriority {
  componentId: string;
  priority: number;
  loadOrder: number;
}

export interface TransitionSettings {
  duration: number;
  easing: string;
  stagger: number;
}

// Data Types for existing components
export interface TemplateData {
  id: string;
  title: string;
  category: string;
  metrics: TemplateMetrics;
  status: 'active' | 'draft' | 'archived';
}

export interface FrameworkData {
  id: string;
  name: string;
  category: string;
  successRate: number;
  usageCount: number;
  lastUsed: Date;
}

export interface AlertData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  source: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Additional supporting types
export type RecipeBookTab = 'templates' | 'analyzer' | 'dashboard' | 'scripts' | 'optimize' | 'abtest' | 'inception' | 'validate';
export type DeploymentState = 'idle' | 'deploying' | 'deployed' | 'failed';

export interface AnalyticsData {
  views: number;
  engagement: number;
  performance: number;
  trends: TrendData[];
}

export interface PerformanceMetrics {
  cpu: number;
  memory: number;
  network: number;
  responseTime: number;
}

export interface FilterState {
  category: string[];
  status: string[];
  dateRange: DateRange;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// Event System
export interface ComponentEvent {
  type: string;
  source: string;
  target?: string;
  data: any;
  timestamp: Date;
}

export interface LoadingEvent {
  componentId: string;
  status: 'started' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

export interface ModeEvent {
  fromMode: InterfaceMode;
  toMode: InterfaceMode;
  trigger: 'user' | 'system' | 'adaptive';
  timestamp: Date;
}

// Additional utility types
export interface SessionData {
  sessionId: string;
  startTime: Date;
  duration: number;
  activityLevel: 'low' | 'medium' | 'high';
}

export interface WorkflowPreference {
  workflowId: string;
  frequency: number;
  efficiency: number;
  satisfaction: number;
}

export interface ContextModel {
  predictions: ContextPrediction[];
  confidence: number;
  lastUpdated: Date;
}

export interface PredictionModel {
  nextActions: ActionPrediction[];
  componentUsage: ComponentUsagePrediction[];
  workflowSuggestions: WorkflowSuggestion[];
}

export interface LearningMetrics {
  adaptationRate: number;
  predictionAccuracy: number;
  userSatisfaction: number;
  systemPerformance: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
  animations: boolean;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  system: boolean;
  alerts: boolean;
  updates: boolean;
  sound: boolean;
}

export interface WorkflowHistory {
  workflowId: string;
  steps: WorkflowStep[];
  duration: number;
  outcome: 'completed' | 'abandoned' | 'failed';
  timestamp: Date;
}

export interface WorkflowStep {
  stepId: string;
  componentId: string;
  action: string;
  duration: number;
  success: boolean;
}

export interface OverallSystemMetrics {
  uptime: number;
  performance: number;
  reliability: number;
  userSatisfaction: number;
}

export interface FrameworkMetrics {
  deployments: number;
  successRate: number;
  averagePerformance: number;
  userRating: number;
}

export interface TemplateMetrics {
  views: number;
  usage: number;
  rating: number;
  performance: number;
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
}

export interface ContextPrediction {
  context: UserContext;
  probability: number;
  confidence: number;
}

export interface ActionPrediction {
  action: UserAction;
  probability: number;
  timing: number;
}

export interface ComponentUsagePrediction {
  componentId: string;
  usageProbability: number;
  optimalLoadTime: number;
}

export interface WorkflowSuggestion {
  workflowId: string;
  relevanceScore: number;
  expectedBenefit: number;
  description: string;
}