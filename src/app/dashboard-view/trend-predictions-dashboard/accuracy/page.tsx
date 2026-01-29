'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PredictionAccuracyPage() {
  const router = useRouter();
  
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard-view/trend-predictions-dashboard')} 
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Prediction Accuracy</h1>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Accuracy Metrics</h2>
        <p className="text-gray-600 mb-6">
          Track the accuracy of trend predictions and analyze historical accuracy data.
          This page will show detailed metrics about prediction performance.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg text-green-800">82%</h3>
            <p className="text-green-600">Overall Accuracy</p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg text-blue-800">+14%</h3>
            <p className="text-blue-600">Expert Impact</p>
          </div>
          
          <div className="bg-amber-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg text-amber-800">156</h3>
            <p className="text-amber-600">Adjustments Applied</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">
            Detailed charts and visualizations will appear here when data is loaded.
          </p>
        </div>
      </div>
    </div>
  );
} 