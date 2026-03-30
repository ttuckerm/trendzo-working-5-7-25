/**
 * Algorithm IQ - Self Audit Endpoint
 * POST /api/algorithm-iq/self-audit
 * 
 * Triggers self-analysis of the prediction algorithm:
 * - Identifies worst predictions
 * - Analyzes failure patterns
 * - Generates recommendations
 * - Creates learning insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface AuditResult {
  worstPredictions: Array<{
    video_id: string;
    predicted_dps: number;
    actual_dps: number;
    error: number;
    niche: string | null;
    component_predictions: Record<string, number>;
    created_at: string;
  }>;
  failurePatterns: Array<{
    pattern: string;
    description: string;
    occurrences: number;
    avgError: number;
    recommendation: string;
  }>;
  componentIssues: Array<{
    componentId: string;
    componentName: string;
    issue: string;
    avgError: number;
    recommendation: string;
  }>;
  autoAdjustments: Array<{
    type: string;
    description: string;
    applied: boolean;
    impact: string;
  }>;
  insights: Array<{
    type: string;
    title: string;
    description: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const days = body.days || 7;
    const limit = body.limit || 5;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get worst predictions (highest absolute error)
    const { data: worstPredictions, error: worstError } = await supabase
      .from('prediction_tracking')
      .select('*')
      .eq('validation_status', 'validated')
      .gte('created_at', startDate)
      .order('error_delta_abs', { ascending: false })
      .limit(limit);

    if (worstError) {
      console.error('[Algorithm IQ] Error fetching worst predictions:', worstError);
    }

    // Get all validated predictions for pattern analysis
    const { data: allPredictions, error: allError } = await supabase
      .from('prediction_tracking')
      .select('*')
      .eq('validation_status', 'validated')
      .gte('created_at', startDate);

    // Analyze failure patterns
    const failurePatterns = analyzeFailurePatterns(allPredictions || []);

    // Get component reliability for issue detection
    const { data: componentData } = await supabase
      .from('component_reliability')
      .select('*')
      .eq('enabled', true);

    // Detect component issues
    const componentIssues = detectComponentIssues(componentData || [], allPredictions || []);

    // Generate auto-adjustments (recommendations)
    const autoAdjustments = generateAutoAdjustments(failurePatterns, componentIssues);

    // Generate and store insights
    const insights = generateAuditInsights(worstPredictions || [], failurePatterns, componentIssues);

    // Store insights in database
    for (const insight of insights) {
      await supabase
        .from('algorithm_learning_insights')
        .insert({
          insight_type: insight.type as any,
          title: insight.title,
          description: insight.description,
          impact_direction: 'negative',
          evidence: {
            audit_date: new Date().toISOString(),
            period_days: days
          }
        });
    }

    const result: AuditResult = {
      worstPredictions: (worstPredictions || []).map(p => ({
        video_id: p.video_id,
        predicted_dps: p.predicted_dps,
        actual_dps: p.actual_dps,
        error: p.error_delta,
        niche: p.niche,
        component_predictions: p.component_predictions || {},
        created_at: p.created_at
      })),
      failurePatterns,
      componentIssues,
      autoAdjustments,
      insights
    };

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        periodDays: days,
        totalAnalyzed: allPredictions?.length || 0,
        auditTimestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Algorithm IQ] Self-audit error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeFailurePatterns(predictions: any[]): AuditResult['failurePatterns'] {
  const patterns: AuditResult['failurePatterns'] = [];

  // Pattern 1: Overestimation by niche
  const nicheOverestimates: Record<string, { count: number; totalError: number }> = {};
  const nicheUnderestimates: Record<string, { count: number; totalError: number }> = {};

  predictions.forEach(p => {
    const niche = p.niche || 'unknown';
    const error = p.error_delta || 0;

    if (error > 10) {
      // Overestimated
      if (!nicheOverestimates[niche]) nicheOverestimates[niche] = { count: 0, totalError: 0 };
      nicheOverestimates[niche].count++;
      nicheOverestimates[niche].totalError += error;
    } else if (error < -10) {
      // Underestimated
      if (!nicheUnderestimates[niche]) nicheUnderestimates[niche] = { count: 0, totalError: 0 };
      nicheUnderestimates[niche].count++;
      nicheUnderestimates[niche].totalError += Math.abs(error);
    }
  });

  // Report significant overestimation patterns
  for (const [niche, stats] of Object.entries(nicheOverestimates)) {
    if (stats.count >= 3) {
      patterns.push({
        pattern: 'niche_overestimate',
        description: `Consistently overestimating ${niche} content`,
        occurrences: stats.count,
        avgError: stats.totalError / stats.count,
        recommendation: `Reduce base prediction weight for ${niche} content by ${Math.min(15, Math.round(stats.totalError / stats.count / 2))}%`
      });
    }
  }

  // Report significant underestimation patterns
  for (const [niche, stats] of Object.entries(nicheUnderestimates)) {
    if (stats.count >= 3) {
      patterns.push({
        pattern: 'niche_underestimate',
        description: `Consistently underestimating ${niche} content`,
        occurrences: stats.count,
        avgError: stats.totalError / stats.count,
        recommendation: `Increase base prediction weight for ${niche} content by ${Math.min(15, Math.round(stats.totalError / stats.count / 2))}%`
      });
    }
  }

  // Pattern 2: High variance predictions
  const errorValues = predictions.map(p => Math.abs(p.error_delta || 0));
  const avgError = errorValues.reduce((a, b) => a + b, 0) / (errorValues.length || 1);
  const variance = errorValues.reduce((sum, e) => sum + Math.pow(e - avgError, 2), 0) / (errorValues.length || 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev > 15) {
    patterns.push({
      pattern: 'high_variance',
      description: 'Prediction accuracy is highly inconsistent',
      occurrences: predictions.length,
      avgError: stdDev,
      recommendation: 'Consider adding more training data or adjusting component weights for consistency'
    });
  }

  return patterns;
}

function detectComponentIssues(components: any[], predictions: any[]): AuditResult['componentIssues'] {
  const issues: AuditResult['componentIssues'] = [];

  for (const component of components) {
    // Issue 1: Low reliability
    if (component.reliability_score < 0.6 && component.total_predictions >= 10) {
      issues.push({
        componentId: component.component_id,
        componentName: component.component_name,
        issue: 'Low reliability score',
        avgError: Math.abs(component.avg_accuracy_delta || 0),
        recommendation: `Consider reducing weight of ${component.component_name} or retraining`
      });
    }

    // Issue 2: Systematic bias (consistently over/under predicting)
    if (Math.abs(component.avg_accuracy_delta || 0) > 10 && component.total_predictions >= 10) {
      const direction = (component.avg_accuracy_delta || 0) > 0 ? 'overestimating' : 'underestimating';
      issues.push({
        componentId: component.component_id,
        componentName: component.component_name,
        issue: `Systematic ${direction}`,
        avgError: component.avg_accuracy_delta,
        recommendation: `Apply ${Math.abs(Math.round(component.avg_accuracy_delta))} point calibration offset to ${component.component_name}`
      });
    }

    // Issue 3: Declining performance (if we have niche breakdown showing degradation)
    const nichePerf = component.performance_by_niche || {};
    for (const [niche, perf] of Object.entries(nichePerf) as any[]) {
      if (perf.reliability < 0.5 && perf.count >= 5) {
        issues.push({
          componentId: component.component_id,
          componentName: component.component_name,
          issue: `Poor performance on ${niche} content`,
          avgError: Math.abs(perf.avg_delta || 0),
          recommendation: `Review ${component.component_name} handling of ${niche} niche`
        });
      }
    }
  }

  return issues;
}

function generateAutoAdjustments(
  patterns: AuditResult['failurePatterns'],
  issues: AuditResult['componentIssues']
): AuditResult['autoAdjustments'] {
  const adjustments: AuditResult['autoAdjustments'] = [];

  // Generate adjustments based on patterns
  for (const pattern of patterns) {
    if (pattern.pattern === 'niche_overestimate' || pattern.pattern === 'niche_underestimate') {
      adjustments.push({
        type: 'weight_adjustment',
        description: pattern.recommendation,
        applied: false,
        impact: `Expected ${Math.round(pattern.avgError * 0.5)} DPS error reduction`
      });
    }
  }

  // Generate adjustments based on component issues
  for (const issue of issues) {
    if (issue.issue.includes('Systematic')) {
      adjustments.push({
        type: 'calibration_offset',
        description: issue.recommendation,
        applied: false,
        impact: `Expected ${Math.round(Math.abs(issue.avgError) * 0.8)} DPS error reduction`
      });
    }
  }

  return adjustments;
}

function generateAuditInsights(
  worstPredictions: any[],
  patterns: AuditResult['failurePatterns'],
  issues: AuditResult['componentIssues']
): AuditResult['insights'] {
  const insights: AuditResult['insights'] = [];

  // Insight from worst predictions
  if (worstPredictions.length > 0) {
    const avgWorstError = worstPredictions.reduce((sum, p) => sum + Math.abs(p.error_delta || 0), 0) / worstPredictions.length;
    insights.push({
      type: 'deficiency',
      title: `Top ${worstPredictions.length} predictions averaged ${avgWorstError.toFixed(1)} DPS error`,
      description: `The worst predictions had significant errors. Most common niche: ${worstPredictions[0]?.niche || 'unknown'}`
    });
  }

  // Insights from patterns
  for (const pattern of patterns) {
    insights.push({
      type: 'deficiency',
      title: pattern.description,
      description: `${pattern.occurrences} occurrences with avg error of ${pattern.avgError.toFixed(1)} DPS`
    });
  }

  // Insights from component issues
  for (const issue of issues) {
    insights.push({
      type: 'deficiency',
      title: `${issue.componentName}: ${issue.issue}`,
      description: issue.recommendation
    });
  }

  return insights;
}

// GET endpoint to retrieve last audit results
export async function GET(request: NextRequest) {
  try {
    // Get most recent insights from self-audit
    const { data: recentInsights, error } = await supabase
      .from('algorithm_learning_insights')
      .select('*')
      .eq('insight_type', 'deficiency')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[Algorithm IQ] Error fetching audit insights:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        recentInsights: recentInsights || [],
        lastAuditTime: recentInsights?.[0]?.created_at || null
      }
    });

  } catch (error: any) {
    console.error('[Algorithm IQ] GET audit error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
















