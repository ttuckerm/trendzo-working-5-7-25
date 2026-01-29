"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Shield, AlertTriangle, CheckCircle, Loader2, Target } from "lucide-react";
import { validateTemplate, ValidationIssue } from "../validation";
import { logTemplateEvent } from "../events";
import type { TemplateSlotsState } from "../store";

interface PredictionResult {
  raw_probability: number;
  calibrated_probability: number;
  confidence_interval: [number, number];
  cohort_key: string;
  model_version: string;
}

interface CalibrationData {
  ece: number; // Expected Calibration Error
  lastCalibration: {
    timestamp: string;
    modelVersion: string;
    sampleSize: number;
  };
}

interface EnhancedValidatePanelProps {
  templateId: string;
  platform: string;
  slots: TemplateSlotsState;
  userId?: string;
  onAction?: (action: string) => void;
}

// ECE Color scheme: green ≤0.03, amber ≤0.05, red >0.05
function getECEStatus(ece: number): { color: string; status: string } {
  if (ece <= 0.03) return { color: "green", status: "Excellent" };
  if (ece <= 0.05) return { color: "amber", status: "Good" };
  return { color: "red", status: "Needs Improvement" };
}

function CalibrationChip({ cohortKey }: { cohortKey: string }) {
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/metrics/accuracy?cohort=${cohortKey}`)
      .then(r => r.json())
      .then(setCalibrationData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [cohortKey]);

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading calibration...</span>
      </div>
    );
  }

  if (!calibrationData) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
        <AlertTriangle className="h-3 w-3" />
        <span>Calibration unavailable</span>
      </div>
    );
  }

  const { color, status } = getECEStatus(calibrationData.ece);
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      color === 'green' ? 'bg-green-100 text-green-800' :
      color === 'amber' ? 'bg-amber-100 text-amber-800' :
      'bg-red-100 text-red-800'
    }`}>
      <Target className="h-3 w-3" />
      <span>ECE: {calibrationData.ece.toFixed(3)} ({status})</span>
    </div>
  );
}

function PredictionResults({ prediction }: { prediction: PredictionResult }) {
  const rawPercent = (prediction.raw_probability * 100).toFixed(1);
  const calibratedPercent = (prediction.calibrated_probability * 100).toFixed(1);
  const [ciLow, ciHigh] = prediction.confidence_interval.map(v => (v * 100).toFixed(1));

  return (
    <div className="p-3 rounded-lg border bg-card text-card-foreground">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Viral Prediction</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Raw Probability:</span>
          <span className="text-xs font-medium">{rawPercent}%</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Calibrated:</span>
          <span className="text-xs font-medium text-blue-600">{calibratedPercent}%</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          <span className="text-xs font-medium">{ciLow}% - {ciHigh}%</span>
        </div>
        
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Model:</span>
            <span className="text-xs">{prediction.model_version}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Cohort:</span>
            <Badge variant="outline" className="text-xs">{prediction.cohort_key}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EnhancedValidatePanel({ 
  templateId, 
  platform, 
  slots, 
  userId, 
  onAction 
}: EnhancedValidatePanelProps) {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isRunningPrediction, setIsRunningPrediction] = useState(false);

  const deepLink = `/membership/viral-recipe-book?tab=validation&templateId=${templateId}`;

  // Validate on mount and slots change
  useEffect(() => {
    const validationIssues = validateTemplate({ platform, slots });
    setIssues(validationIssues);
  }, [platform, slots]);

  const handleRunPrediction = async () => {
    setIsRunningPrediction(true);
    
    try {
      // Call fast prediction API with cohort key
      const response = await fetch('/api/viral-prediction/fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          platform,
          slots,
          cohortKey: platform, // Use platform as cohort key
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const result = await response.json();
      setPrediction(result);
      
      // Log telemetry
      await logTemplateEvent({
        event_type: 'validation_completed',
        template_id: templateId,
        platform,
        user_id: userId || null,
        metrics_payload: {
          action: 'run_prediction',
          raw_probability: result.raw_probability,
          calibrated_probability: result.calibrated_probability,
          model_version: result.model_version
        }
      });

      onAction?.('prediction_complete');
      
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setIsRunningPrediction(false);
    }
  };

  return (
    <div className="space-y-4" role="tabpanel" aria-label="Validate panel">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Validation & Prediction</h3>
        <p className="text-sm text-muted-foreground">
          Check content and predict viral performance with calibrated accuracy
        </p>
      </div>

      {/* Calibration Status */}
      <CalibrationChip cohortKey={platform} />

      {/* Validation status */}
      <div className="p-3 rounded-lg border bg-card text-card-foreground">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Content Status</span>
          <Badge variant={issues.length === 0 ? "default" : "destructive"}>
            {issues.length === 0 ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Valid
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {issues.length} Issue{issues.length > 1 ? 's' : ''}
              </>
            )}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {issues.length === 0 
            ? "Content passes all validation checks" 
            : "Some issues need attention"
          }
        </div>
      </div>

      {/* Issues list */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Validation Issues</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {issues.slice(0, 3).map((issue) => (
              <div key={issue.id} className="p-2 rounded border bg-muted/20">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant={issue.severity === 'error' ? 'destructive' : 
                             issue.severity === 'warning' ? 'secondary' : 'outline'} 
                    className="text-xs"
                  >
                    {issue.severity}
                  </Badge>
                </div>
                <div className="text-xs">{issue.message}</div>
              </div>
            ))}
            {issues.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{issues.length - 3} more issue{issues.length - 3 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prediction results */}
      {prediction && (
        <PredictionResults prediction={prediction} />
      )}

      {/* Prediction insights */}
      <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Prediction Quality</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Predictions are calibrated using {platform} performance data.
        </div>
        <div className="text-xs text-muted-foreground">
          Calibrated scores provide more reliable viral probability estimates.
        </div>
      </div>

      {/* Primary CTA */}
      <div className="space-y-2 pt-2 border-t">
        <Button 
          className="w-full" 
          onClick={handleRunPrediction}
          disabled={isRunningPrediction}
        >
          {isRunningPrediction ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Prediction...
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4 mr-2" />
              Run Prediction
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          asChild
        >
          <a href={deepLink} aria-label="Open full validation view">
            <Shield className="h-4 w-4 mr-2" />
            Open Full Validation
          </a>
        </Button>
      </div>
    </div>
  );
}

