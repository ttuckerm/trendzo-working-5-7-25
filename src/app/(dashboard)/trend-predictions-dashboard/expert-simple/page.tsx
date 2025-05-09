/**
 * New simplified Expert Dashboard
 * This uses simplified components and utilities for better reliability
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, UserCog, TrendingUp, BarChart2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, CheckCircle, Bot, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Prediction } from '@/lib/types/prediction';
import { PredictionGroup, AccuracyImprovement } from '@/lib/types/expertDashboard';
import { useToast } from '@/components/ui/use-toast';
import ImportedExpertDashboard from '@/components/experts/SimpleExpertPerformanceDashboard';
import { MLSuggestionsContainer } from '@/components/prediction/MLSuggestionCard';
import { MLFeedbackSettings } from '@/components/prediction/MLFeedbackSettings';
import { MLExpertImpactChart } from '@/components/prediction/MLExpertImpactChart';
import { useMLSuggestions } from '@/lib/hooks/useMLSuggestions';

// Create a simplified version of ExpertPerformanceDashboard directly in this file
// This avoids dependency issues with the original component
const SimpleExpertPerformanceDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold">Expert Performance Metrics</h2>
          <p className="text-muted-foreground">Your expertise impact on trend predictions</p>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          Reliability Score: 79.3%
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium text-gray-700">Total Adjustments</h3>
          <p className="text-2xl font-bold mt-1">124</p>
          <p className="text-sm text-gray-500 mt-1">Across all categories</p>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium text-gray-700">Success Rate</h3>
          <p className="text-2xl font-bold mt-1">79%</p>
          <p className="text-sm text-gray-500 mt-1">98 successful adjustments</p>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium text-gray-700">Average Impact</h3>
          <p className="text-2xl font-bold mt-1">+23.5%</p>
          <p className="text-sm text-gray-500 mt-1">Improvement over baseline</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium mb-3">Top Specializations</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between">
                <span>Content Strategy</span>
                <span className="font-medium">86.8%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full mt-1">
                <div className="h-2 bg-blue-600 rounded-full" style={{ width: "86.8%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>Audience Targeting</span>
                <span className="font-medium">73.8%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full mt-1">
                <div className="h-2 bg-blue-600 rounded-full" style={{ width: "73.8%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>Growth Metrics</span>
                <span className="font-medium">57.1%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full mt-1">
                <div className="h-2 bg-blue-600 rounded-full" style={{ width: "57.1%" }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium mb-3">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <TrendingUp className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <p className="text-sm">Adjusted growth rate from 4.2 to 5.7</p>
                <p className="text-xs text-gray-500">30 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <p className="text-sm">Verification: accurate (21% improvement)</p>
                <p className="text-xs text-gray-500">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                <RefreshCw className="h-3 w-3 text-purple-600" />
              </div>
              <div>
                <p className="text-sm">Reviewed template prediction model</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Create a default prediction with required fields
 */
const createDefaultPrediction = (): Prediction => ({
  id: `prediction-${Date.now()}`,
  title: 'Default Prediction',
  description: 'This is a default prediction',
  category: 'General',
  confidence: 0.7,
  trend: 'up',
  timestamp: new Date().toISOString(),
  predictedValue: 50,
  actualValue: 55,
  predictedOutcome: true,
  actualOutcome: true,
  severity: 'medium',
  metadata: {
    source: 'default',
    factors: [],
    notes: '',
    confidenceAdjustmentFactors: {
      expertAccuracy: 0.5,
      patternConsistency: 0.5,
      feedbackFrequency: 0.5
    }
  }
});

/**
 * Safely hydrate a prediction
 */
