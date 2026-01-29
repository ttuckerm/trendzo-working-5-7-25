// Control Center Type Definitions

// Status types
export type HealthStatus = 'healthy' | 'warning' | 'error' | 'inactive' | 'running';

// Page definition
export interface PageDefinition {
  id: string;
  name: string;
  path: string;
  description: string;
  icon: string; // Lucide icon name
  workflows: WorkflowDefinition[];
  components: string[]; // Component IDs this page uses
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
}

// Page health check result
export interface PageHealth {
  id: string;
  name: string;
  path: string;
  description: string;
  icon: string;
  status: HealthStatus;
  lastChecked: string;
  lastError?: string;
  workflows: WorkflowHealth[];
  components: string[];
  metrics?: {
    label: string;
    value: string;
  }[];
}

export interface WorkflowHealth {
  id: string;
  name: string;
  status: HealthStatus;
  lastRun?: string;
  error?: string;
}

// AI Component definition
export interface ComponentDefinition {
  id: string;
  name: string;
  description: string;
  category: 'ml' | 'llm' | 'framework' | 'service' | 'utility';
  healthCheckEndpoint?: string;
}

// Component health check result
export interface ComponentHealth {
  id: string;
  name: string;
  description: string;
  category: string;
  status: HealthStatus;
  latency?: number; // ms
  lastRun?: string;
  accuracy?: number; // percentage (success rate from component_results)
  error?: string;
  config?: Record<string, unknown>;
  dataSource?: string; // 'component_results' or 'no_data' - for transparency
}

// Prediction accuracy
export interface PredictionRecord {
  id: string;
  date: string;
  videoId: string;
  predicted: number;
  actual: number;
  error: number;
  componentScores: {
    componentId: string;
    componentName: string;
    score: number;
    weight: number;
  }[];
}

// Enhancement status
export interface EnhancementStatus {
  id: string;
  name: string;
  description: string;
  installed: boolean;
  connected: boolean;
  usedInPredictions: boolean;
  lastUsed?: string;
  error?: string;
}

// System health summary
export interface SystemHealthSummary {
  pagesHealthy: number;
  pagesWarning: number;
  pagesError: number;
  componentsActive: number;
  componentsTotal: number;
  avgAccuracy: number;
  avgLatency: number;
  lastUpdated: string;
}

// Error log entry
export interface ErrorLogEntry {
  id: string;
  source: string;
  sourcePath?: string;
  message: string;
  timestamp: string;
  severity: 'error' | 'warning' | 'info';
  resolved: boolean;
}

// Accuracy data for charts
export interface AccuracyDataPoint {
  date: string;
  predicted: number;
  actual: number;
  error: number;
}

export interface ComponentScore {
  name: string;
  score: number;
  weight: number;
}

export interface AccuracyData {
  predictions: AccuracyDataPoint[];
  avgAccuracy: number;
  lastPrediction: {
    predicted: number;
    actual: number;
    error: number;
    componentScores: ComponentScore[];
  } | null;
}
































































































