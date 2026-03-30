'use client';

import React, { useState, useEffect } from 'react';
import PredictionAnalytics from '@/app/components/PredictionAnalytics';
import ExpertFeedback from '@/app/components/ExpertFeedback';
import { Prediction, PredictionFeedback } from '@/lib/types/prediction';
import { updateModelWithFeedback } from '@/lib/utils/predictionUtils';

// In a real application, this would come from your authentication system
const MOCK_EXPERT_ID = 'expert-1';

export default function PredictionAnalyticsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);

  // In a real application, this would fetch from your API
  useEffect(() => {
    // Mock data for demonstration
    const mockPredictions: Prediction[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        inputFeatures: { feature1: 10, feature2: 20 },
        predictedValue: 100,
        actualValue: 95,
        confidence: 0.85,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        inputFeatures: { feature1: 15, feature2: 25 },
        predictedValue: 150,
        actualValue: 160,
        confidence: 0.75,
      },
      // Add more mock predictions as needed
    ];

    setPredictions(mockPredictions);
    setSelectedPrediction(mockPredictions[0]);
  }, []);

  const handleFeedbackSubmit = async (feedback: PredictionFeedback) => {
    try {
      // Update the model with the feedback
      await updateModelWithFeedback(feedback, predictions);

      // Update the predictions list with the feedback
      setPredictions(prevPredictions =>
        prevPredictions.map(pred =>
          pred.id === feedback.predictionId
            ? {
                ...pred,
                expertAdjustment: {
                  value: feedback.adjustedValue,
                  feedback: feedback.feedback,
                  timestamp: feedback.timestamp,
                  expertId: feedback.expertId,
                },
              }
            : pred
        )
      );

      // Show success message
      alert('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Prediction Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PredictionAnalytics predictions={predictions} />
        </div>
        
        <div>
          {selectedPrediction && (
            <ExpertFeedback
              prediction={selectedPrediction}
              onSubmitFeedback={handleFeedbackSubmit}
              expertId={MOCK_EXPERT_ID}
            />
          )}
        </div>
      </div>
    </div>
  );
} 