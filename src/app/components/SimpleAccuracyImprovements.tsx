/**
 * SimpleAccuracyImprovements.tsx
 * A simplified and more robust version of the AccuracyImprovements component
 */

import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AccuracyImprovement } from '@/lib/types/expertDashboard';
import { AlertCircle } from 'lucide-react';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SimpleAccuracyImprovementsProps {
  improvements: AccuracyImprovement[];
}

export default function SimpleAccuracyImprovements({ improvements }: SimpleAccuracyImprovementsProps) {
  // State for tracking chart initialization
  const [isChartReady, setIsChartReady] = useState(false);
  
  // Validate improvements array
  const hasValidData = Array.isArray(improvements) && improvements.length > 0;
  
  // Calculate overall improvement
  const overallImprovement = React.useMemo(() => {
    if (!hasValidData) return 0;
    
    try {
      const total = improvements.reduce((sum, imp) => sum + imp.improvement, 0);
      return total / improvements.length;
    } catch (error) {
      console.error('Error calculating overall improvement:', error);
      return 0;
    }
  }, [improvements, hasValidData]);
  
  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!hasValidData) {
      return {
        labels: [],
        datasets: [
          { label: 'Original Accuracy', data: [], backgroundColor: 'rgba(255, 99, 132, 0.5)' },
          { label: 'Adjusted Accuracy', data: [], backgroundColor: 'rgba(75, 192, 192, 0.5)' }
        ]
      };
    }
    
    try {
      return {
        labels: improvements.map(imp => imp.category || 'Unknown'),
        datasets: [
          {
            label: 'Original Accuracy',
            data: improvements.map(imp => imp.originalAccuracy),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'Adjusted Accuracy',
            data: improvements.map(imp => imp.adjustedAccuracy),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
        ],
      };
    } catch (error) {
      console.error('Error creating chart data:', error);
      return {
        labels: [],
        datasets: [
          { label: 'Original Accuracy', data: [], backgroundColor: 'rgba(255, 99, 132, 0.5)' },
          { label: 'Adjusted Accuracy', data: [], backgroundColor: 'rgba(75, 192, 192, 0.5)' }
        ]
      };
    }
  }, [improvements, hasValidData]);
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Accuracy Improvements by Category',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Accuracy (%)',
        },
      },
    },
  };
  
  // Initialize chart after component mounts
  useEffect(() => {
    setIsChartReady(true);
    
    // Clean up function
    return () => {
      setIsChartReady(false);
    };
  }, []);
  
  // No data state
  if (!hasValidData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Accuracy Improvements</h3>
        <div className="bg-blue-50 p-4 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <p className="text-blue-700">No accuracy improvement data available.</p>
            <p className="text-blue-600 text-sm mt-1">
              This could be because no predictions have expert adjustments yet, or there was an error processing the data.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Accuracy Improvements</h3>
          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            Overall: {overallImprovement.toFixed(1)}%
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {improvements.map((imp) => (
            <div key={imp.category} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700">{imp.category}</h4>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Original: {imp.originalAccuracy.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  Adjusted: {imp.adjustedAccuracy.toFixed(1)}%
                </p>
                <div className={`text-sm font-medium ${imp.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Improvement: {imp.improvement.toFixed(1)}%
                  {imp.improvement >= 0 ? ' ↑' : ' ↓'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[400px]">
        {isChartReady && (
          <Bar
            data={chartData}
            options={chartOptions}
          />
        )}
      </div>
    </div>
  );
} 