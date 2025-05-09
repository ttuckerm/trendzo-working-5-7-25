'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';

/**
 * Simple Expert Performance Dashboard Component
 * 
 * This is a streamlined version of the ExpertPerformanceDashboard component
 * that doesn't rely on potentially problematic UI component imports.
 * It uses basic HTML and CSS for maximum compatibility.
 */
export default function SimpleExpertPerformanceDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Mock data to display in the dashboard
  const expertData = {
    name: 'Expert User',
    reliabilityScore: 79.3,
    totalAdjustments: 124,
    successfulAdjustments: 98,
    successRate: 79,
    averageImpact: 23.5,
    specializations: [
      { name: 'Content Strategy', score: 86.8 },
      { name: 'Audience Targeting', score: 73.8 },
      { name: 'Growth Metrics', score: 57.1 }
    ],
    recentActivity: [
      { 
        type: 'adjustment', 
        description: 'Adjusted growth rate from 4.2 to 5.7',
        time: '30 minutes ago'
      },
      { 
        type: 'verification', 
        description: 'Verification: accurate (21% improvement)',
        time: '3 hours ago'
      },
      { 
        type: 'review', 
        description: 'Reviewed template prediction model',
        time: '1 day ago'
      }
    ]
  };
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold">Expert Performance Metrics</h2>
          <p className="text-gray-600">Your expertise impact on trend predictions</p>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          Reliability Score: {expertData.reliabilityScore}%
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium text-gray-700">Total Adjustments</h3>
          <p className="text-2xl font-bold mt-1">{expertData.totalAdjustments}</p>
          <p className="text-sm text-gray-500 mt-1">Across all categories</p>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium text-gray-700">Success Rate</h3>
          <p className="text-2xl font-bold mt-1">{expertData.successRate}%</p>
          <p className="text-sm text-gray-500 mt-1">{expertData.successfulAdjustments} successful adjustments</p>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium text-gray-700">Average Impact</h3>
          <p className="text-2xl font-bold mt-1">+{expertData.averageImpact}%</p>
          <p className="text-sm text-gray-500 mt-1">Improvement over baseline</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium mb-3">Top Specializations</h3>
          <div className="space-y-3">
            {expertData.specializations.map((spec, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <span>{spec.name}</span>
                  <span className="font-medium">{spec.score}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-2 bg-blue-600 rounded-full"
                    style={{ width: `${spec.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {expertData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                  {activity.type === 'adjustment' && (
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                  )}
                  {activity.type === 'verification' && (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  )}
                  {activity.type === 'review' && (
                    <RefreshCw className="h-3 w-3 text-purple-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 