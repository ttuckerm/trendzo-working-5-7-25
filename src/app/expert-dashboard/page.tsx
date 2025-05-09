'use client';

import React, { useState, useEffect } from 'react';
import BulkAdjustment from '@/app/components/BulkAdjustment';
import AccuracyImprovements from '@/app/components/AccuracyImprovements';
import { Prediction } from '@/lib/types/prediction';
import { PredictionGroup, AccuracyImprovement } from '@/lib/types/expertDashboard';
import { groupPredictionsBySimilarity, calculateAccuracyImprovements, calculateExpertStats } from '@/lib/utils/expertUtils';

// In a real application, this would come from your authentication system
const MOCK_EXPERT_ID = 'expert-1';

export default function ExpertDashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [predictionGroups, setPredictionGroups] = useState<PredictionGroup[]>([]);
  const [improvements, setImprovements] = useState<AccuracyImprovement[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PredictionGroup | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.8);

  // In a real application, this would fetch from your API
  useEffect(() => {
    // Mock data for demonstration
    const mockPredictions: Prediction[] = [
      {
        id: '1',
        title: 'Prediction 1',
        description: 'Description 1',
        category: 'Category A',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        predictedValue: 100,
        actualValue: 95,
        confidence: 0.85,
        trend: 'up',
        predictedOutcome: true,
        actualOutcome: true,
        metadata: { source: 'system', factors: ['factor1', 'factor2'] },
        severity: 'medium'
      },
      {
        id: '2',
        title: 'Prediction 2',
        description: 'Description 2',
        category: 'Category B',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        predictedValue: 150,
        actualValue: 160,
        confidence: 0.75,
        trend: 'down',
        predictedOutcome: false,
        actualOutcome: false,
        metadata: { source: 'system', factors: ['factor1', 'factor3'] },
        severity: 'high'
      },
      // Add more mock predictions as needed
    ];

    setPredictions(mockPredictions);
  }, []);

  useEffect(() => {
    if (predictions.length > 0) {
      const groups = groupPredictionsBySimilarity(predictions, similarityThreshold);
      setPredictionGroups(groups);
      setSelectedGroup(groups[0] || null);

      const accuracyImprovements = calculateAccuracyImprovements(predictions);
      setImprovements(accuracyImprovements);
    }
  }, [predictions, similarityThreshold]);

  const handleBulkAdjust = async (adjustmentFactor: number, reason: string) => {
    if (!selectedGroup) return;

    try {
      // Update predictions with bulk adjustment
      const updatedPredictions = predictions.map(pred => {
        if (selectedGroup.predictions.some(groupPred => groupPred.id === pred.id)) {
          return {
            ...pred,
            expertAdjustment: {
              value: pred.predictedValue * adjustmentFactor,
              timestamp: new Date().toISOString(),
              expertId: MOCK_EXPERT_ID,
              reason: reason,
              adjustedConfidence: pred.confidence * 1.1, // Slightly boost confidence
              adjustedOutcome: pred.predictedValue * adjustmentFactor > pred.predictedValue
            }
          };
        }
        return pred;
      });

      setPredictions(updatedPredictions);

      // Recalculate groups and improvements
      const newGroups = groupPredictionsBySimilarity(updatedPredictions, similarityThreshold);
      setPredictionGroups(newGroups);
      setSelectedGroup(newGroups.find(g => g.id === selectedGroup.id) || newGroups[0]);

      const newImprovements = calculateAccuracyImprovements(updatedPredictions);
      setImprovements(newImprovements);

      // Show success message
      alert('Bulk adjustment applied successfully');
    } catch (error) {
      console.error('Error applying bulk adjustment:', error);
      alert('Error applying bulk adjustment. Please try again.');
    }
  };

  const expertStats = calculateExpertStats(predictions, MOCK_EXPERT_ID);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Expert Dashboard</h1>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-600">
            Similarity Threshold:
          </label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-gray-600">
            {(similarityThreshold * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total Adjustments</h3>
          <p className="text-3xl font-bold text-blue-600">{expertStats.totalAdjustments}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Average Impact</h3>
          <p className="text-3xl font-bold text-green-600">
            {(expertStats.averageImpact * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Accuracy Improvement</h3>
          <p className="text-3xl font-bold text-purple-600">
            {(expertStats.accuracyImprovement * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Recent Activity</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {expertStats.recentActivity.reduce((acc, day) => acc + day.count, 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AccuracyImprovements improvements={improvements} />
        </div>
        
        <div>
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-xl font-semibold mb-4">Prediction Groups</h3>
            <div className="space-y-2">
              {predictionGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`w-full p-3 rounded-md text-left ${
                    selectedGroup?.id === group.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {group.predictions.length} Predictions
                    </span>
                    <span className="text-sm text-gray-500">
                      {(group.averageConfidence * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedGroup && (
            <BulkAdjustment
              predictionGroup={selectedGroup}
              onAdjust={handleBulkAdjust}
            />
          )}
        </div>
      </div>
    </div>
  );
} 