const hydratePrediction = (data: any): Prediction => {
  if (!data) {
    return createDefaultPrediction();
  }
  
  try {
    return {
      id: data.id || `fallback-${Date.now()}`,
      title: data.title || 'Untitled Prediction',
      description: data.description || 'No description available',
      category: data.category || 'Uncategorized',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
      trend: data.trend || 'stable',
      timestamp: data.timestamp || new Date().toISOString(),
      predictedValue: typeof data.predictedValue === 'number' ? data.predictedValue : 0,
      actualValue: typeof data.actualValue === 'number' ? data.actualValue : undefined,
      predictedOutcome: typeof data.predictedOutcome === 'boolean' ? data.predictedOutcome : false,
      actualOutcome: typeof data.actualOutcome === 'boolean' ? data.actualOutcome : false,
      severity: data.severity || 'medium',
      metadata: {
        source: data.metadata?.source || 'system',
        factors: Array.isArray(data.metadata?.factors) ? data.metadata.factors : [],
        notes: data.metadata?.notes || '',
        refinementApplied: !!data.metadata?.refinementApplied,
        patternWeight: typeof data.metadata?.patternWeight === 'number' ? data.metadata.patternWeight : 0.5,
        lastRefined: data.metadata?.lastRefined || new Date().toISOString(),
        confidenceAdjustmentFactors: {
          expertAccuracy: typeof data.metadata?.confidenceAdjustmentFactors?.expertAccuracy === 'number' 
            ? data.metadata.confidenceAdjustmentFactors.expertAccuracy : 0.5,
          patternConsistency: typeof data.metadata?.confidenceAdjustmentFactors?.patternConsistency === 'number'
            ? data.metadata.confidenceAdjustmentFactors.patternConsistency : 0.5,
          feedbackFrequency: typeof data.metadata?.confidenceAdjustmentFactors?.feedbackFrequency === 'number'
            ? data.metadata.confidenceAdjustmentFactors.feedbackFrequency : 0.5
        }
      },
      expertAdjustment: data.expertAdjustment ? {
        timestamp: data.expertAdjustment.timestamp || new Date().toISOString(),
        adjustedConfidence: typeof data.expertAdjustment.adjustedConfidence === 'number' 
          ? data.expertAdjustment.adjustedConfidence : data.confidence || 0.5,
        reason: data.expertAdjustment.reason || 'No reason provided',
        adjustedOutcome: typeof data.expertAdjustment.adjustedOutcome === 'boolean'
          ? data.expertAdjustment.adjustedOutcome : false,
        value: typeof data.expertAdjustment.value === 'number'
          ? data.expertAdjustment.value : data.predictedValue || 0,
        expertId: data.expertAdjustment.expertId || 'unknown'
      } : undefined
    };
  } catch (error) {
    console.error('Error hydrating prediction:', error);
    return createDefaultPrediction();
  }
};

/**
 * Get mock trend predictions
 */
function getMockTrendPredictions(): Prediction[] {
  return [
    {
      id: '1',
      title: 'Sustainable Fashion Growth',
      description: 'Prediction for growth of sustainable fashion market share',
      category: 'Fashion',
      confidence: 0.85,
      trend: 'up',
      timestamp: new Date().toISOString(),
      predictedValue: 25,
      actualValue: 28,
      predictedOutcome: true,
      actualOutcome: true,
      severity: 'high',
      metadata: {
        source: 'Market Analysis',
        factors: ['Consumer Behavior', 'Environmental Awareness'],
        notes: 'Strong indicators from Gen Z consumers',
        refinementApplied: true,
        patternWeight: 0.8,
        lastRefined: new Date().toISOString(),
        confidenceAdjustmentFactors: {
          expertAccuracy: 0.9,
          patternConsistency: 0.85,
          feedbackFrequency: 0.75
        }
      },
      expertAdjustment: {
        timestamp: new Date().toISOString(),
        adjustedConfidence: 0.9,
        reason: 'Recent market data supports trend',
        adjustedOutcome: true,
        value: 30,
        expertId: 'exp_123'
      }
    },
    {
      id: '2',
      title: 'Digital Payment Adoption',
      description: 'Prediction for digital payment adoption rate increase',
      category: 'Finance',
      confidence: 0.78,
      trend: 'up',
      timestamp: new Date().toISOString(),
      predictedValue: 45,
      actualValue: 42,
      predictedOutcome: true,
      actualOutcome: true,
      severity: 'medium',
      metadata: {
        source: 'Financial Analytics',
        factors: ['Mobile Usage', 'Banking Trends'],
        notes: 'Accelerated by recent tech developments',
        refinementApplied: true,
        patternWeight: 0.75,
        lastRefined: new Date().toISOString(),
        confidenceAdjustmentFactors: {
          expertAccuracy: 0.85,
          patternConsistency: 0.8,
          feedbackFrequency: 0.7
        }
      },
      expertAdjustment: {
        timestamp: new Date().toISOString(),
        adjustedConfidence: 0.82,
        reason: 'Integration challenges may slow adoption',
        adjustedOutcome: true,
        value: 40,
        expertId: 'exp_124'
      }
    }
  ];
}

