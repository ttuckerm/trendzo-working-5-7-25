/**
 * PERFORMANCE-ENGINEER: Production-Ready Latency Profiler
 * 
 * Measures and identifies bottlenecks in the viral prediction algorithm
 * to achieve <100ms target latency
 */
export class PerformanceProfiler {
  private measurements: Map<string, number[]> = new Map();
  private currentSession: Map<string, number> = new Map();
  private sessionId: string = '';

  startProfiling(sessionId: string): void {
    this.sessionId = sessionId;
    this.currentSession.clear();
    this.currentSession.set('session_start', Date.now());
  }

  mark(label: string): void {
    if (!this.sessionId) return;
    this.currentSession.set(label, Date.now());
  }

  measureDuration(startLabel: string, endLabel: string): number {
    const start = this.currentSession.get(startLabel);
    const end = this.currentSession.get(endLabel);
    if (!start || !end) return 0;
    return end - start;
  }

  finishProfiling(): PerformanceReport {
    const sessionStart = this.currentSession.get('session_start') || Date.now();
    const totalDuration = Date.now() - sessionStart;

    // Calculate durations for each phase
    const phases = {
      initialization: this.measureDuration('session_start', 'engines_initialized') || 0,
      mainEngine: this.measureDuration('main_engine_start', 'main_engine_end') || 0,
      frameworkAnalysis: this.measureDuration('framework_start', 'framework_end') || 0,
      realEngine: this.measureDuration('real_engine_start', 'real_engine_end') || 0,
      unifiedEngine: this.measureDuration('unified_engine_start', 'unified_engine_end') || 0,
      ensembleCalculation: this.measureDuration('ensemble_start', 'ensemble_end') || 0,
      databaseStorage: this.measureDuration('db_start', 'db_end') || 0
    };

    // Store measurements for trend analysis
    Object.entries(phases).forEach(([phase, duration]) => {
      if (!this.measurements.has(phase)) {
        this.measurements.set(phase, []);
      }
      this.measurements.get(phase)!.push(duration);
    });

    return {
      sessionId: this.sessionId,
      totalDuration,
      phases,
      bottlenecks: this.identifyBottlenecks(phases),
      recommendations: this.generateRecommendations(phases),
      slaStatus: totalDuration <= 100 ? 'PASSED' : 'FAILED',
      targetGap: totalDuration - 100
    };
  }

  private identifyBottlenecks(phases: Record<string, number>): Array<{phase: string, duration: number, percentage: number}> {
    const total = Object.values(phases).reduce((sum, duration) => sum + duration, 0);
    return Object.entries(phases)
      .map(([phase, duration]) => ({
        phase,
        duration,
        percentage: (duration / total) * 100
      }))
      .filter(item => item.percentage > 10) // Only show phases taking >10% of time
      .sort((a, b) => b.duration - a.duration);
  }

  private generateRecommendations(phases: Record<string, number>): string[] {
    const recommendations: string[] = [];
    const total = Object.values(phases).reduce((sum, duration) => sum + duration, 0);

    if (phases.frameworkAnalysis > 500) {
      recommendations.push('CRITICAL: Cache framework_genes.json in memory - likely parsing 383 frameworks every request');
    }
    if (phases.mainEngine > 800) {
      recommendations.push('Optimize MainEngine: Likely heavy ML model processing - consider ONNX optimization');
    }
    if (phases.databaseStorage > 200) {
      recommendations.push('Database optimization: Use connection pooling and batch operations');
    }
    if (phases.realEngine > 600) {
      recommendations.push('RealEngine optimization: Cache hashtag effectiveness and pattern matching');
    }
    if (phases.unifiedEngine > 500) {
      recommendations.push('UnifiedEngine optimization: Cache cohort statistics for z-score calculations');
    }
    if (total > 2000) {
      recommendations.push('CRITICAL: Implement parallel processing - engines can run simultaneously');
    }

    return recommendations;
  }

  getAveragePerformance(): Record<string, number> {
    const averages: Record<string, number> = {};
    this.measurements.forEach((values, phase) => {
      averages[phase] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    return averages;
  }
}

export interface PerformanceReport {
  sessionId: string;
  totalDuration: number;
  phases: Record<string, number>;
  bottlenecks: Array<{phase: string, duration: number, percentage: number}>;
  recommendations: string[];
  slaStatus: 'PASSED' | 'FAILED';
  targetGap: number;
}

// Singleton instance for global use
export const performanceProfiler = new PerformanceProfiler();