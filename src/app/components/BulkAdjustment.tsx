import React, { useState, useEffect } from 'react';
import { PredictionGroup } from '@/lib/types/expertDashboard';
import { Prediction } from '@/lib/types/prediction';
import { calculateSimilarityScore } from '@/lib/utils/expertUtils';

interface BulkAdjustmentProps {
  predictionGroup: PredictionGroup;
  onAdjust: (adjustmentFactor: number, reason: string) => void;
}

/**
 * Calculate the average value for a property from a list of predictions
 */
const calculateAverage = (predictions: Prediction[], property: keyof Prediction): number => {
  if (!Array.isArray(predictions) || predictions.length === 0) return 0;
  
  try {
    const values = predictions
      .map(p => {
        const value = p[property];
        return typeof value === 'number' ? value : 0;
      })
      .filter(value => !isNaN(value));
    
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  } catch (error) {
    console.error(`Error calculating average for ${String(property)}:`, error);
    return 0;
  }
};

/**
 * BulkAdjustment component for adjusting groups of predictions
 */
export default function BulkAdjustment({ predictionGroup, onAdjust }: BulkAdjustmentProps) {
  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [groupKey, setGroupKey] = useState<string>('');
  
  // Effect to reset state when predictionGroup changes
  useEffect(() => {
    // Generate a unique key for the group to track changes
    const newGroupKey = `${predictionGroup?.id}-${predictionGroup?.predictions?.length || 0}`;
    
    // If the group has changed, reset adjustment factor and reason
    if (newGroupKey !== groupKey) {
      console.log(`PredictionGroup changed from ${groupKey} to ${newGroupKey}`);
      setGroupKey(newGroupKey);
      setAdjustmentFactor(1);
      setReason('');
      setError(null);
    }
  }, [predictionGroup, groupKey]);

  // Validate the predictionGroup on mount and when it changes
  useEffect(() => {
    try {
      console.log(`Validating prediction group: ${predictionGroup?.id}`);
      
      if (!predictionGroup) {
        setIsValid(false);
        setError('No prediction group provided');
        return;
      }

      if (!Array.isArray(predictionGroup.predictions) || predictionGroup.predictions.length === 0) {
        setIsValid(false);
        setError('Prediction group contains no predictions');
        return;
      }

      setIsValid(true);
      setError(null);
    } catch (e) {
      console.error('Error validating prediction group:', e);
      setIsValid(false);
      setError('Invalid prediction group data');
    }
  }, [predictionGroup]);

  // Handle empty predictionGroup or predictions array
  if (!isValid) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-xl font-semibold mb-4">Bulk Adjustment</h3>
        <p className="text-red-500">
          {error || 'No predictions available for adjustment.'}
        </p>
      </div>
    );
  }

  // Calculate metrics with error handling
  const getAverageConfidence = () => {
    try {
      if (typeof predictionGroup?.averageConfidence === 'number') {
        return predictionGroup.averageConfidence;
      }
      return calculateAverage(predictionGroup?.predictions || [], 'confidence');
    } catch (error) {
      console.error('Error calculating average confidence:', error);
      return 0;
    }
  };

  const getSimilarityScore = () => {
    try {
      if (typeof predictionGroup?.similarityScore === 'number') {
        return predictionGroup.similarityScore;
      }

      const predictions = predictionGroup?.predictions || [];
      if (predictions.length <= 1) return 1;

      const similarityScores = predictions.map((p1, i) => 
        predictions.slice(i + 1).map(p2 => {
          try {
            return calculateSimilarityScore(p1, p2);
          } catch (error) {
            console.error('Error calculating individual similarity score:', error);
            return 0;
          }
        })
      ).flat();
      
      return similarityScores.length > 0
        ? similarityScores.reduce((sum, score) => sum + score, 0) / similarityScores.length
        : 1;
    } catch (error) {
      console.error('Error calculating similarity score:', error);
      return 0;
    }
  };

  const handleAdjustmentChange = (value: number) => {
    try {
      // Ensure the value is a valid number
      const numValue = Number(value);
      if (isNaN(numValue)) {
        setError('Please enter a valid number');
        return;
      }
      
      // Limit to reasonable range
      if (numValue < 0.1) {
        setAdjustmentFactor(0.1);
        setError('Minimum adjustment factor is 0.1');
      } else if (numValue > 5) {
        setAdjustmentFactor(5);
        setError('Maximum adjustment factor is 5');
      } else {
        setAdjustmentFactor(numValue);
        setError(null);
      }
    } catch (e) {
      console.error('Error handling adjustment change:', e);
      setError('Invalid input');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError('Cannot submit with invalid data');
      return;
    }
    
    try {
      onAdjust(adjustmentFactor, reason);
      setReason('');
      setAdjustmentFactor(1);
      setError(null);
    } catch (e) {
      console.error('Error submitting adjustment:', e);
      setError('Failed to apply adjustment');
    }
  };

  const averageConfidence = getAverageConfidence();
  const similarityScore = getSimilarityScore();

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h3 className="text-xl font-semibold mb-4">Bulk Adjustment</h3>
      
      <div className="mb-4">
        <p className="text-gray-600">Group Size: {predictionGroup.predictions.length} predictions</p>
        <p className="text-gray-600">Average Confidence: {(averageConfidence * 100).toFixed(1)}%</p>
        <p className="text-gray-600">Similarity Score: {(similarityScore * 100).toFixed(1)}%</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Adjustment Factor
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              step="0.01"
              value={adjustmentFactor}
              onChange={(e) => handleAdjustmentChange(Number(e.target.value))}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1.0"
              required
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
              x
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Values greater than 1 increase predictions, less than 1 decrease them
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reason for Adjustment
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Explain why these predictions need adjustment..."
            required
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-700 mb-2">Preview</h4>
          <div className="space-y-2">
            {predictionGroup.predictions.slice(0, 3).map((pred) => (
              <div key={pred.id} className="text-sm text-gray-600">
                <span>Original: {pred.predictedValue.toFixed(2)}</span>
                <span className="mx-2">→</span>
                <span>Adjusted: {(pred.predictedValue * adjustmentFactor).toFixed(2)}</span>
              </div>
            ))}
            {predictionGroup.predictions.length > 3 && (
              <p className="text-sm text-gray-500">
                +{predictionGroup.predictions.length - 3} more predictions...
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={!isValid || !!error}
        >
          Apply Bulk Adjustment
        </button>
      </form>
    </div>
  );
} 