// Enhanced component for displaying predictions with ML suggestion support
const PredictionCard = ({ 
  prediction, 
  hasMLSuggestions = false,
  onShowMLSuggestions
}: { 
  prediction: Prediction, 
  hasMLSuggestions?: boolean,
  onShowMLSuggestions?: (predictionId: string) => void
}) => (
  <div className="p-4 rounded-lg border border-gray-200 bg-white mb-4">
    <div className="flex justify-between items-start">
      <h3 className="font-medium">{prediction.title}</h3>
      {hasMLSuggestions && (
        <button 
          className="flex items-center text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          onClick={() => onShowMLSuggestions && onShowMLSuggestions(prediction.id)}
        >
          <Bot className="h-3 w-3 mr-1" />
          ML Insights
        </button>
      )}
    </div>
    <p className="text-sm text-gray-600">{prediction.description}</p>
    <div className="mt-2 flex justify-between">
      <span>Value: {prediction.predictedValue}</span>
      <span>Confidence: {(prediction.confidence * 100).toFixed(0)}%</span>
    </div>
    {prediction.expertAdjustment && (
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-sm font-medium">Expert Adjustment:</p>
        <p className="text-sm text-gray-600">Adjusted value: {prediction.expertAdjustment.value}</p>
        <p className="text-sm text-gray-600">Reason: {prediction.expertAdjustment.reason}</p>
      </div>
    )}
  </div>
);

/**
 * Simple Expert Dashboard Page that doesn't rely on complex components
 */
