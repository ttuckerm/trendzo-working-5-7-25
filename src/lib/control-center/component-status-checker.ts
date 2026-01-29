/**
 * Component Status Checker
 * 
 * FIXED: Now reads from 'component_results' table (Kai Orchestrator output)
 * instead of hard-coded arrays.
 * 
 * DATA FLOW:
 *   Kai Orchestrator → component_results table → This service → Control Center UI
 * 
 * BEFORE: Used hard-coded COMPONENT_LATENCIES and RECENTLY_USED_COMPONENTS arrays
 * AFTER:  Reads real latency, success rate, last run from component_results
 */

import { createClient } from '@supabase/supabase-js';
import { ComponentHealth, HealthStatus, EnhancementStatus } from './types';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
  );
}

// ============================================================================
// KAI ORCHESTRATOR'S 22 COMPONENTS (source of truth)
// ============================================================================

const KAI_COMPONENT_DEFINITIONS: Array<{
  id: string;
  name: string;
  description: string;
  category: 'ml' | 'llm' | 'framework' | 'service' | 'utility';
}> = [
  // ML Models
  { id: 'xgboost', name: 'XGBoost Predictor', description: 'Main ML model for DPS prediction', category: 'ml' },
  
  // LLMs
  { id: 'gpt4', name: 'GPT-4 Refinement', description: 'Qualitative analysis and refinement', category: 'llm' },
  { id: 'gemini', name: 'Gemini Pro', description: 'Google AI for video understanding', category: 'llm' },
  { id: 'claude', name: 'Claude', description: 'Anthropic AI for analysis', category: 'llm' },
  
  // Frameworks (core Kai components)
  { id: 'feature-extraction', name: 'Feature Extraction', description: 'Extracts 152 text features', category: 'framework' },
  { id: '7-legos', name: '7 Idea Legos', description: 'Pattern extraction framework', category: 'framework' },
  { id: '9-attributes', name: '9 Attributes', description: 'Viral attribute scoring', category: 'framework' },
  { id: '24-styles', name: '24 Video Styles', description: 'Style classification', category: 'framework' },
  { id: 'virality-matrix', name: 'Virality Matrix', description: 'TikTok virality scoring', category: 'framework' },
  { id: 'hook-scorer', name: 'Hook Scorer', description: 'Opening hook effectiveness', category: 'framework' },
  { id: 'pattern-extraction', name: 'Pattern Extraction', description: 'Viral pattern detection', category: 'framework' },
  
  // Services
  { id: 'whisper', name: 'Whisper Transcription', description: 'Audio transcription via OpenAI', category: 'service' },
  { id: 'ffmpeg', name: 'FFmpeg Visual', description: 'Video frame and visual analysis', category: 'service' },
  
  // Utilities
  { id: 'historical', name: 'Historical Analyzer', description: 'Historical performance analysis', category: 'utility' },
  { id: 'trend-timing-analyzer', name: 'Trend Timing', description: 'Trend timing optimization', category: 'utility' },
  { id: 'posting-time-optimizer', name: 'Posting Optimizer', description: 'Optimal posting time', category: 'utility' },
  { id: 'thumbnail-analyzer', name: 'Thumbnail Analyzer', description: 'Thumbnail effectiveness', category: 'utility' },
  { id: 'audio-analyzer', name: 'Audio Analyzer', description: 'Audio quality and pace analysis', category: 'utility' },
  { id: 'niche-keywords', name: 'Niche Keywords', description: 'Niche-specific keyword analysis', category: 'utility' },
  { id: 'visual-scene-detector', name: 'Visual Scene Detector', description: 'Scene detection and cuts', category: 'utility' }
];

// ============================================================================
// COMPONENT HEALTH FROM DATABASE
// ============================================================================

interface ComponentStats {
  componentId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  skippedRuns: number;
  avgLatencyMs: number;
  lastRun: string | null;
  lastError: string | null;
}

/**
 * Get real component statistics from component_results table
 * 
 * This replaces the old hard-coded arrays with actual data from Kai Orchestrator
 */
