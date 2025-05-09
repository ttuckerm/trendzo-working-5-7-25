import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Prediction, PredictionMetrics } from '@/lib/types/prediction';
import { calculateMetrics, getPredictionTrends } from '@/lib/utils/predictionUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PredictionAnalyticsProps {
  predictions: Prediction[];
}

export default function PredictionAnalytics({ predictions }: PredictionAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [metrics, setMetrics] = useState<PredictionMetrics | null>(null);
  const [trends, setTrends] = useState<PredictionMetrics[]>([]);

  useEffect(() => {
    if (predictions.length > 0) {
      const currentMetrics = calculateMetrics(predictions);
      setMetrics(currentMetrics);
      const trendData = getPredictionTrends(predictions, timeframe);
      setTrends(trendData);
    }
  }, [predictions, timeframe]);

  const chartData = {
    labels: trends.map(t => t.timestamp.toLocaleDateString()),
    datasets: [
      {
        label: 'Accuracy',
        data: trends.map(t => t.accuracy * 100),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Expert Adjustment Rate',
        data: trends.map(t => t.expertAdjustmentRate * 100),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Prediction Performance Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage',
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Prediction Analytics</h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'day' | 'week' | 'month')}
          className="px-4 py-2 border rounded-md"
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Overall Accuracy</h3>
          <p className="text-3xl font-bold text-blue-600">
            {metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : '-'}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Mean Absolute Error</h3>
          <p className="text-3xl font-bold text-green-600">
            {metrics ? metrics.meanAbsoluteError.toFixed(3) : '-'}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Expert Adjustment Rate</h3>
          <p className="text-3xl font-bold text-purple-600">
            {metrics ? `${(metrics.expertAdjustmentRate * 100).toFixed(1)}%` : '-'}
          </p>
        </div>
      </div>

      <div className="h-[400px]">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
} 