export default function SimpleExpertDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);
  const [showMLInsights, setShowMLInsights] = useState(false);
  const [showMLSettings, setShowMLSettings] = useState(false);
  const [showMLImpactChart, setShowMLImpactChart] = useState(false);

  // Mock ML suggestions for demonstration
  const mockMLSuggestions = {
    isLoading: false,
    error: null,
    suggestions: [
      {
        field: 'confidenceScore',
        currentValue: 0.75,
        suggestedValue: 0.82,
        confidence: 0.85,
        reason: 'Based on analysis of similar content performance in the past 30 days, this prediction is likely to perform better than initially estimated. Pattern analysis shows a 82% match with high-performing trends in this category.'
      },
      {
        field: 'daysUntilPeak',
        currentValue: 12,
        suggestedValue: 9,
        confidence: 0.78,
        reason: 'Recent expert adjustments to similar predictions indicate that this content type tends to peak earlier than the model predicted. The average adjustment was -25% to time-to-peak.'
      }
    ],
    metadata: {
      templateId: '1',
      patternsApplied: ['seasonal', 'content_type', 'expert_wisdom'],
      patternCount: 3,
      generated: new Date().toISOString(),
      modelVersion: '1.0.5'
    },
    applySuggestion: async (suggestion: { field: string; currentValue: any; suggestedValue: any; confidence: number; reason: string }) => {
      toast({
        title: "ML Suggestion Applied",
        description: `Applied suggestion to adjust ${suggestion.field} from ${suggestion.currentValue} to ${suggestion.suggestedValue}`,
      });
      return true;
    },
    rejectSuggestion: async () => true,
    refresh: () => {}
  };
  
  // Initialize ML suggestions hook with mock data for demonstration
  // In production, this would use the real hook:
  // const { isLoading: mlLoading, suggestions, applySuggestion, rejectSuggestion } = 
  //   useMLSuggestions(selectedPredictionId, { enabled: !!selectedPredictionId });

  // Handle showing ML suggestions for a prediction
  const handleShowMLSuggestions = (predictionId: string) => {
    setSelectedPredictionId(predictionId);
    setShowMLInsights(true);
  };

  // Fetch predictions when component mounts
  useEffect(() => {
    async function loadPredictions() {
      setLoading(true);
      try {
        // Try to load from localStorage
        const stored = localStorage.getItem('expertDashboardPredictions');
        
        if (stored) {
          const data = JSON.parse(stored);
          if (Array.isArray(data) && data.length > 0) {
            const hydratedPredictions = data.map(hydratePrediction);
            setPredictions(hydratedPredictions);
          } else {
            // Use mock data as fallback
            setPredictions(getMockTrendPredictions());
          }
        } else {
          // No stored data
          setPredictions(getMockTrendPredictions());
        }
      } catch (error) {
        console.error('Error loading predictions:', error);
        setHasError(true);
        // Use mock data on error
        setPredictions(getMockTrendPredictions());
      } finally {
        setLoading(false);
      }
    }
    
    loadPredictions();
  }, []);

  // Handle bulk adjustment
  const handleApplyAdjustment = () => {
    try {
      const updatedPredictions = predictions.map(pred => ({
        ...pred,
        expertAdjustment: {
          timestamp: new Date().toISOString(),
          adjustedConfidence: Math.min(1, Math.max(0.1, pred.confidence * adjustmentFactor)),
          reason: adjustmentReason,
          adjustedOutcome: pred.predictedOutcome,
          value: pred.predictedValue * adjustmentFactor,
          expertId: 'expert-1'
        }
      }));
      
      setPredictions(updatedPredictions);
      localStorage.setItem('expertDashboardPredictions', JSON.stringify(updatedPredictions));
      
      // Reset form
      setAdjustmentFactor(1);
      setAdjustmentReason('');
      
      toast({
        title: "Adjustments Applied",
        description: `Applied adjustment factor ${adjustmentFactor} to ${predictions.length} predictions`,
      });
    } catch (error) {
      console.error('Error applying adjustments:', error);
      toast({
        title: "Error",
        description: "Failed to apply adjustments",
        variant: "destructive",
      });
    }
  };

  // Reset data to initial state
  const handleResetData = () => {
    const mockData = getMockTrendPredictions();
    setPredictions(mockData);
    localStorage.setItem('expertDashboardPredictions', JSON.stringify(mockData));
    
    toast({
      title: "Reset Complete",
      description: "Predictions have been reset to initial state",
    });
  };

  // Handle saving ML feedback settings
  const handleSaveMLSettings = async (settings: any) => {
    toast({
      title: "ML Feedback Settings Saved",
      description: "Your settings have been updated and will be applied to future ML suggestions.",
    });
    return true;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading predictions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError && predictions.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <h2 className="text-red-800 font-medium">Error Loading Data</h2>
          <p className="text-red-700">There was a problem loading the predictions data.</p>
          <button 
            onClick={handleResetData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expert Dashboard (Simple)</h1>
          <p className="text-gray-600">Manage prediction adjustments</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowMLSettings(!showMLSettings)}
            className="flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
          >
            <Settings className="h-4 w-4 mr-2" />
            ML Settings
          </button>
          <button 
            onClick={() => router.back()} 
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Back
          </button>
          <button 
            onClick={handleResetData}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* ML Feedback Settings Panel */}
      {showMLSettings && (
        <div className="mb-6">
          <MLFeedbackSettings 
            onSaveSettings={handleSaveMLSettings}
          />
        </div>
      )}

      {/* Expert Performance Dashboard Toggle Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowPerformanceDashboard(!showPerformanceDashboard)}
          className="w-full flex justify-between items-center px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center">
            <UserCog className="h-5 w-5 text-purple-600 mr-2" />
            <span className="font-medium text-purple-800">Your Expert Performance Metrics</span>
          </div>
          {showPerformanceDashboard ? (
            <ChevronUp className="h-5 w-5 text-purple-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-purple-600" />
          )}
        </button>
      </div>
      
      {/* ML Impact Analytics Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowMLImpactChart(!showMLImpactChart)}
          className="w-full flex justify-between items-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center">
            <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">ML Impact Analytics</span>
          </div>
          {showMLImpactChart ? (
            <ChevronUp className="h-5 w-5 text-blue-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-600" />
          )}
        </button>
      </div>

      {/* Collapsible Expert Performance Dashboard */}
      {showPerformanceDashboard && (
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <ImportedExpertDashboard />
        </div>
      )}
      
      {/* ML Impact Chart */}
      {showMLImpactChart && (
        <div className="mb-8">
          <MLExpertImpactChart />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800">Total Predictions</h3>
          <p className="text-3xl font-bold text-blue-700">{predictions.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-800">Adjusted Predictions</h3>
          <p className="text-3xl font-bold text-green-700">
            {predictions.filter(p => p.expertAdjustment).length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800">ML Suggestions</h3>
          <p className="text-3xl font-bold text-blue-700">
            {mockMLSuggestions.suggestions.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* ML Suggestions Panel */}
          {showMLInsights && selectedPredictionId && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">ML Insights</h2>
                <button 
                  onClick={() => setShowMLInsights(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
              </div>
              
              <MLSuggestionsContainer 
                predictionId={selectedPredictionId}
                suggestions={mockMLSuggestions.suggestions}
                onApplySuggestion={mockMLSuggestions.applySuggestion}
                onRejectSuggestion={mockMLSuggestions.rejectSuggestion}
                isLoading={mockMLSuggestions.isLoading}
              />
            </div>
          )}
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Predictions</h2>
            {predictions.length > 0 ? (
              <div className="space-y-4">
                {predictions.map(prediction => (
                  <PredictionCard 
                    key={prediction.id} 
                    prediction={prediction}
                    hasMLSuggestions={true}
                    onShowMLSuggestions={handleShowMLSuggestions}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No predictions available</p>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Bulk Adjustment</h2>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyAdjustment();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Adjustment Factor</label>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="5"
                    value={adjustmentFactor}
                    onChange={(e) => setAdjustmentFactor(Number(e.target.value))}
                    className="flex-1 block w-full px-3 py-2 rounded-l-md border border-gray-300"
                    required
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50">
                    x
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Values greater than 1 increase predictions, less than 1 decrease them
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Explain why these predictions need adjustment..."
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Bulk Adjustment
              </button>
            </form>
          </div>
          
          {/* ML Insight Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Bot className="h-5 w-5 text-blue-600 mr-2" />
              ML Pattern Analysis
            </h2>
            <div className="text-sm">
              <p className="mb-2">Our ML system has analyzed expert adjustments and identified these patterns:</p>
              <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
                <li>Predictions in <span className="font-medium">Fashion</span> category tend to peak 20% earlier than predicted</li>
                <li>Content with <span className="font-medium">high velocity</span> in first 24 hours achieves 35% higher engagement</li>
                <li>Expert adjustments improve accuracy by <span className="font-medium">27% on average</span></li>
              </ul>
              <p className="text-xs text-gray-500">Based on analysis of 124 expert adjustments over 90 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 