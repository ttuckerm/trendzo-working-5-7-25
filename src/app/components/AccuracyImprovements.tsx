import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AccuracyImprovement } from '@/lib/types/expertDashboard';
import { AlertCircle } from 'lucide-react';

// Register ChartJS components once
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AccuracyImprovementsProps {
  improvements: AccuracyImprovement[];
}

/**
 * Validate an AccuracyImprovement object
 */
const isValidImprovement = (improvement: any): improvement is AccuracyImprovement => {
  return (
    improvement &&
    typeof improvement.category === 'string' &&
    typeof improvement.originalAccuracy === 'number' &&
    typeof improvement.adjustedAccuracy === 'number' &&
    typeof improvement.improvement === 'number'
  );
};

/**
 * AccuracyImprovements component for displaying accuracy improvements by category
 */
export default function AccuracyImprovements({ improvements }: AccuracyImprovementsProps) {
  // State for tracking component mount/unmount
  const [isComponentMounted, setIsComponentMounted] = useState(true);
  
  // Refs to track previous render values
  const chartRef = useRef<any>(null);
  const previousImprovementsRef = useRef<AccuracyImprovement[]>([]);

  // Always initialize these values, regardless of input
  const [chartInitialized, setChartInitialized] = useState(false);
  
  // Validate improvements data - always call this hook regardless of input
  const validImprovements = useMemo(() => {
    try {
      if (!improvements || !Array.isArray(improvements)) {
        return [];
      }
      const filtered = improvements.filter(isValidImprovement);
      if (filtered.length !== improvements.length) {
        console.warn(`${improvements.length - filtered.length} invalid improvements filtered out`);
      }
      return filtered;
    } catch (error) {
      console.error('Error validating improvements:', error);
      return [];
    }
  }, [improvements]);

  // Always calculate these values, regardless of validImprovements being empty
  const overallImprovement = useMemo(() => {
    try {
      if (!validImprovements || validImprovements.length === 0) return 0;
      const totalImprovement = validImprovements.reduce((sum, imp) => sum + imp.improvement, 0);
      return totalImprovement / validImprovements.length;
    } catch (error) {
      console.error('Error calculating overall improvement:', error);
      return 0;
    }
  }, [validImprovements]);

  // Always prepare chart data, with safe defaults
  const chartData: ChartData<'bar'> = useMemo(() => {
    try {
      return {
        labels: validImprovements.map(imp => imp.category || 'Unknown'),
        datasets: [
          {
            label: 'Original Accuracy',
            data: validImprovements.map(imp => typeof imp.originalAccuracy === 'number' ? imp.originalAccuracy : 0),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'Adjusted Accuracy',
            data: validImprovements.map(imp => typeof imp.adjustedAccuracy === 'number' ? imp.adjustedAccuracy : 0),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
        ],
      };
    } catch (error) {
      console.error('Error creating chart data:', error);
      // Return empty but valid chart data
      return {
        labels: [],
        datasets: [
          { label: 'Original Accuracy', data: [], backgroundColor: 'rgba(255, 99, 132, 0.5)' },
          { label: 'Adjusted Accuracy', data: [], backgroundColor: 'rgba(75, 192, 192, 0.5)' }
        ]
      };
    }
  }, [validImprovements]);

  // Chart options are stable and don't depend on props
  const chartOptions: ChartOptions<'bar'> = useMemo(() => ({
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
      tooltip: {
        callbacks: {
          label: (context: any) => {
            try {
              if (!validImprovements || 
                  !Array.isArray(validImprovements) || 
                  !context || 
                  typeof context.dataIndex !== 'number' ||
                  context.dataIndex < 0 ||
                  context.dataIndex >= validImprovements.length) {
                return 'Invalid data';
              }
              
              const improvement = validImprovements[context.dataIndex];
              if (!improvement) return 'No data';
              
              const label = context.dataset.label || '';
              const value = typeof context.parsed.y === 'number' ? context.parsed.y.toFixed(1) + '%' : 'N/A';
              return `${label}: ${value}`;
            } catch (error) {
              console.error('Error in tooltip callback:', error);
              return 'Error displaying data';
            }
          }
        }
      }
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
  }), [validImprovements]);
  
  // Component lifecycle management
  useEffect(() => {
    setIsComponentMounted(true);
    return () => {
      setIsComponentMounted(false);
    };
  }, []);

  // Effect to handle Chart initialization and cleanup
  useEffect(() => {
    setChartInitialized(true);
    
    // Save the current improvements for comparison
    previousImprovementsRef.current = validImprovements;
    
    return () => {
      // Clean up chart instance if needed
      if (chartRef.current && chartRef.current.chartInstance) {
        chartRef.current.chartInstance.destroy();
      }
    };
  }, [validImprovements]);

  // Always render something, even if there's no data
  if (!validImprovements || validImprovements.length === 0) {
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
          {validImprovements.map((imp) => (
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

      <div className="h-[400px]" data-testid="accuracy-chart">
        {chartInitialized && (
          <Bar
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            key="accuracy-improvement-chart"
          />
        )}
      </div>
    </div>
  );
} 