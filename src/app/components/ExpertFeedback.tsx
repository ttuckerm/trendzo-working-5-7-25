import React, { useState } from 'react';
import { Prediction, PredictionFeedback } from '@/lib/types/prediction';

interface ExpertFeedbackProps {
  prediction: Prediction;
  onSubmitFeedback: (feedback: PredictionFeedback) => void;
  expertId: string;
}

export default function ExpertFeedback({
  prediction,
  onSubmitFeedback,
  expertId,
}: ExpertFeedbackProps) {
  const [adjustedValue, setAdjustedValue] = useState<number>(prediction.predictedValue);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const feedbackData: PredictionFeedback = {
      predictionId: prediction.id,
      expertId,
      adjustedValue,
      feedback,
      timestamp: new Date(),
    };

    onSubmitFeedback(feedbackData);
    setFeedback('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Expert Feedback</h3>
      
      <div className="mb-4">
        <p className="text-gray-600">Original Prediction: {prediction.predictedValue}</p>
        <p className="text-gray-600">Confidence: {(prediction.confidence * 100).toFixed(1)}%</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Adjusted Value
          </label>
          <input
            type="number"
            value={adjustedValue}
            onChange={(e) => setAdjustedValue(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            placeholder="Please provide your reasoning for the adjustment..."
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
} 