/**
 * SimpleBulkAdjustment.tsx
 * A simplified and more robust version of the BulkAdjustment component
 */

import React, { useState, useEffect } from 'react';
import { PredictionGroup } from '@/lib/types/expertDashboard';
import { AlertCircle } from 'lucide-react';
import { safeGet } from '@/lib/utils/expertDashboardSimple';

interface SimpleBulkAdjustmentProps {
  predictionGroup: PredictionGroup | null;
  onAdjust: (adjustmentFactor: number, reason: string) => void;
}

/**
 * SimpleBulkAdjustment component for adjusting groups of predictions
 */
export default function SimpleBulkAdjustment({ predictionGroup, onAdjust }: SimpleBulkAdjustmentProps) {
  // Component state
  const [adjustmentFactor, setAdjustmentFactor] = useState(1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [groupKey, setGroupKey] = useState('');
  
  // Validate predictionGroup
  const isValid = predictionGroup && 
                  Array.isArray(predictionGroup.predictions) && 
                  predictionGroup.predictions.length > 0;
  
  // Handle prediction group changes
  useEffect(() => {
    if (!predictionGroup) return;
    
    // Create key to detect group changes
    const newKey = `group-${predictionGroup.id}-${predictionGroup.predictions.length}`;
    
    // Reset form when group changes
    if (newKey !== groupKey) {
      console.log(`Group changed: ${groupKey} -> ${newKey}`);
      setGroupKey(newKey);
      setAdjustmentFactor(1);
      setReason('');
      setError(null);
    }
  }, [predictionGroup, groupKey]);
  
  // Handle numeric input validation
  const handleAdjustmentChange = (value: number) => {
    try {
      // Validate the input
      if (isNaN(value)) {
        setError('Please enter a valid number');
        return;
      }
      
      // Constrain the value to a reasonable range
      if (value < 0.1) {
        setAdjustmentFactor(0.1);
        setError('Minimum adjustment factor is 0.1');
      } else if (value > 5) {
        setAdjustmentFactor(5);
        setError('Maximum adjustment factor is 5');
      } else {
        setAdjustmentFactor(value);
        setError(null);
      }
    } catch (error) {
      console.error('Error handling adjustment change:', error);
      setError('Invalid input');
    }
  };
  
  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate submission
    if (!isValid) {
      setError('Cannot submit with invalid data');
      return;
    }
    
    try {
      // Call parent handler
      onAdjust(adjustmentFactor, reason);
      
      // Reset form after successful submission
      setReason('');
      setAdjustmentFactor(1);
      setError(null);
    } catch (error) {
      console.error('Error submitting adjustment:', error);
      setError('Failed to apply adjustment');
    }
  };
  
  // Handle invalid or missing prediction group
  if (!isValid) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-xl font-semibold mb-4">Bulk Adjustment</h3>
        <div className="bg-yellow-50 p-4 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
          <div>
            <p className="text-yellow-700">No prediction group selected.</p>
            <p className="text-yellow-600 text-sm mt-1">
              Please select a group of predictions to adjust.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate display metrics safely
  const getAverageConfidence = () => {
    try {
      if (typeof predictionGroup?.averageConfidence === 'number') {
        return predictionGroup.averageConfidence;
      }
      
      // Calculate manually if not provided
      const predictions = predictionGroup?.predictions || [];
      if (predictions.length === 0) return 0;
      
      const total = predictions.reduce((sum, p) => sum + safeGet(p, 'confidence', 0), 0);
      return total / predictions.length;
    } catch (error) {
      console.error('Error calculating average confidence:', error);
      return 0;
    }
  };
  
  // Get similarity score with fallback
  const getSimilarityScore = () => {
    try {
      return typeof predictionGroup?.similarityScore === 'number' 
        ? predictionGroup.similarityScore 
        : 0;
    } catch (error) {
      console.error('Error getting similarity score:', error);
      return 0;
    }
  };
  
  // Calculate display values
  const groupSize = predictionGroup?.predictions?.length || 0;
  const averageConfidence = getAverageConfidence();
  const similarityScore = getSimilarityScore();
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h3 className="text-xl font-semibold mb-4">Bulk Adjustment</h3>
      
      {/* Group Info */}
      <div className="mb-4">
        <p className="text-gray-600">Group Size: {groupSize} predictions</p>
        <p className="text-gray-600">Average Confidence: {(averageConfidence * 100).toFixed(1)}%</p>
        <p className="text-gray-600">Similarity Score: {(similarityScore * 100).toFixed(1)}%</p>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Form */}
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
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Explain why these predictions need adjustment..."
            required
          />
        </div>
        
        {/* Preview Section */}
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
          disabled={!!error}
        >
          Apply Bulk Adjustment
        </button>
      </form>
    </div>
  );
} 