async function getComponentStatsFromDatabase(): Promise<Map<string, ComponentStats>> {
  const supabase = getSupabase();
  const statsMap = new Map<string, ComponentStats>();

  try {
    // Get component results from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('component_results')
      .select('component_id, success, skipped, latency_ms, error, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching component_results:', error);
      return statsMap;
    }

    if (!data || data.length === 0) {
      console.log('No component_results data found');
      return statsMap;
    }

    console.log(`Found ${data.length} component results from Kai Orchestrator`);

    // Aggregate stats by component
    const componentData: Record<string, {
      runs: Array<{ success: boolean; skipped: boolean; latency: number; error?: string; createdAt: string }>;
    }> = {};

    data.forEach(row => {
      if (!componentData[row.component_id]) {
        componentData[row.component_id] = { runs: [] };
      }
      componentData[row.component_id].runs.push({
        success: row.success,
        skipped: row.skipped,
        latency: row.latency_ms || 0,
        error: row.error,
        createdAt: row.created_at
      });
    });

    // Calculate stats for each component
    Object.entries(componentData).forEach(([componentId, { runs }]) => {
      const successfulRuns = runs.filter(r => r.success && !r.skipped).length;
      const failedRuns = runs.filter(r => !r.success && !r.skipped).length;
      const skippedRuns = runs.filter(r => r.skipped).length;
      const latencies = runs.filter(r => r.latency > 0).map(r => r.latency);
      const avgLatencyMs = latencies.length > 0 
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;
      const lastRun = runs[0]?.createdAt || null;
      const lastError = runs.find(r => r.error)?.error || null;

      statsMap.set(componentId, {
        componentId,
        totalRuns: runs.length,
        successfulRuns,
        failedRuns,
        skippedRuns,
        avgLatencyMs,
        lastRun,
        lastError
      });
    });

  } catch (error) {
    console.error('Error getting component stats:', error);
  }

  return statsMap;
}

/**
 * Check if Python service is running
 */
async function checkPythonService(): Promise<{ healthy: boolean; services: Record<string, string> }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('http://localhost:8001/health', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return { healthy: true, services: data.services || {} };
    }
    return { healthy: false, services: {} };
  } catch {
    return { healthy: false, services: {} };
  }
}

/**
 * Format time ago string
 */
