'use client';

import { useState, useEffect } from 'react';
import HistoricalImpactDashboard from '@/app/components/HistoricalImpactDashboard';
import { Prediction } from '@/lib/types/prediction';

// In a real application, this would come from your authentication system
const MOCK_EXPERT_ID = 'expert-1';

export default function ImpactAnalysisPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // In a real application, this would fetch from your API
  useEffect(() => {
    // Mock data for demonstration
    const mockPredictions: Prediction[] = [];
    
    // Generate some mock predictions with expert adjustments
    const categories = ['Product', 'Marketing', 'Sales', 'Engineering', 'Finance'];
    const expertIds = ['expert-1', 'expert-2', 'expert-3'];
    
    // Generate predictions for the last 3 years
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 3);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Add 10 predictions per month
      for (let i = 0; i < 10; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const predictedValue = 50 + Math.random() * 100;
        const actualValue = predictedValue * (0.7 + Math.random() * 0.6); // 70%-130% of predicted
        
        // Some predictions have expert adjustments
        const hasAdjustment = Math.random() > 0.3;
        
        const prediction: Prediction = {
          id: `pred-${currentDate.getTime()}-${i}`,
          title: `${category} Prediction ${i}`,
          description: `This is a mock ${category.toLowerCase()} prediction for data analysis`,
          category,
          confidence: 0.6 + Math.random() * 0.3,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          timestamp: new Date(currentDate).toISOString(),
          predictedValue,
          actualValue,
          predictedOutcome: true,
          actualOutcome: true,
          metadata: {
            source: 'algorithm',
            factors: ['historical', 'seasonal'],
          },
          severity: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'
        };
        
        // Add expert adjustment to some predictions
        if (hasAdjustment) {
          const expertId = expertIds[Math.floor(Math.random() * expertIds.length)];
          const isCloserToActual = Math.random() > 0.3; // 70% of adjustments are better
          
          const adjustmentValue = isCloserToActual 
            ? actualValue * (0.9 + Math.random() * 0.2) // Closer to actual
            : predictedValue * (0.7 + Math.random() * 0.6); // Possibly further from actual
          
          prediction.expertAdjustment = {
            timestamp: new Date(currentDate.getTime() + 86400000).toISOString(), // 1 day after prediction
            adjustedConfidence: prediction.confidence + (Math.random() * 0.2 - 0.1),
            reason: 'Expert domain knowledge',
            adjustedOutcome: true,
            value: adjustmentValue,
            expertId
          };
        }
        
        mockPredictions.push(prediction);
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    setPredictions(mockPredictions);
    setIsLoading(false);
  }, []);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg">Loading impact analysis data...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <HistoricalImpactDashboard predictions={predictions} />
    </div>
  );
} 