function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${diffDays} days ago`;
}

// ============================================================================
// MAIN HEALTH CHECK FUNCTION
// ============================================================================

/**
 * Check health of all Kai Orchestrator components using REAL DATA
 * 
 * BEFORE: Used hard-coded COMPONENT_LATENCIES and RECENTLY_USED_COMPONENTS
 * AFTER:  Reads from component_results table (Kai's actual output)
 */
export async function checkAllComponentsHealth(): Promise<ComponentHealth[]> {
  const [pythonService, componentStats] = await Promise.all([
    checkPythonService(),
    getComponentStatsFromDatabase()
  ]);

  const results: ComponentHealth[] = [];
  
  for (const component of KAI_COMPONENT_DEFINITIONS) {
    const stats = componentStats.get(component.id);
    
    let status: HealthStatus = 'inactive';
    let latency: number | undefined;
    let lastRun: string = 'Never';
    let accuracy: number | undefined;
    let error: string | undefined;

    if (stats) {
      // Component has real data from Kai Orchestrator
      latency = stats.avgLatencyMs > 0 ? stats.avgLatencyMs : undefined;
      lastRun = formatTimeAgo(stats.lastRun);
      
      // Calculate success rate as "accuracy"
      const totalNonSkipped = stats.successfulRuns + stats.failedRuns;
      if (totalNonSkipped > 0) {
        accuracy = Math.round((stats.successfulRuns / totalNonSkipped) * 100);
      }

      // Determine status based on real data
      if (stats.failedRuns > stats.successfulRuns) {
        status = 'error';
        error = stats.lastError || 'High failure rate';
      } else if (stats.skippedRuns > stats.successfulRuns) {
        status = 'warning';
        error = 'Frequently skipped';
      } else if (stats.successfulRuns > 0) {
        status = 'healthy';
      } else {
        status = 'inactive';
      }
    }

    // Special handling for Python-dependent components
    // if (['python-analysis'].includes(component.id)) {
    //   if (!pythonService.healthy) {
    //     status = 'error';
    //     error = 'Python service not responding';
    //   }
    // }

    results.push({
      id: component.id,
      name: component.name,
      description: component.description,
      category: component.category,
      status,
      latency,
      lastRun,
      accuracy,
      error,
      // Add source metadata for transparency
      dataSource: stats ? 'component_results' : 'no_data'
    });
  }
  
  return results;
}

// ============================================================================
// ENHANCEMENT STATUS
// ============================================================================

/**
 * Check Python service enhancements
 */
export async function checkEnhancementsStatus(): Promise<EnhancementStatus[]> {
  const pythonService = await checkPythonService();
  
  return [
    {
      id: 'vader-sentiment',
      name: 'VADER Sentiment',
      description: 'Social media sentiment analysis',
      installed: true,
      connected: pythonService.healthy,
      usedInPredictions: true,
      lastUsed: undefined,
      error: !pythonService.healthy ? 'Python service not responding' : undefined
    },
    {
      id: 'pyscenedetect',
      name: 'PySceneDetect',
      description: 'Scene/cut detection in videos',
      installed: true,
      connected: pythonService.healthy,
      usedInPredictions: false,
      lastUsed: undefined,
      error: !pythonService.healthy ? 'Python service not responding' : undefined
    },
    {
      id: 'faster-whisper',
      name: 'faster-whisper',
      description: 'Fast local transcription',
      installed: true,
      connected: pythonService.healthy,
      usedInPredictions: false,
      lastUsed: undefined,
      error: !pythonService.healthy ? 'Python service not responding' : undefined
    },
    {
      id: 'shap-explainer',
      name: 'SHAP Explainer',
      description: 'XGBoost prediction explainability',
      installed: true,
      connected: pythonService.healthy,
      usedInPredictions: false,
      lastUsed: undefined,
      error: !pythonService.healthy ? 'Python service not responding' : undefined
    }
  ];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get component counts by status
 */
export function getComponentCountByStatus(components: ComponentHealth[]): { 
  active: number; 
  inactive: number; 
  error: number; 
  total: number 
} {
  return {
    active: components.filter(c => c.status === 'healthy' || c.status === 'running').length,
    inactive: components.filter(c => c.status === 'inactive').length,
    error: components.filter(c => c.status === 'error' || c.status === 'warning').length,
    total: components.length
  };
}

/**
 * Calculate average latency from real component data
 */
export function calculateAverageLatency(components: ComponentHealth[]): number {
  const latencies = components.filter(c => c.latency).map(c => c.latency!);
  if (latencies.length === 0) return 0;
  return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
}

/**
 * Get summary statistics for display
 */
export async function getComponentSummaryStats(): Promise<{
  totalComponents: number;
  activeComponents: number;
  totalRuns: number;
  avgSuccessRate: number;
  avgLatencyMs: number;
  lastActivity: string | null;
  dataSource: string;
}> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('component_results')
    .select('success, latency_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error || !data) {
    return {
      totalComponents: KAI_COMPONENT_DEFINITIONS.length,
      activeComponents: 0,
      totalRuns: 0,
      avgSuccessRate: 0,
      avgLatencyMs: 0,
      lastActivity: null,
      dataSource: 'component_results (no data)'
    };
  }

  const successCount = data.filter(r => r.success).length;
  const latencies = data.filter(r => r.latency_ms > 0).map(r => r.latency_ms);
  const avgLatency = latencies.length > 0 
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;

  return {
    totalComponents: KAI_COMPONENT_DEFINITIONS.length,
    activeComponents: new Set(data.map(r => (r as any).component_id)).size,
    totalRuns: data.length,
    avgSuccessRate: data.length > 0 ? Math.round((successCount / data.length) * 100) : 0,
    avgLatencyMs: avgLatency,
    lastActivity: data[0]?.created_at || null,
    dataSource: 'component_results'
  };
}




